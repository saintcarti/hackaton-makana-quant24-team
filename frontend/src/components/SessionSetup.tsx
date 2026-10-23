import { useEffect, useRef, useState } from 'react';
import { fmtMin, type FitEntry } from '../lib/fit';
import {
  PER_WEEK_OPTIONS,
  SESSION_OPTIONS,
  prefsProblem,
  prefsSummary,
  type PrefsSource,
  type SessionPrefs,
} from '../lib/prefs';

interface Props {
  prefs: SessionPrefs;
  source: PrefsSource;
  entries: FitEntry[];
  /** Eligió «Esta semana no»: no se sugiere nada. */
  restWeek: boolean;
  /** Fecha de hoy en Santiago (reloj del backend), para saber si a la semana visible le queda algo. */
  today: string | null;
  onNextWeek: () => void;
  weekTitle: string;
  /** Fuente de las horas ocupadas, como frase («tu calendario de Google»); null si no hay ninguna. */
  calendarPhrase: string | null;
  saveNote: string | null;
  onSave: (p: SessionPrefs) => Promise<void>;
}

type Mode = 'ask-gym' | 'ask-duration' | 'summary' | 'edit';

const DAY_SHORT = ['lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom'];
// Orden de la semana en pantalla (lunes primero) → convención 0 = domingo.
const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];
const DAY_LETTER: Record<number, string> = { 1: 'L', 2: 'M', 3: 'X', 4: 'J', 5: 'V', 6: 'S', 0: 'D' };
const DAY_FULL: Record<number, string> = {
  1: 'lunes',
  2: 'martes',
  3: 'miércoles',
  4: 'jueves',
  5: 'viernes',
  6: 'sábado',
  0: 'domingo',
};

