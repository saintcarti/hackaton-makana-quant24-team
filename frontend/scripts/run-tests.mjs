// Corre las pruebas de los planificadores (lib/splits.ts y lib/autoplan.ts) sin instalar nada: empaqueta cada
// archivo con el esbuild que ya trae Vite y lo ejecuta con node. Uso: `pnpm test:planes` (o `node scripts/run-tests.mjs`).
// Son las mismas reglas que el backend copia tal cual (backend/src/splits.ts y, cuando se porte, autoplan.ts).
import { execFileSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const pnpmDir = join(here, '..', 'node_modules', '.pnpm');
const esbuildDir = readdirSync(pnpmDir).find((d) => d.startsWith('esbuild@'));
if (!esbuildDir) throw new Error('No encontré esbuild en node_modules/.pnpm: corre pnpm install en frontend/.');
const esbuild = createRequire(import.meta.url)(join(pnpmDir, esbuildDir, 'node_modules', 'esbuild'));

let failed = false;
for (const name of ['splits-test', 'autoplan-test', 'weektarget-test']) {
  const out = join(here, '.out', `${name}.mjs`);
  esbuild.buildSync({ entryPoints: [join(here, `${name}.ts`)], bundle: true, platform: 'node', format: 'esm', outfile: out, logLevel: 'error' });
  console.log(`\n— ${name} —`);
  try {
    execFileSync(process.execPath, [out], { stdio: 'inherit' });
  } catch {
    failed = true;
  }
}
process.exitCode = failed ? 1 : 0;
