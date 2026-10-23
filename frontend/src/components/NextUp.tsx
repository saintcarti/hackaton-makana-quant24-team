import type { AppointmentView, Summary } from '../lib/api-types';
import { capitalize, fmtCLP, fmtDay, fmtTime, mondayOf, santiagoParts } from '../lib/format';

interface Props {
  summary: Summary | null;
  appts: AppointmentView[];
  now: string | null;
  synthetic: boolean;
}

export default function NextUp({ summary, appts, now, synthetic }: Props) {
  const next = summary?.nextAppointment ?? null;
  // Sin próxima cita, se muestra la de esta semana tal cual (p. ej. «Realizada» tras el «listo»), sin suponer nada.
  const thisWeek =
    !next && now
      ? appts
          .filter((a) => a.startsAt && a.weekOf === mondayOf(santiagoParts(new Date(now)).date))
          .sort((a, b) => (b.startsAt ?? '').localeCompare(a.startsAt ?? ''))[0] ?? null
      : null;
  const shown = next ?? thisWeek;

  return (
    <section className="panel next" aria-label="Tu cita contigo">
      <div>
        <div className="eyebrow">{next || !thisWeek ? 'Tu próxima cita contigo' : 'Tu cita de esta semana'}</div>
        {!summary ? (
          <p className="display next-day" style={{ marginTop: '0.75rem' }}>
            Cargando…
          </p>
        ) : shown?.startsAt ? (
          <>
            <p className="display next-time">{fmtTime(shown.startsAt)}</p>
            <p className="display next-day">{capitalize(fmtDay(shown.startsAt))}</p>
            <p className="small muted" style={{ margin: '0.4rem 0 0', display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <span className={`chip${shown.status === 'done' ? '' : ' chip-accent'}`}>{shown.label}</span>
              {shown.durationMin} min · {shown.venue}
            </p>
          </>
        ) : (
          <>
            <p className="display next-time" style={{ color: 'var(--text-2)' }}>
              —
            </p>
            <p className="next-day display">Esta semana todavía no hay cita</p>
            <p className="small muted" style={{ margin: '0.4rem 0 0' }}>
              El domingo a las 20:00 te escribimos con dos horarios que te calzan.
            </p>
          </>
        )}
      </div>
      {summary && (
        <div className="next-meta">
          <div className="stat">
            <span className="eyebrow">Recuperaste</span>
            <b>{fmtCLP(summary.recoveredCLP)}</b>
            <span className="small muted">de mensualidades que ya estaban pagadas</span>
          </div>
          <div className="stat">
            <span className="eyebrow">Últimas 6 semanas</span>
            <span>
              {summary.visitsLast6Weeks} citas realizadas · {summary.movesLast6Weeks} movidas
            </span>
          </div>
          {synthetic && <span className="chip">Camila sintética · datos inventados</span>}
        </div>
      )}
    </section>
  );
}
