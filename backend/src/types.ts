import type { Account } from './auth.js';
import type { Commute } from './advice.js';
import type { Routine } from './routine.js';

export type ChannelKind = 'sim' | 'telegram' | 'web';

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
  /** El agente elige split y duración cada semana con el calendario (por defecto sí). `false` = modo manual: se respeta lo que ella fijó. */
  autoPlan?: boolean;
  /** Ya pasó las preguntas de bienvenida (cuántas veces por semana y calendario). */
  onboarded?: boolean;
  /** Último empujón de vuelta al hábito (para no insistir: uno cada 4 días como máximo). */
  lastNudgeAt?: string;
  /** Busca hueco en todo el horario del gym (no solo en su ventana habitual): antes del trabajo, al almuerzo o después. */
  flexTimes?: boolean;
  /** Cuánto le toma llegar al gym (lo que ella contó). Afina el calentamiento en el camino y la hora que se recomienda. */
  commute?: Commute;
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
  | { kind: 'renegotiate'; apptId: string }
  | { kind: 'onboarding'; step: 'name' | 'perWeek' | 'calendar' };

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
  /** Veces que el agente la corrió solo porque el calendario cambió (tope 2, para no pelear con la usuaria). */
  autoShifts?: number;
  /** Ya avisó que choca con una reunión y no hay hueco cercano (un solo aviso). */
  conflictNoticed?: boolean;
  /** Ya se mandó la pausa activa de ese día de gimnasio (una sola). */
  microSent?: boolean;
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
  /** Id del mensaje en Telegram (para quitarle los botones cuando ya se eligió). */
  tgMessageId?: number;
  /** Etiqueta del botón que ella eligió. Al elegir, los botones del mensaje se quitan (`buttons` desaparece). */
  chosen?: string;
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
  /** Cuentas de la web por alias (contraseña con PBKDF2). */
  accounts?: Record<string, Account>;
  /** Intentos fallidos de contraseña por alias (ms epoch). */
  authFailures?: Record<string, number[]>;
  /** Chats de Telegram que entraron con el código de invitación (beta cerrada). */
  allowedChats?: number[];
  /** Códigos de un solo uso para entrar a la web desde Telegram (/web). */
  loginCodes?: Record<string, { userId: string; exp: number }>;
  /** Intentos fallidos de código recientes (ms epoch), para frenar adivinanzas. */
  loginFailures?: number[];
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
