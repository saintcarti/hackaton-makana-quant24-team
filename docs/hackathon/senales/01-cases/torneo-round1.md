# Torneo interno Señales — Ronda 1 · Veredicto del jurado

*Hackatón Señales · Makana SpA · Santiago, 23–24 oct 2026 · Evaluado el 12-oct-2026 contra: `00-bases/torneo-rubrica.md` (D1–D7, pesos D1=20 D2=20 D3=15 D4=10 D5=10 D6=15 D7=10) y `00-bases/scoring-contract.md` (R1–R6 pass/fail).*

**Método:** leí completas las 10 propuestas, los 5 análisis y las 5 fichas originales. Re-puntué cada dimensión con criterio propio: los auto-scores de los analistas sirvieron solo de ancla y su inflación sistemática fue descontada (ver Flags). Total ponderado = Σ(score × peso)/100, escala 0–10. Los puntajes de 9 llevan cita textual del expediente en la sección de evidencia. Ningún score llega a 10 ni baja de 3: el campo es parejo y sin propuestas descartables de raíz.

---

## 1. Tabla completa — 10 propuestas × D1–D7

| # | Propuesta | D1 | D2 | D3 | D4 | D5 | D6 | D7 | **Total** | Compliance R1–R6 |
|---|---|---|---|---|---|---|---|---|---|---|
| C1.a | **La Cita** | 9 | 8 | 9 | 9 | 7 | 7 | 7 | **8,10** | **PASS** |
| C1.b | Quedamos | 8 | 7 | 7 | 8 | 7 | 6 | 7 | 7,15 | **PASS** |
| C2.a | Cierre de Guardia | 9 | 7,5 | 8 | 8 | 7 | 7 | 7 | 7,75 | **PASS** |
| C2.b | Aterrizaje | 8 | 7 | 8 | 8,5 | 7 | 7 | 7 | 7,50 | **PASS** |
| C3.a | Cuenta Conmigo | 9 | 7 | 8 | 9 | 8 | 7 | 8 | 7,95 | **PASS** |
| C3.b | La Vuelta del Sábado | 7,5 | 8 | 8,5 | 7,5 | 8 | 7 | 7,5 | 7,73 | **PASS** |
| C4.a | El Pacto del Piquete | 9 | 8 | 8 | 8 | 7,5 | 7 | 8 | 8,00 | **PASS** |
| C4.b | Entre Vueltas | 8,5 | 8 | 8,5 | 8,5 | 7,5 | 7 | 8 | **8,03** | **PASS** |
| C5.a | Cañeras | 9 | 8 | 7 | 7,5 | 8 | 6 | 7 | 7,60 | **PASS** |
| C5.b | Domingo Bueno | 8,5 | 7 | 9 | 9 | 7 | 6 | 7 | 7,65 | **PASS** |

**Verificación de compliance (pass/fail por caso):**
- **R1/R2/R6 (demo: código en el evento, datos sintéticos, funciona en vivo):** las 10 declaran persona sintética nombrada («Camila sintética», «Rodrigo sintético», «Patricia sintética», «Marco sintético», «Antonia sintética»), assets sintéticos en R2 y plan B sin red. PASS en las 10.
- **R3 (caso 5):** 5.a: «Las calorías no se mencionan jamás; el ejercicio no existe como moneda de cambio; el carrete se integra al plan»; 5.b: «Conteo de calorías, peso, ejercicio-compensación (R3, no negociable)» fuera a propósito, el bot solo habla de *semanas*. PASS ambas.
- **R4 (derivación):** flujo visible en las 10 (kinesiólogo/deportólogo en C1 y C4; médico del sueño + expediente PDF en C2; SERNAC/reprogramación con umbral CMF >50% o morosidad en C3; nutricionista dueña de la pauta + cuaderno exportable en C5). PASS en las 10.
- **R5 (caso 3, asesoría financiera regulada):** 3.a mantiene el nudge en «consecuencia del mínimo» avalada por el RCT chileno OECD-OPSI («jamás dice invierte/compra/cancela el producto X»); 3.b estructura un hábito de pago sobre SU propia tarjeta «jamás recomienda productos financieros». Información y visualización, no recomendación. PASS ambas.

**Ninguna propuesta queda eliminada por compliance.** El ranking se ordena íntegro por total ponderado. No hubo empates, por lo que el tiebreak D4 no se aplicó.

