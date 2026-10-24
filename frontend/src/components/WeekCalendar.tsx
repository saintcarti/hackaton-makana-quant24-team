import type { CalendarWeek } from '../lib/api-types';
import { DAY_MINUTES, layoutLanes, type Segment } from '../lib/calendar';
import { capitalize, hhmmToMinutes, santiagoParts } from '../lib/format';
import { endToMinutes } from '../lib/prefs';

export type GoogleState = 'off' | 'loading' | 'on' | 'error';

export interface Suggestion {
  key: string;
  dayIndex: number;
  startMin: number;
  endMin: number;
  label: string;
}

interface Props {
  cal: CalendarWeek | null;
  segments: Segment[];
  now: string | null;
  window: { start: string; end: string } | null;
  gymHours?: { open: string; close: string } | null;
  suggestions?: Suggestion[];
  /** Foco del split de cada cita (índice del día → «Push», «Pull»…); vacío si el plan está en pausa. */
  focusByDay?: Record<number, string>;
  /** De dónde salen las horas ocupadas (Google o el calendario de ejemplo); null si no hay. */
  busyLabel?: string | null;
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
const EVENTS_FLOOR = 7 * 60;
const EVENTS_CEIL = 23 * 60;

const fmtMin = (m: number) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;

export default function WeekCalendar({
  cal,
  segments,
  now,
  window: gymWindow,
  gymHours,
  suggestions = [],
  focusByDay = {},
  busyLabel = null,
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

  // El backend fija hourRange en 18:00–21:30; las citas fuera de ese rango (p. ej. sábado 11:00) igual deben caber.
  let from = hhmmToMinutes(cal.hourRange.from);
  let to = hhmmToMinutes(cal.hourRange.to);
  for (const b of cal.blocks) {
    from = Math.min(from, b.startMinutes);
    to = Math.max(to, Math.min(DAY_MINUTES, b.startMinutes + b.durationMin));
  }
  for (const s of suggestions) {
    from = Math.min(from, s.startMin);
    to = Math.max(to, s.endMin);
  }
  for (const s of segments) {
    // Un tramo de madrugada (p. ej. la cola de un evento que cruza la medianoche) no debe estirar la grilla.
    if (s.endMin <= EVENTS_FLOOR || s.startMin >= EVENTS_CEIL) continue;
    from = Math.min(from, Math.max(EVENTS_FLOOR, s.startMin));
    to = Math.max(to, Math.min(EVENTS_CEIL, s.endMin));
  }
  from = Math.floor(from / 60) * 60;
  to = Math.ceil(to / 60) * 60;

  const visible = layoutLanes(
    segments.filter((s) => s.endMin > from && s.startMin < to),
    cal.days.length,
  );
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
  const gymOpen = gymHours ? hhmmToMinutes(gymHours.open) : null;
  const gymClose = gymHours ? endToMinutes(gymHours.close) : null;
  const closedBands: Array<{ start: number; end: number }> = [];
  if (gymOpen !== null && gymOpen > from) closedBands.push({ start: from, end: gymOpen });
  if (gymClose !== null && gymClose < to) closedBands.push({ start: gymClose, end: to });
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
        {suggestions.length > 0 && (
          <span>
            <i className="sw sw-suggest" /> Dónde cabe tu sesión
          </span>
        )}
        {busyLabel && (
          <span>
            <i className="sw sw-busy" /> {busyLabel}
          </span>
        )}
        {gymWindow && (
          <span>
            <i className="sw sw-window" /> Tu ventana ({gymWindow.start}–{gymWindow.end})
          </span>
        )}
        {closedBands.length > 0 && gymHours && (
          <span>
            <i className="sw sw-closed" /> Gym cerrado (fuera del horario {gymHours.open}–
            {gymHours.close === '00:00' ? '24:00' : gymHours.close})
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
              {closedBands.map((band) => (
                <div
                  key={`closed-${band.start}`}
                  className="cal-closed"
                  style={{ top: y(band.start), height: y(band.end) - y(band.start) }}
                  aria-hidden="true"
                />
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
              {suggestions
                .filter((s) => s.dayIndex === i)
                .map((s) => (
                  <div
                    key={s.key}
                    className="ev ev-suggest"
                    style={{ top: y(s.startMin), height: Math.max(46, y(s.endMin) - y(s.startMin)) }}
                    title={`${s.label} · ${fmtMin(s.startMin)}–${fmtMin(s.endMin)}`}
                  >
                    <div className="t">{fmtMin(s.startMin)}</div>
                    <div>{s.label}</div>
                  </div>
                ))}
              {cal.blocks
                .filter((b) => b.dayIndex === i)
                .map((b) => (
                  <div
                    key={b.id}
                    className={`ev ev-cita ${b.status}`}
                    style={{ top: y(b.startMinutes), height: Math.max(42, b.durationMin * pxPerMin) }}
                    title={`${b.time} · ${b.label}${focusByDay[i] ? ` · ${focusByDay[i]}` : ''}`}
                  >
                    {/* El foco va en el renglón de la hora: un tercer renglón no cabe en una cita de 40 min. */}
                    <div className="t">
                      {b.time}
                      {focusByDay[i] && <span className="ev-focus"> · {focusByDay[i]}</span>}
                    </div>
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
