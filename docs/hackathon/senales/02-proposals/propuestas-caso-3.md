# Caso 3 — Patricia · 2 propuestas de MVP

*Investigación pre-evento Hackatón Señales · 12-oct-2026 · Basado en `01-cases/caso-3-analisis.md` (causas-raíz, evidencia y flags de búsqueda ahí).*
*Protocolo de honestidad: [Data] con URL · [Estimate] con supuestos · [Assumption] · [Opinion]. Éxito del caso (verbatim): «Que vuelva a mirar sus cuentas y deje de pagar solo el mínimo.»*

**Regla de diseño transversal:** ninguna de las dos es "otro dashboard que ella tiene que abrir" — la evitación ES el problema; el canal es WhatsApp (audio-first), el momento es su semana real (lunes del correo, viernes del mínimo, domingo del desvelo), el tono jamás juzga.

---

### Propuesta 3.a — **Cuenta Conmigo**

- **Pitch en una línea:** Patricia le reenvía el correo del banco SIN ABRIRLO a un número de WhatsApp, y "Cuenta Conmigo" le devuelve un audio de 90 segundos que la abraza mientras la informa — alguien mira por ella, en dosis que no angustian.

#### Mecanismo

Ataca directamente el **ostrich effect** («Si no lo miro, no existe»): Karlsson, Loewenstein & Seppi (2009) documentaron que las personas evitan exponerse a la información financiera que anticipan dolorosa — revisan sus cuentas 50–80% menos cuando la noticia estará mala [Data — *J. Risk & Uncertainty* 38:95–115; econpapers.repec.org/RePEc:kap:jrisku:v:38:y:2009:i:2:p:95-115]. El diseño clásico ("fuérzala a mirar") dispara exactamente el mecanismo que la paraliza. Aquí lo invertimos: **el bot hace la primera exposición por ella** (abre el PDF, mira los números, los digiere) y le devuelve solo lo que puede sostener HOY. Es exposición gradual dosificada (graded exposure): la misma lógica con que la CBT financiera trata la evitación — "Space From Money Worries" (Richardson et al., *Frontiers in Public Health* 2022) trabajó el ciclo evitación↔malestar con psicoeducación, "Money Worry Time" (ventana acotada para la preocupación) y urge surfing para el impulso de compra; piloto con 77% de completitud y mejoras significativas en ansiedad, depresión y bienestar financiero percibido [Data — frontiersin.org/journals/public-health/articles/10.3389/fpubh.2022.739381/full].

**La dosificación (el corazón del producto):** semana 1–2, el audio solo dice el mínimo y la fecha, con validación emocional explícita ("reenviarme la cuenta cerrada ya fue valiente"). Semana 3–4, suma una sola frase: cuánto durará la deuda al ritmo actual. Semana 5+, una comparación: «si pagas mínimo + $5.000, le sacas X meses». Nunca el total crudo de golpe, nunca dos malas noticias en el mismo audio. El jueves previo al pago agrega el **nudge con consecuencias del mínimo**: el experimento chileno de recordatorios (OECD-OPSI 2023) mostró que el mensaje más eficaz es el que explica que pagar el mínimo NO evita los intereses, enviado la víspera del vencimiento por el canal del usuario [Data — oecd-opsi.org/wp-content/uploads/2023/10/Final_Report_Reminders_Exp_EN.pdf].

**Por qué audio y no texto:** la ficha la define como persona de audios con su hija («los audios con su hija»); la voz es el formato de intimidad y compañía en su mundo; un texto con números es un correo del banco más.

#### Recorrido del usuario (una semana real de Patricia, semana 3 con el producto)

