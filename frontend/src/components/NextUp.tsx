import type { Summary } from '../lib/api-types';
import { capitalize, fmtCLP, fmtDay, fmtTime } from '../lib/format';

export default function NextUp({ summary, synthetic }: { summary: Summary | null; synthetic: boolean }) {
  const next = summary?.nextAppointment;
  return (
    <section className="panel next" aria-label="Tu próxima cita">
      <div>
        <div className="eyebrow">Tu próxima cita contigo</div>
        {next?.startsAt ? (
          <>
            <p className="display next-time">{fmtTime(next.startsAt)}</p>
            <p className="display next-day">{capitalize(fmtDay(next.startsAt))}</p>
            <p className="small muted" style={{ margin: '0.4rem 0 0' }}>
              {next.durationMin} min · {next.venue}
              {next.wasMoved ? ' · la moviste y está bien' : ''}
            </p>
          </>
        ) : (
          <>
            <p className="display next-time" style={{ color: 'var(--text-2)' }}>
              —
            </p>
            <p className="next-day display">Sin hora elegida esta semana</p>
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
