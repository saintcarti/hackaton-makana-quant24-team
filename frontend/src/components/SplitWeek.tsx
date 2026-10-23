import { GROUP_LABEL, MUSCLE_GROUPS, getSplit, type MuscleGroup, type SplitChoice, type SplitPlan } from '../lib/splits';

interface Props {
  choice: SplitChoice;
  plan: SplitPlan | null;
  /** R4: el agente derivó por dolor y ella todavía no dijo que lo conversó con un profesional. */
  paused: boolean;
  onResume: () => void;
  /** Split que sí cubre los 8 grupos con los días que caben, si el elegido no alcanza. */
  alternative: SplitChoice | null;
  weekTitle: string;
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

function status(plan: SplitPlan, alternative: SplitChoice | null) {
  const n = plan.sessions.length;
  if (plan.complete) return 'Los 8 grupos, al menos una vez esta semana.';
  if (!plan.missing.length) return `Esta semana caben ${n} de ${plan.requested} sesiones; igual quedan cubiertos los 8 grupos.`;
  const alt = alternative ? ` Con los días que tienes, ${choiceText(alternative)} cubre todo.` : '';
  return `Esta semana caben ${n} de ${plan.requested} sesiones. Sin cubrir: ${lower(plan.missing)}.${alt}`;
}

export default function SplitWeek({ choice, plan, paused, onResume, alternative, weekTitle }: Props) {
  return (
    <div className="split-week">
      <div className="split-head">
        <h3 className="setup-h3">Grupos · {weekTitle}</h3>
        <span className="small muted">{choiceText(choice)}</span>
      </div>
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
          <p className="split-status">{status(plan, alternative)}</p>
          {plan.conflicts.map((c) => (
            <p key={`${c.first}-${c.second}`} className="split-status">
              El {dayName(c.first)} y el {dayName(c.second)} se repite {lower(c.groups)}: conviene un día de descanso
              entre medio.
            </p>
          ))}
          {/* Honestidad del demo: el agente agenda una cita por semana y todavía no reparte grupos (PEDIDOS-BACKEND §4). */}
          <p className="fineprint" style={{ margin: 0 }}>
            Este plan lo arma la web con tu calendario; el agente todavía no reparte los grupos.
          </p>
        </>
      ) : null}
    </div>
  );
}
