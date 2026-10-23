# Contrato de cumplimiento — Hackatón Señales

*Derivado de las bases oficiales v1.2 (8-oct-2026) y de las 5 fichas de caso · 2026-10-12*

Este documento es el pass/fail de toda propuesta del torneo interno. Una violación elimina la propuesta sin importar su puntaje. Fuente: bases §8, §9, §16 + fichas de casos + riesgo legal Chile.

## R1 — Todo el trabajo se hace EN el evento

"Presentar código escrito antes del inicio del evento como propio del evento" = **DESCALIFICACIÓN** (bases §16). "Todo el trabajo debe hacerse durante el evento" (§9). El historial de git debe reflejar quién hizo qué (§9).

- Esta fase (pre-evento) produce SOLO documentos de investigación en el repo privado.
- El repo del evento se crea el 23-oct desde cero: cero código reutilizado de este repo.
- Permitido y declarado (§9): bibliotecas open source, plantillas públicas, servicios de terceros, asistentes de IA.
- Spikes pre-evento (ej. probar setup de WhatsApp Cloud API): SOLO con luz verde explícita del owner; su código vive fuera de este repo y jamás se presenta como trabajo del evento; solo se documenta el aprendizaje (tiempo, pitfalls) en el build-plan.

## R2 — Cero datos personales

Prohibido cargar o utilizar datos personales propios o de terceros, en especial de salud (bases §8, §16). Las 5 personas son perfiles ficticios de Makana. Todo el demo usa **datos sintéticos inventados** (nombrados en el demo-script). El caso 6 (problema propio del equipo) puede CONTARSE pero no cargar registros reales.

## R3 — Restricciones de alimentación (Caso 5 y cualquier caso de comida)

No compiten soluciones que propongan (bases §8):
- bajar de peso,
- contar calorías como castigo,
- compensar con ejercicio.

El mecanismo para Antonia debe INTEGRAR el fin de semana ("no quiero ser la fome que no sale"), no negarlo ni castigarlo.

## R4 — Derivación a profesional

Toda solución debe considerar derivar a un profesional cuando corresponda (bases §8):
- Caso 1 (Camila): evaluación médica/kinésica si hay dolor; derivar a kinesiólogo o médico deportólogo según síntomas.
- Caso 2 (Rodrigo): posible apnea del sueño (ronca fuerte, cansancio crónico) → derivación a médico del sueño es OBLIGATORIA en el flujo; la solución no diagnostica.
- Caso 3 (Patricia): la solución no da asesoría financiera regulada; deriva a consejería/reprogramación (DITEC, SERNAC, la propia banca) cuando la deuda es grave.
- Caso 4 (Marco): dolor lumbar crónico → kinesiólogo/médico ocupacional; la solución no reemplaza examen de aptitud.
- Caso 5 (Antonia): nutricionista ya existe en el caso (la pauta viene de ella); la solución acompaña el plan del profesional, no lo sustituye.

## R5 — Sin asesoría financiera regulada (Caso 3)

En Chile, la recomendación personalizada de inversiones/productos financieros está regulada (Ley 21.521 Fintech, normativa CMF; Ley 18.045). La solución para Patricia debe ser **financial wellness**: información, visualización, acompañamiento emocional, nudges de acción — NO recomendación de comprar/vender productos financieros específicos. Educar y mostrar datos = OK; recomendar productos = NO.

## R6 — La solución debe funcionar EN VIVO

Entrega: solución funcionando (app, chat, agente, prototipo navegable) que se muestra en vivo (bases §9), pitch 5 min + 5 min preguntas, sábado 16:00. La organización no impone plataforma (§8). El demo debe correr sin depender de la red del venue para lo crítico (plan B local simulado).

## Restricciones de diseño por caso (extraídas verbatim de las fichas)

