/**
 * Plan de la semana por split (copia de frontend/src/lib/splits.ts: si cambia uno, cambia el otro).
 * Solo ordena grupos y días: no dice qué ejercicios hacer (R4). Puro y determinista.
 */
// @ts-nocheck — copia literal del front (que compila sin noUncheckedIndexedAccess); no la reescribimos para no divergir.

export type MuscleGroup = 'pecho' | 'espalda' | 'hombros' | 'biceps' | 'triceps' | 'piernas' | 'gluteos' | 'core';

export const MUSCLE_GROUPS: MuscleGroup[] = ['pecho', 'espalda', 'hombros', 'biceps', 'triceps', 'piernas', 'gluteos', 'core'];

export const GROUP_LABEL: Record<MuscleGroup, string> = {
  pecho: 'Pecho',
  espalda: 'Espalda',
  hombros: 'Hombros',
  biceps: 'Bíceps',
  triceps: 'Tríceps',
  piernas: 'Piernas',
  gluteos: 'Glúteos',
  core: 'Core',
};

/**
 * Foco de una sesión. `short`: una palabra para una celda angosta.
 * El id queda guardado en el navegador (splitState): cambiarlo deja sin efecto los focos ya recordados.
 */
export interface DayType {
  id: string;
  label: string;
  short: string;
  groups: MuscleGroup[];
}

export type SplitId = 'fullbody' | 'upper-lower' | 'ppl' | 'torso-piernas-brazos' | 'cinco-dias';

export interface SplitChoice {
  id: SplitId;
  sessions: number;
}

export interface SplitDef {
  id: SplitId;
  label: string;
  blurb: string;
  /** Sesiones por semana que se ofrecen; con cualquiera de ellas la semana cubre los 8 grupos. */
  variants: number[];
  /** Rotación canónica: la secuencia de n sesiones la repite desde el principio (ver splitSequence). */
  cycle: DayType[];
}

const focus = (id: string, label: string, short: string, groups: MuscleGroup[]): DayType => ({ id, label, short, groups });

const FULL_BODY = focus('full-body', 'Full body', 'Full', [...MUSCLE_GROUPS]);
const UPPER = focus('upper', 'Upper', 'Upper', ['pecho', 'espalda', 'hombros', 'biceps', 'triceps']);
const LOWER = focus('lower', 'Lower', 'Lower', ['piernas', 'gluteos', 'core']);
const PUSH = focus('push', 'Push', 'Push', ['pecho', 'hombros', 'triceps']);
const PULL = focus('pull', 'Pull', 'Pull', ['espalda', 'biceps']);
const LEGS = focus('legs', 'Legs', 'Legs', ['piernas', 'gluteos', 'core']);
const TORSO = focus('pecho-espalda-core', 'Pecho, espalda y core', 'Torso', ['pecho', 'espalda', 'core']);
const PIERNAS = focus('piernas-gluteos', 'Piernas y glúteos', 'Piernas', ['piernas', 'gluteos']);
const BRAZOS_HOMBROS = focus('brazos-hombros', 'Brazos y hombros', 'Brazos', ['biceps', 'triceps', 'hombros']);
const PECHO = focus('pecho', 'Pecho', 'Pecho', ['pecho']);
const ESPALDA = focus('espalda', 'Espalda', 'Espalda', ['espalda']);
const HOMBROS_CORE = focus('hombros-core', 'Hombros y core', 'Hombros', ['hombros', 'core']);
const BRAZOS = focus('brazos', 'Brazos', 'Brazos', ['biceps', 'triceps']);