1. **Lunes 10:30 (mientras su mamá almuerza):** llega el correo del banco. Antes: no lo abría, angustia, «no existe». Ahora: lo **reenvía cerrado** a Cuenta Conmigo (10 segundos, desde el mismo WhatsApp con que contesta pedidos del catálogo). No abre nada. Implementation intention anclada al gatillo real: «si llega el correo, lo reenvío cerrado» [Data — Gollwitzer & Sheeran 2006, d=0,65 en 94 tests].
2. **Lunes 23:15 (su mamá ya se durmió):** audio de vuelta, 90 segundos, voz cálida: «Patricia, la cuenta llegó y ya la miré por ti. Este mes pagas $38.000 el viernes. Nada más que tengas que hacer hoy. Lo que hiciste al reenviármela es más de lo que hiciste en 7 meses — te lo digo en serio.» [Estimate de tono; la validación sin juicio es requisito del perfil, ficha: «vergüenza de contarle a su familia»].
3. **Miércoles (remedios de su mamá en tres cuotas):** el bot NO le dice nada sobre ese gasto (regla anti-moralista de la ficha). Si Patricia le manda un audio quejándose, responde solo con contención, sin números.
4. **Jueves 22:30:** el nudge de la víspera del pago: «Mañana pagas $38.000, mínimo. Si pudieras poner $45.000 — solo esta semana, solo si sobra — le sacas 8 meses a esa deuda y $71.000 de intereses. Si no sobra, $38.000 está perfecto: no debes nada a nadie.» [Números con estructura real CMF NCG 537: con 1% de amortización mensual, ~180 meses y ~160% de intereses; con 5%, 60 meses y 40% — Data — cmfchile.cl/portal/prensa/625/w4-article-95105.html; ejemplo sintético calculado con esa estructura].
5. **Domingo 00:40 (el desvelo):** Patricia se desvela pensando en la plata. En vez de rumiar sola, le dice al bot lo que le da miedo («¿y si caigo al DICOM y mi mamá necesita un préstamo?»). El bot no minimiza ni sermoniza: nombra el miedo, lo acota como Money Worry Time, cierra con UNA microacción para el lunes y —cuando el miedo es fundado (morosidad o carga >50% del ingreso)— le ofrece la salida real (R4): «¿quieres que te explique en 2 minutos cómo pedir reprogramación? SERNAC explica los pasos, no te cuesta nada, y pedir ayuda no es deber plata» [Data — sernac.cl/portal/618/w3-propertyvalue-62182.html; Ley 21.673 y Garantías de Refinanciamiento para ingresos ≤$1.500.000 — bcn.cl/leychile/navegar?idNorma=1203875].

#### Por qué los intentos previos de Patricia NO eran esto

- La **planilla de la hija** le exigía a ELLA mirarlo todo, sola, en celdas frías, con testigo con acceso a los números (vergüenza). Aquí: no mira nada crudo, la primera mirada la hace otro, en audio, sin testigos, en dosis.
- **Cortar la tarjeta** atacaba el instrumento, no la angustia; aquí la angustia se trata como el punto de partida (el desvelo del domingo es una FEATURE del recorrido, no un bug).
- **La promesa de diciembre** era una meta sin plan si-entonces; aquí cada acción está anclada al gatillo real de su semana (correo lunes → reenviar; jueves → nudge; desvelo → contención).
- Y ninguno de los tres hablaba su idioma: los tres eran silencio + números. Este producto es una VOZ en el canal donde ya vive.

#### Demo en 5 minutos (todo con "Patricia sintética" — R2: cero datos reales)

Se muestra el flujo completo EN VIVO desde el celular del jurado, con la bandeja de "Patricia sintética" proyectada:
1. (0:00–0:45) El presentador reenvía SIN ABRIRLO un correo sintético "Estado de cuenta Banco Sintético" al número de WhatsApp del demo (número de prueba Cloud API). Se ve el reenvío llegar.
2. (0:45–1:45) A los ~15 segundos vuelve el audio de 90 s generado por GLM-5.3 (voz TTS cálida, tono chileno cercano): «Patricia, la cuenta llegó y ya la miré por ti…». Se reproduce completo frente al jurado.
3. (1:45–2:45) El jurado ve la "dosis" progresando: se simulan los audios de la semana 1 (solo mínimo) vs semana 5 (comparación mínimo + $5.000 → −8 meses) — dos audios pre-generados que muestran la dosificación sin esperar semanas.
4. (2:45–3:45) Escena del domingo: se envía un audio de voz real de Patricia sintética («no puedo dormir pensando en el DICOM») y el bot responde en vivo con contención + microacción (generación en tiempo real — este es el momento "wow").
5. (3:45–5:00) Umbral de derivación (R4): se muestra un caso con deuda impaga sintética donde el audio cambia a modo información/derivación (SERNAC/reprogramación) sin recomendar NADA. Cierre con la cifra del caso real: 84% de las personas termina pagando intereses por cuotas pactadas sin interés [Data — CMF NCG 537, cmfchile.cl/portal/prensa/625/w4-article-95105.html].