**Gate de la rúbrica:** el líder (C1.a, 8,10) cumple total ≥ 7,0 y ninguna dimensión < 6 (mínima del campeón: 7 en D5/D6/D7). Gate de puntaje: **cumplido**. (Los ítems 3–5 del gate —claims de mercado, break-even, red-team— son de la fase de build y ninguna propuesta los puede cumplir aún en papel; ver Flags.)

### Evidencia de los puntajes 9 (citas del expediente)

- **C1.a D1=9:** el análisis encadena «plan sin anclaje (1) → decisión diaria en caliente contra el trabajo y la fatiga (2) → culpa que desarma la próxima decisión (3)»; La Cita cierra los tres eslabones: cita agendada (si-entonces), default invertido («MUEVE»), y «la Cita se mueve, nunca se rompe». Sustenta el 9: en ejercicio, el cuándo-dónde-cómo llevó la participación «de 35% a 91%» (Milne, Orbell & Sheeran 2002, citado en la propuesta 1.a, Mecanismo).
- **C1.a D3=9:** «el invite de calendario via .ics funciona sin approval» + fallback Twilio + free tiers íntegros (propuesta 1.a, Stack): el loop entero es un fin de semana exacto sin una sola integración dura.
- **C1.a D4=9:** «el recordatorio llega de verdad al teléfono de un jurado» + «el jurado responde "MUEVE" → el sistema re-agenda y el calendario proyectado se actualiza solo» (propuesta 1.a, Demo): el mecanismo completo ocurre en vivo ante el jurado.
- **C2.a D1=9:** ataca las dos frases estructurales del caso con un solo mecanismo: «Si no reviso los tickets antes de acostarme, igual no me duermo» (ficha) + «si se desconecta algo se va a caer» (ficha) → cierre de turno + traspaso formal al grupo real (propuesta 2.a, Mecanismo).
- **C3.a D1=9:** «Si no lo miro, no existe» (ficha, el ostrich effect textual) → «el bot hace la primera exposición por ella… Nunca el total crudo de golpe, nunca dos malas noticias en el mismo audio» (propuesta 3.a, Mecanismo): el mecanismo exactamente inverso al error de diseño clásico («fuérzala a mirar»).
- **C3.a D4=9:** «se envía un audio de voz real de Patricia sintética… y el bot responde en vivo con contención + microacción (generación en tiempo real — este es el momento "wow")» (propuesta 3.a, Demo, paso 4).
- **C4.a D1=9:** «A todos en la faena les duele la espalda, es parte de la pega» (ficha) es la única causa-raíz que ningún intento previo tocó; el análisis lo dice: «La norma no se cambia con información individual… se cambia con evidencia visible entre pares». El pacto la voltea: «el que hace su pausa llega entero a la bajada».
- **C5.a D1=9:** la ficha nombra la causa («una forma de pensar de todo o nada») y la propuesta la ataca en su lugar de nacimiento: «toma el único ritual de planificación que ya funciona en su vida (el grupo armando el finde) y le agrega la pauta como ítem de la agenda» (propuesta 5.a).
- **C5.b D3=9:** «el MVP más acotado de las dos propuestas (3 momentos, 1 canal, sin grupos); 48 horas alcanzan con holgura para pulir la voz» (propuesta 5.b, Riesgos/Build).
- **C5.b D4=9:** «la pieza central: el domingo 21:00 en vivo — se manda el tap 😮‍💨 y llega la respuesta autocompasiva generada por GLM-5.3 en ese momento» + el contrafactual «9 ciclos desde cero vs 10 semanas cerradas» (propuesta 5.b, Demo).

---

## 2. Ranking por total ponderado

1. **C1.a La Cita — 8,10**
2. **C4.b Entre Vueltas — 8,03**
3. **C4.a El Pacto del Piquete — 8,00**
4. **C3.a Cuenta Conmigo — 7,95**
5. **C2.a Cierre de Guardia — 7,75**
6. **C3.b La Vuelta del Sábado — 7,73**
7. **C5.b Domingo Bueno — 7,65**
8. **C5.a Cañeras — 7,60**
9. **C2.b Aterrizaje — 7,50**
10. **C1.b Quedamos — 7,15**

---

## 3. Top-2 — por qué ganan en los criterios del jurado de Makana

### 🥇 C1.a «La Cita» (8,10)

