// Pruebas de frontend/src/lib/splits.ts. Se empaqueta con esbuild y se corre con node.
import {
  GROUP_LABEL,
  MUSCLE_GROUPS,
  SPLITS,
  describeDayType,
  getDayType,
  getSplit,
  isValidChoice,
  planSplit,
  splitSequence,
  type Candidate,
  type FixedSession,
  type MuscleGroup,
  type SplitChoice,
  type SplitId,
  type SplitPlan,
} from '../src/lib/splits';
import { BANNED_WORDS } from '../../backend/src/tone';

declare const process: { exitCode?: number; env: Record<string, string | undefined> };

let passed = 0;
let failed = 0;
function check(name: string, ok: boolean, detail?: unknown) {
  if (ok) {
    passed++;
    console.log(`PASS ${name}`);
  } else {
    failed++;
    console.log(`FAIL ${name}${detail === undefined ? '' : `\n     ${JSON.stringify(detail)}`}`);
  }
}
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
function checkEq(name: string, actual: unknown, expected: unknown) {
  check(name, same(actual, expected), { actual, expected });
}

// Semana de prueba: lun 26-oct-2026 … dom 1-nov-2026 (cruza el cambio de mes).
const WEEK = ['2026-10-26', '2026-10-27', '2026-10-28', '2026-10-29', '2026-10-30', '2026-10-31', '2026-11-01'];
const [MON, TUE, WED, THU, FRI, SAT, SUN] = WEEK;
const free = (...dates: string[]): Candidate[] => dates.map((date) => ({ date, booked: false }));
const booked = (...dates: string[]): Candidate[] => dates.map((date) => ({ date, booked: true }));
const c = (id: SplitId, sessions: number): SplitChoice => ({ id, sessions });
const dates = (p: SplitPlan) => p.sessions.map((s) => s.date);
const ids = (p: SplitPlan) => p.sessions.map((s) => s.dayType.id);
const dayNum = (iso: string) => Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10)) / 86_400_000;
const minSeparation = (p: SplitPlan) => {
  let m = Infinity;
  for (let i = 1; i < p.sessions.length; i++) m = Math.min(m, dayNum(p.sessions[i].date) - dayNum(p.sessions[i - 1].date));
  return m;
};
/** Pares en días seguidos que comparten grupos (calculado aparte del planificador). */
const adjacentShared = (p: SplitPlan) => {
  const out: Array<{ first: string; second: string; groups: MuscleGroup[] }> = [];
  for (let i = 1; i < p.sessions.length; i++) {
    const a = p.sessions[i - 1];
    const b = p.sessions[i];
    const groups = MUSCLE_GROUPS.filter((g) => a.dayType.groups.includes(g) && b.dayType.groups.includes(g));
    if (dayNum(b.date) - dayNum(a.date) === 1 && groups.length) out.push({ first: a.date, second: b.date, groups });
  }
  return out;
};

// ——— Catálogo ———

