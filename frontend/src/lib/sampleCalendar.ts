import type { CalendarEvent } from './google';
import { addDaysISO, santiagoToDate } from './format';

/**
 * Semana laboral de Camila sintética (R2: inventada, rotulada como tal). Sale de la ficha del caso:
 * jefa de proyectos en una constructora, sale 07:45, vuelve entre 19:00 y 21:00, y «reuniones que se alargan,
 * los martes y jueves que llega tarde a la casa» (docs/hackathon/Caso1.md). Por eso martes y jueves no le calzan.
 */
const WEEK: Array<{ day: number; start: string; end: string; title: string }> = [
  { day: 0, start: '08:30', end: '09:00', title: 'Daily de obra' },
  { day: 0, start: '15:00', end: '17:00', title: 'Comité de proyecto' },
  { day: 1, start: '08:30', end: '09:00', title: 'Daily de obra' },
  { day: 1, start: '17:30', end: '20:15', title: 'Reunión con mandante' },
  { day: 2, start: '08:30', end: '09:00', title: 'Daily de obra' },
  { day: 2, start: '16:00', end: '16:30', title: '1:1 con Diego' },
  { day: 3, start: '08:30', end: '09:00', title: 'Daily de obra' },
  { day: 3, start: '14:00', end: '18:00', title: 'Visita a terreno' },
  { day: 3, start: '18:00', end: '20:30', title: 'Reunión que se alarga' },
  { day: 4, start: '08:30', end: '09:00', title: 'Daily de obra' },
  { day: 4, start: '17:00', end: '18:30', title: 'Cierre semanal' },
];

export const SAMPLE_LABEL = 'Calendario de ejemplo de Camila (inventado)';

/** Eventos de la semana que empieza el lunes `weekOf`, con la misma forma que los de Google. */
export function sampleWorkWeek(weekOf: string): CalendarEvent[] {
  return WEEK.map((e, i) => {
    const date = addDaysISO(weekOf, e.day);
    return {
      id: `ejemplo-${date}-${i}`,
      title: e.title,
      start: santiagoToDate(date, e.start),
      end: santiagoToDate(date, e.end),
      allDay: false,
    };
  });
}

const icsDate = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
const icsText = (s: string) => s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');

/**
 * La misma semana como .ics recurrente (semanal), para importarla en la cuenta de Google sintética del demo.
 * Arranca en `firstWeekOf` para cubrir también las semanas del historial semilla.
 */
export function sampleIcs(firstWeekOf: string, weeks: number): string {
  const stamp = icsDate(new Date());
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//gogym//Calendario de ejemplo//ES', 'CALSCALE:GREGORIAN'];
  sampleWorkWeek(firstWeekOf).forEach((e, i) => {
    lines.push(
      'BEGIN:VEVENT',
      `UID:lacita-ejemplo-${i}@lacita.demo`,
      `DTSTAMP:${stamp}`,
      `DTSTART:${icsDate(e.start)}`,
      `DTEND:${icsDate(e.end)}`,
      `RRULE:FREQ=WEEKLY;COUNT=${weeks}`,
      `SUMMARY:${icsText(e.title)}`,
      'DESCRIPTION:Camila sintética · datos inventados para el demo de gogym',
      'TRANSP:OPAQUE',
      'END:VEVENT',
    );
  });
  lines.push('END:VCALENDAR');
  return lines.join('\r\n') + '\r\n';
}
