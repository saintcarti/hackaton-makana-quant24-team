import type { CalendarWeek } from '../lib/api-types';
import type { CalendarEvent } from '../lib/google';
import { capitalize, hhmmToMinutes, santiagoParts } from '../lib/format';

export type GoogleState = 'off' | 'loading' | 'on' | 'error';

interface Props {
  cal: CalendarWeek | null;
  events: CalendarEvent[];
  now: string | null;
  window: { start: string; end: string } | null;
  google: GoogleState;
  googleNote: string | null;
  canConnect: boolean;
  onConnect: () => void;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  isCurrentWeek: boolean;
}

const DAY_SHORT = ['lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom'];
const DAY_LONG = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];
const DAY_MIN = 0;
const DAY_MAX = 24 * 60;
const EVENTS_FLOOR = 7 * 60;
const EVENTS_CEIL = 23 * 60;

interface Segment {
  key: string;
  title: string;
  dayIndex: number;
  startMin: number;
  endMin: number;
}

interface Placed extends Segment {
  lane: number;
  lanes: number;
}

/** Corta cada evento en un tramo por día de la semana visible (los de varios días aparecen en todos). */
function toSegments(events: CalendarEvent[], days: CalendarWeek['days']): Segment[] {
  const out: Segment[] = [];
  for (const e of events) {
    if (e.allDay) continue;
    const s = santiagoParts(e.start);
    const en = santiagoParts(e.end);
    days.forEach((d, dayIndex) => {
      if (d.date < s.date || d.date > en.date) return;
      const startMin = d.date === s.date ? s.minutes : DAY_MIN;
      const endMin = d.date === en.date ? en.minutes : DAY_MAX;
      if (endMin > startMin) out.push({ key: `${e.id}:${d.date}`, title: e.title, dayIndex, startMin, endMin });
    });
  }
  return out;
}

