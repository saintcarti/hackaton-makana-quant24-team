import { DurableObject } from 'cloudflare:workers';
import { createEngine } from './bootstrap.js';
import { bindingRunner } from './intent.js';
import { Store } from './store.js';
import { DB, emptyDB } from './types.js';

const DB_KEY = 'db';

/** Estado en el storage del Durable Object: consistente y sin carreras (una sola instancia). */
class DurableStore implements Store {
  constructor(private storage: DurableObjectStorage) {}
  async load() {
    return (await this.storage.get<DB>(DB_KEY)) ?? emptyDB();
  }
  async save(db: DB) {
    await this.storage.put(DB_KEY, db);
  }
}

/**
 * Una única instancia ("main") atiende toda la API: Hono + motor viven aquí, junto al estado.
 * El Worker de entrada solo reenvía.
 */
export class LaCitaState extends DurableObject<Env> {
  private built;

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    this.built = createEngine({
      env: env as unknown as Record<string, string | undefined>,
      store: new DurableStore(ctx.storage),
      ai: bindingRunner(env.AI),
    });
  }

  fetch(request: Request): Promise<Response> | Response {
    return this.built.app.fetch(request, this.env);
  }

  /** Cron (cada 5 min): captura dominical, cita por defecto, recordatorio. No corre con el reloj de demo simulado. */
  async tickIfReal() {
    return this.built.engine.run((c) => (c.db.clockOffsetMs !== 0 ? [] : this.built.engine.tick(c)));
  }
}

function stub(env: Env) {
  return env.STATE.get(env.STATE.idFromName('main'));
}

export default {
  fetch(request: Request, env: Env): Promise<Response> {
    return stub(env).fetch(request);
  },

  async scheduled(_controller: ScheduledController, env: Env, ctx: ExecutionContext) {
    ctx.waitUntil(stub(env).tickIfReal());
  },
} satisfies ExportedHandler<Env>;
