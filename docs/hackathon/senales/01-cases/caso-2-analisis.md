# Caso 2 — Rodrigo, 41, Concepción: análisis conductual del sueño en turnos rotativos

*Investigación pre-evento Hackatón Señales · 2026-10-12 · Protocolo de honestidad: todo claim etiquetado [Data] (con URL), [Estimate] (con supuestos), [Assumption] u [Opinion]. Datos >18 meses van marcados. Fuente primaria del caso: `Casos/Caso2.md` (frases citadas textualmente).*

---

## 1. Ficha resumida (con citas textuales del caso)

| Campo | Contenido |
|---|---|
| Persona | Rodrigo, 41, Concepción. Soporte TI con **turnos que rotan cada semana entre día, tarde y noche**, más **guardia por WhatsApp**. Vive con su pareja y su hijo de 6 años. |
| Síntoma central | «Duerme **cinco horas en las semanas de noche y seis en las de día, hace catorce meses, y ya lo da por normal**». |
| Frases propias | «**Yo duermo poco nomás, siempre he sido así.**» · «**Si no reviso los tickets antes de acostarme, igual no me duermo.**» · «**Sin café no funciono.**» · Dom: «**Ando cansado**, le dice a su pareja». |
| Semana tipo | Lun: tercer café 19:20 · Mar: cerró el notebook 23:58 · Jue: delivery 22:40 · Vie: cerró el notebook 22:10 · Dom: «ando cansado». |
| Dispositivo/canal | «**El celular de la empresa es también el suyo, y el grupo de WhatsApp de la guardia suena a cualquier hora**». El celular es **despertador + guardia + trabajo + distracción a la vez**. |
| Intentos previos | Melatonina 2 semanas · dejar el celular fuera de la pieza · reloj inteligente «que dejó de cargar en marzo» (botado en un cajón). |
| Contexto laboral | «En su empresa **nadie habla de desconexión**, y siente que **si se desconecta algo se va a caer**». |
| Costo ya visible | «Anda **irritable con su familia** y la semana pasada **cerró mal un ticket a las tres de la mañana**». |
| Señal médica | «**Su pareja dice que ronca fuerte**». Un amigo le ofreció pastillas para dormir. |
| Éxito (verbatim) | «**Que duerma una hora más**». |
| A favor | «**Se maneja bien con la tecnología**» (soporte TI: tickets, protocolos, turnos y SLA son su lenguaje nativo). |

**Lectura de ficha:** el problema no es que Rodrigo no sepa que duerme mal — es que su sueño quedó estructuralmente rehén de un cronograma que cambia cada semana, de un canal (WhatsApp) que no distingue trabajo de descanso, y de una normalización de 14 meses («ya lo da por normal») que convirtió la privación en identidad: «siempre he sido así».

---

## 2. Síntoma vs causa-raíz (2-3 causas encadenadas; cita la frase del caso que revela cada una)

**Síntoma:** 5-6 h de sueño por 14 meses, irritabilidad, error operativo a las 3 AM. No es insomnio clínico clásico (no "no puedo dormir"; es "no tengo dónde poner el sueño y la cabeza no cierra").