checkEq('MUSCLE_GROUPS en el orden pedido', MUSCLE_GROUPS, ['pecho', 'espalda', 'hombros', 'biceps', 'triceps', 'piernas', 'gluteos', 'core']);
checkEq(
  'GROUP_LABEL con tildes',
  MUSCLE_GROUPS.map((g) => GROUP_LABEL[g]),
  ['Pecho', 'Espalda', 'Hombros', 'Bíceps', 'Tríceps', 'Piernas', 'Glúteos', 'Core'],
);
checkEq(
  'SPLITS: ids, etiquetas y variantes',
  SPLITS.map((s) => [s.id, s.label, s.variants]),
  [
    ['fullbody', 'Full body', [1, 2, 3]],
    ['upper-lower', 'Upper / Lower', [2, 4]],
    ['ppl', 'Push / Pull / Legs', [3, 6]],
    ['torso-piernas-brazos', 'Pecho-espalda / Piernas / Brazos', [3]],
    ['cinco-dias', 'Un grupo por día', [5]],
  ],
);
for (const s of SPLITS) {
  for (const n of s.variants) {
    const seq = splitSequence(s.id, n);
    const covered = new Set(seq.flatMap((dt) => dt.groups));
    check(`${s.id} x${n}: la secuencia tiene ${n} sesiones y cubre los 8 grupos`, seq.length === n && covered.size === 8, {
      len: seq.length,
      missing: MUSCLE_GROUPS.filter((g) => !covered.has(g)),
    });
  }
}
const seqIds = (id: SplitId, n: number) => splitSequence(id, n).map((dt) => dt.id);
checkEq('secuencia canónica PPL x6', seqIds('ppl', 6), ['push', 'pull', 'legs', 'push', 'pull', 'legs']);
checkEq('secuencia canónica Upper/Lower x4', seqIds('upper-lower', 4), ['upper', 'lower', 'upper', 'lower']);
checkEq('secuencia canónica cinco días', seqIds('cinco-dias', 5), ['pecho', 'espalda', 'piernas-gluteos', 'hombros-core', 'brazos']);
checkEq('secuencia canónica torso/piernas/brazos', seqIds('torso-piernas-brazos', 3), ['pecho-espalda-core', 'piernas-gluteos', 'brazos-hombros']);
checkEq('secuencia canónica Full body x2', seqIds('fullbody', 2), ['full-body', 'full-body']);
checkEq(
  'grupos de cada foco según la especificación',
  Object.fromEntries(
    ['upper', 'lower', 'push', 'pull', 'legs', 'pecho-espalda-core', 'piernas-gluteos', 'brazos-hombros', 'pecho', 'espalda', 'hombros-core', 'brazos'].map(
      (id) => [id, getDayType(id)?.groups],
    ),
  ),
  {
    upper: ['pecho', 'espalda', 'hombros', 'biceps', 'triceps'],
    lower: ['piernas', 'gluteos', 'core'],
    push: ['pecho', 'hombros', 'triceps'],
    pull: ['espalda', 'biceps'],
    legs: ['piernas', 'gluteos', 'core'],
    'pecho-espalda-core': ['pecho', 'espalda', 'core'],
    'piernas-gluteos': ['piernas', 'gluteos'],
    'brazos-hombros': ['biceps', 'triceps', 'hombros'],
    pecho: ['pecho'],
    espalda: ['espalda'],
    'hombros-core': ['hombros', 'core'],
    brazos: ['biceps', 'triceps'],
  },
);
check(
  'ids y rótulos cortos únicos dentro de cada split (rótulo ≤ 7 letras)',
  SPLITS.every(
    (s) =>
      new Set(s.cycle.map((d) => d.id)).size === s.cycle.length &&
      new Set(s.cycle.map((d) => d.short)).size === s.cycle.length &&
      s.cycle.every((d) => d.short.length <= 7),
  ),
);
checkEq(
  'splitSequence en los bordes (0, negativo, 2.7, NaN, 99, id desconocido)',
  [
    splitSequence('ppl', 0).length,
    splitSequence('ppl', -2).length,
    splitSequence('ppl', 2.7).length,
    splitSequence('ppl', NaN).length,
    splitSequence('ppl', 99).length,
    splitSequence('nada' as SplitId, 3).length,
  ],
  [0, 0, 2, 0, 7, 0],
);
check('getSplit devuelve el split pedido', getSplit('ppl').label === 'Push / Pull / Legs' && getSplit('cinco-dias').variants[0] === 5);
check('getSplit con un id desconocido no se cae (cae al primero)', getSplit('viejo' as SplitId).id === 'fullbody');
check(
  'isValidChoice acepta todas las variantes',
  SPLITS.every((s) => s.variants.every((n) => isValidChoice({ id: s.id, sessions: n }))),
);
checkEq(
  'isValidChoice rechaza lo que no es variante o no tiene forma',
  [
    isValidChoice(c('ppl', 4)),
    isValidChoice(c('fullbody', 0)),
    isValidChoice(c('ppl', 3.5)),
    isValidChoice(c('nada' as SplitId, 3)),
    isValidChoice(null),
    isValidChoice(JSON.parse('{"id":"ppl","sessions":"3"}')),
  ],
  [false, false, false, false, false, false],
);
const dt = (id: string) => describeDayType(getDayType(id)!);
checkEq('describeDayType: ejemplo de la especificación', dt('push'), 'Push · pecho, hombros y tríceps');
checkEq(
  'describeDayType: resto de los focos',
  ['pull', 'legs', 'upper', 'full-body', 'pecho', 'brazos', 'brazos-hombros', 'pecho-espalda-core', 'hombros-core'].map(dt),
  [
    'Pull · espalda y bíceps',
    'Legs · piernas, glúteos y core',
    'Upper · pecho, espalda, hombros, bíceps y tríceps',
    'Full body · todo el cuerpo',
    'Pecho',
    'Brazos · bíceps y tríceps',
    'Brazos y hombros · bíceps, tríceps y hombros',
    'Pecho, espalda y core',
    'Hombros y core',
  ],
);
const copy = [
  ...SPLITS.flatMap((s) => [s.label, s.blurb, ...s.cycle.flatMap((d) => [d.label, d.short, describeDayType(d)])]),
  ...Object.values(GROUP_LABEL),
];
const vetoed = copy.flatMap((t) => BANNED_WORDS.filter((w) => t.toLowerCase().includes(w)).map((w) => `${w} en «${t}»`));
check(`ningún texto usa palabras vetadas por backend/src/tone.ts (${BANNED_WORDS.length} palabras, ${copy.length} textos)`, vetoed.length === 0, vetoed);

