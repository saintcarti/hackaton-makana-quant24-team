import { afterEach, describe, expect, it, vi } from 'vitest';
import { Engine } from '../src/engine.js';
import { MemoryStore } from '../src/store.js';
import { GoogleConfig, authUrl, signState, verifyState } from '../src/google.js';
import { nextSlots } from '../src/slots.js';
import { zonedToUtc } from '../src/time.js';
import { toneViolations, T } from '../src/tone.js';
import { classifyByRules } from '../src/intent.js';

const cfg: GoogleConfig = { clientId: 'cid', clientSecret: 'secret', publicUrl: 'https://api.test' };
const SUNDAY_20 = zonedToUtc(2026, 10, 25, 20, 0);

afterEach(() => vi.restoreAllMocks());

describe('state OAuth firmado', () => {
  it('acepta el propio, rechaza manipulado y vencido', async () => {
    const st = await signState('secret', 'camila-sintetica');
    expect(await verifyState('secret', st)).toBe('camila-sintetica');
    expect(await verifyState('otra-clave', st)).toBeNull();
    const [p, sig] = st.split('.');
    expect(await verifyState('secret', `${p}x.${sig}`)).toBeNull();
    expect(await verifyState('secret', st, Date.now() + 16 * 60_000)).toBeNull();
    expect(await verifyState('secret', 'basura')).toBeNull();
  });
  it('la URL de autorización pide offline + los dos permisos + redirect exacto', async () => {
    const url = new URL(authUrl(cfg, 'st'));
    expect(url.searchParams.get('redirect_uri')).toBe('https://api.test/api/google/callback');
    expect(url.searchParams.get('access_type')).toBe('offline');
    expect(url.searchParams.get('scope')).toContain('calendar.events');
    expect(url.searchParams.get('scope')).toContain('calendar.freebusy');
  });
});

describe('slots que esquivan el calendario real', () => {
  const user = { preferredTime: '19:15', window: { start: '19:00', end: '21:00' } } as any;
  it('si 19:15 está ocupado prueba 19:45 dentro de la ventana', () => {
    const mon = zonedToUtc(2026, 10, 26, 19, 15).getTime();
    const busy = [{ start: mon - 3600_000, end: mon + 15 * 60_000 }]; // hasta 19:30
    const [first] = nextSlots(user, SUNDAY_20, 1, [], busy);
    expect(first!.toISOString()).toBe(zonedToUtc(2026, 10, 26, 19, 45).toISOString());
  });
  it('si toda la ventana está ocupada pasa al siguiente día compatible', () => {
    const from = zonedToUtc(2026, 10, 26, 18, 0).getTime();
    const busy = [{ start: from, end: from + 4 * 3600_000 }];
    const [first] = nextSlots(user, SUNDAY_20, 1, [], busy);
    expect(first!.toISOString()).toBe(zonedToUtc(2026, 10, 28, 19, 15).toISOString());
  });
});

