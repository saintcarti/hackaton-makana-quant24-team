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
  /** Lunes local de la semana ("YYYY-MM-DD"). */
  weekOf: string;
  createdAt: string;
  doneAt?: string;
}

export interface Button {
  label: string;
  /** Valor que el front devuelve a POST /users/:id/messages {action}. */
  action: string;
}

export interface Attachment {
  kind: 'ics';
  apptId: string;
  filename: string;
  url: string;
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

export interface DB {
  users: Record<string, User>;
  appointments: Record<string, Appointment>;
  messages: Message[];
  events: EventRec[];
  seq: number;
  /** Offset del reloj de demo en ms (0 = reloj real). */
  clockOffsetMs: number;
}

export const emptyDB = (): DB => ({
  users: {},
  appointments: {},
  messages: [],
  events: [],
  seq: 0,
  clockOffsetMs: 0,
});
