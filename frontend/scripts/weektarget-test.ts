// Pruebas de frontend/src/lib/weekTarget.ts (qué semana está planificando el agente). Correr con: pnpm test:planes
import { schedulingWeek } from '../src/lib/weekTarget';

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

// Reglas de Camila: gimnasio 06:00–22:00, ventana 19:00–21:00, lunes/miércoles/viernes.
const rules = (perWeek: number, days = [1, 3, 5]) => ({
  days,
  window: { start: '19:00', end: '21:00' },
  gymHours: { open: '06:00', close: '22:00' },
  perWeek,
});
const at = (date: string, hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return { date, minutes: h * 60 + m };
};
// Semana en curso: lunes 19-oct-2026. La siguiente: lunes 26-oct-2026.
const CUR = '2026-10-19';
const NEXT = '2026-10-26';

// 1. Sábado 15:30: ya pasaron lun/mié/vie → planifica la que viene (el caso que rompía la demo).
let w = schedulingWeek(at('2026-10-24', '15:30'), rules(3));
check('sábado 15:30, quiere 3 → semana que viene', w === NEXT, w);

// 2. Domingo 20:00 (la captura): también la que viene.
w = schedulingWeek(at('2026-10-25', '20:00'), rules(3));
check('domingo 20:00 → semana que viene', w === NEXT, w);

// 3. Lunes temprano: caben los tres días → la semana en curso.
w = schedulingWeek(at('2026-10-19', '08:00'), rules(3));
check('lunes 08:00, quiere 3 → semana en curso', w === CUR, w);

// 4. Lunes 20:45: hoy ya no cabe una sesión de 30 min antes de las 21:00 → quedan 2 de 3 → la que viene.
w = schedulingWeek(at('2026-10-19', '20:45'), rules(3));
check('lunes 20:45, quiere 3 → semana que viene', w === NEXT, w);

// 5. Lo mismo pero quiere solo 2: quedan mié y vie → la semana en curso.
w = schedulingWeek(at('2026-10-19', '20:45'), rules(2));
check('lunes 20:45, quiere 2 → semana en curso', w === CUR, w);

// 6. Miércoles 18:00: hoy aún cabe (19:00 + 30 ≤ 21:00); quedan mié y vie → con 3 no alcanza, con 2 sí.
w = schedulingWeek(at('2026-10-21', '18:00'), rules(3));
check('miércoles 18:00, quiere 3 → semana que viene', w === NEXT, w);
w = schedulingWeek(at('2026-10-21', '18:00'), rules(2));
check('miércoles 18:00, quiere 2 → semana en curso', w === CUR, w);

// 7. Viernes tarde-noche: ya no hay hueco hoy y no quedan días → la que viene.
w = schedulingWeek(at('2026-10-23', '22:30'), rules(1));
check('viernes 22:30, quiere 1 → semana que viene', w === NEXT, w);

// 8. Lo que pide no puede superar los días que ofrece: un solo día posible, quiere 3 → basta con uno.
w = schedulingWeek(at('2026-10-19', '08:00'), rules(3, [1]));
check('un solo día posible, quiere 3 → semana en curso', w === CUR, w);

// 9. Sin días elegidos no se cuelga: la que viene.
w = schedulingWeek(at('2026-10-19', '08:00'), rules(3, []));
check('sin días → semana que viene', w === NEXT, w);

// 10. Ventana que cierra a medianoche ("00:00" = 24:00): manda el cierre del gimnasio (22:00).
// Lunes 20:30 + 60 de anticipación = 21:30; 21:30 + 30 min llega justo al cierre → cabe. Con ventana hasta 21:00 no cabe.
w = schedulingWeek(at('2026-10-19', '20:30'), { ...rules(3), window: { start: '19:00', end: '00:00' } });
check('ventana hasta 00:00, lunes 20:30, quiere 3 → semana en curso (manda el cierre del gym)', w === CUR, w);
w = schedulingWeek(at('2026-10-19', '20:30'), rules(3));
check('ventana hasta 21:00, lunes 20:30, quiere 3 → semana que viene', w === NEXT, w);
w = schedulingWeek(at('2026-10-19', '20:45'), { ...rules(3), window: { start: '19:00', end: '00:00' } });
check('ventana hasta 00:00, lunes 20:45 (pasa el cierre del gym), quiere 3 → semana que viene', w === NEXT, w);

console.log(`\n${pass} pasan, ${fail} fallan`);
process.exitCode = fail ? 1 : 0;
