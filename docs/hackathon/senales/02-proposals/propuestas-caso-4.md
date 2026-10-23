# Propuestas MVP — Caso 4 (Marco, 52 · operador 7×7, dolor lumbar)

*2 conceptos con mecanismos conductuales distintos · 2026-10-12 · Ambos cumplen: nada de celular en el turno, nada de supervisor/empresa, sin login/wifi diario obligatorio, R4 (derivación a kinesiólogo/médico ocupacional; no reemplaza el examen de aptitud), datos sintéticos nombrados (R2), stack free tier US$0.*

---

### Propuesta 4.a — **"El Pacto del Piquete"**

- **Pitch en una línea**: El dolor de espalda no se combate solo: se combate por piquete — un pacto de turno, firmado en la bajada, que hace visible quién "llega entero" y convierte la pausa en lo normal del grupo.

- **Mecanismo (QUÉ hace que haga la pausa y le duela menos)**:
  - **Norma social entre pares + compromiso público**: la marca diaria de cada operador se hace **en la noche del campamento** (wifi, 1-3 taps en el grupo de WhatsApp del piquete), nunca en el turno. El bot agrega la semana del piquete y devuelve una sola cifra: "el piquete llegó entero 5/7". Principio: las normas de los pares predicen la conducta mejor que el mandato de la empresa — [Data] Ball et al., https://pmc.ncbi.nlm.nih.gov/articles/PMC3018448/ (2011, evidencia clásica); apoyo entre pares en salud laboral, Linnan/UNC, https://sph.unc.edu/wp-content/uploads/sites/112/2015/09/CCRWH_Linnan_Peer-Support-in-Workplace-Interventions.pdf (2015); normas sociales positivas ↔ más actividad y menos sedestación, https://www.tandfonline.com/doi/full/10.1080/02678373.2026.2633716 (2026). La norma a voltear está textual en el caso: «a todos en la faena les duele la espalda, es parte de la pega».
  - **Fresh start en la bajada**: el pacto se firma y renueva el domingo de bajada, no el lunes arriba — [Data] Dai, Milkman & Riis, "The fresh start effect", Management Science 2014, https://psycnet.apa.org/record/2014-43171-006. La bajada a Antofagasta con los nietos es el hito temporal que abre un período nuevo cada 14 días.
  - **"Le duela menos"**: micro-pausas de 40 segundos ("snacks") en los tiempos muertos del ciclo + 5 minutos de descarga lumbar nocturna en la pieza del campamento — [Data] revisión sistemática de RCTs: snacks de 30s a 10 min alivian molestias musculoesqueléticas en sedestación prolongada, https://pmc.ncbi.nlm.nih.gov/articles/PMC13285421/ (2026; efectos modestos, evidencia en oficinas — extrapolación a Marco declarada como [Assumption] en el análisis del caso).
  - **R4 en el flujo**: pain report semanal (EVA, 1 tap); si el dolor no cede o hay banderas rojas (irradiación a pierna, dolor nocturno no mecánico, hormigueo), el bot deriva al kinesiólogo/médico ocupacional de la mutualidad antes del próximo examen — la solución no reemplaza el examen de aptitud.

- **Recorrido del usuario (un ciclo 7×7 real de Marco, 5 pasos)**:
  1. **Domingo de bajada, Antofagasta**: Marco abre el WhatsApp del piquete (su canal habitual) y firma el pacto del ciclo: "esta vuelta llegamos enteros". Adjunta su motivo: una foto jugando con los nietos. GLM-5.3 genera el pacto con tono minero, sin corporate-speak.
  2. **Lunes D1, arriba**: en los tiempos muertos del ciclo hace sus snacks de 40s con la **ficha física imantada en la cabina** (sin celular). En la noche, con el wifi del campamento, marca su día en el grupo (3 taps, tolerante: si no hay wifi, contesta atrasado y nada se pierde).
  3. **Miércoles D3 (dolor al levantar carga)**: pain report corto; GLM ajusta los snacks de la ficha de mañana y, si el dolor no baja, dispara la derivación (R4).
  4. **Viernes D5 (peak de dolor)**: el piquete va 4/6. El bot muestra la comparación con el ciclo anterior — sin ranking nominal, sin culpa por el día perdido (sin guilt-tripping; el caso enseña que la culpa no motiva a este perfil).
  5. **Domingo D7, bajada**: resumen del ciclo — "llegaste entero 5/7; lomo de 4/5 a 3/5" — y cambia a **modo Nietos**: rutina de 10 min/día para la semana de bajada, progresiva, pensada para agacharse al piso y jugar sin dolor. El pacto se renueva con la foto del asado del domingo.

