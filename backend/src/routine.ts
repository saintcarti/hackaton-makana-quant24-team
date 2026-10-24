import { MUSCLE_GROUPS, type MuscleGroup } from './splits.js';

/**
 * Rutina de una sesión, armada con el tiempo que realmente hay en el calendario.
 * Determinista y sin LLM: sale de un catálogo fijo de ejercicios básicos (máquinas, mancuernas y peso corporal).
 * Sin pesos, sin cifras del cuerpo y sin metas de resultado. No se genera con dolor (R4: lo decide el motor).
 */

export interface Exercise {
  id: string;
  name: string;
  group: MuscleGroup;
  /** Compuestos primero: se eligen antes cuando el tiempo es corto. */
  compound: boolean;
  /** Series y repeticiones por defecto. `reps` ya viene como texto («10-12», «30 s»). */
  sets: number;
  reps: string;
}

const ex = (id: string, name: string, group: MuscleGroup, compound: boolean, sets: number, reps: string): Exercise => ({
  id,
  name,
  group,
  compound,
  sets,
  reps,
});

/** Por grupo, el compuesto primero; los siguientes son variantes que rotan semana a semana. */
export const CATALOG: Record<MuscleGroup, Exercise[]> = {
  pecho: [
    ex('press-pecho-maquina', 'Press de pecho en máquina', 'pecho', true, 3, '10-12'),
    ex('press-pecho-mancuernas', 'Press de pecho con mancuernas', 'pecho', true, 3, '10-12'),
    ex('aperturas-maquina', 'Aperturas en máquina', 'pecho', false, 2, '12-15'),
  ],
  espalda: [
    ex('jalon-pecho', 'Jalón al pecho', 'espalda', true, 3, '10-12'),
    ex('remo-sentado', 'Remo sentado en máquina', 'espalda', true, 3, '10-12'),
    ex('remo-mancuerna', 'Remo con mancuerna', 'espalda', true, 3, '10-12'),
  ],
  hombros: [
    ex('press-hombros-maquina', 'Press de hombros en máquina', 'hombros', true, 3, '10-12'),
    ex('elevaciones-laterales', 'Elevaciones laterales con mancuernas livianas', 'hombros', false, 2, '12-15'),
  ],
  biceps: [
    ex('curl-biceps', 'Curl de bíceps con mancuernas', 'biceps', false, 2, '10-12'),
    ex('curl-polea', 'Curl de bíceps en polea', 'biceps', false, 2, '12-15'),
  ],
  triceps: [
    ex('extension-triceps-polea', 'Extensión de tríceps en polea', 'triceps', false, 2, '10-12'),
    ex('press-triceps-mancuerna', 'Extensión de tríceps con mancuerna', 'triceps', false, 2, '10-12'),
  ],
  piernas: [
    ex('prensa-piernas', 'Prensa de piernas', 'piernas', true, 3, '10-12'),
    ex('sentadilla-goblet', 'Sentadilla con mancuerna al pecho', 'piernas', true, 3, '8-10'),
    ex('curl-femoral', 'Curl femoral en máquina', 'piernas', false, 2, '12-15'),
  ],
  gluteos: [
    ex('puente-gluteos', 'Puente de glúteos', 'gluteos', true, 3, '12-15'),
    ex('hip-thrust', 'Hip thrust en banco', 'gluteos', true, 3, '10-12'),
    ex('patada-polea', 'Patada de glúteo en polea', 'gluteos', false, 2, '12-15'),
  ],
  core: [
    ex('plancha', 'Plancha', 'core', false, 3, '30 s'),
    ex('bicho-muerto', 'Bicho muerto', 'core', false, 2, '10 por lado'),
    ex('crunch', 'Crunch abdominal', 'core', false, 2, '12-15'),
  ],
};

/** Orden de prioridad cuando no alcanza el tiempo para todos los grupos. */
const PRIORITY: MuscleGroup[] = ['piernas', 'espalda', 'pecho', 'hombros', 'gluteos', 'core', 'biceps', 'triceps'];

export const WARMUP_MIN = 5;
const MIN_SESSION = 20;
/** Minutos que toma un ejercicio: trabajo + descanso de ~1 min entre series. */
export const exerciseMinutes = (e: Exercise) => Math.ceil(e.sets * 1.75);

