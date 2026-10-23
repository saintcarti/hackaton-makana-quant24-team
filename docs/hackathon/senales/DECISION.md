# DECISION.md — Decisión final de la investigación

*Hackatón Señales (Makana SpA) · evento 23-24 oct 2026 · investigación cerrada el 2026-10-12 · es-CL*

## 1. Decisión (una línea)

**Construimos «La Cita» para el Caso 1 (Camila): la mensualidad ya pagada se convierte en una cita defendida en el calendario de su trabajo, con re-agendado sin culpa («MUEVE») y captura del fresh start dominical.**

Score del torneo: **8,10/10 ponderado** (rúbrica D1-D7, pesos 20/20/15/10/10/15/10) — 1º de 10 candidatas; veredicto del red team: **SOBREVIVE** (8 parches aplicados, ninguno inparcheable). Indicador de éxito del caso (verbatim): *«que vuelva a entrenar y lo sostenga»* — métrica norte del MVP: **V/U90** (visitas sostenidas por usuario activo a 90 días).

## 2. La argumentación objetiva (por qué esta propuesta y no otra)

El torneo interno puntuó 10 propuestas (2 por caso) contra una rúbrica derivada de los criterios REALES del jurado (bases §10.1: problema / solución / convicción) más los requisitos del owner (capital ≈0, competencia, escala). Tabla completa en `01-cases/torneo-round1.md`.

| # | Propuesta | Total | Por qué queda fuera (una línea) |
|---|---|---|---|
| **1** | **C1.a La Cita (Camila)** | **8,10** | **GANADORA** — única que cierra los 3 eslabones causales del caso con un solo artefacto, con el respaldo conductual más fuerte del expediente (implementation intentions, d≈0,65) |
| 2 | C4.b Entre Vueltas (Marco) | 8,03 | Excelente mecanismo estructural, pero deja intacta la norma social «a todos les duele» (la palanca clave del caso) y su demo sufre muerte por silencio nocturno |
| 3 | C4.a Pacto del Piquete (Marco) | 8,00 | Depende de coordinación del piquete completo — fragilidad social que el caso mismo exhibe como fallida (la amiga de Camila ya falló por logística) |
| 4 | C3.a Cuenta Conmigo (Patricia) | 7,95 | La más «entretenida» según el propio juez, pero D2 débil: la evidencia de exposición gradual que mueva «mirar las cuentas» es solo parcial (gap RCT declarado) |
| 5 | C2.a Cierre de Guardia (Rodrigo) | 7,75 | Buen mecanismo de cierre de guardia, pero sin respuesta al hipercumplimiento («si no reviso los tickets igual no me duermo») — la guardia sigue sonando igual |
| 6 | C3.b La Vuelta del Sábado | 7,73 | Picos de ventas como palanca es ingenioso pero exige más input de una mujer que ya no abre ni el correo del banco |
| 7 | C5.b Domingo Bueno | 7,65 | Autocompasión dominical sólida, pero interviene a solas (el caso vive en el grupo de amigas) y su mercado (estudiantes) es el más chico |
| 8 | C5.a Cañeras | 7,60 | Vive dentro del grupo correcto, pero WhatsApp Cloud API test number no soporta grupos → el core del mecanismo no es demostrable en el evento sin simulador |
| 9 | C2.b Aterrizaje | 7,50 | Cronofarmacología de cafeína + contramedidas por turno: correcto pero genérico frente a los competidores de sueño (Calm/Rise) que ya hacen schedule-adaptation |
| 10 | C1.b Quedamos | 7,15 | La amiga es palanca real, pero el torneo la vio como la versión social de La Cita con más fragilidad (coordinación de dos agendas adultas dispersas) |

