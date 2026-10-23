# Preguntas del jurado — top 10 con respuestas preparadas

*05-pitch/preguntas-jurado.md · Hackatón Señales · Makana SpA · 12-oct-2026 · Protocolo de honestidad activo. Jurado: equipo de producto, escéptico, 5 min. Las 5 primeras son los ataques del fiscal (06-red-team/ataques-y-veredicto.md) convertidos en pregunta→respuesta. Cada respuesta es decible en 30–45 segundos, con el número exacto del expediente y su etiqueta. Supone los 8 parches del red team aplicados.*

**Regla transversal:** ninguna cifra sin etiqueta; si el número no está en el expediente, la respuesta es «no lo sabemos — así lo vamos a medir».

---

## BLOQUE 1 — Los 5 ataques del fiscal (preparados)

### 1. «MUEVE es el botón de snooze» (ataque 1)

**Pregunta:** «Lunes: MUEVE. Miércoles: MUEVE. Viernes: MUEVE. ¿En qué momento esto deja de ser un hábito y se convierte en la alarma de snooze más cara de Chile? Le construyeron a una jefa de proyectos el gesto exacto para postergarse a sí misma.»

**Respuesta (≈35s):**
«Tiene razón el riesgo — y por eso el sistema no deja mover en cadena. Tras 2 MUEVEs consecutivos sin visita, el sistema deja de proponer el mismo slot y abre re-negociación de ventana: "el lunes no te está resultando — ¿martes 20:30 o sábado 11:00?". Mover sigue sin ser fallar; **desfilar no es mover**. La diferencia con el snooze es estructural: el snooze borra y aplaza en silencio; acá cada MUEVE deja rastro y dispara una conversación sobre la ventana real, no sobre la voluntad. Y lo medimos: % de citas que terminan en visita tras 2+ MUEVEs seguidos — umbral a fijar con el piloto [Assumption, métrica de cadena del MVP].»

### 2. «Muerte por silencio dominical» (ataque 2)

**Pregunta:** «Todo depende de que conteste el domingo a las 20:00. ¿Por qué no va a silenciar este bot como silenció la app del gym y la alarma del 06:30? Y si no contesta, ¿qué queda? ¿Su producto también se muere en el peor momento de autocontrol de la semana?»

**Respuesta (≈40s):**
«No — el silencio también agenda. Si Camila no responde el domingo 20:00, el sistema agenda por defecto su slot favorito — el más cumplido de sus últimas 4 semanas — y envía la invitación igual; para quitarla hay que responder. Eso es opt-out, no opt-in, y es 100% consecuente con la tesis que citamos: hoy no-ir cuesta cero y nadie lo nota (DellaVigna & Malmendier 2006 [Data, >18 meses] — los socios flat-fee predicen 9,5 visitas y hacen 4,2); acá IR es el default y NO-ir exige acción. Y su segunda pregunta: el mensaje no es el mecanismo — nunca lo fue. El mecanismo es el invite en el calendario del trabajo: no se apaga con silencio, existe todo el día junto a las reuniones.»

### 3. «El décimo lunes» — el 91% de Milne (ataque 3) ⚠️ COLETILLA OBLIGATORIA

**Pregunta:** «Lleva diez meses de "mañana parto". ¿Por qué el lunes once sí funciona? Me citan un 91% vs 35%, pero ese estudio era chico, de una semana, auto-reportado. ¿Qué evidencia tienen de que esto se sostiene a 90 días — que es literalmente el KPI del caso?»

