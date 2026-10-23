import type { User } from './api-types';
import { hhmmToMinutes } from './format';
import { getSplit, isValidChoice, type SplitChoice } from './splits';

export type SessionMin = 30 | 40 | 50 | 60;

/**
 * Reglas de la sesión: dónde y cuánto cabe la cita, y cómo se reparten los grupos musculares (split).
 * Solo grupos y días: nada de ejercicios, series ni repeticiones (R4).
 */
export interface SessionPrefs {
  gymHours: { open: string; close: string };
  window: { start: string; end: string };
  sessionMin: SessionMin;
  /** Sesiones por semana: siempre las del split elegido. */
  perWeek: number;
  /** 0 = domingo … 6 = sábado (misma convención que CalendarWeek.days[].weekday). */
  days: number[];
  split: SplitChoice;
}

export type PrefsSource = 'backend' | 'local' | 'default';

export const SESSION_OPTIONS: SessionMin[] = [30, 40, 50, 60];
export const DEFAULT_GYM_HOURS = { open: '06:00', close: '22:00' };
/** Lunes, miércoles y viernes: los mismos días que usa hoy el backend (backend/src/slots.ts PREFERRED_DAYS). */
const DEFAULT_DAYS = [1, 3, 5];
/** Días posibles por defecto cuando el split pide más sesiones que los días elegidos. */
const DAYS_FOR_SESSIONS: Record<number, number[]> = { 4: [1, 2, 4, 5], 5: [1, 2, 3, 4, 5], 6: [1, 2, 3, 4, 5, 6] };
const DEFAULT_SPLIT: SplitChoice = { id: 'fullbody', sessions: 2 };
const DAY_NAMES = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];

/** Campos que el backend guarda con PATCH /preferences (backend/src/app.ts: esquema estricto, sin split). */
type BackendFields = Partial<Pick<SessionPrefs, 'gymHours' | 'sessionMin' | 'perWeek' | 'days'>>;

const localKey = (userId: string) => `lacita.prefs.${userId}`;
const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;

function defaults(user: User | null): SessionPrefs {
  return {
    gymHours: { ...DEFAULT_GYM_HOURS },
    window: user?.window ? { ...user.window } : { start: '19:00', end: '21:00' },
    sessionMin: 40,
    perWeek: DEFAULT_SPLIT.sessions,
    days: [...DEFAULT_DAYS],
    split: { ...DEFAULT_SPLIT },
  };
}

/** Descarta lo que no tenga forma válida; lo que falte se completa con `base`. */
function sanitize(raw: unknown, base: SessionPrefs): SessionPrefs {
  const r = (raw ?? {}) as Partial<SessionPrefs>;
  const okRange = (v: unknown, a: 'open' | 'start', b: 'close' | 'end') => {
    const o = v as Record<string, unknown> | undefined;
    return o && typeof o[a] === 'string' && typeof o[b] === 'string' && HHMM.test(o[a] as string) && HHMM.test(o[b] as string);
  };
  const split = isValidChoice(r.split) ? { ...r.split! } : base.split;
  return {
    gymHours: okRange(r.gymHours, 'open', 'close') ? { ...r.gymHours! } : base.gymHours,
    window: okRange(r.window, 'start', 'end') ? { ...r.window! } : base.window,
    sessionMin: SESSION_OPTIONS.includes(r.sessionMin as SessionMin) ? (r.sessionMin as SessionMin) : base.sessionMin,
    perWeek: split.sessions,
    days:
      Array.isArray(r.days) && r.days.length && r.days.every((d) => Number.isInteger(d) && d >= 0 && d <= 6)
        ? [...new Set(r.days)].sort()
        : base.days,
    split,
  };
}

/** Reglas guardadas en este navegador por esta misma usuaria (mismo `createdAt`), o null. */
function readLocal(user: User): Partial<SessionPrefs> | null {
  try {
    const raw = localStorage.getItem(localKey(user.id));
    if (!raw) return null;
    const stored = JSON.parse(raw) as { createdAt?: string; prefs?: Partial<SessionPrefs> };
    return stored.createdAt === user.createdAt && stored.prefs ? stored.prefs : null;
  } catch {
    return null; /* almacenamiento bloqueado o JSON roto */
  }
}

/**
 * Fuente de verdad: lo que devuelve el backend > lo guardado en este navegador > valores por defecto.
 * El backend no guarda el split (su esquema es estricto): ese vive en este navegador aunque el resto venga de allá.
 * Lo local queda atado a la usuaria que lo creó (`createdAt`): un reset del demo la recrea y las reglas viejas
 * no deben sobrevivir, para que la primera pregunta vuelva a salir en cada ensayo.
 */