export const SPLITS: SplitDef[] = [
  {
    id: 'fullbody',
    label: 'Full body',
    blurb: 'Todo el cuerpo en cada sesión. Rinde con pocos días a la semana.',
    variants: [1, 2, 3],
    cycle: [FULL_BODY],
  },
  {
    id: 'upper-lower',
    label: 'Upper / Lower',
    blurb: 'Un día el tren superior; el otro, piernas, glúteos y core.',
    variants: [2, 4],
    cycle: [UPPER, LOWER],
  },
  {
    id: 'ppl',
    label: 'Push / Pull / Legs',
    blurb: 'Empuje, tracción y piernas, cada uno en su propio día.',
    // 7 solo en el backend (un día más: los mismos focos giran otra vez), para quien quiera ir los siete días.
    variants: [3, 6, 7],
    cycle: [PUSH, PULL, LEGS],
  },
  {
    id: 'torso-piernas-brazos',
    label: 'Pecho-espalda / Piernas / Brazos',
    blurb: 'Tres focos: torso con core, piernas con glúteos y brazos con hombros.',
    variants: [3],
    cycle: [TORSO, PIERNAS, BRAZOS_HOMBROS],
  },
  {
    id: 'cinco-dias',
    label: 'Un grupo por día',
    blurb: 'Cinco sesiones con un foco cada una: pecho, espalda, piernas, hombros y brazos.',
    variants: [5],
    cycle: [PECHO, ESPALDA, PIERNAS, HOMBROS_CORE, BRAZOS],
  },
];

const findSplit = (id: unknown) => SPLITS.find((s) => s.id === id);

/** El split por id. Con un id desconocido (un dato viejo guardado) devuelve el primero, para que la vista no se caiga. */
export function getSplit(id: SplitId): SplitDef {
  return findSplit(id) ?? SPLITS[0];
}

const DAY_TYPE_BY_ID = new Map(SPLITS.flatMap((s) => s.cycle).map((dt) => [dt.id, dt] as const));

/** Foco por id (el que recuerda splitState); undefined si no existe. */
export function getDayType(id: string): DayType | undefined {
  return DAY_TYPE_BY_ID.get(id);
}

/** Split conocido y una de sus variantes. Tolera datos sin forma (p. ej. leídos del navegador). */
export function isValidChoice(choice: SplitChoice | null | undefined): boolean {
  const split = findSplit(choice?.id);
  return !!split && Number.isInteger(choice?.sessions) && split.variants.includes(choice!.sessions);
}

/** Una semana no admite más de 7 sesiones: una por día. */
const MAX_SESSIONS = 7;

/** Secuencia canónica de focos para n sesiones: la rotación del split, repetida. */
export function splitSequence(id: SplitId, sessions: number): DayType[] {
  const split = findSplit(id);
  if (!split || !Number.isFinite(sessions)) return [];
  const n = Math.min(MAX_SESSIONS, Math.max(0, Math.floor(sessions)));
  return Array.from({ length: n }, (_, i) => split.cycle[i % split.cycle.length]);
}

/** «a, b y c». */
function listEs(items: string[]) {
  return items.length <= 1 ? items.join('') : `${items.slice(0, -1).join(', ')} y ${items[items.length - 1]}`;
}

/**
 * «Push · pecho, hombros y tríceps». Si el nombre ya dice sus grupos («Piernas y glúteos»), solo el nombre;
 * si trabaja los 8, «Full body · todo el cuerpo».
 */
export function describeDayType(dt: DayType): string {
  if (MUSCLE_GROUPS.every((g) => dt.groups.includes(g))) return `${dt.label} · todo el cuerpo`;
  const list = listEs(dt.groups.map((g) => GROUP_LABEL[g].toLowerCase()));
  return !list || list === dt.label.toLowerCase() ? dt.label : `${dt.label} · ${list}`;
}

// ——— Planificador ———

export interface Candidate {
  /** 'YYYY-MM-DD', hora de Santiago. */
  date: string;
  /** Hay una cita real del backend ese día: se incluye siempre. */
  booked: boolean;
}

/** Sesión ya decidida (p. ej. una cita que ya pasó): se respeta tal cual. */
export interface FixedSession {
  date: string;
  dayTypeId: string;
}

export interface PlannedSession {
  date: string;
  dayType: DayType;
  booked: boolean;
  fixed: boolean;
}

/** Dos sesiones en días seguidos que repiten grupos. */
export interface RestConflict {
  first: string;
  second: string;
  groups: MuscleGroup[];
}

export interface SplitPlan {
  /** Por fecha. */
  sessions: PlannedSession[];
  covered: MuscleGroup[];
  missing: MuscleGroup[];
  requested: number;
  shortBy: number;
  complete: boolean;
  conflicts: RestConflict[];
}

const DAY_MS = 86_400_000;
const WEEK = 7;

