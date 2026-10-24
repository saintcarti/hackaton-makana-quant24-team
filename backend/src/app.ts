import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { z } from 'zod';
import { parseTelegramUpdate } from './channels/telegram.js';
import { DomainError, Engine } from './engine.js';
import { T } from './tone.js';
import { ALIAS, checkPassword, hashPassword } from './auth.js';
import { accessToken, withToken, authUrl, clearAppointmentEvents, clearDemoEvents, createDemoEvent, exchangeCode, listEvents, signState, verifyState } from './google.js';
import { buildIcs } from './ics.js';
import { isValidChoice } from './splits.js';
import { DEMO_USER_ID, freshDB } from './seed.js';
import { addDays, localParts, mondayOf, TZ, zonedToUtc } from './time.js';
import { apptView, calendarWeek, metrics, userAppointments, userSummary } from './views.js';

export interface AppOptions {
  /** Si está definido, exige `x-admin-token` en /demo, /jobs y /telegram/set-webhook. */
  adminToken?: string;
  telegramSecret?: string;
  corsOrigin?: string | string[];
  /** Si está definido, las usuarias reales (Telegram) solo se ven con su sesión o el token admin. */
  sessionSecret?: string;
  /** Si está definido, solo entran al bot los chats que escriban `/start <código>` (beta cerrada). */
  inviteCode?: string;
}

const PRESETS: Record<string, { weekday: number; hour: number; minute: number }> = {
  'sunday-20': { weekday: 0, hour: 20, minute: 0 },
  'sunday-2330': { weekday: 0, hour: 23, minute: 30 },
  'monday-1830': { weekday: 1, hour: 18, minute: 30 },
  'monday-2000': { weekday: 1, hour: 20, minute: 0 },
};

function presetDate(preset: string, from: Date): Date | null {
  const p = PRESETS[preset];
  if (!p) return null;
  const base = localParts(from);
  // Próxima ocurrencia (futura) del día de semana y hora pedidos.
  for (let i = 0; i < 8; i++) {
    const day = addDays(base, i);
    if (day.weekday !== p.weekday) continue;
    const t = zonedToUtc(day.year, day.month, day.day, p.hour, p.minute);
    if (t.getTime() > from.getTime()) return t;
  }
  return null;
}

