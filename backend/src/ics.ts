import { Appointment, User } from './types.js';

const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');

const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');

/** Invite .ics (M2): título, sede y contenido acotado. Fechas en UTC, sin dependencia de VTIMEZONE. */
export function buildIcs(appt: Appointment, user: User, now: Date = new Date()): string {
  if (!appt.startsAt) throw new Error('La cita aún no tiene hora');
  const start = new Date(appt.startsAt);
  const end = new Date(start.getTime() + appt.durationMin * 60000);
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//La Cita//Hackaton Senales//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${appt.id}@la-cita`,
    `DTSTAMP:${fmt(now)}`,
    `DTSTART:${fmt(start)}`,
    `DTEND:${fmt(end)}`,
    `SUMMARY:${esc('La Cita contigo')}`,
    `LOCATION:${esc(`${appt.venue} (${user.gym})`)}`,
    `DESCRIPTION:${esc(`${appt.durationMin} min · ${appt.content}. Si se alarga la reunión, la movemos sin drama.`)}`,
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
