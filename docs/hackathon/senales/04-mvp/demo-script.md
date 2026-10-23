# Demo en vivo — coreografía del pitch (5 min + 5 min de preguntas)

*Hackatón Señales · Makana SpA · «La Cita» (C1.a) · sábado 24-oct-2026, 16:00. Guion de demo derivado de mvp-definition.md (con los 8 parches del red team aplicados), build-plan-2dias.md y 06-red-team/ataques-y-veredicto.md §6. Español de Chile. Protocolo de honestidad: [Data]+URL, [Estimate], [Assumption], [Opinion].*

**Regla madre del guion:** este demo no finge nada. Lo que se dispara manual se dice que se dispara manual; lo que es sintético se llama sintético; lo que es hipótesis se llama hipótesis. El expediente ganó el red team por honesto — el demo se juega en el mismo terreno.

---

## 0. Escenario y setup (antes de empezar)

**En pantalla (3 ventanas, en este orden de tamaño):**
1. **WhatsApp Web** — conversación con «Camila sintética» (teléfono allowlisted).
2. **Calendario laboral de Camila sintética** (Google Calendar) — con 3–4 reuniones reales de pega ya agendadas («Daily PM», «Comité producto», «1:1 con Diego»).
3. **Vista admin** (Vercel) — historial de Camila sintética, reloj simulable (botón «▶ simular domingo 20:00»), y el panel de V/U animado.

**A mano:** el teléfono del jurado (allowlisted, sonido ON, brillo alto), la grabación de respaldo de 60s (R2, ver §Plan B), y el checklist de las 15:00 del build-plan (batería, allowlist, sonido).

**Frase de apertura obligatoria (R2 + allowlist, en 1 frase):** «Los mensajes que verán usan el sandbox de Twilio con números de prueba — los únicos teléfonos reales registrados son del equipo y del jurado, con su permiso, y se borran del allowlist al cierre de este demo.»

**Datos del demo — «Camila sintética» y su semana (R2: cero datos reales):**

| Artefacto | Valor |
|---|---|
| Persona sintética | «Camila sintética», 34, Ñuñoa, jefa de proyectos, gym Smart Fit Ñuñoa, ventana 19:00–21:00 |
| Historial semilla | 6 semanas sintéticas: 11 visitas, 4 citas movidas, 0 cadenas rotas |
| Semana 1 | Lun 19:15 + Jue 19:45 — 2 visitas, 0 movidas |
| Semana 2 | Lun MUEVE → Mié 19:30 — 2 visitas, 1 movida |
| Semana 3 (la semana imperfecta) | Lun MUEVE, Mié MUEVE (2 seguidos) → sistema re-negocia ventana → Sáb 11:00 — 1 visita, 2 movidas |
| Semana 4 | Nueva ventana: Mar 20:30 + Sáb 11:00 — 2 visitas, 0 movidas |
| Semana 5 | **Domingo silencioso** (sin respuesta) → default: sistema agenda el slot favorito Mar 20:30 igual → visita; Jue MUEVE → Sáb — 2 visitas, 1 movida |
| Semana 6 | Mar 20:30 + Sáb 11:00 — 2 visitas, 0 movidas |
| V/U animado | visitas/semana acumuladas: 2,0 → 2,0 → 1,67 → 1,75 → 1,8 → 1,83 (cae en la S3 y se recupera: eso ES la tesis) |

---

## 1. Minuto a minuto (0:00–5:00)

### 0:00–0:45 — Apertura: el caso y el mecanismo

**🖥 Se muestra:** pantalla del título del deck; luego WhatsApp Web de Camila sintética en primer plano.

