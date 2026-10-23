import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { Engine } from '../src/engine.js';
import { MemoryStore } from '../src/store.js';
import { DEMO_USER_ID } from '../src/seed.js';

const json = (body: unknown) => ({
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

function makeApp(adminToken?: string) {
  return createApp(new Engine({ store: new MemoryStore() }), { adminToken });
}

describe('API HTTP', () => {
  it('flujo completo del demo vía HTTP', async () => {
    const app = makeApp();
    expect((await app.request('/api/health')).status).toBe(200);

    const reset = await app.request('/api/demo/reset', json({}));
    expect((await reset.json()).demoUserId).toBe(DEMO_USER_ID);

    const clock = await app.request('/api/demo/clock', json({ preset: 'sunday-20' }));
    expect(clock.status).toBe(200);

    const cap = await (await app.request(`/api/users/${DEMO_USER_ID}/weekly-capture`, json({}))).json();
    expect(cap.replies[0].buttons.length).toBe(4);

    const slot = cap.replies[0].buttons[0].action as string;
    const chosen = await (await app.request(`/api/users/${DEMO_USER_ID}/messages`, json({ action: slot }))).json();
    expect(chosen.replies[0].attachment.url).toMatch(/\/ics$/);

    const ics = await app.request(chosen.replies[0].attachment.url);
    expect(ics.headers.get('content-type')).toContain('text/calendar');
    expect(await ics.text()).toContain('BEGIN:VCALENDAR');

    const moved = await (await app.request(`/api/users/${DEMO_USER_ID}/messages`, json({ text: 'hoy no puedo' }))).json();
    expect(moved.replies[0].text).toContain('Mover no es fallar');

    const msgs = await (await app.request(`/api/users/${DEMO_USER_ID}/messages?after=0`)).json();
    expect(msgs.messages.length).toBeGreaterThan(3);

    const cal = await (await app.request(`/api/users/${DEMO_USER_ID}/calendar`)).json();
    expect(cal.days).toHaveLength(7);

    const summary = await (await app.request(`/api/users/${DEMO_USER_ID}/summary`)).json();
    expect(summary.visitsLast6Weeks).toBe(11);

    expect((await app.request('/api/metrics')).status).toBe(200);
  });

  it('valida y devuelve errores con formato estable', async () => {
    const app = makeApp();
    const r = await app.request('/api/users/nadie/messages', json({ text: 'hola' }));
    expect(r.status).toBe(404);
    expect((await r.json()).error.code).toBe('user_not_found');
    const bad = await app.request('/api/users/x/messages', json({}));
    expect(bad.status).toBe(400);
    expect((await bad.json()).error.code).toBe('validation');
  });

  it('protege rutas admin cuando hay ADMIN_TOKEN', async () => {
    const app = makeApp('secreto');
    expect((await app.request('/api/jobs/tick', json({}))).status).toBe(401);
    const ok = await app.request('/api/jobs/tick', {
      ...json({}),
      headers: { 'Content-Type': 'application/json', 'x-admin-token': 'secreto' },
    });
    expect(ok.status).toBe(200);
    // lectura y chat quedan abiertos para el front
    expect((await app.request('/api/meta')).status).toBe(200);
  });

  it('webhook de Telegram crea usuaria sintética y responde sin red', async () => {
    const app = makeApp();
    const r = await app.request(
      '/api/telegram/webhook',
      json({ message: { chat: { id: 555 }, text: '/start' } }),
    );
    expect((await r.json()).ok).toBe(true);
    const users = await (await app.request('/api/users')).json();
    expect(users.users[0].id).toBe('tg_555');
    expect(users.users[0].channel.type).toBe('telegram');
  });
});