**Por qué el margen es honesto:** la diferencia entre la Nº1 y la Nº2 es de 0,07 puntos — no es un veredicto aplastante y no lo vendemos como tal. Lo que inclina la balanza:
- **D1 problema-raíz:** «La Cita» es la única que ataca los TRES eslabones de la cadena causal de Camila (intención sin anclaje → decisión en caliente a las 19:XX → culpa-reinicio) con UN solo artefacto. «Entre Vueltas» disuelve el eslabón de producción («si paro, el turno queda atrasado») pero deja intacta la norma social del dolor, que el caso declara textualmente («a todos en la faena les duele la espalda, es parte de la pega»).
- **D4 demo:** la cita apareciendo en el calendario laboral es un insight visual de 5 segundos; el flujo completo (captura → cita → MUEVE → cadena sostenida) es demostrable EN VIVO con datos sintéticos en el evento. El caso 4 depende de wifi nocturno intermitente y contexto minero difícil de recrear en 5 min.
- **D5/D7:** 1,05M de socios de gym en Chile [Data], SAM ≈92k, y una tesis B2B2C (gimnasios/empleadores) con mercados más claros que el B2B minero del caso 4 (contratistas con 257k trabajadores, pero ciclos de venta largos).

## 3. Compliance y honestidad

**Pass/fail del contrato (R1-R6): PASS en todos**, verificado línea por línea por el fiscal (ver `06-red-team/ataques-y-veredicto.md` §2), con advertencias manejadas:
- **R1 (código solo en el evento):** este repo es investigación; el repo del evento nace desde cero el 23-oct. Higiene de git declarada como advertencia (commits limpios, cero copy-paste de este expediente al repo del evento).
- **R2 (datos sintéticos):** demo con «Camila sintética» nombrada; advertencia: el allowlist de WhatsApp usa números reales del equipo/jurado — se explica en 1 frase en el demo («sandbox de Twilio, números de prueba»).
- **R3 (alimentación):** aplica al Caso 5, no elegido; nuestras propias prohibiciones de producto (nada de precio/contenido/culpa) son análogas.
- **R4 (derivación):** M7 en el MVP — si menciona dolor, deriva a kinesiólogo/médico deportólogo, no prescribe.
- **R5 (finanzas):** no aplica (Caso 3 no elegido).
- **R6 (funciona en vivo):** demo-script con plan B de dos niveles (modo sin conexión de la misma app + grabación 60s).