**🗣 Se dice:**
- «Camila, 34, jefa de proyectos. Paga el gym hace diez meses y fue seis veces. Su frase es "mañana parto". No es un problema de motivación — es un problema de logística del hábito.»
- «El 23:55 del domingo es un fresh start real que se muere a las 07:45. La evidencia de implementation intentions: pasar de "voy al gym" a "si cierro la última reunión, lunes 19:15, 40 minutos" llevó la participación de un 35% a un 91% — **coletilla obligatoria:** estudiantes británicos, una semana, auto-reporte [Data, >18 meses]: https://academia.edu/13555694/Combining_motivational_and_volitional_interventions_to_promote_exercise_participation_Protection_motivation_theory_and_implementation_intentions — mide que el plan vence a la motivación en la iniciación, no que el 91% se sostenga. Que se sostenga a 90 días es nuestra hipótesis, y este MVP es el estudio que la mide.»
- «Y el segmento: la mitad de los socios abandona antes de los 6 meses [Data, Radiografía del sector gym Chile 2024: https://mercadofitness.com/se-publico-radiografia-sector-gimnasios-chile/] — Camila es exactamente ese segmento: paga y no sostiene.»
- *(Frase R2 del §0: allowlist/números de prueba, una sola vez, y no se vuelve a hablar del tema.)*

### 0:45–1:40 — 🎭 MOMENTO TEATRAL 1: la cita aparece en el calendario como una reunión más

**🖥 Se muestra:** la vista admin; el fundador presiona EN PANTALLA el botón «▶ simular domingo 20:00» (disparador visible). El mensaje de la captura dominical llega a WhatsApp Web: «Camila, mañana parto? [Lun 19:15 · Gym Ñuñoa · 40'] [Mar 19:45] [Otra hora] [Esta semana no]». El fundador responde como Camila sintética: «mañana 19:15». GLM-5.3 confirma con tono cero-culpa. El .ics llega como adjunto, tap — y **la cita aparece EN el calendario laboral, metida entre «Daily PM» y «Comité producto»**. Se deja la pantalla del calendario 3 segundos en silencio.

**🗣 Se dice:**
- «Esto lo disparo yo, manualmente — se los muestro a propósito: en producción este gatillo es un scheduler externo. Vercel gratis no garantiza la hora exacta y no les vendemos automatización que no existe.» *(Honestidad del cron, parche 4.)*
- «Dos taps el domingo. Y si el domingo Camila no responde nada — el sistema agenda igual su slot favorito y manda el .ics igual: para quitar la cita hay que responder. El silencio también agenda: el default del sistema ya no es el default del problema.» *(Parche 1.)*
- «Y acá está el insight: para una jefa de proyectos, lo que está en el calendario EXISTE y lo que no está, no existe. La cita del gym quedó vestida de reunión — misma lista, mismo lugar, mismo respeto. [Assumption central, declarada: es la hipótesis de identidad que el piloto valida.]»

### 1:40–2:20 — El recordatorio llega de verdad

**🖥 Se muestra:** reloj simulable salta a lunes 18:30. El recordatorio único llega **al teléfono del jurado** (vibra/suena en vivo, proyectado si el venue lo permite): «A las 19:15 tienes la cita contigo. Si hoy la pega te come, responde MUEVE — sin explicaciones.»

**🗣 Se dice:**
- «Un solo mensaje a la hora exacta, por el único canal que ella ya habita: WhatsApp, 89,7% de usuarios de internet en Chile [Data: GWI/adsize]. Nada de apps que abrir: la app del gym ella ya la abrió — y no fue.»
- «Ese teléfono es real, el mensaje es real. En producción, el disparo horario es un scheduler externo — acá lo acabo de disparar yo con el reloj simulable, y no lo escondo.» *(Remate del parche 4.)*

### 2:20–3:20 — 🎭 MOMENTO TEATRAL 2: el MUEVE sin culpa, en vivo (+ derivación R4)

**🖥 Se muestra:** el fundador escribe como Camila sintética: «hoy no puedo, la reunión se eternizó… y ahora que lo pienso, se me aferró la espalda». El sistema responde en 2 partes: (1) re-agenda en 1 tap — «Listo: la cita pasó al miércoles 19:30. Mover no es fallar.» — y **el calendario proyectado se actualiza solo: la cita del miércoles aparece**; (2) por la espalda: «Con la espalda aferrada no te voy a recetar ejercicio: antes de retomar peso, mejor una evaluación con un kinesiólogo o un médico deportólogo — tu gym te puede derivar. La cita igual quedó: la espalda se evalúa, el hábito no se castiga.»

**🗣 Se dice:**
- «MUEVE en 1 tap, sin explicaciones, sin culpa: la cita se mueve, nunca se rompe. El miércoles existe igual — el día malo no reinicia todo a cero.»
- «Y como mencionó dolor: el sistema no prescribe contra dolor — deriva a kinesiólogo o médico deportólogo. Esa es una restricción dura del torneo y del sentido común: no somos clínicos.» *(R4 integrado en el flujo.)*
- «¿Y si se hace un hábito de postergar? Tras 2 MUEVEs consecutivos sin visita, el sistema deja de ofrecer el mismo slot y abre re-negociación: "el lunes no te está resultando — ¿martes 20:30 o sábado 11:00?". Mover no es fallar; desfilar no es mover.» *(Regla anti-snooze, parche 2.)*

### 3:20–4:15 — 🎭 MOMENTO TEATRAL 3: la cadena sostenida (V/U moviéndose)

**🖥 Se muestra:** vista admin a pantalla completa. La animación recorre las 6 semanas sintéticas día por día: cada visita cae como un bloque, cada MUEVE mueve la cita en la línea de tiempo, y **el contador de V/U (visitas/semana) se va moviendo en pantalla: 2,0 → 2,0 → 1,67 → 1,75 → 1,8 → 1,83** — con la caída visible de la semana 3 y su recuperación. El panel marca: «11 visitas · 4 citas movidas · 0 semanas en cero». Se congela la pantalla en la semana 5 y se señala el domingo silencioso: la cita quedó agendada igual (el default en acción, en el historial).

**🗣 Se dice:**
- «Camila sintética, seis semanas: once visitas, cuatro citas movidas, cero semanas en cero. La semana 3 fue un desastre — dos MUEVEs seguidos — y el sistema re-negoció la ventana en vez de repetir el lunes. La métrica cayó a 1,67 y se recuperó: eso, no la semana perfecta, es "y lo sostenga".»
- «Ojo con esta semana 5: el domingo no respondió nada — y la cita quedó agendada igual en su slot favorito. El silencio ya no mata la semana.»
- **Etiqueta de honestidad obligatoria:** «Todo este historial es sintético — se llama "Camila sintética" a propósito. V/U90 — visitas sostenidas por semana a 90 días — es la métrica norte y sigue siendo una hipótesis: no existe en la literatura un estudio que combine intención de implementación + default + re-agendado y muestre adherencia a 90 días. El MVP es, literalmente, ese estudio.»

### 4:15–5:00 — Cierre: el negocio, dicho ANTES de que pregunten

**🖥 Se muestra:** una sola lámina con 4 cifras: cash payback <1 mes · LTV/CAC 2,5× año 1 · 8,6× año 2 · V/U90 = la métrica que decide.

**🗣 Se dice (regla del parche 7 — cifras proactivas):**
- «El modelo, antes de que ustedes lo saquen: LTV/CAC contable año 1 es 2,5× — bajo el umbral de 3×, y lo declaramos porque es la aritmética honesta: el año 1 del B2C es un experimento subvencionado por tiempo de fundador. El payback de caja es menor a un mes, el año 2 llega a 8,6× cuando el costo fijo se diluye, y cruzamos 3× desde ~376 activos. [Estimate/Assumption, unit-economics.md §2]»
- «La tesis de inversión no es el SOM B2C — es B2B2C: gyms boutique y empleadores absorbiendo la adquisición, donde el LTV/CAC pasa de 10×. Los precios de ese canal aún no tienen ancla publicada en Chile: son [Estimate: a validar con 2 gyms y 1 empleador] — si alguien pregunta de dónde sale el $500/socio, la respuesta es "aún no sale de ninguna parte: es lo que el piloto fija".» *(Parche 8 aplicado en voz alta.)*
- «Y qué pedimos: un piloto Stage A de 90 días con 2 gyms boutique y 1 empleador para medir V/U90 — porque el indicador del caso es exactamente ese verbatim: **que vuelva a entrenar y lo sostenga**.»

---

## 2. Reglas de honestidad del pitch aplicadas a este guion (parche 7 — verificación)

| Regla | Dónde/cómo en este guion |
|---|---|
| Coletilla obligatoria al 91% | Dicha en 0:20, en la misma frase que el 91% (estudiantes británicos, 1 semana, auto-reporte, n=248). |
| Proactividad de cifras | 4:15–5:00: payback <1 mes, 2,5× año 1 (declarado bajo 3×), 8,6× año 2, cruce ~376 activos — ANTES de que pregunten. |
| PROHIBIDO decir «4,3×» | No aparece en el guion ni en el deck. Si un jurado lo dice, corregir: «el 4,3× era un CAC mal calculado; el corregido es 2,5× y es el que presentamos». |
| PROHIBIDO decir «67% nunca va» | El guion usa «la mitad abandona antes de los 6 meses» [Data]. Si un jurado cita el 4,6% de HFA, la respuesta está en mercado-chile.md §2: el segmento de Camila es "paga-sin-sostener", no "nunca-va". |
| Vender V/U90 + B2B2C, no el SOM B2C | 4:40: «la tesis de inversión no es el SOM B2C — es B2B2C». Si preguntan por el mercado, redirigir al KPI. |
| Comparación con propuestas hermanas | Ganar en D1 (cadena causal cerrada con un solo artefacto) y en demo; NO aceptar el framing «estructura vs voluntad» (advertencia del steelman, veredicto §5). |

---

## 3. Plan B si falla la red del venue (R6) — diseñado para degradar D4 lo menos posible

**Regla del fiscal:** el plan B de guiones + capturas cumple R6 pero degrada D4 (el «wow» del mensaje real). Este plan B está diseñado para mantener el flujo VIVO aunque el canal caiga.

### Nivel 1 — «Modo sin conexión» de la MISMA app (degradación mínima; primera línea)

La máquina de estados, el reloj simulable, el GLM y el .ics son locales; solo el envío de WhatsApp depende de la red. Si la red del venue cae o el número de prueba no responde en ~20 segundos:

- Se proyecta la **misma vista admin** con el registro de la conversación renderizándose en vivo: el sistema procesa las respuestas y muestra los mensajes salientes en pantalla (aunque no salgan al teléfono).
- El .ics se abre en el **calendario del notebook proyectado** — la cita aparece entre las reuniones igual que en el plan A (Momento 1 sobrevive intacto).
- El MUEVE se escribe desde el admin y la re-agenda + el calendario se actualizan en vivo (Momento 2 sobrevive intacto).
- Lo único que se pierde es el teléfono del jurado vibrando; los 3 momentos teatrales y su coreografía se mantienen.

**🗣 Frase honesta del modo sin conexión:** «La red del venue no coopera: les muestro el mismo flujo corriendo local — lo que ven procesándose es el sistema real; lo único que no puedo garantizar es que llegue a su teléfono. El mecanismo no cambia: el mensaje es el mensajero, la cita es el producto.»

### Nivel 2 — Grabación de respaldo de 60 s + demo local simulado (si ni la app local coopera)

- **Grabación de 60 s** del flujo REAL end-to-end (mensajes llegando a teléfonos reales), grabada en el ensayo #3 del sábado 11:30 y subida a R2 (static1) — accesible offline desde el notebook.
- Encima de la grabación, el fundador actúa el mismo minuto a minuto con la vista admin estática (los 3 momentos se narran, no se simulan como vivos).
- **PROHIBIDO presentar la grabación como un en vivo.** Frase obligatoria: «Esto lo grabamos hoy en la mañana con el mismo flujo y teléfonos reales — no les finjo un en vivo que hoy no tengo.»

### Trigger y decisión

- Red caída o mensajería sin responder a las 16:02 → modo sin conexión sin avisar dos veces (la frase honesta se dice una vez, se sigue el mismo minuto a minuto).
- Decisión tomada ANTES del demo (regla del build-plan: nunca se debuggea en vivo después de las 14:00): si a las 15:50 el ensayo técnico del modo elegido no pasa, se arranca directo en el nivel que sí pasó.

---

## 4. Los 5 minutos de preguntas — respuestas preparadas (todas con etiqueta)

1. **«¿Y si ignora los mensajes del domingo?»** → «El mensaje no es el mecanismo: el invite en su calendario laboral es el mecanismo. Y con el default de silencio, si el domingo no responde, la cita queda agendada igual en su slot favorito — para quitarla hay que responder. El silencio ya no la mata.» *(Parche 1.)*
2. **«¿MUEVE no es snooze infinito?»** → «Tras 2 MUEVEs consecutivos sin visita, el sistema re-negocia la ventana en vez de repetir el slot: "el lunes no te está resultando — ¿martes 20:30 o sábado 11:00?". Y H3 mide justo eso: el % de citas que terminan en visita tras 2+ MUEVEs seguidos.» *(Parches 2 y 3.)*
3. **«El 91% es de una semana, chico y auto-reportado»** → «Sí — y por eso lo decimos con la coletilla puesta. El 91% mide la iniciación; los 90 días son nuestra hipótesis H4 y el MVP es el estudio. No existe literatura que combine estos tres mecanismos a 90 días — ese es, literalmente, el experimento que venimos a correr.»
4. **«¿$34.990 de dónde?»** → «[Estimate] Smart Fit no publica mensualidades; el rango de mercado low-cost es $25.000–40.000. La usamos como ejemplo rotulado y en vivo decimos "tu mensualidad" sin cifra — la opción sin cifra está escrita en el expediente.»
5. **«¿De dónde sale el $500/socio B2B2C?»** → «No sale de ninguna parte todavía: es [Estimate: a validar con 2 gyms boutique], sin pricing comparable publicado en Chile. El anclaje de referencia es el software de gestión que ya pagan (Mindbody/ClassPass). Es el único número duro del modelo sin fuente — así está declarado en el expediente.» *(Parche 8.)*
6. **«¿Esto no lo copia el gym mañana?»** → «Puede copiarlo el día que su incentivo deje de ser cobrar al ausente — el socio que no va es su mejor cliente hoy [Opinion]. Nuestro comprador natural es el gym boutique y el empleador, donde la asistencia ES el revenue.»

---

## 5. Checklist pre-demo (sábado, hereda del build-plan)

- [ ] Joins del sandbox de Twilio hechos el VIERNES si C1 está activo; re-enviar «join <código>» el domingo AM si la sesión de 3 días caducó (parche 5).
- [ ] Allowlist de 5 números confirmado; consentimiento verbal al inicio; borrar los números del jurado del allowlist AL CIERRE (nota R2 del fiscal).
- [ ] Grabación de respaldo de 60 s grabada en el ensayo #3 (11:30) y subida a R2 — probada OFFLINE.
- [ ] Modo sin conexión (nivel 1) probado una vez en el venue a las 15:50 — decidir el modo de arranque ANTES de las 16:00.
- [ ] Copy congelado desde las 11:30 (sin cambios de texto después); reloj simulable posicionado en domingo 19:59.
- [ ] Coletilla del 91%, cifras proactivas y los dos prohibidos («4,3×», «67%») repasados en voz alta en el ensayo #3.
- [ ] Batería del teléfono del jurado, sonido ON, brillo alto; proyector probado con las 3 ventanas.

---

## Flags

- **Yellow — Este guion se ensaya, no se lee:** los 3 momentos teatrales dependen del timing (la pausa de 3 segundos en el calendario del Momento 1 y el silencio del teléfono del jurado vibrando no se improvisan); ensayo #3 es full dress con este archivo en la mano.
- **Yellow — El V/U animado es seed sintético, no un resultado:** se declara en pantalla («datos sintéticos — V/U90 a 90 días es la hipótesis que el piloto mide»); si la animación se proyecta sin la etiqueta, el demo se convierte en exactamente el overclaim que el red team prohibió.
- **Yellow — El Momento 2 (MUEVE + espalda) hace dos cosas a la vez:** es la pieza más fácil de desincronizar en vivo; si el reloj aprieta, la espalda (R4) se muestra desde el historial del admin en vez de escribirse en vivo — R4 es pass/fail del torneo y no se corta jamás.
- **Yellow — Hereda los riesgos del build:** joins de Twilio (parche 5) y disparo manual del cron (parche 4) ya están escritos en build-plan-2dias.md; si algo de eso falla el sábado, este guion no es el lugar para resolverlo — aplicar el plan B del §3 y seguir.
- **Red — ninguna.**