**Datos sintéticos, nombrados:** "Patricia sintética", "Banco Sintético", PDF de estado de cuenta inventado montado en R2 (bucket público con nombre ofuscado), audios TTS sintéticos, Conversaciones en la sandbox de WhatsApp Cloud API (número de prueba = sin riesgo de tocar a nadie real). El PDF del demo lo fabrica el equipo EN el evento con datos inventados explícitos.

#### Stack en 2 días + costo demo estimado

- **Canal:** WhatsApp Cloud API número de prueba (free tier; conversaciones utilities en ventana de prueba sin cobro o costo despreciable) [Data — desarrolladores.facebook.com/docs/whatsapp/cloud-api]; plan B (R6): el flujo completo corre local con Twilio trial o una grabación de respaldo si la red del venue falla — el corazón del demo es un audio, que puede pre-generarse.
- **Parseo + redacción del audio:** GLM-5.3 (extrae del PDF: total, mínimo, fecha; decide la dosis de la semana según estado emocional/contador de exposición; redacta guion de 90 s) → TTS (edge/openai free tier) → envía por WhatsApp.
- **Infra:** Vercel (webhook + API + panel mínimo del equipo para ver el estado del bot), R2 SOLO para los PDFs sintéticos del demo y audios cacheados. Nada de datos reales (R2).
- **Alcance del parseo en 2 días:** UN formato de estado de cuenta (el sintético del demo) + fallback manual: si el parseo falla, el bot pide 3 números por audio/texto y sigue funcionando (el producto no muere sin OCR perfecto).
- **Costo demo estimado: US$0–3** [Estimate: WhatsApp Cloud API número de prueba = gratis; GLM-5.3 API del hackatón = provista; Vercel free tier; R2 free tier 10 GB; TTS edge = gratis; ~20 audios de demo ≈ 200K tokens ≈ centavos].

#### Qué se deja fuera A PROPÓSITO

- **Parseo universal de todos los bancos:** imposible en 2 días; el fallback manual (3 números) cubre el 100% del recorrido igual.
- **Open banking / conexión con su banco:** el SFA chileno no está operativo hasta jul-2027 [Data — cmfchile.cl/portal/prensa/625/w4-article-82737.html; fiskil.com/open-finance-tracker/chile] y la fricción emocional de "conectar mi banco" es la misma que abrir la app [Assumption].
- **Dashboard web con gráficos:** Patricia no abre dashboards; el audio ES el reporte. El panel web del equipo es interno, no para ella.
- **Presupuesto por categorías:** es la planilla que ya murió (ficha). Prohibido por diseño.
- **Bloqueo de compras / consejos de gasto:** función emocional del gasto no se ataca con prohibición (ficha: el gasto del nieto «se lo merece» no es el problema).
- **Notificaciones diurnas:** su ventana es la noche (ficha).
- **Historial familiar / compartir cifras con la hija:** la vergüenza es barrera estructural; la hija entra solo como testigo de LOGROS si Patricia quiere, nunca de montos.

#### Riesgos