**Respuesta (≈45s) — la coletilla va SIEMPRE:**
«Primero, el estudio: 91% vs 35%, Milne, Orbell & Sheeran 2002 [Data, >18 meses] — pero dicho completo: **248 estudiantes británicos, una semana de seguimiento, auto-reporte**. Mide que el plan vence a la motivación en la iniciación — no que el 91% se sostenga. El meta-análisis de 2024 acota el efecto general en d=0,27–0,66 según diseño [Data]. Segundo, lo que transferimos no es el 91%: es el mecanismo — y las tres condiciones que el meta dice que maximizan el efecto las tenemos por diseño: formato si-entonces, participante ya motivado (el domingo 23:55 es motivación pura) y ensayo del plan. Tercero, lo honesto: la combinación cita defendida + default + re-agendado a 90 días **no tiene estudio publicado — nuestra V/U90 es hipótesis y este MVP es el estudio**. Umbral: ≥0,8 visitas/semana en ≥40% de activos [Assumption].»

### 4. Unit economics — se dice PROACTIVO, antes de que pregunten (ataque 4)

**Pregunta:** «Mejor digánmele ustedes: LTV/CAC año 1 de 2,5× —bajo su propio umbral de 3×—, un ICP de 18.000 y un SOM año 3 de US$36 mil, no millones. ¿Startup o hobby con unit economics?»

**Respuesta (≈45s) — en el pitch esto se dice ANTES de la pregunta:**
«Se lo decimos nosotros primero, porque está en nuestro propio expediente como hallazgo adverso: B2C año 1 da **2,5×** [Estimate: LTV $110.000 / CAC contable $44.794] — bajo 3×, y no lo maquillamos: el CAC contable carga el tiempo del fundador ($960.000/año valorizado) repartido entre pocos premium. Lo que sí sostenemos: el desembolso real por premium es solo el incentivo de referida ($4.794), o sea **payback de caja <1 mes**; el CAC contable cae ~4× con escala — cruce de 3× desde ~376 activos y **8,6× en el año 2** [Estimate]. El SOM B2C año 3 (US$36k) es una línea de base pequeña A PROPÓSITO: es un experimento rentable, no la tesis. La tesis de inversión es **B2B2C**: el gym o el empleador absorbe la adquisición (LTV/CAC vía canal >10× [Opinion]). Esas son las cuentas; si alguna no le cuadra, la revisamos acá.»

**Prohibido responder con 4,3× — el cálculo corregido lo veta.**

### 5. «¿De verdad corre el sábado a las 16:00?» — build (ataque 5)

**Pregunta:** «Un número de prueba de Meta que habla con 5 personas, un OAuth que nadie corrió en 36 horas, un recordatorio a las 18:30 en Vercel gratis. ¿Qué se cae primero y qué tienen detrás? El sandbox de Twilio no le manda nada a nadie hasta que cada uno manda "join-algo".»

**Respuesta (≈40s) — honestidad de build:**
«Lo verificado primero: el número de prueba de Meta — 5 destinatarios allowlisted [Data: wati.io], y el demo está diseñado dentro de ese límite; con más jurados, rotamos o proyectamos desde el teléfono del fundador. El plan A de calendario es el .ics adjunto por WhatsApp — funciona sin OAuth y sin aprobación de plantillas; OAuth en modo Testing es el lujo, no el requisito. El cron: **Vercel Hobby garantiza 1 disparo diario, ±59 minutos, UTC** — por eso en el demo el recordatorio se dispara manual con el reloj simulable, y lo decimos en vivo; el piloto real necesita un scheduler externo, no lo prometemos del free tier. Y Twilio sandbox: cierto, cada número — jurados incluidos — debe mandar el join-code primero y la sesión caduca a 3 días; por eso está presupuestado en el plan de contingencia del viernes. Plan B sin red: obligatorio, listo antes del pitch.»

---

## BLOQUE 2 — Otras 5 probables

### 6. ¿Por qué no lo construye el propio gym?

**Respuesta (≈35s):**
«Porque el gym grande vive del socio ausente — el que paga y no va es su mejor cliente — y su única palanca histórica es el precio, que el caso ya descartó: Camila vio la promo "no pagas si entrenas" y no se movió. Que un gym copie el flujo es nuestro riesgo competitivo declarado (D5): la ventana es de años — ese copy conductual cero-culpa no es trivial de imitar — pero no de décadas, y lo decimos sin suavizar. Donde el gym SÍ compra es en el boutique: para un studio con capacidad finita la asistencia ES el revenue, y ya paga software de gestión — por eso la tesis B2B2C apunta ahí y a empleadores, no a las cadenas low-cost [Opinion + unit-economics.md §3].»

