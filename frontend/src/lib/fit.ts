import type { CalendarWeek } from './api-types';
import type { Segment } from './calendar';
import { hhmmToMinutes } from './format';
import type { SessionPrefs } from './prefs';

/** booked: ya hay cita · fits: cabe · busy: lo tapa su calendario · gym-closed / too-short: las reglas no dan. */
export type FitStatus = 'booked' | 'fits' | 'busy' | 'gym-closed' | 'too-short' | 'not-a-day' | 'past';

export interface TakenInterval {
  dayIndex: number;
  startMin: number;
  endMin: number;
}

export interface FitEntry {
  date: string;
  dayIndex: number;
  weekday: number;
  status: FitStatus;
  slot?: { startMin: number; endMin: number };
  reason: string;
  suggested: boolean;
}

const STEP = 15;
/** Misma anticipación mínima que el backend (backend/src/slots.ts MIN_LEAD_MS). */
const LEAD_MIN = 60;

export const fmtMin = (m: number) =>
  `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
const ceilTo = (m: number, step: number) => Math.ceil(m / step) * step;

interface FitInput {
  days: CalendarWeek['days'];
  prefs: SessionPrefs;
  /** Reuniones de su Google Calendar, ya partidas por día. */
  busy: Segment[];
  /** Citas de La Cita activas en la semana. */
  taken: TakenInterval[];
  /** Hora del backend (real o simulada) en Santiago. */
  now: { date: string; minutes: number } | null;
  /** Primer candidato de cada día (el backend propone a esta hora: user.preferredTime). */
  preferredTime?: string;
}

/**
 * Dónde cabe la sesión cada día de la semana visible:
 * horario del gym ∩ ventana de la usuaria ∩ huecos de su calendario ∩ duración de la sesión.
 */
export function fitWeek({ days, prefs, busy, taken, now, preferredTime }: FitInput): FitEntry[] {
  const dur = prefs.sessionMin;
  const open = hhmmToMinutes(prefs.gymHours.open);
  const close = hhmmToMinutes(prefs.gymHours.close);
  const wStart = hhmmToMinutes(prefs.window.start);
  const wEnd = hhmmToMinutes(prefs.window.end);
  const allowedStart = Math.max(wStart, open);
  const allowedEnd = Math.min(wEnd, close);
  const pref = preferredTime ? hhmmToMinutes(preferredTime) : null;

  return days.map((d, dayIndex): FitEntry => {
    const base = { date: d.date, dayIndex, weekday: d.weekday, suggested: false };

    const booked = taken.find((t) => t.dayIndex === dayIndex);
    if (booked) {
      return { ...base, status: 'booked', slot: { startMin: booked.startMin, endMin: booked.endMin }, reason: `Tu cita: ${fmtMin(booked.startMin)}` };
    }
    if (!prefs.days.includes(d.weekday)) return { ...base, status: 'not-a-day', reason: 'No es uno de tus días' };
    if (now && d.date < now.date) return { ...base, status: 'past', reason: 'Ya pasó' };

    if (allowedEnd - allowedStart < dur) {
      if (wEnd <= open || wStart >= close) return { ...base, status: 'gym-closed', reason: 'El gym está cerrado en tu ventana' };
      if (wEnd > close) return { ...base, status: 'gym-closed', reason: `El gym cierra a las ${prefs.gymHours.close}` };
      if (wStart < open) return { ...base, status: 'gym-closed', reason: `El gym abre a las ${prefs.gymHours.open}` };
      return { ...base, status: 'too-short', reason: 'Tu ventana es más corta que tu sesión' };
    }

    const earliest =
      now && d.date === now.date ? Math.max(allowedStart, ceilTo(now.minutes + LEAD_MIN, STEP)) : allowedStart;
    const dayBusy = busy.filter((b) => b.dayIndex === dayIndex);
    const conflicts = (t: number) => dayBusy.filter((b) => b.startMin < t + dur && b.endMin > t);

    const candidates: number[] = [];
    if (pref !== null && pref >= earliest && pref + dur <= allowedEnd) candidates.push(pref);
    for (let t = ceilTo(earliest, STEP); t + dur <= allowedEnd; t += STEP) if (t !== pref) candidates.push(t);
    if (!candidates.length) return { ...base, status: 'past', reason: 'Hoy ya no alcanza' };

    let blocker: Segment | null = null;
    for (const t of candidates) {
      const c = conflicts(t);
      if (!c.length) return { ...base, status: 'fits', slot: { startMin: t, endMin: t + dur }, reason: 'Libre' };
      for (const b of c) if (!blocker || b.endMin > blocker.endMin) blocker = b;
    }

    // ¿Cabría si el gym cerrara más tarde? Entonces el motivo es el cierre, no su calendario.
    if (wEnd > close) {
      for (let t = ceilTo(earliest, STEP); t + dur <= wEnd; t += STEP) {
        if (t + dur > close && !conflicts(t).length) {
          return { ...base, status: 'gym-closed', reason: `Solo quedaba a las ${fmtMin(t)}, y el gym cierra a las ${prefs.gymHours.close}` };
        }
      }
    }
    const what = blocker && blocker.title && blocker.title !== 'Ocupado' ? `«${blocker.title}»` : 'Ocupado';
    return { ...base, status: 'busy', reason: blocker ? `${what} hasta las ${fmtMin(blocker.endMin)}` : 'Ocupado' };
  });
}

/** Marca hasta `perWeek` días que caben (contando las citas ya agendadas), separados por al menos un día si se puede. */
export function pickSuggestions(entries: FitEntry[], perWeek: number): FitEntry[] {
  const bookedIdx = entries.filter((e) => e.status === 'booked').map((e) => e.dayIndex);
  const need = Math.max(0, perWeek - bookedIdx.length);
  const fits = entries.filter((e) => e.status === 'fits');
  const chosen: number[] = [];
  const spaced = (i: number) => [...chosen, ...bookedIdx].every((c) => Math.abs(c - i) >= 2);
  for (const e of fits) if (chosen.length < need && spaced(e.dayIndex)) chosen.push(e.dayIndex);
  for (const e of fits) if (chosen.length < need && !chosen.includes(e.dayIndex)) chosen.push(e.dayIndex);
  return entries.map((e) => ({ ...e, suggested: chosen.includes(e.dayIndex) }));
}