- **Compliance (R5):** BAJO si el guion se mantiene en wellness (información/visualización/acompañamiento) y JAMÁS dice "invierte/compra/cancela el producto X". El nudge del mínimo es educativo (consecuencia del pago mínimo), avalado por el propio experimento del SERNAC/OECD-OPSI [Data — oecd-opsi.org 2023]. Mitigación: guiones con checklist R5 + trigger de derivación (R4) cuando carga >50% o morosidad [Data — umbral de sobreendeudamiento CMF: cmfchile.cl/portal/prensa/625/w4-article-102984.html].
- **Build:** MEDIO — el riesgo técnico es el parseo de PDF reales (fuera del formato sintético); mitigado con fallback de 3 números. El TTS con tono chileno cálido es el segundo riesgo (probar 2-3 voces y elegir la menos robótica).
- **Credibilidad ante el jurado:** MEDIO-BAJO — "¿tomará Patricia el hábito de reenviar cada lunes?" es la pregunta dura. Respuesta honesta: es UN gesto de 10 segundos anclado a un gatillo que ya ocurre cada lunes (el correo) y a un canal donde ya pasa su vida; y el feedback inmediato (audio que la contiene) es el refuerzo que la planilla nunca le dio. [Opinion] El riesgo de abandono existe; la dosificación está diseñada justamente para que el costo emocional de cada interacción sea menor que su alivio.

#### Auto-score 3.a (D1–D7)

| Dim. | Score | Justificación (1 línea) |
|---|---|---|
| D1 · Problema-raíz | **9** | Trata la causa-raíz textual (evitación = ostrich effect) con el mecanismo inverso exacto: otro mira primero, exposición dosificada. |
| D2 · Credibilidad de cambio | **7,5** | Canal+formato+momentos 100% suyos y hábito de 10 s anclado a gatillo existente; el "sí" depende del tono perfecto de la voz. |
| D3 · Constrible 2 días | **8** | Un formato de PDF + fallback manual + flujo WhatsApp→GLM→TTS→audio cabe; parseo universal queda fuera a propósito. |
| D4 · Demo en vivo | **9** | El demo ES el producto (reenviar→audio), teatral, emocional, con wow en la respuesta en vivo del domingo; plan B offline trivial (audio pre-generado). |
| D5 · Espacio competitivo | **7,5** | Ninguna app chilena o global hace "mirar por ti, en audio, en dosis" (Kane/FinanzasApp/Kavero = dashboards o planillas) [Data — kaneapp.cl; finanzasapp.cl; kavero.cl]. |
| D6 · Capital ≈ 0 + unit economics | **9** | US$0–3 de demo; costo marginal por usuario/mes < US$0,10 [Estimate: WhatsApp utility + tokens + TTS ≈ centavos]. |
| D7 · Escala en Chile | **8** | 6,1 M de deudores, 14,1% sobreendeudados, 84% pagando intereses por cuotas "sin interés" [Data — CMF 2025; cmfchile.cl/portal/prensa/625/w4-article-102984.html] — y el perfil 55+ cuidadora es demografía creciente. |

**Promedio 3.a: 8,3/10** [Estimate aritmético].

---

### Propuesta 3.b — **La Vuelta del Sábado**

- **Pitch en una línea:** el sábado —el día en que Patricia cobra y compra con cariño— recibe un audio que separa "la plata de la mamá" de "la plata de la deuda": «de las ventas de esta semana, $12.000 ya son tuyos… y $3.000 de esos ya le ganaron 6 meses al pacman».

#### Mecanismo

Mecanismo conductual DISTINTO al de 3.a: 3.a rompía la evitación (exposición dosificada). 3.b ataca el pago del mínimo desde otro flanco: **transformar el excedente invisible de una semana de ventas en un abono extra automático y con identidad propia**, usando dos principios:

1. **Save More Tomorrow, invertido para ingresos variables (Thaler & Benartzi, *J. Political Economy* 2004).** El original: precomprometer hoy un alza del ahorro atada al próximo aumento de sueldo — sin pérdida sentida, la inercia trabaja a favor. Resultado: 78% de los que lo ofrecieron se inscribió, 80% persistió tras 3 alzas, y la tasa de ahorro promedio subió de 3,5% a 11,6% en 28 meses [Data — anderson.ucla.edu/faculty/shlomo.benartzi/savemore.htm; clear.dol.gov/study/save-more-tomorrow; *JPE* 112(S1):S164–S187]. Patricia no tiene sueldos ni alzas, pero tiene su equivalente estructural: **ingresos variables con picos** (la semana que el catálogo se mueve). La traducción: en vez de comprometer "más mañana", se compromete **un % fijo de cada pico, definido por ella, cobrado solo si el pico existe**: «cuando la semana pase de $180.000, el 10% de lo que pase de ahí va a la tarjeta». El dinero extra nace del pico (nunca del gasto de su mamá ni del nieto), así que la pérdida aversiva no dispara: es "plata que no existía ayer" [Assumption de traducción del mecanismo; el diseño original está validado en el contexto de sueldos, no de ventas por catálogo — se declara].
2. **Mental accounting a favor (Thaler 1985/1999).** El problema de «Total, son cuotas chicas» es que cada peso es fungible y todo se funde en la angustia. La gente gasta distinto según la ETIQUETA del dinero (windfall vs ingreso duro; Shefrin & Thaler 1988: propensión a gastar un pago único de $2.400 variaba de $1.200/año en cuotas a $0 si llegaba en 5 años — mismo dinero, cuentas mentales distintas) [Data — onlinelibrary.wiley.com/doi/10.1002/9781118926352.ch8; meta-análisis del house-money effect: frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2025.1549626/full; replicación en 21 países/5.589 personas: scienmag.com/mental-accounting-survives-its-biggest-test-yet-across-21-countries]. Aquí usamos el sesgo EN SU BENEFICIO: etiquetamos "la plata de la deuda" como una cuenta mental separada con nombre propio cálido («el pacman», no "cuota extra"), para que abonar más no compita con "la plata de mi mamá" ni con "el nieto se lo merece". La evidencia multinacional respalda que pagar deuda produce felicidad medible en países de menores ingresos [Data — ncbi.nlm.nih.gov/pmc/articles/PMC11659422]: el marco es ganarle meses al pacman y dormir mejor el domingo, no sacrificio.

**El rol de la hija (aliada natural, sin ver cifras):** cuando Patricia cumple una "Vuelta del Sábado" seguida, ELLA decide si quiere que le llegue a la hija un sticker/mensaje: «a mi mamá le ganó 6 meses al pacman esta semana». La hija celebra el logro, jamás ve el monto de la deuda (la vergüenza de la ficha se respeta). Es un commitment blando con testigo social que la quiere — deliberadamente SIN castigo: la evidencia de campo de John ("When Commitment Fails", Filipinas) muestra que los dispositivos de compromiso duros autoseleccionados fallan al 55% y hacen daño [Data — economics.yale.edu/sites/default/files/john_when_commitment_fails_march2018.pdf]; aquí el testigo es celebratorio, no sancionador.

#### Recorrido del usuario (una semana real de Patricia, semana 4 con el producto)

1. **Sábado 11:00 (día de cobro y compras):** Patricia cobra el catálogo: buena semana, $215.000 [Estimate sintético]. Audio de "La Vuelta": «Patricia, $215.000 entraron esta semana. Tu regla dijo: 10% de todo lo que pase de $180.000 → $3.500 ya no son tuyos ni del pacman: SON del pacman. La ropa del nieto sale de los $180.000, con toda tranquilidad, porque él se lo merece.» La compra del nieto queda explícitamente blindada — cero juicio.
2. **Domingo 00:40 (el desvelo):** el recuerdo de la semana no es «cuánto debo»: es «ya le saqué 6 meses al pacman y no toqué ni un peso de la mamá ni del nieto». El desvelo tiene material nuevo. [Assumption del cambio de rumia; el marco emocional es la palanca, ficha: la angustia es el punto de partida].
3. **Martes (remedios de su mamá en tres cuotas):** el bot NO menciona los remedios. Si Patricia le pregunta «¿y si lo dejo de hacer esta semana?», el bot no discute la regla ni la castiga: responde «esta semana se te perdona, el pacman puede esperar; la que no puede esperar es tu mamá» — opt-out sin culpa, como en SMarT (Thaler & Benartzi 2004: hasta quienes desertaban mantenían el ahorro ganado) [Data — chicagobooth.edu/review/save-more-tomorrow].
4. **Viernes (paga el mínimo):** paga su mínimo de siempre… y el bot suma sin fricción: «tu $3.500 del sábado ya está abonado. Pagaste $41.500, no $38.000. No hiciste nada extra esta semana y le quitaste 7 meses al pacman.» [Estimate de montos sintéticos consistentes con NCG 537: mínimo = MNF + 5% MF; cmfchile.cl/portal/prensa/625/w4-article-95105.html].
5. **Un sábado al mes:** recuento en audio de las Vueltas del mes: «4 semanas, 3 vueltas, $12.000 extra, 19 meses menos de deuda, ~$140.000 de intereses que no vas a pagar». Si carga financiera >50% del ingreso o morosidad detectada (R4), el mismo audio abre la puerta de la salida real: «¿quieres que te explique qué es la reprogramación y cómo se pide por SERNAC? No es fracaso, es trámite» [Data — sernac.cl/portal/618/w3-propertyvalue-62182.html; Ley 21.673 — bcn.cl/leychile/navegar?idNorma=1203875].