export function loadPrefs(user: User | null): { prefs: SessionPrefs; source: PrefsSource } {
  const base = defaults(user);
  const stored = user ? readLocal(user) : null;
  const fromBackend = user as (User & BackendFields) | null;
  if (fromBackend?.gymHours && fromBackend.sessionMin) {
    return { prefs: sanitize({ ...fromBackend, window: user?.window, split: stored?.split }, base), source: 'backend' };
  }
  if (stored) return { prefs: sanitize(stored, base), source: 'local' };
  return { prefs: base, source: 'default' };
}

/** Lo que acepta PATCH /preferences: sin split y con a lo más 3 sesiones (más es fase 2 del backend). */
export function toBackendPrefs(p: SessionPrefs) {
  return { gymHours: p.gymHours, window: p.window, sessionMin: p.sessionMin, perWeek: Math.min(3, p.perWeek), days: p.days };
}

/** Elige un split: las sesiones por semana pasan a ser las suyas y, si faltan días posibles, se completan. */
export function withSplit(p: SessionPrefs, split: SplitChoice): SessionPrefs {
  const days = p.days.length >= split.sessions ? p.days : DAYS_FOR_SESSIONS[split.sessions] ?? p.days;
  return { ...p, split, perWeek: split.sessions, days: [...days] };
}

export function savePrefsLocal(user: Pick<User, 'id' | 'createdAt'>, prefs: SessionPrefs): boolean {
  try {
    localStorage.setItem(localKey(user.id), JSON.stringify({ createdAt: user.createdAt, prefs }));
    return true;
  } catch {
    return false;
  }
}

export function clearPrefsLocal(userId: string) {
  try {
    localStorage.removeItem(localKey(userId));
  } catch {
    /* nada que limpiar */
  }
}

/** Minutos de una hora de cierre o fin de ventana: '00:00' como cierre significa medianoche (24:00). */
export function endToMinutes(hhmm: string) {
  const m = hhmmToMinutes(hhmm);
  return m === 0 ? 24 * 60 : m;
}

const ceil15 = (m: number) => Math.ceil(m / 15) * 15;

/** Problema que impide calzar cualquier sesión, en lenguaje llano; null si las reglas tienen sentido. */
export function prefsProblem(p: SessionPrefs): string | null {
  const fields: Array<[string, string]> = [
    [p.gymHours.open, 'la hora de apertura del gym'],
    [p.gymHours.close, 'la hora de cierre del gym'],
    [p.window.start, 'el inicio de tu ventana'],
    [p.window.end, 'el fin de tu ventana'],
  ];
  for (const [value, name] of fields) {
    if (!HHMM.test(value)) return `Completa ${name}.`;
    if (hhmmToMinutes(value) % 15 !== 0) return `Usa múltiplos de 15 minutos en ${name}.`;
  }
  const open = hhmmToMinutes(p.gymHours.open);
  const close = endToMinutes(p.gymHours.close);
  const start = hhmmToMinutes(p.window.start);
  const end = endToMinutes(p.window.end);
  if (close <= open) return 'El cierre del gym tiene que ser después de la apertura.';
  if (end <= start) return 'Tu ventana tiene que terminar después de empezar.';
  if (!p.days.length) return 'Elige al menos un día.';
  if (p.days.length < p.split.sessions) {
    return `Para ${p.split.sessions} sesiones por semana elige al menos ${p.split.sessions} días posibles.`;
  }
  const usable = Math.min(end, close) - ceil15(Math.max(start, open));
  if (usable < p.sessionMin) {
    return `Entre tu ventana y el horario del gym quedan ${Math.max(0, usable)} min: no alcanza para una sesión de ${p.sessionMin}.`;
  }
  return null;
}

export function dayNames(days: number[]) {
  // Lunes primero, como en la grilla.
  return [1, 2, 3, 4, 5, 6, 0].filter((d) => days.includes(d)).map((d) => DAY_NAMES[d]);
}

export function prefsSummary(p: SessionPrefs) {
  const sesiones = p.split.sessions === 1 ? '1 sesión' : `${p.split.sessions} sesiones`;
  const close = p.gymHours.close === '00:00' ? '24:00' : p.gymHours.close;
  return `Gym ${p.gymHours.open}–${close} · ${getSplit(p.split.id).label} · ${sesiones} de ${p.sessionMin} min · ${dayNames(p.days).join(', ')}`;
}
