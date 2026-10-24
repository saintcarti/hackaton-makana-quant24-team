import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { Engine } from '../src/engine.js';
import { MemoryStore } from '../src/store.js';
import { DEMO_USER_ID } from '../src/seed.js';
import { buildRoutine, exerciseMinutes, WARMUP_MIN } from '../src/routine.js';
import { MUSCLE_GROUPS } from '../src/splits.js';
import { toneViolations } from '../src/tone.js';

const u = `/api/users/${DEMO_USER_ID}`;
const send = (method: string, body: unknown) => ({
  method,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

async function setup() {
  const app = createApp(new Engine({ store: new MemoryStore() }), {});
  const call = async (path: string, body: unknown = {}, method = 'POST') =>
    (await app.request(path, method === 'GET' ? undefined : send(method, body))).json<any>();
  await call('/api/demo/reset');
  await call('/api/demo/clock', { preset: 'sunday-20' });
  return { app, call };
}

const book = async (call: Awaited<ReturnType<typeof setup>>['call']) => {
  const cap = await call(`${u}/weekly-capture`);
  await call(`${u}/messages`, { action: cap.replies[0].buttons[0].action });
  return (await call(`${u}/appointments`, {}, 'GET')).appointments.at(-1);
};

describe('buildRoutine', () => {
  it('cabe en el tiempo: calentamiento + ejercicios <= minutos', () => {
    for (const minutes of [20, 30, 40, 50, 60]) {
      const r = buildRoutine(minutes, MUSCLE_GROUPS)!;
      expect(r).not.toBeNull();
      const used = WARMUP_MIN + r.items.reduce((n, i) => n + Math.ceil(i.sets * 1.75), 0);
      expect(used).toBeLessThanOrEqual(minutes);
    }
  });

  it('con más tiempo hay más ejercicios y con menos de 20 min no hay rutina', () => {
    expect(buildRoutine(60, MUSCLE_GROUPS)!.items.length).toBeGreaterThan(buildRoutine(30, MUSCLE_GROUPS)!.items.length);
    expect(buildRoutine(15, MUSCLE_GROUPS)).toBeNull();
  });

  it('solo trabaja los grupos del foco y rota variantes entre semanas', () => {
    const a = buildRoutine(40, ['espalda', 'biceps'], 0)!;
    const b = buildRoutine(40, ['espalda', 'biceps'], 1)!;
    expect(a.items.every((i) => ['espalda', 'biceps'].includes(i.group))).toBe(true);
    expect(a.items.map((i) => i.exerciseId)).not.toEqual(b.items.map((i) => i.exerciseId));
  });

  it('cada ejercicio tiene un costo en minutos coherente', () => {
    expect(exerciseMinutes({ sets: 3 } as any)).toBe(6);
  });
});

describe('rutina según el tiempo libre del calendario', () => {
  it('con el día libre, la rutina usa la duración elegida y respeta el foco', async () => {
    const { call } = await setup();
    await call(`${u}/preferences`, { split: { id: 'ppl', sessions: 3 }, sessionMin: 50 }, 'PATCH');
    const appt = await book(call);
    expect(appt.durationMin).toBe(50);
    expect(appt.routine.minutes).toBe(50);
    expect(appt.routine.items.every((i: any) => ['pecho', 'hombros', 'triceps'].includes(i.group))).toBe(true);
  });

  it('si una reunión corta el hueco, la sesión se acorta a lo que cabe', async () => {
    const { call } = await setup();
    const cap = await call(`${u}/weekly-capture`);
    const first = cap.replies[0].buttons[0].action as string; // slot:<id>:<iso>
    const start = Date.parse(first.split(':').slice(2).join(':'));
    // reunión que empieza 30 min después de la cita propuesta
    await call(`${u}/busy`, {
      weekOf: cap.appointment.weekOf,
      intervals: [{ start: new Date(start + 30 * 60000).toISOString(), end: new Date(start + 90 * 60000).toISOString() }],
    });
    await call(`${u}/messages`, { action: first });
    const appt = (await call(`${u}/appointments`, {}, 'GET')).appointments.at(-1);
    expect(appt.durationMin).toBeLessThanOrEqual(30);
    expect(appt.routine.minutes).toBe(appt.durationMin);
  });

  it('el recordatorio manda la rutina y "qué toca" la repite, con tono cero-culpa', async () => {
    const { call } = await setup();
    await book(call);
    await call('/api/demo/clock', { preset: 'monday-1830' });
    const rem = await call(`${u}/reminder`);
    expect(rem.replies).toHaveLength(3); // recordatorio, rutina y calentamiento en camino
    const text = rem.replies[1].text as string;
    expect(text).toMatch(/Calentamiento/);
    expect(toneViolations(text)).toEqual([]);
    const again = await call(`${u}/messages`, { text: 'qué toca hoy' });
    expect(again.replies[0].text).toMatch(/Calentamiento/);
  });

  it('R4: con dolor no hay rutina hasta que lo conversa con un profesional', async () => {
    const { call } = await setup();
    await book(call);
    await call(`${u}/messages`, { text: 'me duele la rodilla' });
    expect((await call(`${u}/appointments`, {}, 'GET')).appointments.at(-1).routine).toBeUndefined();
    const ask = await call(`${u}/messages`, { text: 'qué toca hoy' });
    expect(ask.replies[0].text).toMatch(/Todavía no tengo una rutina/);
    await call(`${u}/messages`, { text: 'ya lo conversé con mi kinesiólogo' });
    expect((await call(`${u}/appointments`, {}, 'GET')).appointments.at(-1).routine).toBeTruthy();
  });
});