/** Bit de cada grupo: dos focos comparten grupos si el AND de sus máscaras no es 0. */
const BIT = Object.fromEntries(MUSCLE_GROUPS.map((g, i) => [g, 1 << i])) as Record<MuscleGroup, number>;
const maskOf = (groups: MuscleGroup[]) => groups.reduce((m, g) => m | BIT[g], 0);
const groupsIn = (mask: number) => MUSCLE_GROUPS.filter((g) => mask & BIT[g]);

function countBits(mask: number) {
  let n = 0;
  for (let m = mask; m; m &= m - 1) n++;
  return n;
}

/** Día absoluto (días desde 1970-01-01) de 'YYYY-MM-DD', con aritmética UTC; null si no es una fecha real. */
function dayNumber(date: unknown): number | null {
  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  const [y, m, d] = date.split('-').map(Number);
  const t = new Date(Date.UTC(y, m - 1, d));
  if (t.getUTCFullYear() !== y || t.getUTCMonth() !== m - 1 || t.getUTCDate() !== d) return null;
  return t.getTime() / DAY_MS;
}

/** Cuántas veces aparece el foco t en las primeras `total` sesiones de una rotación de largo L. */
const occurrences = (total: number, L: number, t: number) => Math.floor(total / L) + (t < total % L ? 1 : 0);

/**
 * Inversiones contra el orden canónico. Cada sesión toma un puesto de su mismo foco en la secuencia de `total`
 * sesiones (el puesto p es del foco p % L) y se cuentan los pares cuyo orden cronológico contradice el de sus puestos.
 * Devuelve el mínimo entre los emparejamientos posibles; dentro de un foco los puestos se dan en orden cronológico,
 * que nunca empeora la cuenta.
 */
function minInversions(types: number[], L: number, total: number): number {
  if (L === 1) return 0;
  const byFocus: number[][] = Array.from({ length: L }, () => []);
  types.forEach((t, i) => byFocus[t].push(i));
  const pos = new Array<number>(types.length).fill(0);
  let best = Infinity;
  const count = () => {
    let n = 0;
    for (let i = 0; i < pos.length; i++) for (let j = i + 1; j < pos.length; j++) if (pos[i] > pos[j]) n++;
    return n;
  };
  const assign = (t: number): void => {
    if (best === 0) return;
    if (t === L) {
      best = Math.min(best, count());
      return;
    }
    const idx = byFocus[t];
    const places = Math.max(idx.length, occurrences(total, L, t));
    const choose = (from: number, j: number): void => {
      if (j === idx.length) return assign(t + 1);
      for (let k = from; k <= places - (idx.length - j); k++) {
        pos[idx[j]] = t + L * k;
        choose(k + 1, j + 1);
      }
    };
    choose(0, 0);
  };
  assign(0);
  return best;
}

/** Un día de la semana que entra al plan. */
interface Slot {
  date: string;
  day: number;
  booked: boolean;
  /** Índice del foco en la rotación si es una sesión fija; -1 si lo elige el planificador. */
  fixed: number;
}

/** Una forma de llenar la semana, con lo que hace falta para compararla. */
interface Assignment {
  /** Índices de Slot, en orden cronológico. */
  slots: number[];
  /** Índice en la rotación del foco de cada sesión. */
  types: number[];
  violations: number;
  /** Cantidad de grupos cubiertos. */
  covered: number;
  /** Separación mínima: [con la semana repitiéndose, solo dentro de la semana]. */
  spacing: [number, number];
  /** -1 mientras no haga falta calcularlas. */
  inversions: number;
}

/** Orden lexicográfico del plan: ¿a es mejor que b? */
function isBetter(a: Assignment, b: Assignment, L: number, total: number): boolean {
  if (a.violations !== b.violations) return a.violations < b.violations;
  if (a.covered !== b.covered) return a.covered > b.covered;
  if (a.slots.length !== b.slots.length) return a.slots.length > b.slots.length;
  for (let k = 0; k < 2; k++) if (a.spacing[k] !== b.spacing[k]) return a.spacing[k] > b.spacing[k];
  if (a.inversions < 0) a.inversions = minInversions(a.types, L, total);
  if (b.inversions < 0) b.inversions = minInversions(b.types, L, total);
  if (a.inversions !== b.inversions) return a.inversions < b.inversions;
  // Los Slot están ordenados por fecha: comparar índices es comparar fechas.
  for (let k = 0; k < a.slots.length; k++) if (a.slots[k] !== b.slots[k]) return a.slots[k] < b.slots[k];
  for (let k = 0; k < a.types.length; k++) if (a.types[k] !== b.types[k]) return a.types[k] < b.types[k];
  return false;
}

