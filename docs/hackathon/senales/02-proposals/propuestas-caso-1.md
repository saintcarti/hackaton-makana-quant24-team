# Propuestas de MVP — Caso 1 (Camila, 34, Ñuñoa)

*Hackatón Señales · Makana SpA · 12-oct-2026 · Éxito verbatim: «que vuelva a entrenar y lo sostenga». Protocolo de honestidad: [Data] con URL, [Estimate] con supuestos, [Assumption], [Opinion]. Datos >18 meses se marcan.*

---

## Propuesta 1.a — «La Cita»

### Pitch en una línea
Camila no necesita otra rutina: necesita que el gym se comporte como sus reuniones — una **cita agendada en el calendario de la pega**, que se re-agenda cuando la pega la come y jamás se abandona en silencio.

### Mecanismo
**Qué hace que el hábito cambie:** el sistema convierte la intención difusa («mañana parto») en una **implementation intention** con hora, lugar y contenido acotado, la instala como **default** en el calendario que Camila ya obedece (el del trabajo), y la defiende con re-agendado automático («mover ≠ fallar»). El tono anti-culpa está diseñado de serie: sin rachas, sin métricas, sin "te quedaste atrás".

**Principios con fuente:**
- **Implementation intentions** (Gollwitzer & Sheeran 2006, meta-análisis 94 estudios, d≈0,65 [Data, >18 meses]: https://psycnet.apa.org/record/2007-19538-002): pasar de «voy al gym» a «si cierro la última reunión del lunes, voy 19:15, 40 min, 3 máquinas». En ejercicio, el cuándo-dónde-cómo llevó la participación de 35% a 91% (Milne, Orbell & Sheeran 2002 [Data, >18 meses]: https://academia.edu/13555694/Combining_motivational_and_volitional_interventions_to_promote_exercise_participation_Protection_motivation_theory_and_implementation_intentions).
- **Fricción/default invertido** (DellaVigna & Malmendier 2006, AER [Data, >18 meses]: https://www.aeaweb.org/articles?id=10.1257/aer.96.3.694): hoy no-ir cuesta cero y nadie lo nota; con La Cita, IR es el default (ya está en el calendario) y NO-ir exige una acción: decir "MUEVE". El default se diseña a favor, como en el menú de contratos donde el flat-fee explota la inercia.
- **Captura del fresh start** (Dai, Milkman & Riis 2014, Management Science [Data, >18 meses]: https://psycnet.apa.org/record/2014-43171-006): el «23:55, mañana parto» es un landmark temporal ya operativo que muere a las 07:45. La Cita lo captura el domingo a las 20:00 — ANTES de que se duerma — y lo convierte en agenda, no en promesa.
- **Reencuadre del sunk cost** (la mensualidad como activo, no como culpa) [Assumption + Opinion]: «ya lo pagaste» elimina la culpa sin tocar el precio (prohibido jugar con precio; aquí no se juega: se recuerda lo pagado).
- **Fogg B=MAP** [Data]: https://bjfogg.com/behaviordesign — no ataca la motivación (baja a las 19:00 entre semana, y la culpa la mata); sube la ability (cita lista, 40 min, 3 máquinas que ya conoce) y clava el prompt (un único mensaje a la hora exacta por el canal que ya habita).
- **COM-B** (Michie, van Stralen & West 2011 [Data, >18 meses]: https://discovery.ucl.ac.uk/1305716/1/1748-5908-6-42.pdf): el gap de Camila es **Oportunidad** (ningún slot defendido) y **motivación automática** (ninguna rutina instalada); La Cita es una intervención de reestructura de entorno, no educativa.
- **Sostén a 66 días** (Lally et al. 2009, mediana 66 días para automatizar [Data, >18 meses]: https://ucl.ac.uk/news/2009/aug/how-long-does-it-take-form-habit): el éxito «y lo sostenga» exige que el loop corra ~2 meses tolerando días caídos; por eso el sistema re-agenda en vez de romper cadenas.

### Recorrido del usuario — un día real de Camila con La Cita
1. **Dom 20:00** (una hora antes de su «23:55, mañana parto»): un solo mensaje de WhatsApp: «Camila, mañana parto? Elige: [Lun 19:15 · Gym Ñuñoa · 40'] [Mar 19:45] [Otra hora] [Esta semana no]». Dos taps. GLM-5.3 redacta con su tono y negocia la hora en lenguaje natural si responde algo distinto.
2. **Dom 20:01**: el sistema envía la invitación a su calendario del trabajo. La cita aparece junto a sus reuniones: «Gym Ñuñoa — bici 15' + 3 máquinas — 19:15–20:00». [Assumption: identidad de jefa de proyectos — lo que está en el calendario existe; lo que no, no.]
3. **Lun 07:45**: sale de la casa. Cero decisiones pendientes: la Cita ya existe. Nada de alarmas 06:30 apagadas cuatro veces — el slot es el que su cuerpo ya acepta (19:00–21:00).
4. **Lun 18:30**: el único mensaje del día: «A las 19:15 tienes la cita contigo. Si hoy la pega te come, responde MUEVE y la paso al miércoles 19:30 — sin explicaciones». (Sin culpa: la opción de fallar se ofrece antes de que exista.)
5. **Lun 19:15–20:00**: entrena. Al salir responde 1 tap «listo» → «Tu mensualidad ya estaba pagada: hoy recuperaste $11.660 de los $34.990 [Estimate: mensualidad Smart Fit Chile CLP 25.000–40.000, cifra exacta no publicada en smartfit.cl/planes; usar $34.990 como ejemplo rotulado]. Nos vemos el domingo para agendar la próxima.» Si respondió MUEVE, la cita ya quedó re-agendada al miércoles: **la Cita se mueve, nunca se rompe.**

### Por qué los intentos previos de Camila NO eran esto
Las 3 apps de rutinas le dieron el QUÉ (contenido); la alarma 06:30 le pidió voluntad en el peor slot; las zapatillas compraron identidad sin tocar el entorno; «partir el lunes» fue un fresh start sin cita. Ninguno instaló un slot en su calendario real, nadie defendió la decisión a las 19:00, y todos la dejaron sola frente a la culpa cuando fallaba. La Cita no es una app que ella abre: es un número de WhatsApp que le agenda y defiende el turno, y que convierte su frase más repetida («mañana parto») en el input del sistema.

### Demo en 5 minutos (datos sintéticos: «Camila sintética»)
1. **(1:00)** WhatsApp Web proyectado: conversación con Camila sintética. Domingo 20:00 — el bot pregunta. El fundador responde en vivo «mañana 19:15» y GLM-5.3 responde con confirmación en tono cero-culpa.
2. **(1:00)** Se muestra el **calendar invite generado en vivo** (Google Calendar): la cita aparece entre las reuniones de Camila sintética.
3. **(1:00)** Modo demo: el reloj salta a lunes 18:30 — el recordatorio **llega de verdad al teléfono de un jurado** (número allowlisted en el número de prueba de WhatsApp Cloud API).
4. **(1:00)** El jurado responde «MUEVE» → el sistema re-agenda y el calendario proyectado se actualiza solo: la cita del miércoles aparece. «Mover ≠ fallar» queda demostrado en vivo.
5. **(1:00)** Vista admin (Vercel): historial de «Camila sintética» con 6 semanas sintéticas — 11 visitas, 4 citas movidas, 0 cadenas rotas, y el reencuadre de mensualidad acumulada. **Plan B sin red (R6):** mismos 5 pasos con guiones pre-grabados + capturas (R2: static1 de respaldo en Cloudflare R2).

### Stack en 2 días + costo demo
- **Canal:** WhatsApp Cloud API con número de prueba de Meta (gratuito, hasta 5 destinatarios allowlisted: https://wati.io/en/blog/test-whatsapp-message-sends-safely) — el jurado recibe mensajes reales; fallback: Twilio trial sandbox. [Data]
- **Backend + webhooks:** Vercel (free tier). **LLM:** GLM-5.3 (free tier) para tono, parseo de respuestas en lenguaje natural y copy. **Assets/respaldo demo:** Cloudflare R2 (free tier). **Calendario:** .ics generado + Google Calendar API para el invite del demo.
- **Costo demo estimado: US$0** (todos free tiers; mensajes desde número de prueba sin costo). En producción, costo por mensaje utilitario en Chile de centavos [Estimate: tarifa de servicio/utilidad Chile US$0,02 por mensaje, vigente desde 01-oct-2026, con 1.000 mensajes/mes gratis por número — https://ekua.io/en/newsletters/whatsapp-pricing-october-2026, misma fuente y tarifa que unit-economics.md §0] (parche red team 12-oct: corrige la cita vieja «desde jul-2025»).

### Qué se deja fuera A PROPÓSITO
- **Rutinas y contenido** — prohibido por el caso (3 apps ya fracasaron) y por diseño: el QUÉ lo trae resuelto.
- **Rachas, puntos, badges, comparación social** — una racha rota es culpa institucionalizada; el caso dice que la culpa le quita las ganas de ir.
- **App nativa, login diario, feed** — el caso muestra una app que «abre y cierra sin ir»: no construimos otra.
- **Dinero, descuentos, gamificación financiera** — la plata no es su problema (y jugar con precio está vetado).
- **Match social / buddies** — ese es el mecanismo de la Propuesta 1.b; La Cita es deliberadamente individual porque su ventana es dispersa y el social añade fragilidad de coordinación. [Opinion]
- **Trackers corporales, peso, fotos de progreso** — métricas de cuerpo = material de culpa; nada que medir le va a hacer ir más.
- **Sugerir cambiar de gym o darse de baja** — «si me salgo, no vuelvo nunca»: la membresía es el ancla, no el problema.

### Riesgos
- **Compliance (R4):** si Camila menciona dolor («me duele la espalda»), el flujo deriva a kinesiólogo/médico deportólogo y no prescribe ejercicio contra dolor (scoring-contract §R4, Caso 1). El LLM opera con guardrails de tono y de contenido médico. **R2:** demo 100% con Camila sintética; cero datos personales.
- **Build:** aprobación de plantillas de WhatsApp (utility) puede tardar → fallback Twilio trial + plantillas genéricas; el invite de calendario via .ics funciona sin approval. Riesgo de tono del LLM → test suite mínimo de 20 respuestas adversas («hoy no pude», «me da vergüenza el gym», «me duele la espalda») antes del demo.
- **Credibilidad ante el jurado:** «¿por qué no basta el calendario manual?» → porque el manual carga toda la friccia a las 23:55 del domingo, el peor momento de autocontrol; el sistema captura el fresh start antes de que muera y defiende la cita sola. «¿Y si ignora los mensajes?» → el mensaje no es el mecanismo; el **invite en su calendario laboral** es el mecanismo (no se borra con silencio).

### Auto-score D1–D7
| Dim | Pts | Justificación |
|---|---|---|
| D1 | 9 | Ataca la cadena causal completa del análisis: plan sin anclaje (II + cita), decisión diaria en caliente (default), culpa (re-agendado cero-culpa). |
| D2 | 8 | Usa la infraestructura mental que ya obedece (su calendario) y el canal que ya habita; no exige motivación nueva ni autocontrol extra. Techo: 6 visitas/10 meses y ventana dispersa. |
| D3 | 9 | Loop WhatsApp→LLM→.ics→recordatorio es un fin de semana exacto con free tiers; sin integraciones con el gym. |
| D4 | 8 | Mensaje real al teléfono de un jurado + invite en vivo + MUEVE re-agendando: dramático y verificable; plan B sin red obligatorio (R6). |
| D5 | 7 | Ocupa el eje "logística de asistencia" que las apps de contenido (retención ~3% al día 30 [Data, direccional]: https://usatoday.com/press-release/story/39808/fitness-refined-releases-2026-report-on-why-fitness-app-users-quit) y el propio gym no atienden; riesgo: el gym puede copiarlo mañana. |
| D6 | 9 | Demo US$0 (número de prueba + free tiers); unit economics post-demo a centavos por usuario-semana. [Estimate] |
| D7 | 7 | 1,05M socios en Chile con ~50% de abandona a 6 meses [Data]: https://mercadofitness.com/se-publico-radiografia-sector-gimnasios-chile/ · https://gitnux.org/gym-membership-statistics — cada socio retenido es mensualidad salvada para el gym y hábito ganado para el socio. |

---

## Propuesta 1.b — «Quedamos»

### Pitch en una línea
La amiga de Camila falló por **logística**, no por apoyo — «Quedamos» le pone al gym una quedada fija con alguien real, y un sistema que se hace cargo de toda la coordinación que ninguna amiga puede sostener sola: la hora, los avisos, el re-agendado y el reemplazo.

### Mecanismo
**Qué hace que el hábito cambie:** convertir el no-ir de un acto invisible en el incumplimiento de una cita con una persona de carne y hueso que la espera en la puerta — sin cargarle a Camila NI un gramo de coordinación NI un gramo de culpa: si algo se cae, el sistema avisa, re-agenda o reemplaza, y "fallar" simplemente no existe en el vocabulario del producto.

**Principios con fuente:**
- **Compromiso social / adherencia con acompañante:** entrenar con otra persona mejora la adherencia a 12 meses frente a entrenar sola (estudio clásico con parejas de programas de ejercicio [Data, >18 meses]: https://pubmed.ncbi.nlm.nih.gov/8775648). Y la disposición de Camila existe: la amiga que la iba a acompañar es el intento previo que valida el deseo de compañía. [Assumption basada en texto]
- **Logística como condición del efecto social:** el caso demuestra que el apoyo sin logística muere (ventanas dispersas 19:00–21:00, «reuniones que se alargan», martes/jueves tarde). La contribución de diseño: el compromiso social solo funciona empaquetado con un sistema que fija hora, avisa y re-agenda. [Assumption — inferencia de diseño del caso]
- **Temptation bundling suave (capa, no mecanismo único):** amarrar un "want" compartido al turno — el audiolibro/serie que ambas siguen y que "se escucha en el gym". Efecto inicial +51% de visitas con acceso restringido al gym, con decaimiento en el tiempo (por eso es capa, no núcleo) (Milkman, Minson & Volpp 2014, Management Science 60(2) [Data, >18 meses]: https://ideas.repec.org/a/inm/ormnsc/v60y2014i2p283-299.html).
- **Fogg B=MAP** [Data]: https://bjfogg.com/behaviordesign — la quedada sube la Ability (no hay que decidir nada: la hora ya está, la persona ya está) y transforma el Prompt (a las 18:45 el prompt no es "acuérdate de ti", es "Josefa ya va en camino").
- **Sostén a 66 días con tolerancia al fallo** (Lally et al. 2009 [Data, >18 meses]: https://ucl.ac.uk/news/2009/aug/how-long-does-it-take-form-habit): el sistema re-agenda quedadas caídas sin romper nada ni exhibir fallos; la regla de oro es que ninguna de las dos se entera del "abandono" de la otra — solo del movimiento de la cita.
- **COM-B** (Michie et al. 2011 [Data, >18 meses]: https://discovery.ucl.ac.uk/1305716/1/1748-5908-6-42.pdf): ataca el déficit de **Oportunidad social** (nadie la espera) que La Cita (1.a) no toca; es la dimensión que su caso deja más clara cuando describe el intento de la amiga.

### Recorrido del usuario — un día real de Camila con Quedamos
1. **Dom 20:30** (después del cargo de mensualidad, antes del «23:55 mañana parto»): WhatsApp: «Camila: Josefa (34, también le pega la pega hasta tarde) suele ir lunes 19:30 al mismo gym. ¿Le digo que te espere en la entrada? [Quedamos lun 19:30] [Prefiero sola esta semana]». La propuesta de buddy sale de un pool con ventana y sede compatibles (matching simple por horario + sede).
2. **Lun 18:45**: «Josefa confirmó 19:30, entrada del gym Ñuñoa. Si la pega te come, responde MUEVE — aviso yo, tú no le explicas nada a nadie.» (La fricción de avisar/cancelar/renegociar la absorbe el sistema: ese es el seguro logístico.)
3. **Lun 19:30**: se encuentran en la puerta. 40 minutos: se turnan la elección de máquina; el resto lo hace la presencia del otro — ir ya no es una decisión de fuerza de voluntad, es una cita que ya existía todo el día en el calendario. [Opinion] El momento donde la amiga fallaba era JUSTO este: llegar o no llegar. Con quedada agendada, llegar es el default.
4. **Lun 20:15**: 1 tap «entrenamos» → «Semana 3 juntas. El audiolibro de esta semana: cap. 7 de "Los Espooki" — la seña es que nadie lo escucha fuera del gym.» (temptation bundling compartido + conversación incluida; el "want" de Camila es visible en el caso: delivery, series, «sin volverse fanática»).
5. **Jue 18:50** (el día en que llega tarde a la casa): Camila escribe «hoy no llego». El sistema le contesta a ella a los 10 segundos: «Listo, quedamos el sábado 11:00 — te aviso cuando Josefa confirme». Y a Josefa le manda OTRA cosa, sin drama ni reproche: «Camila movió la quedada al sábado 11:00. Si prefieres, el sábado quedas con Daniela (misma sede).» La quedada se mueve; ninguna de las dos carga el costo moral. Cero culpa de parte y cero culpa de testigo.

### Por qué los intentos previos de Camila NO eran esto
El intento con la amiga tenía el ingrediente social correcto y la envoltura incorrecta: dos agendas impredecibles coordinadas por WhatsApp entre dos personas cansadas a las 19:00. El caso lo dice sin decirlo: el apoyo no se cayó, se cayó la logística. Las 3 apps de rutinas ni siquiera tenían ingrediente social. Quedamos es lo único que el caso NO ha probado: **compromiso interpersonal + logística sistematizada** — el mismo apoyo que Camila ya aceptó una vez, pero con la coordinación residiendo en un sistema y no en su buena voluntad.

### Demo en 5 minutos (datos sintéticos: «Camila sintética» + «Josefa sintética»)
1. **(1:00)** Dos WhatsApp Web proyectados lado a lado: el teléfono de Camila sintética y el de Josefa sintética (buddy sintética, 34, misma sede, misma ventana).
2. **(1:00)** Domingo 20:30: el sistema propone la quedada; el fundador acepta por Camila sintética EN VIVO → los DOS teléfonos reciben la confirmación cruzada al segundo.
3. **(1:00)** Lunes 18:45 (modo demo): ambos teléfonos reciben «Josefa va en camino» / «Camila te espera a las 19:30, entrada». Se muestra el invite en el calendario de Camila sintética.
4. **(1:00)** Se simula la crisis del jueves EN VIVO: el fundador escribe «hoy no llego» por Camila → respuesta inmediata con re-agendado a sábado 11:00; EN EL OTRO TELÉFONO, Josefa recibe la versión sin culpa con opción de quedada alternativa con «Daniela sintética». La asimetría de mensajes (cero culpa de ambos lados) ES el producto.
5. **(1:00)** Vista admin (Vercel): mapa de quedadas sintéticas del pool (12 usuarias sintéticas, sede Ñuñoa, ventana 19:00–21:00) + regla de matching + guardrail R4: la respuesta del bot cuando Camila sintética menciona «me duele la espalda» → derivación a kinesiólogo. **Plan B sin red (R6):** guiones pre-grabados + capturas (R2: estático en R2).

### Stack en 2 días + costo demo
- **Canal:** WhatsApp Cloud API, número de prueba (2 de los 5 allowlisted hacen de Camila sintética y Josefa sintética; 2 para jurados; 1 fundador) — https://wati.io/en/blog/test-whatsapp-message-sends-safely. Fallback: Twilio trial.
- **Backend:** Vercel (free tier) — webhook, matching rule-based (ventana + sede + frecuencia objetivo; sin ML), cron de recordatorios. **LLM:** GLM-5.3 (free tier) para tono cero-culpa, parseo de respuestas en lenguaje natural y personalización de la capa de bundling. **Assets:** Cloudflare R2 (free tier). **Calendario:** .ics + Google Calendar.
- **Costo demo estimado: US$0** (free tiers íntegros; el pool de buddies en el demo es sintético con datos inventados y nombrados). En producción: costos de mensajería a centavos [Estimate] + el costo real de adquisición del pool de buddies [Assumption: vía alianzas con gimnasios o grupos existentes de socias].

### Qué se deja fuera A PROPÓSITO
- **Match por gustos/afinidad/nivel de fitness** — el match es SOLO logística: sede + ventana + constancia; la amistad es un bonus, no un requisito (menos fricción, más pool).
- **Dinero, loterías, premios** — pese a la evidencia (Patel/Asch/Volpp: https://eurekalert.org/news-releases/632592; Charness & Gneezy 2009: https://econometricsociety.org/publications/econometrica/2009/05/01/incentives-exercise), el caso veta jugar con precio y la plata no mueve a Camila: se descarta a propósito.
- **Red social, perfiles, fotos, rankings, likes** — cada capa social visible añade culpa potencial y fricción; solo nombre de pila + sede + ventana.
- **Rachas y contadores de asistencia** — ver 1.a: la racha rota es culpa institucionalizada.
- **Rutinas y contenido** — idéntica restricción del caso: el QUÉ ya lo tiene.
- **Chat abierto / mensajería libre entre buddies** — los mensajes son plantillas con propósito; el canal existe para la quedada, no para cuidar otro chat más.
- **Verificación de identidad / producción real del pool** — declarado fuera de scope del demo; en producción: opt-in explícito, nombre de pila, sede y bloqueo. [Assumption]

### Riesgos
- **Compliance:** R4 — derivación a kinesiólogo si hay dolor (guardrail mostrado en el demo). R2 — Camila y Josefa son sintéticas; en producción, privacidad por diseño: nunca se comparte contacto directo sin aceptación explícita de ambas; el sistema es intermediario de los mensajes logísticos, no de conversación personal. Riesgo de seguridad interpersonal (quedadas con desconocidas): en producción, verificación de membresía del mismo gym + sede pública + primer encuentro en la entrada; en el demo, declarado.
- **Build:** dos conversaciones simultáneas + matching rule-based + asimetría de mensajes = complejidad de estados; mitigación: una sola máquina de estados de quedada (propuesta → confirmada → recordatorio → realizada/movida) y mensajes plantilla. Riesgo de tono del LLM (culpa involuntaria): test suite adverso pre-demo (30 mensajes: cancelaciones, vergüenza, dolor, «me da lata»).
- **Credibilidad ante el jurado:** «¿de dónde salen las buddies?» (cold-start) → respuesta: se siembra con grupos de amigas existentes (el caso prueba la disposición: la amiga) y/o con el propio gym como buddy de reserva (staff de piso en horarios valle, que el gym AMA ofrecer porque llena la sala). «¿Y si la buddy es inconsistente?» → el seguro logístico ES el producto: reemplazo del pool + quedada alternativa; el fallo de una no mata la de la otra. «¿no es la amiga otra vez?» → la amiga dependía de la buena voluntad de dos personas; Quedamos depende de la fricción cero de un sistema.

### Auto-score D1–D7
| Dim | Pts | Justificación |
|---|---|---|
| D1 | 8 | Ataca la dimensión COM-B que 1.a no toca (Oportunidad social) con la tesis exacta del caso: el apoyo existía, la logística no; no cubre por sí sola el loop de culpa. |
| D2 | 8 | La evidencia de adherencia con acompañante + el caso (aceptó a la amiga) hacen creíble el cambio; el cold-start del pool y la fragilidad de terceros bajan el techo. |
| D3 | 8 | Matching rule-based + dos conversaciones plantilla es constrible en 2 días; la complejidad real es la máquina de estados de la quedada, acotada. |
| D4 | 9 | Dos teléfonos con la crisis del jueves resuelta en vivo y sin culpa es el momento más memorable del demo; riesgo: doble simulación en vivo exige ensayo y plan B sin red. |
| D5 | 7 | Nadie compite en "logística social de asistencia" (apps de contenido retenidas ~3% al día 30 [Data, direccional]: https://usatoday.com/press-release/story/39808/fitness-refined-releases-2026-report-on-why-fitness-app-users-quit); pero el gym mismo podría copiar con su propia comunidad. |
| D6 | 9 | Demo US$0 con free tiers; unit economics de producción dependen de adquisición del pool (mayor costo que 1.a, asumido por el lado del gym). [Estimate] |
| D7 | 7 | Mismo mercado de 1,05M socios y ~50% de abandona [Data]: https://mercadofitness.com/se-publico-radiografia-sector-gimnasios-chile/ · https://gitnux.org/gym-membership-statistics; además resuelve el problema del gym (salas vacías en horario valle) y podría vendérsele a los gimnasios. [Opinion] |

---

## Comparativa rápida para la decisión del equipo

| | **La Cita (1.a)** | **Quedamos (1.b)** |
|---|---|---|
| Mecanismo núcleo | Implementation intentions + default + fresh start capturado (individual) | Compromiso social + logística asegurada + bundling como capa (interpersonal) |
| Canal | WhatsApp (recibe) + calendario (existe) | WhatsApp (recibe) + calendario |
| Lo que NO exige de Camila | Decidir en caliente, abrir apps, tener culpa | Coordinar, avisar, explicar, sentir culpa |
| Riesgo mayor | "¿Y si ignora el mensaje?" (mitigado: el invite es el mecanismo) | Cold-start del pool de buddies (mitigado: gym como buddy de reserva) |
| Demo | Mensaje real al jurado + re-agendado en vivo | Dos teléfonos + crisis del jueves resuelta en vivo |

**Recomendación** [Opinion]: construir **La Cita (1.a)** como MVP principal — mecanismo más limpio, demo más corta, dependencia de terceros cero — y **Quedamos (1.b)** como roadmap visible en el pitch: "La Cita resuelve el slot; cuando el slot sostenga, Quedamos le pone gente dentro". Ambas comparten el mismo stack y la misma base de código de mensajería: si el tiempo alcanza, 1.b puede esbozarse en vivo con la conversación de Josefa sintética.

---

## Flags

- **Yellow — Precio de mensualidad no verificado:** la cifra $34.990 de Smart Fit Chile es [Estimate] de rango de mercado low-cost (CLP 25.000–40.000); smartfit.cl/planes no publica montos en el extracto (12-oct-2026). Antes del demo: confirmar precio real o usar "tu mensualidad" sin cifra.
- **Yellow — Fuente secundaria:** el dato 63% abandona antes del 3er mes / <4% al año (Sperandei et al.) se cita vía https://getfitcraft.com/es/science/workout-adherence-statistics y el 3% día 30 de apps es press-release (Fitness Refined): ambos direccionales, no peer-reviewed, no usar como claim duro ante el jurado.
- **Yellow — Gap de dato local:** no encontré churn específico de gimnasios chilenos (Radiografía 2024 no lo publica); cifras de deserción usadas son globales/EE.UU. como proxy.
- **Yellow — Datos >18 meses:** toda la literatura canónica citada (Gollwitzer 2006, Milne 2002, D&M 2006, Milkman 2014, Dai 2014, Charness 2009, adherencia con acompañante, Lally 2009, Michie 2011) y las cifras de mercado (Mercado Fitness 2024, ENS 2016-17) superan los 18 meses; marcado inline en cada uso.
- **Yellow — Asumpción de diseño crítica:** que un invite en el calendario del trabajo se respete como se respetan las reuniones es [Assumption] central de 1.a, derivado de su rol de jefa de proyectos, no probado con esta persona; mitigable en el pitch presentándolo como hipótesis a validar.
- **Red — ninguna.**
