export type Intent = 'resume' | 'move' | 'done' | 'skip_week' | 'pain' | 'start' | 'propose' | 'connect' | 'other_hour' | 'unknown';

const PAIN = /\b(duele|dolor|dolores|lesi[oó]n|lesionad[oa]|molestia|tir[oó]n|contractura|rodilla|espalda|lumbar|cervical)\b/;
const RESUME = /\b(ya|lo)\b.*\b(convers|habl|consult|vi|fui|revis)\w*\b.*\b(kinesi\w*|m[eé]dic\w*|deport[oó]log\w*|profesional)\b/;
const MOVE =
  /\b(mueve|mover|mu[eé]vela|muevela|cambia(la|r)?|reagenda|re-agenda|hoy no (puedo|alcanzo|voy)|no puedo|no alcanzo|se alarg[oó]|se alargaron?|junta|reuni[oó]n|me quedo trabajando|otro d[ií]a|m[aá]s tarde)\b/;
const DONE = /\b(listo|list[ao]|ya fui|fui|hecho|termin[eé]|entren[eé]|cumpl[ií])\b/;
const SKIP = /\b(esta semana no|semana no|no esta semana|me tomo la semana|descanso esta semana)\b/;
const START = /^\s*(\/start\b|hola\b|buenas\b|empezar|comenzar)/;
const CONNECT = /(conect|vincul|enlaz|sincroniz)\w*.*calendar|calendar\w*.*(conect|vincul|enlaz|sincroniz)|^\s*\/?(conectar|calendario)\s*$/;
const PROPOSE = /\b(proponme|prop[oó]n|horarios|agenda(me)?)\b/;

/**
 * Clasificador por reglas (siempre disponible, sin red). El dolor tiene prioridad
 * absoluta sobre cualquier otra intención (guardrail R4).
 */
export function classifyByRules(text: string): Intent {
  const t = text.toLowerCase().trim();
  if (!t) return 'unknown';
  if (PAIN.test(t)) return 'pain';
  if (RESUME.test(t)) return 'resume';
  if (CONNECT.test(t)) return 'connect';
  if (SKIP.test(t)) return 'skip_week';
  if (START.test(t)) return 'start';
  if (DONE.test(t) && !MOVE.test(t)) return 'done';
  if (MOVE.test(t)) return 'move';
  if (PROPOSE.test(t)) return 'propose';
  return 'unknown';
}

export interface LlmParser {
  /** Devuelve intención o null si no puede/no hay llave. NO genera texto para la usuaria. */
  classify(text: string): Promise<Intent | null>;
}

const CLASSIFY_PROMPT =
  'Clasificas el mensaje de una usuaria que agenda su cita de gimnasio. Responde SOLO una palabra de esta lista: move (quiere cambiar o no puede ir hoy), done (ya entrenó), skip_week (no quiere esta semana), pain (menciona dolor o lesión), propose (quiere que le propongan horarios), unknown.';

const VALID_INTENTS: Intent[] = ['move', 'done', 'skip_week', 'pain', 'propose', 'unknown'];

/**
 * Extrae la intención aunque el modelo "piense en voz alta": descarta bloques <think>,
 * y toma la ÚLTIMA palabra válida del texto (la conclusión, no el razonamiento).
 */
export function toIntent(raw: string | undefined | null): Intent | null {
  if (!raw) return null;
  const clean = raw.replace(/<think>[\s\S]*?<\/think>/gi, ' ').replace(/<think>[\s\S]*$/i, ' ').toLowerCase();
  const found = clean.match(/\b(?:skip_week|move|done|pain|propose|unknown)\b/g);
  return found ? (found[found.length - 1] as Intent) : null;
}

/** Soporta ambas formas de respuesta de Workers AI: `response` y estilo OpenAI `choices`. Nunca usa `reasoning_content`. */
function extractText(result: any): string | undefined {
  return result?.response ?? result?.choices?.[0]?.message?.content ?? undefined;
}

