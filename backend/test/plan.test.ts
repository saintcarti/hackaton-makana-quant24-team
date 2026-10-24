import { describe, expect, it } from 'vitest';
import { Engine } from '../src/engine.js';
import { MemoryStore } from '../src/store.js';
import { localParts, zonedToUtc } from '../src/time.js';

const SUNDAY_20 = zonedToUtc(2026, 10, 25, 20, 0);

async function setup(perWeek: number, extra: Record<string, unknown> = {}) {
  const engine = new Engine({ store: new MemoryStore() });
  await engine.run((c) => {
    engine.setClock(c, SUNDAY_20);
    engine.createUser(c, { id: 'w1', name: 'Ana', channel: { type: 'web' }, synthetic: true });
    engine.setPreferences(c, 'w1', { perWeek: perWeek as any, ...(extra as any) });
  });
  return engine;
}
const appts = (e: Engine) => e.read((c) => Object.values(c.db.appointments).filter((a) => a.userId === 'w1'));
const outs = (e: Engine) => e.read((c) => c.db.messages.filter((m) => m.dir === 'out'));
const dayOf = (iso: string) => localParts(new Date(iso)).weekday;
const hourOf = (iso: string) => localParts(new Date(iso)).hour + localParts(new Date(iso)).minute / 60;

