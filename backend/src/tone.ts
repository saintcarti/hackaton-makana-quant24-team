import { clp } from './time.js';

/**
 * Tono cero-culpa (M5). TODO texto que el sistema envía sale de aquí: plantillas fijas,
 * nunca texto generado por un LLM. Así el tono es verificable por test y no depende de un prompt.
 * Palabras vetadas por el caso y por mvp-definition: racha, deberías, disciplina, culpa, etc.
 */
export const BANNED_WORDS = [
  'racha',
  'deberías',
  'deberias',
  'debes',
  'disciplina',
  'culpa',
  'fallaste',
  'fallo',
  'falta',
  'te quedaste atrás',
  'no te rindas',
  'challenge',
  'transformación',
  'meta corporal',
  'bajar de peso',
  'calorías',
  'perdiste',
  'otra vez',
  'de nuevo no',
];

export function toneViolations(text: string): string[] {
  const t = text.toLowerCase();
  return BANNED_WORDS.filter((w) => t.includes(w));
}

export const T = {
  capture: (name: string) =>
    `Hola, ${name}. Antes de que parta la semana: ¿cuándo te queda mejor tu cita contigo? Son 40 minutos y 3 máquinas que ya conoces.`,
  slotChosen: (label: string, venue: string) => `Listo: ${label}, ${venue}. Te dejo la cita para tu calendario.`,
  askOtherHour: () => 'Dime día y hora, por ejemplo "martes 20:30", y la dejo agendada.',
  otherHourUnclear: () => 'No alcancé a entender la hora. Puedes escribir algo como "miércoles 20:00".',
  weekSkipped: () => 'Sin problema, esta semana descansamos. El domingo te escribo de nuevo.',
  defaultApplied: (label: string, venue: string) =>
    `Dejé agendada tu cita del ${label} en ${venue}, tu horario más habitual. Si no te acomoda, escribe "mueve" y la cambiamos.`,
  reminder: (time: string) =>
    `A las ${time} tienes la cita contigo: 40 minutos, 3 máquinas. Si la reunión se alargó, escribe "mueve".`,
  moved: (label: string) => `Hecho, la moví al ${label}. Mover no es fallar.`,
  renegotiate: (a: string, b: string) =>
    `Ese horario no te está resultando, y está bien. ¿Probamos con el ${a} o el ${b}?`,
  noSlotForMove: () => 'No encontré un horario cercano que calce. Dime tú un día y una hora y la agendo.',
  done: (recovered: number, fee: number) =>
    `Listo. Tu mensualidad ya estaba pagada: hoy recuperaste ${clp(recovered)} de los ${clp(fee)}.`,
  pain: () =>
    'Eso conviene revisarlo con un kinesiólogo o un médico deportólogo antes de entrenar. Yo no te voy a indicar ejercicios para el dolor. Cuando lo converses con un profesional y quieras retomar, aquí está tu cita.',
  noAppointment: () => 'Todavía no tienes una cita agendada esta semana. ¿Te propongo horarios?',
  fallback: () => 'Te ayudo con una sola cosa: tu cita. Puedes decirme "mueve", "listo" o una hora, por ejemplo "miércoles 20:00".',
  start: () => 'Hola. Soy La Cita: te ayudo a dejar agendada tu hora de entrenar y a moverla cuando la pega se alarga.',
  proposeOffer: () => 'Te propongo horarios para esta semana.',
  btn: {
    otherHour: 'Otra hora',
    skipWeek: 'Esta semana no',
    move: 'Mover cita',
    done: 'Listo ✓',
    propose: 'Proponme horarios',
  },
} as const;
