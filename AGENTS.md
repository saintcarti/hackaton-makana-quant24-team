# Instrucciones para agentes de IA

Proyecto: **La Cita**, Hackatón Señales (Caso 1, Camila). Antes de tocar nada, lee [`docs/DIVISION-DE-TRABAJO.md`](docs/DIVISION-DE-TRABAJO.md).

## Si eres un agente del frontend (Benjamin)

- Trabajas **solo en `frontend/`**. No edites `backend/` ni `docs/`.
- Toda la integración está en [`docs/INTEGRACION-FRONTEND.md`](docs/INTEGRACION-FRONTEND.md); los tipos en [`docs/api-types.ts`](docs/api-types.ts) (cópialos a `frontend/`).
- Arranca el backend con `cd backend && pnpm install && pnpm dev` (puerto 8787). Usa **pnpm**, nunca npm.
- No reimplementes lógica del producto en el front: los textos, botones, horarios y el tono vienen del backend.
- Reglas de presentación (no negociables): sin rachas, puntos ni medallas; nunca «falta» ni «fallaste»; usa `AppointmentView.label`; sin rojo para citas pasadas o movidas; sin contenido de rutinas, sin cifras del cuerpo, sin precios ni descuentos.
- Si falta un campo o endpoint, no lo inventes con datos falsos: pídeselo al backend describiendo el caso de uso.

## Si eres un agente del backend

- Trabajas **solo en `backend/`** (y actualizas `docs/` cuando cambie el contrato).
- Antes de commitear: `cd backend && pnpm exec tsc --noEmit && pnpm exec vitest run`.
- Todo texto saliente sale de plantillas en `backend/src/tone.ts`; nunca generes texto de cara a la usuaria con un LLM. Hay un test que verifica el tono contra la lista de palabras vetadas.
- Cualquier cambio en una ruta o en un tipo de respuesta actualiza `docs/INTEGRACION-FRONTEND.md` y `docs/api-types.ts` en el mismo commit.

## Reglas del evento (aplican a todos)

- R1: todo el código se escribe en el evento, en este repo.
- R2: solo datos sintéticos; nada de datos personales reales.
- R4: ante dolor, derivar a profesional; no prescribir ejercicio.
- R6: el demo debe poder correr sin red (backend local + front apuntando a localhost).
