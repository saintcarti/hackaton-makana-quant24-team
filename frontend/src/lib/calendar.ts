import type { CalendarWeek } from './api-types';
import type { CalendarEvent } from './google';
import { santiagoParts } from './format';

export const DAY_MINUTES = 24 * 60;

/** Un tramo dentro de un día de la semana visible, en minutos desde la medianoche de Santiago. */
export interface Segment {
  key: string;
  title: string;
  dayIndex: number;
  startMin: number;
  endMin: number;
}

export interface Placed extends Segment {
  lane: number;
  lanes: number;
}

/** Corta cada evento en un tramo por día de la semana visible (los de varios días aparecen en todos). */
export function toSegments(events: CalendarEvent[], days: CalendarWeek['days']): Segment[] {
  const out: Segment[] = [];
  for (const e of events) {
    if (e.allDay) continue;
    const s = santiagoParts(e.start);
    const en = santiagoParts(e.end);
    days.forEach((d, dayIndex) => {
      if (d.date < s.date || d.date > en.date) return;
      const startMin = d.date === s.date ? s.minutes : 0;
      const endMin = d.date === en.date ? en.minutes : DAY_MINUTES;
      if (endMin > startMin) out.push({ key: `${e.id}:${d.date}`, title: e.title, dayIndex, startMin, endMin });
    });
  }
  return out;
}

/**
 * Eventos de día completo marcados como ocupados → un tramo 00:00–24:00 por cada fecha que cubren.
 * La grilla no los dibuja (no son horas), pero el cálculo de dónde cabe sí tiene que respetarlos.
 */
export function allDaySegments(events: CalendarEvent[], days: CalendarWeek['days']): Segment[] {
  const out: Segment[] = [];
  for (const e of events) {
    if (!e.allDay || !e.allDayStart || !e.allDayEnd) continue;
    days.forEach((d, dayIndex) => {
      if (d.date >= e.allDayStart! && d.date < e.allDayEnd!) {
        out.push({ key: `${e.id}:${d.date}:dia`, title: e.title, dayIndex, startMin: 0, endMin: DAY_MINUTES });
      }
    });
  }
  return out;
}

/** Eventos simultáneos lado a lado: carriles dentro de cada grupo de solapamiento. Recibe los tramos de UN día. */
function layoutDay(segs: Segment[]): Placed[] {
  const out: Placed[] = [];
  const sorted = [...segs].sort((a, b) => a.startMin - b.startMin || b.endMin - a.endMin);
  let cluster: Segment[] = [];
  let clusterEnd = -1;
  const flush = () => {
    const laneEnds: number[] = [];
    const assigned = cluster.map((s) => {
      let lane = laneEnds.findIndex((end) => end <= s.startMin);
      if (lane === -1) {
        lane = laneEnds.length;
        laneEnds.push(s.endMin);
      } else {
        laneEnds[lane] = s.endMin;
      }
      return { ...s, lane };
    });
    for (const a of assigned) out.push({ ...a, lanes: laneEnds.length });
    cluster = [];
    clusterEnd = -1;
  };
  for (const s of sorted) {
    if (cluster.length && s.startMin >= clusterEnd) flush();
    cluster.push(s);
    clusterEnd = Math.max(clusterEnd, s.endMin);
  }
  if (cluster.length) flush();
  return out;
}

/** Carriles por día: dos eventos de días distintos nunca se angostan entre sí. */
export function layoutLanes(segs: Segment[], dayCount: number): Placed[] {
  const out: Placed[] = [];
  for (let i = 0; i < dayCount; i++) out.push(...layoutDay(segs.filter((s) => s.dayIndex === i)));
  return out;
}
