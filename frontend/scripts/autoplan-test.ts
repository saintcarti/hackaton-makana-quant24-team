// Pruebas de frontend/src/lib/autoplan.ts (el agente elige split y duración). Correr con: pnpm test:planes
import { autoDecide, type DayRoom } from '../src/lib/autoplan';

let pass = 0;
let fail = 0;
const check = (name: string, ok: boolean, info?: unknown) => {
  if (ok) {
    pass++;
    console.log(`PASS ${name}`);
  } else {
    fail++;
    console.log(`FAIL ${name}`, info === undefined ? '' : JSON.stringify(info));
  }
};

// Semana del lunes 26-oct-2026.
const D = ['2026-10-26', '2026-10-27', '2026-10-28', '2026-10-29', '2026-10-30', '2026-10-31', '2026-11-01'];
const week = (rooms: Record<number, number>, booked: number[] = []): DayRoom[] =>
  D.map((date, i) => ({ date, booked: booked.includes(i), maxMin: rooms[i] ?? 0 }));
const dates = (d: ReturnType<typeof autoDecide>) => d.plan.sessions.map((s) => s.date.slice(8) + ':' + s.dayType.id).join(' ');

// 1. Tres días con una hora libre y quiere 3 → PPL de 40, lun/mié/vie, completo.
let r = autoDecide(3, week({ 0: 60, 2: 60, 4: 60 }));
check('3 días ≥60, quiere 3 → PPL 40', r.choice.id === 'ppl' && r.sessionMin === 40 && r.plan.complete && !r.reduced, r);
check('… lun Push, mié Pull, vie Legs', dates(r) === '26:push 28:pull 30:legs', dates(r));

// 2. Huecos cortos (30) → PPL de 30.
r = autoDecide(3, week({ 0: 30, 2: 30, 4: 30 }));
check('3 días de 30 → PPL 30', r.choice.id === 'ppl' && r.sessionMin === 30 && r.plan.complete, r);

// 3. Dos días con 40 y uno con 30 → PPL de 30 (mantiene las 3 veces).
r = autoDecide(3, week({ 0: 40, 2: 40, 4: 30 }));
check('40/40/30 → PPL 30', r.choice.id === 'ppl' && r.sessionMin === 30 && r.plan.complete, r);

// 4. Quiere 3 pero solo hay 2 días (≥50) → Upper/Lower de 50, reducido.
r = autoDecide(3, week({ 0: 60, 3: 50 }));
check('2 días, quiere 3 → Upper/Lower 50 (reducido)', r.choice.id === 'upper-lower' && r.sessionMin === 50 && r.plan.complete && r.reduced, r);

// 5. Quiere 3 pero solo hay 1 día → Full body de 60, reducido.
r = autoDecide(3, week({ 1: 60 }));
check('1 día, quiere 3 → Full body 60 (reducido)', r.choice.id === 'fullbody' && r.sessionMin === 60 && r.plan.complete && r.reduced, r);

// 6. Quiere 2, dos días seguidos → Upper/Lower entra en días seguidos (no repiten grupos).
r = autoDecide(2, week({ 1: 50, 2: 50 }));
check('mar+mié seguidos → Upper/Lower 50', r.choice.id === 'upper-lower' && r.sessionMin === 50 && r.plan.complete, r);

// 7. Quiere 2 con huecos de 40 → Upper/Lower de 40.
r = autoDecide(2, week({ 0: 40, 3: 40 }));
check('2 días de 40 → Upper/Lower 40', r.choice.id === 'upper-lower' && r.sessionMin === 40, r);

// 7b. Martes con 40 y jueves con 30 (las reuniones del ejemplo): dos Upper/Lower de 30 antes que un Full body.
r = autoDecide(3, week({ 1: 40, 3: 30 }));
check('mar 40 + jue 30, quiere 3 → Upper/Lower 30', r.choice.id === 'upper-lower' && r.sessionMin === 30 && r.plan.complete && r.reduced, r);

// 8. Quiere 1 aunque tenga 5 días libres → Full body de 60, una sola sesión.
r = autoDecide(1, week({ 0: 60, 1: 60, 2: 60, 3: 60, 4: 60 }));
check('quiere 1 → Full body 60, 1 sesión', r.choice.id === 'fullbody' && r.sessionMin === 60 && r.plan.sessions.length === 1, r);

// 9. Quiere 1 con un hueco de 45 (cabe 40) → Full body de 40.
r = autoDecide(1, week({ 2: 40 }));
check('hueco de 40 → Full body 40', r.choice.id === 'fullbody' && r.sessionMin === 40 && r.plan.complete, r);

// 10. Sin huecos → plan vacío, incompleto, con los 8 grupos sin cubrir.
r = autoDecide(3, week({}));
check('sin días → plan vacío', r.plan.sessions.length === 0 && !r.plan.complete && r.plan.missing.length === 8, r);

// 11. Hueco de 30 y quiere 1 → Full body no cabe (mín 40): el mejor plan incompleto, sin inventar.
r = autoDecide(1, week({ 2: 30 }));
check('solo 30 min y quiere 1 → incompleto', !r.plan.complete, r);

// 12. Cita real sin hueco calculado igual entra.
r = autoDecide(1, week({}, [2]));
check('cita real entra aunque maxMin=0', r.plan.sessions.length === 1 && r.plan.sessions[0].booked && r.plan.complete, r);

// 13. Cita real el miércoles + días libres → la cita es parte del plan.
r = autoDecide(3, week({ 0: 60, 4: 60 }, [2]));
check('cita del mié dentro del PPL', r.choice.id === 'ppl' && r.plan.sessions.some((s) => s.date === D[2] && s.booked), r);

