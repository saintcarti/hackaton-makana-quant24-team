import { useEffect, useMemo, useRef, useState } from 'react';
import type { AppointmentView } from '../lib/api-types';
import { addDaysISO, santiagoParts } from '../lib/format';

const DAYS = ['lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom'];
const STEP_MS = 900;

function mondayOf(dateISO: string) {
  const d = new Date(`${dateISO}T12:00:00`);
  return addDaysISO(dateISO, -((d.getDay() + 6) % 7));
}

function weekdayIndex(iso: string) {
  const { date } = santiagoParts(new Date(iso));
  return (new Date(`${date}T12:00:00`).getDay() + 6) % 7;
}

function fmtRate(n: number) {
  return n.toLocaleString('es-CL', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function weekLabel(weekOf: string) {
  return new Intl.DateTimeFormat('es-CL', { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(
    new Date(`${weekOf}T12:00:00Z`),
  );
}

interface Week {
  weekOf: string;
  appts: AppointmentView[];
  visits: number;
  moves: number;
  inProgress: boolean;
  rate: number | null;
}

function useTween(target: number, ms = 600) {
  const [value, setValue] = useState(target);
  const from = useRef(target);
  useEffect(() => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      from.current = target;
      setValue(target);
      return;
    }
    // setInterval y no requestAnimationFrame: rAF se congela con la ventana tapada y el número quedaría viejo.
    const start = performance.now();
    const a = from.current;
    const id = window.setInterval(() => {
      const k = Math.min(1, (performance.now() - start) / ms);
      const eased = 1 - Math.pow(1 - k, 3);
      setValue(a + (target - a) * eased);
      if (k >= 1) {
        from.current = target;
        window.clearInterval(id);
      }
    }, 30);
    return () => {
      from.current = target;
      window.clearInterval(id);
    };
  }, [target, ms]);
  return value;
}

export default function SixWeeks({ appts, now }: { appts: AppointmentView[]; now: string | null }) {
  const weeks = useMemo<Week[]>(() => {
    const dated = appts.filter((a) => a.startsAt);
    if (!dated.length || !now) return [];
    const current = mondayOf(santiagoParts(new Date(now)).date);
    const first = dated.map((a) => a.weekOf).sort()[0];
    const out: Week[] = [];
    let cumVisits = 0;
    let completed = 0;
    // Semanas continuas: una semana sin citas también cuenta (y se ve).
    for (let w = first; w <= current; w = addDaysISO(w, 7)) {
      const inWeek = dated.filter((a) => a.weekOf === w);
      const visits = inWeek.filter((a) => a.status === 'done').length;
      const moves = inWeek.reduce((n, a) => n + a.moves.length, 0);
      const inProgress = w === current;
      let rate: number | null = null;
      if (!inProgress) {
        cumVisits += visits;
        completed += 1;
        rate = cumVisits / completed;
      }
      out.push({ weekOf: w, appts: inWeek, visits, moves, inProgress, rate });
    }
    return out;
  }, [appts, now]);

  const [shown, setShown] = useState<number>(Number.POSITIVE_INFINITY);
  const timer = useRef<number | null>(null);

  useEffect(() => () => {
    if (timer.current) window.clearInterval(timer.current);
  }, []);

  function play() {
    if (timer.current) window.clearInterval(timer.current);
    setShown(0);
    let i = 0;
    timer.current = window.setInterval(() => {
      i += 1;
      setShown(i);
      if (i >= weeks.length) {
        window.clearInterval(timer.current!);
        timer.current = null;
      }
    }, STEP_MS);
  }

  const visible = weeks.slice(0, Math.min(shown, weeks.length));
  const done = visible.filter((w) => !w.inProgress);
  const lastRate = done.length ? done[done.length - 1].rate ?? 0 : 0;
  const rate = useTween(lastRate);
  const totals = {
    visits: done.reduce((n, w) => n + w.visits, 0),
    moves: done.reduce((n, w) => n + w.moves, 0),
    zero: done.filter((w) => w.visits === 0).length,
    weeks: done.length,
  };
  const playing = timer.current !== null && shown < weeks.length;

  if (!weeks.length) {
    return (
      <section className="panel">
        <div className="panel-body muted">Todavía no hay historial para mostrar.</div>
      </section>
    );
  }

  return (
    <section className="panel" aria-label="Seis semanas de Camila sintética">
      <div className="panel-head">
        <div>
          <div className="eyebrow">Lo que mide el equipo · no lo ve Camila</div>
          <h2 className="display">Cómo se sostiene, semana a semana</h2>
        </div>
        <div className="spacer" />
        <button className="btn btn-sm" onClick={play} disabled={playing}>
          {playing ? 'Reproduciendo…' : 'Reproducir las semanas'}
        </button>
      </div>

      <div className="vu">
        <div className="vu-figure">
          <b className="display" aria-live="polite">
            {fmtRate(rate)}
          </b>
          <span>visitas por semana, promedio acumulado</span>
        </div>
        <p className="vu-line">
          {totals.visits} visitas en {totals.weeks} {totals.weeks === 1 ? 'semana' : 'semanas'} · {totals.moves}{' '}
          {totals.moves === 1 ? 'movida' : 'movidas'} ·{' '}
          {totals.zero === 0 ? 'ninguna semana en cero' : `${totals.zero} ${totals.zero === 1 ? 'semana' : 'semanas'} en cero`}
        </p>
        <p className="fineprint" style={{ margin: 0 }}>
          Camila sintética: historial inventado (R2). La métrica que decide es este promedio a 90 días (V/U90), y
          sigue siendo la hipótesis que mide el piloto.
        </p>
      </div>

      <div className="wk-scroll">
        <div className="wk" role="table" aria-label="Citas por semana">
          <div className="wk-row wk-head" role="row">
            <span role="columnheader">Semana</span>
            {DAYS.map((d) => (
              <span key={d} role="columnheader">
                {d}
              </span>
            ))}
            <span role="columnheader">Visitas</span>
            <span role="columnheader">Promedio</span>
          </div>
          {weeks.map((w, i) => {
            const ghosts = w.appts.flatMap((a) =>
              a.moves.map((m) => ({ key: `${a.id}-${m.at}`, day: weekdayIndex(m.from), to: weekdayIndex(m.to) })),
            );
            return (
              <div key={w.weekOf} className={`wk-row${i < shown ? ' on' : ' off'}`} role="row">
                <span className="wk-label" role="rowheader">
                  {weekLabel(w.weekOf)}
                  {w.inProgress && <em> en curso</em>}
                </span>
                {DAYS.map((_, day) => (
                  <span key={day} className="wk-cell" role="cell">
                    {ghosts
                      .filter((g) => g.day === day && g.to !== day)
                      .map((g) => (
                        <span key={g.key} className="wk-chip ghost" title="De acá se movió">
                          movida → {DAYS[g.to]}
                        </span>
                      ))}
                    {w.appts
                      .filter((a) => weekdayIndex(a.startsAt!) === day)
                      .map((a) => (
                        <span
                          key={a.id}
                          className={`wk-chip ${a.status}`}
                          title={`${a.local?.time ?? ''} · ${a.label}${a.source === 'default' ? ' · la agendó el silencio' : ''}`}
                        >
                          {a.status === 'done' ? a.local?.time : a.label}
                          {a.source === 'default' && <small>el silencio agendó</small>}
                        </span>
                      ))}
                  </span>
                ))}
                <span className="wk-num" role="cell">
                  {w.visits}
                </span>
                <span className="wk-num" role="cell">
                  {w.rate === null ? '—' : fmtRate(w.rate)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
