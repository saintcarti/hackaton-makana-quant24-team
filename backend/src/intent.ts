export type Intent = 'move' | 'done' | 'skip_week' | 'pain' | 'start' | 'propose' | 'other_hour' | 'unknown';

const PAIN = /\b(duele|dolor|dolores|lesi[oó]n|lesionad[oa]|molestia|tir[oó]n|contractura|rodilla|espalda|lumbar|cervical)\b/;
const MOVE =
  /\b(mueve|mover|mu[eé]vela|muevela|cambia(la|r)?|reagenda|re-agenda|hoy no (puedo|alcanzo|voy)|no puedo|no alcanzo|se alarg[oó]|se alargaron?|junta|reuni[oó]n|me quedo trabajando|otro d[ií]a|m[aá]s tarde)\b/;
const DONE = /\b(listo|list[ao]|ya fui|fui|hecho|termin[eé]|entren[eé]|cumpl[ií])\b/;
const SKIP = /\b(esta semana no|semana no|no esta semana|me tomo la semana|descanso esta semana)\b/;
const START = /^\s*(\/start\b|hola\b|buenas\b|empezar|comenzar)/;
const PROPOSE = /\b(proponme|prop[oó]n|horarios|agenda(me)?)\b/;

/**
 * Clasificador por reglas (siempre disponible, sin red). El dolor tiene prioridad
 * absoluta sobre cualquier otra intención (guardrail R4).
 */
export function classifyByRules(text: string): Intent {
  const t = text.toLowerCase().trim();
  if (!t) return 'unknown';
  if (PAIN.test(t)) return 'pain';
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

/** Soporta ambas formas de respuesta de Workers AI: `result.response` y estilo OpenAI `result.choices`. */
function extractText(json: any): string | undefined {
  const r = json?.result;
  return r?.response ?? r?.choices?.[0]?.message?.content ?? undefined;
}

/**
 * Cloudflare Workers AI (REST) solo para CLASIFICAR lenguaje natural cuando las reglas
 * no entienden. Nunca redacta mensajes: el tono lo garantizan las plantillas.
 * Funciona desde cualquier host (Vercel, local) con account id + API token con permiso Workers AI.
 */
export class CloudflareAiParser implements LlmParser {
  constructor(
    private accountId: string,
    private apiToken: string,
    private model = '@cf/zai-org/glm-5.3-flash',
    private timeoutMs = 4000,
    private maxTokens = 48,
  ) {}

  async classify(text: string): Promise<Intent | null> {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), this.timeoutMs);
    try {
      const res = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/ai/run/${this.model}`,
        {
          method: 'POST',
          signal: ctrl.signal,
          headers: { Authorization: `Bearer ${this.apiToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            max_tokens: this.maxTokens,
            temperature: 0,
            messages: [
              { role: 'system', content: CLASSIFY_PROMPT },
              { role: 'user', content: text.slice(0, 300) },
            ],
          }),
        },
      );
      if (!res.ok) return null;
      const json = (await res.json()) as { success?: boolean };
      return json.success === false ? null : toIntent(extractText(json));
    } catch {
      return null;
    } finally {
      clearTimeout(timer);
    }
  }
}

export function parserFromEnv(env: NodeJS.ProcessEnv = process.env): LlmParser | null {
  if (!env.CLOUDFLARE_ACCOUNT_ID || !env.CLOUDFLARE_API_TOKEN) return null;
  return new CloudflareAiParser(
    env.CLOUDFLARE_ACCOUNT_ID,
    env.CLOUDFLARE_API_TOKEN,
    env.CF_AI_MODEL || undefined,
    undefined,
    env.CF_AI_MAX_TOKENS ? Number(env.CF_AI_MAX_TOKENS) : undefined,
  );
}
