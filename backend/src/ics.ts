import { Appointment, User } from './types.js';

const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');

const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');

/** Descripción del evento: duración, contenido y, si hay, la rutina armada con el tiempo libre de ese día. */
export function apptDescription(appt: Appointment): string {
  const head = `${appt.durationMin} min · ${appt.content}.`;
  const tail = 'Si se alarga la reunión, la movemos sin drama.';
  const r = appt.routine;
  if (!r) return `${head} ${tail}`;
  const lines = [`${appt.durationMin} min${appt.focus ? ` · ${appt.focus.label}` : ''}`, `Calentamiento: ${r.warmupMin} min`, ...r.items.map((i) => `${i.name}: ${i.sets} × ${i.reps}`), tail];
  return lines.join('\n');
}

/** Invite .ics (M2): título, sede y contenido acotado. Fechas en UTC, sin dependencia de VTIMEZONE. */
export function buildIcs(appt: Appointment, user: User, now: Date = new Date()): string {
  if (!appt.startsAt) throw new Error('La cita aún no tiene hora');
  const start = new Date(appt.startsAt);
  const end = new Date(start.getTime() + appt.durationMin * 60000);
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//gogym//Hackaton Senales//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${appt.id}@la-cita`,
    `SEQUENCE:${appt.moves.length}`,
    `DTSTAMP:${fmt(now)}`,
    `DTSTART:${fmt(start)}`,
    `DTEND:${fmt(end)}`,
    `SUMMARY:${esc('Tu cita contigo · gogym')}`,
    `LOCATION:${esc(`${appt.venue} (${user.gym})`)}`,
    `DESCRIPTION:${esc(apptDescription(appt))}`,
    'BEGIN:VALARM',
    'TRIGGER:-PT45M',
    'ACTION:DISPLAY',
    `DESCRIPTION:${esc('Tu cita contigo')}`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ];
  return lines.join('\r\n') + '\r\n';
}

/** URL de plantilla de Google Calendar: un toque y el evento queda prellenado en su calendario real. */
export function googleCalendarUrl(appt: Appointment, user: User): string {
  if (!appt.startsAt) throw new Error('La cita aún no tiene hora');
  const start = new Date(appt.startsAt);
  const end = new Date(start.getTime() + appt.durationMin * 60000);
  const q = new URLSearchParams({
    action: 'TEMPLATE',
    text: 'Tu cita contigo · gogym',
    dates: `${fmt(start)}/${fmt(end)}`,
    details: apptDescription(appt),
    location: `${appt.venue} (${user.gym})`,
  });
  return `https://calendar.google.com/calendar/render?${q.toString()}`;
}
