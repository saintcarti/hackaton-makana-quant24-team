import { User } from './types.js';
import { addDays, dateKey, localParts, parseHHMM, zonedToUtc } from './time.js';

/** Lunes, miércoles, viernes: martes y jueves quedan descartados (Camila llega tarde, caso 1). */
export const PREFERRED_DAYS = [1, 3, 5];
const MIN_LEAD_MS = 60 * 60 * 1000;
export const DEFAULT_SESSION_MIN = 40;

/** Intervalo ocupado del calendario real (ms epoch). */
export interface Busy {
  start: number;
  end: number;
}

export const sessionMs = (user: User) => (user.sessionMin ?? DEFAULT_SESSION_MIN) * 60_000;

function overlaps(candidate: Date, taken: Date[], dur: number): boolean {
  return taken.some((t) => Math.abs(t.getTime() - candidate.getTime()) < dur);
}

function isBusy(candidate: Date, busy: Busy[], dur: number): boolean {
  const s = candidate.getTime();
  return busy.some((b) => s < b.end && s + dur > b.start);
}

const minutesOf = (hhmm: string) => {
  const p = parseHHMM(hhmm);
  return p.hour * 60 + p.minute;
};

/** Límites [desde, hasta] en minutos del día en que debe caber la sesión: ventana ∩ horario del gym. */
function bounds(user: User): [number, number] {
  let lo = minutesOf(user.window.start);
  let hi = minutesOf(user.window.end);
  if (user.gymHours) {
    lo = Math.max(lo, minutesOf(user.gymHours.open));
    hi = Math.min(hi, minutesOf(user.gymHours.close));
  }
  return [lo, hi];
}

/**
 * Horas de inicio probadas: la preferida y cada 30 min hacia adelante, luego el resto de la ventana cada 15 min.
 * Solo las que caben enteras dentro de la ventana ∩ horario del gym.
 */
function startTimes(user: User): Array<{ hour: number; minute: number }> {
  const [lo, hi] = bounds(user);
  const dur = sessionMs(user) / 60_000;
  const pref = minutesOf(user.preferredTime);
  const fits = (m: number) => m >= lo && m + dur <= hi;
  const ordered: number[] = [];
  for (let m = pref; m + dur <= hi; m += 30) if (fits(m)) ordered.push(m);
  for (let m = lo; m + dur <= hi; m += 15) if (fits(m) && !ordered.includes(m)) ordered.push(m);
  return ordered.map((m) => ({ hour: Math.floor(m / 60), minute: m % 60 }));
}

/**
 * Próximos `count` slots dentro de la ventana real de la usuaria. Si hay calendario conectado,
 * esquiva los bloques ocupados probando horas alternativas dentro de la ventana.
 */
export function nextSlots(user: User, after: Date, count: number, taken: Date[] = [], busy: Busy[] = []): Date[] {
  const times = startTimes(user);
  const dur = sessionMs(user);
  const days = user.days?.length ? user.days : PREFERRED_DAYS;
  const start = localParts(after);
  const out: Date[] = [];
  for (let i = 0; i < 28 && out.length < count; i++) {
    const day = addDays(start, i);
    if (!days.includes(day.weekday)) continue;
    for (const t of times) {
      const slot = zonedToUtc(day.year, day.month, day.day, t.hour, t.minute);
      if (slot.getTime() < after.getTime() + MIN_LEAD_MS) continue;
      if (overlaps(slot, taken, dur) || isBusy(slot, busy, dur)) continue;
      out.push(slot);
      break;
    }
  }
  return out;
}

/**
 * Re-negociación de ventana (regla anti-snooze): se ofrece algo DISTINTO al slot que
 * no está funcionando — martes 20:30 o sábado 11:00.
 */
