import { DB, emptyDB } from './types.js';

export interface Store {
  load(): Promise<DB>;
  save(db: DB): Promise<void>;
}

export class MemoryStore implements Store {
  private db: DB = emptyDB();
  async load() {
    return structuredClone(this.db);
  }
  async save(db: DB) {
    this.db = structuredClone(db);
  }
}

const DB_KEY = 'la-cita:db';

/**
 * Persistencia para Vercel (filesystem efímero): Upstash Redis vía REST (free tier).
 * Un solo documento JSON bajo una llave. Suficiente para el demo/piloto chico.
 */
export class UpstashStore implements Store {
  constructor(
    private url: string,
    private token: string,
  ) {}

  private async cmd(args: unknown[]): Promise<unknown> {
    const res = await fetch(this.url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${this.token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(args),
    });
    if (!res.ok) throw new Error(`Upstash ${res.status}`);
    const json = (await res.json()) as { result?: unknown; error?: string };
    if (json.error) throw new Error(`Upstash: ${json.error}`);
    return json.result;
  }

  async load() {
    const raw = await this.cmd(['GET', DB_KEY]);
    return typeof raw === 'string' ? (JSON.parse(raw) as DB) : emptyDB();
  }

  async save(db: DB) {
    await this.cmd(['SET', DB_KEY, JSON.stringify(db)]);
  }
}

export function storeFromEnv(env: Record<string, string | undefined> = process.env): Store {
  if (env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN) {
    return new UpstashStore(env.UPSTASH_REDIS_REST_URL, env.UPSTASH_REDIS_REST_TOKEN);
  }
  return new MemoryStore();
}