#### Demo en 5 minutos (todo con "Patricia sintética" — R2: cero datos reales)

Se dramatiza UN mes completo de "Patricia sintética" comprimido en 5 minutos, proyectando su WhatsApp:
1. (0:00–1:00) **El pacto (onboarding en 60 segundos):** por WhatsApp, el bot pregunta 3 cosas por audio y Patricia responde hablando: «¿cuánto fue tu mejor semana de ventas?» ($200.000, sintético), «¿cuánto fue la más floja?» ($90.000), «¿cuál es tu mínimo de la tarjeta?» ($38.000). El bot propone la regla en su idioma: «cuando la semana pase de $170.000 — un promedio entre tu mejor y tu peor semana, redondeado — el 10% de lo que pase va a la tarjeta. ¿Cerramos?» Ella dicta su "sí" [Estimate del umbral; en el demo se declara sintético]. El banco JAMÁS se conecta: solo 3 números dichos en voz alta (hipótesis (c) del brief: input mínimo).
2. (1:00–2:00) **Sábado bueno:** se simula el cobro de una semana pico ($215.000 sintético) → audio de la Vuelta con la separación de cuentas mentales («$3.500 son del pacman; la ropa del nieto sale tranquila de los $180.000»).
3. (2:00–3:00) **Sábado flojo:** semana de $95.000 → el bot NO cobra nada y lo dice explícitamente: «esta semana no hubo Vuelta y no pasa nada: el pacman puede esperar» (la regla solo cobra picos — cero culpa en semana mala, el anti-planilla).
4. (3:00–4:00) **Viernes de pago:** pantalla del "tablero del pacman" (panel interno del equipo, no un dashboard para ella): deuda sintética que baja de 62 → 55 meses con 3 Vueltas; el audio mensual resume: «4 semanas, 3 vueltas, $12.000, 19 meses menos, ~$140.000 de intereses que no vas a pagar».
5. (4:00–5:00) **Derivación R4 en vivo:** caso alternativo con morosidad sintética → el audio cambia a modo información/derivación (SERNAC/reprogramación, Ley 21.673) sin recomendar producto alguno. Cierre: la cifra CMF del 84% pagando intereses por cuotas "sin interés" [Data — cmfchile.cl/portal/prensa/625/w4-article-95105.html].

**Datos sintéticos, nombrados:** "Patricia sintética", "Banco Sintético", catálogo sintético, ventas sintéticas; audios TTS; sandbox WhatsApp Cloud API; R2 solo para assets sintéticos.

#### Stack en 2 días + costo demo estimado