// 14. Tres días seguidos → PPL igual (Push, Pull y Legs no comparten grupos).
r = autoDecide(3, week({ 0: 40, 1: 40, 2: 40 }));
check('lun/mar/mié seguidos → PPL completo', r.choice.id === 'ppl' && r.plan.complete && r.plan.conflicts.length === 0, r);

// 15. Fijas respetadas: el lunes ya fue Push.
r = autoDecide(3, week({ 2: 40, 4: 40 }, [0]), [{ date: D[0], dayTypeId: 'push' }]);
check('fija lun=Push respetada', r.plan.sessions.find((s) => s.date === D[0])?.dayType.id === 'push' && r.plan.complete, r);

// 15b. Fija de otro split: solo splits que la contienen (no se re-rotula lo que ya hizo).
r = autoDecide(3, week({ 2: 60, 4: 60 }, [0]), [{ date: D[0], dayTypeId: 'legs' }]);
check('fija lun=Legs → sigue PPL y lun queda Legs', r.choice.id === 'ppl' && r.plan.sessions.find((s) => s.date === D[0])?.dayType.id === 'legs', r);
r = autoDecide(3, week({ 2: 60, 4: 60 }, [0]), [{ date: D[0], dayTypeId: 'upper' }]);
check('fija lun=Upper → Upper/Lower, no PPL', r.choice.id === 'upper-lower' && r.plan.sessions.find((s) => s.date === D[0])?.dayType.id === 'upper', r);

// 15c. Una cita real con hueco de 40 pone techo: el Full body no puede ser de 60.
r = autoDecide(1, week({ 0: 60, 2: 40, 4: 60 }, [2]));
check('cita del mié con hueco 40 → Full body de 40', r.choice.id === 'fullbody' && r.sessionMin === 40 && r.plan.complete, r);
// Con techo 30, ninguna duración del Full body cabe: se anuncia lo que de verdad cabe (30), como hará el backend.
r = autoDecide(1, week({ 2: 30 }, [2]));
check('cita con hueco 30 → Full body de 30 (lo que cabe)', r.choice.id === 'fullbody' && r.sessionMin === 30, r);
// Una cita que ya pasó (maxMin 0) no limita.
r = autoDecide(1, week({ 4: 60 }, [0]));
check('cita pasada (0) no pone techo', r.sessionMin === 60, r);

// 15d. Más citas reales que las veces pedidas: el split alcanza para todas sin choques (no Full body seguido).
r = autoDecide(1, week({}, [0, 1, 2]));
check('3 citas seguidas con perWeek 1 → PPL sin choques', r.choice.id === 'ppl' && r.plan.complete && r.plan.conflicts.length === 0, r);
r = autoDecide(1, week({}, [0, 1]));
check('2 citas seguidas con perWeek 1 → Upper/Lower sin choques', r.choice.id === 'upper-lower' && r.plan.conflicts.length === 0, r);

// 15e. reduced solo cuando el plan cubre todo.
r = autoDecide(3, week({ 2: 30 }));
check('un día de 30 y quiere 3 → incompleto y reduced=false', !r.plan.complete && !r.reduced, r);

// 15f. Entradas fuera de forma: fechas repetidas no inflan roomDays; fijas fuera de la semana se ignoran.
const dup = [...week({ 0: 50, 3: 50 }), { date: D[0], booked: false, maxMin: 50 }, { date: D[3], booked: false, maxMin: 50 }];
r = autoDecide(2, dup);
check('fechas repetidas → roomDays 2', r.roomDays === 2 && r.choice.id === 'upper-lower', r);
r = autoDecide(3, week({ 0: 60, 2: 60, 4: 60 }), [{ date: '2026-10-19', dayTypeId: 'upper' }]);
check('fija de la semana anterior se ignora → PPL', r.choice.id === 'ppl' && r.plan.complete, r);
check('days null no revienta', !autoDecide(2, null as unknown as DayRoom[]).plan.complete);

// 16. perWeek fuera de rango se acota a 1..3.
check('perWeek 0 → 1', autoDecide(0, week({ 0: 60, 2: 60, 4: 60 })).choice.sessions === 1);
check('perWeek NaN → 1', autoDecide(NaN, week({ 0: 60 })).choice.sessions === 1);
check('perWeek 6 → 3', autoDecide(6, week({ 0: 60, 2: 60, 4: 60 })).choice.sessions === 3);

// 17. Determinismo.
const a = JSON.stringify(autoDecide(3, week({ 0: 50, 1: 30, 3: 40, 5: 60 })));
const b = JSON.stringify(autoDecide(3, week({ 0: 50, 1: 30, 3: 40, 5: 60 })));
check('determinista', a === b);

// 18. Siempre cubre los 8 grupos cuando hay al menos un día con 40 o más.
let all = true;
for (let mask = 1; mask < 128; mask++) {
  for (const len of [40, 50, 60]) {
    const rooms: Record<number, number> = {};
    for (let i = 0; i < 7; i++) if (mask & (1 << i)) rooms[i] = len;
    for (const want of [1, 2, 3]) if (!autoDecide(want, week(rooms)).plan.complete) all = false;
  }
}
check('con ≥1 día de 40+ siempre cubre los 8 grupos (127 semanas × 3 duraciones × 3 frecuencias)', all);

// 19. Nunca agenda más sesiones de las que pidió.
let capped = true;
for (let mask = 1; mask < 128; mask++) {
  const rooms: Record<number, number> = {};
  for (let i = 0; i < 7; i++) if (mask & (1 << i)) rooms[i] = 60;
  for (const want of [1, 2, 3]) if (autoDecide(want, week(rooms)).plan.sessions.length > want) capped = false;
}
check('nunca más sesiones que las pedidas', capped);

console.log(`\n${pass}/${pass + fail} PASS`);
if (fail) process.exitCode = 1;
