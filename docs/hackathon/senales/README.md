# Señales — Expediente de investigación (pre-evento)

*Hackatón Señales · Makana SpA · Santiago, 23-24 oct 2026 · Investigación cerrada: 2026-10-12*

## Resumen ejecutivo

**Caso elegido: Caso 1 (Camila — jefa de proyectos, 34, Ñuñoa, paga gym sin ir).**
**MVP: «La Cita»** — la mensualidad ya pagada se convierte en una cita defendida en el calendario de su trabajo, con re-agendado sin culpa («MUEVE») y captura del fresh start dominical. Score del torneo: **8,10/10** (1º de 10 candidatas). Red team: **SOBREVIVE** (8 parches aplicados). Gate del plan: **8/8 cumplido**.

Por qué este caso y no otro, con la tabla completa del torneo y los números exactos: ver **`DECISION.md`**.

**Fecha dura:** postulación cierra **jue 15-oct 23:59** — texto listo en `05-pitch/postulacion-800.md` (796 chars). El formulario pesa más que cualquier otra cosa en la selección.

## Cómo leer este expediente

| Si quieres… | Lee |
|---|---|
| La decisión y su argumentación | `DECISION.md` |
| Las reglas del evento (compliance R1-R6) y del torneo (rúbrica D1-D7) | `00-bases/` |
| El análisis conductual de cada caso (por qué falla cada persona) | `01-cases/caso-{1..5}-analisis.md` |
| El torneo: las 10 propuestas puntuadas y el ranking | `01-cases/torneo-round1.md` |
| Las 10 propuestas de MVP (2 por caso) | `02-proposals/` |
| Mercado, competencia, ICP, unit economics, teoría, capital | `03-validation/` (solo caso ganador) |
| Qué construir, cuándo (hora por hora) y cómo demostrarlo | `04-mvp/` |
| Posicionamiento, preguntas del jurado, postulación | `05-pitch/` |
| Los ataques que sobrevivió la propuesta y sus parches | `06-red-team/` |
| La auditoría final de honestidad | `verification-report.md` |

## Dashboard de confianza

Todo el expediente sigue el protocolo de honestidad: cada claim está etiquetado **[Data]** (con URL), **[Estimate]** (con supuestos), **[Assumption]** o **[Opinion]**.

- **Qué es [Data] sólidamente respaldado:** los mecanismos conductuales (implementation intentions d≈0,65; Milne 2002 91% vs 35% en iniciación; fresh start; Lally 66 días), el mercado (1,05M socios gym Chile), los límites técnicos verificados (Vercel Hobby cron, Twilio sandbox, WhatsApp pricing US$0,02 vigente 01-oct-2026).
- **Qué es [Estimate] con aritmética mostrada:** TAM 2029 1,37M/US$277M, SAM ≈92k, SOM 4.500 activos, LTV/CAC 2,5× año-1 → 8,6× año-2, build 23,75h.
- **Qué es [Assumption] que el MVP debe testear:** la sostenibilidad a 90 días (H4/V/U90 — la hipótesis central, sin precedente publicado del paquete II+default+re-agendado), el pricing $7.990, la transferencia UK/Chile y oficina/faena donde aplica.
- **Qué NO decir nunca** (reglas del red team): «4,3×», «67% nunca va», cualquier cifra sin etiqueta. Qué decir siempre: la coletilla del 91% (estudiantes UK, 1 semana, auto-reporte), las cifras 2,5×/8,6× proactivas, V/U90 como métrica norte.

## Estado

F0-F5 completas y commiteadas en este repo (privado de investigación). El código NO existe aún — por regla R1 del evento, se construye íntegramente el 23-24 oct en un repo nuevo. Este expediente es el mapa del territorio: problema, mecanismo, mercado, plan de build y pitch están listos; la ejecución es del evento.

Verificación independiente del padre: aritmética del torneo recalculada por código (0 discrepancias), postulación 796 ≤ 800 chars verificada 2×, parches del red team confirmados en disco, conteos de secciones/archivos contra specs.
