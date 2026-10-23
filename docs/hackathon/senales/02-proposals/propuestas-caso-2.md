# Propuestas de MVP — Caso 2 (Rodrigo, sueño en turnos rotativos)

*Investigación pre-evento Hackatón Señales · 2026-10-12 · Protocolo de honestidad: claims etiquetados [Data] (con URL), [Estimate] (con supuestos), [Assumption], [Opinion]. Compañero de este archivo: `01-cases/caso-2-analisis.md` (causas-raíz, evidencia y restricciones duras).*

**Éxito verbatim del caso: "que duerma una hora más".** Ambas propuestas son WhatsApp-first (canal nativo del caso: 89,7% de uso de internet en Chile [Data: GWI Q2 2025 vía https://marketing4ecommerce.cl/uso-de-redes-sociales-en-chile/]), ninguna depende de wearable ni de horario fijo, y ambas incluyen derivación a médico del sueño (R4). **Mecanismos conductulares distintos por diseño:** la 2.a ataca el *cierre cognitivo* (preocupación pre-sueño + compromiso diádico); la 2.b ataca el *tiempo fisiológico* (cronofarmacología de la cafeína + contramedidas circadianas por turno). No son variantes cosméticas: si Rodrigo solo tuviera una de las dos adicciones comportamentales, la otra propuesta seguiría existiendo igual.

---

### Propuesta 2.a — Cierre de Guardia

**Pitch en una línea.** Un compañero de WhatsApp que convierte la guardia en un traspaso formal: Rodrigo "cierra el turno" antes de acostarse, el grupo queda avisado, la cabeza se apaga — y su pareja, testigo del ronquido, arma el expediente para el médico del sueño.

**Mecanismo (QUÉ hace que duerma una hora más).**
El bloqueo no es "no poder dormir": es «**si no reviso los tickets antes de acostarme, igual no me duermo**» — revisión abierta, sin fin, que mantiene al cerebro en modo vigilancia dentro de la cama. El producto la reemplaza por un ritual de cierre de 3 minutos por WhatsApp, *a la hora que toque según el turno de esa semana* (sin horario fijo: la hora la calcula el bot con el cronograma que Rodrigo le reenvía). Principio conductual: **postergación programada de la preocupación** (Borkovec 1983; RCT lista de espera: https://pmc.ncbi.nlm.nih.gov/articles/PMC11303915/; reducción ~15 min/día de preocupación: https://www.tandfonline.com/doi/full/10.1080/08870446.2025.2590072) + **control de estímulo del sueño** (la cama vuelve a ser cama, no NOC). El traspaso al grupo real de guardia convierte la frase «si me desconecta, algo se va a caer» en un riesgo *gestionado*: el grupo queda formalmente notificado → dormir es objetivamente más seguro que hojear tickets a oscuras. Refuerzo con **intenciones de implementación** (Gollwitzer & Sheeran 2006, d=0,65: https://psycnet.apa.org/record/2007-19538-002): el bot le hace ensayar su plan "si suena el grupo después del cierre, entonces…". La hora se gana en latencia (menos rumsinación pre-sueño) y en adelantar la luz apagada (el cierre pone un punto final en vez del notebook a las 23:58) [Estimate: ~10-15 min de latencia + ~15 min de notebook + menos despertares por revisión nocturna; varianza individual alta, medido por auto-reporte de 10 s cada mañana].

**Recorrido del usuario — una semana real de Rodrigo (semana de recambio día→tarde→noche):**
1. **Dom 20:30, semana de día terminando:** Rodrigo le reenvía al bot la foto/captura del cronograma que mandó el jefe ("sem. 42: tarde"). GLM-5.3 lo parsea, responde: "Semana de tarde: cierre de guardia 23:30, tu plan si-entonces queda igual. ¿Confirmamos?" — un mensaje, cero setup.
2. **Mar 22:50, semana de tarde:** saliendo del trabajo, el bot pregunta "¿cierre ahora o 23:30?". Rodrigo manda "cierro": el bot le hace cerrar 3 cosas en una plantilla de texto (ticket crítico / pendiente para mañana / cosa que te ronda la cabeza) y **publica el resumen en el grupo real de guardia** (mensaje que él ya redacta hoy a mano, solo que desordenado y sin fin). Le contesta: "Traspaso avisado. Baja la guardia." Rodrigo deja el notebook a las 23:15, no a las 23:58.
3. **Vie 23:59:** suena el grupo real de guardia después del cierre. El bot (que no bloquea nada — el celular se queda en la pieza) le recuerda su plan ensayado: "menciones directas sí, hilo nuevo no". Rodrigo contesta una mención en 2 minutos y vuelve a la cama sin abrir el ticket entero.
4. **Sáb 09:10, recambio a semana de noche:** nuevo cronograma: "sem. 43: noche". El bot recalcula TODO: cierre de guardia 07:50 (post-turno), despertador objetivo 15:40, café cortado en el turno a las 02:00 (no 04:30). Cero fricción: Rodrigo no configura nada, solo reenvió una foto.
5. **Dom 15:30, resumen semanal con la pareja:** su pareja ya respondió 4 micro-encuestas matinales ("¿roncó anoche? 🟢/🔴", 5 segundos). El bot muestra la semana: "Cerraste 6/7 días · dormiste ~40 min más los días con cierre · ronquido reportado 5/7 noches ⚠️". Con 2 semanas de ronquido persistente + cansancio, activa el flujo R4: **"Esto no es un diagnóstico — es un expediente de 1 página para un médico del sueño. ¿Te lo armo?"** (Sí → PDF con reportes de pareja, patrón de sueño por turnos, y lista de qué decir en la consulta).

**Por qué los intentos previos de Rodrigo NO eran esto.**
- Melatonina: química sin estructura — no le daba *dónde* poner el sueño ni cerraba la vigilancia. Cierre de Guardia ataca la vigilia, no el reloj.
- Celular fuera de la pieza: le pedía renunciar a guardia/despertador/trabajo — imposible de sostener. Aquí el celular es el *instrumento* del ritual, dentro de la pieza.
- Reloj: medía sin mecanismo ("dormiste 5h12" no cambia nada). Aquí el único dato que se pide es el que gatilla una acción: el cierre y el reporte de la pareja.
- Y el trasfondo: ninguna herramienta tocaba a **su pareja**, la única testigo del ronquido y —según la literatura de apnea— el primer detector real del problema (https://pmc.ncbi.nlm.nih.gov/articles/PMC5663292/).

**Demo en 5 minutos (datos sintéticos: "Rodrigo sintético", "pareja sintética", grupo de guardia sintético — R2, cero datos personales).**
1. (0:00-0:45) Contexto en una lámina: la frase del caso «si no reviso los tickets antes de acostarme, igual no me duermo» + el error de las 3 AM.
2. (0:45-2:00) EN VIVO en el teléfono proyectado: Rodrigo sintético reenvía el cronograma de la semana; el bot responde con el plan recalculado (semana de tarde). Se reenvía otro cronograma (semana de noche) y el jurado ve el plan mutar solo — "nunca dos semanas iguales" resuelto en 10 segundos.
3. (2:00-3:30) El cierre: Rodrigo sintético manda "cierro" → plantilla de 3 líneas → mensaje de traspaso visible en el grupo sintético → respuesta "Baja la guardia".
4. (3:30-4:30) El reporte matinal de la pareja sintética (1 tap: roncación 🔴) y el resumen semanal: "cerraste 6/7 · +40 min promedio" + banner de derivación: "expediente para médico del sueño listo en PDF".
5. (4:30-5:00) Cierre: "de dónde sale la hora" — latencia + notebook + despertares, medidos con una pregunta diaria de 10 segundos, no con un reloj del cajón.
*Plan B sin red del venue (R6): la misma conversación pre-grabada con webhook simulado en local (respuestas cacheadas en el teléfono vía modo avión + app espía de la conversación); el PDF de derivación generado estático.*

**Stack en 2 días + costo demo estimado.**
- **Día 1:** WhatsApp Cloud API número de prueba (hasta 5 destinatarios verificados [Data: https://wati.io/en/blog/test-whatsapp-message-sends-safely]) + webhook en Vercel (Hobby, free [Data: https://vercel.com/docs/plans/hobby]) + prompt de GLM-5.3 para parseo de cronograma (texto/foto→JSON de turnos) + flujo de cierre (2 templates de texto).
- **Día 2:** flujo de pareja (micro-encuesta), resumen semanal, generador del PDF de derivación (R4), datos sintéticos del Rodrigo sintético, plan B offline, guion.
- R2 para estados/contenido (free tier: 10 GB, egress $0 [Data: https://developers.cloudflare.com/r2/pricing/]); GLM-5.3 provisto por el evento; WhatsApp: conversaciones iniciadas por el usuario = $0 (ventana 24 h [Data: https://help.twilio.com/articles/30304057900699-Notice-Changes-to-WhatsApp-s-Pricing-July-2025]).
- **Costo demo total: US$0** [Estimate: ~15-30 mensajes dentro de ventanas de servicio (gratis) + ~10 llamadas GLM de <2k tokens (0 si el evento provee la API; <US$0,01 a tarifa lista de $1,40/1M in [Data: https://usagepricing.com/blueprint/zhipu-ai])].

**Qué se deja fuera A PROPÓSITO.**
- Cualquier forma de seguimiento del sueño con sensores/wearables (el caso lo mata: reloj en el cajón).
- Rutinas fijas de dormir (el cronograma rota; el producto *recalcula*).
- Bloquear o silenciar el grupo de guardia (la guardia es innegociable; se cambia el rol, no el canal).
- Diagnóstico de apnea o consejo médico (R4: señaliza y deriva, jamás diagnostica).
- Funciones de equipo/jefe/analytics B2B (el comprador futuro es el empleador, pero el MVP es 1 persona).
- App nativa, onboarding con password, mapa de sueño, toneladas de contenido educativo (no es problema de conocimiento).
- Inglés (Chile primero: español nativo con jerga de soporte TI: "cierre", "traspaso", "NOC").

**Riesgos.**
- *Compliance:* ninguna advice médico/salud en el bot; derivación explícita; datos 100% sintéticos en el demo (R2); en producción el mensaje nocturno iniciado por el bot exige plantilla utility aprobada por Meta (el demo vive dentro de la ventana de 24 h iniciada por el usuario, $0).
- *Build:* parseo de cronogramas desordenados — mitigado con GLM parseo libre + confirmación en 1 tap ("¿semana de tarde? ✅"); el envío al grupo real de guardia queda como "mensaje redactado para que tú mandes" en el MVP (menos permisos, mismo efecto conductual).
- *Credibilidad ante el jurado:* el mayor ataque será "+40 min ¿de dónde?". Respuesta honesta: es auto-reporte sintético del demo; la mecánica real se apoya en latencia por postergación de preocupación + adelantar el apagado; el producto mide su propia hora con una pregunta diaria, no promete un número mágico (los efectos de apps sobre TST son pequeños, g=0,33 [Data: https://pubmed.ncbi.nlm.nih.gov/39213858/] — la hora viene de las palancas, no del hecho de existir la app).

**Auto-score D1-D7 (0-10).**
| Dim. | Score | Justificación |
|---|---|---|
| D1 | 9 | Ataca la frase más reveladora del caso («si no reviso los tickets… no me duermo») y el miedo real («si me desconecto algo se va a caer») con el mismo mecanismo. |
| D2 | 8 | Usa el canal que ya usa a las 3 AM y a las 8 AM; el traspaso reduce el miedo en vez de negarlo; la pareja entra con motivación propia. |
| D3 | 8 | 2-3 flujos conversacionales, 1 PDF, 1 parser — alcanzable en 2 días con agentes de IA; el envío automático al grupo real queda fuera a propósito. |
| D4 | 8 | WhatsApp proyectado en vivo es vívido; el giro "cronograma→plan que muta" es el momento memorable del demo; dependencia de red cubierta con plan B offline. |
| D5 | 7 | Ninguna dCBT-I de turno full cubre a shift workers con guardia (las establecidas los excluyen [Data: https://aasm.org/digital-cognitive-behavioral-therapy-for-insomnia-platforms-and-characteristics/]); el "cierre de NOC" es lenguaje nativo TI difícil de copiar genéricamente. |
| D6 | 9 | 100% free tier verificado; costo demo US$0; costo marginal por usuario real ≈ 0 dentro de ventanas iniciadas por el usuario. |
| D7 | 7 | Cada guardia de TI/salud/operaciones en Chile es un Rodrigo; comprador natural B2B (empleador) pero el MVP funciona 1-a-1 sin empresa de por medio. |

---

### Propuesta 2.b — Aterrizaje

**Pitch en una línea.** El bot que convierte el cronograma de turnos en un plan de aterrizaje diario: hora de corte de café, plan de luz/oscuridad y audio anti-rumia recalculados cada vez que el turno rota — la farmacocinética y el reloj biológico de Rodrigo, en vez de la voluntad de Rodrigo.

**Mecanismo (QUÉ hace que duerma una hora más).**
Dos palancas cuantificadas que no requieren NINGUNA disciplina horaria fija, porque se recalculan por turno:
1. **Cronofarmacología de la cafeína:** «sin café no funciono» y el "tercer café 19:20" son el patrón clásico del rotativo: la cafeína media cerca de la cama cuesta ~45 min de tiempo total de sueño y +9 min de latencia; un café exige ≥8,8 h de distancia pre-cama (Gardiner et al. 2023, meta 24 estudios: https://pubmed.ncbi.nlm.nih.gov/36870101/; vida media 5-6 h según NIOSH: https://archive.cdc.gov/www_cdc_gov/niosh/work-hour-training-for-nurses/longhours/mod6/11.html). El bot NO prohíbe café: le dice a qué hora es el ÚLTIMO turno de la taza según el turno de esa semana (tarde→corte 15:15; noche→café solo en la primera mitad del turno; día→corte 14:00 si acuesta 23:00). [Estimate: hasta ~45 min recuperables/día; es la palanca individual más grande de su semana.]
2. **Contramedidas circadianas de "adaptación parcial" + *Serial Diverse Imagining* (cognitive shuffle):** para rotativos la evidencia NO busca adaptación completa (imposible con rotación semanal) sino posición de compromiso: oscuridad programada al dormir post-noche, gafas oscuras al salir del turno, "freno de luz", y una ventana de sueño ancla que se recalcula con el roster (Eastman et al.: https://pubmed.ncbi.nlm.nih.gov/10344580/; https://journals.sagepub.com/doi/10.1177/0748730409332068; NIOSH siesta ≤30 min para el bajón de la noche: https://stacks.cdc.gov/view/cdc/201028). Para el momento de acostarse con la cabeza prendida: audio de 4 min de imágenes neutras desconectadas (SDI, Beaudoin 2014; estudio 154 estudiantes: https://www.bbc.com/future/article/20260311-cognitive-shuffling-the-micro-dreaming-technique-that-helps-your-brain-to-rest), generado por GLM-5.3, **sin pantalla**, a pedido ("audio"). El modelo de fondo: **sleep scheduling for shift workers** + contramedida farmacológica del despertar, envueltas en **COM-B** (oportunidad física rediseñada por turno: Michie et al. 2011: https://discovery.ucl.ac.uk/1305716/1/1748-5908-6-42.pdf).

**Recorrido del usuario — una semana real de Rodrigo (semana de recambio día→tarde→noche):**
1. **Dom 20:15, fin de semana de día:** Rodrigo reenvía el cronograma ("sem. 43: tarde"). Aterrizaje responde con el plan de esa semana: "Tarde: 🚫 café desde 15:15 · ☀️ luz fuerte apenas despiertes 10:00 · 🛬 aterrizaje 23:00 · ancla 07:00". Nada de "rutina ideal": números que cambian con la foto.
2. **Mié 15:10, semana de tarde:** el bot manda el único recordatorio del día: "Última taza de la tarde: AHORA ☕ (te toca dormir 23:00; con 8,8 h de runway, este es tu último café). Rodrigo "sin café no funciono" toma su café — pero a la hora correcta, y el bot no lo vuelve a molestar.
3. **Vie 23:40:** Rodrigo se mete a la cama con la cabeza en el ticket del día. Manda "audio" → 4 min de imágenes desconectadas narradas con voz tranquila (sin pantalla, celular boca abajo). Latencia abajo, y el fin de semana llega el recambio: cronograma nuevo: "sem. 44: noche 🌙".
4. **Lun 06:50, primer salida del turno noche:** plan de aterrizaje invertido en tiempo real: "Gafas oscuras para el auto 🕶 (frena la luz que le dice al cerebro que es día) → pieza a oscuras → 🚫 café desde las 02:00 ya se cumplió → 🛬 ventana 08:00-15:00, audio si no te baja el cerebro". La siesta de 25 min antes del turno está en el plan del jueves (bajón circadiano 03:00-04:00).
5. **Dom 16:00, resumen:** "Semana de noche: corte de café cumplido 5/7 · aterrizajes 6/7 · te dormiste ~50 min antes los días con corte ☕✅. Pareja reporta ronquido fuerte otra semana ⚠️ → tu expediente para el médico del sueño sigue listo." (R4 visible en el mismo resumen, sin diagnósticos.)

**Por qué los intentos previos de Rodrigo NO eran esto.**
- Melatonina: la sustancia sin el plan de luz/café/oscuridad no sabe hacia dónde empujar — en turnos, melatonina funciona *combinada* con programas de luz/oscuridad (Burgess et al.: https://stacks.cdc.gov/view/cdc/200985), exactamente lo que le faltó.
- Celular fuera de la pieza: hábito blanco/negro sin calendario; Aterrizaje usa el celular para entregar el plan *en el momento exacto* (el recordatorio del café llega a las 15:10 del miércoles, no "recuerda dormir bien").
- Reloj: trataba de *medir* lo que Aterrizaje *recalcula*: el reloj decía "5h12" a posteriori; el bot mueve el café y la luz ANTES de que se pierda la hora.
- Lo que ningún intento tenía: el turno como INPUT del sistema. Sus intentos asumían una vida con horario estable; Aterrizaje asume la rotación como el dato maestro.

**Demo en 5 minutos (datos sintéticos: "Rodrigo sintético", cronogramas sintéticos de la "Empresa Sintética SpA" — R2).**
1. (0:00-0:45) Lámina: la semana del caso — tercer café 19:20, notebook 23:58, 5-6 h por 14 meses — y la matemática: "su café del lunes estaba a 5 h de su cama: 3,8 h dentro de la zona de daño [Data: https://pubmed.ncbi.nlm.nih.gov/36870101/]".
2. (0:45-2:15) EN VIVO: Rodrigo sintético reenvía el cronograma de la semana de tarde → el plan aparece. Se reenvía el de semana de noche → el plan MUTA en pantalla (café, luz, gafas, ventana). Este es el momento del demo: la solución gira con el turno, nadie más hace eso.
3. (2:15-3:15) El recordatorio del café en vivo (15:10 simulado) + el "audio" pedido por WhatsApp: el jurado ESCUCHA 20 segundos del audio SDI generado por GLM-5.3 en español de Chile, sin pantalla.
4. (3:15-4:15) El resumen semanal con el desglose honesto: "dónde están tus ~50 min" (café cortado / aterrizaje / audio) + el banner R4 del expediente para el médico del sueño (PDF con reportes de la pareja sintética).
5. (4:15-5:00) Cierre: "no le pedimos disciplina, le pedimos una foto por semana. El turno rota; el plan rota con él."

**Stack en 2 días + costo demo estimado.**
- **Día 1:** mismo riel que 2.a (WhatsApp Cloud API test number + webhook Vercel + GLM-5.3 parseo de cronograma) + motor de reglas por turno (tabla pura: café/luz/gafas/siesta/audio por tipo de turno — determinística, sin IA, para que falle nunca) + plantillas de los 3 mensajes diarios.
- **Día 2:** generación del audio SDI (GLM-5.3 escribe la secuencia → TTS de 4 min, cacheado en R2), resumen semanal, flujo R4 del expediente, datos sintéticos, plan B offline (conversaciones pre-grabadas + audios cacheados localmente).
- R2 free tier para audios (4 min MP3 ≈ 2 MB, lejos del límite de 10 GB [Data: https://developers.cloudflare.com/r2/pricing/]).
- **Costo demo total: US$0-0,05** [Estimate: mensajes $0 dentro de ventanas de servicio; ~20 llamadas GLM-5.3 de ~1-3k tokens para plan/parseo ≈ 60k tokens in + 30k out ≈ US$0,21 a tarifa de lista ($1,40/$4,40 por 1M [Data: https://usagepricing.com/blueprint/zhipu-ai]) — $0 si el evento provee la API como indica el presupuesto; TTS con voz del sistema = $0].

**Qué se deja fuera A PROPÓSITO.**
- Terapia de luz con lámparas de 10.000 lux (funciona, pero exige compra: rompe US$0 y añade un objeto que acabarí… como el reloj — en su lugar, luz solar directa y gafas oscuras, que ya tiene).
- Adaptación circadiana "completa" al turno noche (imposible con rotación semanal y mala para su vida familiar: la evidencia apunta a compromiso parcial [Data: https://journals.sagepub.com/doi/10.1177/0748730409332068]).
- Dietas, suplementos, melatonina (requiere indicación médica — fuera; R4 manda).
- Seguimiento del sueño por sensor o diario largo (una pregunta de 10 s, o nada).
- Diagnóstico de apnea (el ronquido entra como *señal* hacia el expediente de derivación R4, no como conclusión).
- Modo grupal/equipo, análisis B2B, inglés, app nativa, notificaciones de "motivación".

**Riesgos.**
- *Compliance:* nada de consejos de dosificación farmacológica — el bot solo mueve el *timing* de algo que él ya consume (café) y usa contramedidas conductuales; disclaimer permanente "no es consejo médico"; R4 (apnea) en el resumen semanal; R2 (datos sintéticos) en todo el demo.
- *Build:* el TTS en español de Chile con calidad natural es el riesgo técnico n°1 — mitigado cacheando 3-4 audios la noche antes y con SDI "texto en pantalla" como fallback; el motor de reglas determinista por turno es a propósito (menos GLM en runtime = menos modos de falla en vivo).
- *Credibilidad ante el jurado:* "¿y si Rodrigo ya probó apps?" — respuesta: las apps de sueño están construidas sobre días iguales (dCBT-I los excluye por diseño [Data: https://aasm.org/digital-cognitive-behavioral-therapy-for-insomnia-platforms-and-characteristics/]); el recordatorio de las 15:10 no existe en ninguna porque ninguna parsea el roster. El riesgo de honestidad es el mismo de 2.a: prometer "+45 min" como garantía — se declara como efecto medio con varianza individual, medido con la pregunta diaria de 10 s.

**Auto-score D1-D7 (0-10).**
| Dim. | Score | Justificación |
|---|---|---|
| D1 | 8 | Ataca causa-raíz 1 y 2 (estructura + café) con las dos cifras más duras del caso (8,8 h; ~45 min), aunque el componente "identidad normalizada" queda menos cubierto que en 2.a. |
| D2 | 7 | No le quita el café ni le exige rutina: mueve el timing y le da un plan gratis cada semana; el riesgo es que el plan de luz/gafas suene "salud" y lo filtre como consejo genérico más. |
| D3 | 8 | Motor de reglas determinista + 3 plantillas + TTS cacheado: muy alcanzable; el TTS es la única pieza no trivial y tiene fallback. |
| D4 | 9 | "El plan que muta con el cronograma" + el audio SDI escuchado en vivo son los 2 momentos más demostrables del hackatón; motor determinista = pocos modos de falla en escenario. |
| D5 | 7 | Precedente académico (SleepSync de Monash https://pmc.ncbi.nlm.nih.gov/articles/PMC10064476/) valida el enfoque pero también muestra que alguien puede iterarlo; el diferencial es WhatsApp + español + guardia, no la ciencia. |
| D6 | 9 | Free tier completo; el TTS cacheado evita costos y latencia; costo marginal por usuario casi 0 (audios cacheados compartidos por turno). |
| D7 | 7 | Aplica a todo rotativo con café (enfermería, minería, transporte, TI); mismo techo B2B de 2.a: el comprador grande es el empleador. |

---

## Decisión recomendada (para el equipo)

[Opinion] **Construir 2.a (Cierre de Guardia) como propuesta central y robarle a 2.b el recordatorio de corte de café** (que es una regla determinista de 1 tabla y cabe en el día 2 sin cambiar la identidad del producto). Razones: D1 y D2 — el jurado pregunta "¿con cuál cambiaría ESTA persona?": el miedo de Rodrigo («si me desconecto algo se va a caer») y su frase de insomnio («si no reviso los tickets… no me duermo») viven en el cierre, no en la farmacocinética; y el flujo de la pareja→R4 solo existe completo en 2.a. El plan que muta con el cronograma (lo mejor de 2.b) se conserva como la primera capa de 2.a (ya está en su recorrido, paso 1 y 4). Riesgo de la fusión: alcance — mantener el corte de café como UNA línea del plan semanal, no como sistema paralelo.

## Flags

**Yellow:**
1. **Cronogramas por foto:** el parseo por imagen (OCR multimodal) no fue verificado en estas búsquedas para GLM-5.3 específicamente; el MVP acepta texto y foto con confirmación en 1 tap, y la demo usa texto — riesgo declarado de build.
2. **TTS español de Chile:** no verifiqué disponibilidad/voz de TTS natural gratuito en el stack propuesto; el plan B (SDI en texto + audio cacheado la noche antes) reduce el riesgo a cero para la demo, pero es un gap declarado para producción.
3. **"~45 min de café" y "8,8 h de corte"**: efectos promedio de meta-análisis en poblaciones no-rotativas [Data: https://pubmed.ncbi.nlm.nih.gov/36870101/]; aplicados a un rotativo crónicamente privado son [Assumption] razonable pero no medida directa en Rodrigo — el pitch lo declara como palanca medida por el propio producto, no como promesa.
4. **WhatsApp número de prueba:** solo 5 destinatarios verificados y plantilla pre-aprobada única (`hello_world`) [Data: https://wati.io/en/blog/test-whatsapp-message-sends-safely]; la demo se diseña íntegramente dentro de ventanas de 24 h iniciadas por el "Rodrigo sintético" (gratis [Data: https://help.twilio.com/articles/30304057900699-Notice-Changes-to-WhatsApp-s-Pricing-July-2025]) — todo mensaje nocturno iniciado por el bot en producción requerirá plantilla utility aprobada (post-evento).
5. **Efecto de apps sobre TST es pequeño (g=0,33)** [Data: https://pubmed.ncbi.nlm.nih.gov/39213858/]: ambas propuestas anclan la hora en palancas estructurales medidas por el propio producto; el pitch NO debe presentar la app como causa de la hora, sino el plan como causa y la app como vehículo.

**Red:** ninguna. Ambas propuestas cumplen R2 (solo datos sintéticos), R4 (derivación visible en los dos flujos), R6 (plan B offline) y las restricciones del caso (sin wearable, sin horario fijo, celular adentro).
