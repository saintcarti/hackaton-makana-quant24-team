import { addDays, dateKey, dayName, localParts, mondayOf, pad, parseDateKey, zonedToUtc } from './time.js';
import { Appointment, DB, User } from './types.js';

const WEEK_MS = 7 * 86400_000;

/** Lo que el front necesita de una cita, con el estado ya traducido a lenguaje sin culpa. */
export function apptView(a: Appointment) {
  const p = a.startsAt ? localParts(new Date(a.startsAt)) : null;
  return {
    ...a,
    local: p
      ? { date: dateKey(p), weekday: p.weekday, weekdayName: dayName(p.weekday), time: `${pad(p.hour)}:${pad(p.minute)}` }
      : null,
    /** Etiqueta neutra: 'lapsed' nunca se muestra como falta. */
    label:
      a.status === 'done'
        ? 'Realizada'
        : a.status === 'lapsed'
          ? 'Pasó'
          : a.status === 'skipped'
            ? 'Semana de descanso'
            : a.status === 'proposed'
              ? 'Por elegir'
              : a.status === 'reminded'
                ? 'Recordada'
                : a.moves.length > 0
                  ? 'Movida'
                  : 'Agendada',
    wasMoved: a.moves.length > 0,
  };
}

export function userAppointments(db: DB, userId: string) {
  return Object.values(db.appointments)
    .filter((a) => a.userId === userId)
    .sort((x, y) => (x.startsAt ?? x.createdAt).localeCompare(y.startsAt ?? y.createdAt));
}

/** Grilla semanal lista para pintar (parche 22-oct: prioridad baja, pero el JSON ya está). */
export function calendarWeek(db: DB, userId: string, weekOf: string) {
  const monday = parseDateKey(weekOf);
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = addDays(monday, i);
    return { date: dateKey(d), weekday: d.weekday, weekdayName: dayName(d.weekday) };
  });
  const start = zonedToUtc(monday.year, monday.month, monday.day, 0, 0).getTime();
  const end = start + WEEK_MS + 3600_000;
  const blocks = userAppointments(db, userId)
    .filter((a) => a.startsAt && new Date(a.startsAt).getTime() >= start && new Date(a.startsAt).getTime() < end)
    .map((a) => {
      const v = apptView(a);
      const p = localParts(new Date(a.startsAt!));
      return {
        id: a.id,
        dayIndex: (p.weekday + 6) % 7,
        date: v.local!.date,
        startMinutes: p.hour * 60 + p.minute,
        durationMin: a.durationMin,
        time: v.local!.time,
        status: a.status,
        label: v.label,
        wasMoved: v.wasMoved,
      };
    });
  return { weekOf, days, hourRange: { from: '18:00', to: '21:30' }, blocks };
}

export function userSummary(db: DB, user: User, now: Date) {
  const appts = userAppointments(db, user.id);
  // Ventana: las 6 semanas completas previas a la semana en curso + la semana en curso.
  const mon = parseDateKey(mondayOf(now));
  const sinceDay = addDays(mon, -42);
  const since = zonedToUtc(sinceDay.year, sinceDay.month, sinceDay.day, 0, 0).getTime();
  const done = appts.filter((a) => a.status === 'done');
  const doneRecent = done.filter((a) => a.startsAt && new Date(a.startsAt).getTime() >= since);
  const next = appts
    .filter((a) => a.startsAt && (a.status === 'confirmed' || a.status === 'reminded') && new Date(a.startsAt) > now)
    .sort((x, y) => x.startsAt!.localeCompare(y.startsAt!))[0];
  const perVisit = user.monthlyFee / user.plannedVisitsPerMonth;
  return {
    userId: user.id,
    // Sin rachas (O2): solo conteos que no se "rompen".
    visitsLast6Weeks: doneRecent.length, // incluye la semana en curso
    visitsTotal: done.length,
    movesLast6Weeks: appts.filter((a) => a.moves.some((m) => new Date(m.at).getTime() >= since)).length,
    movesTotal: appts.reduce((n, a) => n + a.moves.length, 0),
    /** Citas que quedaron sin visita tras 2+ MUEVEs seguidos. */
    brokenChains: appts.filter((a) => a.status === 'lapsed' && a.moves.length >= 2).length,
    consecutiveMoves: user.consecutiveMoves,
    recoveredCLP: Math.round(done.length * perVisit),
    recoveredPerVisitCLP: Math.round(perVisit),
    monthlyFee: user.monthlyFee,
    nextAppointment: next ? apptView(next) : null,
    weeklyVisits: weeklyVisits(done, now),
  };
}

function weeklyVisits(done: Appointment[], now: Date) {
  const thisMonday = parseDateKey(mondayOf(now));
  return Array.from({ length: 7 }, (_, i) => {
    const key = dateKey(addDays(thisMonday, -7 * (6 - i)));
    return { weekOf: key, visits: done.filter((a) => a.startsAt && mondayOf(new Date(a.startsAt)) === key).length };
  });
}

/** Hipótesis H1–H3 de mvp-definition.md, calculadas sobre el log de eventos. */
export function metrics(db: DB) {
  const ev = db.events.filter((e) => !e.id.startsWith('seed_'));
  const captures = ev.filter((e) => e.type === 'capture_sent');
  const answered = captures.filter((cap) =>
    ev.some((e) => e.type === 'slot_chosen' && e.apptId === cap.apptId),
  );
  const defaults = ev.filter((e) => e.type === 'default_applied').length;

  const scheduled = Object.values(db.appointments).filter(
    (a) => a.startsAt && (a.status === 'done' || a.status === 'lapsed' || a.status === 'reminded' || a.status === 'confirmed'),
  );
  const confirmedDone = scheduled.filter((a) => a.status === 'done').length;

  const movedUsers = new Set(ev.filter((e) => e.type === 'moved').map((e) => e.userId));
  let movedUsersWithVisitNextWeek = 0;
  for (const uid of movedUsers) {
    const firstMove = ev.find((e) => e.type === 'moved' && e.userId === uid)!;
    const t0 = new Date(firstMove.at).getTime();
    const ok = ev.some(
      (e) => e.type === 'done' && e.userId === uid && new Date(e.at).getTime() > t0 && new Date(e.at).getTime() <= t0 + 8 * 86400_000,
    );
    if (ok) movedUsersWithVisitNextWeek += 1;
  }
  const chained = Object.values(db.appointments).filter((a) => a.moves.length >= 2);

  const rate = (n: number, d: number) => (d === 0 ? null : Math.round((n / d) * 1000) / 10);
  return {
    note: 'Datos de la sesión en curso (excluye la Camila sintética precargada). Umbrales: H1 ≥50%, H2 ≥30%, H3 ≥60%.',
    h1_captureToAppointment: { sent: captures.length, answered: answered.length, rate: rate(answered.length, captures.length), agendadosPorSilencio: defaults },
    h2_appointmentKept: { scheduled: scheduled.length, done: confirmedDone, rate: rate(confirmedDone, scheduled.length) },
    h3_moveWithoutAbandon: {
      usersWithMove: movedUsers.size,
      withVisitWithin8Days: movedUsersWithVisitNextWeek,
      rate: rate(movedUsersWithVisitNextWeek, movedUsers.size),
      chainsWith2PlusMoves: chained.length,
      chainsEndingInVisit: chained.filter((a) => a.status === 'done').length,
    },
  };
}