/** Ejecuta un modelo de Workers AI y devuelve el `result` ya desenvuelto. */
export type AiRunner = (model: string, body: Record<string, unknown>) => Promise<unknown>;

/** Runner REST: sirve en local/Node con account id + API token (permiso Workers AI). */
export function restRunner(accountId: string, apiToken: string, timeoutMs = 4000): AiRunner {
  return async (model, body) => {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${model}`, {
        method: 'POST',
        signal: ctrl.signal,
        headers: { Authorization: `Bearer ${apiToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`Workers AI ${res.status}`);
      const json = (await res.json()) as { success?: boolean; result?: unknown };
      if (json.success === false) throw new Error('Workers AI success=false');
      return json.result;
    } finally {
      clearTimeout(timer);
    }
  };
}

/** Runner por binding (dentro de un Worker): `env.AI.run(model, body)`, sin tokens ni red extra. */
export function bindingRunner(ai: { run(model: string, body: any): Promise<unknown> }): AiRunner {
  return (model, body) => ai.run(model, body);
}

export const DEFAULT_AI_MODEL = '@cf/deepseek-ai/deepseek-v4.1-flash-1017';
/** Modelos con razonamiento: sin esto gastan los tokens pensando y `content` llega vacío. */
export const NO_THINKING = { chat_template_kwargs: { thinking: false } };

export interface WorkersAiOptions {
  maxTokens?: number;
  extraBody?: Record<string, unknown>;
}

/**
 * Workers AI solo para CLASIFICAR lenguaje natural cuando las reglas no entienden.
 * Nunca redacta mensajes: el tono lo garantizan las plantillas. Si falla, devuelve null
 * y el motor sigue con las reglas locales.
 */
export class WorkersAiParser implements LlmParser {
  constructor(
    private run: AiRunner,
    private model = DEFAULT_AI_MODEL,
    private opts: WorkersAiOptions = {},
  ) {}

  async classify(text: string): Promise<Intent | null> {
    try {
      const result = await this.run(this.model, {
        max_tokens: this.opts.maxTokens ?? 16,
        temperature: 0,
        ...(this.opts.extraBody ?? NO_THINKING),
        messages: [
          { role: 'system', content: CLASSIFY_PROMPT },
          { role: 'user', content: text.slice(0, 300) },
        ],
      });
      const intent = toIntent(extractText(result));
      if (!intent) console.warn(JSON.stringify({ evt: 'ai_unusable', model: this.model }));
      return intent;
    } catch (err) {
      console.warn(JSON.stringify({ evt: 'ai_error', model: this.model, message: (err as Error).message }));
      return null;
    }
  }
}

/** Opciones desde el entorno: CF_AI_MODEL, CF_AI_MAX_TOKENS, CF_AI_EXTRA_JSON (JSON; "{}" para no enviar nada extra). */
export function aiOptionsFromEnv(env: Record<string, string | undefined>) {
  let extraBody: Record<string, unknown> | undefined;
  if (env.CF_AI_EXTRA_JSON) {
    try {
      extraBody = JSON.parse(env.CF_AI_EXTRA_JSON);
    } catch {
      extraBody = undefined;
    }
  }
  return {
    model: env.CF_AI_MODEL || DEFAULT_AI_MODEL,
    opts: { maxTokens: env.CF_AI_MAX_TOKENS ? Number(env.CF_AI_MAX_TOKENS) : undefined, extraBody } as WorkersAiOptions,
  };
}

/** Node/local: usa REST con token. En Workers se usa `bindingRunner` (ver worker.ts). */
export function parserFromEnv(env: Record<string, string | undefined> = process.env): LlmParser | null {
  if (!env.CLOUDFLARE_ACCOUNT_ID || !env.CLOUDFLARE_API_TOKEN) return null;
  const { model, opts } = aiOptionsFromEnv(env);
  return new WorkersAiParser(restRunner(env.CLOUDFLARE_ACCOUNT_ID, env.CLOUDFLARE_API_TOKEN), model, opts);
}