// ——— Casos pedidos ———

{
  const p = planSplit(c('ppl', 3), free(...WEEK));
  checkEq('PPL x3, lun–dom libres: lun/mié/vie', dates(p), [MON, WED, FRI]);
  checkEq('PPL x3, lun–dom libres: orden Push, Pull, Legs', ids(p), ['push', 'pull', 'legs']);
  check('PPL x3, lun–dom libres: separación 2, completo, sin choques', minSeparation(p) === 2 && p.complete && !p.conflicts.length, p);
}
{
  const p = planSplit(c('fullbody', 3), free(MON, TUE, WED));
  checkEq('Full body x3 con solo lun–mar–mié: pone 2 (lun y mié)', dates(p), [MON, WED]);
  check('Full body x3 con solo lun–mar–mié: shortBy 1, cubre los 8, no completo', p.shortBy === 1 && !p.missing.length && !p.complete, p);
}
{
  const p = planSplit(c('upper-lower', 4), free(MON, TUE, WED, THU, FRI));
  check('Upper/Lower x4 con lun–vie: usa 4 días', p.sessions.length === 4 && p.shortBy === 0, dates(p));
  check('Upper/Lower x4 con lun–vie: sin violar descanso', !p.conflicts.length && !adjacentShared(p).length, ids(p));
  checkEq('Upper/Lower x4 con lun–vie: lun–jue en orden U, L, U, L', [dates(p), ids(p)], [
    [MON, TUE, WED, THU],
    ['upper', 'lower', 'upper', 'lower'],
  ]);
}
{
  const p = planSplit(c('ppl', 6), free(...WEEK));
  check('PPL x6 con los 7 días: 6 sesiones, completo, sin choques', p.sessions.length === 6 && p.complete && !adjacentShared(p).length, ids(p));
  checkEq('PPL x6 con los 7 días: lun–sáb, rotación canónica', [dates(p), ids(p)], [WEEK.slice(0, 6), ['push', 'pull', 'legs', 'push', 'pull', 'legs']]);
}
{
  const p = planSplit(c('fullbody', 3), [...booked(MON, TUE), ...free(WED, THU, FRI, SAT, SUN)]);
  checkEq('Full body con booked lun y mar: el choque se reporta', p.conflicts, [{ first: MON, second: TUE, groups: MUSCLE_GROUPS }]);
  checkEq('Full body con booked lun y mar: ambas citas entran y la sugerida evita el mié', dates(p), [MON, TUE, THU]);
}
{
  const p = planSplit(c('ppl', 3), [...booked(MON, TUE), ...free(THU, SAT)]);
  check('PPL con booked lun y mar: focos distintos, sin choque', !p.conflicts.length && p.sessions[0].dayType.id !== p.sessions[1].dayType.id, ids(p));
}
{
  const fixed: FixedSession[] = [{ date: MON, dayTypeId: 'legs' }];
  const p = planSplit(c('ppl', 3), free(WED, THU, FRI, SAT, SUN), fixed);
  checkEq('fija respetada: lun Legs (fija), después Push y Pull en orden', [dates(p), ids(p)], [
    [MON, WED, FRI],
    ['legs', 'push', 'pull'],
  ]);
  check('fija respetada: marcada fixed, no booked; plan completo', p.sessions[0].fixed && !p.sessions[0].booked && p.complete, p.sessions[0]);
}
{
  const withBad = planSplit(c('ppl', 3), free(...WEEK), [{ date: MON, dayTypeId: 'upper' }]);
  const without = planSplit(c('ppl', 3), free(...WEEK));
  check('fija con un foco que no es del split: se ignora', same(withBad, without) && !withBad.sessions.some((s) => s.fixed), ids(withBad));
}
{
  const p = planSplit(c('ppl', 3), [...booked(MON), ...free(TUE, WED, THU, FRI, SAT, SUN)], [{ date: MON, dayTypeId: 'pull' }]);
  checkEq('fija sobre una cita real: booked y fixed, foco intacto', p.sessions[0], { date: MON, dayType: getDayType('pull'), booked: true, fixed: true });
  checkEq('fija sobre una cita real: el resto sigue el orden (Push, Legs)', ids(p), ['pull', 'push', 'legs']);
}
{
  const p = planSplit(c('fullbody', 3), [...booked(TUE), ...free(WED, THU, FRI, SAT, SUN)], [{ date: MON, dayTypeId: 'full-body' }]);
  checkEq('fija y booked en días seguidos: choque reportado', p.conflicts.map((x) => [x.first, x.second]), [[MON, TUE]]);
}
{
  const p = planSplit(c('ppl', 3), []);
  checkEq('cero candidatas: plan vacío', p, {
    sessions: [],
    covered: [],
    missing: MUSCLE_GROUPS,
    requested: 3,
    shortBy: 3,
    complete: false,
    conflicts: [],
  });
}
{
  const p = planSplit(c('ppl', 3), [], [
    { date: MON, dayTypeId: 'push' },
    { date: WED, dayTypeId: 'pull' },
  ]);
  check('cero candidatas con fijas: quedan solo las fijas', same(ids(p), ['push', 'pull']) && p.shortBy === 1, p);
  checkEq('cero candidatas con fijas: faltan los grupos de Legs', p.missing, ['piernas', 'gluteos', 'core']);
}
{
  const p = planSplit(c('ppl', 3), booked(MON, TUE, WED, THU));
  check('más booked que sesiones: entran las 4 citas', p.sessions.length === 4 && p.sessions.every((s) => s.booked), dates(p));
  checkEq('más booked que sesiones: la secuencia se cicla (Push, Pull, Legs, Push)', ids(p), ['push', 'pull', 'legs', 'push']);
  check('más booked que sesiones: sin choques, shortBy 0, completo', !p.conflicts.length && p.shortBy === 0 && p.complete, p);
}
{
  const p = planSplit(c('fullbody', 1), [...booked(MON, WED, FRI), ...free(TUE, THU)]);
  check('Full body x1 con 3 booked: 3 sesiones y ninguna sugerida', same(dates(p), [MON, WED, FRI]) && p.requested === 1 && p.complete, dates(p));
}
{
  const input: Candidate[] = [...booked(WED), ...free(MON, TUE, THU, FRI, SAT, SUN)];
  const a = planSplit(c('ppl', 3), input, [{ date: WED, dayTypeId: 'legs' }]);
  const b = planSplit(c('ppl', 3), input, [{ date: WED, dayTypeId: 'legs' }]);
  check('determinismo: misma entrada, misma salida', same(a, b));
  const shuffled = [input[3], input[0], input[6], input[2], input[5], input[1], input[4]];
  check('el orden de las candidatas no cambia el plan', same(planSplit(c('ppl', 3), shuffled, [{ date: WED, dayTypeId: 'legs' }]), a));
}

