import { createApp } from './app.js';
import { TelegramChannel } from './channels/telegram.js';
import { Engine } from './engine.js';
import { AiRunner, WorkersAiParser, aiOptionsFromEnv, restRunner } from './intent.js';
import { Store, storeFromEnv } from './store.js';

export type EnvVars = Record<string, string | undefined>;

/**
 * Arma motor + app. Agnóstico del host: en Workers recibe el store del Durable Object y el
 * runner del binding `AI`; en Node (local / plan B sin red) usa memoria o Upstash y REST.
 */
export function createEngine(opts: { env: EnvVars; store: Store; ai?: AiRunner | null }) {
  const { env } = opts;
  const { model, opts: aiOpts } = aiOptionsFromEnv(env);
  const engine = new Engine({
    store: opts.store,
    telegram: env.TELEGRAM_BOT_TOKEN ? new TelegramChannel(env.TELEGRAM_BOT_TOKEN) : null,
    parser: opts.ai ? new WorkersAiParser(opts.ai, model, aiOpts) : null,
    config: env.GYM_VENUE ? { venue: env.GYM_VENUE } : {},
  });
  const app = createApp(engine, {
    adminToken: env.ADMIN_TOKEN || undefined,
    telegramSecret: env.TELEGRAM_WEBHOOK_SECRET || undefined,
    corsOrigin: env.CORS_ORIGIN ? env.CORS_ORIGIN.split(',').map((s) => s.trim()) : '*',
  });
  return { engine, app };
}

/** Node: store en memoria/Upstash y Workers AI por REST (si hay credenciales). */
export function createEngineFromEnv(env: EnvVars = process.env) {
  const ai =
    env.CLOUDFLARE_ACCOUNT_ID && env.CLOUDFLARE_API_TOKEN
      ? restRunner(env.CLOUDFLARE_ACCOUNT_ID, env.CLOUDFLARE_API_TOKEN)
      : null;
  return createEngine({ env, store: storeFromEnv(env), ai });
}