- **Canal:** WhatsApp Cloud API número de prueba (flujo conversacional de 3 preguntas + audios salientes); plan B (R6): grabaciones de respaldo pre-generadas — el demo no depende de la red del venue.
- **Motor de reglas + guiones:** GLM-5.3 (convierte respuestas en voz a la regla %/umbral, calcula la Vuelta de la semana, redacta guiones con el tono "pacman" y el cálculo de meses/intereses según estructura NCG 537) → TTS → audio saliente.
- **Infra:** Vercel (webhook, API, mini-panel "tablero del pacman" para el demo), R2 para audios/sintéticos. Sin banco, sin open banking (SFA chileno recién en jul-2027 [Data — cmfchile.cl/portal/prensa/625/w4-article-82737.html]).
- **En el demo, la Vuelta se "abona" manualmente** (transferencia simulada en pantalla); automatizar el abono real requeriría integraciones bancarias fuera de alcance y de R5 — se deja fuera a propósito.
- **Costo demo estimado: US$0–3** [Estimate: idéntico a 3.a; free tiers + tokens de GLM provista + TTS gratis].

#### Qué se deja fuera A PROPÓSITO

- **Automatización del abono a la tarjeta:** fuera de alcance técnico/regulatorio en 2 días; el producto dirige la acción ("transfiere $3.500 ahora, 3 toques") pero no ejecuta pagos.
- **Conectar el banco / open banking:** imposible hasta jul-2027 en Chile y emocionalmente equivalente a abrir la app [Data + Assumption].
- **Presupuesto, categorías, registro de gastos:** anti-planilla por diseño (ficha: la planilla murió a las 2 semanas).
- **Cobrar en semanas malas / metas fijas:** la regla SOLO cobra picos; semana floja = cero Vuelta, cero culpa. Una meta fija mensual sería la promesa de diciembre otra vez.
- **Castigos por incumplimiento:** John 2018 — los compromisos duros autoseleccionados dañan (55% incumple y pierde plata) [Data — economics.yale.edu]. El testigo social es celebratorio o no existe.
- **Mostrarle el total de la deuda cada semana:** eso es exactamente lo que no puede sostener (ostrich effect); el pacman habla en MESES ganados, no en saldo.
- **Notificaciones diurnas y lunes:** su ventana es la noche y el corazón del ritual es el SÁBADO de cobro (ficha).

#### Riesgos

- **Compliance (R5):** BAJO — el producto estructura un hábito de pago con información y visualización; jamás recomienda productos financieros, y el abono es a SU propia tarjeta, no a un instrumento externo. El cálculo de intereses usa la fórmula pública NCG 537 [Data]. Trigger de derivación (R4) cuando carga >50% o morosidad [Data — CMF 2025].
- **Build:** BAJO-MEDIO — el motor de reglas es aritmética simple + conversación por audio; el riesgo real es el ASR de audios de una persona de 58 en ambiente doméstico → fallback inmediato a texto/teclado numérico de 3 cifras.
- **Credibilidad ante el jurado:** MEDIO — "¿de dónde salen los $180.000 de umbral?" → del propio onboarding (su mejor semana real, dicho por ella); "¿y si el pico nunca llega?" → el pacman espera sin culpa (por diseño no hay deuda del compromiso). Riesgo residual: que el jurado le encuentre parecido a "pagar más", que es lo que ella YA hace mal… contrarrestado en el pitch: la diferencia es que aquí el "más" nace solo en semanas pico, con identidad separada, sin tocar lo de su mamá, y se le celebra. [Opinion]

#### Auto-score 3.b (D1–D7)

| Dim. | Score | Justificación (1 línea) |
|---|---|---|
| D1 · Problema-raíz | **7,5** | Ataca la causa-raíz 3 («cuotas chicas» diluyen la señal) con mental accounting + Save More Tomorrow traducido a picos de ventas; la evitación (causa 2) se esquiva en vez de tratarse de frente. |
| D2 · Credibilidad de cambio | **8** | La acción nace del pico (no del sacrificio), la compra del nieto queda blindada, el testigo es su hija celebrando — el "no toco lo de mi mamá" es el argumento más creíble para ESTA persona; riesgo: el pico es estacional (diciembre malo = pocas Vueltas). |
| D3 · Constrible 2 días | **8,5** | Sin OCR, sin parseo de PDF, sin integraciones: 3 números + regla % + audios + mini-panel; lo más constrible de las dos. |
| D4 · Demo en vivo | **7,5** | Un mes comprimido en 5 min es teatral y claro; el "sábado flojo sin culpa" es el momento que derrite objeciones; algo menos wow que la voz respondiendo en vivo. |
| D5 · Espacio competitivo | **8** | Nadie hace "commitment sobre picos de ingresos variables con identidad de cuenta mental" — ni YNAB (presupuesto para dispuestos-a-mirar) ni apps chilenas (dashboards/planillas) [Data — kaneapp.cl; finanzasapp.cl; kavero.cl; savvyladies.org]. |
| D6 · Capital ≈ 0 + unit economics | **9** | US$0–3; sin integraciones que costeen; costo marginal <US$0,10/usuario/mes [Estimate]. |
| D7 · Escala en Chile | **7,5** | 6,1 M de deudores y 14,1% sobreendeudados [Data — CMF 2025], y el subsegmento "ingresos variables + evitación" (informales, vendedoras, cuidadoras) es masivo; algo menor que 3.a porque exige ventas semanales regulares. |