// ——— Más reglas ———

{
  const p = planSplit(c('ppl', 3), [...booked(WED), ...free(MON, TUE, THU, FRI, SAT, SUN)]);
  checkEq('booked sin foco: el planificador le asigna el que sigue el orden (mié = Pull)', [dates(p), ids(p)], [
    [MON, WED, FRI],
    ['push', 'pull', 'legs'],
  ]);
}
{
  const p = planSplit(c('fullbody', 3), [...booked(TUE), ...free(MON, WED, THU, FRI, SAT, SUN)]);
  checkEq('descanso duro para sugeridas junto a una booked Full body: mar/jue/sáb', dates(p), [TUE, THU, SAT]);
}
{
  const p = planSplit(c('fullbody', 2), free(...WEEK));
  checkEq('Full body x2, semana libre: lun y vie (separación 3 con la semana repitiéndose, 4 dentro)', dates(p), [MON, FRI]);
}
{
  const p = planSplit(c('fullbody', 3), free(...WEEK));
  checkEq('Full body x3, semana libre: lun/mié/vie (no lun/jue/dom, que deja dom–lun pegados)', dates(p), [MON, WED, FRI]);
}
{
  const p = planSplit(c('upper-lower', 4), free(...WEEK));
  checkEq('Upper/Lower x4, semana libre: lun/mié/vie/dom en orden U, L, U, L', [dates(p), ids(p)], [
    [MON, WED, FRI, SUN],
    ['upper', 'lower', 'upper', 'lower'],
  ]);
}
{
  const p = planSplit(c('cinco-dias', 5), free(...WEEK));
  checkEq('cinco días, semana libre: lun–vie en orden canónico', [dates(p), ids(p)], [
    WEEK.slice(0, 5),
    ['pecho', 'espalda', 'piernas-gluteos', 'hombros-core', 'brazos'],
  ]);
  const t = planSplit(c('torso-piernas-brazos', 3), free(...WEEK));
  checkEq('torso/piernas/brazos, semana libre: lun/mié/vie en orden', [dates(t), ids(t)], [
    [MON, WED, FRI],
    ['pecho-espalda-core', 'piernas-gluteos', 'brazos-hombros'],
  ]);
}
{
  const p = planSplit(c('ppl', 3), free(MON, TUE));
  check('PPL x3 con 2 días: prioriza cubrir más grupos (Push + Legs = 6)', same(ids(p), ['push', 'legs']) && p.covered.length === 6 && p.shortBy === 1, ids(p));
}
{
  let ok = true;
  const bad: unknown[] = [];
  for (const s of SPLITS) {
    for (const n of s.variants) {
      const p = planSplit({ id: s.id, sessions: n }, free(...WEEK));
      if (p.sessions.length !== n || !p.complete || p.conflicts.length) {
        ok = false;
        bad.push([s.id, n, ids(p)]);
      }
    }
  }
  check('con la semana libre, toda variante pone exactamente lo pedido y queda completa', ok, bad);
}
{
  const p = planSplit(c('fullbody', 3), [...free(MON), { date: MON, booked: true }, ...free(WED)]);
  check('fechas repetidas en candidatas: una sola sesión, booked gana', same(dates(p), [MON, WED]) && p.sessions[0].booked, p.sessions);
}
{
  const p = planSplit(c('fullbody', 3), [...free('2026-02-30', 'mañana', '2026-1-5', '2026-13-01'), ...free(MON)]);
  checkEq('fechas mal formadas se ignoran', dates(p), [MON]);
}
{
  const month = planSplit(c('fullbody', 2), booked(SAT, SUN));
  const year = planSplit(c('fullbody', 2), booked('2026-12-31', '2027-01-01'));
  check('días seguidos cruzando mes y año se detectan', [month, year].every((p) => p.conflicts.length === 1), [month.conflicts, year.conflicts]);
  // Chile 2026: adelanta el dom 6-sep a las 00:00 y atrasa el dom 5-abr a las 00:00. En hora local, sáb 4 → dom 5 de
  // abril dura 25 h (dentro de una misma semana lun–dom) y dom 6 → lun 7 de septiembre, 23 h.
  const dst = [
    ['2026-09-05', '2026-09-06'],
    ['2026-09-06', '2026-09-07'],
    ['2026-04-04', '2026-04-05'],
    ['2026-04-05', '2026-04-06'],
  ].map(([a, b]) => planSplit(c('fullbody', 2), booked(a, b)));
  check(
    'días seguidos en los dos cambios de horario de Chile se detectan (los 4 pares)',
    dst.every((p) => p.conflicts.length === 1),
    dst.map((p) => p.conflicts),
  );
  const autumnWeek = planSplit(c('ppl', 3), [...booked('2026-04-04'), ...free('2026-04-03', '2026-04-05')]);
  check(
    'semana del cambio de horario de abril: vie/sáb/dom seguidos, sin choque, en orden Push, Pull, Legs',
    !autumnWeek.conflicts.length && minSeparation(autumnWeek) === 1 && same(ids(autumnWeek), ['push', 'pull', 'legs']),
    autumnWeek.sessions,
  );
  const gap = planSplit(c('fullbody', 2), booked('2026-09-05', '2026-09-07'));
  check('dos días de diferencia cruzando el cambio de horario no es choque', gap.conflicts.length === 0, gap.conflicts);
}
{
  const p = planSplit(c('fullbody', 3), free(...WEEK, '2026-11-02', '2026-11-03', '2026-11-04'));
  check('solo entra una semana: 7 días desde la primera fecha', dates(p).every((d) => d <= SUN) && same(dates(p), [MON, WED, FRI]), dates(p));
}
{
  const p = planSplit(c('nada' as SplitId, 3), free(...WEEK));
  check('split desconocido: plan vacío, sin caerse', p.sessions.length === 0 && p.requested === 3 && p.missing.length === 8);
  const q = planSplit({ id: 'ppl', sessions: 3.9 }, free(...WEEK));
  check('sessions no entero: requested se trunca (3.9 → 3)', q.requested === 3 && q.sessions.length === 3);
}
{
  const p = planSplit(c('upper-lower', 2), [...booked(MON, TUE, WED), ...free(FRI)]);
  check('Upper/Lower x2 con 3 booked seguidas: U, L, U sin choques', same(ids(p), ['upper', 'lower', 'upper']) && !p.conflicts.length, ids(p));
}
{
  const p = planSplit(c('fullbody', 3), booked(MON, TUE, WED));
  checkEq('choques inevitables entre booked: se reportan todos, en orden', p.conflicts.map((x) => [x.first, x.second]), [
    [MON, TUE],
    [TUE, WED],
  ]);
}