export function renegotiationSlots(user: User, after: Date, taken: Date[] = [], busy: Busy[] = []): Date[] {
  const dur = sessionMs(user);
  const gym = user.gymHours;
  const start = localParts(after);
  const wants: Array<{ weekday: number; hour: number; minute: number }> = [
    { weekday: 2, hour: 20, minute: 30 },
    { weekday: 6, hour: 11, minute: 0 },
  ];
  const out: Date[] = [];
  for (const w of wants) {
    for (let i = 0; i < 14; i++) {
      const day = addDays(start, i);
      if (day.weekday !== w.weekday) continue;
      const slot = zonedToUtc(day.year, day.month, day.day, w.hour, w.minute);
      if (slot.getTime() < after.getTime() + MIN_LEAD_MS || overlaps(slot, taken, dur) || isBusy(slot, busy, dur)) continue;
      if (gym) {
        const p = localParts(slot);
        const m = p.hour * 60 + p.minute;
        if (m < minutesOf(gym.open) || m + dur / 60_000 > minutesOf(gym.close)) continue;
      }
      out.push(slot);
      break;
    }
  }
  return out;
}

const WEEKDAY_WORDS: Array<[RegExp, number]> = [
  [/\bdomingo\b/, 0],
  [/\blunes\b/, 1],
  [/\bmartes\b/, 2],
  [/\bmi[eé]rcoles\b/, 3],
  [/\bjueves\b/, 4],
  [/\bviernes\b/, 5],
  [/\bs[aá]bado\b/, 6],
];

/** Extrae hora de textos como "20:30", "20 hrs", "a las 8", "8 pm". Null si no hay. */
export function parseClock(text: string): { hour: number; minute: number } | null {
  const t = text.toLowerCase();
  let m = /\b([01]?\d|2[0-3])[:.h]([0-5]\d)\b/.exec(t);
  if (m) return { hour: Number(m[1]), minute: Number(m[2]) };
  m = /\b(?:a\s+las\s+)?([01]?\d|2[0-3])\s*(am|pm|hrs?|horas?)\b/.exec(t);
  if (m) {
    let hour = Number(m[1]);
    const suffix = m[2];
    if (suffix === 'pm' && hour < 12) hour += 12;
    if (suffix === 'am' && hour === 12) hour = 0;
    return { hour, minute: 0 };
  }
  m = /\ba\s+las\s+([01]?\d|2[0-3])\b/.exec(t);
  if (m) {
    let hour = Number(m[1]);
    if (hour >= 1 && hour <= 11) hour += 12; // "a las 8" en un gym vespertino = 20:00
    return { hour, minute: 0 };
  }
  return null;
}

/**
 * Interpreta "martes 20:30", "mañana a las 19", "el viernes". Devuelve null si no entiende.
 * Si solo hay día usa la hora preferida; si solo hay hora usa el próximo día compatible.
 */
export function parseWhen(text: string, now: Date, user: User): Date | null {
  const t = text.toLowerCase();
  const clock = parseClock(t);
  const pref = parseHHMM(user.preferredTime);
  const start = localParts(now);

  let targetDay: { year: number; month: number; day: number } | null = null;
  if (/\bmañana\b/.test(t) && !/\bpasado\s+mañana\b/.test(t)) targetDay = addDays(start, 1);
  else if (/\bpasado\s+mañana\b/.test(t)) targetDay = addDays(start, 2);
  else if (/\bhoy\b/.test(t)) targetDay = addDays(start, 0);
  else {
    for (const [re, weekday] of WEEKDAY_WORDS) {
      if (!re.test(t)) continue;
      for (let i = 0; i < 8; i++) {
        const d = addDays(start, i);
        if (d.weekday === weekday) {
          targetDay = d;
          break;
        }
      }
      break;
    }
  }

  if (!targetDay && !clock) return null;

  if (!targetDay && clock) {
    for (let i = 0; i < 8; i++) {
      const d = addDays(start, i);
      if (!(user.days?.length ? user.days : PREFERRED_DAYS).includes(d.weekday)) continue;
      const cand = zonedToUtc(d.year, d.month, d.day, clock.hour, clock.minute);
      if (cand.getTime() > now.getTime() + MIN_LEAD_MS) return cand;
    }
    return null;
  }

  const hh = clock ?? pref;
  let day = targetDay!;
  let cand = zonedToUtc(day.year, day.month, day.day, hh.hour, hh.minute);
  // Si cae en el pasado (p. ej. "lunes" dicho un lunes tarde), salta una semana.
  if (cand.getTime() < now.getTime() + MIN_LEAD_MS) {
    const next = addDays(day, 7);
    day = next;
    cand = zonedToUtc(day.year, day.month, day.day, hh.hour, hh.minute);
  }
  return cand;
}

export { dateKey };
