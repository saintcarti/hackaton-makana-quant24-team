import { buildIcs, googleCalendarUrl } from './ics.js';
import { Intent, LlmParser, classifyByRules } from './intent.js';
import { GoogleConfig, accessToken, freeBusy, upsertEvent } from './google.js';
import { Busy, nextSlots, parseWhen, renegotiationSlots } from './slots.js';
import { Store } from './store.js';
import { TelegramChannel } from './channels/telegram.js';
import { T } from './tone.js';
import { formatSlot, formatTime, localParts, mondayOf } from './time.js';
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
  /** Bloques ocupados del calendario real por usuaria (precargados al inicio de `run`). */
  busy: Map<string, Busy[]>;
}

export interface Inbound {
  text?: string;
  action?: string;
  label?: string;
}

export interface EngineDeps {
  store: Store;
  telegram?: TelegramChannel | null;
  parser?: LlmParser | null;
  google?: GoogleConfig | null;
  config?: Partial<Config>;
}

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
      const c: Ctx = { db, now: new Date(Date.now() + db.clockOffsetMs), outbox: [], ops: new Set(), busy: new Map() };
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
      return fn({ db, now: new Date(Date.now() + db.clockOffsetMs), outbox: [], ops: new Set(), busy: new Map() });
    });
    this.queue = job.catch(() => undefined);
    return job;
  }

  private async deliver(c: Ctx) {
    const tg = this.deps.telegram;
    if (!tg) return;
    for (const msg of c.outbox) {
      const user = c.db.users[msg.userId];
      if (!user || user.channel.type !== 'telegram' || user.channel.chatId == null) continue;
      try {
        let ics: string | undefined;
        if (msg.attachment) {
          const appt = c.db.appointments[msg.attachment.apptId];
          if (appt?.startsAt) ics = buildIcs(appt, user, c.now);
        }
        await tg.send(user.channel.chatId, msg, ics);
        console.log(JSON.stringify({ evt: 'tg_sent', userId: user.id, msg: msg.id, ics: !!ics }));
      } catch (err) {
        console.error(JSON.stringify({ evt: 'tg_error', userId: user.id, msg: msg.id, message: (err as Error).message }));
      }
    }
  }

  private emit(c: Ctx, userId: string, out: OutMessage): Message {
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

  private icsAttachment(c: Ctx, a: Appointment) {
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
  setPreferences(c: Ctx, userId: string, prefs: Partial<Pick<User, 'gymHours' | 'sessionMin' | 'perWeek' | 'days'>> & { window?: User['window'] }): User {
    const user = this.user(c, userId);
    if (prefs.window) user.window = prefs.window;
    if (prefs.gymHours) user.gymHours = prefs.gymHours;
    if (prefs.sessionMin !== undefined) user.sessionMin = prefs.sessionMin;
    if (prefs.perWeek !== undefined) user.perWeek = prefs.perWeek;
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
        const token = await accessToken(g, link, c.now.getTime());
        const intervals = await freeBusy(token, c.now.getTime(), c.now.getTime() + 21 * 86400_000);
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
    if (!g || c.ops.size === 0) return;
    for (const id of c.ops) {
      const appt = c.db.appointments[id];
      const link = appt && c.db.google?.[appt.userId];
      const user = appt && c.db.users[appt.userId];
      if (!appt?.startsAt || !link || !user) continue;
      try {
        const token = await accessToken(g, link, c.now.getTime());
        appt.eventId = await upsertEvent(token, appt, user);
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
  }

  disconnectGoogle(c: Ctx, userId: string) {
    this.user(c, userId);
    if (c.db.google) delete c.db.google[userId];
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
      name: input.name ?? 'Camila',
      gym: input.gym ?? 'Gym Ñuñoa (demo)',
      monthlyFee: input.monthlyFee ?? 34900,
      plannedVisitsPerMonth: 3,
      window: { start: '19:00', end: '21:00' },
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

  startCapture(c: Ctx, userId: string): Appointment {
    const user = this.user(c, userId);
    // Reemplaza una propuesta anterior sin respuesta.
    for (const a of Object.values(c.db.appointments)) {
      if (a.userId === userId && a.status === 'proposed') delete c.db.appointments[a.id];
    }
    const options = nextSlots(user, c.now, 2, this.taken(c, userId), this.busyFor(c, userId));
    if (options.length === 0) throw new DomainError('no_slots', 'No hay horarios disponibles', 409);
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
      ...options.map((d) => ({ label: formatSlot(d), action: `slot:${appt.id}:${d.toISOString()}` })),
      { label: T.btn.otherHour, action: 'other_hour' },
      { label: T.btn.skipWeek, action: 'skip_week' },
    ];
    const connect = this.connectButton(c, user);
    if (connect) buttons.push(connect);
    this.event(c, userId, 'capture_sent', appt.id);
    this.emit(c, userId, { text: T.capture(user.name, user.sessionMin ?? 40), buttons });
    return appt;
  }

  /** Confirma o mueve una cita a una hora concreta. */
  private place(c: Ctx, user: User, appt: Appointment, when: Date, source: Appointment['source']) {
    const wasMove = appt.startsAt != null && appt.startsAt !== when.toISOString();
    if (wasMove) appt.moves.push({ from: appt.startsAt!, to: when.toISOString(), at: c.now.toISOString() });
    appt.startsAt = when.toISOString();
    appt.status = 'confirmed';
    appt.source = source;
    appt.weekOf = mondayOf(when);
    user.pending = null;
    c.ops.add(appt.id);
    this.event(c, user.id, wasMove ? 'moved' : 'slot_chosen', appt.id, { to: appt.startsAt });
    this.emit(c, user.id, {
      text: wasMove ? T.moved(formatSlot(when)) : T.slotChosen(formatSlot(when), appt.venue),
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
      text: T.reminder(formatTime(new Date(appt.startsAt)), appt.durationMin),
      buttons: [
        { label: T.btn.move, action: 'move' },
        { label: T.btn.done, action: 'done' },
      ],
    });
    return appt;
  }

  // ───────────────────────── M4: MUEVE ─────────────────────────

  move(c: Ctx, userId: string, apptId?: string) {
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

    const from = new Date(Math.max(c.now.getTime(), current.getTime()));
    const [next] = nextSlots(user, from, 1, this.taken(c, userId, appt.id), this.busyFor(c, userId));
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
    this.event(c, userId, 'week_skipped');
    this.emit(c, userId, { text: T.weekSkipped() });
  }

  // ───────────────────────── entrada de mensajes ─────────────────────────

  async handleInbound(c: Ctx, userId: string, input: Inbound): Promise<Message[]> {
    const user = this.user(c, userId);
    const before = c.db.seq;
    const text = (input.text ?? '').trim();
    this.logIn(c, userId, input.label ?? (text || `[${input.action ?? 'vacío'}]`));

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
    switch (action) {
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

  private async handleText(c: Ctx, user: User, text: string) {
    let intent: Intent = classifyByRules(text);

    if (intent === 'pain') {
      this.event(c, user.id, 'pain_derivation');
      this.emit(c, user.id, { text: T.pain() });
      return;
    }

    // Respuesta libre a una pregunta pendiente ("martes 20:30").
    const p = user.pending;
    if (intent === 'unknown' || intent === 'other_hour') {
      const when = parseWhen(text, c.now, user);
      const target = p ? c.db.appointments[p.apptId] : this.upcoming(c, user.id);
      if (when && target) {
        this.place(c, user, target, when, target.startsAt ? 'move' : 'user');
        return;
      }
      if (p?.kind === 'other_hour') {
        this.emit(c, user.id, { text: T.otherHourUnclear() });
        return;
      }
    }

    if (intent === 'unknown' && this.deps.parser) {
      intent = (await this.deps.parser.classify(text)) ?? 'unknown';
      if (intent === 'pain') {
        this.event(c, user.id, 'pain_derivation');
        this.emit(c, user.id, { text: T.pain() });
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

    for (const appt of Object.values(c.db.appointments)) {
      if (!appt.startsAt) continue;
      const start = new Date(appt.startsAt).getTime();
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