/** Eventos simultáneos lado a lado: carriles dentro de cada grupo de solapamiento. */
function layoutLanes(segs: Segment[]): Placed[] {
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

export default function WeekCalendar({
  cal,
  events,
  now,
  window: gymWindow,
  google,
  googleNote,
  canConnect,
  onConnect,
  onPrev,
  onNext,
  onToday,
  isCurrentWeek,
}: Props) {
  if (!cal) {
    return (
      <section className="panel">
        <div className="panel-body muted">Cargando tu semana…</div>
      </section>
    );
  }

  const segments = toSegments(events, cal.days);

  // El backend fija hourRange en 18:00–21:30; las citas fuera de ese rango (p. ej. sábado 11:00) igual deben caber.
  let from = hhmmToMinutes(cal.hourRange.from);
  let to = hhmmToMinutes(cal.hourRange.to);
  for (const b of cal.blocks) {
    from = Math.min(from, b.startMinutes);
    to = Math.max(to, Math.min(DAY_MAX, b.startMinutes + b.durationMin));
  }
  for (const s of segments) {
    from = Math.min(from, Math.max(EVENTS_FLOOR, s.startMin));
    to = Math.max(to, Math.min(EVENTS_CEIL, s.endMin));
  }
  from = Math.floor(from / 60) * 60;
  to = Math.ceil(to / 60) * 60;

  const visible = layoutLanes(segments.filter((s) => s.endMin > from && s.startMin < to));
  const span = to - from;
  const pxPerMin = span > 8 * 60 ? 0.8 : 1.15;
  const height = span * pxPerMin;
  const y = (min: number) => (Math.min(Math.max(min, from), to) - from) * pxPerMin;

  const hours: number[] = [];
  for (let m = from; m <= to; m += 60) hours.push(m);

  const nowParts = now ? santiagoParts(new Date(now)) : null;
  const todayIndex = nowParts ? cal.days.findIndex((d) => d.date === nowParts.date) : -1;

  const first = cal.days[0];
  const last = cal.days[6];
  const monthFmt = (iso: string) =>
    new Intl.DateTimeFormat('es-CL', { month: 'long', timeZone: 'UTC' }).format(new Date(`${iso}T12:00:00Z`));
  const title =
    monthFmt(first.date) === monthFmt(last.date)
      ? `${Number(first.date.slice(8))}–${Number(last.date.slice(8))} de ${monthFmt(last.date)}`
      : `${Number(first.date.slice(8))} de ${monthFmt(first.date)} – ${Number(last.date.slice(8))} de ${monthFmt(last.date)}`;

  const winStart = gymWindow ? hhmmToMinutes(gymWindow.start) : null;
  const winEnd = gymWindow ? hhmmToMinutes(gymWindow.end) : null;
  const showConnect = canConnect && (google === 'off' || google === 'error');

  return (
    <section className="panel" aria-label="Tu semana">
      <div className="panel-head">
        <h2 className="display">{capitalize(title)}</h2>
        <div className="spacer" />
        <div className="cal-nav">
          <button className="btn btn-quiet btn-sm" onClick={onPrev} aria-label="Semana anterior">
            ←
          </button>
          {!isCurrentWeek && (
            <button className="btn btn-quiet btn-sm" onClick={onToday}>
              Próxima cita
            </button>
          )}
          <button className="btn btn-quiet btn-sm" onClick={onNext} aria-label="Semana siguiente">
            →
          </button>
        </div>
      </div>

      <div className="cal-legend">
        <span>
          <i className="sw sw-cita" /> Tu cita contigo
        </span>
        {google === 'on' && (
          <span>
            <i className="sw sw-busy" /> Tu calendario de Google
          </span>
        )}
        {gymWindow && (
          <span>
            <i className="sw sw-window" /> Tu ventana ({gymWindow.start}–{gymWindow.end})
          </span>
        )}
        <span style={{ flex: 1 }} />
        {google === 'loading' && <span>Leyendo tu calendario…</span>}
        {googleNote && <span>{googleNote}</span>}
        {showConnect && (
          <button className="btn btn-sm" onClick={onConnect}>
            {google === 'error' ? 'Reconectar Google' : 'Conectar Google Calendar'}
          </button>
        )}
      </div>

      <div className="cal-scroll">
        <div className="cal" aria-label="Calendario semanal">
          <div aria-hidden="true" />
          {cal.days.map((d, i) => (
            <div key={d.date} className={`cal-dayhead${i === todayIndex ? ' today' : ''}`} aria-hidden="true">
              <div className="wd">{DAY_SHORT[i]}</div>
              <div className="dn">{Number(d.date.slice(8))}</div>
            </div>
          ))}

          <div className="cal-hours" style={{ height }} aria-hidden="true">
            {hours.map((m) => (
              <span key={m} className="cal-hour" style={{ top: y(m) }}>
                {String(m / 60).padStart(2, '0')}:00
              </span>
            ))}
          </div>

          {cal.days.map((d, i) => (
            <div
              key={d.date}
              className={`cal-col${i === todayIndex ? ' today' : ''}`}
              style={{ height }}
              role="group"
              aria-label={`${DAY_LONG[i]} ${Number(d.date.slice(8))}${i === todayIndex ? ', hoy' : ''}`}
            >
              {hours.map((m) => (
                <div key={m} className="cal-line" style={{ top: y(m) }} aria-hidden="true" />
              ))}
              {winStart !== null && winEnd !== null && (
                <div
                  className="cal-window"
                  style={{ top: y(winStart), height: y(winEnd) - y(winStart) }}
                  aria-hidden="true"
                />
              )}
              {visible
                .filter((e) => e.dayIndex === i)
                .map((e) => (
                  <div
                    key={e.key}
                    className="ev ev-busy"
                    style={{
                      top: y(e.startMin),
                      height: Math.max(18, y(e.endMin) - y(e.startMin)),
                      left: `calc(4px + (100% - 8px) * ${e.lane} / ${e.lanes})`,
                      width: `calc((100% - 8px) / ${e.lanes} - ${e.lanes > 1 ? 2 : 0}px)`,
                      right: 'auto',
                    }}
                    title={e.title}
                  >
                    {e.title}
                  </div>
                ))}
              {cal.blocks
                .filter((b) => b.dayIndex === i)
                .map((b) => (
                  <div
                    key={b.id}
                    className={`ev ev-cita ${b.status}`}
                    style={{ top: y(b.startMinutes), height: Math.max(42, b.durationMin * pxPerMin) }}
                    title={`${b.time} · ${b.label}`}
                  >
                    <div className="t">{b.time}</div>
                    <div>{b.label}</div>
                  </div>
                ))}
              {i === todayIndex && nowParts && nowParts.minutes >= from && nowParts.minutes <= to && (
                <div className="cal-now" style={{ top: y(nowParts.minutes) }} aria-hidden="true" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