- **Por qué los intentos previos de Marco NO eran esto**: la kinesiología dio dosis sin mantenimiento ni testigos; la faja, reacción sin prevención; la cartilla del casino, papel sin gatillo ni pares; la pausa de la empresa, un mandato que choca con la producción y que nadie protege. El pacto es **un acuerdo entre pares, no un mandato** (posible porque es contratista: no pasa por la gerencia); la marca es **nocturna, no en el turno**; y lo que se hace visible es la racha del piquete, que voltea «a todos les duele» en «el que hace su pausa llega entero a la bajada».

- **Demo en 5 minutos** (datos sintéticos: **"Marco sintético"** y **"piquete sintético"**, 6 operadores ficticios — R2):
  1. (1 min) Vivo: el jurado ve el WhatsApp del piquete en el número de prueba — Marco sintético marca su día con 3 taps; el bot responde con el estado del piquete (imagen generada, servida desde R2).
  2. (2 min) Dashboard Vercel: dos ciclos 7×7 sintéticos — EVA del piquete bajando 4→2, racha colectiva 2/6 → 5/6, mapa de calor de snacks por día del turno (D1-D7 del caso).
  3. (1 min) El momento clave: el mensaje del domingo de bajada — pacto renovado + video del modo Nietos (10 s) + la cifra "llegaste entero".
  4. (1 min) La ficha física impresa se pasa al jurado (elemento no-digital del turno) y la bandera roja demo → mensaje de derivación a la mutualidad (R4).
  Plan B: grabación local del flujo completo si la red del venue falla (R6).

- **Stack en 2 días + costo demo**: Vercel (dashboard del piquete + generador del pacto) · GLM-5.3 (pacto, ajuste de snacks, resumen semanal) · Cloudflare R2 (imágenes, PDFs de la ficha, video del modo Nietos) · WhatsApp Cloud API número de prueba (conversaciones solo con números verificados del equipo). **Costo demo: US$0** [Estimate: free tiers; el trial de WhatsApp permite el flujo completo con 5 destinatarios verificados; consumo GLM dentro del free tier del evento].

- **Qué se deja fuera A PROPÓSITO**: wearables y telemetría (sin carga arriba); puntos y ranking individual (fomenta culpa y abandono); panel para la empresa o el supervisor (mataría el pacto: deja de ser de los trabajadores); recordatorios en el turno (celular prohibido); diagnóstico clínico y cualquier certificación de aptitud (R4: deriva, no reemplaza); gamificación con premios materiales (el motivo de Marco es emocional, no económico).

- **Riesgos**:
  - *Compliance*: presión de pares invertida — mitigación: opt-in por piquete, sin ranking nominal, sin castigos, salida individual sin penalización; los datos del grupo no salen del grupo.
  - *Build*: bajo — agregación de marcas nocturnas y generación de imágenes; sin integraciones con terceros.
  - *Credibilidad ante el jurado*: "¿y si el piquete no adopta el pacto?" — respuesta: el piquete ya existe como estructura social (el caso lo cita); el producto solo lo instrumenta, y un pacto de 2 personas también funciona.

