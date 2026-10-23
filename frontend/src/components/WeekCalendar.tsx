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

  const placed = events
    .filter((e) => !e.allDay)
    .map((e) => {
      const s = santiagoParts(e.start);
      const en = santiagoParts(e.end);
      const dayIndex = cal.days.findIndex((d) => d.date === s.date);
      const endMin = en.date === s.date ? en.minutes : 24 * 60;
      return { ...e, dayIndex, startMin: s.minutes, endMin };
    })
    .filter((e) => e.dayIndex >= 0 && e.endMin > e.startMin);

  let from = hhmmToMinutes(cal.hourRange.from);
  let to = hhmmToMinutes(cal.hourRange.to);
  for (const e of placed) {
    from = Math.min(from, Math.max(7 * 60, e.startMin));
    to = Math.max(to, Math.min(23 * 60, e.endMin));
  }
  from = Math.floor(from / 60) * 60;
  to = Math.ceil(to / 60) * 60;
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
        {google === 'off' && canConnect && (
          <button className="btn btn-sm" onClick={onConnect}>
            Conectar Google Calendar
          </button>
        )}
        {google === 'loading' && <span>Leyendo tu calendario…</span>}
        {googleNote && <span>{googleNote}</span>}
      </div>

      <div className="cal-scroll">
        <div className="cal" role="grid" aria-label="Calendario semanal">
          <div />
          {cal.days.map((d, i) => (
            <div key={d.date} className={`cal-dayhead${i === todayIndex ? ' today' : ''}`} role="columnheader">
              <div className="wd">{DAY_SHORT[i]}</div>
              <div className="dn">{Number(d.date.slice(8))}</div>
            </div>
          ))}

          <div className="cal-hours" style={{ height }}>
            {hours.map((m) => (
              <span key={m} className="cal-hour" style={{ top: y(m) }}>
                {String(m / 60).padStart(2, '0')}:00
              </span>
            ))}
          </div>

          {cal.days.map((d, i) => (
            <div key={d.date} className={`cal-col${i === todayIndex ? ' today' : ''}`} style={{ height }}>
              {hours.map((m) => (
                <div key={m} className="cal-line" style={{ top: y(m) }} />
              ))}
              {winStart !== null && winEnd !== null && (
                <div className="cal-window" style={{ top: y(winStart), height: y(winEnd) - y(winStart) }} />
              )}
              {placed
                .filter((e) => e.dayIndex === i)
                .map((e) => (
                  <div
                    key={e.id}
                    className="ev ev-busy"
                    style={{ top: y(e.startMin), height: Math.max(18, y(e.endMin) - y(e.startMin)) }}
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
                    style={{ top: y(b.startMinutes), height: Math.max(34, b.durationMin * pxPerMin) }}
                    title={`${b.time} · ${b.label}`}
                  >
                    <div className="t">{b.time}</div>
                    <div>
                      {b.label}
                      {b.wasMoved && b.label !== 'Movida' ? ' · movida' : ''}
                    </div>
                  </div>
                ))}
              {i === todayIndex && nowParts && nowParts.minutes >= from && nowParts.minutes <= to && (
                <div className="cal-now" style={{ top: y(nowParts.minutes) }} aria-label="Ahora" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
