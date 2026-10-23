# La Cita

Hackatón Señales · Caso 1 (Camila, 34, Ñuñoa) · 23–24 de octubre de 2026.

Camila paga el gimnasio todos los meses y fue seis veces. No le falta motivación ni contenido: le falta que alguien defienda su hora. **La Cita** convierte el «mañana parto» del domingo en una cita en su calendario, la recuerda una sola vez y, si la pega se alarga, la mueve sin culpa. Mover no es fallar.

## Estructura

| Carpeta | Contenido | Dueño |
|---|---|---|
| `backend/` | API (Hono + TypeScript), máquina de estados de la cita, tono, `.ics`, Telegram, métricas | Backend |
| `frontend/` | Simulador de chat, vista admin, grilla semanal | Benjamin Caldera |
| `docs/` | División de trabajo, guía de integración, tipos del contrato | Compartido |

Empieza por [`docs/DIVISION-DE-TRABAJO.md`](docs/DIVISION-DE-TRABAJO.md) y [`docs/INTEGRACION-FRONTEND.md`](docs/INTEGRACION-FRONTEND.md). Los agentes de IA leen [`AGENTS.md`](AGENTS.md).

## Correr el backend

```bash
cd backend
pnpm install
pnpm dev            # http://localhost:8787/api/health
pnpm exec vitest run
```

Sin variables de entorno funciona en memoria. Para Telegram, persistencia y clasificación con Cloudflare Workers AI, ver `backend/.env.example`.

## Reglas del evento

R1 todo el trabajo se hace en el evento · R2 solo datos sintéticos · R4 ante dolor se deriva a un profesional · R6 el demo corre sin red.
