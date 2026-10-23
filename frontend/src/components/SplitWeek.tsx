import type { AutoDecision } from '../lib/autoplan';
import { GROUP_LABEL, MUSCLE_GROUPS, getSplit, type MuscleGroup, type SplitChoice, type SplitPlan } from '../lib/splits';

interface Props {
  /** Split con que se armó el plan: el de ella (manual) o el que decidió el agente. */
  choice: SplitChoice;
  sessionMin: number | null;
  plan: SplitPlan | null;
  /** R4: el agente derivó por dolor y ella todavía no dijo que lo conversó con un profesional. */
  paused: boolean;
  onResume: () => void;
  /** Modo manual: split que sí cubre los 8 grupos con los días que caben, si el elegido no alcanza. */
  alternative: SplitChoice | null;
  weekTitle: string;
  /** Modo agente: cuántas veces pidió, qué decidió y si la semana ya quedó fija. null en modo manual. */
  auto: { perWeek: number; decision: AutoDecision | null; locked: boolean } | null;
}

const WEEKDAY_SHORT = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
const dayName = (iso: string) => WEEKDAY_SHORT[new Date(`${iso}T12:00:00Z`).getUTCDay()];

/** «a, b y c». */
export function listEs(items: string[]) {
  return items.length <= 1 ? items.join('') : `${items.slice(0, -1).join(', ')} y ${items[items.length - 1]}`;
}

const lower = (groups: MuscleGroup[]) => listEs(groups.map((g) => GROUP_LABEL[g].toLowerCase()));
export const sessionsText = (n: number) => (n === 1 ? '1 sesión' : `${n} sesiones`);
export const choiceText = (c: SplitChoice) => `${getSplit(c.id).label} · ${sessionsText(c.sessions)}`;
const veces = (n: number) => (n === 1 ? '1 vez' : `${n} veces`);
const cabe = (n: number) => (n === 1 ? 'cabe' : 'caben');

/** Modo manual: cómo quedó la semana con el split que eligió ella. */
function manualStatus(plan: SplitPlan, alternative: SplitChoice | null) {
  const n = plan.sessions.length;
  if (plan.complete) return 'Los 8 grupos, al menos una vez esta semana.';
  if (!plan.missing.length) return `Esta semana ${cabe(n)} ${n} de ${plan.requested} sesiones; igual quedan cubiertos los 8 grupos.`;
  const alt = alternative ? ` Con los días que tienes, ${choiceText(alternative)} cubre todo.` : '';
  return `Esta semana ${cabe(n)} ${n} de ${plan.requested} sesiones. Sin cubrir: ${lower(plan.missing)}.${alt}`;
}

/** Modo agente: por qué eligió ese split y esa duración, en una frase. */
function autoStatus(plan: SplitPlan, choice: SplitChoice, auto: NonNullable<Props['auto']>) {
  const label = getSplit(choice.id).label;
  if (auto.locked) return `La semana ya empezó: el agente mantiene ${label} hasta el domingo para no cambiarte lo que ya hiciste.`;
  const d = auto.decision;
  if (!plan.complete) {
    return plan.missing.length
      ? `Esta semana tu calendario no deja huecos para los 8 grupos. Sin cubrir: ${lower(plan.missing)}.`
      : `Esta semana ${cabe(plan.sessions.length)} ${plan.sessions.length} de ${plan.requested} sesiones.`;
  }
  if (d?.reduced) {
    const n = plan.sessions.length;
    return `Querías ir ${veces(auto.perWeek)}, pero esta semana ${cabe(n)} ${sessionsText(n)}: ${label} cubre los 8 grupos igual.`;
  }
  const days = d ? d.roomDays : plan.sessions.length;
  return `Esta semana tienes ${days === 1 ? '1 día' : `${days} días`} con al menos ${d?.sessionMin ?? ''} min libres: con ${label} entran los 8 grupos.`;
}

export default function SplitWeek({ choice, sessionMin, plan, paused, onResume, alternative, weekTitle, auto }: Props) {
  const minutes = sessionMin ? ` de ${sessionMin} min` : '';
  // Modo agente sin ningún hueco: no hay decisión que mostrar (y no se sincroniza nada con el backend).
  const empty = !!auto && !!plan && plan.sessions.length === 0;
  return (
    <div className="split-week">
      <div className="split-head">
        <h3 className="setup-h3">{auto ? `Plan del agente · ${weekTitle}` : `Grupos · ${weekTitle}`}</h3>
        <span className="small muted">
          {empty ? (
            'Sin huecos esta semana'
          ) : (
            <>
              {getSplit(choice.id).label} · {sessionsText(choice.sessions)}
              {minutes}
            </>
          )}
        </span>
      </div>
      {empty && !paused && (
        <p className="split-status">
          Esta semana tu calendario no deja un hueco para una sesión dentro de tu ventana. Si cambia, el agente vuelve a
          armar el plan.
        </p>
      )}
      {paused ? (
        <div className="notice split-paused" role="status">
          <p style={{ margin: 0 }}>
            Mencionaste dolor, así que pausamos el plan de grupos. Conviene revisarlo con un kinesiólogo o un médico
            deportólogo antes de entrenar.
          </p>
          <button className="btn btn-sm" onClick={onResume}>
            Ya lo conversé con un profesional
          </button>
        </div>
      ) : plan && plan.sessions.length > 0 ? (
        <>
          <ul className="split-groups" aria-label="Grupos musculares de la semana">
            {MUSCLE_GROUPS.map((g) => {
              const on = plan.covered.includes(g);
              return (
                <li key={g} className={on ? 'on' : undefined}>
                  {on && (
                    <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
                      <path d="M2.5 6.4 5 8.8l4.6-5.3" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                  <span className="sr-only">{on ? 'Cubierto: ' : 'Sin cubrir: '}</span>
                  {GROUP_LABEL[g]}
                </li>
              );
            })}
          </ul>
          <p className="split-status">{auto ? autoStatus(plan, choice, auto) : manualStatus(plan, alternative)}</p>
          {plan.conflicts.map((c) => (
            <p key={`${c.first}-${c.second}`} className="split-status">
              El {dayName(c.first)} y el {dayName(c.second)} se repite {lower(c.groups)}: conviene un día de descanso
              entre medio.
            </p>
          ))}
          {/* El agente agenda una cita por semana (fase 1 del backend): las demás sesiones son sugerencias. */}
          <p className="fineprint" style={{ margin: 0 }}>
            El agente agenda una cita por semana con este plan; las otras sesiones quedan como sugerencias.
          </p>
        </>
      ) : null}
    </div>
  );
}
