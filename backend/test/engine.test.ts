import { beforeEach, describe, expect, it } from 'vitest';
import { Engine } from '../src/engine.js';
import { MemoryStore } from '../src/store.js';
import { toneViolations } from '../src/tone.js';
import { zonedToUtc } from '../src/time.js';
import { parseWhen } from '../src/slots.js';
import { classifyByRules } from '../src/intent.js';
import { buildIcs } from '../src/ics.js';
import { freshDB, DEMO_USER_ID } from '../src/seed.js';
import { metrics, userSummary } from '../src/views.js';

// Domingo 25-oct-2026 20:00 en Santiago (UTC-3)
const SUNDAY_20 = zonedToUtc(2026, 10, 25, 20, 0);

async function setup() {
  const engine = new Engine({ store: new MemoryStore() });
  await engine.run((c) => {
    engine.setClock(c, SUNDAY_20);
    engine.createUser(c, { id: 'u1' });
  });
  const clock = (d: Date) => engine.run((c) => engine.setClock(c, d));
  return { engine, clock };
}

describe('tiempo', () => {
  it('convierte hora de Santiago a UTC (UTC-3 en octubre)', () => {
    expect(zonedToUtc(2026, 10, 26, 19, 15).toISOString()).toBe('2026-10-26T22:15:00.000Z');
  });
});

describe('intents y parseo', () => {
  it('detecta dolor con prioridad', () => {
    expect(classifyByRules('me duele la espalda, no puedo ir')).toBe('pain');
  });
  it('detecta mueve / listo', () => {
    expect(classifyByRules('hoy no puedo, se alargó la junta')).toBe('move');
    expect(classifyByRules('listo, ya fui')).toBe('done');
    expect(classifyByRules('esta semana no')).toBe('skip_week');
  });
  it('parsea "martes 20:30"', () => {
    const user = { preferredTime: '19:15' } as any;
    const d = parseWhen('martes 20:30', SUNDAY_20, user)!;
    expect(d.toISOString()).toBe('2026-10-27T23:30:00.000Z');
  });
});

