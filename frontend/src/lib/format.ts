const TZ = 'America/Santiago';

export function fmtTime(iso: string) {
  return new Intl.DateTimeFormat('es-CL', {
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    timeZone: TZ,
  }).format(new Date(iso));
}

export function fmtDay(iso: string) {
  return new Intl.DateTimeFormat('es-CL', { weekday: 'long', day: 'numeric', month: 'long', timeZone: TZ }).format(
    new Date(iso),
  );
}

export function fmtCLP(n: number) {
  return `$${new Intl.NumberFormat('es-CL').format(Math.round(n))}`;
}

/** Suma días a una fecha "YYYY-MM-DD" (mediodía local, inmune a cambios de hora). */
export function addDaysISO(dateISO: string, days: number) {
  const d = new Date(`${dateISO}T12:00:00`);
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Lunes ("YYYY-MM-DD") de la semana de una fecha "YYYY-MM-DD". */
export function mondayOf(dateISO: string) {
  const d = new Date(`${dateISO}T12:00:00`);
  return addDaysISO(dateISO, -((d.getDay() + 6) % 7));
}

/** Minutos desde medianoche en Santiago, y fecha "YYYY-MM-DD" en Santiago. */
export function santiagoParts(date: Date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '00';
  return {
    date: `${get('year')}-${get('month')}-${get('day')}`,
    minutes: Number(get('hour')) * 60 + Number(get('minute')),
  };
}

/** Instante UTC de una fecha y hora locales de Santiago (dos pasadas para cruzar bien un cambio de horario). */
export function santiagoToDate(dateISO: string, hhmm: string): Date {
  const [y, m, d] = dateISO.split('-').map(Number);
  const [h, mi] = hhmm.split(':').map(Number);
  const guess = Date.UTC(y, m - 1, d, h, mi);
  const offsetAt = (t: number) => {
    const p = santiagoParts(new Date(t));
    const [py, pm, pd] = p.date.split('-').map(Number);
    return Date.UTC(py, pm - 1, pd, Math.floor(p.minutes / 60), p.minutes % 60) - t;
  };
  let t = guess - offsetAt(guess);
  t = guess - offsetAt(t);
  return new Date(t);
}

export function hhmmToMinutes(hhmm: string) {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + (m || 0);
}

export function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