**Promedio 3.b: 8,0/10** [Estimate aritmético].

---

## Veredicto comparativo (para el equipo, no para el pitch)

| | **3.a Cuenta Conmigo** | **3.b La Vuelta del Sábado** |
|---|---|---|
| Eslabón de la cadena que rompe | Causa-raíz 2: la evitación (ostrich effect) | Causa-raíz 3: la dilución de la señal («cuotas chicas») |
| Primera acción exigida | Reenviar un correo cerrado (10 s, lunes) | Contestar 3 audios una vez (60 s) |
| Qué pasa si la angustia gana esa semana | El audio baja la dosis sola | La Vuelta no cobra y no hay culpa |
| Riesgo principal de abandono | El hábito del lunes (gatillo externo: el correo) | La estacionalidad del pico (gatillo interno: sus ventas) |
| Fit con el éxito verbatim | «vuelva a MIRAR sus cuentas» — directo | «deje de pagar SOLO el mínimo» — directo |

[Opinion] **3.a y 3.b son complementarias en producción** (mirar dosificado → abono con identidad) y el jurado premia la tesis de fondo compartida: la angustia es el punto de partida; el canal es el que ya usa; el juicio está prohibido; la deuda grave deriva (R4). Para el hackatón, **3.a es la candidata principal** (demo más emocional, ataca el síntoma visible de 7 meses, D4=9) y 3.b el contrapunto que demuestra profundidad de pensamiento conductual si el jurado pregunta "¿y después del primer pago extra?".

---

## Flags

**Yellow:**
- **Ningún RCT del mecanismo exacto:** no encontré evidencia experimental que mida "exposición gradual dosificada por audio → abrir estado de cuenta → pagar sobre el mínimo" (gap ya declarado en el análisis). Las dos propuestas se apoyan en proxies validados por separado (RCT chileno de recordatorios OECD-OPSI 2023; SFMW 2022 piloto sin control; SMarT 2004 en contexto de sueldos, no de ventas por catálogo) — los tres traslados se declaran como hipótesis del producto, no como hechos.
- **"DITEC" no verificado:** no encontré institución pública chilena verificable con ese nombre en mis búsquedas; la derivación R4 se fundamenta en SERNAC + Ley 21.673 (Garantías de Refinanciamiento) + la propia banca, todos con URL.
- **Competencia:** panorama local construido con sitios oficiales (kaneapp.cl, finanzasapp.cl, kavero.cl) y una fuente gris para Fintonic-fuera-de-Chile (Reddit r/chile). "Sllinker"/"Fintonomo" del brief: dos búsquedas, sin rastro real — tratados como no-verificables, no como competidores.
- **Montos del recorrido:** todos los pesos de Patricia sintética son [Estimate] construidos para ser consistentes con la fórmula NCG 537 y plausibles para venta por catálogo en Talca; no son datos de mercado.
- **Costos:** "US$0–3" y "<US$0,10/usuario/mes" son [Estimate] con supuestos de free tier vigentes a oct-2026; no cotización contractual.
- **Backend de búsqueda intermitente:** el backend primario falló varias veces (error NoneType) y sirvió un tier gratuito alterno; toda búsqueda citada retornó resultados efectivamente.

**Red:** ninguno.

