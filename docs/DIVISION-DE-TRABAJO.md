# División de trabajo

Hackatón Señales · Caso 1 (Camila) · producto «La Cita». Evento: viernes 23 y sábado 24 de octubre de 2026. Entrega el sábado a las 15:00, pitch a las 16:00.

## Roles

| Persona | Responsabilidad | Carpeta que edita |
|---|---|---|
| **Backend** (dueño del repo: @saintcarti) | Todo el backend: API, máquina de estados de la cita, tono, .ics, recordatorios, Telegram, métricas, persistencia, deploy de la API | `backend/` |
| **Benjamin Caldera** | Frontend principal: simulador de chat (plan B sin red), vista admin con el historial de Camila sintética, grilla semanal, pantallas del demo; trabaja con sus agentes de IA | `frontend/` |

## Regla de oro

Nadie edita la carpeta del otro. El único punto de contacto es el contrato HTTP descrito en [`INTEGRACION-FRONTEND.md`](./INTEGRACION-FRONTEND.md) y en [`api-types.ts`](./api-types.ts). Si el frontend necesita algo que la API no da, se pide al backend con un issue o un mensaje: se agrega al contrato y a `api-types.ts`, no se simula con datos inventados en el front.

Dos mitades que no se pisan evitan conflictos de merge en un evento de 24 horas. Cada quien trabaja en su rama (`backend/*` y `frontend/*`) y mergea a `main` con fast-forward cuando su módulo pasa su propio chequeo.

## Qué entrega el backend (ya implementado)

Cubre los MUST del MVP definidos en la fase de investigación.

| MUST | Qué hace el backend |
|---|---|
| M1 captura dominical | Mensaje con 2 horarios dentro de la ventana 19:00–21:00 más «Otra hora» y «Esta semana no». Si hay silencio, agenda por defecto (opt-out) |
| M2 cita en el calendario | Archivo `.ics` por cada cita agendada o movida, descargable por HTTP y enviado por Telegram |
| M3 recordatorio único | Un solo mensaje antes de la cita. En el demo se dispara a mano o con el reloj simulable; en producción lo dispara un scheduler externo que llama a `/api/jobs/tick` |
| M4 MUEVE sin culpa | La cita se mueve, nunca se borra. Tras 2 MUEVEs seguidos sin visita abre una re-negociación de ventana en vez de repetir el slot |
| M5 tono cero-culpa | Todos los textos salen de plantillas fijas verificadas por test contra una lista de palabras vetadas. Ningún texto lo redacta un LLM |
| M6 sunk cost | Tras «listo»: «Tu mensualidad ya estaba pagada: hoy recuperaste $11.633 de los $34.900» |
| M7 derivación | Si el mensaje menciona dolor, deriva a kinesiólogo o médico deportólogo y no prescribe ejercicio |
| M8 modo demo | Camila sintética con 6 semanas (11 visitas, 4 movidas, 0 cadenas rotas), reloj simulable, reset |

Canales: **Telegram** (principal del demo), **simulador** (el chat del frontend, vía HTTP). WhatsApp queda como adaptador futuro; no se afirma que el demo corre en WhatsApp.

## Qué entrega el frontend (Benjamin)

Orden de prioridad según el plan de build:

1. **Simulador de chat** estilo mensajería: pinta `messages`, botones, adjunto `.ics`. Es el plan B sin red y también sirve como demo principal si Telegram falla.
2. **Vista admin de Camila sintética**: historial de citas, resumen y el panel con los botones de demo (reloj, recordatorio, MUEVE).
3. **Grilla semanal** (prioridad baja, es lo primero que se corta): consume `/calendar`.
4. Pulido visual.

## Hitos y checkpoints

Alineados con `build-plan-2dias.md` de la fase de investigación.

| Hora | Backend | Frontend |
|---|---|---|
| Vie 12:00 | API en marcha con el reloj simulable y Camila sintética; Telegram con `setWebhook` | Chat conectado a `POST /messages` con botones funcionando |
| Vie 18:00 | MUEVE y `.ics` verificados de punta a punta, deploy en Vercel | Vista admin leyendo `/summary` y `/appointments` |
| Vie 21:00 | Ensayo #1 | Ensayo #1 |
| Sáb 10:30 | Plan B sin red listo | Plan B sin red listo (obligatorio, regla R6) |
| Sáb 13:30 | **Corte**: se congela todo | **Corte**: se congela todo |
| Sáb 15:00 | Entrega: repo limpio, tag `v1-demo` | Entrega |

## Reglas que ambos respetan (vienen de las bases)

- **R1**: todo el código se escribe durante el evento, en este repo. Nada se copia del repo de investigación.
- **R2**: cero datos personales. Todo el demo usa personas sintéticas. El backend no guarda nombre ni datos de Telegram.
- **R4**: si aparece dolor, el producto deriva y no prescribe.
- **R6**: el demo debe correr sin depender de la red del venue (plan B local).
- Sin rachas, sin medallas, sin puntos, sin comparación social, sin cifras de cuerpo, sin precio ni descuentos, sin contenido de rutinas. Esas exclusiones son parte del argumento del producto.
- Costos del evento: ≤ US$5, free tiers.