describe('sincronización con Google Calendar', () => {
  function mockGoogle(busy: Array<{ start: string; end: string }> = []) {
    const calls: Array<{ method: string; url: string; body?: any }> = [];
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input: any, init?: any) => {
      const url = String(input);
      const method = init?.method ?? 'GET';
      const body = init?.body && typeof init.body === 'string' && init.body.startsWith('{') ? JSON.parse(init.body) : undefined;
      calls.push({ method, url, body });
      if (method === 'GET' && url.includes('/calendars/primary/events?')) {
        return new Response(JSON.stringify({ items: busy.map((b, i) => ({ id: `m${i}`, summary: 'Reunión', start: { dateTime: b.start }, end: { dateTime: b.end } })) }));
      }
      if (url.includes('oauth2.googleapis.com/token')) return new Response(JSON.stringify({ access_token: 'at', expires_in: 3600 }));
      if (method === 'POST' && url.endsWith('/events')) return new Response(JSON.stringify({ id: 'ev1' }));
      if (method === 'PATCH') return new Response(JSON.stringify({ id: 'ev1', status: 'confirmed' }));
      return new Response('{}', { status: 404 });
    });
    return calls;
  }

  async function setup(busy: Array<{ start: string; end: string }> = []) {
    const calls = mockGoogle(busy);
    const engine = new Engine({ store: new MemoryStore(), google: cfg });
    await engine.run((c) => {
      engine.setClock(c, SUNDAY_20);
      engine.createUser(c, { id: 'u1' });
    });
    return { engine, calls };
  }

  const link = { refreshToken: 'refresh-secret-xyz', accessToken: 'at', expiresAt: Date.now() + 3600_000, connectedAt: new Date().toISOString() };

  it('agendar crea el evento; mover lo actualiza (PATCH) en vez de duplicar', async () => {
    const { engine, calls } = await setup();
    await engine.run((c) => engine.connectGoogle(c, 'u1', { ...link }));
    const appt = await engine.run((c) => engine.startCapture(c, 'u1'));
    await engine.run((c) => engine.chooseSlot(c, 'u1', appt.id, appt.options[0]!));
    const created = calls.filter((x) => x.method === 'POST' && x.url.endsWith('/events'));
    expect(created).toHaveLength(1);
    expect(created[0]!.body.start.dateTime).toBe(appt.options[0]);
    expect(created[0]!.body.reminders.overrides[0].minutes).toBe(45);

    await engine.run((c) => engine.handleInbound(c, 'u1', { text: 'hoy no puedo' }));
    expect(calls.filter((x) => x.method === 'PATCH')).toHaveLength(1);
    expect(calls.filter((x) => x.method === 'POST' && x.url.endsWith('/events'))).toHaveLength(1);
    const stored = await engine.read((c) => c.db.appointments[appt.id]!);
    expect(stored.eventId).toBe('ev1');
  });

  it('propone horarios que no chocan con las reuniones del calendario', async () => {
    const mon = zonedToUtc(2026, 10, 26, 17, 0);
    const { engine } = await setup([{ start: mon.toISOString(), end: zonedToUtc(2026, 10, 26, 19, 30).toISOString() }]);
    await engine.run((c) => engine.connectGoogle(c, 'u1', { ...link }));
    const appt = await engine.run((c) => engine.startCapture(c, 'u1'));
    expect(appt.options[0]).toBe(zonedToUtc(2026, 10, 26, 19, 45).toISOString());
  });

  it('si Google falla, el flujo sigue y la cita queda agendada', async () => {
    const { engine } = await setup();
    await engine.run((c) => engine.connectGoogle(c, 'u1', { ...link }));
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}', { status: 500 }));
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const appt = await engine.run((c) => engine.startCapture(c, 'u1'));
    await engine.run((c) => engine.chooseSlot(c, 'u1', appt.id, appt.options[0]!));
    const stored = await engine.read((c) => c.db.appointments[appt.id]!);
    expect(stored.status).toBe('confirmed');
    expect(stored.eventId).toBeUndefined();
  });

  it('ofrece conectar el calendario y no filtra los tokens por la API de usuarios', async () => {
    const { engine } = await setup();
    const appt = await engine.run((c) => engine.startCapture(c, 'u1'));
    const msgs = await engine.read((c) => c.db.messages);
    const connect = msgs[0]!.buttons!.find((b) => b.url);
    expect(connect!.url).toBe('https://api.test/api/google/connect?userId=u1');
    expect(appt).toBeTruthy();
    await engine.run((c) => engine.connectGoogle(c, 'u1', { ...link }));
    const users = await engine.read((c) => Object.values(c.db.users));
    expect(JSON.stringify(users)).not.toContain('refresh-secret-xyz');
  });
});

describe('mensajes de calendario', () => {
  it('cumplen el tono y se reconoce la intención', () => {
    for (const t of [T.connect(), T.calendarConnected(), T.alreadyConnected(), T.calendarUnavailable()]) {
      expect(toneViolations(t), t).toEqual([]);
    }
    expect(classifyByRules('quiero conectar mi calendario')).toBe('connect');
    expect(classifyByRules('vincular google calendar')).toBe('connect');
    expect(classifyByRules('calendario')).toBe('connect');
    expect(classifyByRules('hoy no puedo, la reunión')).toBe('move');
  });
});

describe('token rechazado por Google', () => {
  it('refresca y reintenta una vez ante un 401', async () => {
    const { withToken } = await import('../src/google.js');
    const cfg = { clientId: 'c', clientSecret: 's', publicUrl: 'https://x.test' };
    const link = { refreshToken: 'r', accessToken: 'viejo', expiresAt: Date.now() + 3_600_000, connectedAt: '' };
    vi.spyOn(globalThis, 'fetch').mockImplementation(async () => new Response(JSON.stringify({ access_token: 'nuevo', expires_in: 3600 }), { status: 200 }));
    try {
      const seen: string[] = [];
      const out = await withToken(cfg, link, Date.now(), async (t) => {
        seen.push(t);
        if (t === 'viejo') throw new Error('Calendar events 401: Invalid Credentials');
        return 'ok';
      });
      expect(out).toBe('ok');
      expect(seen).toEqual(['viejo', 'nuevo']);
    } finally {
      vi.restoreAllMocks();
    }
  });
});

