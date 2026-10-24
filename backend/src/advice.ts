import { addDays, localParts, zonedToUtc } from './time.js';

/**
 * Entiende lo que Camila cuenta de su día para recomendarle una hora: una reunión que mencionó («tengo una reunión
 * el jueves a las 7 de la tarde, lo más probable es que se alargue») y cuánto le toma llegar al gym
 * («me queda a 20 minutos caminando y si troto serán unos 15»). Solo reglas: el texto que ella ve sale de plantillas.
 */

export interface Commute {
  /** Minutos caminando de la reunión/casa al gym. */
  walkMin: number;
  /** Minutos trotando todo el camino. */
  jogMin: number;
}

export interface MentionedMeeting {
  start: Date;
  /** Fin estimado: 60 min, o 90 si ella dijo que probablemente se alargue. */
  end: Date;
  mayRunLong: boolean;
}

/** Pide una recomendación de horario o que le cuente qué tiene agendado. */
export const ADVISE =
  /\b(qu[eé] horas?|a qu[eé] hora|cu[aá]ndo|qu[eé] d[ií]a)\b[^?]*\b(recomiend\w*|conviene|sugier\w*|mejor)\b|\bqu[eé]\b[^?.]*\b(agendad[oa]s?|calendario)\b|\b(cu[aá]l(es)?)\b[^?.]*\bcalendario\b|\bqu[eé] tengo (agendado|en mi calendario|esta semana)\b/;

/** Pregunta qué hay en su calendario (además de, o en vez de, pedir una hora). */
export const ASKS_SCHEDULE = /\b(agendad[oa]s?|calendario|qu[eé] tengo)\b/;

export function parseCommute(text: string): Commute | null {
  const t = text.toLowerCase();
  const walk = /(\d{1,2})\s*(?:min|minutos)\s*(?:caminando|a pie)/.exec(t) ?? /(?:caminando|a pie)[^\d.?]{0,25}(\d{1,2})\s*(?:min|minutos)/.exec(t);
  if (!walk) return null;
  const jog = /(?:troto|trotando|trotar|trotes)[^\d.?]{0,30}(\d{1,2})/.exec(t) ?? /(\d{1,2})\s*(?:min|minutos)?\s*(?:si|trotando)\s*(?:troto|trotando|trote)/.exec(t);
  const walkMin = Number(walk[1]);
  const jogMin = jog ? Number(jog[1]) : Math.max(1, Math.round(walkMin * 0.75));
  return walkMin > 0 && walkMin <= 90 && jogMin > 0 && jogMin <= walkMin ? { walkMin, jogMin } : null;
}

/**
 * Tiempo realista de llegada si camina la mayor parte y trota un tramo (≈30 % del camino). Siempre entre el trote
 * completo y la caminata completa.
 */
export function mixedTravelMinutes(c: Commute): { walkPart: number; jogPart: number; total: number } {
  const walkPart = Math.round(c.walkMin * 0.7);
  const jogPart = Math.round(c.jogMin * 0.3);
  return { walkPart, jogPart, total: walkPart + jogPart };
}

const WEEKDAYS: Array<[RegExp, number]> = [
  [/\bdomingo\b/, 0],
  [/\blunes\b/, 1],
  [/\bmartes\b/, 2],
  [/\bmi[eé]rcoles\b/, 3],
  [/\bjueves\b/, 4],
  [/\bviernes\b/, 5],
  [/\bs[aá]bado\b/, 6],
];

const LONG = /\b(se alargue|se alargar[aá]|alargar|se extienda|se pase|dure m[aá]s|termine tarde)\b/;

/** «una reunión el jueves a las 7 de la tarde»: el día y la hora de la reunión que ella menciona. */
export function parseMeetingMention(text: string, now: Date): MentionedMeeting | null {
  const t = text.toLowerCase();
  const m = /reuni[oó]n(?:es)?\b[^.?!]*?\b(?:el\s+)?(domingo|lunes|martes|mi[eé]rcoles|jueves|viernes|s[aá]bado)\b[^.?!]*?\ba\s+las?\s+(\d{1,2})(?::(\d{2}))?\s*(de la tarde|de la noche|pm|de la ma[ñn]ana|am|hrs?)?/.exec(t);
  if (!m) return null;
  const weekday = WEEKDAYS.find(([re]) => re.test(m[1]!))![1];
  let hour = Number(m[2]);
  const minute = m[3] ? Number(m[3]) : 0;
  const marker = m[4] ?? '';
  if (/tarde|noche|pm/.test(marker) && hour < 12) hour += 12;
  else if (!marker && hour >= 1 && hour <= 7) hour += 12; // «a las 7» en un día de oficina con gym vespertino
  if (hour > 23 || minute > 59) return null;
  const today = localParts(now);
  for (let i = 0; i < 8; i++) {
    const d = addDays(today, i);
    if (d.weekday !== weekday) continue;
    const start = zonedToUtc(d.year, d.month, d.day, hour, minute);
    if (start.getTime() < now.getTime()) continue;
    const mayRunLong = LONG.test(t);
    return { start, end: new Date(start.getTime() + (mayRunLong ? 90 : 60) * 60_000), mayRunLong };
  }
  return null;
}