**Límites declarados (sin anestesia):**
- El 91% de Milne/Orbell/Sheeran 2002 es una RCT en 248 estudiantes del Reino Unido, 1 semana, auto-reporte. Mide que el plan vence a la motivación en la iniciación. NO es evidencia de sostenimiento a 90 días — el «y lo sustenga» es la hipótesis H4 del MVP, y así se presenta (V/U90 como métrica norte, el MVP como estudio).
- LTV/CAC contable año-1 = **2,5×** (bajo el umbral 3×), cruza 3× desde ~376 activos, 8,6× en año 2. El pitch lo dice proactivamente (regla de honestidad #2 del red team).
- El «67% nunca va» está desactualizado (HFA 2025: 4,6% nunca-va); el segmento correcto es «paga-sin-sostener» (50% abandona a 6m) — cifra corregida en todo el expediente.
- Transferencia de la evidencia de oficina (RCTs de pausas activas) a faena minera / de UK a Chile: [Assumption] etiquetada en los archivos correspondientes.

## 4. Gate del plan (§5 del plan) — estado final

| # | Criterio | Estado |
|---|---|---|
| 1 | Total ponderado ≥ 7,0 y sin dims < 6 | ✅ 8,10; dims mínimas: D5/D6/D7 = 7 |
| 2 | Compliance R1-R6 pass | ✅ PASS en todas (fiscal, §2) |
| 3 | ≥3 claims [Data] con URL en mercado | ✅ 7 claims [Data] (mercado-chile.md) |
| 4 | ≥5 competidores con gap explícito | ✅ 11 competidores mapeados (competencia.md) |
| 5 | Unit economics con break-even + sensibilidad ±30% | ✅ 2,5×/8,6×, cruce ~376 activos, sensibilidad en unit-economics.md §5 |
| 6 | Build ≤30h con buffer ≥25% | ✅ 19h netas +25% = 23,75h ≤ 30h (capital-y-stack.md) |
| 7 | Red-team SOBREVIVE | ✅ Veredicto §6 + 8 parches aplicados (commit efba5fd) |
| 8 | postulacion-800.md ≤ 800 chars | ✅ 796 chars (verificado 2× por código) |

**El gate se cumple completo. La propuesta está validada según el proceso definido.** La validación es objetiva en su PROCESO (criterios públicos derivados de las bases, evidencia citada, revisión adversarial, aritmética verificada por código) — el resultado sigue siendo un pronóstico Stage A: una hipótesis fuertemente armada, no un hecho probado. Los números duros que la sostienen y sus etiquetas viven en `03-validation/`; los supuestos frágiles están en las secciones Flags de cada archivo.

## 5. Métricas clave para el pitch (números exactos del expediente)

| Concepto | Valor | Etiqueta |
|---|---|---|
| Socios de gym en Chile | 1,05M (2024) | [Data: Radiografía 2024] |
| Abandono a 6 meses | 50% | [Data: IHRSA proxy global] |
| TAM 2029 | 1,37M socios / US$277M en riesgo | [Estimate: aritmética §3] |
| SAM 2029 | ≈92.000 personas (WhatsApp + calendario laboral) | [Estimate] |
| SOM año 3 | ≈4.500 activos (B2C base a propósito) | [Estimate] |
| Pricing B2C | CLP $7.990/mes (26% de su mensualidad; ancla real: PT $15.000+/sesión) | [Assumption] |
| LTV/CAC año 1 / año 2 | 2,5× / 8,6× (cruce 3× en ~376 activos; cash payback <1 mes) | [Estimate] |
| Costo del demo | ≤US$1 (presupuesto US$5; stack free-tier) | [Estimate] |
| Build | 19h netas + 25% buffer = 23,75h ≤ 30h del evento | [Estimate] |
| Evidencia clave | Implementation intentions d≈0,65 (Gollwitzer & Sheeran 2006); Milne 2002: 91% vs 35% iniciación | [Data: literature] |

## 6. Próximos pasos (fuera de esta investigación)

1. **Owner: enviar la postulación ANTES del jue 15-oct 23:59** — texto listo en `05-pitch/postulacion-800.md` (796 chars). El formulario es lo que MÁS pesa en la selección de los 15 equipos.
2. Owner: confirmar asistencia el 20-oct si quedan seleccionados.
3. 23-oct 09:00: crear repo desde cero (R1) y ejecutar `04-mvp/build-plan-2dias.md` hora por hora.
4. F6 (spikes pre-evento, opcional): solo con luz verde del owner — WhatsApp Cloud API test number y OAuth .ics, con la guardia R1 documentada (código del spike vive fuera del repo del evento, solo se documenta el aprendizaje).

## 7. Archivos del expediente

```
senales/
├── DECISION.md (este archivo)
├── README.md (índice + resumen ejecutivo)
├── PROGRESS.md (bitácora de sesión)
├── 00-bases/ (contrato R1-R6, rúbrica D1-D7)
│   ├── scoring-contract.md
│   └── torneo-rubrica.md
├── 01-cases/ (5 análisis + torneo)
│   ├── caso-{1..5}-analisis.md
│   └── torneo-round1.md
├── 02-proposals/ (10 propuestas: 2×5)
│   └── propuestas-caso-{1..5}.md
├── 03-validation/ (6 archivos, solo caso ganador)
│   ├── mercado-chile.md · competencia.md · icp.md
│   └── unit-economics.md · teoria-conductual.md · capital-y-stack.md
├── 04-mvp/ (mvp-definition, build-plan-2dias, demo-script)
├── 05-pitch/ (posicionamiento, preguntas-jurado, postulacion-800)
└── 06-red-team/ (ataques-y-veredicto)
```
