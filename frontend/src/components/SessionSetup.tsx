import { useEffect, useRef, useState } from 'react';
import type { AutoDecision } from '../lib/autoplan';
import { fmtMin, type FitEntry } from '../lib/fit';
import {
  PER_WEEK_OPTIONS,
  SESSION_OPTIONS,
  prefsProblem,
  prefsSummary,
  type PlanMode,
  type PrefsSource,
  type SessionMin,
  type SessionPrefs,
} from '../lib/prefs';
import { SPLITS, describeDayType, getSplit, type DayType, type SplitChoice, type SplitId, type SplitPlan } from '../lib/splits';
import Sheet from './Sheet';
import SplitWeek from './SplitWeek';

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
  /** Plan por split de la semana visible (null en semana de descanso). */
  plan: SplitPlan | null;
  /** Split y duración con que se armó el plan: los de ella (manual) o los que decidió el agente. */
  planChoice: SplitChoice | null;
  planSessionMin: SessionMin | null;
  /** Modo agente: qué decidió y por qué (null en modo manual o con la semana ya fijada). */
  decision: AutoDecision | null;
  /** Modo agente con la semana ya empezada: mantiene el split del backend. */
  planLocked: boolean;
  /** Foco de cada día con sesión (cita o sugerencia); vacío mientras el plan está en pausa. */
  focusByDate: Record<string, DayType>;
  /** R4: derivación por dolor sin retomar todavía. */
  paused: boolean;
  onResume: () => void;
  alternative: SplitChoice | null;
}

type Step = 'ask-gym' | 'ask-frequency' | 'summary';

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

