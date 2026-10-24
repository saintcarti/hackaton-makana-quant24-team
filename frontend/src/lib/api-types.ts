/**
 * Tipos del contrato HTTP de La Cita. Copia este archivo al frontend (p. ej. frontend/src/lib/api-types.ts).
 * Fuente de verdad: backend/src/types.ts y backend/src/views.ts. Si cambian, se actualiza este archivo.
 */

export type ApptStatus = 'proposed' | 'confirmed' | 'reminded' | 'done' | 'lapsed' | 'skipped';

export interface Button {
  label: string;
  /** Devuélvelo tal cual en POST /api/users/:id/messages { action, label }. Vacío si es un botón-enlace. */
  action: string;
  /** Si existe, es un botón-enlace (p. ej. "Conectar mi calendario"): ábrelo en una pestaña nueva y NO envíes `action`. */
  url?: string;
}

export interface Attachment {
  kind: 'ics';
  apptId: string;
  filename: string;
  /** Ruta relativa a la base de la API, p. ej. "/api/appointments/a_1234/ics". */
  url: string;
  /** Enlace "Agregar a Google Calendar" prellenado. Muéstralo como botón junto al .ics. */
  gcalUrl: string;
}

export interface Message {
  /** Número incremental global: úsalo en ?after= para hacer polling. */
  n: number;
  id: string;
  userId: string;
  dir: 'in' | 'out';
  at: string;
  text: string;
  buttons?: Button[];
  /** Etiqueta del botón que ella eligió. Al elegir, `buttons` desaparece del mensaje (y en Telegram se quitan del chat). */
  chosen?: string;
  attachment?: Attachment;
}

export interface User {
  id: string;
  name: string;
  gym: string;
  monthlyFee: number;
  plannedVisitsPerMonth: number;
  window: { start: string; end: string };
  preferredTime: string;
  /** Horario del gym ("HH:MM"). Si falta, solo manda la ventana. Se cambia con PATCH /users/:id/preferences. */
  gymHours?: { open: string; close: string };
  /** Duración de la sesión en minutos (30 | 40 | 50 | 60). Por defecto 40. */
  sessionMin?: number;
  /** Veces por semana que quiere ir (1 | 2 | 3). Hoy el flujo dominical agenda una; el resto es fase 2. */
  perWeek?: number;
  /** Días que puede ir (0 = domingo … 6 = sábado). Por defecto lun, mié, vie. */
  days?: number[];
  /** El agente elige split y duración cada semana con el calendario (por defecto sí, mientras exista `perWeek`). `false` = modo manual. */
  autoPlan?: boolean;
  /** Busca hueco en todo el horario del gym (`gymHours`, por defecto 05:30–23:00) y no solo en `window`. Por defecto true. */
  flexTimes?: boolean;
  /** Cuánto le toma llegar al gym, según lo que ella contó (minutos caminando y trotando). */
  commute?: { walkMin: number; jogMin: number };
  /** Split elegido; ids: fullbody | upper-lower | ppl | torso-piernas-brazos | cinco-dias. Se cambia con PATCH /users/:id/preferences { split }. */
  split?: { id: string; sessions: number };
  /** R4: ISO del último mensaje de dolor. Mientras exista, las citas no llevan `focus`. Se limpia cuando ella dice que ya lo conversó con un profesional. */
  painPause?: string;
  channel: { type: 'sim' | 'telegram'; chatId?: number };
  synthetic: boolean;
  consecutiveMoves: number;
  pending: { kind: 'capture' | 'other_hour' | 'renegotiate'; apptId: string; sentAt?: string } | null;
  createdAt: string;
}

export interface Move {
  from: string;
  to: string;
  at: string;
}

export interface Appointment {
  id: string;
  userId: string;
  startsAt: string | null;
  durationMin: number;
  venue: string;
  content: string;
  status: ApptStatus;
  source: 'user' | 'default' | 'move' | 'seed';
  options: string[];
  moves: Move[];
  weekOf: string;
  createdAt: string;
  doneAt?: string;
}

/** Cita tal como la devuelve la API (con campos de presentación ya resueltos). */
export interface AppointmentView extends Appointment {
  local: { date: string; weekday: number; weekdayName: string; time: string } | null;
  /** Texto neutro listo para mostrar. 'lapsed' nunca se muestra como falta: usa este label. */
  label: 'Realizada' | 'Pasó' | 'Semana de descanso' | 'Por elegir' | 'Recordada' | 'Movida' | 'Agendada';
  wasMoved: boolean;
  /** Foco de la sesión según el split (solo grupos, nunca ejercicios). Ausente sin split o con pausa por dolor. */
  focus?: { dayTypeId: string; label: string; groups: string[] };
  /** Rutina armada con el tiempo libre real de ese día (calendario conectado u ocupación informada). Ausente con pausa por dolor (R4) o si hay menos de 20 min. */
  routine?: Routine;
}

export interface RoutineItem {
  exerciseId: string;
  name: string;
  group: string;
  sets: number;
  /** Texto listo para mostrar: «10-12», «30 s», «10 por lado». */
  reps: string;
}

export interface Routine {
  /** Minutos totales de la sesión, calentamiento incluido. Es igual a `durationMin` de la cita. */
  minutes: number;
  warmupMin: number;
  items: RoutineItem[];
  groups: string[];
}

export interface ApiError {
  error: { code: string; message: string };
}

// ── Respuestas ───────────────────────────────────────────────────────────────

export interface MessagesPost {
  replies: Message[];
  user: User;
  now: string;
}

export interface ActionResponse {
  appointment: AppointmentView | null;
  replies: Message[];
  now: string;
}

export interface CalendarWeek {
  weekOf: string;
  days: Array<{ date: string; weekday: number; weekdayName: string }>;
  hourRange: { from: string; to: string };
  blocks: Array<{
    id: string;
    /** 0 = lunes … 6 = domingo */
    dayIndex: number;
    date: string;
    startMinutes: number;
    durationMin: number;
    time: string;
    status: ApptStatus;
    label: string;
    wasMoved: boolean;
  }>;
}

export interface Summary {
  userId: string;
  visitsLast6Weeks: number;
  visitsTotal: number;
  movesLast6Weeks: number;
  movesTotal: number;
  brokenChains: number;
  consecutiveMoves: number;
  recoveredCLP: number;
  recoveredPerVisitCLP: number;
  monthlyFee: number;
  nextAppointment: AppointmentView | null;
  /** 7 buckets: 6 semanas completas previas + la semana en curso. */
  weeklyVisits: Array<{ weekOf: string; visits: number }>;
}

export interface Meta {
  timezone: string;
  demoUserId: string;
  now: string;
  clockSimulated: boolean;
  channels: string[];
  telegramEnabled: boolean;
  /** El backend tiene credenciales de Google: la conexión del calendario se hace en el servidor (GET /users/:id/google). */
  googleConfigured?: boolean;
  users: number;
}

export type ClockPreset = 'sunday-20' | 'sunday-2330' | 'monday-1830' | 'monday-2000';

export interface GoogleStatus {
  /** El backend tiene credenciales de Google configuradas. */
  configured: boolean;
  /** La usuaria ya conectó su Google Calendar. */
  connected: boolean;
  /** Enlace para iniciar la conexión (abrir en pestaña nueva). Null si no está configurado. */
  connectUrl: string | null;
}
