# Plan de build — 2 días (viernes 23 · sábado 24 octubre 2026)

*Hackatón Señales · Makana SpA · BORRADOR v1 · 12-oct-2026. Path corregido según brief: `C:/Users/bcald/OneDrive/Desktop/hackathon/senales/04-mvp/build-plan-2dias.md`. Derivado de capital-y-stack.md (riesgos y horas) y mvp-definition.md (MUST/NICE).*

**Reglas del plan:** reloj útil viernes 09:00–21:00 (12 h) y sábado 09:00–15:00 (6 h), entrega 15:00, pitch 16:00. Checkpoints organizativos de 10 min a las ~12:00 y ~18:00 del viernes (slots fijos, no se acumulan). Presupuesto de trabajo: 19 h netas + buffer 25% (capital-y-stack.md §3). **R1: NADA de este repo de investigación entra al build — repositorio desde cero.**

**División de trabajo permanente:** el fundador hace integraciones sensibles (webhook, OAuth/.ics, cron) y todo el copy/tono. Los agentes de código (Claude Code / Codex) trabajan EN PARALELO en módulos aislados con specs cerradas: vista admin, tests del flujo, seed de datos, deck. Nunca el fundador y un agente editan el mismo archivo a la vez.

---

## VIERNES 23 — 09:00–21:00

### Mañana: fundaciones + el riesgo #1

| Hora | Fundador | Agente de código (paralelo) |
|---|---|---|
| 09:00–09:45 | Setup repo DESDE CERO (github nuevo), Vercel project (Hobby), Cloudflare R2 bucket, GLM-5.3 key; **creación inmediata del número de prueba WhatsApp** (Meta Business) — el reloj de approval empieza a correr | Boilerplate del repo: estructura Next.js/py serverless, README del repo nuevo, .env.example |
| 09:45–11:15 | **Webhook WhatsApp → Vercel**: handler de verificación (GET challenge) + recepción de mensajes + smoke test con curl; allowlist de los 5 números (2 jurados, 2 sintéticas, 1 fundador) | Módulo de envío de mensajes (graph.facebook.com REST) con tests unitarios |
| 11:15–12:00 | Envío de plantilla utility desde número de prueba → **primer mensaje end-to-end recibido en un teléfono real** (hito A). Si el webhook NO avanza a las 1,5h: **CONTINGENCIA C1** (ver abajo) | Seed script de «Camila sintética» (6 semanas: 11 visitas, 4 movidas, 0 cadenas rotas) |
| **12:00–12:10** | **CHECKPOINT 1 (organizativo, 10 min):** ¿hito A alcanzado? Se congela mvp-definition.md (MUSTs definitivos). Si no: activar C1 y re-planificar la tarde | — |

### Tarde: el flujo de la cita

| Hora | Fundador | Agente de código (paralelo) |
|---|---|---|
| 12:10–14:00 | Máquina de estados de la cita (propuesta → confirmada → recordada → realizada/movida) + flujo dominical M1: pregunta 20:00 con 2 opciones + «otra hora» + «esta semana no» | Test suite del flujo (entrada por cada opción + respuestas libres) |
| 14:00–15:00 (almuerzo working) | GLM-5.3: prompt de tono cero-culpa + parseo de lenguaje natural («hoy no puedo», «junta eterna») → MUEVE | Continúa tests |
| 15:00–16:30 | **MUEVE (M4)**: re-agendado al siguiente slot compatible + confirmación; la cita se mueve, no se borra | Vista admin (página estática con el historial de Camila sintética) |
| 16:30–18:00 | **.ics generator (M2)**: adjunto por WhatsApp con la cita (título, sede, 40 min); tap → se agrega al calendario del teléfono. Si esto fluye rápido (<45 min), intentar OAuth Google Calendar (N1) en modo Testing | Reencuadre sunk cost (M6): template del post-«listo» con «recuperaste $X de tu mensualidad» |
| **18:00–18:10** | **CHECKPOINT 2 (organizativo, 10 min):** estado de MUSTs M1–M4/M6; decidir qué se corta si viene apretado; asignar el ensayo y el plan B de la noche | — |
| 18:10–19:40 | **Disparador M3 (recordatorio 18:30 del día-C)** + guardrail R4 (M7): derivación a kinesiólogo si hay dolor — y **test adverso de tono: 20 respuestas** («me da vergüenza», «me duele la espalda», «hoy no pude»). **Parche red team 12-oct — límite verificado de Vercel Hobby Cron:** máx 2 cron jobs/proyecto, cada uno a lo más 1×/día, precisión «dentro de la hora» (±59 min), solo UTC → las 18:30 NO son programables con precisión de minuto en el free tier. Decisión: el DEMO dispara M3 manualmente (reloj simulable, botón visible en la vista admin — no se finge automatización); el PILOTO real usa scheduler externo (GitHub Actions con verificación horaria o cron-job.org free): «Vercel Hobby no garantiza las 18:30» y no se promete | Deck del pitch (5 min, esqueleto con capturas reales del flujo) |
| 19:40–21:00 | **Ensayo completo #1** del demo con los 5 números allowlisted (modo demo: reloj simulable domingo 20:00 → lunes 18:30 → MUEVE); log de fricciones | Corrige el seed/admin según lo que el ensayo exponga |

