import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { Engine } from '../src/engine.js';
import { MemoryStore } from '../src/store.js';
import { DEMO_USER_ID } from '../src/seed.js';

function setup(invite?: string) {
  const engine = new Engine({ store: new MemoryStore() });
  const app = createApp(engine, { sessionSecret: 'sec', inviteCode: invite, adminToken: 'adm' });
  const post = (path: string, body: unknown, headers: Record<string, string> = {}) =>
    app.request(path, { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body) });
  const get = (path: string, headers: Record<string, string> = {}) => app.request(path, { headers });
  return { engine, app, post, get };
}

describe('crear cuenta e iniciar sesión en la web', () => {
  it('registro: crea la cuenta, entrega sesión y deja la bienvenida en su chat', async () => {
    const t = setup('INV');
    const r = await t.post('/api/auth/register', { alias: 'Ana.Gym', password: 'clave-segura-1', invite: 'INV' });
    expect(r.status).toBe(201);
    const { token, userId, alias } = await r.json<any>();
    expect(alias).toBe('ana.gym'); // el alias se normaliza
    const auth = { Authorization: `Bearer ${token}` };
    const msgs = await (await t.get(`/api/users/${userId}/messages`, auth)).json<any>();
    expect(msgs.messages.map((m: any) => m.text).join('\n')).toMatch(/Cuántas veces por semana/);
    // la contraseña no queda en claro en ninguna parte
    expect(JSON.stringify(await t.engine.read((c) => c.db))).not.toContain('clave-segura-1');
  });

  it('beta cerrada: sin invitación o con una incorrecta no se crea la cuenta', async () => {
    const t = setup('INV');
    expect((await t.post('/api/auth/register', { alias: 'bea', password: 'clave-segura-1' })).status).toBe(403);
    expect((await t.post('/api/auth/register', { alias: 'bea', password: 'clave-segura-1', invite: 'otro' })).status).toBe(403);
    expect(await t.engine.read((c) => Object.keys(c.db.accounts ?? {}))).toEqual([]);
  });

  it('valida alias y contraseña, y no repite alias', async () => {
    const t = setup();
    expect((await t.post('/api/auth/register', { alias: 'a', password: 'clave-segura-1' })).status).toBe(400);
    expect((await t.post('/api/auth/register', { alias: 'ana', password: 'corta' })).status).toBe(400);
    expect((await t.post('/api/auth/register', { alias: 'ana', password: 'clave-segura-1' })).status).toBe(201);
    expect((await t.post('/api/auth/register', { alias: 'ANA', password: 'otra-clave-123' })).status).toBe(409);
  });

  it('login: contraseña correcta entra, incorrecta no, y se frenan los intentos', async () => {
    const t = setup();
    await t.post('/api/auth/register', { alias: 'ana', password: 'clave-segura-1' });
    expect((await t.post('/api/auth/login', { alias: 'ana', password: 'clave-segura-1' })).status).toBe(200);
    const bad = await t.post('/api/auth/login', { alias: 'ana', password: 'clave-mala-123' });
    expect(bad.status).toBe(401);
    expect((await bad.json<any>()).error.message).toBe((await (await t.post('/api/auth/login', { alias: 'nadie', password: 'clave-mala-123' })).json<any>()).error.message);
    let status = 0;
    for (let i = 0; i < 6; i++) status = (await t.post('/api/auth/login', { alias: 'ana', password: 'clave-mala-123' })).status;
    expect(status).toBe(429);
  });

  it('cada cuenta ve solo lo suyo; el simulador de Camila sigue abierto', async () => {
    const t = setup();
    await t.post('/api/demo/reset', {}, { 'x-admin-token': 'adm' });
    const a = await (await t.post('/api/auth/register', { alias: 'ana', password: 'clave-segura-1' })).json<any>();
    const b = await (await t.post('/api/auth/register', { alias: 'beto', password: 'clave-segura-1' })).json<any>();
    const authA = { Authorization: `Bearer ${a.token}` };
    expect((await t.get(`/api/users/${a.userId}/messages`, authA)).status).toBe(200);
    expect((await t.get(`/api/users/${b.userId}/messages`, authA)).status).toBe(401);
    expect((await t.get(`/api/users/${a.userId}/messages`)).status).toBe(401);
    expect((await t.get(`/api/users/${DEMO_USER_ID}/messages`)).status).toBe(200);
    const list = await (await t.get('/api/users', authA)).json<any>();
    expect(list.users.map((u: any) => u.id).sort()).toEqual([DEMO_USER_ID, a.userId].sort());
  });

  it('tras un reset de la demo la cuenta sigue existiendo y al entrar se le abre su espacio', async () => {
    const t = setup();
    await t.post('/api/auth/register', { alias: 'ana', password: 'clave-segura-1' });
    await t.post('/api/demo/reset', {}, { 'x-admin-token': 'adm' });
    expect(await t.engine.read((c) => Object.keys(c.db.users))).toEqual([DEMO_USER_ID]);
    const l = await (await t.post('/api/auth/login', { alias: 'ana', password: 'clave-segura-1' })).json<any>();
    expect(await t.engine.read((c) => Object.keys(c.db.users))).toContain(l.userId);
  });

  it('borrar mi cuenta elimina cuenta, usuaria y chat; el alias queda libre', async () => {
    const t = setup();
    const a = await (await t.post('/api/auth/register', { alias: 'ana', password: 'clave-segura-1' })).json<any>();
    expect((await t.post('/api/auth/delete', {}, { Authorization: `Bearer ${a.token}` })).status).toBe(200);
    const left = await t.engine.read((c) => ({ users: Object.keys(c.db.users), accounts: Object.keys(c.db.accounts ?? {}), msgs: c.db.messages.length }));
    expect(left).toEqual({ users: [], accounts: [], msgs: 0 });
    expect((await t.post('/api/auth/register', { alias: 'ana', password: 'clave-segura-1' })).status).toBe(201);
    expect((await t.post('/api/auth/delete', {})).status).toBe(401);
  });
});
