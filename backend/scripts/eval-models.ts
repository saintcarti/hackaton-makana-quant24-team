/**
 * Compara modelos de Workers AI en la única tarea que les damos: clasificar un mensaje.
 * Uso:  pnpm eval:models                       (modelos por defecto)
 *       pnpm eval:models @cf/zai-org/glm-5.3-flash @cf/deepseek-ai/deepseek-v4.1-flash-1017m
 * Requiere CLOUDFLARE_ACCOUNT_ID y CLOUDFLARE_API_TOKEN en backend/.env.
 * Mide: aciertos, latencia (media y p95), y cuántas veces el modelo "razonó en voz alta" en la salida.
 */
import { CloudflareAiParser, Intent } from '../src/intent.js';

const MODELS = [
  '@cf/zai-org/glm-5.3-flash',
  '@cf/deepseek-ai/deepseek-v4.1-flash-1017m',
  '@cf/zai-org/glm-5.3',
  '@cf/deepseek-ai/deepseek-v4-pro-0813',
];

// Mensajes que las reglas locales NO entienden (por eso llegarían al modelo).
const CASES: Array<[string, Intent]> = [
  ['no llego, la junta no termina nunca', 'move'],
  ['me cacharon a última hora con un cliente', 'move'],
  ['ando muerta, mejor otro día', 'move'],
  ['ya, terminé hace un rato', 'done'],
  ['cumplí con la cita de hoy', 'done'],
  ['esta semana la salto, tengo cierre de obra', 'skip_week'],
  ['no quiero agendar nada por ahora', 'skip_week'],
  ['me tiene mal el lumbago desde ayer', 'pain'],
  ['siento una puntada fuerte en el hombro', 'pain'],
  ['dame opciones de hora para esta semana', 'propose'],
  ['qué horarios hay', 'propose'],
  ['jajaja qué buen clima hoy', 'unknown'],
  ['gracias!', 'unknown'],
  ['cuánto cuesta el plan premium', 'unknown'],
];

const { CLOUDFLARE_ACCOUNT_ID: acc, CLOUDFLARE_API_TOKEN: tok } = process.env;
if (!acc || !tok) {
  console.error('Faltan CLOUDFLARE_ACCOUNT_ID y CLOUDFLARE_API_TOKEN en backend/.env');
  process.exit(1);
}

const models = process.argv.slice(2).length ? process.argv.slice(2) : MODELS;
const maxTokens = Number(process.env.CF_AI_MAX_TOKENS ?? 48);

for (const model of models) {
  const parser = new CloudflareAiParser(acc, tok, model, 15000, maxTokens);
  let ok = 0;
  let nulls = 0;
  const times: number[] = [];
  const misses: string[] = [];
  for (const [text, expected] of CASES) {
    const t0 = Date.now();
    const got = await parser.classify(text);
    times.push(Date.now() - t0);
    if (got === null) nulls += 1;
    if (got === expected) ok += 1;
    else misses.push(`  "${text}" -> ${got ?? 'null'} (esperado ${expected})`);
  }
  times.sort((a, b) => a - b);
  const mean = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
  const p95 = times[Math.min(times.length - 1, Math.floor(times.length * 0.95))];
  console.log(`\n${model}\n  aciertos ${ok}/${CASES.length} · sin respuesta usable ${nulls} · latencia media ${mean} ms · p95 ${p95} ms`);
  for (const m of misses) console.log(m);
}