- **Auto-score D1-D7 (0-10)**:
  - D1 problema-raíz: **9** — ataca la norma social («a todos les duele») con el único agente que puede voltearla: los pares.
  - D2 credibilidad de cambio: **8** — compromiso público + fresh start cada 14 días son mecanismos probados; resta un punto por la dependencia de que el piquete se sume.
  - D3 constrible en 2 días: **8** — chat + dashboard + ficha imprimible; sin hardware; el agregado semanal es trivia de estado.
  - D4 demo en vivo: **8** — WhatsApp en vivo + ficha física al jurado + un número que sube (racha del piquete).
  - D5 espacio competitivo: **7** — nadie compite por el pacto entre pares en contratistas mineras: los MSK digitales (SWORD, Kaia) son B2B employer ([Data] https://sword.com/; https://kaiahealth.com/newsroom/press-releases/kaia-health-joins-sword-health/) y no tocan la norma del piquete.
  - D6 capital ≈0 + unit economics: **9** — US$0 en demo; el canal es el hábito existente de Marco (WhatsApp nocturno).
  - D7 escala de impacto: **8** — [Data] 257.000 trabajadores de contratistas en la gran minería chilena (Consejo Minero jun-2026, https://consejominero.cl/wp-content/uploads/2026/07/20260706-CAM-junio.pdf); el pacto escala piquete por piquete sin intervención de faena.

---

### Propuesta 4.b — **"Entre Vueltas"**

- **Pitch en una línea**: No le pidas a Marco que pare el camión: cuelga 40 segundos de movimiento de las veces que el camión YA está detenido — la pausa que no choca con la producción es la única que no se puede "no alcanzar".

- **Mecanismo (QUÉ hace que haga la pausa y le duela menos)**:
  - **Implementation intentions ancladas a gatillos estructurales**: en la noche del campamento, GLM-5.3 arma con Marco planes "si-entonces" del día siguiente: «SI estoy en la fila del rompe, ENTONCES 10 retroversiones pélvicas», «SI baja la tolva a cargarme, ENTONCES 3 respiraciones de diafragma con co-activación». Principio: [Data] los planes si-entonces cierran la brecha intención-acción, con meta-análisis Gollwitzer & Sheeran (síntesis: https://pmc.ncbi.nlm.nih.gov/articles/PMC4500900/; https://cancercontrol.cancer.gov/brp/research/constructs/implementation-intentions). El turno NO exige decisión: solo ejecutar el plan que ya está escrito.
  - **Exercise snacking dosificado por IA**: la "pausa activa" se rediseña de bloque de 15 min (que choca con el cambio de turno) a **5-6 snacks de 40 segundos** dentro de detenciones que ya ocurren (cargando, filas, traspaso, toma de agua) + 5 min de descarga nocturna — [Data] revisión sistemática de RCTs: snacks de 30s a 2-3 min alivian molestias MSK en sedestación prolongada, https://pmc.ncbi.nlm.nih.gov/articles/PMC13285421/ (2026). El dolor lumbar de conductores es el problema típico del oficio: [Data] prevalencia anual 55,3% (meta-análisis 2024, https://www.sciencedirect.com/science/article/pii/S0033350624001094); ≥41 años OR 2,10 (https://link.springer.com/article/10.1186/s13018-024-04999-z).
  - **La ficha física, no el celular**: el plan del día se imprime en una **ficha imantada** (PDF generado en R2) que vive en la cabina. El celular jamás entra al turno; la ficha es el único artefacto del turno. Sin login diario: el check-in nocturno es opcional, atrasable y recuperable (wifi "a ratos" no rompe la cadena).
  - **Fresh start + modo Nietos**: el plan arranca el domingo de bajada ([Data] Dai/Milkman/Riis 2014, https://psycnet.apa.org/record/2014-43171-006) y en la semana abajo cambia a rutinas si-entonces de la casa: «SI los cabros me llaman a la pelota, ENTONCES 5 min de activación antes».
  - **R4 en el flujo**: el pain report semanal filtra banderas rojas → derivación explícita al kinesiólogo/médico ocupacional de la mutualidad; el producto prepara el cuerpo para el examen de aptitud, jamás lo reemplaza.

- **Recorrido del usuario (un ciclo 7×7 real de Marco, 5 pasos)**:
  1. **Domingo de bajada, Antofagasta**: onboarding por WhatsApp (15 min): Marco elige sus 3 gatillos reales del turno ("cuando me cargan", "cuando estoy en la fila", "cuando cambio de turno") y firma sus si-entonces. El sistema genera su primera **Ficha de Cabina** (PDF, R2) lista para imprimir.
  2. **Lunes D1, arriba**: la ficha imantada en la cabina tiene 3 movimientos de 40 segundos. En cada detención estructural, ejecuta. Cero celular, cero decisión, cero producción robada.
  3. **Martes-jueves, noches de campamento**: check-in nocturno de 2 min (atrasable si el wifi falla): "¿cómo anduvo el lomo hoy?" — GLM ajusta la ficha de mañana según dolor, sueño y días que faltan del turno.
  4. **Viernes D5 (peak de dolor)**: reporte del ciclo: snacks hechos 11/15, EVA 3/5 (venía en 4). Si el dolor no cede → bandera roja → derivación (R4).
  5. **Domingo D7, bajada**: cierre del ciclo + **modo Nietos**: rutina de 10 min/día para la semana abajo, con progresión para jugar en el piso. La próxima ficha se arma para el regreso.

- **Por qué los intentos previos de Marco NO eran esto**: nada de lo que hizo Marco definía CUÁNDO y EN QUÉ MOMENTO concreto. La kinesiología dio ejercicios sin gatillos; la cartilla dio gatillos difusos ("en el casino") sin motor de ajuste; la faja, reacción sin prevención; la pausa de la empresa definía un bloque de 15 min que **no existe** en su turno (choca con el traspaso y la producción). Entre Vueltas usa momentos que ya existen en cada ciclo de acarreo y dosifica el resto a la noche — por eso no se puede "no alcanzar".

- **Demo en 5 minutos** (datos sintéticos: **"Marco sintético"**, ciclo 7×7 sintético — R2):
  1. (1,5 min) Onboarding en vivo por WhatsApp: GLM entrevista a Marco sintético y construye sus 3 si-entonces a la vista del jurado.
  2. (1 min) La Ficha de Cabina impresa se pasa al jurado — el artefacto físico del turno (generada desde R2 como PDF en vivo).
  3. (1,5 min) Simulación de 3 días: check-in nocturno → GLM ajusta la ficha de mañana → pain report EVA bajando 4→3 con snacks contados.
  4. (1 min) El remate: "0 minutos de producción robados" + bandera roja → mensaje de derivación a la mutualidad (R4) + modo Nietos.
  Plan B: flujo completo pre-grabado localmente + fichas físicas de respaldo (R6).

- **Stack en 2 días + costo demo**: Vercel (onboarding web + generador de fichas PDF) · GLM-5.3 (entrevista de gatillos, ajuste diario, tono) · Cloudflare R2 (PDFs de fichas, video-demo del modo Nietos) · WhatsApp Cloud API número de prueba. **Costo demo: US$0** [Estimate: free tiers; GLM y R2 dentro de los tiers del evento; el trial de WhatsApp cubre el flujo con números verificados].

- **Qué se deja fuera A PROPÓSITO**: recordatorios o interacción durante el turno (celular prohibido); wearables/telemetría de postura (sin carga arriba, y ningún minero acepta sensor corporal hoy [Opinion]); rutinas largas de gimnasio (ya probó 2 sesiones y no sostuvo); contar pasos o minutos (métrica de oficina, no de rajo); depender del supervisor o reportar a la empresa; cualquier función de diagnóstico o reemplazo del examen de aptitud (R4); app nativa que exigiría descargar y mantener (el canal es WhatsApp, que Marco ya usa).

- **Riesgos**:
  - *Compliance*: dolor lumbar crónico en un trabajador de 52 años — el flujo debe derivar (R4) y no prometer alivio médico: mitigación explícita en el copy y en la demo.
  - *Build*: la generación de PDF de ficha + loop de chat con estado por día — acotado; el riesgo real es el detalle visual de la ficha en 2 días.
  - *Credibilidad ante el jurado*: "¿puede un operador moverse 40 segundos en cabina?" — respuesta: movimientos sentado (retroversión, respiración, co-activación), sin salir del asiento ni detener el ciclo [Assumption razonada; flag declarada en el análisis: los tiempos muertos del ciclo no están cronometrados en la literatura encontrada]. El onboarding deja que Marco elija gatillos REALES de su faena, que es además el mecanismo de defensa: si un gatillo no existe, él lo cambia y el plan se recalibra.

- **Auto-score D1-D7 (0-10)**:
  - D1 problema-raíz: **9** — disuelve la frase «si paro, el turno queda atrasado» por diseño: no hay que parar nada.
  - D2 credibilidad de cambio: **9** — si-entonces con gatillos reales elegidos por Marco + microdosis: la carga conductual por decisión es casi nula y no compite contra la producción ni el cansancio.
  - D3 constrible en 2 días: **9** — chat + generador de PDF + simulación; cero hardware, cero tercero.
  - D4 demo en vivo: **9** — onboarding con IA en vivo, la ficha física en la mano del jurado, una línea de dolor que baja.
  - D5 espacio competitivo: **8** — el incumbente (SWORD/Kaia, B2B employer, [Data] https://sword.com/) requiere empleador y wearables; nada atiende al contratista con un canal sin celular en turno.
  - D6 capital ≈0 + unit economics: **9** — US$0; el costo marginal por operador es una conversación de WhatsApp + un PDF [Estimate: conversaciones de servicio en tier de prueba].
  - D7 escala de impacto: **8** — mismos 257.000 contratistas (Consejo Minero, jun-2026, https://consejominero.cl/wp-content/uploads/2026/07/20260706-CAM-junio.pdf); el onboarding cabe en una vía formal de mutualidad (las mutualidades ya promueven pausas activas: [Data] ACHS Servicios, 2024, https://www.esachs.cl/noticias/noticia-detalle/2024/pausas-activas-y-masajes-en-silla-para-trabajadores).

---

## Cuál defenderíamos y por qué (nota de comparación para el pitch)

[Opinion] **4.b "Entre Vueltas" es la defendible**: mata directamente la frase-obstáculo del caso («si paro, el turno queda atrasado») con un mecanismo individual que no depende de que el piquete se sume — aunque su eslabón más frágil es que los gatillos del ciclo deben ser reales ([Assumption] flaggeada). **4.a "El Pacto del Piquete"** es la única que voltea la norma social («a todos les duele») y la mejor respuesta a la pregunta de cierre del jurado («¿con cuál cambiaría esta persona?»: con la que sus propios compañeros ya validaron) — la mezcla natural post-hackatón: ficha si-entonces (4.b) dentro de un pacto de piquete (4.a). Para 2 días, se construye una y se cuenta la otra.

## Flags

- **Yellow** — Los "tiempos muertos" del ciclo de acarreo como ventana de micro-pausa no están cronometrados en ninguna fuente encontrada: la validación de gatillos debe hacerla el propio Marco en el onboarding (y así se diseñó).
- **Yellow** — Evidencia de exercise snacks es en oficinas (efectos modestos); la extrapolación a operadores mineros 7×12h es [Assumption] declarada. El pitch no debe prometer reducción de dolor garantizada — solo el mecanismo + derivación (R4).
- **Yellow** — Trial de WhatsApp Cloud API restringe conversaciones a números verificados: la demo en vivo requiere tener esos números listados con anticipación; fallback grabado obligatorio (R6).
- **Red** — ninguna.
