import { buildIcs, googleCalendarUrl } from './ics.js';
import { Intent, LlmParser, classifyByRules } from './intent.js';
import { GoogleConfig, busyFromEvents, clearAppointmentEvents, deleteEvent, listEvents, upsertEvent, withToken } from './google.js';
import { describeDayType, getDayType, isValidChoice, planSplit, type Candidate, type FixedSession, type SplitChoice } from './splits.js';
import { autoDecide, type DayRoom } from './autoplan.js';
import { ASKS_SCHEDULE, mixedTravelMinutes, parseCommute, parseMeetingMention } from './advice.js';
import { buildBreak, buildRoutine, buildTravelWarmup } from './routine.js';
import { MUSCLE_GROUPS } from './splits.js';
import { Busy, PREFERRED_DAYS, withinGymHours, availableMinutes, maxFitMinutes, slotButtonLabel, nextSlots, parseWhen, renegotiationSlots } from './slots.js';
import { Store } from './store.js';
import { TelegramChannel } from './channels/telegram.js';
import { T } from './tone.js';
import { addDays, dateKey, dayName, formatSlot, formatTime, localParts, mondayOf, parseDateKey, parseHHMM, zonedToUtc } from './time.js';
import {
  Appointment,
  Button,
  DB,
  EventRec,
  EventType,
  GoogleLink,
  Message,
  OutMessage,
  User,
} from './types.js';

export interface Config {
  venue: string;
  defaultAfterMin: number;
  reminderLeadMin: number;
  lapseAfterMin: number;
  captureHour: number;
}

export const DEFAULT_CONFIG: Config = {
  venue: 'tu gym de Ñuñoa',
  /** Minutos tras la captura dominical sin respuesta para agendar por defecto (el silencio también agenda). */
  defaultAfterMin: 150,
  /** 45 min antes: cita 19:15 -> recordatorio 18:30. */
  reminderLeadMin: 45,
  lapseAfterMin: 180,
  captureHour: 20,
};

export class DomainError extends Error {
  constructor(
    public code: string,
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}

const shortId = (prefix: string) => `${prefix}_${crypto.randomUUID().slice(0, 8)}`;

export interface Ctx {
  db: DB;
  now: Date;
  outbox: Message[];
  /** Citas a sincronizar con Google Calendar al final de la operación. */
  ops: Set<string>;
  /** Eventos de Google que hay que borrar (citas reemplazadas por una nueva de la misma semana). */
  drops: Array<{ userId: string; eventId: string }>;
  /** Mensajes de Telegram a los que hay que quitarles los botones (y marcar la elección). */
  edits: Array<{ chatId: number; messageId: number; text?: string }>;
  /** Bloques ocupados del calendario real por usuaria (precargados al inicio de `run`). */
  busy: Map<string, Busy[]>;
}

export interface Inbound {
  text?: string;
  action?: string;
  label?: string;
  /** Mensaje de Telegram del que salió el botón. */
  tgMessageId?: number;
}

export interface EngineDeps {
  store: Store;
  telegram?: TelegramChannel | null;
  parser?: LlmParser | null;
  google?: GoogleConfig | null;
  config?: Partial<Config>;
}

const WEEKDAY_NAMES = [/\bdomingo\b/, /\blunes\b/, /\bmartes\b/, /\bmi[eé]rcoles\b/, /\bjueves\b/, /\bviernes\b/, /\bs[aá]bado\b/];

export class Engine {
  readonly config: Config;
  private queue: Promise<unknown> = Promise.resolve();

  constructor(private deps: EngineDeps) {
    this.config = { ...DEFAULT_CONFIG, ...deps.config };
  }

  get telegram() {
    return this.deps.telegram ?? null;
  }

  // ───────────────────────── infraestructura ─────────────────────────

  /** Serializa operaciones: carga, ejecuta, guarda, entrega por canales externos. */
  run<T>(fn: (c: Ctx) => T | Promise<T>): Promise<T> {
    const job = this.queue.then(async () => {
      const db = await this.deps.store.load();
      const c: Ctx = { db, now: new Date(Date.now() + db.clockOffsetMs), outbox: [], ops: new Set(), drops: [], edits: [], busy: new Map() };
      await this.loadBusy(c);
      const result = await fn(c);
      await this.syncCalendar(c);
      await this.deps.store.save(c.db);
      await this.deliver(c);
      return result;
    });
    this.queue = job.catch(() => undefined);
    return job;
  }

  /** Lectura sin guardar. */
  read<T>(fn: (c: Ctx) => T | Promise<T>): Promise<T> {
    const job = this.queue.then(async () => {
      const db = await this.deps.store.load();
      return fn({ db, now: new Date(Date.now() + db.clockOffsetMs), outbox: [], ops: new Set(), drops: [], edits: [], busy: new Map() });
    });
    this.queue = job.catch(() => undefined);
    return job;
  }

  private async deliver(c: Ctx) {
    const tg = this.deps.telegram;
    if (!tg) return;
    for (const e of c.edits) await tg.clearButtons(e.chatId, e.messageId, e.text);
    let idsChanged = false;
    for (const msg of c.outbox) {
      const user = c.db.users[msg.userId];
      if (!user || user.channel.type !== 'telegram' || user.channel.chatId == null) continue;
      try {
        let ics: string | undefined;
        if (msg.attachment) {
          const appt = c.db.appointments[msg.attachment.apptId];
          if (appt?.startsAt) ics = buildIcs(appt, user, c.now);
        }
        const tgId = await tg.send(user.channel.chatId, msg, ics);
        if (tgId != null) {
          const stored = c.db.messages.find((m) => m.id === msg.id);
          if (stored) stored.tgMessageId = tgId;
          idsChanged = true;
        }
        console.log(JSON.stringify({ evt: 'tg_sent', userId: user.id, msg: msg.id, ics: !!ics }));
      } catch (err) {
        console.error(JSON.stringify({ evt: 'tg_error', userId: user.id, msg: msg.id, message: (err as Error).message }));
      }
    }
    if (idsChanged) await this.deps.store.save(c.db);
  }

  /** Quita los botones de mensajes anteriores (los que cumplan `pred`) y, en Telegram, los borra del chat. */
  private clearButtons(c: Ctx, userId: string, pred: (action: string) => boolean) {
    const user = c.db.users[userId];
    for (const m of c.db.messages) {
      if (m.userId !== userId || m.dir !== 'out' || !m.buttons?.some((b) => b.action && pred(b.action))) continue;
      m.buttons = undefined;
      if (user?.channel.type === 'telegram' && user.channel.chatId != null && m.tgMessageId) {
        c.edits.push({ chatId: user.channel.chatId, messageId: m.tgMessageId });
      }
    }
  }

  /** Ella eligió un botón: ese mensaje queda con la elección marcada y sin botones. Devuelve la etiqueta. */
  private consumeButton(c: Ctx, userId: string, action: string, tgMessageId?: number): string | undefined {
    const candidates = c.db.messages.filter((m) => m.userId === userId && m.dir === 'out' && m.buttons?.some((b) => b.action === action));
    const msg = (tgMessageId != null && candidates.find((m) => m.tgMessageId === tgMessageId)) || candidates.at(-1);
    if (!msg) return undefined;
    const label = msg.buttons!.find((b) => b.action === action)!.label;
    msg.chosen = label;
    msg.buttons = undefined;
    const user = c.db.users[userId];
    if (user?.channel.type === 'telegram' && user.channel.chatId != null && (msg.tgMessageId ?? tgMessageId) != null) {
      c.edits.push({ chatId: user.channel.chatId, messageId: (msg.tgMessageId ?? tgMessageId)!, text: `${msg.text}\n\n✔ ${label}` });
    }
    return label;
  }