function buildPlan(sessions: PlannedSession[], coveredMask: number, requested: number, conflicts: RestConflict[]): SplitPlan {
  const missing = MUSCLE_GROUPS.filter((g) => !(coveredMask & BIT[g]));
  const shortBy = Math.max(0, requested - sessions.length);
  return {
    sessions,
    covered: groupsIn(coveredMask),
    missing,
    requested,
    shortBy,
    complete: shortBy === 0 && missing.length === 0,
    conflicts,
  };
}

/**
 * Reparte el split elegido en los días de la semana.
 *
 * - Una sesión por fecha. Las fijas se respetan y gastan su foco de la secuencia (si su foco no es del split, se
 *   ignoran). Las candidatas `booked` entran siempre; el planificador elige su foco.
 * - Descanso: dos sesiones en días seguidos no comparten grupos. Si una de las dos es sugerida, es una regla dura
 *   (antes se pone una sesión menos); entre fijas y booked se minimiza y lo que quede sale en `conflicts`.
 * - Entre los planes posibles gana, en este orden: menos choques de descanso; más grupos cubiertos; más sesiones
 *   (sin pasar de las pedidas, salvo que las fijas y booked sean más: entonces la secuencia se repite); mayor
 *   separación mínima entre sesiones seguidas, primero con la semana repitiéndose y después solo dentro de ella;
 *   menos inversiones contra el orden canónico; fechas más tempranas.
 * - Una semana: entran las fechas de los 7 días desde la primera. Fechas mal formadas se ignoran.
 */