export function createApp(engine: Engine, opts: AppOptions = {}) {
  const app = new Hono();

  app.use('/api/*', cors({ origin: opts.corsOrigin ?? '*', allowHeaders: ['Content-Type', 'x-admin-token', 'Authorization'] }));

  app.onError((err, c) => {
    if (err instanceof DomainError) {
      return c.json({ error: { code: err.code, message: err.message } }, err.status as 400);
    }
    if (err instanceof z.ZodError) {
      return c.json({ error: { code: 'validation', message: err.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ') } }, 400);
    }
    console.error(err);
    return c.json({ error: { code: 'internal', message: 'Error interno' } }, 500);
  });

  const requireAdmin = async (c: any, next: () => Promise<void>) => {
    if (opts.adminToken && c.req.header('x-admin-token') !== opts.adminToken) {
      return c.json({ error: { code: 'unauthorized', message: 'Falta x-admin-token válido' } }, 401);
    }
    await next();
  };

  // ───────────── acceso por usuaria ─────────────
  // Las usuarias sintéticas del simulador siguen abiertas (demo). Las de Telegram son personas reales:
  // solo se ven con su propia sesión (código de /web) o con el token admin.
  const isAdmin = (c: any) => !!opts.adminToken && c.req.header('x-admin-token') === opts.adminToken;
  const sessionUser = async (c: any): Promise<string | null> => {
    const h = c.req.header('Authorization') ?? '';
    if (!opts.sessionSecret || !h.startsWith('Bearer ')) return null;
    const who = await verifyState(opts.sessionSecret, h.slice(7));
    return who?.startsWith('session:') ? who.slice(8) : null;
  };
  const canSee = async (c: any, userId: string, channel: string | undefined) => {
    if (!opts.sessionSecret) return true;
    if (channel === undefined || channel === 'sim') return true;
    return isAdmin(c) || (await sessionUser(c)) === userId;
  };
  app.use('/api/users/:id', async (c, next) => {
    const id = c.req.param('id');
    const channel = await engine.read((x) => x.db.users[id]?.channel.type);
    if (!(await canSee(c, id, channel))) return c.json({ error: { code: 'unauthorized', message: 'Entra con tu código de Telegram (/web)' } }, 401);
    await next();
  });
  app.use('/api/users/:id/*', async (c, next) => {
    const id = c.req.param('id');
    const channel = await engine.read((x) => x.db.users[id]?.channel.type);
    if (!(await canSee(c, id, channel))) return c.json({ error: { code: 'unauthorized', message: 'Entra con tu código de Telegram (/web)' } }, 401);
    await next();
  });

  app.post('/api/auth/exchange', async (c) => {
    if (!opts.sessionSecret) throw new DomainError('auth_disabled', 'El acceso con código no está configurado', 503);
    const { code } = z.object({ code: z.string().regex(/^\d{6}$/, 'El código tiene 6 dígitos') }).parse(await c.req.json().catch(() => ({})));
    const userId = await engine.run((x) => engine.exchangeLoginCode(x, code));
    if (!userId) throw new DomainError('invalid_code', 'Código inválido o vencido. Pídelo de nuevo con /web en Telegram.', 401);
    const token = await signState(opts.sessionSecret, `session:${userId}`, 7 * 86400_000);
    return c.json({ token, userId });
  });

  // ───────────── cuentas de la web ─────────────
  const issueSession = async (userId: string) => signState(opts.sessionSecret!, `session:${userId}`, 7 * 86400_000);
  const creds = z.object({
    alias: z.string().trim().toLowerCase().regex(ALIAS, 'El alias tiene 3 a 24 caracteres: letras, números, punto, guion o guion bajo'),
    password: z.string().min(8, 'La contraseña tiene al menos 8 caracteres').max(72),
  });

  app.post('/api/auth/register', async (c) => {
    if (!opts.sessionSecret) throw new DomainError('auth_disabled', 'Las cuentas no están configuradas', 503);
    const body = creds.extend({ invite: z.string().optional() }).parse(await c.req.json().catch(() => ({})));
    if (opts.inviteCode && body.invite?.trim() !== opts.inviteCode) {
      throw new DomainError('invite_required', 'Necesitas un código de invitación válido (beta cerrada).', 403);
    }
    const pw = await hashPassword(body.password);
    const out = await engine.run((x) => {
      const accounts = (x.db.accounts ??= {});
      if (accounts[body.alias]) throw new DomainError('alias_taken', 'Ese alias ya existe. Elige otro o entra con tu contraseña.', 409);
      const user = engine.createUser(x, { id: `w_${body.alias}`, name: body.alias, channel: { type: 'web' }, synthetic: true });
      accounts[body.alias] = { userId: user.id, ...pw, createdAt: x.now.toISOString() };
      engine.startOnboarding(x, user.id);
      return { userId: user.id };
    });
    return c.json({ token: await issueSession(out.userId), userId: out.userId, alias: body.alias }, 201);
  });

  app.post('/api/auth/login', async (c) => {
    if (!opts.sessionSecret) throw new DomainError('auth_disabled', 'Las cuentas no están configuradas', 503);
    const body = creds.parse(await c.req.json().catch(() => ({})));
    const out = await engine.run(async (x) => {
      const now = Date.now();
      const fails = ((x.db.authFailures ??= {})[body.alias] ??= []).filter((t) => now - t < 10 * 60_000);
      x.db.authFailures[body.alias] = fails;
      if (fails.length >= 5) return { fail: 'limit' as const };
      const acc = x.db.accounts?.[body.alias];
      // Misma respuesta si el alias no existe o la contraseña es incorrecta. El fallo se guarda (no se lanza dentro: no se perdería).
      if (!acc || !(await checkPassword(body.password, acc))) {
        fails.push(now);
        return { fail: 'invalid' as const };
      }
      delete x.db.authFailures[body.alias];
      // Tras un reset de la demo la persona sigue teniendo cuenta: se le vuelve a abrir su espacio.
      if (!x.db.users[acc.userId]) {
        engine.createUser(x, { id: acc.userId, name: body.alias, channel: { type: 'web' }, synthetic: true });
        engine.startOnboarding(x, acc.userId);
      }
      return { userId: acc.userId };
    });
    if ('fail' in out) {
      if (out.fail === 'limit') throw new DomainError('too_many_attempts', 'Demasiados intentos. Espera unos minutos.', 429);
      throw new DomainError('invalid_credentials', 'Alias o contraseña incorrectos.', 401);
    }
    return c.json({ token: await issueSession(out.userId), userId: out.userId, alias: body.alias });
  });

  // Borrar mi cuenta (R2: cada persona puede eliminar todo lo suyo).
  app.post('/api/auth/delete', async (c) => {
    const me = await sessionUser(c);
    if (!me) return c.json({ error: { code: 'unauthorized', message: 'Entra primero' } }, 401);
    await engine.run(async (x) => {
      for (const [alias, acc] of Object.entries(x.db.accounts ?? {})) if (acc.userId === me) delete x.db.accounts![alias];
      if (x.db.users[me]) await engine.deleteUser(x, me);
    });
    return c.json({ ok: true });
  });

  // ───────────── meta ─────────────
  app.get('/api/health', (c) => c.json({ ok: true, service: 'la-cita-backend' }));

  app.get('/api/meta', async (c) =>
    c.json(
      await engine.read((x) => ({
        timezone: TZ,
        demoUserId: DEMO_USER_ID,
        now: x.now.toISOString(),
        clockSimulated: x.db.clockOffsetMs !== 0,
        channels: ['sim', 'telegram'],
        telegramEnabled: !!engine.telegram,
        googleConfigured: !!engine.google,
        users: Object.keys(x.db.users).length,
      })),
    ),
  );

  // ───────────── demo ─────────────
  app.post('/api/demo/reset', requireAdmin, async (c) => {
    const body = z.object({ seed: z.boolean().default(true), now: z.string().datetime().optional(), keepGoogle: z.boolean().default(true) }).parse(await c.req.json().catch(() => ({})));
    const out = await engine.run(async (x) => {
      const now = body.now ? new Date(body.now) : new Date();
      const links = x.db.google ?? {};
      // Las citas que creó el agente en Google se borran antes de vaciar la base: si no, quedan huérfanas y se ven duplicadas.
      const g = engine.google;
      if (g && body.keepGoogle) {
        for (const link of Object.values(links)) {
          try {
            await withToken(g, link, Date.now(), (t) => clearAppointmentEvents(t, Date.now()));
          } catch (err) {
            console.warn(JSON.stringify({ evt: 'gcal_reset_clear_error', message: (err as Error).message }));
          }
        }
      }
      const allowed = x.db.allowedChats;
      const accounts = x.db.accounts;
      x.db = freshDB(now, body.seed);
      if (allowed) x.db.allowedChats = allowed;
      if (accounts) x.db.accounts = accounts;
      // Las conexiones de Google sobreviven al reset (se reconectaría con una autorización manual); el caché de ocupación no.
      if (body.keepGoogle) x.db.google = Object.fromEntries(Object.entries(links).map(([id, l]) => [id, { ...l, busyCache: undefined }]));
      x.db.clockOffsetMs = body.now ? now.getTime() - Date.now() : 0;
      x.now = new Date(Date.now() + x.db.clockOffsetMs);
      return { demoUserId: body.seed ? DEMO_USER_ID : null, now: x.now.toISOString() };
    });
    return c.json(out);
  });

  app.get('/api/demo/clock', async (c) =>
    c.json(await engine.read((x) => ({ now: x.now.toISOString(), simulated: x.db.clockOffsetMs !== 0 }))),
  );

  app.post('/api/demo/clock', requireAdmin, async (c) => {
    const body = z
      .object({
        now: z.string().datetime().optional(),
        preset: z.enum(['sunday-20', 'sunday-2330', 'monday-1830', 'monday-2000']).optional(),
        advanceMinutes: z.number().int().optional(),
        reset: z.boolean().optional(),
      })
      .refine((b) => b.now || b.preset || b.advanceMinutes !== undefined || b.reset, 'Indica now, preset, advanceMinutes o reset')
      .parse(await c.req.json());
    const out = await engine.run((x) => {
      if (body.reset) engine.setClock(x, null);
      else if (body.now) engine.setClock(x, new Date(body.now));
      else if (body.preset) {
        const d = presetDate(body.preset, x.now);
        if (!d) throw new DomainError('bad_preset', 'Preset inválido');
        engine.setClock(x, d);
      } else if (body.advanceMinutes !== undefined) {
        engine.setClock(x, new Date(x.now.getTime() + body.advanceMinutes * 60000));
      }
      return { now: x.now.toISOString(), simulated: x.db.clockOffsetMs !== 0 };
    });
    return c.json(out);
  });

  // ───────────── usuarios ─────────────
  app.post('/api/users', async (c) => {
    const body = z
      .object({
        id: z.string().min(1).max(40).optional(),
        name: z.string().min(1).max(40).optional(),
        gym: z.string().max(60).optional(),
        monthlyFee: z.number().int().positive().optional(),
        preferredTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
      })
      .parse(await c.req.json().catch(() => ({})));
    const user = await engine.run((x) => engine.createUser(x, body));
    return c.json({ user }, 201);
  });

  const hhmm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
  const prefsSchema = z
    .object({
      gymHours: z.object({ open: hhmm, close: hhmm }).optional(),
      window: z.object({ start: hhmm, end: hhmm }).optional(),
      sessionMin: z.union([z.literal(30), z.literal(40), z.literal(50), z.literal(60)]).optional(),
      perWeek: z.union([z.literal(1), z.literal(2), z.literal(3)]).optional(),
      autoPlan: z.boolean().optional(),
      flexTimes: z.boolean().optional(),
      days: z.array(z.number().int().min(0).max(6)).min(1).max(7).optional(),
      split: z.object({ id: z.enum(['fullbody', 'upper-lower', 'ppl', 'torso-piernas-brazos', 'cinco-dias']), sessions: z.number().int() }).optional(),
    })
    .strict();

  app.patch('/api/users/:id/preferences', async (c) => {
    const prefs = prefsSchema.parse(await c.req.json().catch(() => ({})));
    const check = (a?: { open?: string; close?: string; start?: string; end?: string }) => {
      const lo = a?.open ?? a?.start;
      const hi = a?.close ?? a?.end;
      if (lo && hi && lo >= hi) throw new DomainError('invalid_range', 'La hora de inicio debe ser anterior a la de término', 400);
    };
    check(prefs.gymHours);
    check(prefs.window);
    if (prefs.split && !isValidChoice(prefs.split)) {
      throw new DomainError('invalid_split', `El split ${prefs.split.id} no admite ${prefs.split.sessions} sesiones por semana`, 400);
    }
    const { split, ...rest } = prefs;
    const user = await engine.run((x) => {
      const u = engine.setPreferences(x, c.req.param('id'), rest);
      if (split) engine.setSplit(x, u.id, split);
      return u;
    });
    return c.json({ user });
  });

  app.post('/api/users/:id/busy', async (c) => {
    const body = z
      .object({
        weekOf: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        intervals: z.array(z.object({ start: z.string().datetime({ offset: true }), end: z.string().datetime({ offset: true }) })).max(300),
      })
      .parse(await c.req.json().catch(() => ({})));
    const intervals = body.intervals
      .map((i) => [Date.parse(i.start), Date.parse(i.end)] as [number, number])
      .filter(([s, e]) => e > s);
    await engine.run((x) => engine.setBusy(x, c.req.param('id'), body.weekOf, intervals));
    return c.json({ ok: true, count: intervals.length });
  });

  app.get('/api/users', async (c) => {
    const all = await engine.read((x) => Object.values(x.db.users));
    if (!opts.sessionSecret || isAdmin(c)) return c.json({ users: all });
    const me = await sessionUser(c);
    return c.json({ users: all.filter((u) => u.channel.type === 'sim' || u.id === me) });
  });

  app.get('/api/users/:id', async (c) =>
    c.json(
      await engine.read((x) => {
        const user = x.db.users[c.req.param('id')];
        if (!user) throw new DomainError('user_not_found', 'Usuario no encontrado', 404);
        return { user };
      }),
    ),
  );

  app.get('/api/users/:id/summary', async (c) =>
    c.json(
      await engine.read((x) => {
        const user = x.db.users[c.req.param('id')];
        if (!user) throw new DomainError('user_not_found', 'Usuario no encontrado', 404);
        return userSummary(x.db, user, x.now);
      }),
    ),
  );

  app.get('/api/users/:id/appointments', async (c) =>
    c.json(
      await engine.read((x) => {
        const id = c.req.param('id');
        if (!x.db.users[id]) throw new DomainError('user_not_found', 'Usuario no encontrado', 404);
        return { appointments: userAppointments(x.db, id).map(apptView) };
      }),
    ),
  );

  app.get('/api/users/:id/calendar', async (c) =>
    c.json(
      await engine.read((x) => {
        const id = c.req.param('id');
        if (!x.db.users[id]) throw new DomainError('user_not_found', 'Usuario no encontrado', 404);
        const weekOf = c.req.query('weekOf') ?? mondayOf(x.now);
        if (!/^\d{4}-\d{2}-\d{2}$/.test(weekOf)) throw new DomainError('bad_week', 'weekOf debe ser YYYY-MM-DD (lunes)');
        return calendarWeek(x.db, id, weekOf);
      }),
    ),
  );

  // ───────────── mensajes (chat del front / simulador) ─────────────
  app.get('/api/users/:id/messages', async (c) =>
    c.json(
      await engine.read((x) => {
        const id = c.req.param('id');
        if (!x.db.users[id]) throw new DomainError('user_not_found', 'Usuario no encontrado', 404);
        const after = Number(c.req.query('after') ?? 0) || 0;
        return { messages: x.db.messages.filter((m) => m.userId === id && m.n > after), now: x.now.toISOString() };
      }),
    ),
  );

  app.post('/api/users/:id/messages', async (c) => {
    const body = z
      .object({ text: z.string().max(500).optional(), action: z.string().max(80).optional(), label: z.string().max(80).optional() })
      .refine((b) => b.text || b.action, 'Envía text o action')
      .parse(await c.req.json());
    const id = c.req.param('id');
    const out = await engine.run(async (x) => {
      const replies = await engine.handleInbound(x, id, body);
      return { replies, user: x.db.users[id], now: x.now.toISOString() };
    });
    return c.json(out);
  });

  // ───────────── acciones directas (botones del admin/demo) ─────────────
  const act = (fn: (x: any, userId: string, body: any) => unknown) => async (c: any) => {
    const userId = c.req.param('id');
    const body = await c.req.json().catch(() => ({}));
    const result = await engine.run((x) => {
      const before = x.db.seq;
      const r = fn(x, userId, body) as any;
      const replies = x.db.messages.filter((m) => m.userId === userId && m.dir === 'out' && m.n > before);
      return { appointment: r ? apptView(r) : null, replies, now: x.now.toISOString() };
    });
    return c.json(result);
  };

  app.post('/api/users/:id/weekly-capture', act((x, id) => engine.startCapture(x, id)));
  app.post('/api/users/:id/default', act((x, id) => engine.applyDefault(x, id)));
  app.post('/api/users/:id/reminder', act((x, id, b) => engine.sendReminder(x, id, b?.appointmentId)));
  app.post('/api/users/:id/move', act((x, id, b) => engine.move(x, id, b?.appointmentId)));
  app.post('/api/users/:id/done', act((x, id, b) => engine.markDone(x, id, b?.appointmentId)));

  // ───────────── citas ─────────────
  app.get('/api/appointments/:id', async (c) =>
    c.json(
      await engine.read((x) => {
        const a = x.db.appointments[c.req.param('id')];
        if (!a) throw new DomainError('appointment_not_found', 'Cita no encontrada', 404);
        return { appointment: apptView(a) };
      }),
    ),
  );

  app.get('/api/appointments/:id/ics', async (c) => {
    const ics = await engine.read((x) => {
      const a = x.db.appointments[c.req.param('id')];
      if (!a) throw new DomainError('appointment_not_found', 'Cita no encontrada', 404);
      const user = x.db.users[a.userId]!;
      return buildIcs(a, user, x.now);
    });
    return new Response(ics, {
      headers: { 'Content-Type': 'text/calendar; charset=utf-8', 'Content-Disposition': 'attachment; filename="la-cita.ics"' },
    });
  });

  // ───────────── métricas y scheduler ─────────────
  app.get('/api/metrics', async (c) => c.json(await engine.read((x) => metrics(x.db))));

  app.post('/api/jobs/tick', requireAdmin, async (c) => {
    const out = await engine.run((x) => ({ actions: engine.tick(x), now: x.now.toISOString() }));
    return c.json(out);
  });


  // ───────────── Google Calendar ─────────────
  const page = (title: string, body: string, status = 200) =>
    new Response(
      `<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title>` +
        `<body style="font-family:system-ui,sans-serif;max-width:32rem;margin:15vh auto;padding:0 1rem;text-align:center"><h1 style="font-size:1.4rem">${title}</h1><p>${body}</p></body></html>`,
      { status, headers: { 'Content-Type': 'text/html; charset=utf-8' } },
    );

  app.get('/api/google/connect', async (c) => {
    const g = engine.google;
    if (!g) throw new DomainError('google_disabled', 'Falta configurar GOOGLE_CLIENT_ID/SECRET/PUBLIC_URL', 503);
    const userId = c.req.query('userId') ?? '';
    await engine.read((x) => {
      if (!x.db.users[userId]) throw new DomainError('user_not_found', 'Usuario no encontrado', 404);
    });
    return c.redirect(authUrl(g, await signState(g.clientSecret, userId)), 302);
  });

  app.get('/api/google/callback', async (c) => {
    const g = engine.google;
    if (!g) return page('Calendario no disponible', 'La integración no está configurada.', 503);
    if (c.req.query('error')) return page('No se conectó el calendario', 'Cancelaste el permiso. Puedes volver al chat y reintentar cuando quieras.', 400);
    const userId = await verifyState(g.clientSecret, c.req.query('state') ?? '');
    const code = c.req.query('code');
    if (!userId || !code) return page('Enlace vencido', 'Vuelve al chat y pide de nuevo «conectar calendario».', 400);
    try {
      const link = await exchangeCode(g, code);
      await engine.run((x) => engine.connectGoogle(x, userId, link));
    } catch (err) {
      console.error(JSON.stringify({ evt: 'google_callback_error', message: (err as Error).message }));
      return page('No pude conectar el calendario', 'Reintenta desde el chat. Si persiste, avisa al equipo.', 502);
    }
    return page('Calendario conectado ✅', 'Puedes cerrar esta pestaña y volver al chat.');
  });

  app.get('/api/users/:id/google', async (c) =>
    c.json(
      await engine.read((x) => {
        const id = c.req.param('id');
        if (!x.db.users[id]) throw new DomainError('user_not_found', 'Usuario no encontrado', 404);
        const g = engine.google;
        return {
          configured: !!g,
          connected: engine.isConnected(x, id),
          connectUrl: g ? `${g.publicUrl}/api/google/connect?userId=${encodeURIComponent(id)}` : null,
        };
      }),
    ),
  );

  app.post('/api/users/:id/google/disconnect', async (c) => {
    const id = c.req.param('id');
    await engine.run((x) => engine.disconnectGoogle(x, id));
    return c.json({ connected: false });
  });


  /** Próximos eventos del calendario conectado (reuniones de demo + citas de La Cita), para el panel de demo. */
  app.get('/api/users/:id/google/events', requireAdmin, async (c) => {
    const g = engine.google;
    if (!g) throw new DomainError('google_disabled', 'Google no está configurado', 503);
    const id = c.req.param('id');
    const out = await engine.run(async (x) => {
      const link = x.db.google?.[id];
      if (!link) throw new DomainError('not_connected', 'La usuaria no conectó su calendario', 409);
      try {
        const events = await withToken(g, link, x.now.getTime(), (t) => listEvents(t, x.now.getTime(), x.now.getTime() + 21 * 86400_000));
        return { events };
      } catch (err) {
        throw new DomainError('google_calendar', (err as Error).message, 502);
      }
    });
    return c.json(out);
  });

  /** Siembra el calendario conectado con las reuniones inventadas de una jefa de proyectos (próximas 2 semanas). */
  app.post('/api/google/demo-events', requireAdmin, async (c) => {
    const g = engine.google;
    if (!g) throw new DomainError('google_disabled', 'Google no está configurado', 503);
    const { userId } = z.object({ userId: z.string() }).parse(await c.req.json());
    const out = await engine.run(async (x) => {
      const link = x.db.google?.[userId];
      if (!link) throw new DomainError('not_connected', 'La usuaria no conectó su calendario', 409);
      let token: string;
      try {
        token = await accessToken(g, link, x.now.getTime());
      } catch (err) {
        throw new DomainError('google_token', (err as Error).message, 502);
      }
      // [día de semana, inicio, fin, título]: oficina de 08:00 a 19:00 con ~2 h de almuerzo (hay huecos antes, al almuerzo y después).
      const plan: Array<[number, string, string, string]> = [
        [1, '08:00', '09:30', 'Planificación de la semana'],
        [1, '09:45', '12:00', 'Reunión de avance de obra'],
        [1, '12:15', '12:45', 'Llamada con proveedores'],
        [1, '14:45', '16:30', 'Revisión de presupuestos'],
        [1, '16:45', '19:00', 'Visita a terreno con el cliente'],
        [2, '08:30', '10:30', 'Comité de proyecto'],
        [2, '10:45', '12:30', 'Revisión de planos'],
        [2, '14:30', '17:00', 'Taller con arquitectos'],
        [2, '17:15', '19:00', 'Reunión de coordinación'],
        [3, '08:00', '10:00', 'Revisión con arquitectos'],
        [3, '10:15', '12:30', 'Seguimiento de contratos'],
        [3, '14:30', '16:00', 'Cierre de presupuestos'],
        [3, '16:15', '19:30', 'Reunión con el cliente (se suele alargar)'],
        [4, '08:00', '11:00', 'Cierre de hormigonado'],
        [4, '11:15', '12:45', 'Revisión de avances'],
        [4, '14:45', '17:30', 'Auditoría de calidad'],
        [4, '17:45', '19:00', 'Informe a gerencia'],
        [5, '08:30', '10:30', 'Cierre semanal del proyecto'],
        [5, '10:45', '12:30', 'Reunión con proveedores'],
        [5, '14:30', '16:30', 'Revisión de pendientes'],
        [5, '16:45', '18:30', 'Planificación de la próxima semana'],
      ];
      const today = localParts(x.now);
      let created = 0;
      for (let i = 0; i < 14; i++) {
        const day = addDays(today, i);
        for (const [wd, from, to, title] of plan) {
          if (day.weekday !== wd) continue;
          const [fh, fm] = from.split(':').map(Number);
          const [th, tm] = to.split(':').map(Number);
          const start = zonedToUtc(day.year, day.month, day.day, fh!, fm!);
          const end = zonedToUtc(day.year, day.month, day.day, th!, tm!);
          if (end.getTime() <= x.now.getTime()) continue;
          try {
            await createDemoEvent(token, title, start, end);
          } catch (err) {
            throw new DomainError('google_calendar', (err as Error).message, 502);
          }
          created += 1;
        }
      }
      link.busyCache = undefined;
      return { created };
    });
    return c.json(out);
  });

  app.post('/api/google/demo-events/clear', requireAdmin, async (c) => {
    const g = engine.google;
    if (!g) throw new DomainError('google_disabled', 'Google no está configurado', 503);
    const { userId } = z.object({ userId: z.string() }).parse(await c.req.json());
    const out = await engine.run(async (x) => {
      const link = x.db.google?.[userId];
      if (!link) throw new DomainError('not_connected', 'La usuaria no conectó su calendario', 409);
      const deleted = await withToken(g, link, x.now.getTime(), clearDemoEvents);
      link.busyCache = undefined;
      return { deleted };
    });
    return c.json(out);
  });

  // Para el demo: agrega una reunión puntual al calendario conectado ("se alargó la reunión"). Luego /jobs/tick corre la cita.
  app.post('/api/google/demo-meeting', requireAdmin, async (c) => {
    const g = engine.google;
    if (!g) throw new DomainError('google_disabled', 'Google no está configurado', 503);
    const body = z
      .object({ userId: z.string(), title: z.string().max(80).default('Reunión con cliente'), start: z.string().datetime({ offset: true }), end: z.string().datetime({ offset: true }) })
      .parse(await c.req.json());
    const out = await engine.run(async (x) => {
      const link = x.db.google?.[body.userId];
      if (!link) throw new DomainError('not_connected', 'La usuaria no conectó su calendario', 409);
      const id = await withToken(g, link, x.now.getTime(), (t) => createDemoEvent(t, body.title, new Date(body.start), new Date(body.end)));
      link.busyCache = undefined;
      return { id };
    });
    return c.json(out, 201);
  });

  // Borra solo las citas que creó el agente en el calendario conectado; las reuniones de demo quedan.
  app.post('/api/google/appointments/clear', requireAdmin, async (c) => {
    const g = engine.google;
    if (!g) throw new DomainError('google_disabled', 'Google no está configurado', 503);
    const { userId, keepLinked } = z.object({ userId: z.string(), keepLinked: z.boolean().default(false) }).parse(await c.req.json());
    const out = await engine.run(async (x) => {
      const link = x.db.google?.[userId];
      if (!link) throw new DomainError('not_connected', 'La usuaria no conectó su calendario', 409);
      // keepLinked: solo borra los huérfanos (eventos que ninguna cita vigente reconoce) y deja los de las citas actuales.
      const keep = new Set<string>();
      if (keepLinked) for (const a of Object.values(x.db.appointments)) if (a.userId === userId && a.eventId && a.status !== 'lapsed') keep.add(a.eventId);
      const deleted = await withToken(g, link, x.now.getTime(), (t) => clearAppointmentEvents(t, x.now.getTime(), keep));
      link.busyCache = undefined;
      if (!keepLinked) for (const a of Object.values(x.db.appointments)) if (a.userId === userId) a.eventId = undefined;
      return { deleted };
    });
    return c.json(out);
  });

  // ───────────── Telegram ─────────────
  app.post('/api/telegram/webhook', async (c) => {
    if (opts.telegramSecret && c.req.header('x-telegram-bot-api-secret-token') !== opts.telegramSecret) {
      return c.json({ error: { code: 'unauthorized', message: 'secret_token inválido' } }, 401);
    }
    const inbound = parseTelegramUpdate(await c.req.json().catch(() => null));
    if (!inbound) return c.json({ ok: true, ignored: true });
    const tg = engine.telegram;
    if (tg && inbound.callbackQueryId) tg.answerCallback(inbound.callbackQueryId).catch(() => undefined);

    const text = inbound.text?.trim() ?? '';
    const startCode = /^\/start(?:@\w+)?\s+(\S+)/i.exec(text)?.[1] ?? (/^\/start\b/i.test(text) ? '' : undefined);
    await engine.run(async (x) => {
      // R2: se crea una usuaria sintética por chat; no se guarda nombre ni datos de Telegram.
      let user = Object.values(x.db.users).find((u) => u.channel.type === 'telegram' && u.channel.chatId === inbound.chatId);
      const allowed = (x.db.allowedChats ??= []);
      if (user && !allowed.includes(inbound.chatId)) allowed.push(inbound.chatId); // las que ya existían quedan dentro
      if (!user) {
        // Beta cerrada: sin código de invitación no se crea nada ni se guarda el mensaje.
        if (opts.inviteCode && !allowed.includes(inbound.chatId)) {
          if (startCode !== undefined && startCode === opts.inviteCode) allowed.push(inbound.chatId);
          else {
            await tg?.sendText(inbound.chatId, T.betaClosed()).catch(() => undefined);
            return;
          }
        }
        user = engine.createUser(x, {
          id: `tg_${Math.abs(inbound.chatId)}`,
          name: 'Tú',
          channel: { type: 'telegram', chatId: inbound.chatId },
          synthetic: true,
        });
        engine.startOnboarding(x, user.id, { askName: true });
        return;
      }
      const rename = /^\/nombre(?:@\w+)?\s+(.+)/i.exec(text);
      if (/^\/nombre\b/i.test(text)) {
        const name = rename ? engine.setName(x, user.id, rename[1]!) : null;
        await tg?.sendText(inbound.chatId, name ? T.nameChanged(name) : rename ? T.nameInvalid() : T.nameUsage()).catch(() => undefined);
        return;
      }
      if (/^\/web\b/i.test(text)) {
        if (!opts.sessionSecret) {
          await tg?.sendText(inbound.chatId, T.calendarUnavailable()).catch(() => undefined);
          return;
        }
        await tg?.sendText(inbound.chatId, T.loginCode(engine.createLoginCode(x, user.id))).catch(() => undefined);
        return;
      }
      if (/^\/privacidad\b/i.test(text)) {
        await tg?.sendText(inbound.chatId, T.privacy()).catch(() => undefined);
        return;
      }
      if (/^\/borrar\b/i.test(text)) {
        await engine.handleInbound(x, user.id, { action: 'del:ask', label: '/borrar' });
        return;
      }
      if (inbound.action === 'del:yes') {
        await engine.handleInbound(x, user.id, { action: 'del:yes', tgMessageId: inbound.messageId });
        await engine.deleteUser(x, user.id);
        return;
      }
      if (/^\/start\b/i.test(text) && !user.onboarded && !user.pending) {
        engine.startOnboarding(x, user.id, { askName: user.name === 'Tú' || user.name === 'Camila' });
        return;
      }
      const isStart = /^\/start\b/i.test(text);
      await engine.handleInbound(x, user.id, isStart ? { text: 'hola' } : { text: inbound.text, action: inbound.action, tgMessageId: inbound.messageId });
    });
    return c.json({ ok: true });
  });

  app.post('/api/telegram/set-webhook', requireAdmin, async (c) => {
    const tg = engine.telegram;
    if (!tg) throw new DomainError('telegram_disabled', 'Falta TELEGRAM_BOT_TOKEN', 409);
    const { url } = z.object({ url: z.string().url() }).parse(await c.req.json());
    return c.json(await tg.setWebhook(url, opts.telegramSecret));
  });

  return app;
}