**Problema entendido:** es la única propuesta del torneo que cierra los tres eslabones de la cadena causal de Camila con un solo artefacto: el «mañana parto» del domingo 23:55 se captura ANTES de morir y se convierte en cita con hora, sede y contenido («si cierro la última reunión del lunes, voy 19:15, 40 min, 3 máquinas»); la decisión caliente de las 19:00 desaparece porque ir es el default y no-ir exige decir «MUEVE»; y el loop de culpa —que la ficha dice textualmente que «le quita las ganas de ir»— queda desarmado con «mover ≠ fallar». El análisis del caso lo había dejado escrito: el gap de Camila es Oportunidad, no conocimiento ni motivación. **Solución bien pensada:** las exclusiones a propósito son las más disciplinadas del campo — sin contenido (3 apps ya muertas), sin rachas (culpa institucionalizada), sin dinero (la promo «no pagas si entrenas» ya probó que el precio no la mueve), sin cambiar de gym («ahí sí que no vuelvo nunca») — y cada exclusión cita el intento previo que la justifica. **Convicción de cierre:** a «¿con cuál de estas soluciones sí cambiaría esta persona?», La Cita es la que menos le pide: no exige motivación nueva, sino que cabalga la infraestructura que Camila ya obedece (el calendario de la pega) y el canal que ya habita. El 91% vs 35% de Milne no es un adorno: es el mecanismo. Techo honesto: 6 visitas en 10 meses; su [Assumption] central (que un invite se respeta como una reunión) debe pitchearse como hipótesis, no como hecho.

### 🥈 C4.b «Entre Vueltas» (8,03)

**Problema entendido:** mata la frase-obstáculo del caso por diseño estructural, no por motivación: «Si paro, el turno queda atrasado» (ficha) se disuelve porque la pausa solo existe dentro de detenciones que ya ocurren («SI baja la tolva a cargarme, ENTONCES 3 respiraciones») — cero minutos robados al ciclo, cero decisión en caliente, cero celular en el turno. Explica por qué TODO lo anterior falló: la kinesiología dio dosis sin gatillos, la cartilla dio gatillos difusos, la faja es reacción, y la pausa de la empresa «definía un bloque de 15 min que no existe en su turno». **Solución bien pensada:** el onboarding hace que el propio Marco elija sus gatillos reales — a la vez mecanismo y defensa contra el flag declarado (los tiempos muertos del ciclo no están cronometrados en ninguna fuente); la ficha física imantada respetan la restricción dura del caso (celular prohibido) en vez de negociarla. Exclusiones a propósito impecables: sin wearables, sin ranking, sin supervisor, sin telemetría. **Convicción de cierre:** Marco cambia con la que no le pide pelear contra la producción ni contra sus compañeros — y su motivación ya está en la ficha («jugar con sus nietos sin que le duela»), convertida en modo Nietos. Le falta el escalón más alto del podio porque la normalización social («a todos les duele») — la palanca que el propio análisis llama la más creíble — queda intacta: ese territorio es de 4.a, y ambas lo saben.

---

## 4. Por qué quedan fuera los 8 restantes (una línea, con su score)

3. **C4.a El Pacto del Piquete (8,00):** la única que voltea la norma social del piquete, pero todo su mecanismo descansa en que los pares se sumen — su propio riesgo declarado («¿y si el piquete no adopta el pacto?») es justo lo que 4.b no necesita para funcionar.
4. **C3.a Cuenta Conmigo (7,95):** el mecanismo más fino contra el ostrich effect y el demo más emocional del torneo, pero el análisis admite que no hay RCT del mecanismo exacto y el hábito del lunes descansa entero en que el tono de voz salga perfecto — D2 no aguanta más de 7.
5. **C2.a Cierre de Guardia (7,75):** el traspaso ataca la vigilancia nocturna con el lenguaje nativo de un TI, pero «Yo duermo poco nomás, siempre he sido así» es una identidad de 14 meses que el producto observa (pareja/expediente R4) sin voltear.
6. **C3.b La Vuelta del Sábado (7,73):** la traducción de Save More Tomorrow a picos de catálogo es pensamiento conductual profundo, pero esquiva la causa-raíz textual del caso («Si no lo miro, no existe») y el SMarT está validado en sueldos, no en ventas a puerta — transferencia declarada, hipótesis no probada.
7. **C5.b Domingo Bueno (7,65):** la evidencia experimental más directa del torneo (Adams & Leary) en el momento mejor fechado (domingo 21:00), pero deja fuera al grupo — la palanca social más fuerte del caso — y depende de que ella conteste en su peor hora de ánimo.
8. **C5.a Cañeras (7,60):** la única que integra el carrete en el plan en vez de prohibirlo (R3 en su máxima expresión) y con el mejor fit con «no quiero ser la fome que no sale», pero su demo descansa en un simulador de grupos que WhatsApp Cloud API no soporta en número de prueba — flag técnico que el propio equipo califica de «48 horas justas».
9. **C2.b Aterrizaje (7,50):** las dos cifras más duras del campo (corte de cafeína ≥8,8 h; ~45 min de TST) y un plan que muta con el roster, pero deja fuera la identidad normalizada — el eslabón que su propio análisis marca como el que la derivación R4 viene a romper.
10. **C1.b Quedamos (7,15):** la tesis «el apoyo existía, la logística no» es exacta al caso, pero el cold-start del pool de buddies es un CAC que nunca se cuantifica y el caso ya demostró que la coordinación de dos agendas dispersas muere — que un sistema la sostenga sigue siendo promesa, no mecanismo probado.