describe('de 1 a 7 sesiones por semana', () => {
  for (const n of [2, 3, 4, 5, 6, 7]) {
    it(`${n} días: propone ${n} sesiones en días distintos, dentro del horario del gym (06:00–22:00)`, async () => {
      const e = await setup(n);
      await e.run((c) => e.startCapture(c, 'w1'));
      const plan = (await appts(e)).filter((a) => a.status === 'proposed');
      expect(plan).toHaveLength(n);
      expect(new Set(plan.map((a) => dayOf(a.options[0]!))).size).toBe(n);
      for (const a of plan) {
        expect(hourOf(a.options[0]!)).toBeGreaterThanOrEqual(6);
        expect(hourOf(a.options[0]!) + 40 / 60).toBeLessThanOrEqual(22);
        expect(a.weekOf).toBe('2026-10-26');
      }
      const msg = (await outs(e)).at(-1)!;
      expect(msg.text).toMatch(new RegExp(`Ana, esta es tu semana \\(${n} sesiones`));
      expect(msg.buttons?.map((b) => b.action)).toEqual(['plan:ok', 'plan:edit', 'skip_week']);
    });
  }

  it('con pocos días, los reparte lo más separados posible', async () => {
    const e = await setup(3);
    await e.run((c) => e.startCapture(c, 'w1'));
    const days = (await appts(e)).map((a) => dayOf(a.options[0]!)).sort();
    expect(days).toEqual([1, 3, 5]); // lun, mié, vie
  });

  it('respeta los días que ella eligió', async () => {
    const e = await setup(2, { days: [2, 4] });
    await e.run((c) => e.startCapture(c, 'w1'));
    expect((await appts(e)).map((a) => dayOf(a.options[0]!)).sort()).toEqual([2, 4]);
  });

  it('confirmar agenda toda la semana, con foco y rutina en cada sesión, sin pisarse entre ellas', async () => {
    const e = await setup(4);
    await e.run((c) => e.startCapture(c, 'w1'));
    await e.run((c) => e.handleInbound(c, 'w1', { action: 'plan:ok' }));
    const list = (await appts(e)).filter((a) => a.status === 'confirmed');
    expect(list).toHaveLength(4);
    for (const a of list) {
      expect(a.focus).toBeTruthy();
      expect(a.routine).toBeTruthy();
    }
    const times = list.map((a) => Date.parse(a.startsAt!)).sort();
    for (let i = 1; i < times.length; i++) expect(times[i]! - times[i - 1]!).toBeGreaterThanOrEqual(40 * 60_000);
    // Upper/Lower: los focos alternan y los 8 grupos entran en la semana
    const groups = new Set(list.flatMap((a) => a.focus!.groups));
    expect(groups.size).toBe(8);
    expect((await outs(e)).at(-1)!.text).toMatch(/tu semana quedó agendada/);
  });

  it('7 días: los siete días tienen sesión', async () => {
    const e = await setup(7);
    await e.run((c) => e.startCapture(c, 'w1'));
    await e.run((c) => e.handleInbound(c, 'w1', { action: 'plan:ok' }));
    const list = (await appts(e)).filter((a) => a.status === 'confirmed');
    expect(new Set(list.map((a) => dayOf(a.startsAt!))).size).toBe(7);
  });

  it('puede cambiar un día con texto y vuelve a mostrar la semana', async () => {
    const e = await setup(3);
    await e.run((c) => e.startCapture(c, 'w1'));
    await e.run((c) => e.handleInbound(c, 'w1', { text: 'el miércoles a las 20:00' }));
    const wed = (await appts(e)).find((a) => dayOf(a.options[0]!) === 3)!;
    expect(hourOf(wed.options[0]!)).toBe(20);
    expect((await outs(e)).at(-1)!.text).toMatch(/esta es tu semana/);
    // un día sin sesión: pregunta cuál
    await e.run((c) => e.handleInbound(c, 'w1', { text: 'el sábado a las 10:00' }));
    expect((await outs(e)).at(-1)!.text).toMatch(/No tengo una sesión ese día/);
    // con el gym cerrado: no lo cambia
    await e.run((c) => e.handleInbound(c, 'w1', { text: 'el miércoles a las 11:30 de la noche' }));
    expect((await outs(e)).some((m) => /el gym está cerrado: abre de 06:00 a 22:00/.test(m.text))).toBe(true);
    expect(hourOf((await appts(e)).find((a) => dayOf(a.options[0]!) === 3)!.options[0]!)).toBe(20);
  });

  it('si no contesta, el silencio confirma la semana (opt-out)', async () => {
    const e = await setup(3);
    await e.run((c) => e.startCapture(c, 'w1'));
    await e.run((c) => {
      const u = c.db.users['w1']!;
      if (u.pending) u.pending = { kind: 'plan', sentAt: new Date(c.now.getTime() - 3 * 3600_000).toISOString() };
    });
    const acts = await e.run((c) => e.tick(c));
    expect(acts.some((a) => a.action === 'plan_confirmed')).toBe(true);
    expect((await appts(e)).filter((a) => a.status === 'confirmed')).toHaveLength(3);
  });

  it('«esta semana no» descarta el plan completo', async () => {
    const e = await setup(3);
    await e.run((c) => e.startCapture(c, 'w1'));
    await e.run((c) => e.handleInbound(c, 'w1', { action: 'skip_week' }));
    expect((await appts(e)).every((a) => a.status === 'skipped')).toBe(true);
  });

  it('cambiar la hora de un día ya confirmado mueve esa sesión, no la más cercana', async () => {
    const e = await setup(3);
    await e.run((c) => e.startCapture(c, 'w1'));
    await e.run((c) => e.handleInbound(c, 'w1', { action: 'plan:ok' }));
    await e.run((c) => e.handleInbound(c, 'w1', { text: 'cambia el viernes a las 20:30' }));
    const fri = (await appts(e)).find((a) => a.status === 'confirmed' && dayOf(a.startsAt!) === 5)!;
    expect(hourOf(fri.startsAt!)).toBe(20.5);
    expect((await appts(e)).filter((a) => a.status === 'confirmed')).toHaveLength(3);
  });

  it('las cuentas del simulador (la demo de Camila) siguen con una cita por semana', async () => {
    const engine = new Engine({ store: new MemoryStore() });
    await engine.run((c) => {
      engine.setClock(c, SUNDAY_20);
      engine.createUser(c, { id: 'sim1' });
      engine.setPreferences(c, 'sim1', { perWeek: 5 });
    });
    const a = await engine.run((c) => engine.startCapture(c, 'sim1'));
    expect(a.options.length).toBeGreaterThanOrEqual(2);
  });
});
