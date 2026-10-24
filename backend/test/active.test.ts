import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { Engine } from '../src/engine.js';
import { MemoryStore } from '../src/store.js';
import { DEMO_USER_ID } from '../src/seed.js';
import { buildBreak, buildTravelWarmup } from '../src/routine.js';
import { toneViolations } from '../src/tone.js';

const u = `/api/users/${DEMO_USER_ID}`;
const send = (method: string, body: unknown) => ({ method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

async function setup(now: string) {
  const app = createApp(new Engine({ store: new MemoryStore() }), {});
  const call = async (path: string, body: unknown = {}, method = 'POST') =>
    (await app.request(path, method === 'GET' ? undefined : send(method, body))).json<any>();
  await call('/api/demo/reset');
  await call('/api/demo/clock', { now });
  const say = async (text: string) => (await call(`${u}/messages`, { text })).replies as any[];
  return { call, say };
}

describe('calentar en el camino', () => {
  it('el plan camina y termina trotando suave según el tiempo libre', () => {
    expect(buildTravelWarmup(20)).toMatchObject({ walkMin: 14, jogMin: 6 });
    expect(buildTravelWarmup(12).jogMin).toBeGreaterThan(0);
    expect(buildTravelWarmup(8)).toMatchObject({ walkMin: 8, jogMin: 0 });
    expect(buildTravelWarmup(60).walkMin + buildTravelWarmup(60).jogMin).toBe(20);
  });

  it('la hora y la pregunta de calentamiento en el mismo mensaje: agenda y responde las dos cosas', async () => {
    const { call, say } = await setup('2026-10-23T20:27:00.000Z');
    await say('/start');
    await call(`${u}/messages`, { action: 'other_hour' });
    const r = await say('el dia jueves a las 20:30 debido a unas reuniones importantes con los clientes, me ire caminando para el gym que me recomiendas hacer para calentar?');
    expect(r[0].text).toMatch(/Listo: jueves 29 a las 20:30/);
    const tip = r.find((m) => /Camina a paso ligero/.test(m.text));
    expect(tip).toBeTruthy();
    expect(tip.text).toMatch(/Trota suave/);
    expect(toneViolations(tip.text)).toEqual([]);
  });

  it('una pregunta suelta de calentamiento se responde sin mover nada', async () => {
    const { call, say } = await setup('2026-10-23T20:27:00.000Z');
    const cap = await call(`${u}/weekly-capture`);
    await call(`${u}/messages`, { action: cap.replies[0].buttons[1].action });
    const before = (await call(`${u}/appointments`, {}, 'GET')).appointments.at(-1).startsAt;
    const r = await say('¿qué me recomiendas para calentar antes de llegar?');
    expect(r[0].text).toMatch(/Para llegar con el cuerpo listo/);
    expect((await call(`${u}/appointments`, {}, 'GET')).appointments.at(-1).startsAt).toBe(before);
  });

  it('R4: con pausa por dolor el recordatorio no trae el calentamiento', async () => {
    const { call, say } = await setup('2026-10-25T23:00:00.000Z');
    const cap = await call(`${u}/weekly-capture`);
    await call(`${u}/messages`, { action: cap.replies[0].buttons[0].action });
    await say('me duele la rodilla');
    await call('/api/demo/clock', { preset: 'monday-1830' });
    const rem = await call(`${u}/reminder`);
    expect(rem.replies.some((m: any) => /Camina a paso ligero/.test(m.text))).toBe(false);
  });
});

describe('pausa activa en un tiempo muerto', () => {
  it('buildBreak arma 3 o 5 movimientos según el rato libre', () => {
    expect(buildBreak(9)).toBeNull();
    expect(buildBreak(10)).toHaveLength(3);
    expect(buildBreak(30)).toHaveLength(5);
  });

  it('entre dos reuniones del día de gimnasio, el agente propone una pausa activa una sola vez', async () => {
    const { call } = await setup('2026-10-25T23:00:00.000Z'); // domingo 20:00
    const cap = await call(`${u}/weekly-capture`);
    await call(`${u}/messages`, { action: cap.replies[0].buttons[0].action }); // lunes 26 19:15
    await call(`${u}/busy`, {
      weekOf: '2026-10-26',
      intervals: [
        { start: '2026-10-26T10:00:00-03:00', end: '2026-10-26T12:00:00-03:00' },
        { start: '2026-10-26T12:30:00-03:00', end: '2026-10-26T15:00:00-03:00' },
      ],
    });
    await call('/api/demo/clock', { now: '2026-10-26T15:02:00.000Z' });
    const first = await call('/api/jobs/tick', {});
    expect(first.actions.some((a: any) => a.action === 'micro_break')).toBe(true);
    const msgs = (await call(`${u}/messages`, {}, 'GET')).messages.filter((m: any) => m.dir === 'out');
    expect(msgs.at(-1).text).toMatch(/pausa activa/);
    expect(toneViolations(msgs.at(-1).text)).toEqual([]);
    const second = await call('/api/jobs/tick', {});
    expect(second.actions.some((a: any) => a.action === 'micro_break')).toBe(false);
  });
});

describe('recomendar hora con lo que ella cuenta (reunión que se alarga + trayecto)', () => {
  const text =
    'que horas tenemos agendadas actualmente en mi calendario? tengo una reunion el jueves a las 7 de la tarde lo mas probable es que se alargue, que hora me recomiendas para ir al gym? el gym me queda a 20 minutos caminando y si troto seran unos 15 , que me recomiendas?';

  it('no agenda a la hora de la reunión: cuenta el calendario y propone opciones que calzan', async () => {
    const { call, say } = await setup('2026-10-23T20:27:00.000Z');
    await call(`${u}/weekly-capture`); // la captura queda abierta, como en el chat real
    const r = await say(text);
    expect(r.some((m) => /^Listo:/.test(m.text))).toBe(false);
    const advice = r.at(-1);
    expect(advice.text).toMatch(/Tu reunión del jueves 29 parte a las 19:00/);
    expect(advice.text).toMatch(/la cuento hasta las 20:30/);
    expect(advice.text).toMatch(/20 min caminando, 15 si vas trotando/);
    expect(advice.buttons.some((b: any) => b.action.startsWith('slot:'))).toBe(true);
    // ninguna opción cae en el jueves de la reunión
    for (const b of advice.buttons.filter((x: any) => x.action.startsWith('slot:'))) {
      expect(b.label).not.toMatch(/jueves 29/);
    }
    const me = (await call(u, {}, 'GET')).user;
    expect(me.commute).toEqual({ walkMin: 20, jogMin: 15 });
    const appts = (await call(`${u}/appointments`, {}, 'GET')).appointments;
    expect(appts.at(-1).status).toBe('proposed');
  });

  it('el calentamiento usa su trayecto: sale con anticipación, camina y trota un tramo', async () => {
    const { call, say } = await setup('2026-10-25T23:00:00.000Z');
    await say(text);
    const cap = await call(`${u}/weekly-capture`);
    await call(`${u}/messages`, { action: cap.replies[0].buttons[0].action });
    await call('/api/demo/clock', { preset: 'monday-1830' });
    const rem = await call(`${u}/reminder`);
    const tip = rem.replies.find((m: any) => /Para llegar con el cuerpo listo/.test(m.text));
    expect(tip.text).toMatch(/Sal 19 min antes de tu cita/);
    expect(tip.text).toMatch(/Camina a paso ligero 14 min/);
    expect(tip.text).toMatch(/Trota suave los últimos 5 min/);
  });

  it('"agéndame el martes" no se confunde con preguntar por el calendario', async () => {
    const { say } = await setup('2026-10-23T20:27:00.000Z');
    const r = await say('quiero que quede agendada la cita el martes a las 20:30');
    expect(r[0].text).not.toMatch(/Tu reunión|veo en tu calendario/);
  });
});

describe('preguntas por lo que hay en el calendario', () => {
  const asks = [
    'Cuales son las actividades que tengo en la semana?',
    '¿qué reuniones tengo mañana?',
    'que tengo el jueves?',
    'muéstrame mi agenda',
    'cuál es mi agenda de hoy',
  ];
  it('se reconocen sin confundirse con otras cosas', async () => {
    const { classifyByRules } = await import('../src/intent.js');
    for (const q of asks) expect(classifyByRules(q), q).toBe('schedule');
    expect(classifyByRules('que ejercicios hago hoy?')).not.toBe('schedule');
    expect(classifyByRules('quiero que quede agendada la cita el martes a las 20:30')).not.toBe('schedule');
    expect(classifyByRules('mueve')).toBe('move');
  });

  it('responde con el calendario y no agenda ni mueve nada', async () => {
    const { call, say } = await setup('2026-10-23T20:27:00.000Z');
    const cap = await call(`${u}/weekly-capture`);
    await call(`${u}/messages`, { action: cap.replies[0].buttons[0].action });
    const before = (await call(`${u}/appointments`, {}, 'GET')).appointments.at(-1).startsAt;
    const r = await say('Cuales son las actividades que tengo en la semana?');
    expect(r[0].text).toMatch(/Tu cita contigo|No veo nada agendado/);
    expect((await call(`${u}/appointments`, {}, 'GET')).appointments.at(-1).startsAt).toBe(before);
  });
});
