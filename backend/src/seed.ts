import { addDays, dateKey, mondayOf, parseDateKey, zonedToUtc } from './time.js';
import { Appointment, DB, User, emptyDB } from './types.js';

export const DEMO_USER_ID = 'camila-sintetica';

/**
 * "Camila sintética" (R2: datos inventados). 6 semanas previas al `now`:
 * 12 citas (lunes y miércoles 19:15) -> 11 visitas, 1 pasada sin visita, 4 movidas, 0 cadenas rotas
 * (ninguna cita con 2+ MUEVEs seguidos sin visita).
 */
export function seedCamila(db: DB, now: Date): User {
  const user: User = {
    id: DEMO_USER_ID,
    name: 'Camila',
    gym: 'Gym Ñuñoa (demo)',
    monthlyFee: 34900,
    plannedVisitsPerMonth: 3,
    window: { start: '19:00', end: '21:00' },
    preferredTime: '19:15',
    channel: { type: 'sim' },
    synthetic: true,
    consecutiveMoves: 0,
    pending: null,
    createdAt: now.toISOString(),
  };
  db.users[user.id] = user;

  const thisMonday = parseDateKey(mondayOf(now));
  // Citas: [semanas atrás, día (1=lun, 3=mié), estado, ¿se movió 2 días?]
  const plan: Array<[number, 1 | 3, 'done' | 'lapsed', boolean?]> = [
    [6, 1, 'done'],
    [6, 3, 'done'],
    [5, 1, 'done', true],
    [5, 3, 'done'],
    [4, 1, 'done'],
    [4, 3, 'done', true],
    [3, 1, 'done'],
    [3, 3, 'lapsed'],
    [2, 1, 'done', true],
    [2, 3, 'done'],
    [1, 1, 'done'],
    [1, 3, 'done', true],
  ];

  plan.forEach(([weeksAgo, weekday, status, wasMoved], i) => {
    const base = addDays(thisMonday, -7 * weeksAgo + (weekday - 1));
    const original = zonedToUtc(base.year, base.month, base.day, 19, 15);
    let startsAt = original;
    const moves: Appointment['moves'] = [];
    if (wasMoved) {
      // La visita ocurrió en el slot nuevo: lunes -> miércoles, miércoles -> viernes.
      const target = addDays(base, 2);
      startsAt = zonedToUtc(target.year, target.month, target.day, 19, 15);
      moves.push({
        from: original.toISOString(),
        to: startsAt.toISOString(),
        at: new Date(original.getTime() - 5 * 3600_000).toISOString(),
      });
    }
    const id = `seed_${String(i + 1).padStart(2, '0')}`;
    db.appointments[id] = {
      id,
      userId: user.id,
      startsAt: startsAt.toISOString(),
      durationMin: 40,
      venue: 'tu gym de Ñuñoa',
      content: '3 máquinas que ya conoces',
      status,
      source: 'seed',
      options: [],
      moves,
      weekOf: dateKey(parseDateKey(mondayOf(startsAt))),
      createdAt: new Date(startsAt.getTime() - 7 * 86400_000).toISOString(),
      ...(status === 'done' ? { doneAt: new Date(startsAt.getTime() + 60 * 60_000).toISOString() } : {}),
    };
    db.events.push({
      id: `seed_e_${i + 1}`,
      userId: user.id,
      type: status === 'done' ? 'done' : 'lapsed',
      at: (status === 'done' ? new Date(startsAt.getTime() + 60 * 60_000) : startsAt).toISOString(),
      apptId: id,
    });
    for (const m of moves) {
      db.events.push({ id: `seed_m_${i + 1}`, userId: user.id, type: 'moved', at: m.at, apptId: id, data: { to: m.to } });
    }
  });
  return user;
}

export function freshDB(now: Date, withSeed = true): DB {
  const db = emptyDB();
  if (withSeed) seedCamila(db, now);
  return db;
}
