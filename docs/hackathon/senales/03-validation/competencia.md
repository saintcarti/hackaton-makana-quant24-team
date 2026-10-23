# Competencia — quién ataca hoy el problema «paga gym y no sostiene»

*Validación startup de «La Cita» (C1.a) · Hackatón Señales · 12-oct-2026 · Protocolo de honestidad activo. Cada competidor: qué es, pricing, por qué le falla a Camila (mapeado contra las restricciones del caso: nada de precio, nada de más contenido, nada de culpa) y gap que deja libre.*

**Marco de evaluación.** El caso prohíbe tres ejes (más contenido, jugar con precio, culpa) y exige uno (logística de asistencia sostenida, «que vuelva a entrenar y lo sostenga»). Evaluamos cada solución contra las **restricciones duras del caso** (01-cases/caso-1-analisis.md §5): no exigir abrir apps nuevas, no madrugar, no pagar por decidir, no procesar culpa, no cambiar de gym, no más autocontrol.

---

## 1. Apps de rutinas/entrenamiento (el eje QUÉ) — saturado y fallando

### 1.1 Freeletics
- **Qué es:** app de entrenamiento con AI Coach adaptativo (bodyweight/HIIT, sin equipo necesario).
- **Pricing:** [Data 2026] **sin plan mensual**: US$34,99 por 3 meses y US$74,99–94,99 por 12 meses (≈US$6,25–7,9/mes ≈ **$5.900–7.500 CLP/mes**); lifetime US$549,99; mínimo 3 meses (https://ionikhealth.com/fitbod-alternatives · https://www.sensai.fit/blog/fitness-app-pricing-free-tier-comparison ).
- **Por qué le falla a Camila:** le da QUÉ hacer (rutinas adaptadas). Camila ya tuvo **3 apps de rutinas** — el caso lo declara intento fallido. Añade una app más que hay que abrir cada día: «la app del gym, que abre y cierra sin ir». No fija slot, no la espera nadie, no defiende la decisión a las 19:00.
- **Restricción del caso violada:** más contenido + una app nueva que abrir.

### 1.2 Fitbod
- **Qué es:** app que genera rutinas de fuerza adaptadas al equipo disponible y al recovery (muscle recovery tracking).
- **Pricing:** [Data 2026] US$15,99/mes o US$95,99/año (≈$8/mes en anual); precios subieron en 2026 desde US$12,99/79,99; trial 7 días (https://ionikhealth.com/fitbod-alternatives · https://www.sensai.fit/blog/fitness-app-pricing-free-tier-comparison ).
- **Por qué le falla a Camila:** idéntico eje QUÉ. Además optimiza el contenido de la sesión, no el momento de la decisión. Su app del gym ya tiene “plan personalizado” (Smart Fit app, https://www.smartfit.cl/planes ) y no la hace ir.
- **Restricción violada:** más contenido; app diaria.

### 1.3 Fitness Builder / Jefit / Strong (rastreadores de rutina)
- **Qué es:** bibliotecas de ejercicios + logging de series (Fitness Builder fue el clásico video-exercise library, ~2.000 ejercicios).
- **Pricing:** [Estimate] freemium con pro ~US$5–10/mes (rango de categoría).
- **Por qué le falla a Camila:** el logging es para quien YA está yendo; presume asistencia. Es más contenido + más fricción (registrar series) para alguien cuya barrera es la decisión de salir de la oficina.
- **Restricción violada:** más contenido; exige sesión ya iniciada.

### Qué dice la investigación sobre este eje
- **Las apps de fitness retienen ~3% de usuarios al día 30** (y activación 26%→10% entre día 1 y 28) — [Data (2026, press-release, direccional, no peer-reviewed)]: https://usatoday.com/press-release/story/39808/fitness-refined-releases-2026-report-on-why-fitness-app-users-quit . Los suscriptores premium de apps de salud churnean 46,8% en 90 días — [Data]: https://fitpocket.fitness/insights/the-retention-data-told-me-something-the-fitness-industry-ignores .
- [Opinion] Con retención de un dígito, cualquier app de contenido es “más QUÉ para quien ya tiene QUÉ de sobra”. Exactamente lo que el caso y el scoring-contract llaman “mata la solución”.

## 2. Apps de compromiso con dinero en juego (el eje INCENTIVO) — probado, con historical failure

### 2.1 GymPact (después Pact) — ⚠️ quebró
- **Qué era:** la app icónica de commitment contracts: pactabas N sesiones/semana; si cumplías, recibías dinero de los que fallaron; si fallabas, pagabas (multa de US$5–50 por workout perdido; verificación por GPS check-in).
- **Pricing:** gratis + pago por fallo; rewards de US$0,30–5/semana financiados por las multas de los demás.
- **Qué pasó:** Pact **cerró en julio 2017** (fundada 2011 como GymPact; rebrand 2014; US$2,5M de Khosla Ventures) y la **FTC le impuso un settlement de ~US$948.788** (sept-2017) por cobrar a usuarios que SÍ cumplieron o intentaron cancelar — «decenas de miles de quejas» — [Data, >18 meses]: https://mobihealthnews.com/content/khosla-backed-fitness-startup-pact-shuts-down · https://theregister.com/2017/09/21/pact_app_slapped_for_fleecing_flap · https://fortune.com/2017/09/23/exercise-app-pact-settlement . [Assumption] Los reportes no aíslan la causa de la quiebra (bugs de GPS, cobros, modelo); el hecho duro es que el modelo prometía pagar y no pagó, con carga operativa y reputacional terminal.
- **Por qué le falla a Camila:** (a) juega con **precio** — vetado por el caso («la plata no es el problema»); (b) castiga el fallo → **culpa financiera**, la emoción que el caso dice que «le quita las ganas de ir»; (c) además, el caso ya contiene el experimento natural: **«Vio la promo de un gym donde no pagas si entrenas y tampoco se cambió»** — el incentivo monetario ya fue probado EN Camila y falló; (d) la verificación por GPS-avellana (Fortune: usuarios con el gym no reconocido) añade fricción de auditoría al usuario de buena fe.
- **Restricción violada:** precio + culpa.

### 2.2 HealthyWage
- **Qué es:** apuestas de pérdida de peso/desafíos por dinero (bet on yourself); la empresa paga premios si cumples.
- **Pricing:** gratis para apostar; tú defines la apuesta (ej. US$100/mes × meses).
- **Por qué le falla a Camila:** mismo eje precio/culpa; además orienta el objetivo a **peso/báscula** — métrica de cuerpo = material de culpa, y el caso pide «sentirse bien en su cuerpo, sin volverse fanática». Diseñado para bettors, no para jefas de proyectos con ventana dispersa.
- **Restricción violada:** precio + culpa + métrica corporal.

### 2.3 StepBet / WayBetter
- **Qué es:** apuestas de pasos (wearable-verified step challenges); WayBetter es la casa matriz (reencarnación del modelo Pact pero con pasos en vez de asistencia al gym).
- **Pricing:** [Data] bet de US$40 por juego de ~6 semanas (https://waybetter.com / descripciones de mercado). Activo en 2026.
- **Por qué le falla a Camila:** los pasos no son su objetivo (el caso es asistencia al gym que ya paga); el fallo cuesta plata (culpa+precio); y depende de un wearable que el caso no muestra que tenga.
- **Restricción violada:** precio + culpa; además resuelve otra conducta (pasos, no gym).

## 3. Gyms con promos de asistencia (el eje PRECIO desde la oferta) — el experimento ya corrido en Camila

### 3.1 Promo «no pagas si entrenas» (modelos tipo Black Tag / campañas de cadenas)
- **Qué es:** el gym condiciona el descuento/mensualidad a asistir N veces (la promo que Camila vio). En Chile, cadenas low-cost y boutiques han usado promos de mensualidad condicionada; el caso la documenta textualmente: «Vio la promo de un gym donde no pagas si entrenas y tampoco se cambió».
- **Pricing:** mensualidad condicionada (variable por cadena).
- **Por qué le falla a Camila:** el caso lo dice directamente: **la vio y no se cambió**. Para cambiar de gym hay que darse de baja, y «si me salgo del gym, ahí sí que no vuelvo nunca». Además vuelve a poner el dinero en el centro, que es justamente el eje que NO mueve a este perfil.
- **Nota estructural:** esta promo revela que **el gym sabe que su problema es la asistencia**, pero solo tiene el martillo del precio. [Opinion] Es el competidor más peligroso a futuro (mismo dolor, mejor distribución), pero hoy su herramienta está mal para el segmento (ver Gap).
- **Restricción violada:** precio + exige cambiar de gym.

## 4. Contenido+coaching premium (el eje MOTIVACIÓN/COMPAÑÍA pagada)

### 4.1 Peloton / Aaptiv / apps de clases en vivo
- **Qué es:** clases streaming con instructor (bike/tread/running, strength, yoga), comunidad y leaderboards.
- **Pricing:** [Estimate] Peloton App+ ~US$24/mes (rango de planes App 2026: https://www.sensai.fit/blog/fitness-app-pricing-free-tier-comparison ); Aaptiv ~US$15/mes.
- **Por qué le falla a Camila:** reemplaza el gym — pero Camila YA PAGA un gym y no quiere salirse («si me salgo, no vuelvo»). El caso exige trabajar DENTRO de la membresía existente (restricción 5 del análisis). Además: es contenido (QUÉ), y los leaderboards/rachas son culpa institucionalizada para quien falla («te quedaste atrás»).
- **Restricción violada:** más contenido + sugiere abandonar su gym + culpa social.

### 4.2 ClassPass (activo en Chile)
- **Qué es:** suscripción de créditos canjeables en miles de estudios/gyms (incluye Santiago: https://classpass.com/partners/lists/fitness-instructors-chile , operación local documentada en 2025).
- **Pricing:** [Estimate] planes ~US$19–89+ según créditos/mes (no publica tarifa CL en extract).
- **Por qué le falla a Camila:** (a) otra suscripción EN PARALELO a la que ya paga y no usa — el opuesto del reencuadre «tu mensualidad ya es tu activo»; (b) la fricción de reservar/clase canjeable se añade a su semana, no se le resta; (c) para el perfil «sin volverse fanática» exige toma de decisiones por crédidos cada semana. [Opinion] Resuelve el aburrimiento, no la asistencia.
- **Restricción violada:** añade costo + decisiones; no ataca el slot.

### 4.3 Personal trainer (presencial/online)
- **Qué es:** la solución “humana” clásica: alguien te espera a una hora fija.
- **Pricing (Chile):** [Data] sesión independiente $15.000–$35.000 CLP; online $8.000–$20.000/sesión o planes $40.000–$100.000/mes (https://cronoshare.cl/salarios/entrenador-personal ); a domicilio: $170.000/mes por 4 sesiones (https://academiademovimiento.cl/personal-trainer-a-domicilio/ ).
- **Por qué le falla a Camila:** **este es el competidor serio** — es el único que crea una CITA con hora y una persona que espera (la mitad del mecanismo de La Cita). Falla en: (a) precio: $170.000/mes es 5× su mensualidad — y aunque «la plata no es el problema», eso ya es otro presupuesto; (b) rigidez: requiere horario fijo semanal, y su ventana es dispersa («reuniones que se alargan», martes/jueves tarde) → cancelar con un trainer humano genera culpa interpersonal (el caso: la amiga que la acompañaba ya probó el costo moral de fallarle a alguien); (c) no re-agenda solo: cancelar/mover cuesta llamadas o WhatsApp con una persona.
- **Qué le roba a La Cita el PT presencial:** valida que la CITA con hora exacta es el mecanismo correcto — el mercado ya paga 5× la mensualidad por eso. La Cita es el 10% del precio del PT con re-agendado sin culpa.

## 5. Sistemas de recordatorio/agenda genéricos (el eje LOGÍSTICA sin inteligencia)

### 5.1 Calendario manual + alarmas (el “competidor invisible”)
- **Qué es:** Google Calendar propio + reloj del teléfono. Gratis. Ya lo tiene.
- **Por qué le falla a Camila:** la carga completa de fricción cae en el peor momento (domingo 23:55, «mañana parto»); las alarmas a las 06:30 se apagan 4 veces (experimento de campo documentado en el caso). El calendario manual no re-agenda, no negocia la hora en lenguaje natural y no envía el recordatorio a las 18:30.
- [Opinion] Este es el competidor real en la cabeza del jurado («¿y por qué no basta el calendario?»): la respuesta es que el calendario es pasivo — La Cita lo vuelve **activo**: captura la intención dominical, la convierte en invite y defiende/re-agenda la cita sola.

## 6. Tabla resumen

| # | Solución | Pricing (ref.) | Eje que ataca | Falla para Camila porque… | Gap que deja |
|---|---|---|---|---|---|
| 1 | Freeletics | US$34,99/3m; US$74,99–94,99/12m ≈ $5.900–7.500/mes [Data] | QUÉ (rutina IA) | más contenido = más app que no abre | slot defendido |
| 2 | Fitbod | US$15,99/mes; US$95,99/año [Data] | QUÉ (rutina fuerza) | idem | slot defendido |
| 3 | Fitness Builder/Jefit | Jefit Elite US$12,99/mes, US$69,99/año [Data] | QUÉ + logging | exige estar ya yendo | iniciar la conducta |
| 4 | GymPact/Pact | free + multa US$5–50 por fallo | incentivo $ | **QUEBRÓ jul-2017 + FTC US$948.788**; precio+culpa vetados | compromiso sin castigo |
| 5 | HealthyWage | apuestas propias | incentivo $ + peso | precio, culpa, báscula | sin dinero ni métrica corporal |
| 6 | StepBet/WayBetter | US$40/juego [Data] | incentivo pasos | otra conducta; wearable; castigo | asistencia al gym que ya paga |
| 7 | Promo «entrena y no pagas» | mensualidad condicionada | precio | Camila la vio y no se cambió | trabajar DENTRO del gym actual |
| 8 | Peloton/Aaptiv | ~US$15–24/mes [Est] | QUÉ en casa | reemplaza su gym; leaderboards=carga | dentro de su membresía |
| 9 | ClassPass Chile | ~US$19–89/mes [Est] | variedad | suscripción paralela + fricción de créditos | su gym ya pagado como activo |
| 10 | Personal trainer | $15.000–35.000/sesión [Data] | CITA + espera humana | 5× el precio; rígido; cancelar = culpa interpersonal | re-agendado sin culpa a 10% del precio |
| 11 | Calendario/alarmas manual | gratis | logística pasiva | la fricción cae en el peor momento del día | captura automática del fresh start |

## 7. El gap explícito que «La Cita» ocupa

Nadie opera hoy en la intersección: **(1) logística de asistencia** (cita con hora/lugar/contenido acotado, instalada en el calendario laboral que ya obedece), **(2) dentro de la membresía ya pagada** (sin comprar nada nuevo, reencuadrando el sunk cost), **(3) por un canal que ya habita** (WhatsApp, ~89,7% de usuarios de internet en Chile: https://adsize.io/geo/cl ), **(4) con tolerancia al fallo sin culpa** (mover ≠ fallar; sin rachas, sin dinero en juego, sin métricas corporales).

- Las apps de contenido (1–3, 8) tienen el QUÉ; ninguna toca el CUÁNDO/DÓNDE defendido.
- Las apps de compromiso (4–6) tienen el apalancamiento pero lo financian con culpa — la emoción contraindicada por el caso.
- El PT (10) tiene la cita, a 5× el precio y con culpa interpersonal al fallar.
- El gym (7) tiene el incentivo pero solo el de precio, y exige cambio de proveedor.
- El calendario (11) es el medio, pero pasivo.

[Opinion] El espacio «**cita defendida + re-agendado sin culpa, a precio de app, dentro de tu gym**» está vacío en Chile y en el mundo hispano. El riesgo competitivo real no es una startup: es que un gym grande copie el flujo (Smart Fit ya tiene app + app-rutina). La defensa del Stage A es la profundidad de tono y la velocidad: ese copy conductual (cero culpa) no es trivial de imitar — pero la ventana es de años, no de décadas. Declarado sin suavizar en D5.

---

## Flags

- **Yellow — Verificación primaria pendiente de pricing:** Peloton/Aaptiv/ClassPass citados vía comparadores de mercado (sensai.fit, chatbot.gallery) y no desde la propia app/stripe page; Freeletics/Fitbod/Jefit verificados en 2 fuentes de mercado independientes (sensai.fit + ionikhealth.com, ambas 2026) pero no en la propia página de checkout de cada app. Tratar los precios como [Data de mercado secundario] ante el jurado y decir «≈» en voz alta.
- **Yellow — Competidor exacto no encontrado, con búsqueda agotada:** no existe hoy (oct-2026) una solución publicitada que agende la visita al gym en el calendario laboral por WhatsApp con re-agendado sin culpa. Esto es el gap — y también el riesgo de «nadie lo ha hecho porque no funciona» que red-team debe atacar, no una garantía.
- **Yellow — Datos >18 meses:** quiebra de Pact (2017, con settlement FTC sept-2017), benchmarks de retención de apps (direccional 2026), adherencia 50% a 6 meses (IHRSA, >18 meses).
- **Red — ninguna.**