### 7. ¿Qué pasa si se cambia de gym o de trabajo?

**Respuesta (≈30s):**
«El producto no está atado a ninguno de los dos. Del gym solo usamos tres campos — nombre, sede, ventana horaria — y deliberadamente NO integramos torniquetes ni trackeo de asistencia del gym en el MVP (fuera a propósito, O10): la mensualidad es el ancla sicológica, no una integración técnica. Del trabajo: el invite es un .ics estándar — cae en Google Workspace, M365 o el calendario del teléfono; si cambia de empleador, la cita viaja con el número de WhatsApp, que es suyo. Lo único que realmente no viaja es la mensualidad ya pagada — y para eso está la mensualidad nueva, con el mismo reencuadre. [Assumption de diseño: portabilidad.]»

### 8. ¿Esto no es un recordatorio glorificado?

**Respuesta (≈35s):**
«El recordatorio es una pieza — un mensaje al día — y solo existe DESPUÉS de que el mecanismo ya corrió. Comparemos con lo que ella ya tiene: la alarma 06:30 se apagó cuatro veces y la app del gym "abre y cierra sin ir" — prompts sin consecuencia, en el peor momento. La Cita es otra arquitectura: el domingo captura la intención y crea un evento; el lunes ese evento ya existe en el único sistema que ella obedece — su calendario del trabajo — y no-ir exige una acción visible (MUEVE) que el sistema re-agenda; tras la visita, reencuadra la plata ya pagada. Un recordatorio pide memoria y voluntad en caliente; acá la conducta ocurre por inercia del default [Data: DellaVigna & Malmendier 2006 — flat-fee predice 9,5 visitas, hace 4,2].»

### 9. ¿Cómo saben que funciona? ¿Cuándo declaran éxito o fracaso?

**Respuesta (≈40s):**
«Métrica norte: **V/U90 — visitas sostenidas por usuario activo a 90 días**, la traducción económica del éxito verbatim del caso ("que vuelva a entrenar y lo sostenga"). Umbral de éxito [Assumption]: ≥0,8 visitas/semana en ≥40% de activos. La escalera intermedia: ≥50% de los domingos responden con slot (H1); ≥30% de citas cumplidas en la semana 1 (H2 — contra el piso de apps de ~3% al día 30 [Data, direccional]); ≥60% de los que usan MUEVE visitan la semana siguiente (H3), más la métrica de cadena tras 2 MUEVEs; churn premium <10%/mensual (H5). Fracaso declarado: si el churn converge al de apps (~19%/mes), el LTV cae a ~$40.000 y el modelo B2C muere como tesis de inversión [Estimate]. No hay salida elegante: a 90 días lo sabemos, y ese es exactamente el punto del MVP.»

### 10. ¿Escala: B2C o B2B2C — y por qué la tesis es la segunda?

**Respuesta (≈40s):**
«B2C es el mecanismo y la monetización; B2B2C es la adquisición. El ICP núcleo es ~18.000 personas en Chile [Estimate bottom-up, icp.md — pasos frágiles declarados] y el SOM B2C año 3 (US$36k) es chico a propósito: valida retención, no financia la startup. La tesis: el gym boutique ($500/socio activo/mes — [Estimate: a validar con los 2 primeros gyms, sin pricing comparable publicado]) y el empleador ($2.500/socio/mes — [Estimate]) absorben el CAC que en B2C contable nos deja en 2,5× el año 1; con el canal, LTV/CAC >10× [Opinion]. El caso es literalmente una jefa de proyectos: el buyer de RRHH existe (Pluxee, Edenred, Workmed operan en Chile [Data: revenuebase.ai]). Las cadenas low-cost e isapres no son el primer cheque — incentivo y ciclo de ventas, respectivamente.»