  private emit(c: Ctx, userId: string, out: OutMessage): Message {
    // Botones nuevos reemplazan a los anteriores: el chat no acumula opciones viejas.
    if (out.buttons?.some((b) => b.action)) this.clearButtons(c, userId, () => true);
    c.db.seq += 1;
    const msg: Message = {
      ...out,
      n: c.db.seq,
      id: `m${c.db.seq}`,
      userId,
      dir: 'out',
      at: c.now.toISOString(),
    };
    c.db.messages.push(msg);
    c.outbox.push(msg);
    return msg;
  }

  private logIn(c: Ctx, userId: string, text: string) {
    c.db.seq += 1;
    c.db.messages.push({
      text,
      n: c.db.seq,
      id: `m${c.db.seq}`,
      userId,
      dir: 'in',
      at: c.now.toISOString(),
    });
  }

  private event(c: Ctx, userId: string, type: EventType, apptId?: string, data?: Record<string, unknown>) {
    const rec: EventRec = { id: shortId('e'), userId, type, at: c.now.toISOString(), apptId, data };
    c.db.events.push(rec);
  }

  private user(c: Ctx, id: string): User {
    const u = c.db.users[id];
    if (!u) throw new DomainError('user_not_found', `No existe el usuario ${id}`, 404);
    return u;
  }

  private appt(c: Ctx, id: string): Appointment {
    const a = c.db.appointments[id];
    if (!a) throw new DomainError('appointment_not_found', `No existe la cita ${id}`, 404);
    return a;
  }

  private taken(c: Ctx, userId: string, exceptId?: string): Date[] {
    return Object.values(c.db.appointments)
      .filter(
        (a) =>
          a.userId === userId &&
          a.id !== exceptId &&
          a.startsAt &&
          (a.status === 'confirmed' || a.status === 'reminded') &&
          new Date(a.startsAt).getTime() > c.now.getTime(),
      )
      .map((a) => new Date(a.startsAt!));
  }

  private upcoming(c: Ctx, userId: string): Appointment | undefined {
    return Object.values(c.db.appointments)
      .filter(
        (a) =>
          a.userId === userId &&
          a.startsAt &&
          (a.status === 'confirmed' || a.status === 'reminded') &&
          new Date(a.startsAt).getTime() > c.now.getTime() - 3 * 3600_000,
      )
      .sort((x, y) => x.startsAt!.localeCompare(y.startsAt!))[0];
  }

  /** Con Google conectado la cita ya queda en su calendario (y se mueve sola): no se manda .ics, que duplicaría el evento. */
  private icsAttachment(c: Ctx, a: Appointment) {
    if (this.isConnected(c, a.userId)) return undefined;
    return {
      kind: 'ics' as const,
      apptId: a.id,
      filename: 'la-cita.ics',
      url: `/api/appointments/${a.id}/ics`,
      gcalUrl: googleCalendarUrl(a, c.db.users[a.userId]!),
    };
  }

  // ───────────────────────── Google Calendar ─────────────────────────

  get google(): GoogleConfig | null {
    return this.deps.google ?? null;
  }

  isConnected(c: Ctx, userId: string): boolean {
    return !!c.db.google?.[userId];
  }

  private busyFor(c: Ctx, userId: string): Busy[] {
    const manual = Object.values(c.db.busy?.[userId] ?? {}).flat().map(([start, end]) => ({ start, end }));
    return [...(c.busy.get(userId) ?? []), ...manual];
  }

  /** Reemplaza los bloques ocupados que informa el front para una semana (idempotente; sin títulos: R2). */
  setBusy(c: Ctx, userId: string, weekOf: string, intervals: Array<[number, number]>) {
    this.user(c, userId);
    c.db.busy ??= {};
    const byWeek = (c.db.busy[userId] ??= {});
    if (intervals.length) byWeek[weekOf] = intervals;
    else delete byWeek[weekOf];
  }

  /** Reglas de la sesión (merge). Las reglas nuevas aplican a las próximas propuestas, no a citas ya agendadas. */
  setPreferences(c: Ctx, userId: string, prefs: Partial<Pick<User, 'gymHours' | 'sessionMin' | 'perWeek' | 'days' | 'autoPlan' | 'flexTimes'>> & { window?: User['window'] }): User {
    const user = this.user(c, userId);
    if (prefs.window) user.window = prefs.window;
    if (prefs.gymHours) user.gymHours = prefs.gymHours;
    if (prefs.sessionMin !== undefined) user.sessionMin = prefs.sessionMin;
    if (prefs.perWeek !== undefined) user.perWeek = prefs.perWeek;
    if (prefs.autoPlan !== undefined) user.autoPlan = prefs.autoPlan;
    if (prefs.flexTimes !== undefined) user.flexTimes = prefs.flexTimes;
    if (prefs.days) user.days = [...new Set(prefs.days)].sort();
    // La hora preferida tiene que seguir cayendo dentro de la ventana.
    const [ps, pe] = [user.window.start, user.window.end];
    if (user.preferredTime < ps || user.preferredTime >= pe) user.preferredTime = ps;
    return user;
  }

  /** Botón-enlace para conectar el calendario (solo si Google está configurado y aún no está conectado). */
  private connectButton(c: Ctx, user: User): Button | null {
    const g = this.google;
    if (!g || this.isConnected(c, user.id)) return null;
    return { label: '📅 Conectar mi calendario', action: '', url: `${g.publicUrl}/api/google/connect?userId=${encodeURIComponent(user.id)}` };
  }

  /** Precarga (con caché de 60 s) los bloques ocupados de las usuarias con calendario conectado. */
  private async loadBusy(c: Ctx) {
    const g = this.google;
    const links = c.db.google;
    if (!g || !links) return;
    for (const [userId, link] of Object.entries(links)) {
      const cache = link.busyCache;
      if (cache && c.now.getTime() - cache.at < 60_000) {
        c.busy.set(userId, cache.intervals.map(([start, end]) => ({ start, end })));
        continue;
      }
      try {
        const intervals = await withToken(g, link, c.now.getTime(), (t) => busyFromEvents(t, c.now.getTime(), c.now.getTime() + 21 * 86400_000));
        link.busyCache = { at: c.now.getTime(), intervals };
        c.busy.set(userId, intervals.map(([start, end]) => ({ start, end })));
      } catch (err) {
        console.warn(JSON.stringify({ evt: 'gcal_busy_error', userId, message: (err as Error).message }));
      }
    }
  }

  /** Crea/mueve en Google Calendar las citas tocadas por esta operación (mejor esfuerzo: nunca rompe el flujo). */
  private async syncCalendar(c: Ctx) {
    const g = this.google;
    if (!g || (c.ops.size === 0 && c.drops.length === 0)) return;
    for (const d of c.drops) {
      const link = c.db.google?.[d.userId];
      if (!link) continue;
      try {
        await withToken(g, link, c.now.getTime(), (t) => deleteEvent(t, d.eventId));
        link.busyCache = undefined;
      } catch (err) {
        console.warn(JSON.stringify({ evt: 'gcal_delete_error', userId: d.userId, message: (err as Error).message }));
      }
    }
    for (const id of c.ops) {
      const appt = c.db.appointments[id];
      const link = appt && c.db.google?.[appt.userId];
      const user = appt && c.db.users[appt.userId];
      if (!appt?.startsAt || !link || !user) continue;
      try {
        appt.eventId = await withToken(g, link, c.now.getTime(), (t) => upsertEvent(t, appt, user));
        link.busyCache = undefined; // el calendario cambió: refrescar la próxima vez
      } catch (err) {
        console.warn(JSON.stringify({ evt: 'gcal_sync_error', apptId: id, message: (err as Error).message }));
      }
    }
  }

  /** Guarda la conexión y sincroniza las citas futuras ya agendadas. */
  connectGoogle(c: Ctx, userId: string, link: GoogleLink) {
    this.user(c, userId);
    c.db.google = { ...(c.db.google ?? {}), [userId]: link };
    for (const a of Object.values(c.db.appointments)) {
      if (a.userId === userId && a.startsAt && (a.status === 'confirmed' || a.status === 'reminded') && new Date(a.startsAt) > c.now) {
        c.ops.add(a.id);
      }
    }
    this.emit(c, userId, { text: T.calendarConnected() });
    const u = c.db.users[userId];
    if (u?.pending?.kind === 'onboarding') this.finishOnboarding(c, u);
  }