/** Sesiones con que parte cada split si no se elige otra cosa: 2 si existe esa variante, si no la más chica. */
const defaultSessions = (id: SplitId) => {
  const v = getSplit(id).variants;
  return v.includes(2) ? 2 : Math.min(...v);
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
  plan,
  planChoice,
  planSessionMin,
  decision,
  planLocked,
  focusByDate,
  paused,
  onResume,
  alternative,
}: Props) {
  const [step, setStep] = useState<Step>(source === 'default' ? 'ask-gym' : 'summary');
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<SessionPrefs>(prefs);
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);

  // Si cambian las reglas desde afuera (otra usuaria, backend) y no se está editando, se reflejan.
  useEffect(() => {
    if (!editing) setDraft(prefs);
  }, [prefs, editing]);

  // Si las reglas llegan configuradas desde el backend mientras se mostraba la primera pregunta, pasa al resumen.
  useEffect(() => {
    if (source !== 'default' && !savingRef.current) setStep((s) => (s === 'summary' ? s : 'summary'));
  }, [source]);

  async function save(next: SessionPrefs) {
    if (savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    try {
      await onSave(next);
      setStep('summary');
      setEditing(false);
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }

  function openEditor() {
    setDraft(prefs);
    setEditing(true);
  }

  function cancelEditor() {
    setDraft(prefs);
    setEditing(false);
  }

  const problem = prefsProblem(draft);
  const set = (patch: Partial<SessionPrefs>) => setDraft((d) => ({ ...d, ...patch }));
  const toggleDay = (day: number) =>
    set({ days: draft.days.includes(day) ? draft.days.filter((d) => d !== day) : [...draft.days, day].sort() });
  // En el editor no se tocan los días: si no alcanzan, prefsProblem lo dice.
  const setSplit = (id: SplitId) => {
    const sessions = getSplit(id).variants.includes(draft.split.sessions) ? draft.split.sessions : defaultSessions(id);
    set({ split: { id, sessions }, perWeek: sessions });
  };
  // Al pasar a «Lo elijo yo» se parte de lo que decidió el agente; al volver al agente, sus veces quedan en 1–3.
  const setMode = (mode: PlanMode) => {
    if (mode === draft.mode) return;
    if (mode === 'manual') {
      const split = planChoice ?? draft.split;
      set({ mode, split: { ...split }, perWeek: split.sessions, sessionMin: planSessionMin ?? draft.sessionMin });
    } else {
      set({ mode, perWeek: Math.min(3, Math.max(1, draft.perWeek)) });
    }
  };

  const editor = (
    <Sheet
      open={editing}
      title="Tu sesión"
      confirmLabel={saving ? 'Guardando…' : 'Guardar'}
      confirmDisabled={!!problem || saving}
      onCancel={cancelEditor}
      onConfirm={() => save(draft)}
    >
      <div className="setup-grid">
        <fieldset className="span-2">
          <legend>Quién arma el plan</legend>
          <div className="chips">
            <button type="button" className="chip-btn" aria-pressed={draft.mode === 'auto'} onClick={() => setMode('auto')}>
              El agente, con mi calendario
            </button>
            <button type="button" className="chip-btn" aria-pressed={draft.mode === 'manual'} onClick={() => setMode('manual')}>
              Lo elijo yo
            </button>
          </div>
        </fieldset>
        <fieldset>
          <legend>Horario del gym</legend>
          <div className="time-pair">
            <input
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
        {draft.mode === 'auto' ? (
          <fieldset className="span-2">
            <legend>Veces por semana</legend>
            <div className="chips">
              {PER_WEEK_OPTIONS.map((n) => (
                <button key={n} type="button" className="chip-btn" aria-pressed={draft.perWeek === n} onClick={() => set({ perWeek: n })}>
                  {n}
                </button>
              ))}
            </div>
            <p className="fineprint" style={{ margin: '0.4rem 0 0' }}>
              El agente elige el split y cuánto dura cada sesión según los huecos de tu calendario.
            </p>
          </fieldset>
        ) : (
          <>
            <fieldset className="span-2">
              <legend>Split</legend>
              <div className="chips">
                {SPLITS.map((s) => (
                  <button key={s.id} type="button" className="chip-btn" aria-pressed={draft.split.id === s.id} onClick={() => setSplit(s.id)}>
                    {s.label}
                  </button>
                ))}
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
              <legend>Sesiones por semana</legend>
              <div className="chips">
                {getSplit(draft.split.id).variants.map((n) => (
                  <button
                    key={n}
                    type="button"
                    className="chip-btn"
                    aria-pressed={draft.split.sessions === n}
                    onClick={() => set({ split: { ...draft.split, sessions: n }, perWeek: n })}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </fieldset>
          </>
        )}
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
    </Sheet>
  );

  if (step === 'ask-gym') {
    return (
      <section className="panel setup" aria-label="Tu sesión">
        <div className="eyebrow">Antes de buscar dónde cabe tu sesión</div>
        <h2 className="display setup-q">
          ¿Tu gym abre de {prefs.gymHours.open} a {prefs.gymHours.close}?
        </h2>
        <div className="setup-actions">
          <button className="btn btn-primary" onClick={() => setStep('ask-frequency')}>
            Sí, ese es
          </button>
          <button className="btn" onClick={openEditor}>
            Otro horario
          </button>
        </div>
        {editor}
      </section>
    );
  }

  if (step === 'ask-frequency') {
    return (
      <section className="panel setup" aria-label="Tu sesión">
        <div className="eyebrow">Una más y listo</div>
        <h2 className="display setup-q">¿Cuántas veces por semana quieres ir?</h2>
        <div className="chips" role="group" aria-label="Veces por semana">
          {PER_WEEK_OPTIONS.map((n) => (
            <button
              key={n}
              className="chip-btn"
              aria-pressed={draft.perWeek === n}
              disabled={saving}
              onClick={() => save({ ...draft, mode: 'auto', perWeek: n })}
            >
              {n === 1 ? '1 vez' : `${n} veces`}
            </button>
          ))}
        </div>
        <p className="fineprint" style={{ margin: 0 }}>
          El agente mira tu calendario y elige el split, cuánto dura cada sesión y qué días, para que tus 8 grupos
          musculares entren al menos una vez por semana.
        </p>
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
        <button className="btn btn-sm" onClick={openEditor}>
          Editar
        </button>
      </div>
      {saveNote && <p className="notice small" style={{ margin: 0 }}>{saveNote}</p>}

      {!restWeek && !weekOver && planChoice && (
        <SplitWeek
          choice={planChoice}
          sessionMin={planSessionMin}
          plan={plan}
          paused={paused}
          onResume={onResume}
          alternative={alternative}
          weekTitle={weekTitle}
          auto={prefs.mode === 'auto' ? { perWeek: prefs.perWeek, decision, locked: planLocked } : null}
        />
      )}

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
            {entries.map((e) => {
              const focus = focusByDate[e.date];
              return (
                <li key={e.date} className={`fit-${e.status}${e.suggested ? ' fit-suggested' : ''}`}>
                  <span className="fit-day">
                    {DAY_SHORT[e.dayIndex]} {Number(e.date.slice(8))}
                  </span>
                  {e.status === 'fits' && e.slot ? (
                    <span className="fit-value">
                      <b>
                        {fmtMin(e.slot.startMin)}–{fmtMin(e.slot.endMin)}
                      </b>
                      {e.suggested ? (
                        <span className="chip chip-accent" title={focus ? describeDayType(focus) : undefined}>
                          {focus ? `Cabe aquí · ${focus.short}` : 'Cabe aquí'}
                        </span>
                      ) : (
                        <span className="muted">también libre</span>
                      )}
                    </span>
                  ) : e.status === 'booked' ? (
                    <span className="fit-value">
                      <b>{e.reason}</b>
                      {focus && (
                        <span className="chip chip-accent" title={describeDayType(focus)}>
                          {focus.short}
                        </span>
                      )}
                    </span>
                  ) : (
                    <span className="fit-value muted">{e.reason}</span>
                  )}
                </li>
              );
            })}
          </ul>
        )}
        <p className="fineprint" style={{ margin: '0.5rem 0 0' }}>
          {calendarPhrase
            ? `Mira el horario del gym, tu ventana, tus citas de gogym y ${calendarPhrase}.`
            : 'Sin calendario conectado, esto solo mira el horario del gym, tu ventana y tus citas de gogym.'}
        </p>
      </div>
      {editor}
    </section>
  );
}