### Hitos de salida del viernes (definición de «viernes bien terminado»)
- Hito A: mensaje end-to-end real (11:15 ✓)
- Hito B: flujo dominical completo con confirmación en WhatsApp (14:00)
- Hito C: MUEVE re-agendando y .ics llegando (18:00)
- Hito D: ensayo #1 sin bloqueos duros (21:00)
- **Si el viernes termina sin Hito C → el sábado arranca en modo contingencia (ver C2).**

---

## SÁBADO 24 — 09:00–15:00 (entrega) · pitch 16:00

| Hora | Fundador | Agente de código (paralelo) |
|---|---|---|
| 09:00–10:30 | **Ensayo #2 completo** (incluye mensaje real a un teléfono «jurado» de prueba y MUEVE en vivo); cronometraje del guion de 5 min | Plan B sin red (R6): grabar guiones + capturas del flujo completo → subir a R2 (static1) |
| 10:30–11:30 | Pulir tono con GLM según fricciones del ensayo; congelar los textos del demo (no más cambios de copy después de 11:30) | Página de respaldo estática servida desde R2 (si Vercel/la red falla) |
| 11:30–12:30 | **Ensayo #3** — el del «vestuario»: full dress, pitch 5 min + demo 5 min cronometrados, con plan B a mano | Deck final |
| 12:30–13:30 | Almuerzo + **buffer de crisis** (libre por diseño) | — |
| 13:30–14:30 | **PUNTO DE CORTE 13:30** (ver contingencias): congelar TODO lo que esté; ensayo técnico final del modo elegido; preparar el teléfono del demo (batería, allowlist, sonido) | Congelar repo (R1: verificar que nada del repo de investigación se coló); tag v1-demo |
| 14:30–15:00 | **ENTREGA** (deploy marcado, repo limpio, costos verificados ≤US$5) | — |
| 15:00–16:00 | Búfer traslado/ setup del pitch; respirar | — |
| **16:00** | **PITCH + DEMO EN VIVO** | — |

---

## Puntos de corte y contingencias

