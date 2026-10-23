import { handle } from 'hono/vercel';
import { createEngineFromEnv } from '../src/bootstrap.js';

/** Entrada para Vercel (Node runtime). Todas las rutas /api/* las resuelve Hono. */
const { app } = createEngineFromEnv();
export default handle(app);
