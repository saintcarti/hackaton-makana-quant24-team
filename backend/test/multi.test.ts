import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { Engine } from '../src/engine.js';
import { MemoryStore } from '../src/store.js';
import { DEMO_USER_ID } from '../src/seed.js';
import { zonedToUtc } from '../src/time.js';

const CHAT = 424242;
const UID = `tg_${CHAT}`;

function fakeTelegram() {
  let next = 500;
  const texts: string[] = [];
  const sent: Array<{ text: string; buttons?: any[] }> = [];
  return {
    texts,
    sent,
    tg: {
      send: async (_c: number, msg: any) => {
        sent.push({ text: msg.text, buttons: msg.buttons });
        return next++;
      },
      sendText: async (_c: number, text: string) => {
        texts.push(text);
      },
      clearButtons: async () => undefined,
      answerCallback: async () => undefined,
    } as any,
  };
}

function setup(opts: { invite?: string } = {}) {
  const fake = fakeTelegram();
  const engine = new Engine({ store: new MemoryStore(), telegram: fake.tg });
  const app = createApp(engine, { sessionSecret: 'test-secret', inviteCode: opts.invite, adminToken: 'adm' });
  const json = (method: string, body?: unknown, headers: Record<string, string> = {}) => ({
    method,
    headers: { 'Content-Type': 'application/json', ...headers },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const say = (text: string) =>
    app.request('/api/telegram/webhook', json('POST', { update_id: 1, message: { message_id: 1, chat: { id: CHAT, type: 'private' }, text } }));
  const press = (data: string, messageId = 1) =>
    app.request('/api/telegram/webhook', json('POST', { update_id: 2, callback_query: { id: 'q', data, message: { message_id: messageId, chat: { id: CHAT } } } }));
  const get = (path: string, headers: Record<string, string> = {}) => app.request(path, { headers });
  return { app, engine, json, say, press, get, ...fake };
}

describe('beta cerrada', () => {
  it('sin código de invitación no se crea nada', async () => {
    const t = setup({ invite: 'SECRETO' });
    await t.say('hola');
    await t.say('/start OTRO');
    expect(t.texts.filter((x) => /beta cerrada/.test(x))).toHaveLength(2);
    expect(await t.engine.read((c) => Object.keys(c.db.users))).toEqual([]);
    expect(await t.engine.read((c) => c.db.messages.length)).toBe(0); // ni siquiera se guarda lo que escribió
  });

  it('con el código entra, y queda dentro aunque se borre su usuaria de la base por un reset', async () => {
    const t = setup({ invite: 'SECRETO' });
    await t.say('/start SECRETO');
    expect(await t.engine.read((c) => Object.keys(c.db.users))).toEqual([UID]);
    expect(await t.engine.read((c) => c.db.allowedChats)).toContain(CHAT);
    await t.app.request('/api/demo/reset', t.json('POST', {}, { 'x-admin-token': 'adm' }));
    await t.say('hola'); // sin pedir el código otra vez
    expect(await t.engine.read((c) => Object.keys(c.db.users))).toContain(UID);
  });
});

describe('bienvenida', () => {
  it('pregunta cuántas veces por semana y deja propuestas de horario', async () => {
    const t = setup();
    await t.say('/start');
    const welcome = t.sent.map((m) => m.text).join('\n');
    expect(welcome).toMatch(/beta con datos de prueba/);
    expect(welcome).toMatch(/\/borrar/);
    await t.press('pw:2');
    const me = await t.engine.read((c) => c.db.users[UID]!);
    expect(me.perWeek).toBe(2);
    expect(me.onboarded).toBe(true);
    const last = t.sent.at(-1)!;
    expect(last.buttons?.some((b: any) => b.action.startsWith('slot:'))).toBe(true);
  });
});

describe('acceso a la web con código de Telegram', () => {
  it('el código canjea una sesión; sin sesión no se ve nada de una usuaria real', async () => {
    const t = setup();
    await t.say('/start');
    await t.press('pw:1');
    await t.app.request('/api/demo/reset', t.json('POST', {}, { 'x-admin-token': 'adm' })); // deja a la sintética
    await t.say('/start'); // la real vuelve a entrar
    await t.say('/web');
    const code = /(\d{6})/.exec(t.texts.at(-1)!)![1]!;

    // sin sesión: 401 en todo lo de la usuaria real, pero la sintética sigue abierta
    expect((await t.get(`/api/users/${UID}/messages`)).status).toBe(401);
    expect((await t.get(`/api/users/${UID}`)).status).toBe(401);
    expect((await t.get(`/api/users/${DEMO_USER_ID}/messages`)).status).toBe(200);
    const anon = await (await t.get('/api/users')).json<any>();
    expect(anon.users.map((u: any) => u.id)).toEqual([DEMO_USER_ID]);

    const ex = await t.app.request('/api/auth/exchange', t.json('POST', { code }));
    expect(ex.status).toBe(200);
    const { token, userId } = await ex.json<any>();
    expect(userId).toBe(UID);
    const auth = { Authorization: `Bearer ${token}` };
    expect((await t.get(`/api/users/${UID}/messages`, auth)).status).toBe(200);
    const mine = await (await t.get('/api/users', auth)).json<any>();
    expect(mine.users.map((u: any) => u.id).sort()).toEqual([DEMO_USER_ID, UID].sort());

    // el código sirve una sola vez
    expect((await t.app.request('/api/auth/exchange', t.json('POST', { code }))).status).toBe(401);
    // el token admin ve todo
    expect((await t.get(`/api/users/${UID}/messages`, { 'x-admin-token': 'adm' })).status).toBe(200);
    // un token ajeno no sirve
    expect((await t.get(`/api/users/${UID}/messages`, { Authorization: 'Bearer basura' })).status).toBe(401);
  });

  it('frena las adivinanzas de códigos', async () => {
    const t = setup();
    let status = 0;
    for (let i = 0; i < 12; i++) status = (await t.app.request('/api/auth/exchange', t.json('POST', { code: '000000' }))).status;
    expect(status).toBe(429);
  });
});

describe('borrar mis datos', () => {
  it('pregunta, y al confirmar borra usuaria, chat y permiso; vuelve a pedir el código', async () => {
    const t = setup({ invite: 'SECRETO' });
    await t.say('/start SECRETO');
    await t.press('pw:1');
    await t.say('/borrar');
    expect(t.sent.at(-1)!.buttons?.map((b: any) => b.action)).toEqual(['del:yes', 'del:no']);
    await t.press('del:yes');
    expect(t.texts.at(-1)).toMatch(/borré tus datos/);
    const left = await t.engine.read((c) => ({ users: Object.keys(c.db.users), msgs: c.db.messages.length, allowed: c.db.allowedChats }));
    expect(left.users).toEqual([]);
    expect(left.msgs).toBe(0);
    expect(left.allowed).not.toContain(CHAT);
    await t.say('hola');
    expect(t.texts.at(-1)).toMatch(/beta cerrada/);
  });

  it('"No" no borra nada', async () => {
    const t = setup();
    await t.say('/start');
    await t.press('pw:1');
    await t.say('/borrar');
    await t.press('del:no');
    expect(await t.engine.read((c) => Object.keys(c.db.users))).toEqual([UID]);
  });
});

describe('volver al hábito', () => {
  it('dos citas seguidas sin hacerse y nada agendado: un empujón suave, una sola vez', async () => {
    const t = setup();
    await t.say('/start');
    await t.press('pw:2');
    await t.engine.run((c) => {
      for (const a of Object.values(c.db.appointments)) delete c.db.appointments[a.id];
      c.db.users[UID]!.pending = null;
      const mk = (id: string, y: number, mo: number, d: number) =>
        (c.db.appointments[id] = {
          id,
          userId: UID,
          startsAt: zonedToUtc(y, mo, d, 19, 15).toISOString(),
          durationMin: 40,
          venue: 'gym',
          content: '',
          status: 'lapsed',
          source: 'user',
          options: [],
          moves: [],
          weekOf: '2026-10-12',
          createdAt: '',
        });
      mk('a1', 2026, 10, 12);
      mk('a2', 2026, 10, 14);
      engine_setClock(t.engine, c, zonedToUtc(2026, 10, 19, 11, 0));
    });
    const first = await t.engine.run((c) => t.engine.tick(c));
    expect(first.some((a) => a.action === 'comeback')).toBe(true);
    expect(t.sent.map((m) => m.text).join('\n')).toMatch(/Empecemos suave/);
    const second = await t.engine.run((c) => t.engine.tick(c));
    expect(second.some((a) => a.action === 'comeback')).toBe(false);
  });
});

function engine_setClock(engine: Engine, c: any, when: Date) {
  engine.setClock(c, when);
}
