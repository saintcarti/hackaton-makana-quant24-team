# Capital y Stack — construir y demostrar «La Cita» por ≈US$0

*Validación startup de «La Cita» (C1.a) · Hackatón Señales · Makana SpA · evento 23–24 oct 2026 · 12-oct-2026. Protocolo de honestidad activo.*

**Objetivo del documento:** probar D3 (constrible en 2 días con free tiers) y D6 (capital ≈ 0) con números, y de-riskar el build del evento con un plan de contingencias.

---

## 1. Tabla de capital

### 1.1 Capital fijo (US$0 como diseño, con excepción declarada)

| Ítem | Costo | Estado/verificación |
|---|---|---|
| Hosting backend + webhooks + vista admin | **US$0** | Vercel Hobby (free tier): https://vercel.com — usado por el propio Hermes stack del equipo; sin tarjeta para deploy de serverless functions |
| Número WhatsApp Business Cloud API (modo test) | **US$0** | Número de prueba Meta: gratis, hasta **5 destinatarios allowlisted** — [Data]: https://wati.io/en/blog/test-whatsapp-message-sends-safely (la restricción de 5 números es la regla del test number de Meta; para el demo basta: 2 jurados + 2 teléfonos "Camila sintética" + 1 fundador = 5) |
| Templates de mensajes WhatsApp (utility) | **US$0** (approval pendiente) | Meta exige aprobación de plantillas; con el número de prueba las plantillas pre-aprobadas funcionan inmediatamente. Riesgo de approval → fallback Twilio trial sandbox (https://www.twilio.com/docs/whatsapp/api ) |
| LLM (tono, parseo, copy) — GLM-5.3 API | **US$0 fijo** (pay-per-use variable §1.2) | API pay-per-use: sin suscripción, costo por llamada de centavos — [Estimate] el free tier/anual promo cubre el demo completo; cargar US$5 de crédito como seguro |
| Almacenamiento de assets (capturas, audios demo, estático de respaldo) | **US$0** | Cloudflare R2 free tier: **10 GB gratis** + operaciones sin costo de egress — [Data]: https://www.cloudflare.com/developer-platform/products/r2/ |
| OAuth de Google Calendar | US$0 | Google Cloud free tier; el scope `calendar.events` para UNA cuenta de demo; no requiere verificación de app si el app está en modo Testing (hasta 100 test users) — [Data]: https://developers.google.com/workspace/guides/configure-oauth-consent |
| Repositorio + CI | US$0 | GitHub free |
| Dominio (OPCIONAL — solo si el pitch necesita URL propia) | **US$10** | [Estimate] .cl ~$8.000/año o .com US$10 — el demo puede correr en `*.vercel.app` gratis; el dominio es el único gasto fijo posible y es PRESINDIBLE |
| **Total fijo** | **US$0** (US$10 si se compra dominio; decisión: no comprar para el evento) | — |

### 1.2 Capital variable — costo del demo (estimado ≤US$5)

Uso real durante el evento (viernes build + sábado demo):

| Consumo | Volumen estimado | Costo |
|---|---|---|
| Mensajes WhatsApp desde número de prueba | ~40 (ensayos + demo + jurados) | **US$0** (número de prueba no cobra) |
| Llamadas GLM-5.3 (parseo + tono + recordatorios redactados) | ~150 llamadas × ~800 tokens in/out | [Estimate] **~US$0,30–0,60** (a centavos por llamada) |
| Almacenamiento R2 (capturas demo + audio plan B + static backup) | ~200 MB | **US$0** (dentro de los 10 GB) |
| Google Calendar API | ~30 llamadas | **US$0** |
| Vercel functions | ~500 invocaciones | **US$0** |
| Margen de seguridad (recarga de crédito LLM) | — | US$5 cargados, se espera gastar <$1 |
| **Total variable demo** | | **≤ US$1** (presupuesto ≤US$5 cumplido con holgura 5×) |

**Post-demo (producción piloto), para referencia de unit economics:** costo variable por usuario-semana ≈ 4 mensajes utilitarios × US$0,01 (tarifa Chile: https://omnifox.io/en/whatsapp-pricing-calculator ) + LLM ≈ **US$0,05–0,10**; ver detalle y riesgo de cambio de pricing en unit-economics.md §0 y Flags (Meta empieza a cobrar mensajes de servicio el 01-oct-2026: https://ekua.io/en/newsletters/whatsapp-pricing-october-2026 ).

## 2. Skill técnico requerido — qué sabe el equipo vs qué es difícil

**El equipo:** 1 fundador full-stack + agentes de IA (Claude Code / Codex como pares de programación). El fundador del hackathon es el perfil que ya construyó y opera un stack serverless con WhatsApp + LLM + R2 (el propio Hermes Agent en esta máquina lo demuestra), es decir: **python/typescript full-stack, APIs REST, webhooks, prompt engineering, deploy Vercel.**

| Componente | ¿El equipo sabe hacerlo? | Dificultad real |
|---|---|---|
| Webhook entrante de WhatsApp → Vercel (verify token + payload) | Sí — patrón conocido | **Medio-alto: ES LO ÚNICO REALMENTE DIFÍCIL** (ver abajo) |
| Envío de templates por WhatsApp Cloud API | Sí — REST directo a graph.facebook.com | Bajo (una vez leída la docs) |
| Flujo conversacional del bot (pregunta domingo → opciones → confirmación) | Sí — máquina de estados simple en un JSON/dict | Bajo-medio (estados: propuesta, confirmada, recordatorio, realizada, movida) |
| GLM-5.3 para tono cero-culpa + parseo de lenguaje natural | Sí — prompt engineering es skill core del equipo | Bajo |
| Generar .ics + Google Calendar invite (OAuth) | Sí — librería estándar (google-api-python-client / ics) | **Medio-alto: segundo riesgo** (OAuth consent screen + refresh tokens) |
| Cron de recordatorios (18:30) | Sí — demo: trigger manual (reloj simulable); piloto real: scheduler externo | **Medio (re-etiquetado, parche red team 12-oct):** límite verificado de Vercel Hobby Cron: máx 2 crons/proyecto, cada uno a lo más 1×/día, precisión «dentro de la hora» (±59 min), solo UTC — la hora exacta NO es programable en el free tier; el disparo del recordatorio pasa a scheduler externo (GitHub Actions con verificación horaria o cron-job.org free) y en el demo se dispara manual, sin fingir automatización |
| Vista admin (historial Camila sintética) | Sí — página Next.js estática con datos semilla | Bajo |
| TTS de audio (si se agrega voz a los recordatorios) | Sí — edge-tts / ElevenLabs free | Bajo, y es NICE (ver mvp-definition) |
| Diseño de plantilla/copy cero-culpa en español de Chile | Sí — es el skill diferencial del equipo (ICP map §icp.md) | Medio (no técnico: es EL producto) |

**Los 2 puntos difíciles y su de-risking EN EL EVENTO:**

1. **Webhook WhatsApp → Vercel.** Riesgo: la verificación del webhook (GET challenge) + el flujo OAuth de Meta Business pueden consumir 2–3 h si se topcongra mal el Business Manager. **De-risk:** (a) el número de prueba se crea el VIERNES 09:00–10:00 apenas llega el equipo (primera tarea del plan); (b) fallback preparado: Twilio sandbox WhatsApp (approval instantáneo, sin Business Manager); (c) el endpoint de verify es un handler de 5 líneas que se escribe primero y se testea con curl antes de cualquier lógica.
2. **OAuth Google Calendar.** Riesgo: consent screen + scope approval + refresh token storage. **De-risk:** (a) modo Testing con la cuenta Google del fundador como único test user (suficiente para el demo: el calendario proyectado es el del fundador); (b) fallback: **generar .ics y enviarlo como adjunto por WhatsApp** — el tap en el .ics agrega la cita al calendario del teléfono SIN OAuth (este es el plan A del demo, OAuth es plan de lujo); (c) si ni .ics ni OAuth: screenshot animado del calendario con la cita (plan C).

**De-risking general del demo (R6 — sin red):** todo el flujo demo-eable en modo offline: guiones pre-grabados + capturas en R2 (static1); el bot en vivo es el upgrade si la red del venue coopera. R2 — datos sintéticos ("Camila sintética") ya definidos en la propuesta.

## 3. Tiempo de build (horas, con buffer ≥25%)

Presupuesto de reloj útil del evento: ~20 h (vie 09:00–21:00 = 12 h; sáb 09:00–15:00 = 6 h; checkpoints y descansos ~2 h). Regla del torneo: plan ≤30 h de trabajo con buffer ≥25%.

| Bloque | Horas netas | Con buffer +25% | Detalle |
|---|---|---|---|
| Setup repos + cuentas (GitHub, Vercel, WhatsApp test number, R2, GLM key) | 1,5 | 1,9 | viernes primera hora |
| Webhook WhatsApp (verify + receive + send) + smoke test | 3 | 3,75 | el riesgo #1; fallback Twilio a la 1,5h si no avanza |
| Máquina de estados de la cita + flujo dominical (pregunta, 2 taps, MUEVE) | 3 | 3,75 | con agente de código en paralelo |
| GLM-5.3: prompt de tono cero-culpa + test adverso (20 respuestas) | 2 | 2,5 | prompt engineering + suite de tests |
| .ics generator + (OAuth lujo) calendar invite | 1,5 | 1,9 | plan A .ics adjunto |
| Cron recordatorio 18:30 + re-agendado | 1,5 | 1,9 | Vercel Cron |
| Vista admin (historial 6 semanas sintéticas) | 1,5 | 1,9 | página estática |
| Datos semilla + ensayo completo del demo ×3 | 2 | 2,5 | con los 5 números allowlisted |
| Plan B sin red (guiones + capturas a R2) | 1 | 1,25 | obligatorio R6 |
| Pitch deck + guion 5 min | 2 | 2,5 | en paralelo con builds |
| **Total** | **19 h netas** | **~23,75 h** | ≤30 h ✓, buffer 25% ✓, margen ~6 h de reloj del evento |

**Delegación a agentes de código (paralelización real):** fundador hace las integraciones (webhook, OAuth, cron) y el copy; agentes (Claude Code/Codex) generan en paralelo: la vista admin, los tests del flujo, el script de datos semilla y el deck. Detalle hora-por-hora en `04-mvp/build-plan-2dias.md`.

## 4. Costo total del evento

```
Fijo: US$0 (dominio NO se compra; vercel.app basta)
Variable demo: ≤US$1 real (LLM) — presupuesto ≤US$5 cumplido
Total evento: ≤US$5, con 5× de holgura
```

**Trade-off declarado:** lo que NO compramos (dominio, email tooling, analytics paid) no afecta el criterio de éxito del demo; el riesgo del evento no es plata: es el tiempo del webhook. Por eso el plan de build asigna el riesgo #1 a la primera ventana de viernes con fallback a las 1,5 h.

---

## Flags

- **Yellow — WhatsApp pricing en transición:** desde el 01-oct-2026 Meta cobra los mensajes de servicio (hasta sep-2026 gratis) — [Data]: https://ekua.io/en/newsletters/whatsapp-pricing-october-2026 . No afecta el demo (número de prueba), pero el unit economics de producción debe recalcularse (unit-economics.md Flags).
- **Yellow — Límite de 5 destinatarios del número de prueba:** es restricción dura de Meta para el test number; el demo está diseñado dentro de ese límite (2 jurados + 2 sintéticas + 1 fundador). Si el jurado son >4 personas, el mensaje en vivo se rota o se proyecta desde el teléfono del fundador.
- **Yellow — OAuth Google Calendar con modo Testing:** funciona sin verificación para ≤100 test users, pero el refresh token puede expirar en escenarios de no-uso; para el evento: .ics adjunto es el plan A, OAuth el plan de lujo (decisión de de-risking, no de capacidad).
- **Yellow — GLM-5.3 pricing exacto no verificado por llamada:** [Estimate] centavos por llamada con crédito de US$5; el techo presupuestario es robusto aun con 10× el costo estimado.
- **Red — ninguna.**
