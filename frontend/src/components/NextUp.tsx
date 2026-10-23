import type { AppointmentView, Summary } from '../lib/api-types';
import { capitalize, fmtCLP, fmtDay, fmtShortDate, fmtTime } from '../lib/format';

export function NextUp({ summary, synthetic }: { summary: Summary | null; synthetic: boolean }) {
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

export function History({ items }: { items: AppointmentView[] }) {
  const sorted = [...items]
    .filter((a) => a.startsAt)
    .sort((a, b) => (b.startsAt ?? '').localeCompare(a.startsAt ?? ''))
    .slice(0, 12);
  return (
    <section className="panel" aria-label="Historial de citas">
      <div className="panel-head">
        <h2 className="display">Tus citas</h2>
        <span className="small muted">Mover no es fallar: las movidas son parte del plan.</span>
      </div>
      <div className="panel-body">
        {sorted.length === 0 ? (
          <p className="muted">Todavía no hay citas.</p>
        ) : (
          <ul className="history">
            {sorted.map((a) => (
              <li key={a.id}>
                <span>{capitalize(fmtShortDate(a.startsAt!))}</span>
                <span className="h-time">{fmtTime(a.startsAt!)}</span>
                <span className="muted small">{a.wasMoved ? `Movida ${a.moves.length}×` : a.venue}</span>
                <span className={`chip${a.status === 'done' ? '' : ' chip-accent'}`}>{a.label}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
