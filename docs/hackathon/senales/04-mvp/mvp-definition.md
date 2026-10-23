# MVP «La Cita» — Definición de features (BORRADOR v1)

*Hackatón Señales · Makana SpA · evento 23–24 oct 2026 · basado en la propuesta 1.a «La Cita» (02-proposals/propuestas-caso-1.md) tal como fue escrita por el analista. BORRADOR: se congela el viernes 12:00 (checkpoint 1).*

**Norte del producto:** el indicador de éxito VERBATIM del caso — **«que vuelva a entrenar y lo sostenga»**. Métrica norte del MVP: **V/U90** (visitas sostenidas por usuario a 90 días; ver unit-economics.md §5 — el modelo muere si no sostiene).

**Regla de lectura:** cada MUST (a) mapea a una causa-raíz del análisis (01-cases/caso-1-analisis.md §2) y (b) mueve el indicador. Cada OUT tiene razón explícita: el jurado evalúa qué se deja fuera a propósito (rúbrica D3, anti-criterio feature-itis).

---

## MUST (el loop mínimo: sin esto no hay producto)

| # | Feature | Causa-raíz que ataca | Cómo mueve «vuelva a entrenar y lo sostenga» |
|---|---|---|---|
| M1 | **Captura dominical 20:00**: un mensaje de WhatsApp con 2 opciones de cita acotadas a su ventana real (19:00–21:00) + «otra hora» + «esta semana no» — 2 taps | Eslabón 1: plan de meta sin anclaje («mañana parto» 23:55 es una intención pura) + fresh start que muere a las 07:45 (Dai et al. 2014: el landmark es de inicio — capturarlo como INPUT) | Convierte el impulso del domingo en implementation intention antes de que se duerma: inicia la visita del lunes. **Default de silencio (parche red team 12-oct):** si Camila no responde al domingo 20:00, el sistema agenda por defecto su slot favorito (el más cumplido de las últimas 4 semanas) y envía el .ics igual; para quitarla hay que responder (opt-out), no para mantenerla (opt-in) — el silencio también agenda; el default del sistema deja de ser el default del problema |
| M2 | **Cita instalada en el calendario**: invite/adjunto .ics con hora, sede y contenido acotado («40', 3 máquinas») — el .ics viaja por WhatsApp; OAuth Google Calendar es plan de lujo, no MUST | Eslabón 2: la decisión se paga en caliente a las 19:XX cada día | IR se vuelve el default (la cita ya existe junto a sus reuniones); no-ir exige acción (M4). El calendario es el único sistema que ella ya obedece |
| M3 | **Recordatorio único 18:30** del día de la cita («a las 19:15 tienes la cita contigo») por WhatsApp | Eslabón 2: prompt débil sin consecuencia (B=MAP: P en el momento exacto, un solo mensaje, no spam) | Dispara la conducta en el momento M×A×P convergen; cero decisiones pendientes a esa hora |
| M4 | **MUEVE — re-agendado sin culpa**: responder MUEVE (o «hoy no puedo» en lenguaje natural, GLM-5.3 parsea) mueve la cita al siguiente slot compatible y confirma; la cita se mueve, jamás se borra | Eslabón 3: el loop de culpa («la culpa de no haber ido le quita las ganas de ir») + reuniones que se alargan | Mover ≠ fallar: elimina el castigo del día malo que hoy reinicia todo a cero; sostiene el hábito a través de semanas imperfectas (ventana 66 días, Lally 2009). **Regla anti-snooze (parche red team 12-oct):** tras 2 MUEVEs consecutivos sin visita, el sistema NO propone el mismo slot de nuevo: abre re-negociación de ventana con GLM (lenguaje natural: «el lunes no te está resultando — ¿martes 20:30 o sábado 11:00?»). Mover sigue sin ser fallar; desfilar no es mover |
| M5 | **Tono cero-culpa de serie** (GLM-5.3 con guardrails): sin rachas, sin «te quedaste atrás», sin deberías; test adverso de 20 respuestas («hoy no pude», «me da vergüenza el gym», «me duele la espalda») antes del demo | Eslabón 3: la culpa es la emoción contraindicada (restricción dura 3 del caso) | El tono ES parte del mecanismo: la culpa documentada en el caso desarma la próxima decisión; sin tono, M1–M4 se vuelven otro notificador |
| M6 | **Reencuadre del sunk cost post-visita**: tras el «listo» (1 tap), respuesta que recupera la mensualidad — tal como la propuesta lo escribió: «Tu mensualidad ya estaba pagada: hoy recuperaste $11.660 de los $34.990» con la cifra rotulada [Estimate: mensualidad Smart Fit Chile CLP 25.000–40.000, cifra exacta no publicada en smartfit.cl/planes; usar $34.990 como ejemplo rotulado] | Eslabón 3 + palanca sunk cost (análisis §4): «sigue pagando porque darse de baja se siente como rendirse» | Cambia el pago de fuente de culpa a activo en uso — sostiene la identidad «soy alguien que va al gym» sin tocar el precio (vetado) |
| M7 | **Guardrail R4 — derivación**: si el mensaje menciona dolor (espalalda, rodilla), el flujo NO prescribe ejercicio y deriva a kinesiólogo/médico deportólogo | Compliance R4 del scoring-contract (ficha: «le duele la espalda») | No mueve el indicador; hace el producto presentable (pass/fail del torneo) |
| M8 | **Modo demo con Camila sintética + admin**: 6 semanas sintéticas (11 visitas, 4 citas movidas, 0 cadenas rotas), vista del historial, reloj simulable (domingo 20:00 → lunes 18:30) y mensaje real a teléfono allowlisted del jurado | — (no ataca causa-raíz: habilita el pitch) | Es D4: mostrar el éxito del caso moviéndose en 5 min con datos sintéticos (R2: cero datos personales reales) |

## NICE (si el reloj sobra; ninguna es requisito del demo)

| # | Feature | Por qué es NICE y no MUST |
|---|---|---|
| N1 | Google Calendar API OAuth (invite directo en vez de .ics) | El .ics adjunto ya cumple M2 sin OAuth; OAuth es el riesgo técnico #2 — solo si M1–M8 están verificados |
| N2 | Capa temptation bundling en el copy («tu serie solo avanza en la bici») | Milkman 2014: +51% inicial PERO decae → no puede ser MUST; es experimento de copy post-MVP |
| N3 | TTS: recordatorio en audio (voz) | El texto ya dispara; el audio es teatro de demo, no mecanismo |
| N4 | Re-agendado proactivo por detección de «reunión que se alargó» (si someday hay integración calendario→whatsapp) | Requiere OAuth + parsing de eventos: riesgo alto, valor marginal sobre M4 bajo |
| N5 | Resumen semanal con «plata recuperada acumulada» | Refuerzo de M6; no altera el loop si falta |
| N6 | Esbozo en vivo de «Quedamos» (1.b) con Josefa sintética | Roadmap visible en el pitch; NO se construye: solo se menciona |

## OUT (fuera a propósito — con razón)

| # | Fuera | Razón de exclusión (el jurado evalúa esta columna) |
|---|---|---|
| O1 | Rutinas, planes de entrenamiento, videos, biblioteca de ejercicios | El caso lo declara intento fallido («tres apps de rutinas»); restricción dura 1: más contenido = mata la solución. El QUÉ lo trae resuelto |
| O2 | Rachas, puntos, badges, niveles, comparación social | Una racha rota es culpa institucionalizada; el caso: «la culpa le quita las ganas de ir». Antitético al mecanismo |
| O3 | App nativa / login diario / feed / dashboard | El caso muestra «la app del gym, que abre y cierra sin ir»: no construimos otra app que abrir. El canal es WhatsApp (recibe) + calendario (ya existe) |
| O4 | Dinero, descuentos, cashback, «paga menos si vas», loterías | «La plata no es el problema» + la promo «no pagas si entrenas» ya fue probada en Camila y falló + jugar con precio está vetado por el caso |
| O5 | Match social / buddies / quedadas | Es el mecanismo de la propuesta hermana 1.b; La Cita es deliberadamente individual: la coordinación social añade fragilidad a una ventana dispersa. Se deja como roadmap |
| O6 | Trackers corporales: peso, fotos de progreso, % grasa | Métrica de cuerpo = material de culpa; el caso pide «sentirse bien en su cuerpo, sin volverse fanática» |
| O7 | Sugerir cambiar de gym, comparar gyms, darse de baja | «Si me salgo del gym, ahí sí que no vuelvo nunca»: la membresía es el ancla, no el problema. Trabajar DENTRO de la membresía es restricción dura 5 |
| O8 | Notificaciones push de una app propia / email | Canal que ella no habita = prompt sin consecuencia. WhatsApp es el único canal con el celular «en la mano» (89,7% de usuarios de internet en Chile) |
| O9 | Chat libre / asistente conversacional abierto | Cada mensaje extra es fricción y riesgo de tono; el sistema habla con propósito (captura, recordatorio, confirmación, MUEVE), no conversa |
| O10 | Integración con torniquetes/trackeo de asistencia del gym en el MVP | Requiere alianza con el gym: fuera del alcance de 2 días; el MVP usa auto-reporte de 1 tap (mismo estándar que la literatura, ver teoria-conductual.md §9.5) |
| O11 | Onboarding con formulario largo / cuestionario de motivaciones | Cada pregunta es fricción antes del valor; el sistema necesita: nombre, gym, ventana. Nada más |
| O12 | Modo madrugada / slot 06:30 | «Alarma 06:30. La apagó cuatro veces» es el experimento de campo ya corrido y fallado del caso; el slot es su ventana real vespertina |

## Reglas de producto (constitución del MVP)

1. **Un mensaje = un propósito.** Cero spam: domingo captura, día-C 18:30 recordatorio, post-visita confirmación. Máximo 3–4 toques por semana.
2. **Mover ≠ fallar.** Ningún estado del sistema exhibe «falta» ni reinicia progreso.
3. **El calendario es el producto; WhatsApp es el mensajero.** Si mañana existe otro canal, el mecanismo sobrevive.
4. **Nada de precio, nada de contenido, nada de culpa** (las tres prohibiciones del caso como constitución).
5. **Toda cifra de usuario es suya, no nuestra:** no benchmarks, no promedios, no «la gente entrena X veces».

## Qué mide el MVP (plan de validación Stage A)

| Hipótesis | Métrica | Umbral de éxito [Assumption] |
|---|---|---|
| H1: la captura dominical convierte intención en cita | % de mensajes dom 20:00 respondidos con slot elegido | ≥50% |
| H2: la cita agendada se cumple | % de citas confirmadas con «listo» | ≥30% semana 1 (vs 3% día-30 de apps como piso) |
| H3: MUEVE previene el abandono tras día caído | % de usuarios con ≥1 MUEVE que tienen visita la semana siguiente **+ % de citas que terminan en visita tras 2+ MUEVEs consecutivos (nuevo, parche red team 12-oct: mide la cadena, no el caso aislado)** | ≥60% / el del segundo componente: TBD con el piloto |
| H4: el loop sostiene (LA hipótesis de la startup) | V/U90: visitas/semana sostenidas a 90 días | ≥0,8/semana en ≥40% de activos — si falla, el modelo unit-economics muere (churn ≥15%) |
| H5: el tono cero-culpa no es placebo | churn premium <10%/mes en cohorte piloto | <10% |

---

## Reglas de honestidad del pitch (fijadas por el red team)

Fijadas el 12-oct-2026 por la fiscalía adversarial (06-red-team/ataques-y-veredicto.md §6, parche 7). El guion se redacta en el evento; ESTAS reglas no se negocian:

1. **Coletilla obligatoria al 91%:** si se dice el 91% vs 35%, se dice en la misma frase: «estudiantes británicos, una semana, auto-reporte — mide que el plan vence a la motivación en la iniciación, no que el 91% se sostenga» (Milne et al. 2002: Reino Unido, n=248, 1 semana).
2. **Cifras de negocio PROACTIVAS, antes de que pregunten:** 2,5× LTV/CAC contable año 1 (bajo 3×, declarado), cash payback <1 mes, 8,6× año 2, cruce de 3× desde ~376 activos. Si el jurado las saca primero, la defensa suena a excusa.
3. **PROHIBIDO decir:** «4,3×» (el cálculo corregido lo veta) y «67% nunca va» (dato antiguo, reemplazado por el 50% abandona a 6 meses; ver mercado-chile.md §2).
4. **Si preguntan por el mercado:** vender el KPI (V/U90) y la tesis B2B2C, no el SOM B2C (US$36k/año año 3 es línea de base a propósito).
5. **Tener a mano:** la respuesta al 4,6% HFA ya está escrita en mercado-chile.md §2 Flags; y la regla de comparación del steelman: ganar en D1 (cadena causal cerrada) y demo, no aceptar el framing «estructura vs voluntad».

---

## Flags

- **Yellow — Este archivo es BORRADOR:** se congela en el checkpoint del viernes 12:00; cualquier MUST que no tenga dueño+horario en build-plan-2dias.md al momento del freeze se degrada a NICE o se corta.
- **Yellow — H4 no tiene precedente publicado** (teoria-conductual.md §9.2): el MVP es el estudio; presentar H4 siempre como experimento ante el jurado.
- **Yellow — M8 depende del allowlist de 5 números de WhatsApp:** con >4 jurados, rotar o proyectar desde el teléfono del fundador (capital-y-stack.md Flags).
- **Red — ninguna.**