**C1 — Webhook WhatsApp no funciona a las 11:15 del viernes (riesgo #1):**
- **Si a las 12:10 (checkpoint 1) no hay hito A:** se corta el camino Meta Cloud API y se pasa a **Twilio WhatsApp sandbox** (approval instantáneo, sin Business Manager). Se pierde la plantilla utility con nombre propio; se gana el día. La máquina de estados no cambia (el módulo de envío ya está abstraído — el agente lo construye con interfaz intercambiable desde las 09:45).
- **Parche red team 12-oct — prerequisito operativo del sandbox de Twilio (verificado):** al activar C1, los 5 números (incluidos los teléfonos del jurado) deben enviar «join <código>» al número del sandbox ANTES de poder recibir nada, y la sesión caduca a los 3 días. Presupuestar 30 min adicionales de la contingencia para joins + re-test del flujo con el nuevo número. Hacer los joins el VIERNES mismo (una sesión de 3 días iniciada el viernes temprano caduca justo el domingo: re-enviar el join el domingo en la mañana si el demo es a las 16:00).
- **Si Twilio también falla (poco probable):** demo con **WhatsApp Web proyectado + respuestas pre-grabadas del bot** (el guion del plan B R6) + el .ics enviado manualmente. El pitch muestra el mecanismo igual; D4 se baja a capturas, pero el contenido se mantiene.

**C2 — Sábado 13:30: «si no está X, se corta Y y se presenta Z» (al menos 2 reglas explícitas):**
1. **Si a las 13:30 el flujo MUEVE→re-agendado (M4) no funciona de punta a punta:** se corta N1 (OAuth, ya debería estar cortado), N3, N5; se presenta el demo sin re-agendado en vivo: M1→M2→M3 con confirmación del .ics y el admin de Camila sintética mostrando las 4 citas movidas de las 6 semanas sintéticas. Z = «la cita que se mueve» se cuenta, no se actúa.
2. **Si a las 13:30 el mensaje real al teléfono del jurado no llega (allowlist/latencia):** se corta el momento «mensaje al jurado»; se presenta el mismo flujo con los 2 teléfonos sintéticos proyectados + el teléfono del fundador recibiendo en vivo (el jurado ve la llegada real aunque sea a otro número). Z = el demo completo sin interacción directa del jurado.

**Reglas de corte menores:**
- OAuth Google Calendar: SOLO si a las 18:00 del viernes M1–M4+M6 están verificados (ya implícito en el horario).
- Cualquier MUST que a las 13:30 del sábado tenga bug → se degrada a su versión estática del plan B; nunca se debuggea en vivo después de las 14:00.
- El plan B sin red (guiones + capturas en R2) es OBLIGATORIO y debe estar listo a las 10:30 del sábado sin excepción (R6).

---

## Resumen de horas (auditable contra capital-y-stack.md §3)

```
Viernes: 12 h reloj → ~9,5 h netas de build (− checkpoints 20 min − setup/pyzas)
Sábado:   6 h reloj → ~3,5 h netas (ensayos, corte, entrega) 
Total neto: ~13 h fundador + ~6 h agentes en paralelo (módulos aislados)
Presupuesto con buffer 25%: 19 h × 1,25 = 23,75 h ≤ 30 h ✓ (el resto del margen son los buffers de crisis del plan)
```

**Aritmética del reloj del evento:** 18 h de reloj − 20 min de checkpoints − 1 h de almuerzo/búfer sábado = ~16,5 h de reloj útil; 13 h netas de fundador + 6 h de agentes en paralelo = ~19 h-hombre ejecutadas dentro de 16,5 h de reloj. El buffer real contra desvíos: los 3,5 h de diferencia + el bloque 12:30–13:30 del sábado.

---

## Flags

- **Yellow — BORRADOR:** este plan se congela en el checkpoint 1 del viernes (12:00) junto con mvp-definition.md; después de ese punto solo se degrada alcance, nunca se agrega.
- **Yellow — El allowlist de 5 números es el recurso más escaso del evento:** definir los 5 dueños (2 jurados rotativos, 2 sintéticas, 1 fundador) ANTES de las 09:45 del viernes; si el jurado es >4, el mensaje en vivo se hace desde el teléfono del fundador (regla C2.2 ya lo cubre).
- **Yellow — Aprobación de plantillas utility de WhatsApp:** con número de prueba las pre-aprobadas bastan para el demo; si Meta pide approval de una plantilla custom, NO esperar: usar las pre-aprobadas y personalizar el tono en las respuestas dentro de la ventana de servicio (gratis hasta hoy; ver capital-y-stack.md Flags).
- **Yellow — El riesgo de tiempo real no es técnico: es el copy:** el test adverso de 20 respuestas (viernes 19:40) es pass/fail del demo: si el tono culpa en >2 de 20, se simplifican las respuestas a plantillas fijas el sábado 10:30.
- **Red — ninguna.**