// ——— Propiedades sobre entradas al azar y contraste con una búsqueda bruta independiente ———

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Referencia: enumera todas las asignaciones posibles, sin podas, y puntúa según la especificación. */
function reference(choice: SplitChoice, candidates: Candidate[], fixed: FixedSession[]) {
  const split = SPLITS.find((s) => s.id === choice.id)!;
  const requested = Math.max(0, Math.floor(choice.sessions));
  const cycle = split.cycle;
  const L = cycle.length;
  const mask = (i: number) => cycle[i].groups.reduce((m, g) => m | (1 << MUSCLE_GROUPS.indexOf(g)), 0);
  type S = { date: string; day: number; booked: boolean; fixed: number };
  const map = new Map<string, S>();
  for (const f of fixed) {
    const t = cycle.findIndex((d) => d.id === f.dayTypeId);
    if (t >= 0 && !map.has(f.date)) map.set(f.date, { date: f.date, day: dayNum(f.date), booked: false, fixed: t });
  }
  for (const cd of candidates) {
    const s = map.get(cd.date);
    if (s) s.booked = s.booked || cd.booked;
    else map.set(cd.date, { date: cd.date, day: dayNum(cd.date), booked: cd.booked, fixed: -1 });
  }
  let slots = [...map.values()].sort((a, b) => a.day - b.day);
  if (slots.length) slots = slots.filter((s) => s.day - slots[0].day <= 6);
  const mandatory = slots.filter((s) => s.fixed >= 0 || s.booked).length;
  const total = Math.max(requested, mandatory);
  const occ = (t: number) => {
    let n = 0;
    for (let p = 0; p < total; p++) if (p % L === t) n++;
    return n;
  };
  const pool = cycle.map((_, t) => occ(t));
  for (const s of slots) if (s.fixed >= 0 && pool[s.fixed] > 0) pool[s.fixed]--;
  const maxSuggest = Math.max(0, requested - mandatory);

  const bruteInversions = (types: number[]) => {
    const counts = cycle.map((_, t) => types.filter((x) => x === t).length);
    const avail = cycle.map((_, t) => Array.from({ length: Math.max(counts[t], occ(t)) }, (_, k) => t + L * k));
    const pos: number[] = [];
    const used = new Set<number>();
    let best = Infinity;
    const rec = (i: number) => {
      if (i === types.length) {
        let inv = 0;
        for (let a = 0; a < pos.length; a++) for (let b = a + 1; b < pos.length; b++) if (pos[a] > pos[b]) inv++;
        best = Math.min(best, inv);
        return;
      }
      for (const p of avail[types[i]]) {
        if (used.has(p)) continue;
        used.add(p);
        pos[i] = p;
        rec(i + 1);
        used.delete(p);
      }
    };
    rec(0);
    return best;
  };

  const options = slots.map((s) => (s.fixed >= 0 ? [s.fixed] : s.booked ? cycle.map((_, t) => t) : [-1, ...cycle.map((_, t) => t)]));
  const cur: number[] = new Array(slots.length).fill(-1);
  let bestScore: number[] | null = null;
  let bestPlaced: number[] = [];
  const evaluate = () => {
    const used = cycle.map(() => 0);
    let suggested = 0;
    for (let i = 0; i < slots.length; i++) {
      if (cur[i] < 0 || slots[i].fixed >= 0) continue;
      used[cur[i]]++;
      if (!slots[i].booked) suggested++;
    }
    if (suggested > maxSuggest || used.some((u, t) => u > pool[t])) return;
    const placed = slots.map((_, i) => i).filter((i) => cur[i] >= 0);
    let violations = 0;
    for (let k = 1; k < placed.length; k++) {
      const a = placed[k - 1];
      const b = placed[k];
      if (slots[b].day - slots[a].day !== 1 || !(mask(cur[a]) & mask(cur[b]))) continue;
      const sug = (i: number) => slots[i].fixed < 0 && !slots[i].booked;
      if (sug(a) || sug(b)) return;
      violations++;
    }
    const coveredMask = placed.reduce((m, i) => m | mask(cur[i]), 0);
    let covered = 0;
    for (let g = 0; g < 8; g++) if (coveredMask & (1 << g)) covered++;
    const days = placed.map((i) => slots[i].day);
    let lin = 7;
    for (let k = 1; k < days.length; k++) lin = Math.min(lin, days[k] - days[k - 1]);
    const cyc = days.length ? Math.min(lin, days[0] + 7 - days[days.length - 1]) : 7;
    const types = placed.map((i) => cur[i]);
    const score = [violations, -covered, -placed.length, -cyc, -lin, bruteInversions(types), ...days, ...types];
    if (!bestScore || score.join() !== bestScore.join()) {
      let better = !bestScore;
      if (bestScore) {
        for (let k = 0; k < score.length; k++) {
          if (score[k] !== bestScore[k]) {
            better = score[k] < bestScore[k];
            break;
          }
        }
      }
      if (better) {
        bestScore = score;
        bestPlaced = placed.map((i) => i * 100 + cur[i]);
      }
    }
  };
  const rec = (i: number) => {
    if (i === slots.length) return evaluate();
    for (const o of options[i]) {
      cur[i] = o;
      rec(i + 1);
    }
  };
  rec(0);
  return bestPlaced.map((v) => {
    const s = slots[Math.floor(v / 100)];
    return { date: s.date, dayType: cycle[v % 100].id, booked: s.booked, fixed: s.fixed >= 0 };
  });
}

