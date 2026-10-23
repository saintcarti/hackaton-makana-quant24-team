import { serve } from '@hono/node-server';
import { createEngineFromEnv } from './bootstrap.js';

const { app } = createEngineFromEnv();
const port = Number(process.env.PORT ?? 8787);
serve({ fetch: app.fetch, port }, () => {
  console.log(`La Cita backend escuchando en http://localhost:${port}/api/health`);
});
