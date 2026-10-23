import type { User } from './api-types';
import { hhmmToMinutes } from './format';

export type SessionMin = 30 | 40 | 50 | 60;
export type PerWeek = 1 | 2 | 3;

/** Reglas de la sesión: dónde y cuánto cabe la cita. Nada de ejercicios (O1, R4). */
export interface SessionPrefs {
  gymHours: { open: string; close: string };
  window: { start: string; end: string };
  sessionMin: SessionMin;
  perWeek: PerWeek;
  /** 0 = domingo … 6 = sábado (misma convención que CalendarWeek.days[].weekday). */
  days: number[];
}

export type PrefsSource = 'backend' | 'local' | 'default';

export const SESSION_OPTIONS: SessionMin[] = [30, 40, 50, 60];
export const PER_WEEK_OPTIONS: PerWeek[] = [1, 2, 3];
export const DEFAULT_GYM_HOURS = { open: '06:00', close: '22:00' };
/** Lunes, miércoles y viernes: los mismos días que usa hoy el backend (backend/src/slots.ts PREFERRED_DAYS). */
const DEFAULT_DAYS = [1, 3, 5];
const DAY_NAMES = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];

/** Campos que el backend agrega a User cuando exista PATCH /preferences (frontend/PEDIDOS-BACKEND.md §3). */
type BackendFields = Partial<Pick<SessionPrefs, 'gymHours' | 'sessionMin' | 'perWeek' | 'days'>>;

const localKey = (userId: string) => `lacita.prefs.${userId}`;
const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;

function defaults(user: User | null): SessionPrefs {
  return {
    gymHours: { ...DEFAULT_GYM_HOURS },
    window: user?.window ? { ...user.window } : { start: '19:00', end: '21:00' },
    sessionMin: 40,
    perWeek: 2,
    days: [...DEFAULT_DAYS],
  };
}

/** Descarta lo que no tenga forma válida; lo que falte se completa con `base`. */
function sanitize(raw: unknown, base: SessionPrefs): SessionPrefs {
  const r = (raw ?? {}) as Partial<SessionPrefs>;
  const okRange = (v: unknown, a: 'open' | 'start', b: 'close' | 'end') => {
    const o = v as Record<string, unknown> | undefined;
    return o && typeof o[a] === 'string' && typeof o[b] === 'string' && HHMM.test(o[a] as string) && HHMM.test(o[b] as string);
  };
  return {
    gymHours: okRange(r.gymHours, 'open', 'close') ? { ...r.gymHours! } : base.gymHours,
    window: okRange(r.window, 'start', 'end') ? { ...r.window! } : base.window,
    sessionMin: SESSION_OPTIONS.includes(r.sessionMin as SessionMin) ? (r.sessionMin as SessionMin) : base.sessionMin,
    perWeek: PER_WEEK_OPTIONS.includes(r.perWeek as PerWeek) ? (r.perWeek as PerWeek) : base.perWeek,
    days:
      Array.isArray(r.days) && r.days.length && r.days.every((d) => Number.isInteger(d) && d >= 0 && d <= 6)
        ? [...new Set(r.days)].sort()
        : base.days,
  };
}

/**
 * Fuente de verdad: lo que devuelve el backend > lo guardado en este navegador > valores por defecto.
 * Lo local queda atado a la usuaria que lo creó (`createdAt`): un reset del demo la recrea y las reglas viejas
 * no deben sobrevivir, para que la primera pregunta vuelva a salir en cada ensayo.
 */
export function loadPrefs(user: User | null): { prefs: SessionPrefs; source: PrefsSource } {
  const base = defaults(user);
  const fromBackend = user as (User & BackendFields) | null;
  if (fromBackend?.gymHours && fromBackend.sessionMin) {
    return { prefs: sanitize({ ...fromBackend, window: user?.window }, base), source: 'backend' };
  }
  if (user) {
    try {
      const raw = localStorage.getItem(localKey(user.id));
      if (raw) {
        const stored = JSON.parse(raw) as { createdAt?: string; prefs?: unknown };
        if (stored.createdAt === user.createdAt && stored.prefs) {
          return { prefs: sanitize(stored.prefs, base), source: 'local' };
        }
      }
    } catch {
      /* almacenamiento bloqueado o JSON roto: valores por defecto */
    }
  }
  return { prefs: base, source: 'default' };
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
  const veces = p.perWeek === 1 ? '1 vez' : `${p.perWeek} veces`;
  const close = p.gymHours.close === '00:00' ? '24:00' : p.gymHours.close;
  return `Gym ${p.gymHours.open}–${close} · sesión de ${p.sessionMin} min · ${veces} por semana · ${dayNames(p.days).join(', ')}`;
}