{
  const rnd = mulberry32(20261023);
  const pick = <T,>(xs: T[]) => xs[Math.floor(rnd() * xs.length)];
  const failures: Record<string, unknown> = {};
  const fail = (key: string, info: unknown) => {
    if (!(key in failures)) failures[key] = info;
  };
  const CASES = 400;
  let refCompared = 0;
  for (let n = 0; n < CASES; n++) {
    const split = pick(SPLITS);
    const sessions = rnd() < 0.8 ? pick(split.variants) : Math.floor(rnd() * 8);
    const maxDays = split.cycle.length >= 4 ? 6 : 7;
    const days = WEEK.filter(() => rnd() < 0.7).slice(0, maxDays);
    const candidates: Candidate[] = days.filter(() => rnd() < 0.85).map((date) => ({ date, booked: rnd() < 0.3 }));
    const fixed: FixedSession[] = days
      .filter(() => rnd() < 0.2)
      .map((date) => ({ date, dayTypeId: rnd() < 0.9 ? pick(split.cycle).id : 'otro-foco' }));
    const choice: SplitChoice = { id: split.id, sessions };
    const p = planSplit(choice, candidates, fixed);
    const ctx = { choice, candidates, fixed, got: p.sessions.map((s) => [s.date, s.dayType.id, s.booked, s.fixed]) };

    const ds = dates(p);
    if (!ds.every((d, i) => i === 0 || d > ds[i - 1])) fail('ordenadas por fecha, sin fechas repetidas', ctx);
    const bookedDates = [...new Set(candidates.filter((x) => x.booked).map((x) => x.date))];
    if (!bookedDates.every((d) => ds.includes(d))) fail('toda candidata booked entra', ctx);
    const validFixed = new Map<string, string>();
    for (const f of fixed) if (split.cycle.some((d) => d.id === f.dayTypeId) && !validFixed.has(f.date)) validFixed.set(f.date, f.dayTypeId);
    for (const [date, id] of validFixed) {
      const s = p.sessions.find((x) => x.date === date);
      if (!s || s.dayType.id !== id || !s.fixed) fail('toda fija válida entra con su foco', ctx);
    }
    const shared = adjacentShared(p);
    const isSuggested = (date: string) => {
      const s = p.sessions.find((x) => x.date === date)!;
      return !s.booked && !s.fixed;
    };
    if (shared.some((x) => isSuggested(x.first) || isSuggested(x.second))) fail('una sugerida nunca rompe el descanso', ctx);
    if (!same(shared, p.conflicts)) fail('conflicts = exactamente los pares seguidos que comparten grupos', { ...ctx, shared, conflicts: p.conflicts });
    const mandatory = new Set([...bookedDates, ...validFixed.keys()]).size;
    if (p.sessions.length > Math.max(sessions, mandatory)) fail('nunca más sesiones que las pedidas (salvo booked/fijas)', ctx);
    const cov = MUSCLE_GROUPS.filter((g) => p.sessions.some((s) => s.dayType.groups.includes(g)));
    if (!same(cov, p.covered) || !same(MUSCLE_GROUPS.filter((g) => !cov.includes(g)), p.missing)) fail('covered/missing en el orden de MUSCLE_GROUPS', ctx);
    if (p.shortBy !== Math.max(0, sessions - p.sessions.length) || p.complete !== (p.shortBy === 0 && !p.missing.length)) fail('shortBy y complete', ctx);
    if (!same(planSplit(choice, [...candidates].reverse(), fixed), p)) fail('no depende del orden de las candidatas', ctx);

    const expected = reference(choice, candidates, fixed);
    refCompared++;
    if (!same(p.sessions.map((s) => ({ date: s.date, dayType: s.dayType.id, booked: s.booked, fixed: s.fixed })), expected)) {
      fail('coincide con la búsqueda bruta de referencia', { ...ctx, expected: expected.map((s) => [s.date, s.dayType, s.booked, s.fixed]) });
    }
  }
  for (const key of [
    'ordenadas por fecha, sin fechas repetidas',
    'toda candidata booked entra',
    'toda fija válida entra con su foco',
    'una sugerida nunca rompe el descanso',
    'conflicts = exactamente los pares seguidos que comparten grupos',
    'nunca más sesiones que las pedidas (salvo booked/fijas)',
    'covered/missing en el orden de MUSCLE_GROUPS',
    'shortBy y complete',
    'no depende del orden de las candidatas',
    'coincide con la búsqueda bruta de referencia',
  ]) {
    check(`${CASES} semanas al azar: ${key}${key.startsWith('coincide') ? ` (${refCompared} comparadas)` : ''}`, !(key in failures), failures[key]);
  }
}

// ——— Rendimiento ———
{
  const t0 = performance.now();
  let calls = 0;
  let worst = 0;
  for (let r = 0; r < 5; r++) {
    for (const s of SPLITS) {
      for (const n of [...s.variants, 7]) {
        for (const input of [free(...WEEK), booked(...WEEK), [...booked(MON, THU), ...free(TUE, WED, FRI, SAT, SUN)]]) {
          const a = performance.now();
          planSplit({ id: s.id, sessions: n }, input);
          worst = Math.max(worst, performance.now() - a);
          calls++;
        }
      }
    }
  }
  const ms = performance.now() - t0;
  console.log(`     (${calls} planes en ${ms.toFixed(1)} ms; el más lento ${worst.toFixed(2)} ms; TZ=${process.env.TZ ?? 'sistema'})`);
  check('rendimiento: el plan más lento de la semana completa tarda < 25 ms', worst < 25, { worst });
}

console.log(`\n${passed}/${passed + failed} PASS`);
if (failed) process.exitCode = 1;
