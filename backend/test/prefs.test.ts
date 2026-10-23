import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { Engine } from '../src/engine.js';
import { MemoryStore } from '../src/store.js';
import { DEMO_USER_ID } from '../src/seed.js';

const send = (method: string, body: unknown) => ({
  method,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

async function setup() {
  const app = createApp(new Engine({ store: new MemoryStore() }), {});
  await app.request('/api/demo/reset', send('POST', {}));
  await app.request('/api/demo/clock', send('POST', { preset: 'sunday-20' }));
  return app;
}

const capture = async (app: Awaited<ReturnType<typeof setup>>) =>
  (await (await app.request(`/api/users/${DEMO_USER_ID}/weekly-capture`, send('POST', {}))).json<any>()).appointment;

describe('reglas de la sesión (PATCH /preferences)', () => {
  it('guarda las reglas y devuelve el usuario', async () => {
    const app = await setup();
    const res = await app.request(
      `/api/users/${DEMO_USER_ID}/preferences`,
      send('PATCH', { gymHours: { open: '06:00', close: '22:00' }, sessionMin: 60, perWeek: 2, days: [4, 2] }),
    );
    expect(res.status).toBe(200);
    const { user } = await res.json<any>();
    expect(user.sessionMin).toBe(60);
    expect(user.days).toEqual([2, 4]);
    expect(user.gymHours).toEqual({ open: '06:00', close: '22:00' });
  });

  it('el agente propone solo en los días elegidos y con la duración elegida', async () => {
    const app = await setup();
    await app.request(`/api/users/${DEMO_USER_ID}/preferences`, send('PATCH', { sessionMin: 60, days: [2, 4] }));
    const appt = await capture(app);
    expect(appt.durationMin).toBe(60);
    for (const iso of appt.options as string[]) {
      const wd = new Date(iso).toLocaleDateString('en-US', { weekday: 'short', timeZone: 'America/Santiago' });
      expect(['Tue', 'Thu']).toContain(wd);
    }
  });

  it('una sesión que no cabe en el horario del gym no se propone', async () => {
    const app = await setup();
    await app.request(`/api/users/${DEMO_USER_ID}/preferences`, send('PATCH', { gymHours: { open: '06:00', close: '19:30' }, sessionMin: 60 }));
    const res = await app.request(`/api/users/${DEMO_USER_ID}/weekly-capture`, send('POST', {}));
    // la ventana 19:00–21:00 ∩ gym 06:00–19:30 no deja espacio para 60 min
    expect(res.status).toBe(409);
  });

  it('rechaza valores inválidos', async () => {
    const app = await setup();
    expect((await app.request(`/api/users/${DEMO_USER_ID}/preferences`, send('PATCH', { sessionMin: 45 }))).status).toBe(400);
    expect((await app.request(`/api/users/${DEMO_USER_ID}/preferences`, send('PATCH', { gymHours: { open: '22:00', close: '06:00' } }))).status).toBe(400);
  });
});

describe('disponibilidad informada por el front (POST /busy)', () => {
  it('el agente esquiva los bloques ocupados', async () => {
    const app = await setup();
    const first = (await capture(app)).options[0] as string;
    const start = Date.parse(first);
    const res = await app.request(
      `/api/users/${DEMO_USER_ID}/busy`,
      send('POST', { weekOf: '2026-10-26', intervals: [{ start: new Date(start - 30 * 60000).toISOString(), end: new Date(start + 30 * 60000).toISOString() }] }),
    );
    expect(res.status).toBe(200);
    const again = (await capture(app)).options[0] as string;
    expect(again).not.toBe(first);
    expect(Date.parse(again)).toBeGreaterThanOrEqual(start + 30 * 60000);
  });

  it('es idempotente: la lista vacía limpia la semana', async () => {
    const app = await setup();
    const first = (await capture(app)).options[0] as string;
    const start = Date.parse(first);
    const block = [{ start: new Date(start).toISOString(), end: new Date(start + 40 * 60000).toISOString() }];
    await app.request(`/api/users/${DEMO_USER_ID}/busy`, send('POST', { weekOf: '2026-10-26', intervals: block }));
    await app.request(`/api/users/${DEMO_USER_ID}/busy`, send('POST', { weekOf: '2026-10-26', intervals: [] }));
    expect((await capture(app)).options[0]).toBe(first);
  });
});
