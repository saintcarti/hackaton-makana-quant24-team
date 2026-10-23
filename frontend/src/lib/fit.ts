import type { CalendarWeek } from './api-types';
import type { Segment } from './calendar';
import { hhmmToMinutes } from './format';
import { endToMinutes, type SessionPrefs } from './prefs';

/**
 * booked: ya hay cita · moved-from: de ahí movió su cita (no se le vuelve a ofrecer) · fits: cabe ·
 * busy: lo tapa su calendario · gym-closed / too-short: las reglas no dan · not-a-day · past.
 */
export type FitStatus = 'booked' | 'moved-from' | 'fits' | 'busy' | 'gym-closed' | 'too-short' | 'not-a-day' | 'past';

export interface TakenInterval {
  dayIndex: number;
  startMin: number;
  endMin: number;
}

/** Día de la semana visible que una movida dejó libre, y a qué día se fue la cita. */
export interface MovedFrom {
  date: string;
  toDayName: string;
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
  /** Reuniones de su calendario (Google o el de ejemplo), ya partidas por día; incluye los días completos. */
  busy: Segment[];
  /** Citas de La Cita activas en la semana. */
  taken: TakenInterval[];
  /** Días que una movida dejó libres: después de «hoy no puedo» no se le ofrece ese mismo día. */
  movedFrom?: MovedFrom[];
  /** Hora del backend (real o simulada) en Santiago. */
  now: { date: string; minutes: number } | null;
  /** Primer candidato de cada día (el backend propone a esta hora: user.preferredTime). */
  preferredTime?: string;
}

/**
 * Dónde cabe la sesión cada día de la semana visible:
 * horario del gym ∩ ventana de la usuaria ∩ huecos de su calendario ∩ duración de la sesión.
 */
export function fitWeek({ days, prefs, busy, taken, movedFrom = [], now, preferredTime }: FitInput): FitEntry[] {
  const dur = prefs.sessionMin;
  const open = hhmmToMinutes(prefs.gymHours.open);
  const close = endToMinutes(prefs.gymHours.close);
  const closeLabel = prefs.gymHours.close === '00:00' ? 'medianoche' : `las ${prefs.gymHours.close}`;
  const wStart = hhmmToMinutes(prefs.window.start);
  const wEnd = endToMinutes(prefs.window.end);
  const allowedStart = Math.max(wStart, open);
  const allowedEnd = Math.min(wEnd, close);
  const pref = preferredTime ? hhmmToMinutes(preferredTime) : null;

  return days.map((d, dayIndex): FitEntry => {
    const base = { date: d.date, dayIndex, weekday: d.weekday, suggested: false };

    const booked = taken.find((t) => t.dayIndex === dayIndex);
    if (booked) {
      return { ...base, status: 'booked', slot: { startMin: booked.startMin, endMin: booked.endMin }, reason: `Tu cita: ${fmtMin(booked.startMin)}` };
    }
    const moved = movedFrom.find((m) => m.date === d.date);
    if (moved) return { ...base, status: 'moved-from', reason: `La moviste al ${moved.toDayName}` };
    if (!prefs.days.includes(d.weekday)) return { ...base, status: 'not-a-day', reason: 'No es uno de tus días' };
    if (now && d.date < now.date) return { ...base, status: 'past', reason: 'Ya pasó' };

    if (allowedEnd - allowedStart < dur) {
      if (wEnd <= open || wStart >= close) return { ...base, status: 'gym-closed', reason: 'El gym está cerrado en tu ventana' };
      if (wEnd > close) return { ...base, status: 'gym-closed', reason: `El gym cierra a ${closeLabel}` };
      if (wStart < open) return { ...base, status: 'gym-closed', reason: `El gym abre a las ${prefs.gymHours.open}` };
      return { ...base, status: 'too-short', reason: 'Tu ventana es más corta que tu sesión' };
    }

    const isToday = !!now && d.date === now.date;
    const earliest = isToday ? Math.max(allowedStart, ceilTo(now!.minutes + LEAD_MIN, STEP)) : allowedStart;
    const dayBusy = busy.filter((b) => b.dayIndex === dayIndex);
    const conflicts = (t: number) => dayBusy.filter((b) => b.startMin < t + dur && b.endMin > t);

    const candidates: number[] = [];
    if (pref !== null && pref >= earliest && pref + dur <= allowedEnd) candidates.push(pref);
    for (let t = ceilTo(earliest, STEP); t + dur <= allowedEnd; t += STEP) if (t !== pref) candidates.push(t);
    if (!candidates.length) {
      return isToday
        ? { ...base, status: 'past', reason: 'Hoy ya no alcanza' }
        : { ...base, status: 'too-short', reason: 'Tu ventana es más corta que tu sesión' };
    }

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
          return { ...base, status: 'gym-closed', reason: `Solo quedaba a las ${fmtMin(t)}, y el gym cierra a ${closeLabel}` };
        }
      }
    }
    const what = blocker && blocker.title && blocker.title !== 'Ocupado' ? `«${blocker.title}»` : 'Ocupado';
    const until = blocker && blocker.endMin >= 24 * 60 ? 'todo el día' : blocker ? `hasta las ${fmtMin(blocker.endMin)}` : '';
    return { ...base, status: 'busy', reason: `${what} ${until}`.trim() };
  });
}

/**
 * Marca hasta `perWeek` días que caben (contando las citas ya agendadas), separados por al menos un día si se puede.
 * En una semana de descanso no marca nada.
 */
export function pickSuggestions(entries: FitEntry[], perWeek: number, restWeek = false): FitEntry[] {
  if (restWeek) return entries.map((e) => ({ ...e, suggested: false }));
  const bookedIdx = entries.filter((e) => e.status === 'booked').map((e) => e.dayIndex);
  const need = Math.max(0, perWeek - bookedIdx.length);
  const fits = entries.filter((e) => e.status === 'fits');
  const chosen: number[] = [];
  const spaced = (i: number) => [...chosen, ...bookedIdx].every((c) => Math.abs(c - i) >= 2);
  for (const e of fits) if (chosen.length < need && spaced(e.dayIndex)) chosen.push(e.dayIndex);
  for (const e of fits) if (chosen.length < need && !chosen.includes(e.dayIndex)) chosen.push(e.dayIndex);
  return entries.map((e) => ({ ...e, suggested: chosen.includes(e.dayIndex) }));
}