export default function SessionSetup({
  prefs,
  source,
  entries,
  restWeek,
  today,
  onNextWeek,
  weekTitle,
  calendarPhrase,
  saveNote,
  onSave,
}: Props) {
  const [mode, setMode] = useState<Mode>(source === 'default' ? 'ask-gym' : 'summary');
  const [draft, setDraft] = useState<SessionPrefs>(prefs);
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const gymOpenRef = useRef<HTMLInputElement>(null);

  // Si cambian las reglas desde afuera (otra usuaria, backend) y no se está editando, se reflejan.
  useEffect(() => {
    if (mode !== 'edit') setDraft(prefs);
  }, [prefs, mode]);

  useEffect(() => {
    if (mode === 'edit') gymOpenRef.current?.focus();
  }, [mode]);

  // Si las reglas llegan configuradas desde el backend mientras se mostraba la primera pregunta, pasa al resumen.
  useEffect(() => {
    if (source !== 'default' && !savingRef.current) setMode((m) => (m === 'ask-gym' || m === 'ask-duration' ? 'summary' : m));
  }, [source]);

  async function save(next: SessionPrefs) {
    if (savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    try {
      await onSave(next);
      setMode('summary');
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }

  const problem = prefsProblem(draft);
  const set = (patch: Partial<SessionPrefs>) => setDraft((d) => ({ ...d, ...patch }));
  const toggleDay = (day: number) =>
    set({ days: draft.days.includes(day) ? draft.days.filter((d) => d !== day) : [...draft.days, day].sort() });

  if (mode === 'ask-gym') {
    return (
      <section className="panel setup" aria-label="Tu sesión">
        <div className="eyebrow">Antes de buscar dónde cabe tu sesión</div>
        <h2 className="display setup-q">
          ¿Tu gym abre de {prefs.gymHours.open} a {prefs.gymHours.close}?
        </h2>
        <div className="setup-actions">
          <button className="btn btn-primary" onClick={() => setMode('ask-duration')}>
            Sí, ese es
          </button>
          <button className="btn" onClick={() => setMode('edit')}>
            Otro horario
          </button>
        </div>
      </section>
    );
  }

  if (mode === 'ask-duration') {
    return (
      <section className="panel setup" aria-label="Tu sesión">
        <div className="eyebrow">Una más y listo</div>
        <h2 className="display setup-q">¿Cuánto dura tu sesión?</h2>
        <div className="chips" role="group" aria-label="Duración de la sesión">
          {SESSION_OPTIONS.map((m) => (
            <button
              key={m}
              className="chip-btn"
              aria-pressed={draft.sessionMin === m}
              disabled={saving}
              onClick={() => save({ ...draft, sessionMin: m })}
            >
              {m} min
            </button>
          ))}
        </div>
        <p className="fineprint" style={{ margin: 0 }}>
          El resto (días y veces por semana) lo puedes ajustar después.
        </p>
      </section>
    );
  }

  if (mode === 'edit') {
    return (
      <section className="panel setup" aria-label="Editar tu sesión">
        <div className="eyebrow">Tu cita, tus reglas</div>
        <div className="setup-grid">
          <fieldset>
            <legend>Horario del gym</legend>
            <div className="time-pair">
              <input
                ref={gymOpenRef}
                type="time"
                step={900}
                value={draft.gymHours.open}
                onChange={(e) => set({ gymHours: { ...draft.gymHours, open: e.target.value } })}
                aria-label="Abre a las"
              />
              <span aria-hidden="true">–</span>
              <input
                type="time"
                step={900}
                value={draft.gymHours.close}
                onChange={(e) => set({ gymHours: { ...draft.gymHours, close: e.target.value } })}
                aria-label="Cierra a las"
              />
            </div>
          </fieldset>
          <fieldset>
            <legend>Tu ventana</legend>
            <div className="time-pair">
              <input
                type="time"
                step={900}
                value={draft.window.start}
                onChange={(e) => set({ window: { ...draft.window, start: e.target.value } })}
                aria-label="Desde"
              />
              <span aria-hidden="true">–</span>
              <input
                type="time"
                step={900}
                value={draft.window.end}
                onChange={(e) => set({ window: { ...draft.window, end: e.target.value } })}
                aria-label="Hasta"
              />
            </div>
          </fieldset>
          <fieldset>
            <legend>Duración de la sesión</legend>
            <div className="chips">
              {SESSION_OPTIONS.map((m) => (
                <button key={m} type="button" className="chip-btn" aria-pressed={draft.sessionMin === m} onClick={() => set({ sessionMin: m })}>
                  {m} min
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend>Veces por semana</legend>
            <div className="chips">
              {PER_WEEK_OPTIONS.map((n) => (
                <button key={n} type="button" className="chip-btn" aria-pressed={draft.perWeek === n} onClick={() => set({ perWeek: n })}>
                  {n}
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset className="span-2">
            <legend>Días posibles</legend>
            <div className="chips">
              {WEEK_ORDER.map((day) => (
                <button
                  key={day}
                  type="button"
                  className="chip-btn day"
                  aria-pressed={draft.days.includes(day)}
                  aria-label={DAY_FULL[day]}
                  onClick={() => toggleDay(day)}
                >
                  {DAY_LETTER[day]}
                </button>
              ))}
            </div>
          </fieldset>
        </div>
        {problem && (
          <p className="setup-problem" role="alert">
            {problem}
          </p>
        )}
        <div className="setup-actions">
          <button className="btn btn-primary" disabled={!!problem || saving} onClick={() => save(draft)}>
            {saving ? 'Guardando…' : 'Guardar'}
          </button>
          <button
            className="btn btn-quiet"
            disabled={saving}
            onClick={() => {
              setDraft(prefs);
              setMode(source === 'default' ? 'ask-gym' : 'summary');
            }}
          >
            Cancelar
          </button>
        </div>
      </section>
    );
  }

  // A la semana visible no le queda nada útil por delante (p. ej. domingo 20:00): se ofrece mirar la siguiente.
  const weekOver =
    !restWeek &&
    today !== null &&
    !entries.some((e) => e.date >= today && e.status !== 'past' && e.status !== 'not-a-day');

  return (
    <section className="panel setup" aria-label="Dónde cabe tu sesión">
      <div className="setup-head">
        <div>
          <div className="eyebrow">Tu sesión</div>
          <p className="setup-summary">{prefsSummary(prefs)}</p>
        </div>
        <button className="btn btn-sm" onClick={() => setMode('edit')}>
          Editar
        </button>
      </div>
      {saveNote && <p className="notice small" style={{ margin: 0 }}>{saveNote}</p>}

      <div>
        <h3 className="setup-h3">Dónde cabe · {weekTitle}</h3>
        {restWeek ? (
          <div className="fit-empty">
            <p style={{ margin: 0 }}>
              <b>Semana de descanso.</b> Esta semana no buscamos horarios; el domingo a las 20:00 vuelve la pregunta.
            </p>
            <button className="btn btn-sm" onClick={onNextWeek}>
              Ver la semana que viene →
            </button>
          </div>
        ) : weekOver ? (
          <div className="fit-empty">
            <p style={{ margin: 0 }}>A esta semana ya no le quedan días para tu sesión.</p>
            <button className="btn btn-sm" onClick={onNextWeek}>
              Ver la semana que viene →
            </button>
          </div>
        ) : (
          <ul className="fit-list">
            {entries.map((e) => (
              <li key={e.date} className={`fit-${e.status}${e.suggested ? ' fit-suggested' : ''}`}>
                <span className="fit-day">
                  {DAY_SHORT[e.dayIndex]} {Number(e.date.slice(8))}
                </span>
                {e.status === 'fits' && e.slot ? (
                  <span className="fit-value">
                    <b>
                      {fmtMin(e.slot.startMin)}–{fmtMin(e.slot.endMin)}
                    </b>
                    {e.suggested ? <span className="chip chip-accent">Cabe aquí</span> : <span className="muted">también libre</span>}
                  </span>
                ) : e.status === 'booked' ? (
                  <span className="fit-value">
                    <b>{e.reason}</b>
                  </span>
                ) : (
                  <span className="fit-value muted">{e.reason}</span>
                )}
              </li>
            ))}
          </ul>
        )}
        <p className="fineprint" style={{ margin: '0.5rem 0 0' }}>
          {calendarPhrase
            ? `Mira el horario del gym, tu ventana, tus citas de La Cita y ${calendarPhrase}.`
            : 'Sin calendario conectado, esto solo mira el horario del gym, tu ventana y tus citas de La Cita.'}
        </p>
      </div>
    </section>
  );
}
