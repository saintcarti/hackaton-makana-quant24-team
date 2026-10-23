import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { Engine } from '../src/engine.js';
import { MemoryStore } from '../src/store.js';
import { DEMO_USER_ID } from '../src/seed.js';
import { parseClock, parseWhen } from '../src/slots.js';
import { classifyByRules, toWhenGuess } from '../src/intent.js';
import type { LlmParser } from '../src/intent.js';
import type { User } from '../src/types.js';

const u = `/api/users/${DEMO_USER_ID}`;
const send = (method: string, body: unknown) => ({ method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

async function setup(now: string, parser?: LlmParser) {
  const app = createApp(new Engine({ store: new MemoryStore(), parser }), {});
  const call = async (path: string, body: unknown = {}, method = 'POST') =>
    (await app.request(path, method === 'GET' ? undefined : send(method, body))).json<any>();
  await call('/api/demo/reset');
  await call('/api/demo/clock', { now });
  const appts = async () => (await call(`${u}/appointments`, {}, 'GET')).appointments as any[];
  const say = async (text: string) => (await call(`${u}/messages`, { text })).replies as any[];
  return { call, appts, say };
}

const user = { preferredTime: '19:15', window: { start: '19:00', end: '21:00' } } as User;
// viernes 23-oct-2026, 17:27 en Santiago (UTC-3)
const FRI_1727 = '2026-10-23T20:27:00.000Z';

describe('hora en texto libre', () => {
  it('elige la hora destino, no la que no puede', () => {
    expect(parseClock('la cita del lunes a las 19:15 tendremos que cambiarla para las 20:00 por el tráfico')).toEqual({ hour: 20, minute: 0 });
    expect(parseClock('viernes a las 8 podria')).toEqual({ hour: 20, minute: 0 });
  });

  it('ignora la cláusula del motivo', () => {
    const d = parseWhen('viernes a las 8 podria, debido a que hoy viernes a las 19:15 estare con una reunion con cliente', new Date(FRI_1727), user)!;
    expect(d.toISOString()).toBe('2026-10-23T23:00:00.000Z'); // viernes 20:00 local
  });

  it('un día nombrado manda sobre "hoy"', () => {
    const d = parseWhen('hoy no puedo, mejor el miércoles a las 20:00', new Date(FRI_1727), user)!;
    expect(d.toISOString()).toBe('2026-10-28T23:00:00.000Z');
  });

  it('"hoy no puedo" no trae una hora nueva', () => {
    expect(parseWhen('hoy no puedo', new Date(FRI_1727), user, { requireExplicit: true })).toBeNull();
  });

  it('entiende los verbos de reagendar y las preguntas por músculos', () => {
    expect(classifyByRules('reagendamelo por favor')).toBe('move');
    expect(classifyByRules('tendremos que cambiarla para las 20:00')).toBe('move');
    expect(classifyByRules('que musculos trabajare el lunes?')).toBe('routine');
  });

  it('lee el JSON del modelo y descarta lo inválido', () => {
    expect(toWhenGuess('{"date":"2026-10-26","time":"20:00"}')).toEqual({ date: '2026-10-26', time: '20:00' });
    expect(toWhenGuess('<think>mm</think> {"date":null,"time":"25:99"}')).toBeNull();
    expect(toWhenGuess('no sé')).toBeNull();
  });
});

describe('conversación (la de Telegram que falló)', () => {
  it('"Otra hora" + explicación con dos horas agenda la pedida', async () => {
    const { call, appts, say } = await setup(FRI_1727);
    await say('Proponme horarios');
    await call(`${u}/messages`, { action: 'other_hour' });
    const r = await say('viernes a las 8 podria, debido a que hoy viernes a las 19:15 estare con una reunion con cliente presencial');
    expect(r[0].text).toMatch(/Listo/);
    expect((await appts()).at(-1).startsAt).toBe('2026-10-23T23:00:00.000Z');
  });

  it('"reagenda viernes 23 a las 20:00" con propuesta abierta agenda esa hora', async () => {
    const { appts, say } = await setup(FRI_1727);
    await say('Proponme horarios');
    await say('la reunion de hoy se alargo, reagenda viernes 23 a las 20:00');
    expect((await appts()).at(-1).startsAt).toBe('2026-10-23T23:00:00.000Z');
  });

  it('una pregunta por los músculos no mueve la cita y responde la rutina', async () => {
    const { call, appts, say } = await setup(FRI_1727);
    await call(`${u}/preferences`, { split: { id: 'ppl', sessions: 3 } }, 'PATCH');
    const cap = await call(`${u}/weekly-capture`);
    await call(`${u}/messages`, { action: cap.replies[0].buttons[1].action }); // lunes
    const before = (await appts()).at(-1).startsAt;
    const r = await say('que musculos trabajare el lunes?');
    expect(r[0].text).toMatch(/Calentamiento/);
    expect(r[0].text).not.toMatch(/^Listo:/);
    expect((await appts()).at(-1).startsAt).toBe(before);
  });

  it('"cámbiala para las 20:00 debido a locomoción" mueve a las 20:00, no a las 19:15', async () => {
    const { call, appts, say } = await setup(FRI_1727);
    const cap = await call(`${u}/weekly-capture`);
    await call(`${u}/messages`, { action: cap.replies[0].buttons[1].action }); // lunes 26 19:15
    await say('la cita del dia lunes a las 19:15 tendremos que cambiarla para las 20:00 debido a retraso con locomocion');
    expect((await appts()).at(-1).startsAt).toBe('2026-10-26T23:00:00.000Z');
  });

  it('si las reglas no entienden, el modelo extrae el día y la hora (sin redactar nada)', async () => {
    const parser = {
      classify: async () => null,
      extractWhen: async () => ({ date: '2026-10-26', time: '20:00' }),
    } as LlmParser;
    const { call, appts, say } = await setup(FRI_1727, parser);
    await say('Proponme horarios');
    await call(`${u}/messages`, { action: 'other_hour' });
    const r = await say('mejor pasado el fin de semana, ya en la noche');
    expect(r[0].text).toMatch(/Listo/);
    expect((await appts()).at(-1).startsAt).toBe('2026-10-26T23:00:00.000Z');
  });
});

describe('el agente elige split y duración (pedido §6)', () => {
  const sunday = '2026-10-25T23:00:00.000Z';

  it('3 veces por semana con la semana libre: PPL de 40 min', async () => {
    const { call } = await setup(sunday);
    await call(`${u}/preferences`, { perWeek: 3 }, 'PATCH');
    const cap = await call(`${u}/weekly-capture`);
    expect(cap.replies[0].text).toContain('40 minutos');
    expect(cap.appointment.durationMin).toBe(40);
    const me = (await call(u, {}, 'GET')).user;
    expect(me.split).toEqual({ id: 'ppl', sessions: 3 });
    expect(me.sessionMin).toBe(40);
  });

  it('1 vez por semana: Full body de 60 min', async () => {
    const { call } = await setup(sunday);
    await call(`${u}/preferences`, { perWeek: 1 }, 'PATCH');
    const cap = await call(`${u}/weekly-capture`);
    expect(cap.replies[0].text).toContain('60 minutos');
    expect((await call(u, {}, 'GET')).user.split).toEqual({ id: 'fullbody', sessions: 1 });
  });

  it('con autoPlan: false respeta lo que ella fijó', async () => {
    const { call } = await setup(sunday);
    await call(`${u}/preferences`, { perWeek: 1, autoPlan: false, split: { id: 'ppl', sessions: 3 }, sessionMin: 30 }, 'PATCH');
    const cap = await call(`${u}/weekly-capture`);
    expect(cap.replies[0].text).toContain('30 minutos');
    expect((await call(u, {}, 'GET')).user.split).toEqual({ id: 'ppl', sessions: 3 });
  });

  it('sin perWeek no cambia nada (comportamiento anterior)', async () => {
    const { call } = await setup(sunday);
    const cap = await call(`${u}/weekly-capture`);
    expect(cap.replies[0].text).toContain('40 minutos');
    expect((await call(u, {}, 'GET')).user.split).toBeUndefined();
  });
});
