import { addDaysISO, hhmmToMinutes, mondayOf } from './format';
import { endToMinutes, type SessionPrefs } from './prefs';

/** Misma anticipación mínima que fit.ts y el backend. */
const LEAD_MIN = 60;
/** La sesión más corta que el agente arma. */
const SHORTEST = 30;

type Rules = Pick<SessionPrefs, 'days' | 'window' | 'gymHours' | 'perWeek'>;

/**
 * La semana que el agente está planificando: la en curso solo si todavía caben las veces por semana que Camila pidió
 * (días posibles que quedan, contando hoy si alcanza el tiempo); si no, la que viene. No mira el calendario.
 *
 * Por qué: la captura del domingo agenda la semana siguiente. Si el plan que se le manda al backend saliera de una
 * semana casi terminada (un viernes en la noche con un solo día libre), el agente armaría la semana que viene con un
 * plan degenerado (Full body de 60 minutos). Devuelve el lunes de esa semana, 'YYYY-MM-DD'.
 */
export function schedulingWeek(now: { date: string; minutes: number }, rules: Rules): string {
  const monday = mondayOf(now.date);
  const startMin = Math.max(hhmmToMinutes(rules.window.start), hhmmToMinutes(rules.gymHours.open));
  const endMin = Math.min(endToMinutes(rules.window.end), endToMinutes(rules.gymHours.close));
  let remaining = 0;
  for (let i = 0; i < 7; i++) {
    const date = addDaysISO(monday, i);
    if (date < now.date) continue;
    const weekday = (i + 1) % 7; // lunes = 1 … domingo = 0
    if (!rules.days.includes(weekday)) continue;
    if (date === now.date && Math.max(startMin, now.minutes + LEAD_MIN) + SHORTEST > endMin) continue;
    remaining++;
  }
  const needed = Math.min(Math.max(1, rules.perWeek), Math.max(1, rules.days.length));
  return remaining >= needed ? monday : addDaysISO(monday, 7);
}
