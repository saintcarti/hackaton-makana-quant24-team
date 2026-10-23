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
  capture: (name: string, minutes = 40) =>
    `Hola, ${name}. Antes de que parta la semana: ¿cuándo te queda mejor tu cita contigo? Son ${minutes} minutos como máximo, y armo tu rutina según el tiempo que tengas libre ese día.`,
  slotChosen: (label: string, venue: string) => `Listo: ${label}, ${venue}. Te dejo la cita para tu calendario.`,
  askOtherHour: () => 'Dime día y hora, por ejemplo "martes 20:30", y la dejo agendada.',
  otherHourUnclear: () => 'No alcancé a entender la hora. Puedes escribir algo como "miércoles 20:00".',
  weekSkipped: () => 'Sin problema, esta semana descansamos. El domingo te escribo de nuevo.',
  defaultApplied: (label: string, venue: string) =>
    `Dejé agendada tu cita del ${label} en ${venue}, tu horario más habitual. Si no te acomoda, escribe "mueve" y la cambiamos.`,
  reminder: (time: string, minutes = 40, focus?: string) =>
    focus
      ? `A las ${time} tienes la cita contigo: ${minutes} minutos. Hoy toca ${focus}. Si la reunión se alargó, escribe "mueve".`
      : `A las ${time} tienes la cita contigo: ${minutes} minutos, 3 máquinas. Si la reunión se alargó, escribe "mueve".`,
  routine: (r: { minutes: number; warmupMin: number; items: Array<{ name: string; sets: number; reps: string }> }, focus?: string) =>
    [
      `Tu sesión de ${r.minutes} min${focus ? ` (${focus})` : ''}, armada con el tiempo que tienes ese día:`,
      `• Calentamiento: ${r.warmupMin} min de movilidad y cardio suave`,
      ...r.items.map((i) => `• ${i.name}: ${i.sets} × ${i.reps}`),
      'Descansa cerca de 1 min entre series y elige un peso con el que mantengas buena técnica. Si algo te molesta, para y consúltalo con un kinesiólogo o un médico deportólogo.',
    ].join('\n'),
  noRoutine: () => 'Todavía no tengo una rutina para ti. Agenda tu cita y la armo según el tiempo que tengas ese día.',
  resumed: () => 'Gracias por contarme. Retomamos: desde ahora vuelvo a organizar tus sesiones por grupos.',
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
  start: () => 'Hola. Soy gogym: te ayudo a dejar agendada tu hora de entrenar y a moverla cuando la pega se alarga.',
  connect: () => 'Conecta tu Google Calendar y dejo la cita directo en tu calendario, la muevo cuando me avises y busco horarios que no choquen con tus reuniones.',
  calendarConnected: () => 'Listo, quedó conectado tu Google Calendar. Desde ahora agendo y muevo tus citas ahí, y propongo horas que no choquen con tus reuniones.',
  alreadyConnected: () => 'Tu Google Calendar ya está conectado.',
  calendarUnavailable: () => 'Por ahora no puedo conectar tu calendario. Igual te dejo cada cita con el botón para agregarla.',
  proposeOffer: () => 'Te propongo horarios para esta semana.',
  btn: {
    otherHour: 'Otra hora',
    skipWeek: 'Esta semana no',
    move: 'Mover cita',
    done: 'Listo ✓',
    propose: 'Proponme horarios',
  },
} as const;
