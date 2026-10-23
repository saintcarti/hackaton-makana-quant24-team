# Rúbrica del torneo interno — D1 a D7

*Derivada de los criterios del jurado (bases §10.1) + requisitos del owner + reglas de juego del evento · 2026-10-12*

Cada dimensión se puntúa **0-10**. Total ponderado = Σ(score × peso)/100 → escala 0-10.

Compliance R1-R6 (`scoring-contract.md`) es **pass/fail aparte**: una violación elimina la propuesta sin importar su puntaje.

| # | Dimensión | Peso | Mide | Origen del criterio |
|---|---|---|---|---|
| D1 | Problema-raíz | 20 | ¿La solución ataca la causa estructural (no el síntoma) que el reverse-engineering identificó? ¿Explica por qué fallaron los intentos previos de la persona? | Jurado 1 "El problema" |
| D2 | Credibilidad de cambio | 20 | ¿Evidencia (literatura conductual + análogos con tracción real) de que ESTA persona cambiaría con ESTE mecanismo? | Jurado 3 + pregunta de cierre "¿sí cambiaría?" |
| D3 | Constrible en 2 días | 15 | ¿Alcance ejecutable solo+agentes vie 09:00→sáb 15:00 con ≥25% de buffer, en free tiers? | Jurado 2 "La solución" |
| D4 | Demo/pitch en vivo | 10 | ¿Qué tan teatral y creíble es mostrar el éxito del caso moviéndose en 5 min con datos sintéticos? | Formato 5+5 min |
| D5 | Espacio competitivo | 10 | ¿Hoy NO existe o existe mal servido? Gap nombrado contra competidores reales | Pedido del owner: competencia actual |
| D6 | Capital ≈0 + unit economics | 15 | Costo demo ≤US$5; y SI fuera startup: modelo con CAC/LTV/break-even defendible | Pedido del owner: capital mínimo |
| D7 | Escala de impacto | 10 | Segmento real chileno medible (TAM/SAM/SOM) con fuentes | Pedido del owner: métricas de impacto |

## Pesos (suman 100)

D1=20, D2=20, D3=15, D4=10, D5=10, D6=15, D7=10.

## GATE de validación (definición de /goal — se cumple todo o se sigue iterando)

1. Total ponderado del ganador **≥ 7.0** Y ninguna dimensión **< 6**.
2. Compliance R1-R6: **pass** en todas.
3. ≥3 claims de mercado con etiqueta `[Data]` + URL verificable.
4. ≥5 competidores nombrados con gap explícito.
5. Unit economics con break-even + supuestos etiquetados + nota de sensibilidad (±30%).
6. Plan de build ≤ 30 h de trabajo con buffer ≥25% (el evento da ~20 h de reloj útil; debe decir qué se corta si va tarde).
7. Red-team: veredicto **SOBREVIVE** con solo ataques parcheables aplicados.
8. `postulacion-800.md` ≤ 800 caracteres.

Si tras 2 rondas completas nadie cumple el gate: entregar la mejor disponible con riesgos explícitos. **Nunca fabricar validación.**

## Anti-criterios (lo que NO puntúa, aunque tentaciones del concurso)

- Sofisticación técnica per se (el jurado es de producto, no de código).
- Feature-itis: más pantallas no mueven al jurado; "qué dejaron fuera a propósito" sí se evalúa (jurado 2).
- Cifras top-down infladas ("mercado wellness global US$X B") — solo bottom-up con aritmética mostrada.
