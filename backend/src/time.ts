/** Utilidades de zona horaria (America/Santiago) sin librerías externas. */
export const TZ = 'America/Santiago';

export interface LocalParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  /** 0 = domingo … 6 = sábado */
  weekday: number;
}

const WEEKDAYS: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

export function localParts(d: Date): LocalParts {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    weekday: 'short',
    hourCycle: 'h23',
  }).formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '0';
  return {
    year: Number(get('year')),
    month: Number(get('month')),
    day: Number(get('day')),
    hour: Number(get('hour')),
    minute: Number(get('minute')),
    weekday: WEEKDAYS[get('weekday')] ?? 0,
  };
}

function offsetMinutes(d: Date): number {
  const name =
    new Intl.DateTimeFormat('en-US', { timeZone: TZ, timeZoneName: 'longOffset' })
      .formatToParts(d)
      .find((p) => p.type === 'timeZoneName')?.value ?? 'GMT';
  const m = /GMT([+-])(\d{2}):(\d{2})/.exec(name);
  if (!m) return 0;
  const sign = m[1] === '-' ? -1 : 1;
  return sign * (Number(m[2]) * 60 + Number(m[3]));
}

/** Hora local de Santiago -> instante UTC. */
export function zonedToUtc(year: number, month: number, day: number, hour: number, minute: number): Date {
  const guess = Date.UTC(year, month - 1, day, hour, minute);
  let result = guess - offsetMinutes(new Date(guess)) * 60000;
  result = guess - offsetMinutes(new Date(result)) * 60000;
  return new Date(result);
}

export const pad = (n: number) => String(n).padStart(2, '0');

export function parseHHMM(s: string): { hour: number; minute: number } {
  const [h, m] = s.split(':').map(Number);
  return { hour: h ?? 0, minute: m ?? 0 };
}

/** Fecha local + n días (aritmética de calendario, sin saltos de DST). */
export function addDays(p: Pick<LocalParts, 'year' | 'month' | 'day'>, n: number) {
  const d = new Date(Date.UTC(p.year, p.month - 1, p.day + n));
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate(), weekday: d.getUTCDay() };
}

export const dateKey = (p: Pick<LocalParts, 'year' | 'month' | 'day'>) => `${p.year}-${pad(p.month)}-${pad(p.day)}`;

/** Lunes local (YYYY-MM-DD) de la semana de `d`. */
export function mondayOf(d: Date): string {
  const p = localParts(d);
  const back = (p.weekday + 6) % 7;
  return dateKey(addDays(p, -back));
}

export function parseDateKey(key: string) {
  const [y, m, d] = key.split('-').map(Number);
  return { year: y ?? 1970, month: m ?? 1, day: d ?? 1 };
}

const DAY_NAMES = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
export const dayName = (weekday: number) => DAY_NAMES[weekday] ?? '';

/** "lunes 26 a las 19:15" */
export function formatSlot(d: Date): string {
  const p = localParts(d);
  return `${dayName(p.weekday)} ${p.day} a las ${pad(p.hour)}:${pad(p.minute)}`;
}

export const formatTime = (d: Date) => {
  const p = localParts(d);
  return `${pad(p.hour)}:${pad(p.minute)}`;
};

export const clp = (n: number) => '$' + Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