---

## Frases PROHIBIDAS (bajo ninguna circunstancia)

1. **«4,3×»** — el cálculo corregido del propio expediente lo veta: era un CAC mal calculado. Lo real: 2,5× año 1, 8,6× año 2, cruce 3× en ~376 activos, payback de caja <1 mes.
2. **«El 67% de las membresías nunca se usa»** (y variantes «67% nunca va») — fuente antigua corregida por el propio expediente; HFA 2025 mide 4,6% «nunca visitó» y el segmento correcto es «paga-sin-sostener»: 50% de nuevos socios abandona a 6 meses [Data, IHRSA proxy].
3. **«Único en el mundo» / «primero en el mundo»** — lo honesto: «búsqueda agotada oct-2026 no encontró a nadie haciendo esto; ese vacío también puede significar que no funciona — el MVP mide eso».
4. **Cualquier claim sin etiqueta** — 91% sin coletilla, cifras de mercado sin [Data]/[Estimate]/[Assumption], o promesas del piloto («recordatorio a las 18:30 en producción») que el free tier no garantiza.
5. **«Más barato que las apps»** — falso contra el anual de Freeletics (≈$5.900–7.500/mes vs $7.990); el argumento válido es «26% de la mensualidad que ya paga», anclado contra el PT.
6. **«Cambiamos hábitos» / «la IA es nuestro diferenciador»** — lo que ERES: diseño conductual entregado a centavos; que se forme el hábito es la hipótesis H4, no un hecho.

## Frases OBLIGATORIAS (se dicen aunque no pregunten)

1. **La coletilla del 91%:** «estudio chico: 248 estudiantes británicos, una semana, auto-reporte — mide que el plan vence a la motivación en la iniciación, no que se sostenga.»
2. **V/U90:** «la parte "y lo sostenga" no tiene estudio publicado; nuestra V/U90 es hipótesis y este MVP es el estudio» — el 2,5×/payback/8,6× **se dicen proactivamente** en el pitch antes de que el jurado pregunte.
3. **La tesis B2B2C antes del SOM:** «el SOM B2C es una línea de base pequeña a propósito: experimento rentable; la tesis de inversión es B2B2C».
4. **Los dos parches del red team en voz alta:** «el silencio también agenda» (default dominical) y «mover tiene límite: tras 2 MUEVEs, re-negociamos la ventana» (anti-snooze) — son las respuestas a los dos ataques de producto más duros, dichas antes de que ataquen.
5. **El guardrail R4 si sale el tema de dolor:** «si menciona dolor, no prescribimos: derivamos a kinesiólogo» — pass/fail del torneo, mencionar una vez.

---

## Flags

- **Yellow — Las respuestas 1 y 2 dependen de que los parches del red team estén EN el MVP del viernes:** si el default dominical o la regla anti-snooze no corren en el demo, no se dicen como construidos — se dicen como spec («así lo especificamos; corre en el piloto»). Regla dura de honestidad.
- **Yellow — El escenario de >4 jurados con el allowlist de 5 números:** los guiones del bloque 1 se ensayan con esa rotación (proyectar desde el teléfono del fundador). No improvisar el sábado.
- **Yellow — Si preguntan por el $500/$2.500 B2B2C (hueco #7 del overclaim check):** la respuesta es la etiqueta — «[Estimate: a validar con los 2 primeros gyms; no hay pricing comparable publicado en Chile]» — jamás defender el número como anclado.
- **Yellow — Si traen el d≈0,14 en actividad física (literatura reciente en older adults):** responder con la moderación por motivación (d=0,79 en motivados — el único punto donde la transferencia JUEGA A FAVOR: el domingo 23:55 es motivación pura) y reiterar que el MVP mide el efecto local.
- **Red — ninguna.**