---

## 5. Nota de sesgos (declarada por el jurado)

- **Propuesta más «entretenida» que puntué bajo su fama:** «Cuenta Conmigo» (C3.a) es el demo que a mí me daría más piel de gallina — una voz que abraza a Patricia en su desvelo del domingo. La puntué 4ª, no 1ª: la diversión del demo (D4=9) no compensa que la credibilidad de cambio sea la más expuesta del campo (sin RCT del mecanismo exacto, hábito dependiente del tono). El criterio mandó sobre el gusto.
- **Propuesta menos «entretenida» que puntué alto:** «El Pacto del Piquete» (C4.a) me pareció de entrada «otro grupo de WhatsApp con racha», y tuve ganas de castigarla por poco novedosa. La evidencia me obligó a lo contrario: la norma social «a todos les duele» es causa-raíz textual citada dos veces en la ficha, y es la única que la ataca. D1=9 y podio (#3) por criterio, no por simpatía.
- **Sesgo de caso fácil, vigilado:** Camila (caso 1) es la ficha más «resoluble» del torneo; el 8,10 de La Cita no premia la simpleza del caso sino que cierra los tres eslabones causales con un solo artefacto — la misma vara que puso a 4.b a 0,07 de distancia en el caso más difícil del campo (minería 7×7, sin celular) indica que la vara fue pareja.
- **Ancla de auto-scores:** desconfié por sistema: los analistas se auto-puntuaron D6=9 en seis de diez propuestas («US$0 de demo») cuando la rúbrica pide CAC/LTV/break-even defendible — ninguna lo trae. Mi D6 promedio del campo es 6,7 contra su 8,7.

---

## Flags (proceso de evaluación)

**Yellow:**
- **Inflación sistemática de auto-scores:** los auto-scores promedian ~8,0 contra mis ~7,7 re-puntuados; mayor deflación individual: D6 en C4.a/C4.b (9→7) y C3.a/C3.b (9→7), porque «demo a US$0» no es unit economics. Ninguna propuesta del campo presenta break-even, supuestos de sensibilidad ni CAC cuantificado — el ítem 5 del gate de la rúbrica está incumplido por las 10 a esta altura (falta de la fase de build, no falta conceptual).
- **Transferencias [Assumption] que ponen techo a D2:** SMarT sueldos→catálogo (C3.b), exercise snacks oficina→operador minero (C4.a/4.b, flag declarada), invite-calendario→«se respeta como reunión» (C1.a). Todas declaradas honestamente en el expediente; capan el puntaje en vez de eliminarlas.
- **Estructura inconsistente de headers:** el archivo de caso 1 usa `## Propuesta 1.a/1.b` mientras los casos 2–5 usan `###` — notado para parseo automatizado; sin efecto en puntaje.
- **Backend de búsqueda intermitente** reportado por los analistas de los casos 2, 3 y 5 (errores NoneType, tier alterno): afecta la trazabilidad de fuentes secundarias (BBC, adsize.io, trophy.so), no las citas que sostienen puntajes — todas las que usé tienen URL y fuente primaria identificable.

**Red:** ninguna. Ninguna propuesta viola R1–R6; no hubo empates que exigieran tiebreak D4; ningún puntaje fue ajustado por afinidad con el caso; la aritmética de los 10 totales fue verificada dos veces con Decimal exacto.
