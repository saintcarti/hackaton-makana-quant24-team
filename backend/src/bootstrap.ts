import { createApp } from './app.js';
import { TelegramChannel } from './channels/telegram.js';
import { Engine } from './engine.js';
import { parserFromEnv } from './intent.js';
import { storeFromEnv } from './store.js';

/** Arma motor + app a partir de variables de entorno (ver .env.example). */
export function createEngineFromEnv(env: NodeJS.ProcessEnv = process.env) {
  const engine = new Engine({
    store: storeFromEnv(env),
    telegram: env.TELEGRAM_BOT_TOKEN ? new TelegramChannel(env.TELEGRAM_BOT_TOKEN) : null,
    parser: parserFromEnv(env),
    config: env.GYM_VENUE ? { venue: env.GYM_VENUE } : {},
  });
  const app = createApp(engine, {
    adminToken: env.ADMIN_TOKEN || undefined,
    telegramSecret: env.TELEGRAM_WEBHOOK_SECRET || undefined,
    corsOrigin: env.CORS_ORIGIN ? env.CORS_ORIGIN.split(',').map((s) => s.trim()) : '*',
  });
  return { engine, app };
}