describe('un solo evento por cita y corrimiento automático', () => {
  const link = { refreshToken: 'r', accessToken: 'at', expiresAt: Date.now() + 3600_000, connectedAt: new Date().toISOString() };

  function mock(meetings: Array<{ start: string; end: string }>) {
    const calls: Array<{ method: string; url: string }> = [];
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input: any, init?: any) => {
      const url = String(input);
      const method = init?.method ?? 'GET';
      calls.push({ method, url });
      if (method === 'GET' && url.includes('/calendars/primary/events?')) {
        return new Response(JSON.stringify({ items: meetings.map((b, i) => ({ id: `m${i}`, summary: 'Reunión', start: { dateTime: b.start }, end: { dateTime: b.end } })) }));
      }
      if (url.includes('oauth2.googleapis.com/token')) return new Response(JSON.stringify({ access_token: 'at', expires_in: 3600 }));
      if (method === 'POST' && url.endsWith('/events')) return new Response(JSON.stringify({ id: 'ev1' }));
      if (method === 'PATCH') return new Response(JSON.stringify({ id: 'ev1', status: 'confirmed' }));
      return new Response('{}', { status: 404 });
    });
    return calls;
  }

  async function booked(meetings: Array<{ start: string; end: string }>) {
    const calls = mock(meetings);
    const engine = new Engine({ store: new MemoryStore(), google: cfg });
    await engine.run((c) => {
      engine.setClock(c, SUNDAY_20);
      engine.createUser(c, { id: 'u1' });
      engine.connectGoogle(c, 'u1', { ...link });
    });
    const appt = await engine.run((c) => engine.startCapture(c, 'u1'));
    await engine.run((c) => engine.chooseSlot(c, 'u1', appt.id, appt.options[0]!));
    return { engine, calls, appt };
  }

  it('con Google conectado no manda .ics ni botón de agregar (duplicaría el evento)', async () => {
    const { engine } = await booked([]);
    const msgs = await engine.read((c) => c.db.messages.filter((m) => m.dir === 'out'));
    const last = msgs.at(-1)!;
    expect(last.text).toContain('Ya quedó en tu Google Calendar');
    expect(last.attachment).toBeUndefined();
  });

  it('las citas del propio agente no cuentan como ocupado', async () => {
    const { busyFromEvents } = await import('../src/google.js');
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          items: [
            { id: 'a', summary: 'Tu cita contigo · gogym', start: { dateTime: '2026-10-26T19:15:00-03:00' }, end: { dateTime: '2026-10-26T19:55:00-03:00' }, extendedProperties: { private: { laCita: '1' } } },
            { id: 'b', summary: 'Reunión', start: { dateTime: '2026-10-26T17:00:00-03:00' }, end: { dateTime: '2026-10-26T18:00:00-03:00' } },
            { id: 'c', summary: 'Libre', transparency: 'transparent', start: { dateTime: '2026-10-26T12:00:00-03:00' }, end: { dateTime: '2026-10-26T13:00:00-03:00' } },
            { id: 'd', summary: 'Feriado', start: { date: '2026-10-27' }, end: { date: '2026-10-28' } },
          ],
        }),
      ),
    );
    const busy = await busyFromEvents('at', 0, 1);
    expect(busy).toEqual([[Date.parse('2026-10-26T17:00:00-03:00'), Date.parse('2026-10-26T18:00:00-03:00')]]);
  });

  it('si una reunión nueva pisa la cita, el agente la corre solo y actualiza el mismo evento', async () => {
    const meetings: Array<{ start: string; end: string }> = [];
    const { engine, calls, appt } = await booked(meetings);
    expect(appt.options[0]).toBe(zonedToUtc(2026, 10, 26, 19, 15).toISOString());
    // aparece una reunión lunes 18:30–20:10 (se alargó)
    meetings.push({ start: zonedToUtc(2026, 10, 26, 18, 30).toISOString(), end: zonedToUtc(2026, 10, 26, 20, 10).toISOString() });
    await engine.run((c) => {
      for (const l of Object.values(c.db.google ?? {})) l.busyCache = undefined;
    });
    await engine.run((c) => engine.tick(c));
    const stored = await engine.read((c) => c.db.appointments[appt.id]!);
    expect(stored.startsAt).toBe(zonedToUtc(2026, 10, 26, 20, 15).toISOString());
    expect(stored.eventId).toBe('ev1');
    expect(calls.filter((x) => x.method === 'POST' && x.url.endsWith('/events'))).toHaveLength(1);
    expect(calls.filter((x) => x.method === 'PATCH')).toHaveLength(1);
    const user = await engine.read((c) => c.db.users['u1']!);
    expect(user.consecutiveMoves).toBe(0); // correrla sola no cuenta como un MUEVE de ella
    const last = (await engine.read((c) => c.db.messages.filter((m) => m.dir === 'out'))).at(-1)!;
    expect(last.text).toMatch(/Vi que tu calendario cambió/);
    expect(toneViolations(last.text)).toEqual([]);
    // un segundo tick no la vuelve a mover
    await engine.run((c) => engine.tick(c));
    expect((await engine.read((c) => c.db.appointments[appt.id]!)).startsAt).toBe(stored.startsAt);
  });

  it('si elige otra cita para la misma semana, la anterior se reemplaza y se borra su evento (sin duplicar)', async () => {
    const { engine, calls } = await booked([]);
    const second = await engine.run((c) => engine.startCapture(c, 'u1'));
    await engine.run((c) => engine.chooseSlot(c, 'u1', second.id, second.options[1]!)); // otro día, misma semana
    const live = await engine.read((c) => Object.values(c.db.appointments).filter((a) => a.status === 'confirmed'));
    expect(live).toHaveLength(1);
    expect(live[0]!.id).toBe(second.id);
    expect(calls.filter((x) => x.method === 'DELETE').length).toBeGreaterThanOrEqual(1);
  });
});