**Causa-raíz 1 — Estructural: el cronograma rota cada semana y su reloj biológico nunca alcanza a adaptarse.**
- Frase que la revela: «Como los turnos rotan cada semana, **nunca tiene dos semanas con el mismo horario**».
- Evidencia: la adaptación circadiana completa a turno nocturno requiere programar luz/oscuridad durante semanas; con rotación semanal el reloj queda permanentemente desencajado y la estrategia correcta es la *adaptación parcial* (posición de fase de compromiso), no la rutina fija [Data, >18 meses: Eastman & Martin, "How to use light and dark to produce circadian adaptation to night shift work", https://pubmed.ncbi.nlm.nih.gov/10344580/; Crowley & Eastman 2003, https://cet.org/wp-content/uploads/2017/10/Crowley-Eastman-2003-JBR.pdf]. Trabajadores nocturnos duermen en promedio **6,25 h vs 6,83 h** los diurnos (NHANES, EE.UU.) [Data, >18 meses: https://academic.oup.com/sleep/article/43/3/zsz240/5599823], y en estudios de campo el sueño diurno post-turno nocturno **frecuentemente es <5 h** [Data, >18 meses: https://stacks.cdc.gov/view/cdc/201028].
- Encadenamiento: sin horario estable → cada semana "vuelve a empezar de cero" → el cuerpo nunca sabe a qué hora esperar el sueño.

**Causa-raíz 2 — Conductual: la cama se convirtió en puesto de vigilancia, y el café en el parche.**
- Frase que la revela: «**Si no reviso los tickets antes de acostarme, igual no me duermo**» (el chequeo nocturno es ansiedad de control, no necesidad operativa) + «**Sin café no funciono**».
- Evidencia: la cafeína cerca de dormir reduce el tiempo total de sueño en **~45 min** y alarga la latencia en ~9 min; un café (107 mg) debe tomarse **≥8,8 h antes de acostarse** [Data, >18 meses: Gardiner et al. 2023, meta-análisis de 24 estudios, https://pubmed.ncbi.nlm.nih.gov/36870101/]. El "tercer café 19:20" del lunes de Rodrigo, con cierre de notebook ~23:58 (martes), está a **~5 h** de su hora de dormir: 3,8 h dentro de la zona de daño. La preocupación pre-sueño es tratable con revisión programada: la *postergación programada de la preocupación* (posponer la preocupación a una ventana fija) tiene evidencia RCT [Data, >18 meses: https://pmc.ncbi.nlm.nih.gov/articles/PMC11303915/; estudio diario 2025: https://www.tandfonline.com/doi/full/10.1080/08870446.2025.2590072].
- Encadenamiento: rotación → cansancio acumulado → más café tarde → sueño más corto y fragmentado → más cansancio → más café. Bucle auto-alimentado.

**Causa-raíz 3 — Identidad y normalización: hace 14 meses que esto dejó de ser "un problema" para él.**
- Frase que la revela: «**Yo duermo poco nomás, siempre he sido así**» + «ya lo **da por normal**».
- Evidencia: en apnea del sueño el promedio de demora entre síntoma y consulta es **~10 años**, y quien primero detecta el problema no es el paciente sino **la pareja** (testigo del ronquido/pausas) [Data, >18 meses: https://pmc.ncbi.nlm.nih.gov/articles/PMC5663292/]. Con «ronca fuerte» + cansancio crónico + hombre, un screening tipo STOP-Bang ya suma 3/8 factores (ronquido, cansancio, género), umbral de riesgo intermedio con ~90% de sensibilidad para AOS [Data, >18 meses: https://pubmed.ncbi.nlm.nih.gov/26658438/; score 3 ≈ 2,5x riesgo: http://www.stopbang.ca/osa/results.php].
- Encadenamiento: la privación se volvió identidad → no consulta → el posible trastorno de fondo (apnea) queda invisible para él y visible solo para su pareja. **Esto es exactamente lo que la derivación a médico del sueño (R4) viene a romper.**

**Cadena completa:** rotación semanal (estructura) → palia con café y vigilancia nocturna (conducta) → sueño corto y malo → costo difuso que se normaliza como identidad (psicología) → nunca escala a un médico. Cualquier solución que ataque un eslabón sin tocar los otros fracasa igual que sus intentos previos.

---

## 3. Por qué fallaron los intentos previos (tabla: intento → causa del fallo → implicancia de diseño)

| Intento previo | Por qué falló (causa específica) | Implicancia de diseño: "por eso una solución que X también fallaría" |
|---|---|---|
| **Melatonina 2 semanas** | La melatonina es una *señal de fase*: empuja el reloj en una dirección. Sin cronograma estable ni control de luz/café, **no hay "hacia dónde" empujar**; y con rotación semanal, cualquier fase ganada en una semana se pierde en la siguiente. En la literatura de turnos, melatonina funciona **combinada** con programas de luz/oscuridad, no sola [Data, >18 meses: Burgess, Eastman & Sharkey, "Bright light, dark and melatonin can promote circadian adaptation in night shift workers", https://stacks.cdc.gov/view/cdc/200985]. | Por eso una solución que actúe sobre la química del sueño (suplementos, pastillas —incluidas las que le ofreció su amigo) o que **asuma una hora fija de acostarse** también fallaría: el problema es de *estructura temporal*, no de sustancia. |
| **Dejar el celular fuera de la pieza** | Falló porque el celular **es despertador + guardia + trabajo a la vez**: sacarlo de la pieza = perder la alarma y quedar "fuera de guardia", con la ansiedad explícita «si se desconecta **algo se va a caer**». No es falta de disciplina: es que la orden ataca su herramienta de trabajo. | Por eso una solución que **exija separarlo del teléfono** (o silenciar el grupo de guardia, o "modo noche" que oculte todo) también fallaría: hay que diseñar **el teléfono como parte de la solución**, no como el enemigo. El canal WhatsApp ya existe en su vida; hay que cambiarle el rol, no eliminarlo. |
| **Reloj inteligente (dejó de cargar en marzo)** | El wearable le exigió **carga + uso + lectura de datos que no gatillan ninguna acción conectada al cronograma**. La fricción diaria superó al valor, y el dato ("dormiste 5h12") no le dijo nada que no supiera. Fracasó como *medición sin mecanismo*. | Por eso una solución que **dependa de hardware nuevo, setup o métricas pasivas "interesantes"** también acabaría en el cajón: el valor debe llegar **sin medición activa ni objetos que cargar**, por un canal que él ya usa gratis. |
| **(Trampa futura) Pastillas para dormir del amigo** | Enmascara el síntoma sin tocar ninguna de las tres causas-raíz; y con sospecha de apnea no evaluada, auto-medicarse sedantes es riesgoso **[Assumption — conocimiento clínico general de que los depresores del SNC pueden empeorar la apnea no diagnosticada; no lo verifiqué con fuente específica en estas búsquedas; es un argumento más para que la derivación (R4) sea obligatoria antes de cualquier pastilla]**. | Por eso una solución que **prometa dormir "por química" sin derivación médica previa** sería negligente con este perfil y violaría R4 del contrato de scoring. |

---

## 4. Barreras estructurales y palancas (qué NO puede exigirle la solución; qué canales/momentos/motivaciones SÍ existen)

**Lo que la solución NO puede exigirle (barreras duras):**
- Una **rutina u hora fija de dormir/despertar** — el turno rota cada semana; «nunca dos semanas con el mismo horario».
- **Desconectarse** del grupo de guardia o dejar el celular fuera de la pieza — es despertador + guardia + trabajo.
- **Hardware, wearables, cargar objetos ni instalar sensores** — el reloj ya está botado en un cajón.
- **Esfuerzo cognitivo alto** — está crónicamente cansado; cualquier cosa que pida "leer un curso de sueño" o sesiones de 30 min se cae el día 3 (dropout de apps de sueño: 13,1%, superior a controles [Data, >18 meses: meta-análisis 19 RCTs, https://pubmed.ncbi.nlm.nih.gov/39213858/]).
- **Cambiar su empleo o negociar los turnos** — la solución no controla el cronograma de la empresa; debe **adaptarse al turno, no exigirle una rutina**.

**Canales, momentos y motivaciones que SÍ existen (palancas reales):**
1. **WhatsApp es su canal nativo** [Data: 89,7% de los usuarios de internet en Chile usan WhatsApp, plataforma #1 del país (GWI Q2 2025, vía https://marketing4ecommerce.cl/uso-de-redes-sociales-en-chile/ y https://adsize.io/geo/cl; DataReportal Digital 2025 Chile: https://datareportal.com/reports/digital-2025-chile)]. La guardia YA vive ahí: no hay que crear el hábito de canal, solo **cambiarle el rol** (de vigilancia a cierre).
2. **El cronograma semanal existe y es forward-able** — la empresa lo publica; un parseo del turno de la semana convierte "rutina imposible" en "rutina que rota conmigo".
3. **La pareja como testigo y aliada** — es la única que "ve" su sueño: reporta el ronquido (5 segundos/día), y la literatura de apnea muestra que la pareja es el **primer detector** de síntomas y predictora de adherencia a tratamiento [Data, >18 meses: https://pmc.ncbi.nlm.nih.gov/articles/PMC5663292/ y https://pmc.ncbi.nlm.nih.gov/articles/PMC12113088/]. Ella además tiene motivación propia: duerme peor por el ronquido [los pareja de roncadores tienen ~3x más riesgo de insomnio: https://sleephealthjournal.org/article/S2352-7218(25)00176-7/fulltext].
4. **Identidad TI**: tickets, turnos, SLA, traspasos y protocolos son su lenguaje. Un producto que se presente como **"procedimiento de cierre de turno"** le habla nativo; un producto que le hable de "mindfulness" le habla gringo. [Opinion]
5. **El miedo real («si me desconecto algo se va a caer») es direccionable**: no hay que eliminarlo, hay que darle un **traspaso** — si el grupo queda formalmente avisado del ticket crítico, el riesgo de dormir *baja* de verdad. El cierre reduce el riesgo operacional, no solo la ansiedad. [Assumption razonada a partir de la propia frase del caso.]
6. **El café no hay que quitarlo, hay que moverlo** — «sin café no funciono» es innegociable; el timing sí: el corte de 8,8 h pre-dormir es una palanca cuantificable de hasta ~45 min [Data: https://pubmed.ncbi.nlm.nih.gov/36870101/].
7. **El costo ya pagado** (ticket mal cerrado 3 AM + irritabilidad con la familia) es el motivador reflejo: la conversación no es "salud" sino "no volver a cerrar mal un ticket a las 3 AM". [Opinion]
8. **Ventana legal/laboral favorable como contexto**: Chile reduce la jornada progresivamente con la Ley 21.561 (40 horas, vigente desde 26-abr-2024) [Data, >18 meses pero vigente: https://www.bcn.cl/leychile/navegar?idNorma=1191554; https://www.mintrab.gob.cl/40horas/] — el tema "descanso y desconexión" está entrando a la agenda pública, aunque **no encontré** regulación chilena específica sobre patrones de turnos rotativos (gap declarado; ver Flags).

---

## 5. Restricciones duras de diseño del caso

Derivadas de la ficha + `00-bases/scoring-contract.md` (R1-R6 + tabla C2):

1. **Cero horarios fijos de sueño** — cada semana rota día→tarde→noche; toda lógica de la solución debe **recalcularse por turno** (la solución se adapta al cronograma, no al revés).
2. **Cero wearables / hardware / medición activa** — el reloj está en el cajón desde marzo.
3. **Cero "deja el celular fuera de la pieza"** — el celular se queda adentro; la solución debe funcionar **dentro** del teléfono, idealmente **dentro de WhatsApp**.
4. **Cero consejos genéricos de higiene del sueño** — no es un problema de conocimiento; su problema es de estructura y de cierre cognitivo.
5. **R2 — Cero datos personales**: todo el demo con datos sintéticos nombrados ("Rodrigo sintético"), nunca registros reales.
6. **R4 — Derivación obligatoria a médico del sueño**: ronquido fuerte + cansancio crónico + turnos = sospecha de apnea que la solución **señala y deriva, jamás diagnostica**. Debe existir un flujo visible de derivación con material útil para la consulta.
7. **R6 — Demo en vivo sin depender de la red del venue**: plan B con respuestas cacheadas/modo script local.
8. **Presupuesto US$0**: Vercel Hobby, Cloudflare R2 free tier (10 GB, egress gratis [Data: https://developers.cloudflare.com/r2/pricing]), GLM-5.3 (provisto para el evento), WhatsApp Cloud API número de prueba (hasta 5 destinatarios verificados [Data: https://wati.io/en/blog/test-whatsapp-message-sends-safely]; conversaciones iniciadas por el usuario gratuitas e ilimitadas desde nov-2024 [Data, >18 meses pero política vigente: https://help.twilio.com/articles/30304057900699-Notice-Changes-to-WhatsApp-s-Pricing-July-2025]).
9. **2 días, 1 fundador + agentes de IA**: el MVP debe ser constrible en ese lapso (un bot conversacional sí; una app nativa con sensores, no).
10. **El éxito es una hora más de sueño**, no "mejor salud" ni "menos estrés": toda la narrativa del pitch debe poder responder *"¿de dónde sale cada uno de los 60 minutos?"* [Opinion].

---

## 6. Mecanismos conductuales candidatos con evidencia (principios NOMBRADOS con fuente, aplicados a ESTA persona)

1. **Postergación programada de la preocupación (*scheduled worry / worry postponement*)** — Borkovec et al. 1983 como "tarea de control de estímulo"; RCT controlado con lista de espera mostró eficacia para reducir preocupación intrusiva [Data, >18 meses: https://pmc.ncbi.nlm.nih.gov/articles/PMC11303915/]; un estudio diario 2025 reportó reducción de ~15 min diarios de preocupación con el formato aumentado [Data 2025: https://www.tandfonline.com/doi/full/10.1080/08870446.2025.2590072]. **Aplicado a Rodrigo:** su frase «si no reviso los tickets antes de acostarme, igual no me duermo» no es el problema — el problema es que su revisión es *abierta* (sin fin). Un **"cierre de turno" nocturno**: revisa UNA vez, con hora y formato, escribe lo pendiente, y el bot lo convierte en **traspaso formal al grupo real de guardia**. La cama deja de ser el lugar de la revisión.
2. **Intenciones de implementación (*implementation intentions*, planes si-entonces)** — Gollwitzer & Sheeran 2006, meta-análisis de 94 pruebas, **d = 0,65** sobre logro de metas; los efectos son mayores con formato contingente si-entonces y con **ensayo repetido** del plan [Data, >18 meses: https://psycnet.apa.org/record/2007-19538-002; meta de 642 pruebas: https://kops.uni-konstanz.de/server/api/core/bitstreams/d703c468-46e9-47fc-8900-d32d7d19c8d9/content]. **Aplicado a Rodrigo:** planes por tipo de turno, redactados por él y repetidos por el bot: "si es semana de tarde, mi último café es 15:15" · "si suena el grupo después del cierre, solo reviso menciones directas".
3. **Control del timing de cafeína (contramedida cuantificable)** — Gardiner et al. 2023: cafeína reduce TST **~45 min**, latencia +9 min, WASO +12 min; **1 café (107 mg) requiere ≥8,8 h antes de dormir** (2 dosis: 13,2 h) [Data, >18 meses: https://pubmed.ncbi.nlm.nih.gov/36870101/]; NIOSH: vida media 5-6 h [Data, >18 meses: https://archive.cdc.gov/www_cdc_gov/niosh/work-hour-training-for-nurses/longhours/mod6/11.html]. **Aplicado a Rodrigo:** el "tercer café 19:20" está a ~5 h de su dormir: moverlo según el turno (tarde: corte ~15:15; noche: corte ~23:15 para dormir 08:00) es la palanca individual más grande y medible de su semana. [Estimate: hasta ~45 min/día recuperables si responde como el promedio de los estudios.]
4. **Contramedidas circadianas por turno (*sleep scheduling for shift workers*: luz/oscuridad programada, sueño ancla, siesta estratégica)** — Eastman et al.: adaptación parcial mediante oscuridad programada, lentes oscuros al salir del turno noche y "freno de luz"; NIOSH: siesta ≤30 min para el bajón circadiano [Data, >18 meses: https://pubmed.ncbi.nlm.nih.gov/10344580/; https://journals.sagepub.com/doi/10.1177/0748730409332068]. **Aplicado a Rodrigo:** NO se persigue adaptación plena (imposible con rotación semanal); se protege la ventana de sueño post-turno noche (gafas en el auto a las 8 AM, pieza oscura) y se recalcula la ventana ancla cada domingo con el cronograma nuevo.
5. **Serial Diverse Imagining / cognitive shuffle (distracción atencional pre-sueño)** — Beaudoin 2014 (marco teórico, https://summit.sfu.ca/_flysystem/fedora/sfu_migrate/17237/Beaudoin-2014-...pdf); prueba con 154 estudiantes: SDI redujo quejas de latencia de sueño frente a control [Data, >18 meses: https://www.bbc.com/future/article/20260311-cognitive-shuffling-the-micro-dreaming-technique-that-helps-your-brain-to-rest; resumen académico: https://summit.sfu.ca/_flysystem/fedora/sfu_migrate/16196/Abstract%20Beaudoin%20Digdon%20ONeill%20Rachor%202016...pdf]. **Aplicado a Rodrigo:** un audio de 4 min con imágenes neutras y desconectadas entre sí (generado por GLM-5.3, **sin pantalla**, celular boca abajo), a pedido: cuando se mete a la cama manda "audio". Cero horario fijo: funciona igual a las 00:15 de la semana de tarde que a las 08:15 de la de noche.
6. **Norma social diádica / pareja como sensor (*social norms, dyadic intervention*)** — En apnea, la pareja es el primer detector del síntoma y su participación predice adherencia; los cónyuges de roncadores tienen ~3x más insomnio (motivación propia para participar) [Data, >18 meses: https://pmc.ncbi.nlm.nih.gov/articles/PMC5663292/; https://pmc.ncbi.nlm.nih.gov/articles/PMC12113088/; WePAP, ensayo de intervención de parejas, 2025: https://sleephealthjournal.org/article/S2352-7218(25)00176-7/fulltext]. **Aplicado a Rodrigo:** su pareja reporta el ronquido en 5 segundos cada mañana (ella ya lo sabe todo: "su pareja dice que ronca fuerte") y co-firma el compromiso semanal de la ventana de sueño. El ronquido persistente + cansancio + screening acumulan el caso para **derivación a médico del sueño (R4)**.
7. **Screening y derivación (R4) con STOP-Bang como marco NO diagnóstico** — STOP-Bang: screening validado, sensibilidad ~90% para AOS cualquier severidad [Data, >18 meses: https://pubmed.ncbi.nlm.nih.gov/26658438/; meta-análisis: https://jamanetwork.com/journals/jamanetworkopen/fullarticle/2777142]. **Aplicado a Rodrigo:** con ronquido + cansancio + género ya suma 3/8 (riesgo intermedio, ~2,5x [Data: http://www.stopbang.ca/osa/results.php]). La solución NUNCA dice "tienes apnea": acumula reportes de pareja y auto-reporte, y cuando el patrón persiste (ej. ≥2 semanas), arma un **informe para llevar al médico del sueño**.
8. **Marco COM-B (Michie et al. 2011)** — el comportamiento (dormir más) requiere Capability-Opportunity-Motivation [Data, >18 meses: https://discovery.ucl.ac.uk/1305716/1/1748-5908-6-42.pdf]. Diagnóstico de Rodrigo: **C**apacidad psicológica: conoce la higiene (no es gap de conocimiento) pero le falta la *habilidad de cierre* → el ritual la entrega. **O**portunidad física: el cronograma rotativo + celular multifunción la destruyen → la solución la *rediseña* (micro-estructura que rota con el turno). **O**portunidad social: "nadie habla de desconexión en su empresa" → el bot inyecta la norma sin exigirle confrontar a su jefe. **M**otivación automática: la ansiedad de guardia se apaga con el traspaso; **M**otivación refleja: el miedo "algo se va a caer" se reduce de verdad porque el grupo queda avisado.
9. **Intervenciones digitales de sueño para turnos: precedente de viabilidad** — existe evidencia preliminar de apps para turnos: *SleepSync* (Monash) mejoró sueño y ánimo en pilotaje de trabajadores por turnos [Data, >18 meses: https://pmc.ncbi.nlm.nih.gov/articles/PMC10064476/]; revisión de apps móviles para trabajadores de turno [Data, >18 meses: https://www.frontiersin.org/journals/public-health/articles/10.3389/fpubh.2022.936736/full]; coaching individualizado + educación en turnos mejoró ansiedad y funcionalidad del sueño en RCT cluster en enfermeras [Data, >18 meses: https://pubmed.ncbi.nlm.nih.gov/34870586/]; meta-análisis de apps de insomnio: efecto moderado en síntomas (g=0,60-0,70) **pero pequeño en tiempo total de sueño (g=0,33)** [Data, >18 meses: https://pubmed.ncbi.nlm.nih.gov/39213858/]. **Implicancia honesta:** el "efecto app" per se no regala una hora; la hora se gana con las palancas estructurales cuantificadas arriba (café ~45 min, latencia ~9-15 min, cierre de notebook ~23:58 → dormir a la hora objetivo) [Estimate].

**Cómo se arma la hora (de dónde salen los ~60 min):** [Estimate, supuestos individuos] corte de cafeína por turno: hasta ~45 min de TST (efecto medio, Gardiner 2023) · ritual de cierre + traspaso → reducción de latencia/arousal: ~10-15 min (SDI y postergación de preocupación, efectos pequeños-medianos) · adelantar el "cerré el notebook 23:58" hacia una hora objetivo por turno: ~10-15 min de procrastinación de cama recuperados. Suma: **~60-70 min de potencial**, con varianza individual alta — el producto mide su propia hora real con auto-reporte de 10 segundos ("¿a qué hora te dormiste?"), no promete un número fijo.

---

## 7. Auto-score del caso (D1-D7, 0-10)

| Dimensión | Score | Justificación (una línea) |
|---|---|---|
| **D1 Problema-raíz** | 9 | Causas encadenadas claras y citables textualmente (rotación→café/vigilancia→normalización), con costo ya pagado y visible (ticket mal cerrado a las 3 AM). |
| **D2 Credibilidad de cambio** | 6 | A favor: WhatsApp nativo, se maneja bien con tecnología, pareja aliada; en contra: «siempre he sido así» es identidad normalizada tras 14 meses. |
| **D3 Constrible en 2 días (1 persona + agentes)** | 8 | Un bot de WhatsApp + GLM-5.3 con 3-4 giros conversacionales e informes es alcanzable; el parseo de cronograma y el TTS de audio son los puntos duros. |
| **D4 Demo en vivo** | 8 | Proyectar WhatsApp en un teléfono es vívido y universal para el jurado; sujeto a la ventana de 24 h del número de prueba (mitigado con flujo iniciado por el usuario). |
| **D5 Espacio competitivo** | 8 | Las dCBT-I establecidas están en inglés y **excluyen explícitamente a trabajadores por turnos** [Data, >18 meses: https://aasm.org/digital-cognitive-behavioral-therapy-for-insomnia-platforms-and-characteristics/]; en Chile no hay oferta en español para rotación semanal + guardia. |
| **D6 Capital ≈ 0 + unit economics** | 9 | Stack 100% free tier verificado (Vercel Hobby, R2, WhatsApp test number, GLM del evento); costo de demo US$0-1 [Estimate]. |
| **D7 Escala de impacto en Chile** | 7 | ~25% de la fuerza laboral dependiente trabaja en turnos (cita secundaria; ver Flags) + todas las guardias de TI/salud/minería/security; el comprador natural es el empleador (B2B), más lento pero con plata. |

---

## Flags

**Yellow:**
1. **Prevalencia de turnos en Chile con cita secundaria**: el "~25% de la población laboral dependiente en algún sistema de turnos" aparece en literatura académica chilena citando a su vez otra fuente [Data: https://www.sciencedirect.com/science/article/pii/S071824492017000200067], pero **no encontré** el desglose oficial de turnos rotativos en ENETS 2009-2010 (que existe como instrumento [Data, >18 meses: https://www.dt.gob.cl/portal/1629/w3-article-99630.html]) ni en la ENE actual. Para el pitch: usar el número como orden de magnitud con la cita, no como cifra dura.
2. **Backend de búsqueda intermitente**: varias de las ~19 búsquedas web fallaron primero en el backend configurado (error `NoneType` en Firecrawl) y fueron servidas por el tier gratuito de respaldo; ningún resultado clave quedó sin fuente, pero dos fuentes (BBC sobre cognitive shuffle, adsize.io para GWI Chile) son divulgadores secundarios de papers primarios.
3. **Efecto de apps sobre tiempo total de sueño es pequeño (g=0,33)** [Data: https://pubmed.ncbi.nlm.nih.gov/39213858/]: la promesa de "+1 hora" debe quedar anclada a las palancas estructurales cuantificadas (café, cierre, latencia) y a medición propia, no al "efecto app". Declararlo así en el pitch; ocultarlo sería el error de credibilidad más caro ante este jurado.
4. **Número de prueba de WhatsApp Cloud API**: solo la plantilla `hello_world` viene pre-aprobada y hasta 5 destinatarios verificados [Data: https://wati.io/en/blog/test-whatsapp-message-sends-safely]; para producción, el mensaje nocturno iniciado por el bot requiere plantilla aprobada (utility). El demo se diseña con la ventana de 24 h iniciada por el usuario.
5. **Vercel Hobby prohibe uso comercial** [Data: https://vercel.com/docs/plans/hobby] — irrelevante para el evento, relevante si el proyecto sigue vivo post-hackatón (migrar a Pro/otra plataforma).
6. **Claim "sedantes pueden empeorar la apnea no diagnosticada"** quedó como [Assumption] sin fuente verificada en estas búsquedas; si se usa en el pitch, citar una fuente clínica o dejarlo como argumento de la derivación sin dramatizar.
7. **No encontré** regulación chilena específica sobre *patrones* de turnos rotativos (la Ley 21.561 reduce jornada pero no regula la rotación); el gap es real y declarado.

**Red:** ninguna. No hay hallazgo que mate la viabilidad del caso; todas las hipótesis de trabajo (a)-(d) quedaron contrastadas con evidencia.