  disconnectGoogle(c: Ctx, userId: string) {
    this.user(c, userId);
    if (c.db.google) delete c.db.google[userId];
  }

  // ───────────────────────── bienvenida, acceso web y datos ─────────────────────────

  /** Nombre o apodo elegido por ella: solo letras, números y espacios, 1 a 24 caracteres. Null si no sirve. */
  static cleanName(raw: string): string | null {
    const t = raw.replace(/[^\p{L}\p{N} ._'-]/gu, '').replace(/\s+/g, ' ').trim();
    if (t.length < 1 || t.length > 24 || !/[\p{L}]/u.test(t)) return null;
    return t.charAt(0).toUpperCase() + t.slice(1);
  }

  setName(c: Ctx, userId: string, raw: string): string | null {
    const name = Engine.cleanName(raw);
    if (!name) return null;
    this.user(c, userId).name = name;
    return name;
  }

  /** Primer contacto de una usuaria nueva: bienvenida, cuántas veces por semana y, si hay Google, conectar calendario. */
  startOnboarding(c: Ctx, userId: string, opts: { askName?: boolean } = {}) {
    const user = this.user(c, userId);
    this.emit(c, userId, { text: T.welcome() });
    if (opts.askName) {
      // Telegram no nos da (ni guardamos) su nombre: se lo preguntamos, y ella decide cómo llamarse.
      user.pending = { kind: 'onboarding', step: 'name' };
      this.emit(c, userId, { text: T.askName() });
      return;
    }
    user.pending = { kind: 'onboarding', step: 'perWeek' };
    this.emit(c, userId, {
      text: T.askPerWeek(),
      buttons: [1, 2, 3].map((n) => ({ label: T.btn.perWeek(n), action: `pw:${n}` })),
    });
  }

  private finishOnboarding(c: Ctx, user: User) {
    user.onboarded = true;
    user.pending = null;
    this.emit(c, user.id, { text: T.onboardDone() });
    try {
      this.startCapture(c, user.id);
    } catch {
      // sin huecos esta semana: el domingo se le escribe igual
    }
  }

  private handleOnboardingAction(c: Ctx, user: User, action: string): boolean {
    const m = /^pw:([123])$/.exec(action);
    if (m) {
      user.perWeek = Number(m[1]);
      const connect = this.connectButton(c, user);
      if (connect) {
        user.pending = { kind: 'onboarding', step: 'calendar' };
        this.emit(c, user.id, { text: T.askCalendar(), buttons: [connect, { label: T.btn.later, action: 'later' }] });
      } else {
        this.finishOnboarding(c, user);
      }
      return true;
    }
    if (action === 'later') {
      this.finishOnboarding(c, user);
      return true;
    }
    return false;
  }

  /** Código de 6 dígitos de un solo uso (10 min) para entrar a la web como esta usuaria. */
  createLoginCode(c: Ctx, userId: string): string {
    this.user(c, userId);
    const codes = (c.db.loginCodes ??= {});
    for (const [k, v] of Object.entries(codes)) if (v.exp < c.now.getTime() || v.userId === userId) delete codes[k];
    const n = crypto.getRandomValues(new Uint32Array(1))[0]! % 1_000_000;
    const code = String(n).padStart(6, '0');
    codes[code] = { userId, exp: c.now.getTime() + 10 * 60_000 };
    return code;
  }

  /** Canjea un código: devuelve el userId o null. Frena adivinanzas (máx. 10 fallos cada 10 min). */
  exchangeLoginCode(c: Ctx, code: string): string | null {
    const now = Date.now();
    const fails = (c.db.loginFailures ??= []).filter((t) => now - t < 10 * 60_000);
    c.db.loginFailures = fails;
    if (fails.length >= 10) throw new DomainError('too_many_attempts', 'Demasiados intentos. Espera unos minutos.', 429);
    const entry = c.db.loginCodes?.[code];
    if (!entry || entry.exp < c.now.getTime()) {
      fails.push(now);
      return null;
    }
    delete c.db.loginCodes![code];
    return entry.userId;
  }

  /** Borra todo de una usuaria: citas, chat, conexión de calendario (revocada) y sus eventos en Google. */
  async deleteUser(c: Ctx, userId: string) {
    const user = this.user(c, userId);
    const chatId = user.channel.type === 'telegram' ? user.channel.chatId : undefined;
    const g = this.google;
    const link = c.db.google?.[userId];
    if (g && link) {
      try {
        await withToken(g, link, c.now.getTime(), (t) => clearAppointmentEvents(t, c.now.getTime()));
      } catch (err) {
        console.warn(JSON.stringify({ evt: 'gcal_delete_user_error', message: (err as Error).message }));
      }
      try {
        await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(link.refreshToken)}`, { method: 'POST' });
      } catch {
        // la revocación es un extra: igual se borra el permiso guardado
      }
    }
    if (chatId != null && this.deps.telegram) {
      await this.deps.telegram.sendText(chatId, T.deleted()).catch(() => undefined);
    }
    for (const a of Object.values(c.db.appointments)) if (a.userId === userId) delete c.db.appointments[a.id];
    c.db.messages = c.db.messages.filter((m) => m.userId !== userId);
    c.db.events = c.db.events.filter((e) => e.userId !== userId);
    if (c.db.google) delete c.db.google[userId];
    if (c.db.busy) delete c.db.busy[userId];
    for (const [k, v] of Object.entries(c.db.loginCodes ?? {})) if (v.userId === userId) delete c.db.loginCodes![k];
    if (chatId != null) c.db.allowedChats = (c.db.allowedChats ?? []).filter((x) => x !== chatId);
    delete c.db.users[userId];
    c.outbox = c.outbox.filter((m) => m.userId !== userId);
    c.edits = [];
  }

  // ───────────────────────── usuarios ─────────────────────────

  createUser(
    c: Ctx,
    input: Partial<Pick<User, 'id' | 'name' | 'gym' | 'monthlyFee' | 'channel' | 'synthetic' | 'preferredTime'>> = {},
  ): User {
    const id = input.id ?? shortId('u');
    if (c.db.users[id]) return c.db.users[id]!;
    const user: User = {
      id,
      name: input.name ?? 'Tú',
      gym: input.gym ?? 'Gym Ñuñoa (demo)',
      monthlyFee: input.monthlyFee ?? 34900,
      plannedVisitsPerMonth: 3,
      window: { start: '19:00', end: '21:00' },
      flexTimes: true,
      gymHours: { open: '05:30', close: '23:00' },
      preferredTime: input.preferredTime ?? '19:15',
      channel: input.channel ?? { type: 'sim' },
      synthetic: input.synthetic ?? true,
      consecutiveMoves: 0,
      pending: null,
      createdAt: c.now.toISOString(),
    };
    c.db.users[id] = user;
    return user;
  }

  // ───────────────────────── M1: captura dominical ─────────────────────────

  startCapture(c: Ctx, userId: string, opts: { extraBusy?: Busy[]; describe?: (options: Date[]) => string } = {}): Appointment {
    const user = this.user(c, userId);
    const busy = [...this.busyFor(c, userId), ...(opts.extraBusy ?? [])];
    // Reemplaza una propuesta anterior sin respuesta.
    for (const a of Object.values(c.db.appointments)) {
      if (a.userId === userId && a.status === 'proposed') delete c.db.appointments[a.id];
    }
    // La semana objetivo es la del primer horario posible; el agente decide split y duración para esa semana.
    const [probe] = nextSlots(user, c.now, 1, this.taken(c, userId), busy);
    const targetMonday = probe ? mondayOf(probe) : mondayOf(new Date(c.now.getTime() + 7 * 86400_000));
    this.autoPlanWeek(c, user, targetMonday);
    const options = nextSlots(user, c.now, 2, this.taken(c, userId), busy);
    if (options.length === 0) throw new DomainError('no_slots', 'No hay horarios disponibles', 409);
    const flexLabels = !!user.flexTimes && busy.length > 0;
    const appt: Appointment = {
      id: shortId('a'),
      userId,
      startsAt: null,
      durationMin: user.sessionMin ?? 40,
      venue: this.config.venue,
      content: '3 máquinas que ya conoces',
      status: 'proposed',
      source: 'user',
      options: options.map((d) => d.toISOString()),
      moves: [],
      weekOf: mondayOf(options[0]!),
      createdAt: c.now.toISOString(),
    };
    c.db.appointments[appt.id] = appt;
    user.pending = { kind: 'capture', apptId: appt.id, sentAt: c.now.toISOString() };

    const buttons: Button[] = [
      ...options.map((d) => ({ label: flexLabels ? slotButtonLabel(d) : formatSlot(d), action: `slot:${appt.id}:${d.toISOString()}` })),
      { label: T.btn.otherHour, action: 'other_hour' },
      { label: T.btn.skipWeek, action: 'skip_week' },
    ];
    const connect = this.connectButton(c, user);
    if (connect) buttons.push(connect);
    this.event(c, userId, 'capture_sent', appt.id);
    const text = opts.describe ? opts.describe(options) : flexLabels ? T.captureFlex(user.name, user.sessionMin ?? 40) : T.capture(user.name, user.sessionMin ?? 40);
    this.emit(c, userId, { text, buttons });
    return appt;
  }

  /**
   * Foco de la cita según el split: corre el mismo planificador que la web sobre los días de esa semana
   * (los que la usuaria marcó, más el de la cita) y toma el foco de la fecha de la cita. R4: sin foco mientras dure la pausa por dolor.
   */
  /**
   * El agente decide el split y la duración de la semana `monday` mirando el calendario (pedido §6 del front).
   * Solo si ella dijo cuántas veces quiere ir (`perWeek`) y no pasó a modo manual (`autoPlan: false`).
   * No toca una semana empezada (alguna cita ya llegó a su hora) ni guarda una decisión sin sesiones.
   */
  private autoPlanWeek(c: Ctx, user: User, monday: string) {
    if (user.autoPlan === false || user.perWeek == null) return;
    const local = (iso: string) => dateKey(localParts(new Date(iso)));
    const inWeek = Object.values(c.db.appointments).filter(
      (a) => a.userId === user.id && a.weekOf === monday && a.startsAt && a.status !== 'lapsed' && a.status !== 'skipped' && a.status !== 'proposed',
    );
    if (inWeek.some((a) => new Date(a.startsAt!).getTime() <= c.now.getTime())) return;
    const busy = this.busyFor(c, user.id);
    const allowed = user.days?.length ? user.days : PREFERRED_DAYS;
    const mon = parseDateKey(monday);
    const probe = { ...user, sessionMin: 60 };
    const rooms: DayRoom[] = [];
    for (let i = 0; i < 7; i++) {
      const d = addDays(mon, i);
      const date = dateKey(d);
      const booked = inWeek.find((a) => local(a.startsAt!) === date);
      if (booked) {
        // El hueco de la cita, sin contarse a sí misma.
        const free = availableMinutes(probe, new Date(booked.startsAt!), busy, this.taken(c, user.id, booked.id));
        rooms.push({ date, booked: true, maxMin: [60, 50, 40, 30].find((len) => len <= free) ?? 0 });
      } else {
        rooms.push({ date, booked: false, maxMin: allowed.includes(d.weekday) ? maxFitMinutes(user, d, c.now, busy, this.taken(c, user.id)) : 0 });
      }
    }
    const decision = autoDecide(user.perWeek, rooms, []);
    if (!decision.plan.sessions.length) return;
    user.split = { id: decision.choice.id, sessions: decision.choice.sessions };
    user.sessionMin = decision.sessionMin;
    this.refocus(c, user);
  }

  private assignFocus(c: Ctx, user: User, appt: Appointment) {
    this.computeFocus(c, user, appt);
    this.computeRoutine(c, user, appt);
  }

  /**
   * Rutina con el tiempo libre real: desde la hora de la cita hasta el próximo bloque ocupado, la próxima cita
   * o el cierre del gym, con tope en la duración elegida. Si el hueco es menor, la cita se acorta a lo que cabe.
   * R4: con pausa por dolor no se arma rutina.
   */
  private computeRoutine(c: Ctx, user: User, appt: Appointment) {
    appt.routine = undefined;
    if (user.painPause || !appt.startsAt) return;
    const free = availableMinutes(user, new Date(appt.startsAt), this.busyFor(c, user.id), this.taken(c, user.id, appt.id));
    const minutes = Math.floor(free / 5) * 5;
    const groups = (appt.focus?.groups ?? MUSCLE_GROUPS) as typeof MUSCLE_GROUPS;
    const variant = Math.floor(Date.parse(appt.weekOf) / (7 * 86400_000));
    const routine = buildRoutine(minutes, groups, variant);
    if (!routine) return;
    appt.routine = routine;
    appt.durationMin = routine.minutes;
  }

  /** Minutos libres antes de la cita: desde que termina la reunión anterior (máx. 3 h antes). Sin reuniones, se asume el tope. */
  private freeBefore(c: Ctx, user: User, appt: Appointment): number {
    const start = new Date(appt.startsAt!).getTime();
    const prevEnd = this.busyFor(c, user.id)
      .filter((b) => b.end <= start && b.end > start - 3 * 3600_000)
      .reduce((m, b) => Math.max(m, b.end), 0);
    return prevEnd ? Math.floor((start - prevEnd) / 60_000) : 20;
  }

  private travelWarmupText(c: Ctx, user: User, appt: Appointment | undefined): string {
    if (user.commute) {
      // Su trayecto real: camina la mayor parte y trota un tramo. Sale con ese tiempo de anticipación.
      const m = mixedTravelMinutes(user.commute);
      return T.travelWarmup({ walkMin: m.walkPart, jogMin: m.jogPart, mobilityMin: 5, leaveMin: m.total });
    }
    const minutes = appt?.startsAt ? this.freeBefore(c, user, appt) : 20;
    return T.travelWarmup(buildTravelWarmup(minutes));
  }

  private routineText(appt: Appointment): string | undefined {
    if (!appt.routine) return undefined;
    return T.routine(appt.routine, appt.focus?.label);
  }

  private computeFocus(c: Ctx, user: User, appt: Appointment) {
    appt.focus = undefined;
    if (!user.split || user.painPause || !appt.startsAt || !isValidChoice(user.split as SplitChoice)) return;
    const local = (iso: string) => dateKey(localParts(new Date(iso)));
    const day = local(appt.startsAt);
    const monday = parseDateKey(appt.weekOf);
    const allowed = user.days?.length ? user.days : PREFERRED_DAYS;
    const candidates: Candidate[] = [];
    for (let i = 0; i < 7; i++) {
      const d = addDays(monday, i);
      const key = dateKey(d);
      if (key === day || allowed.includes(d.weekday)) candidates.push({ date: key, booked: key === day });
    }
    const fixed: FixedSession[] = [];
    for (const a of Object.values(c.db.appointments)) {
      if (a.userId !== user.id || a.id === appt.id || a.weekOf !== appt.weekOf || !a.startsAt || !a.focus) continue;
      if (a.status === 'lapsed' || a.status === 'skipped') continue;
      fixed.push({ date: local(a.startsAt), dayTypeId: a.focus.dayTypeId });
    }
    const hit = planSplit(user.split as SplitChoice, candidates, fixed).sessions.find((s) => s.date === day);
    if (hit) appt.focus = { dayTypeId: hit.dayType.id, label: hit.dayType.label, groups: [...hit.dayType.groups] };
  }

  private focusText(appt: Appointment): string | undefined {
    const dt = appt.focus && getDayType(appt.focus.dayTypeId);
    return dt ? describeDayType(dt).replace(' · ', ': ') : undefined;
  }

  /** Guarda el split y recalcula el foco de las citas que vienen. */
  setSplit(c: Ctx, userId: string, split: SplitChoice) {
    const user = this.user(c, userId);
    user.split = { id: split.id, sessions: split.sessions };
    this.refocus(c, user);
  }

  private refocus(c: Ctx, user: User) {
    const upcoming = Object.values(c.db.appointments)
      .filter((a) => a.userId === user.id && a.startsAt && new Date(a.startsAt) > c.now && (a.status === 'confirmed' || a.status === 'reminded'))
      .sort((a, b) => a.startsAt!.localeCompare(b.startsAt!));
    for (const a of upcoming) {
      a.focus = undefined;
      a.routine = undefined;
    } // se recalculan en orden, cada una respetando las anteriores
    for (const a of upcoming) this.assignFocus(c, user, a);
  }

  /**
   * El agente agenda una cita por semana: si ella elige una nueva y ya tenía otra vigente esa semana (por ejemplo
   * empezó de nuevo con /start), la anterior se reemplaza y se borra su evento de Google, para que no queden dos.
   */
  private supersede(c: Ctx, user: User, appt: Appointment) {
    for (const old of Object.values(c.db.appointments)) {
      if (old.id === appt.id || old.userId !== user.id || old.weekOf !== appt.weekOf) continue;
      if (old.status !== 'confirmed' && old.status !== 'reminded') continue;
      if (!old.startsAt || new Date(old.startsAt).getTime() <= c.now.getTime()) continue;
      if (old.eventId) c.drops.push({ userId: user.id, eventId: old.eventId });
      delete c.db.appointments[old.id];
    }
  }

  /** Confirma o mueve una cita a una hora concreta. */
  private place(c: Ctx, user: User, appt: Appointment, when: Date, source: Appointment['source'], auto?: { from: Date }) {
    const wasMove = appt.startsAt != null && appt.startsAt !== when.toISOString();
    if (wasMove) appt.moves.push({ from: appt.startsAt!, to: when.toISOString(), at: c.now.toISOString() });
    appt.startsAt = when.toISOString();
    appt.status = 'confirmed';
    appt.source = source;
    appt.weekOf = mondayOf(when);
    if (!wasMove) this.supersede(c, user, appt);
    appt.conflictNoticed = undefined;
    this.clearButtons(c, user.id, (a) => a.startsWith('slot:') || a === 'other_hour' || a === 'skip_week' || a === 'move' || a === 'done');
    if (auto) appt.autoShifts = (appt.autoShifts ?? 0) + 1;
    this.assignFocus(c, user, appt);
    user.pending = null;
    c.ops.add(appt.id);
    this.event(c, user.id, wasMove ? 'moved' : 'slot_chosen', appt.id, { to: appt.startsAt, ...(auto ? { auto: true } : {}) });
    const connected = this.isConnected(c, user.id);
    const label = formatSlot(when);
    this.emit(c, user.id, {
      text: auto
        ? T.autoShifted(formatSlot(auto.from), label)
        : wasMove
          ? connected
            ? T.movedCal(label)
            : T.moved(label)
          : connected
            ? T.slotChosenCal(label, appt.venue)
            : T.slotChosen(label, appt.venue),
      attachment: this.icsAttachment(c, appt),
    });
  }

  chooseSlot(c: Ctx, userId: string, apptId: string, iso: string) {
    const user = this.user(c, userId);
    const appt = this.appt(c, apptId);
    const when = new Date(iso);
    if (appt.userId !== userId) throw new DomainError('forbidden', 'La cita no pertenece al usuario', 403);
    if (Number.isNaN(when.getTime())) throw new DomainError('bad_slot', 'Hora inválida');
    this.place(c, user, appt, when, appt.startsAt ? 'move' : 'user');
    return appt;
  }

  /** El silencio también agenda: slot favorito de las últimas 4 semanas (opt-out). */
  applyDefault(c: Ctx, userId: string) {
    const user = this.user(c, userId);
    if (user.pending?.kind !== 'capture') {
      throw new DomainError('nothing_pending', 'No hay una captura sin respuesta', 409);
    }
    const appt = this.appt(c, user.pending.apptId);
    const since = c.now.getTime() - 28 * 86400_000;
    const tally = new Map<number, number>();
    for (const a of Object.values(c.db.appointments)) {
      if (a.userId !== userId || a.status !== 'done' || !a.startsAt) continue;
      if (new Date(a.startsAt).getTime() < since) continue;
      const wd = localParts(new Date(a.startsAt)).weekday;
      tally.set(wd, (tally.get(wd) ?? 0) + 1);
    }
    const ranked = [...appt.options].sort(
      (x, y) => (tally.get(localParts(new Date(y)).weekday) ?? 0) - (tally.get(localParts(new Date(x)).weekday) ?? 0),
    );
    const chosen = new Date(ranked[0] ?? appt.options[0]!);
    appt.startsAt = chosen.toISOString();
    appt.status = 'confirmed';
    appt.source = 'default';
    appt.weekOf = mondayOf(chosen);
    this.supersede(c, user, appt);
    this.assignFocus(c, user, appt);
    user.pending = null;
    c.ops.add(appt.id);
    this.event(c, userId, 'default_applied', appt.id, { to: appt.startsAt });
    this.emit(c, userId, {
      text: T.defaultApplied(formatSlot(chosen), appt.venue),
      attachment: this.icsAttachment(c, appt),
      buttons: [{ label: T.btn.move, action: 'move' }],
    });
    return appt;
  }

  // ───────────────────────── M3: recordatorio ─────────────────────────

  sendReminder(c: Ctx, userId: string, apptId?: string) {
    this.user(c, userId);
    const appt = apptId ? this.appt(c, apptId) : this.upcoming(c, userId);
    if (!appt?.startsAt) throw new DomainError('no_appointment', 'No hay cita próxima', 409);
    appt.status = 'reminded';
    this.event(c, userId, 'reminder_sent', appt.id);
    this.emit(c, userId, {
      text: T.reminder(formatTime(new Date(appt.startsAt)), appt.durationMin, this.focusText(appt)),
      buttons: [
        { label: T.btn.move, action: 'move' },
        { label: T.btn.done, action: 'done' },
      ],
    });
    const routine = this.routineText(appt);
    if (routine) this.emit(c, userId, { text: routine });
    const user = this.user(c, userId);
    if (!user.painPause) this.emit(c, userId, { text: this.travelWarmupText(c, user, appt) });
    return appt;
  }

  // ───────────────────────── M4: MUEVE ─────────────────────────

  move(c: Ctx, userId: string, apptId?: string, opts: { afterToday?: boolean } = {}) {
    const user = this.user(c, userId);
    const appt = apptId ? this.appt(c, apptId) : this.upcoming(c, userId);
    if (!appt?.startsAt) {
      this.emit(c, userId, { text: T.noAppointment(), buttons: [{ label: T.btn.propose, action: 'propose' }] });
      return null;
    }
    const current = new Date(appt.startsAt);

    // Regla anti-snooze: tras 2 MUEVEs seguidos sin visita no se repite el mismo slot.
    if (user.consecutiveMoves >= 2) {
      const opts = renegotiationSlots(user, c.now, this.taken(c, userId, appt.id), this.busyFor(c, userId));
      if (opts.length >= 2) {
        user.pending = { kind: 'renegotiate', apptId: appt.id };
        this.event(c, userId, 'renegotiation_opened', appt.id);
        this.emit(c, userId, {
          text: T.renegotiate(formatSlot(opts[0]!), formatSlot(opts[1]!)),
          buttons: [
            ...opts.map((d) => ({ label: formatSlot(d), action: `slot:${appt.id}:${d.toISOString()}` })),
            { label: T.btn.otherHour, action: 'other_hour' },
          ],
        });
        return appt;
      }
    }

    let from = new Date(Math.max(c.now.getTime(), current.getTime()));
    if (opts.afterToday) {
      // "Hoy no puedo": el nuevo horario no puede ser hoy.
      const t = localParts(c.now);
      const tomorrow = addDays(t, 1);
      from = new Date(Math.max(from.getTime(), zonedToUtc(tomorrow.year, tomorrow.month, tomorrow.day, 0, 0).getTime()));
    }
    let [next] = nextSlots(user, from, 1, this.taken(c, userId, appt.id), this.busyFor(c, userId));
    if (next && mondayOf(next) !== appt.weekOf) {
      this.autoPlanWeek(c, user, mondayOf(next));
      [next] = nextSlots(user, from, 1, this.taken(c, userId, appt.id), this.busyFor(c, userId));
    }
    if (!next) {
      user.pending = { kind: 'other_hour', apptId: appt.id };
      this.emit(c, userId, { text: T.noSlotForMove() });
      return appt;
    }
    user.consecutiveMoves += 1;
    this.place(c, user, appt, next, 'move');
    return appt;
  }

  // ───────────────────────── listo / M6 ─────────────────────────

  markDone(c: Ctx, userId: string, apptId?: string) {
    const user = this.user(c, userId);
    let appt: Appointment | undefined = apptId ? this.appt(c, apptId) : undefined;
    if (!appt) {
      appt = Object.values(c.db.appointments)
        .filter(
          (a) =>
            a.userId === userId &&
            a.startsAt &&
            (a.status === 'confirmed' || a.status === 'reminded') &&
            Math.abs(new Date(a.startsAt).getTime() - c.now.getTime()) < 36 * 3600_000,
        )
        .sort(
          (x, y) =>
            Math.abs(new Date(x.startsAt!).getTime() - c.now.getTime()) -
            Math.abs(new Date(y.startsAt!).getTime() - c.now.getTime()),
        )[0];
    }
    if (!appt) {
      this.emit(c, userId, { text: T.noAppointment(), buttons: [{ label: T.btn.propose, action: 'propose' }] });
      return null;
    }
    appt.status = 'done';
    appt.doneAt = c.now.toISOString();
    this.clearButtons(c, userId, (a) => a === 'move' || a === 'done');
    user.consecutiveMoves = 0;
    this.event(c, userId, 'done', appt.id);
    const recovered = user.monthlyFee / user.plannedVisitsPerMonth;
    this.emit(c, userId, { text: T.done(recovered, user.monthlyFee) });
    return appt;
  }

  skipWeek(c: Ctx, userId: string) {
    const user = this.user(c, userId);
    const p = user.pending;
    if (p && 'apptId' in p) {
      const a = c.db.appointments[p.apptId];
      if (a && a.status === 'proposed') a.status = 'skipped';
    }
    user.pending = null;
    this.clearButtons(c, userId, (a) => a.startsWith('slot:') || a === 'other_hour' || a === 'skip_week');
    this.event(c, userId, 'week_skipped');
    this.emit(c, userId, { text: T.weekSkipped() });
  }

  // ───────────────────────── entrada de mensajes ─────────────────────────

  async handleInbound(c: Ctx, userId: string, input: Inbound): Promise<Message[]> {
    const user = this.user(c, userId);
    const before = c.db.seq;
    const text = (input.text ?? '').trim();
    const chosen = input.action ? this.consumeButton(c, userId, input.action, input.tgMessageId) : undefined;
    this.logIn(c, userId, input.label ?? chosen ?? (text || `[${input.action ?? 'vacío'}]`));

    if (input.action) {
      this.handleAction(c, user, input.action);
    } else {
      await this.handleText(c, user, text);
    }
    return c.db.messages.filter((m) => m.userId === userId && m.dir === 'out' && m.n > before);
  }

  private handleAction(c: Ctx, user: User, action: string) {
    if (action.startsWith('slot:')) {
      const [, apptId, ...rest] = action.split(':');
      const iso = rest.join(':');
      if (!apptId || !iso) throw new DomainError('bad_action', 'Acción de horario inválida');
      this.chooseSlot(c, user.id, apptId, iso);
      return;
    }
    if (this.handleOnboardingAction(c, user, action)) return;
    switch (action) {
      case 'del:ask':
        this.emit(c, user.id, {
          text: T.deleteAsk(),
          buttons: [
            { label: T.btn.deleteYes, action: 'del:yes' },
            { label: T.btn.deleteNo, action: 'del:no' },
          ],
        });
        return;
      case 'del:no':
        this.emit(c, user.id, { text: T.deleteCancelled() });
        return;
      case 'del:yes':
        return; // lo ejecuta el webhook (es asíncrono y borra al usuario)
      case 'other_hour': {
        const p = user.pending;
        if (p && 'apptId' in p) user.pending = { kind: 'other_hour', apptId: p.apptId };
        this.emit(c, user.id, { text: T.askOtherHour() });
        return;
      }
      case 'skip_week':
        return this.skipWeek(c, user.id);
      case 'move':
        this.move(c, user.id);
        return;
      case 'done':
        this.markDone(c, user.id);
        return;
      case 'propose':
        this.startCapture(c, user.id);
        return;
      default:
        throw new DomainError('bad_action', `Acción desconocida: ${action}`);
    }
  }

  /** Lo que hay en su calendario los próximos 7 días (reuniones y citas), en texto de plantilla. */
  private async scheduleText(c: Ctx, user: User): Promise<string> {
    type Row = { start: number; end: number; title: string };
    const rows: Row[] = [];
    const g = this.google;
    const link = c.db.google?.[user.id];
    if (g && link) {
      try {
        const events = await withToken(g, link, c.now.getTime(), (t) => listEvents(t, c.now.getTime(), c.now.getTime() + 7 * 86400_000));
        for (const e of events as any[]) {
          if (e.cancelled || e.transparent || !e.start?.includes('T')) continue;
          rows.push({ start: Date.parse(e.start), end: Date.parse(e.end), title: e.isLaCita ? 'Tu cita contigo' : e.title || 'Ocupado' });
        }
      } catch (err) {
        console.warn(JSON.stringify({ evt: 'gcal_list_error', userId: user.id, message: (err as Error).message }));
      }
    }
    if (!rows.length) {
      for (const a of Object.values(c.db.appointments)) {
        if (a.userId === user.id && a.startsAt && (a.status === 'confirmed' || a.status === 'reminded') && new Date(a.startsAt) > c.now) {
          rows.push({ start: Date.parse(a.startsAt), end: Date.parse(a.startsAt) + a.durationMin * 60_000, title: 'Tu cita contigo' });
        }
      }
    }
    rows.sort((x, y) => x.start - y.start);
    if (!rows.length) return T.scheduleEmpty();
    const lines = rows.slice(0, 12).map((r) => {
      const p = localParts(new Date(r.start));
      return `• ${dayName(p.weekday)} ${p.day}, ${formatTime(new Date(r.start))}–${formatTime(new Date(r.end))}: ${r.title}`;
    });
    return [T.scheduleHeader(), ...lines].join('\n');
  }

  /**
   * «¿Qué tengo agendado? / ¿qué hora me recomiendas?»: cuenta su calendario y recomienda con lo que ella contó
   * (una reunión que se puede alargar, cuánto demora en llegar). Nunca agenda sola: deja opciones para elegir.
   */
  private async advise(c: Ctx, user: User, text: string) {
    const lower = text.toLowerCase();
    const commute = parseCommute(text);
    if (commute) user.commute = commute;
    if (ASKS_SCHEDULE.test(lower)) this.emit(c, user.id, { text: await this.scheduleText(c, user) });

    const meeting = parseMeetingMention(text, c.now);
    const travel = user.commute ? mixedTravelMinutes(user.commute) : null;
    // La reunión (más lo que tarda en llegar) se cuenta como tiempo ocupado al elegir la hora.
    const extraBusy: Busy[] = meeting
      ? [{ start: meeting.start.getTime(), end: meeting.end.getTime() + (travel?.total ?? 20) * 60_000 }]
      : [];
    this.startCapture(c, user.id, {
      extraBusy,
      describe: (options) =>
        T.advice({
          meeting: meeting
            ? {
                day: `${dayName(localParts(meeting.start).weekday)} ${localParts(meeting.start).day}`,
                start: formatTime(meeting.start),
                end: formatTime(meeting.end),
                mayRunLong: meeting.mayRunLong,
              }
            : undefined,
          commute: user.commute && travel ? { walkMin: user.commute.walkMin, jogMin: user.commute.jogMin, mixed: travel.total } : undefined,
          sameDay: !!meeting && !!options[0] && dateKey(localParts(options[0])) === dateKey(localParts(meeting.start)),
          firstOption: options[0] ? formatTime(options[0]) : '',
          window: user.window,
        }),
    });
  }

  private latestProposed(c: Ctx, userId: string): Appointment | undefined {
    return Object.values(c.db.appointments)
      .filter((a) => a.userId === userId && a.status === 'proposed')
      .sort((x, y) => y.createdAt.localeCompare(x.createdAt))[0];
  }

  /** Pide al modelo el día y la hora que ella quiere cuando las reglas no los entienden. Nunca redacta texto. */
  private async guessWhen(c: Ctx, user: User, text: string): Promise<Date | null> {
    const parser = this.deps.parser;
    if (!parser?.extractWhen) return null;
    const p = localParts(c.now);
    const pad2 = (n: number) => String(n).padStart(2, '0');
    const guess = await parser.extractWhen(text, {
      weekdayName: dayName(p.weekday),
      date: dateKey(p),
      time: `${pad2(p.hour)}:${pad2(p.minute)}`,
    });
    if (!guess) return null;
    const pref = parseHHMM(user.preferredTime);
    const [hh, mm] = guess.time ? guess.time.split(':').map(Number) : [pref.hour, pref.minute];
    let day = guess.date ? parseDateKey(guess.date) : p;
    let when = zonedToUtc(day.year, day.month, day.day, hh!, mm!);
    if (!guess.date && when.getTime() < c.now.getTime() + 3600_000) {
      day = addDays(p, 1);
      when = zonedToUtc(day.year, day.month, day.day, hh!, mm!);
    }
    const ahead = when.getTime() - c.now.getTime();
    return ahead >= 3600_000 && ahead <= 21 * 86400_000 ? when : null;
  }

  /** R4: deriva a un profesional y pausa el foco por grupos hasta que ella diga que ya lo conversó. */
  private derivePain(c: Ctx, user: User) {
    this.event(c, user.id, 'pain_derivation');
    user.painPause = c.now.toISOString();
    for (const a of Object.values(c.db.appointments)) if (a.userId === user.id && a.status !== 'done') {
        a.focus = undefined;
        a.routine = undefined;
      }
    this.emit(c, user.id, { text: T.pain() });
  }

  private async handleText(c: Ctx, user: User, text: string) {
    let intent: Intent = classifyByRules(text);

    if (intent === 'resume') {
      if (user.painPause) {
        user.painPause = undefined;
        this.refocus(c, user);
        this.emit(c, user.id, { text: T.resumed() });
      } else {
        this.emit(c, user.id, { text: T.fallback() });
      }
      return;
    }

    if (intent === 'pain') {
      this.derivePain(c, user);
      return;
    }

    if (user.pending?.kind === 'onboarding' && user.pending.step === 'name') {
      const name = this.setName(c, user.id, text);
      if (!name) {
        this.emit(c, user.id, { text: T.nameInvalid() });
        return;
      }
      user.pending = { kind: 'onboarding', step: 'perWeek' };
      this.emit(c, user.id, { text: T.nameSaved(name) });
      this.emit(c, user.id, { text: T.askPerWeek(), buttons: [1, 2, 3].map((n) => ({ label: T.btn.perWeek(n), action: `pw:${n}` })) });
      return;
    }
    if (user.pending?.kind === 'onboarding') {
      // Contesta con un número o vuelve a mostrar la pregunta.
      const n = /\b([123])\b/.exec(text)?.[1];
      if (n && user.pending.step === 'perWeek') {
        this.handleOnboardingAction(c, user, `pw:${n}`);
        return;
      }
      if (user.pending.step === 'calendar') {
        this.finishOnboarding(c, user);
        return;
      }
      this.emit(c, user.id, { text: T.askPerWeek(), buttons: [1, 2, 3].map((k) => ({ label: T.btn.perWeek(k), action: `pw:${k}` })) });
      return;
    }

    // Hora o día dicho en texto libre ("martes 20:30", "cámbiala para las 20:00"). No se re-agenda una pregunta
    // ("¿qué músculos trabajo el lunes?") ni los mensajes de otra intención.
    const p = user.pending;
    const asksQuestion = /\?|^\s*(qu[eé]|cu[aá]l(es)?|cu[aá]ndo|c[oó]mo|d[oó]nde|cu[aá]nto)\b/i.test(text);
    const placeable = intent === 'unknown' || intent === 'other_hour' || intent === 'move' || intent === 'propose' || intent === 'warmup';
    const waitingHour = p?.kind === 'other_hour';
    const target = p ? c.db.appointments[p.apptId] : (this.upcoming(c, user.id) ?? this.latestProposed(c, user.id));
    if (placeable && target && (!asksQuestion || waitingHour)) {
      const lower = text.toLowerCase();
      // "No puedo a las 19:15": la hora mencionada es la que no sirve, salvo que proponga otra ("mejor el miércoles").
      const cantGo = intent === 'move' && !waitingHour && /\bno (pueda|puedo|podr[eé]|alcanzo|voy)\b/.test(lower);
      const proposesOther = /\b(mejor|prefiero|podr[ií]a|pasa(la|lo|r)?|c[aá]mbial[ao]|mu[eé]vel[ao])\b|\bpara (el|las?)\b/.test(lower);
      let when = cantGo && !proposesOther ? null : parseWhen(text, c.now, user, { requireExplicit: (intent === 'move' || intent === 'warmup') && !waitingHour });
      if (!when && this.deps.parser?.extractWhen && (waitingHour || intent === 'move' || intent === 'unknown') && /\d|ma[ñn]ana|hoy|lunes|martes|mi[eé]rcoles|jueves|viernes|s[aá]bado|domingo|noche|tarde|despu[eé]s/i.test(text)) {
        when = await this.guessWhen(c, user, text);
      }
      if (when && when.toISOString() !== target.startsAt) {
        if (!withinGymHours(user, when)) {
          // El gym está cerrado a esa hora: no se agenda; se explica y se proponen horas que sí calzan.
          const gym = user.gymHours ?? { open: '05:30', close: '23:00' };
          this.startCapture(c, user.id, { describe: () => T.outsideGym(formatTime(when), gym.open, gym.close) });
          return;
        }
        this.place(c, user, target, when, target.startsAt ? 'move' : 'user');
        if (intent === 'warmup' && !user.painPause) this.emit(c, user.id, { text: this.travelWarmupText(c, user, target) });
        return;
      }
      if (waitingHour && intent !== 'move' && intent !== 'warmup') {
        this.emit(c, user.id, { text: T.otherHourUnclear() });
        return;
      }
      if (intent === 'move' && /\bhoy\b/.test(lower)) {
        this.move(c, user.id, undefined, { afterToday: true });
        return;
      }
    }

    if (intent === 'unknown' && this.deps.parser) {
      intent = (await this.deps.parser.classify(text)) ?? 'unknown';
      if (intent === 'pain') {
        this.derivePain(c, user);
        return;
      }
    }

    switch (intent) {
      case 'move':
        this.move(c, user.id);
        return;
      case 'done':
        this.markDone(c, user.id);
        return;
      case 'skip_week':
        this.skipWeek(c, user.id);
        return;
      case 'advise':
        await this.advise(c, user, text);
        return;
      case 'warmup': {
        const next = this.upcoming(c, user.id);
        this.emit(c, user.id, { text: this.travelWarmupText(c, user, next) });
        return;
      }
      case 'routine': {
        // Si nombra un día ("el lunes"), responde por la cita de ese día; si no, por la próxima.
        const asked = WEEKDAY_NAMES.findIndex((re) => re.test(text.toLowerCase()));
        const mine = Object.values(c.db.appointments)
          .filter((a) => a.userId === user.id && a.startsAt && (a.status === 'confirmed' || a.status === 'reminded') && new Date(a.startsAt) > c.now)
          .sort((x, y) => x.startsAt!.localeCompare(y.startsAt!));
        const appt = (asked >= 0 && mine.find((a) => localParts(new Date(a.startsAt!)).weekday === asked)) || mine[0];
        const focusLine = appt ? this.focusText(appt) : undefined;
        const reply = appt ? (this.routineText(appt) ?? (focusLine ? T.focusOnly(focusLine) : undefined)) : undefined;
        this.emit(c, user.id, { text: reply ?? T.noRoutine() });
        return;
      }
      case 'connect': {
        const b = this.connectButton(c, user);
        this.emit(c, user.id, b ? { text: T.connect(), buttons: [b] } : { text: this.google ? T.alreadyConnected() : T.calendarUnavailable() });
        return;
      }
      case 'start':
      case 'propose':
        this.startCapture(c, user.id);
        return;
      default:
        this.emit(c, user.id, { text: T.fallback() });
    }
  }

  // ───────────────────────── scheduler (idempotente) ─────────────────────────

  /**
   * Un "tick" hace todo lo que toca a la hora actual (real o simulada):
   * captura dominical, cita por defecto, recordatorio del día y cierre silencioso de citas pasadas.
   * Llamarlo cada 5-15 min desde un scheduler externo (cron-job.org / GitHub Actions) o a mano en el demo.
   */
  tick(c: Ctx) {
    const actions: Array<{ userId: string; action: string; apptId?: string }> = [];
    const local = localParts(c.now);
    const nextMonday = mondayOf(new Date(c.now.getTime() + 24 * 3600_000 * ((8 - local.weekday) % 7 || 7)));

    for (const user of Object.values(c.db.users)) {
      // a. captura dominical
      if (local.weekday === 0 && local.hour >= this.config.captureHour && !user.pending) {
        const hasWeek = Object.values(c.db.appointments).some(
          (a) => a.userId === user.id && a.weekOf === nextMonday && a.status !== 'proposed',
        );
        if (!hasWeek) {
          const a = this.startCapture(c, user.id);
          actions.push({ userId: user.id, action: 'capture_sent', apptId: a.id });
        }
      }
      // b. el silencio también agenda
      if (user.pending?.kind === 'capture') {
        const elapsed = c.now.getTime() - new Date(user.pending.sentAt).getTime();
        if (elapsed >= this.config.defaultAfterMin * 60000) {
          const a = this.applyDefault(c, user.id);
          actions.push({ userId: user.id, action: 'default_applied', apptId: a.id });
        }
      }
    }

    // g. volver al hábito: dos citas seguidas sin hacerse y nada agendado → un empujón suave (una vez cada 4 días)
    for (const user of Object.values(c.db.users)) {
      if (!user.onboarded || user.pending || user.painPause || local.hour < 9 || local.hour >= 20) continue;
      if (user.lastNudgeAt && c.now.getTime() - Date.parse(user.lastNudgeAt) < 4 * 86400_000) continue;
      const mine = Object.values(c.db.appointments)
        .filter((a) => a.userId === user.id && a.startsAt && a.status !== 'skipped')
        .sort((x, y) => x.startsAt!.localeCompare(y.startsAt!));
      if (mine.some((a) => a.status === 'proposed' || a.status === 'confirmed' || a.status === 'reminded')) continue;
      const lastTwo = mine.slice(-2);
      if (lastTwo.length < 2 || !lastTwo.every((a) => a.status === 'lapsed')) continue;
      if (c.now.getTime() - Date.parse(lastTwo[1]!.startsAt!) < 2 * 86400_000) continue;
      user.lastNudgeAt = c.now.toISOString();
      this.emit(c, user.id, { text: T.comeback() });
      try {
        const a = this.startCapture(c, user.id);
        actions.push({ userId: user.id, action: 'comeback', apptId: a.id });
      } catch {
        // sin huecos: queda solo el mensaje
      }
    }

    for (const appt of Object.values(c.db.appointments)) {
      if (!appt.startsAt) continue;
      const start = new Date(appt.startsAt).getTime();
      // e. el calendario cambió y una reunión pisa la cita: la corre sola al próximo hueco (sin pedirle nada a ella)
      if ((appt.status === 'confirmed' || appt.status === 'reminded') && start > c.now.getTime() + 20 * 60_000 && start < c.now.getTime() + 7 * 86400_000) {
        const user = c.db.users[appt.userId];
        const busy = user ? this.busyFor(c, user.id) : [];
        const end = start + appt.durationMin * 60_000;
        if (user && busy.some((b) => start < b.end && end > b.start) && (appt.autoShifts ?? 0) < 2) {
          const after = new Date(Math.max(c.now.getTime() + 30 * 60_000, start + 60_000));
          const [next] = nextSlots(user, after, 1, this.taken(c, user.id, appt.id), busy, { lead: 0 });
          if (next) {
            this.place(c, user, appt, next, 'move', { from: new Date(start) });
            actions.push({ userId: user.id, action: 'auto_shift', apptId: appt.id });
            continue;
          }
          if (!appt.conflictNoticed) {
            appt.conflictNoticed = true;
            user.pending = { kind: 'other_hour', apptId: appt.id };
            this.emit(c, user.id, { text: T.autoNoSlot() });
            actions.push({ userId: user.id, action: 'conflict_notice', apptId: appt.id });
            continue;
          }
        }
      }
      // f. tiempo muerto: un hueco libre entre reuniones antes de la cita → una pausa activa (una vez por cita)
      if ((appt.status === 'confirmed' || appt.status === 'reminded') && !appt.microSent && start > c.now.getTime()) {
        const user = c.db.users[appt.userId];
        if (user && !user.painPause && dateKey(localParts(new Date(start))) === dateKey(localParts(c.now))) {
          const nowMs = c.now.getTime();
          const blocks = this.busyFor(c, user.id)
            .filter((b) => b.end > nowMs - 600_000 && b.start < start)
            .sort((x, y) => x.start - y.start);
          for (let i = 0; i < blocks.length - 1; i++) {
            const gapStart = blocks[i]!.end;
            const gapEnd = Math.min(blocks[i + 1]!.start, start - 45 * 60_000);
            const gap = Math.floor((gapEnd - gapStart) / 60_000);
            const hour = localParts(new Date(gapStart)).hour;
            if (gap >= 10 && hour >= 9 && hour < 19 && nowMs >= gapStart && nowMs <= gapStart + 10 * 60_000) {
              const moves = buildBreak(gap)!;
              appt.microSent = true;
              this.emit(c, user.id, { text: T.pausaActiva(gap, moves) });
              actions.push({ userId: user.id, action: 'micro_break', apptId: appt.id });
              break;
            }
          }
        }
      }
      // c. recordatorio único del día
      if (appt.status === 'confirmed' && c.now.getTime() >= start - this.config.reminderLeadMin * 60000 && c.now.getTime() < start) {
        this.sendReminder(c, appt.userId, appt.id);
        actions.push({ userId: appt.userId, action: 'reminder_sent', apptId: appt.id });
      }
      // d. cierre silencioso (no se exhibe como falta)
      if (
        (appt.status === 'confirmed' || appt.status === 'reminded') &&
        c.now.getTime() > start + this.config.lapseAfterMin * 60000
      ) {
        appt.status = 'lapsed';
        this.event(c, appt.userId, 'lapsed', appt.id);
        actions.push({ userId: appt.userId, action: 'lapsed', apptId: appt.id });
      }
    }
    return actions;
  }

  // ───────────────────────── reloj de demo ─────────────────────────

  setClock(c: Ctx, now: Date | null) {
    c.db.clockOffsetMs = now ? now.getTime() - Date.now() : 0;
    c.now = new Date(Date.now() + c.db.clockOffsetMs);
  }
}
