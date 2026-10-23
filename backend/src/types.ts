import type { Routine } from './routine.js';

export type ChannelKind = 'sim' | 'telegram';

export interface User {
  id: string;
  /** Nombre ficticio (R2: cero datos personales reales). */
  name: string;
  gym: string;
  /** Mensualidad en CLP. Caso 1: $34.900. */
  monthlyFee: number;
  /** Visitas mensuales que se asumen para repartir la mensualidad (Estimate). */
  plannedVisitsPerMonth: number;
  /** Ventana real de entrenamiento, "HH:MM". */
  window: { start: string; end: string };
  /** Hora preferida dentro de la ventana, "HH:MM". */
  preferredTime: string;
  channel: { type: ChannelKind; chatId?: number };
  /** Horario del gym, "HH:MM". Si falta, solo manda la ventana. */
  gymHours?: { open: string; close: string };
  /** Duración de la sesión en minutos (30 | 40 | 50 | 60). Por defecto 40. */
  sessionMin?: number;
  /** Veces por semana que quiere ir (1 | 2 | 3). Hoy el flujo dominical agenda una; el resto es fase 2. */
  perWeek?: number;
  /** Días que puede ir (0 = domingo … 6 = sábado). Por defecto lun, mié, vie. */
  days?: number[];
  /** Split elegido (grupos musculares por sesión). Sin ejercicios, series ni repeticiones. */
  split?: { id: string; sessions: number };
  /** R4: ISO del último mensaje de dolor. Mientras exista no se asigna foco a las citas. */
  painPause?: string;
  synthetic: boolean;
  /** MUEVEs seguidos sin visita (regla anti-snooze). */
  consecutiveMoves: number;
  pending: PendingState | null;
  createdAt: string;
}

export type PendingState =
  | { kind: 'capture'; apptId: string; sentAt: string }
  | { kind: 'other_hour'; apptId: string }
  | { kind: 'renegotiate'; apptId: string };

/**
 * proposed: semana propuesta, aún sin hora elegida.
 * confirmed: hora elegida (por la usuaria o por defecto).
 * reminded: recordatorio del día enviado.
 * done: visita confirmada con "listo".
 * lapsed: pasó la hora sin visita. NO se exhibe como falta (regla "mover ≠ fallar").
 * skipped: "esta semana no" (decisión explícita, no falla).
 */
export type ApptStatus = 'proposed' | 'confirmed' | 'reminded' | 'done' | 'lapsed' | 'skipped';

export interface Move {
  from: string;
  to: string;
  at: string;
}

export interface Appointment {
  id: string;
  userId: string;
  /** Inicio en UTC (ISO). Vacío mientras status = proposed/skipped. */
  startsAt: string | null;
  durationMin: number;
  venue: string;
  content: string;
  status: ApptStatus;
  source: 'user' | 'default' | 'move' | 'seed';
  /** Opciones ofrecidas en la captura (ISO). */
  options: string[];
  moves: Move[];
  /** Id del evento en Google Calendar (si hay calendario conectado). */
  eventId?: string;
  /** Foco de la sesión según el split de la usuaria (solo grupos, R4). Ausente sin split o mientras dure la pausa por dolor. */
  focus?: { dayTypeId: string; label: string; groups: string[] };
  /** Rutina armada con el tiempo libre real de ese día. Ausente con pausa por dolor (R4) o si el tiempo es muy corto. */
  routine?: Routine;
  /** Lunes local de la semana ("YYYY-MM-DD"). */
  weekOf: string;
  createdAt: string;
  doneAt?: string;
}

export interface Button {
  label: string;
  /** Valor que el front devuelve a POST /users/:id/messages {action}. Vacío si el botón es un enlace. */
  action: string;
  /** Si existe, es un botón-enlace: ábrelo en una pestaña nueva en vez de enviar `action`. */
  url?: string;
}

export interface Attachment {
  kind: 'ics';
  apptId: string;
  filename: string;
  url: string;
  /** Enlace "Agregar a Google Calendar" (sin OAuth): abre el evento prellenado en Google Calendar. */
  gcalUrl: string;
}

export interface OutMessage {
  text: string;
  buttons?: Button[];
  attachment?: Attachment;
}

export interface Message extends OutMessage {
  n: number;
  id: string;
  userId: string;
  dir: 'in' | 'out';
  at: string;
}

export type EventType =
  | 'capture_sent'
  | 'slot_chosen'
  | 'default_applied'
  | 'reminder_sent'
  | 'moved'
  | 'renegotiation_opened'
  | 'done'
  | 'week_skipped'
  | 'pain_derivation'
  | 'lapsed';

export interface EventRec {
  id: string;
  userId: string;
  type: EventType;
  at: string;
  apptId?: string;
  data?: Record<string, unknown>;
}

/** Conexión OAuth con el Google Calendar de una usuaria. NUNCA se expone por la API. */
export interface GoogleLink {
  refreshToken: string;
  accessToken?: string;
  /** ms epoch */
  expiresAt?: number;
  connectedAt: string;
  /** Caché de bloques ocupados (ms epoch) para no consultar en cada mensaje. */
  busyCache?: { at: number; intervals: Array<[number, number]> };
}

export interface DB {
  users: Record<string, User>;
  appointments: Record<string, Appointment>;
  messages: Message[];
  events: EventRec[];
  seq: number;
  /** Conexiones de Google Calendar por usuaria (secretos: no exponer). */
  google?: Record<string, GoogleLink>;
  /** Bloques ocupados informados por el front (solo inicio y fin, ms epoch), por usuaria y semana. */
  busy?: Record<string, Record<string, Array<[number, number]>>>;
  /** Offset del reloj de demo en ms (0 = reloj real). */
  clockOffsetMs: number;
}

export const emptyDB = (): DB => ({
  users: {},
  appointments: {},
  messages: [],
  events: [],
  seq: 0,
  google: {},
  clockOffsetMs: 0,
});