export function planSplit(choice: SplitChoice, candidates: Candidate[], fixed: FixedSession[] = []): SplitPlan {
  // Tope de una sesión por día: un dato corrupto (p. ej. 30 sesiones) no debe congelar la búsqueda.
  const requested = Number.isFinite(choice?.sessions) ? Math.min(MAX_SESSIONS, Math.max(0, Math.floor(choice.sessions))) : 0;
  const split = findSplit(choice?.id);
  if (!split) return buildPlan([], 0, requested, []);

  const cycle = split.cycle;
  const L = cycle.length;
  const masks = cycle.map((dt) => maskOf(dt.groups));
  const typeIndex = new Map(cycle.map((dt, i) => [dt.id, i] as const));

  // Una sesión por fecha: primero las fijas (si se repite una fecha, gana la primera), después las candidatas.
  const byDate = new Map<string, Slot>();
  for (const f of fixed ?? []) {
    const day = dayNumber(f?.date);
    const t = typeIndex.get(f?.dayTypeId);
    if (day !== null && t !== undefined && !byDate.has(f.date)) byDate.set(f.date, { date: f.date, day, booked: false, fixed: t });
  }
  for (const c of candidates ?? []) {
    const day = dayNumber(c?.date);
    if (day === null) continue;
    const slot = byDate.get(c.date);
    if (slot) slot.booked = slot.booked || !!c.booked;
    else byDate.set(c.date, { date: c.date, day, booked: !!c.booked, fixed: -1 });
  }
  const sorted = [...byDate.values()].sort((a, b) => a.day - b.day);
  const slots = sorted.filter((s) => s.day - sorted[0].day < WEEK);

  // Focos disponibles: los de la secuencia de `total` sesiones, menos los que ya gastaron las fijas.
  const mandatory = slots.filter((s) => s.fixed >= 0 || s.booked).length;
  const total = Math.max(requested, mandatory);
  const left = cycle.map((_, t) => occurrences(total, L, t));
  for (const s of slots) if (s.fixed >= 0 && left[s.fixed] > 0) left[s.fixed]--;
  let suggestLeft = Math.max(0, requested - mandatory);

  // Búsqueda exhaustiva en orden cronológico. Se elige foco por tipo distinto, no por sesión, así que dos sesiones
  // del mismo foco nunca generan permutaciones repetidas.
  const chosenSlot: number[] = [];
  const chosenType: number[] = [];
  const chosenSuggested: boolean[] = [];
  let covered = 0;
  let violations = 0;
  let minGap = WEEK;
  let best = null as Assignment | null;

  const leaf = () => {
    const n = chosenSlot.length;
    const wrap = n ? slots[chosenSlot[0]].day + WEEK - slots[chosenSlot[n - 1]].day : WEEK;
    const cand: Assignment = {
      slots: chosenSlot,
      types: chosenType,
      violations,
      covered: countBits(covered),
      spacing: [Math.min(minGap, wrap), minGap],
      inversions: -1,
    };
    if (!best || isBetter(cand, best, L, total)) best = { ...cand, slots: [...chosenSlot], types: [...chosenType] };
  };

  /** Cota optimista de lo que queda desde el día i: si ni así le gana al mejor plan, no vale la pena seguir. */
  const hopeless = (i: number): boolean => {
    if (!best) return false;
    if (violations !== best.violations) return violations > best.violations;
    let pool = 0;
    let poolMask = 0;
    for (let t = 0; t < L; t++) {
      if (!left[t]) continue;
      pool += left[t];
      poolMask |= masks[t];
    }
    let reach = covered;
    let fixedLeft = 0;
    let bookedLeft = 0;
    let freeLeft = 0;
    for (let j = i; j < slots.length; j++) {
      const s = slots[j];
      if (s.fixed >= 0) {
        fixedLeft++;
        reach |= masks[s.fixed];
      } else if (s.booked) bookedLeft++;
      else freeLeft++;
    }
    const open = Math.min(pool, bookedLeft + Math.min(suggestLeft, freeLeft));
    if (open) reach |= poolMask;
    const cov = countBits(reach);
    if (cov !== best.covered) return cov < best.covered;
    const count = chosenType.length + fixedLeft + open;
    if (count !== best.slots.length) return count < best.slots.length;
    // Sumar sesiones después nunca agranda la separación que ya hay.
    return minGap < best.spacing[0] || (minGap === best.spacing[0] && minGap < best.spacing[1]);
  };

  const visit = (i: number): void => {
    if (i === slots.length) return leaf();
    if (hopeless(i)) return;
    const slot = slots[i];
    if (slot.fixed >= 0) return place(i, slot.fixed, false);
    const suggested = !slot.booked;
    if (!suggested || suggestLeft > 0) {
      for (let t = 0; t < L; t++) {
        if (!left[t]) continue;
        left[t]--;
        if (suggested) suggestLeft--;
        place(i, t, suggested);
        if (suggested) suggestLeft++;
        left[t]++;
      }
    }
    if (suggested) visit(i + 1); // cabe, pero queda sin sesión
  };

  const place = (i: number, t: number, suggested: boolean): void => {
    const k = chosenType.length;
    const gap = k > 0 ? slots[i].day - slots[chosenSlot[k - 1]].day : WEEK;
    let v = 0;
    if (gap === 1 && (masks[t] & masks[chosenType[k - 1]]) !== 0) {
      if (suggested || chosenSuggested[k - 1]) return; // con una sugerida de por medio, el descanso no se negocia
      v = 1;
    }
    const prevCovered = covered;
    const prevGap = minGap;
    chosenSlot.push(i);
    chosenType.push(t);
    chosenSuggested.push(suggested);
    covered |= masks[t];
    violations += v;
    minGap = Math.min(minGap, gap);
    visit(i + 1);
    chosenSlot.pop();
    chosenType.pop();
    chosenSuggested.pop();
    covered = prevCovered;
    minGap = prevGap;
    violations -= v;
  };

  visit(0);
  const win = best;
  // Siempre hay al menos un plan (el que no sugiere nada); esto solo protege el tipo.
  if (!win) return buildPlan([], 0, requested, []);

  const sessions: PlannedSession[] = win.slots.map((i, k) => ({
    date: slots[i].date,
    dayType: cycle[win.types[k]],
    booked: slots[i].booked,
    fixed: slots[i].fixed >= 0,
  }));
  const conflicts: RestConflict[] = [];
  for (let k = 1; k < win.slots.length; k++) {
    const a = slots[win.slots[k - 1]];
    const b = slots[win.slots[k]];
    const shared = masks[win.types[k - 1]] & masks[win.types[k]];
    if (b.day - a.day === 1 && shared) conflicts.push({ first: a.date, second: b.date, groups: groupsIn(shared) });
  }
  return buildPlan(sessions, win.types.reduce((m, t) => m | masks[t], 0), requested, conflicts);
}