describe('flujo La Cita', () => {
  let ctx: Awaited<ReturnType<typeof setup>>;
  beforeEach(async () => {
    ctx = await setup();
  });

  it('captura dominical -> elegir -> recordatorio -> listo con sunk cost', async () => {
    const { engine, clock } = ctx;
    const capture = await engine.run((c) => engine.startCapture(c, 'u1'));
    expect(capture.options).toHaveLength(2);
    // lunes y miércoles a las 19:15 (martes/jueves descartados)
    expect(capture.options[0]).toBe('2026-10-26T22:15:00.000Z');
    expect(capture.options[1]).toBe('2026-10-28T22:15:00.000Z');

    const replies = await engine.run((c) =>
      engine.handleInbound(c, 'u1', { action: `slot:${capture.id}:${capture.options[0]}` }),
    );
    expect(replies[0]!.attachment?.kind).toBe('ics');

    // Lunes 18:30 -> tick manda un único recordatorio
    await clock(zonedToUtc(2026, 10, 26, 18, 30));
    const actions = await engine.run((c) => engine.tick(c));
    expect(actions.map((a) => a.action)).toContain('reminder_sent');
    const again = await engine.run((c) => engine.tick(c));
    expect(again.filter((a) => a.action === 'reminder_sent')).toHaveLength(0);

    const done = await engine.run((c) => engine.handleInbound(c, 'u1', { text: 'listo' }));
    expect(done[0]!.text).toContain('$11.633');
    expect(done[0]!.text).toContain('$34.900');
  });

  it('el silencio también agenda (opt-out)', async () => {
    const { engine, clock } = ctx;
    await engine.run((c) => engine.startCapture(c, 'u1'));
    await clock(new Date(SUNDAY_20.getTime() + 151 * 60000));
    const actions = await engine.run((c) => engine.tick(c));
    expect(actions.map((a) => a.action)).toContain('default_applied');
    const appts = await engine.read((c) => Object.values(c.db.appointments));
    expect(appts[0]!.status).toBe('confirmed');
    expect(appts[0]!.source).toBe('default');
  });

  it('MUEVE mueve (no borra) y tras 2 MUEVEs seguidos abre re-negociación', async () => {
    const { engine } = ctx;
    const capture = await engine.run((c) => engine.startCapture(c, 'u1'));
    await engine.run((c) => engine.chooseSlot(c, 'u1', capture.id, capture.options[0]!));

    const r1 = await engine.run((c) => engine.handleInbound(c, 'u1', { text: 'hoy no puedo, se alargó la reunión' }));
    expect(r1[0]!.text).toContain('Mover no es fallar');
    await engine.run((c) => engine.handleInbound(c, 'u1', { action: 'move' }));
    const r3 = await engine.run((c) => engine.handleInbound(c, 'u1', { action: 'move' }));
    expect(r3[0]!.text).toContain('no te está resultando');
    expect(r3[0]!.buttons!.some((b) => b.action.startsWith('slot:'))).toBe(true);

    const appts = await engine.read((c) => Object.values(c.db.appointments));
    expect(appts).toHaveLength(1); // la cita se mueve, jamás se borra
    expect(appts[0]!.moves).toHaveLength(2);
  });

  it('texto libre con hora reubica la cita', async () => {
    const { engine } = ctx;
    const capture = await engine.run((c) => engine.startCapture(c, 'u1'));
    const r = await engine.run((c) => engine.handleInbound(c, 'u1', { text: 'martes 20:30' }));
    expect(r[0]!.text).toContain('martes 27');
    const a = await engine.read((c) => c.db.appointments[capture.id]!);
    expect(a.status).toBe('confirmed');
    expect(a.startsAt).toBe('2026-10-27T23:30:00.000Z');
  });

  it('dolor deriva a profesional y no prescribe', async () => {
    const { engine } = ctx;
    const r = await engine.run((c) => engine.handleInbound(c, 'u1', { text: 'me duele la espalda' }));
    expect(r[0]!.text).toContain('kinesiólogo');
    expect(r[0]!.text).not.toMatch(/estir|ejercicio para/i);
  });

  it('"esta semana no" no es una falla', async () => {
    const { engine } = ctx;
    const capture = await engine.run((c) => engine.startCapture(c, 'u1'));
    await engine.run((c) => engine.handleInbound(c, 'u1', { action: 'skip_week' }));
    const a = await engine.read((c) => c.db.appointments[capture.id]!);
    expect(a.status).toBe('skipped');
  });

  it('cierra citas pasadas en silencio (lapsed) sin mensaje', async () => {
    const { engine, clock } = ctx;
    const capture = await engine.run((c) => engine.startCapture(c, 'u1'));
    await engine.run((c) => engine.chooseSlot(c, 'u1', capture.id, capture.options[0]!));
    await clock(zonedToUtc(2026, 10, 27, 12, 0));
    const before = await engine.read((c) => c.db.messages.length);
    await engine.run((c) => engine.tick(c));
    const after = await engine.read((c) => c.db.messages.length);
    expect(after).toBe(before);
  });

  it('todos los mensajes salientes cumplen el tono cero-culpa', async () => {
    const { engine } = ctx;
    const capture = await engine.run((c) => engine.startCapture(c, 'u1'));
    await engine.run((c) => engine.chooseSlot(c, 'u1', capture.id, capture.options[0]!));
    for (const text of ['hoy no puedo', 'mueve', 'mueve', 'me da vergüenza el gym', 'qué onda', 'listo', 'me duele la rodilla']) {
      await engine.run((c) => engine.handleInbound(c, 'u1', { text }));
    }
    await engine.run((c) => engine.sendReminder(c, 'u1', capture.id));
    const msgs = await engine.read((c) => c.db.messages.filter((m) => m.dir === 'out'));
    expect(msgs.length).toBeGreaterThan(8);
    for (const m of msgs) {
      expect(toneViolations(m.text), m.text).toEqual([]);
      for (const b of m.buttons ?? []) expect(toneViolations(b.label), b.label).toEqual([]);
    }
  });
});

describe('.ics', () => {
  it('genera un VEVENT válido en UTC', async () => {
    const { engine } = await setup();
    const capture = await engine.run((c) => engine.startCapture(c, 'u1'));
    await engine.run((c) => engine.chooseSlot(c, 'u1', capture.id, capture.options[0]!));
    const { a, u } = await engine.read((c) => ({ a: c.db.appointments[capture.id]!, u: c.db.users['u1']! }));
    const ics = buildIcs(a, u, SUNDAY_20);
    expect(ics).toContain('BEGIN:VEVENT');
    expect(ics).toContain('DTSTART:20261026T221500Z');
    expect(ics).toContain('DTEND:20261026T225500Z');
    expect(ics).toContain('\r\n');
  });
});

describe('Camila sintética', () => {
  it('11 visitas, 4 movidas, 0 cadenas rotas', () => {
    const db = freshDB(SUNDAY_20);
    const user = db.users[DEMO_USER_ID]!;
    const s = userSummary(db, user, SUNDAY_20);
    expect(s.visitsLast6Weeks).toBe(11);
    expect(s.movesTotal).toBe(4);
    expect(s.brokenChains).toBe(0);
    expect(s.weeklyVisits).toHaveLength(7);
    expect(Object.keys(s)).not.toContain('streak');
  });
  it('las métricas excluyen el seed', () => {
    const m = metrics(freshDB(SUNDAY_20));
    expect(m.h1_captureToAppointment.sent).toBe(0);
  });
});