| Caso | Frase de éxito (verbatim) | Lo que MATA una solución | Palancas que SÍ existen |
|---|---|---|---|
| **C1 Camila, 34, Ñuñoa** — jefa de proyectos, paga gym sin ir (fue 6 veces desde enero) | "Que vuelva a entrenar y lo sostenga" | Precio (la plata NO es su problema: vio promo "no pagas si entrenas" y no se cambió); más contenido/rutinas (ya probó 3 apps); guilt-tripping (la culpa ya le quita las ganas) | Celular en la mano todo el día (WhatsApp, calendario); ventana 19:00-21:00 dispersa; el miedo a darse de baja ("si me salgo no vuelvo nunca") |
| **C2 Rodrigo, 41, Concepción** — soporte TI, turnos rotativos semanales, 5-6h de sueño hace 14 meses | "Que duerma una hora más" | Horarios fijos (turnos rotan cada semana); wearables (reloj botado en un cajón); "deja el celu fuera" (el celu ES despertador+guardia+trabajo); café como muleta | Se maneja bien con tecnología; guardia por WhatsApp (canal existente); la pareja como testigo/aliada; el miedo real: "si me desconecto algo se va a caer" |
| **C3 Patricia, 58, Talca** — cuidadora de su mamá, vende por catálogo, 7 meses sin abrir el estado de cuenta | "Que vuelva a mirar sus cuentas y deje de pagar solo el mínimo" | La app del banco (la evita = ansiedad); planillas (la de la hija murió a las 2 semanas); juicios ("gastas de más"); horarios diurnos (su único rato libre es de noche) | WhatsApp para TODO (pedidos, familia, audios con su hija); ingresos variables pero existentes; miedo DICOM como palanca; la hija como aliada |
| **C4 Marco, 52, faena minera** — operador 7×7, 12h de camión, dolor lumbar 4/5 tres veces por semana | "Que haga la pausa activa y le duela menos" | Cualquier cosa real-time con celular (prohibido en el camión, mala señal en el rajo); depender del supervisor (no protege la pausa); apps que exigen login diario con wifi "a ratos" | Wifi nocturno del campamento; semana de bajada completa en Antofagasta; miedo al examen de aptitud/bono; los compañeros ("a todos les duele") = norma social a voltear |
| **C5 Antonia, 23, Valparaíso** — estudiante, pauta perfecta lun-jue, se cae el fin de semana, 9 ciclos | "Que deje de partir de cero cada lunes" | Contar calorías/bajar de peso (R3, prohibido); "no salgas" ("no quiero ser la fome que no sale"); apps de recetas (dejó una a la semana); culparla el domingo | La pauta ya existe (PDF de la nutricionista); grupo de WhatsApp de amigas; plata justa (el delivery le pesa); "cuando me va bien, me va perfecto" = el patrón todo-o-nada es la palanca |

## Criterios del jurado (bases §10.1 — puntúa 1-7, mismo peso)

1. **El problema** — qué tan bien entendieron a la persona: qué le pasa de verdad, por qué no le han resultado los intentos anteriores, qué decidieron atacar.
2. **La solución** — qué tan bien pensada está, qué construyeron, hasta dónde llegaron en el evento, qué dejaron fuera **a propósito**.
3. **La convicción** — qué tan creíble es que esa persona cambie con lo que le están proponiendo, y cómo responden a las preguntas.

Pregunta de cierre de cada jurado: **"¿Con cuál de estas soluciones sí cambiaría esta persona?"**

## Protocolo de honestidad (aplicable a TODOS los archivos de investigación)

- Etiquetar todo claim: **[Data]** (con URL), **[Estimate]** (con supuestos), **[Assumption]**, **[Opinion]**.
- Nunca presentar un estimado como dato. "No encontré" > número inventado.
- Fechar todo; datos >18 meses se marcan.
- Cross-reference: claims clave con 2-3 fuentes independientes; si discrepan, mostrar ambas.
- Todo archivo termina con sección de flags (Red/Yellow) o "Sin flags".
- Mínimo 5 búsquedas por agente de investigación; una búsqueda fallida se reintenta una vez (backend intermitente conocido) antes de declarar gap.

## Fechas duras

- **jue 15-oct 23:59 (Chile):** cierra la postulación. El formulario (por qué ese caso, ≤800 chars) es lo que MÁS pesa en la selección.
- 16-oct: se publican los 15 seleccionados.
- 20-oct: confirmación.
- **23-24 oct:** evento. Vie 09:00→21:00 (2 checkpoints), sáb 09:00→15:00 cierre entrega, 16:00 pitches (5+5 min), 19:00 deliberación, 20:00 premiación.