export interface RoutineItem {
  exerciseId: string;
  name: string;
  group: MuscleGroup;
  sets: number;
  reps: string;
}

export interface Routine {
  /** Minutos totales de la sesión, calentamiento incluido. */
  minutes: number;
  warmupMin: number;
  items: RoutineItem[];
  /** Grupos que trabaja la sesión. */
  groups: MuscleGroup[];
}

/** Variantes del grupo: los compuestos rotan con `variant` y van antes que los de aislamiento. */
function sequenceFor(group: MuscleGroup, variant: number): Exercise[] {
  const all = CATALOG[group];
  const compounds = all.filter((e) => e.compound);
  const others = all.filter((e) => !e.compound);
  const shift = compounds.length ? variant % compounds.length : 0;
  return [...compounds.slice(shift), ...compounds.slice(0, shift), ...others];
}

/**
 * Arma la rutina que cabe en `minutes`. `groups` son los grupos del foco del día (todos si no hay split).
 * `variant` rota las variantes de cada grupo (p. ej. el número de semana), para que no sea siempre lo mismo.
 * Devuelve null si el tiempo es demasiado corto para una sesión útil.
 */
export function buildRoutine(minutes: number, groups: MuscleGroup[], variant = 0): Routine | null {
  if (minutes < MIN_SESSION) return null;
  const wanted = PRIORITY.filter((g) => groups.includes(g));
  const pool = wanted.length ? wanted : [...MUSCLE_GROUPS];
  const budget = minutes - WARMUP_MIN;

  const items: RoutineItem[] = [];
  const used = new Set<string>();
  let spent = 0;
  const rounds = Math.max(...pool.map((g) => CATALOG[g].length));
  for (let r = 0; r < rounds; r++) {
    for (const g of pool) {
      const options = sequenceFor(g, variant);
      const e = options[r % options.length]!;
      if (used.has(e.id)) continue;
      const cost = exerciseMinutes(e);
      if (spent + cost > budget) continue;
      used.add(e.id);
      spent += cost;
      items.push({ exerciseId: e.id, name: e.name, group: g, sets: e.sets, reps: e.reps });
    }
  }
  if (!items.length) return null;
  return { minutes, warmupMin: WARMUP_MIN, items, groups: pool };
}

// ───────────── Movimiento fuera del gym (calentar en el camino y pausas activas) ─────────────

export interface TravelWarmup {
  /** Minutos de caminata a paso ligero. */
  walkMin: number;
  /** Minutos de trote suave al final del camino (0 si el tiempo no alcanza). */
  jogMin: number;
  /** Minutos de movilidad al llegar (el calentamiento de la rutina). */
  mobilityMin: number;
}

/**
 * Plan para llegar con el cuerpo listo: caminar y, si hay tiempo, terminar trotando suave. `minutes` es el tiempo
 * libre antes de la cita; se usan como máximo 20 min y nunca más de lo que hay. Sin cifras del cuerpo ni metas.
 */
export function buildTravelWarmup(minutes: number): TravelWarmup {
  const total = Math.max(0, Math.min(20, Math.floor(minutes)));
  if (total < 6) return { walkMin: Math.max(total, 0), jogMin: 0, mobilityMin: WARMUP_MIN };
  const jogMin = total >= 12 ? Math.min(6, Math.round(total * 0.3)) : 0;
  return { walkMin: total - jogMin, jogMin, mobilityMin: WARMUP_MIN };
}

/** Movimientos para un rato libre entre reuniones (sin equipo, en ropa de trabajo). */
const BREAK_MOVES = [
  'Círculos de hombros: 10 hacia atrás y 10 hacia adelante',
  'Rotación suave de cuello: 5 por lado',
  'Giro de tronco de pie: 10 por lado',
  'Círculos de cadera: 10 por lado',
  'Sentadillas lentas al aire: 10',
  'Marcha en el lugar: 1 min',
];

/** Pausa activa que cabe en `minutes` libres: 3 movimientos desde 10 min, 5 desde 15. */
export function buildBreak(minutes: number): string[] | null {
  if (minutes < 10) return null;
  return BREAK_MOVES.slice(0, minutes >= 15 ? 5 : 3);
}
