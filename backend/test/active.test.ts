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
