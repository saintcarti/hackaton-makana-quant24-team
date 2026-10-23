import type { Message, User } from './api-types';
import { SPLITS, planSplit, type Candidate, type FixedSession, type PlannedSession, type SplitChoice } from './splits';

/**
 * Lo que el plan por split recuerda en este navegador, atado a la usuaria (`createdAt`) como las reglas:
 * - el foco de las citas que ya pasaron, para que no cambie cuando el resto de la semana se reacomoda;
 * - cuándo dijo que ya lo conversó con un profesional (R4), para retomar el plan después de una derivación.
 */
interface Stored {
  createdAt: string;
  choiceKey: string;
  assignments: Record<string, string>;
  resumedAt?: string;
}

const key = (userId: string) => `lacita.split.${userId}`;
export const choiceKey = (c: SplitChoice) => `${c.id}:${c.sessions}`;

function read(user: Pick<User, 'id' | 'createdAt'>): Stored | null {
  try {
    const raw = localStorage.getItem(key(user.id));
    if (!raw) return null;
    const s = JSON.parse(raw) as Stored;
    return s.createdAt === user.createdAt ? s : null;
  } catch {
    return null;
  }
}

function save(userId: string, s: Stored) {
  try {
    localStorage.setItem(key(userId), JSON.stringify(s));
  } catch {
    /* sin almacenamiento: el plan igual funciona, solo no recuerda */
  }
}

/**
 * Focos ya decididos con el split elegido, solo de días que siguen teniendo una cita real: si la cita se movió,
 * ese día ya no cuenta como entrenado.
 */
export function fixedSessions(user: Pick<User, 'id' | 'createdAt'>, choice: SplitChoice, bookedDates: string[]): FixedSession[] {
  const s = read(user);
  if (!s || s.choiceKey !== choiceKey(choice)) return [];
  return bookedDates.filter((d) => s.assignments[d]).map((d) => ({ date: d, dayTypeId: s.assignments[d] }));
}

/**
 * Guarda el foco de cada cita real apenas se muestra: lo que Camila vio es lo que entrena, aunque nadie abra la web
 * hasta días después. Si la cita se mueve, el día viejo deja de contar (fixedSessions solo mira días con cita).
 * Si cambió el split, empieza de cero.
 */
export function rememberBooked(user: Pick<User, 'id' | 'createdAt'>, choice: SplitChoice, sessions: PlannedSession[]) {
  const prev = read(user);
  const k = choiceKey(choice);
  const base: Stored =
    prev && prev.choiceKey === k ? prev : { createdAt: user.createdAt, choiceKey: k, assignments: {}, resumedAt: prev?.resumedAt };
  let changed = base !== prev;
  const assignments = { ...base.assignments };
  for (const s of sessions) {
    if (s.booked && assignments[s.date] !== s.dayType.id) {
      assignments[s.date] = s.dayType.id;
      changed = true;
    }
  }
  if (changed) save(user.id, { ...base, assignments });
}

export function resumedAt(user: Pick<User, 'id' | 'createdAt'>): string | null {
  return read(user)?.resumedAt ?? null;
}

export function saveResumed(user: Pick<User, 'id' | 'createdAt'>, choice: SplitChoice, at: string) {
  const prev = read(user);
  save(user.id, prev ? { ...prev, resumedAt: at } : { createdAt: user.createdAt, choiceKey: choiceKey(choice), assignments: {}, resumedAt: at });
}

export function clearSplitState(userId: string) {
  try {
    localStorage.removeItem(key(userId));
  } catch {
    /* nada que limpiar */
  }
}

/**
 * R4: la derivación del agente (backend/src/tone.ts, «…con un kinesiólogo o un médico deportólogo…») marca que Camila
 * mencionó dolor. Devuelve la hora de la última, o null. Mientras no diga que ya lo conversó, el plan no asigna focos.
 */
export function painSince(messages: Message[]): string | null {
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    if (m.dir === 'out' && /kinesi[oó]log|deport[oó]log/i.test(m.text)) return m.at;
  }
  return null;
}

/**
 * Si el split elegido no alcanza a cubrir los 8 grupos con los días que caben, la primera alternativa que sí:
 * primero el mismo split con menos sesiones, después los de menos días.
 */
export function alternativeChoice(current: SplitChoice, candidates: Candidate[], fixed: FixedSession[]): SplitChoice | null {
  const options: SplitChoice[] = [];
  const same = SPLITS.find((s) => s.id === current.id);
  if (same) for (const n of [...same.variants].sort((a, b) => b - a)) if (n < current.sessions) options.push({ id: same.id, sessions: n });
  const byDays = SPLITS.flatMap((s) => s.variants.map((n) => ({ id: s.id, sessions: n })))
    .filter((c) => c.id !== current.id)
    .sort((a, b) => b.sessions - a.sessions);
  options.push(...byDays);
  for (const c of options) {
    if (c.sessions > candidates.length) continue;
    if (planSplit(c, candidates, fixed).complete) return c;
  }
  return null;
}
