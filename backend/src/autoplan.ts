// @ts-nocheck — copia literal de frontend/src/lib/autoplan.ts (si cambia uno, cambia el otro).
/**
 * El agente elige el split y la duración de la semana mirando el calendario: qué días tienen un hueco y de cuántos
 * minutos. Camila decide solo cuántas veces por semana quiere ir (su compromiso); esto arma el resto con un objetivo:
 * los 8 grupos al menos una vez por semana.
 *
 * Regla: se prueba primero la cantidad de sesiones que pidió y, dentro de ella, el split y la duración en orden
 * (3 → Push/Pull/Legs de 40, o de 30 si los huecos son cortos; 2 → Upper/Lower de 50, 40 o 30; 1 → Full body de 60,
 * 50 o 40: los 8 grupos no caben en menos). Antes de alargar se prefieren más sesiones cortas, porque se acercan más a
 * las veces que pidió. Si no cabe completo, baja a menos sesiones con un split que igual cubra todo. Si nada cubre
 * los 8 grupos, devuelve el plan que más cubre, para decir qué queda afuera.
 *
 * Dos resguardos: una cita real ya agendada no recibe una duración más larga que su hueco, y si hay focos ya hechos
 * esta semana solo se consideran splits que los contengan (si no, se re-rotularía lo que ya entrenó). Lo normal es
 * no volver a decidir una semana empezada; el llamador la congela.
 *
 * Puro y determinista, sin React: backend/src lo puede copiar tal cual, como splits.ts.
 */
import { getSplit, planSplit, type FixedSession, type SplitChoice, type SplitPlan } from './splits.js';

export type SessionLength = 30 | 40 | 50 | 60;

/** Las duraciones que el agente considera, de mayor a menor. */
export const SESSION_LENGTHS: SessionLength[] = [60, 50, 40, 30];

/** Un día de la semana: si tiene una cita real y la duración estándar más larga que cabe en su hueco. */
export interface DayRoom {
  /** 'YYYY-MM-DD', hora de Santiago. */
  date: string;
  /** Cita real del backend ese día: entra siempre al plan. */
  booked: boolean;
  /**
   * 0 si no cabe ninguna sesión; si no, 30, 40, 50 o 60. En un día con cita real es el hueco que tiene esa cita
   * (0 si no se sabe o ya pasó: entonces no limita la duración).
   */
  maxMin: number;
}

export interface AutoDecision {
  choice: SplitChoice;
  sessionMin: SessionLength;
  plan: SplitPlan;
  /** Días con hueco para esa duración, contando las citas reales. */
  roomDays: number;
  /** Pidió más veces de las que caben esta semana con los 8 grupos cubiertos. */
  reduced: boolean;
}

/** Por cantidad de sesiones, de más a menos, el split elegido y las duraciones que se prueban. */
const OPTIONS: Array<{ choice: SplitChoice; lengths: SessionLength[] }> = [
  { choice: { id: 'ppl', sessions: 3 }, lengths: [40, 30] },
  { choice: { id: 'upper-lower', sessions: 2 }, lengths: [50, 40, 30] },
  { choice: { id: 'fullbody', sessions: 1 }, lengths: [60, 50, 40] },
];

/** Entre planes incompletos: más grupos cubiertos, después más sesiones, después sesiones más largas. */
function better(a: AutoDecision, b: AutoDecision) {
  if (a.plan.covered.length !== b.plan.covered.length) return a.plan.covered.length > b.plan.covered.length;
  if (a.plan.sessions.length !== b.plan.sessions.length) return a.plan.sessions.length > b.plan.sessions.length;
  return a.sessionMin > b.sessionMin;
}

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;
const dayNumber = (iso: string) => Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10)) / 86_400_000;

/** Un DayRoom por fecha válida (si se repite, gana la cita y el hueco mayor), solo dentro de 7 días desde la primera. */
function normalize(days: DayRoom[] | null | undefined): DayRoom[] {
  const byDate = new Map<string, DayRoom>();
  for (const d of days ?? []) {
    if (!d || typeof d.date !== 'string' || !ISO_DAY.test(d.date)) continue;
    const maxMin = Number.isFinite(d.maxMin) && d.maxMin > 0 ? d.maxMin : 0;
    const prev = byDate.get(d.date);
    byDate.set(d.date, prev ? { date: d.date, booked: prev.booked || !!d.booked, maxMin: Math.max(prev.maxMin, maxMin) } : { date: d.date, booked: !!d.booked, maxMin });
  }
  const sorted = [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
  return sorted.filter((d) => dayNumber(d.date) - dayNumber(sorted[0].date) < 7);
}

export function autoDecide(perWeek: number, rawDays: DayRoom[], rawFixed: FixedSession[] = []): AutoDecision {
  const days = normalize(rawDays);
  const inWeek = new Set(days.map((d) => d.date));
  const fixed = (rawFixed ?? []).filter((f) => f && inWeek.has(f.date));
  const asked = Math.min(3, Math.max(1, Math.floor(Number(perWeek)) || 1));
  // Si ya hay más citas reales que las veces pedidas, el split tiene que alcanzar para todas sin choques de descanso.
  const want = Math.min(3, Math.max(asked, days.filter((d) => d.booked).length));
  const wanted = OPTIONS.filter((o) => o.choice.sessions <= want);
  // Focos ya hechos: solo splits que los contengan, aunque tengan más sesiones de las pedidas (re-rotular lo que ya
  // entrenó sería peor). Si ningún split del agente los contiene, se evalúan los pedidos (el llamador debería haber
  // congelado la semana).
  const holds = (c: SplitChoice) => fixed.every((f) => getSplit(c.id).cycle.some((dt) => dt.id === f.dayTypeId));
  const compatible = wanted.filter((o) => holds(o.choice));
  const anyCompatible = OPTIONS.filter((o) => holds(o.choice));
  const options = compatible.length ? compatible : anyCompatible.length ? anyCompatible : wanted;
  // Techo de la duración: el hueco conocido más corto entre las citas reales. Si alguna cita no tiene hueco conocido,
  // se supone como el mejor día libre de la semana (no se le promete más de lo que hay en ninguna parte).
  const freeBest = days.reduce((m, d) => (!d.booked ? Math.max(m, d.maxMin) : m), 0);
  const cap = days.reduce((m, d) => {
    if (!d.booked) return m;
    if (d.maxMin > 0) return Math.min(m, d.maxMin);
    return freeBest > 0 ? Math.min(m, freeBest) : m;
  }, Infinity);

  let best: AutoDecision | null = null;
  const evaluate = (choice: SplitChoice, len: SessionLength): AutoDecision => {
    const room = days.filter((d) => d.booked || d.maxMin >= len);
    const plan = planSplit(choice, room.map((d) => ({ date: d.date, booked: d.booked })), fixed);
    // «Reducido» solo si igual cubre los 8 grupos con menos sesiones de las que pidió.
    return { choice: { ...choice }, sessionMin: len, plan, roomDays: room.length, reduced: plan.complete && choice.sessions < asked };
  };
  for (const opt of options) {
    for (const len of opt.lengths) {
      if (len > cap) continue;
      const decision = evaluate(opt.choice, len);
      if (decision.plan.complete) return decision;
      if (!best || better(decision, best)) best = decision;
    }
  }
  if (best) return best;
  // Ninguna duración de las opciones cabe bajo el techo de la cita real: se usa lo que de verdad cabe (el backend
  // igual la acorta a eso), para no anunciar más minutos de los que va a tener.
  const fitting = SESSION_LENGTHS.find((len) => len <= cap) ?? SESSION_LENGTHS[SESSION_LENGTHS.length - 1];
  for (const opt of options) {
    const decision = evaluate(opt.choice, fitting);
    if (decision.plan.complete) return decision;
    if (!best || better(decision, best)) best = decision;
  }
  // OPTIONS siempre incluye Full body de 1 sesión, que se evalúa para cualquier `want`: `best` existe.
  return best!;
}
