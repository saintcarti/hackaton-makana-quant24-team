# Pedidos del frontend al backend

> **Estado (backend en `main`):** §1 y §3 implementados (`POST /users/:id/busy`, `PATCH /users/:id/preferences`; ver `docs/INTEGRACION-FRONTEND.md`). §2 era un error del ejemplo del doc, ya corregido. Además el backend conecta Google por OAuth en el servidor (`GET /users/:id/google`, `connectUrl`): la web lo usa y deja `VITE_GOOGLE_CLIENT_ID` vacío para no pedirle a Camila dos autorizaciones.

> **Estado §6 (backend en `main`):** `backend/src/autoplan.ts` es copia literal de `frontend/src/lib/autoplan.ts`; se llama en la captura dominical y al mover a otra semana. Usa `user.perWeek`; con `autoPlan: false` (modo manual) no decide. Detalle en `docs/INTEGRACION-FRONTEND.md`.

> **Estado §4 y §5 (backend en `main`, desplegado):** `PATCH /preferences { split: {id, sessions} }` (400 `invalid_split` si el split no ofrece esa cantidad), `AppointmentView.focus` y el foco en el recordatorio («Hoy toca Pull: espalda y bíceps»). R4: con dolor el agente deriva, pone `user.painPause` y no asigna foco; se retoma con «ya lo conversé con mi kinesiólogo». El planificador del backend es copia literal de `frontend/src/lib/splits.ts`. Rename: el saludo, el evento de Google y el `.ics` dicen «gogym» / «Tu cita contigo · gogym». **Pendiente (no hecho):** las preguntas de primer contacto en Telegram (horario del gym, duración, split); hoy se configuran desde la web.

Para @saintcarti. Según `docs/DIVISION-DE-TRABAJO.md`, lo que el front necesita y la API no da se pide acá con su caso de uso. Ninguno se simula en el front.

## 1. Disponibilidad desde Google Calendar (para que el agente busque el hueco real)

**Caso de uso.** Camila entra a la web con Google. La web lee su calendario (solo lectura, en el navegador) y pinta sus reuniones junto a la cita. Para que el agente de Telegram proponga horarios que de verdad le calzan, necesita saber cuándo está ocupada.

**Propuesta de contrato** (el front ya lo llama; hoy responde 404 y la web lo ignora sin romperse):

```
POST /api/users/:id/busy
{ "weekOf": "2026-10-26", "intervals": [ { "start": "2026-10-26T11:30:00.000Z", "end": "2026-10-26T21:10:00.000Z" } ] }
→ 200 { "ok": true }
```

- Reemplaza los intervalos guardados de esa semana (idempotente).
- La captura dominical y «otra hora» evitan esos intervalos al elegir slots dentro de la ventana 19:00–21:00.
- Solo se guardan inicio y fin: sin títulos ni datos del evento (R2).

**Por qué así y no OAuth en el servidor:** no hay refresh tokens que guardar ni pantalla de consentimiento con scope sensible del lado del servidor. La contra: la disponibilidad se actualiza cuando la usuaria abre la web. Para el demo alcanza.

## 2. (Menor) «Listo» después de mover

En el guion de `INTEGRACION-FRONTEND.md` §3, después de «hoy no puedo» (lunes 18:30) se manda `action: done`. Como la cita ya quedó el miércoles, el backend responde «Todavía no tienes una cita agendada esta semana». El panel de demo lo resuelve adelantando el reloj al final de la cita antes de mandar «listo». Si el comportamiento es el esperado, solo hay que corregir el ejemplo del doc.

## 3. Reglas de la sesión: horario del gym, duración, veces y días («Sesión que cabe»)

**Caso de uso.** Camila define en la web cuánto dura su sesión, cuántas veces por semana quiere ir, qué días puede y a qué hora abre y cierra su gym (p. ej. 06:00–22:00). La web ya cruza esas reglas con su ventana y su Google Calendar y muestra dónde cabe la sesión cada día, con el motivo cuando no cabe («El gym cierra a las 22:00», «Reunión hasta 20:30»). Para que el agente proponga **los mismos** horarios, el backend tiene que conocer y usar esas reglas. Hoy `backend/src/slots.ts` usa días fijos (`PREFERRED_DAYS` = lun, mié, vie), `preferredTime` y 40 min fijos (`DURATION_MS`), y no sabe el horario del gym.

**Propuesta de contrato** (la web ya lo llama; hoy responde 404, guarda las reglas en el navegador y avisa «El agente todavía no usa estas reglas»):

```
PATCH /api/users/:id/preferences
{
  "gymHours":   { "open": "06:00", "close": "22:00" },
  "window":     { "start": "19:00", "end": "21:00" },
  "sessionMin": 40,            // 30 | 40 | 50 | 60
  "perWeek":    2,             // 1 | 2 | 3
  "days":       [1, 3, 5]      // 0 = domingo … 6 = sábado
}
→ 200 { "user": User }         // User con esos campos; agregarlos a docs/api-types.ts
```

Todos los campos son opcionales (merge). Al recibir `{ user }` con `gymHours` y `sessionMin`, la web pasa a leer las reglas desde el backend y deja de mostrar el aviso.

**Qué cambia en el motor:**
- `nextSlots`: recorre `days` (en vez de `PREFERRED_DAYS`); prueba primero `preferredTime` y después la ventana cada 15 min; el candidato debe caber completo en `window ∩ gymHours` con duración `sessionMin`, y no chocar con los intervalos de `/busy` (§1) ni con otras citas.
- `durationMin` de la cita y del `.ics` = `sessionMin` (hoy 40 fijo).
- La renegociación (martes 20:30 / sábado 11:00) también tiene que caer dentro de `gymHours`.
- `perWeek > 1` (varias citas por semana) es un cambio mayor del flujo dominical: **fase 2**. Mientras tanto la web solo muestra cuántas caben y cuáles propondría.

**En Telegram, primer contacto** (una sola pregunta con valor por defecto, nada de formularios: O11):

> «¿Tu gym abre de 06:00 a 22:00?» [Sí] [Otro horario]
> «¿Cuánto dura tu sesión?» [30] [40] [50] [60]

Con eso alcanza para empezar; días y veces por semana se ajustan después desde la web.

**Sigue fuera:** ejercicios, series y repeticiones. Los grupos musculares entraron por decisión de Benjamín (ver §4).

## 4. Plan por split: grupos musculares con descanso

**Decisión de Benjamín (23-oct).** La semana se organiza por split de grupos musculares. Esto contradice dos exclusiones escritas: `AGENTS.md` («sin contenido de rutinas») y la ficha del caso, que pone «más contenido/rutinas (ya probó 3 apps)» en la columna «Lo que MATA una solución» (`docs/hackathon/senales/00-bases/scoring-contract.md:50`). Conviene acordar entre los dos cómo se defiende frente al jurado antes del pitch.

**Caso de uso.** Camila elige su split y cuántas sesiones por semana:

| Split | Sesiones | Focos |
|---|---|---|
| Full body | 1, 2 o 3 | todo el cuerpo cada vez |
| Upper / Lower | 2 o 4 | tren superior · piernas, glúteos y core |
| Push / Pull / Legs | 3 o 6 | pecho, hombros y tríceps · espalda y bíceps · piernas, glúteos y core |
| Pecho-espalda / Piernas / Brazos | 3 | pecho, espalda y core · piernas y glúteos · brazos y hombros |
| Un grupo por día | 5 | pecho · espalda · piernas y glúteos · hombros y core · brazos |

La web reparte el foco de cada sesión en los días donde cabe según su calendario, cubre los 8 grupos al menos una vez por semana y deja al menos un día de descanso entre dos sesiones que trabajan el mismo grupo (también entre el domingo y el lunes siguiente: por eso PPL ×3 cae lun/mié/vie y no lun/jue/dom). Hoy lo calcula sola, con `planSplit` en `frontend/src/lib/splits.ts` (función pura, 86 tests en verde en `frontend/scripts/splits-test.ts`), y avisa en pantalla que el agente todavía no lo usa.

**Propuesta de contrato.** Hoy `PATCH /preferences` rechaza campos desconocidos (`.strict()` en `backend/src/app.ts`) y `perWeek` mayor que 3, así que la web le manda las reglas sin el split y con `perWeek` acotado a 3; el split queda en el navegador. Para que el agente lo use:

```
PATCH /api/users/:id/preferences
{ "split": { "id": "ppl", "sessions": 3 } }    // fullbody | upper-lower | ppl | torso-piernas-brazos | cinco-dias
→ 200 { "user": User }                          // User.split

AppointmentView.focus?: { "dayTypeId": "push", "label": "Push", "groups": ["pecho", "hombros", "triceps"] }
```

**Qué cambia en el agente:**
- Al proponer o mover una cita, elige el foco con las mismas reglas que `planSplit`: orden del split, un día de descanso por grupo y cobertura semanal. Lo más simple es portar `frontend/src/lib/splits.ts` tal cual: no depende de nada del front.
- El recordatorio puede nombrar el foco («Hoy toca Pull: espalda y bíceps»), sin ejercicios, series ni repeticiones.
- **R4:** si Camila menciona dolor, el agente deriva como hoy y **no** asigna foco hasta que ella diga que ya lo conversó con un profesional. La web ya pausa el plan cuando aparece la derivación en el chat: detecta el texto de `backend/src/tone.ts` («kinesiólogo … médico deportólogo»). Si cambian ese texto, avísenme.
- Varias citas por semana sigue siendo fase 2 (§3). Mientras tanto el foco aplica a la cita semanal que ya agenda, y la web sugiere las demás sesiones del split.

**Telegram, primer contacto:** una pregunta más, de un toque: «¿Cómo divides tu semana?» [Full body] [Upper / Lower] [Push / Pull / Legs] [Otro].

## 5. Nombre: La Cita → gogym

Benjamín renombró la app a **gogym** (23-oct). La web ya dice gogym. Para que el demo no muestre dos nombres:

- `backend/src/tone.ts:56`: «Hola. Soy La Cita: …» → «Hola. Soy gogym: …».
- `backend/src/google.ts:137`, `backend/src/ics.ts:23` y `:44`: título del evento «La Cita contigo» → «Tu cita contigo · gogym» («tu cita contigo» sigue siendo el concepto).
- `backend/src/ics.ts:15`: `PRODID:-//La Cita//…` → `-//gogym//…`.
- Nombre visible del bot en BotFather.
- El Worker (`la-cita-api`) y la URL de Vercel (`la-cita-nine`) pueden quedar como están: cambiarlos antes del pitch obliga a reconfigurar `VITE_API_URL` y los enlaces ya compartidos.

## 6. El agente elige el split y la duración con el calendario

**Decisión de Benjamín (23-oct).** Camila dice solo cuántas veces por semana quiere ir (1, 2 o 3: su compromiso). El agente mira la semana y elige el split, la duración y los días para que los 8 grupos entren al menos una vez. Es el modo por defecto de la web («El agente, con mi calendario»); el modo manual de §4 sigue disponible en la hoja de edición.

**Regla** (`frontend/src/lib/autoplan.ts`, `autoDecide`; puro, determinista y con 34 tests en `frontend/scripts/autoplan-test.ts`; se corren con `pnpm test:planes` en `frontend/`):
- Se prueba primero la cantidad que pidió: 3 → Push/Pull/Legs de 40 y, si los huecos son cortos, de 30; 2 → Upper/Lower de 50, 40 o 30; 1 → Full body de 60, 50 o 40 (los 8 grupos no caben en menos).
- Si con esa cantidad no se cubren los 8 grupos, baja a menos sesiones con un split que igual los cubra y lo dice («Querías ir 3 veces, pero esta semana caben 2 sesiones…»). Si nada los cubre, devuelve el plan que más cubre.
- Entrada: por cada día de la semana, si hay cita real y la duración estándar más larga que cabe en su hueco (`DayRoom.maxMin` ∈ 0/30/40/50/60), más los focos ya decididos.
- Resguardos (salieron de una verificación adversarial con barridos de miles de semanas): una cita real ya agendada no recibe más minutos que su hueco; con focos ya hechos solo se consideran splits que los contengan; si hay más citas reales que las veces pedidas, el split alcanza para todas sin choques de descanso.
- Si la semana ya empezó (una cita real de esa semana ya llegó a su hora), no se vuelve a decidir: se mantiene el split que tiene el backend, para no re-etiquetar sesiones hechas.

**Hoy (sin cambios en el backend):** la web decide para la semana que muestra por defecto y manda `PATCH /preferences { split, sessionMin }` cuando la decisión cambia. Desde ahí el backend ya usa esa duración para la cita, el mensaje del domingo y la rutina, y planifica el foco con ese split. Solo se manda una decisión con al menos una sesión, así una semana vacía (domingo en la noche) no pisa el split.

**Pedido:** portar `autoplan.ts` tal cual a `backend/src/` y llamarlo en la captura dominical (y al mover una cita a otra semana), armando `DayRoom` con `availableMinutes` para la semana objetivo. Así el agente decide aunque la web esté cerrada, y el mensaje del domingo ya nace con el split y la duración de esa semana. Sin el puerto, el domingo el agente propone con lo que dejó la web la última vez, y la web corrige al abrirse (la cita se re-enfoca y la rutina se recalcula, pero el texto del domingo ya salió con la duración anterior).

**R4 en la web:** la pausa sale de `user.painPause`. El botón «Ya lo conversé con un profesional» le escribe eso mismo al agente, que limpia la pausa y responde «Retomamos: …». Ojo: el mensaje de la rutina (`tone.ts:53`) también nombra al kinesiólogo; la web ya no usa esa palabra para detectar dolor, solo la frase de la derivación.

## 7. Frases libres que se interpretan mal (probado el 24-oct contra el backend con f527e5f)

**Por qué importa:** el jurado puede escribirle al agente con sus propias palabras en el demo. Camila sintética, reloj simulado en lunes 26-oct 18:30, días lun/mié/vie, ventana 19:00–21:00, una cita agendada. Se escribió cada frase al chat y se leyó la respuesta:

| Frase | Respuesta del agente | Qué debería pasar |
|---|---|---|
| «cambialo para las 11:15 de la noche» | «A las 23:15 el gym está cerrado: abre de 06:00 a 22:00. Estas son las horas que sí calzan…» | Bien (corregido en f527e5f; antes la movía a una hora que no pidió). |
| «muevela a las 9 de la noche» | «la moví al lunes 26 a las 21:00» | Bien. |
| «el jueves a las 19:15» | «Listo: jueves 29 a las 19:15» | Bien (aunque el jueves no es uno de sus días). |
| «hoy a las 21:30» | «A las 21:30 el gym está cerrado: abre de 06:00 a 22:00» | Calza en intención, pero el texto miente: el gym abre hasta las 22:00; lo que no cabe es la sesión de 50 min. Debería decir «no alcanza a terminar antes del cierre». |
| «mueve a las 8 de la mañana» | «Listo: lunes 26 a las 20:00» | Ignora «de la mañana» y las 08:00 del lunes ya pasaron: debería proponer el martes 08:00 o decir que no calza. |
| «mañana a las 20:00» | «Te ayudo con una sola cosa: tu cita…» | No entiende «mañana»: debería leerlo como martes 27 y, como no es uno de sus días, avisarlo y ofrecer lo más cercano. |

**Pedido:** (1) leer «de la mañana / de la tarde / de la noche» y pasarlo a 24 h; (2) tratar «mañana» como el día siguiente; (3) si la hora o el día pedidos no calzan, decir por qué (cierre del gym, sesión que no cabe, día que no es suyo) y ofrecer el hueco más cercano en vez de elegir otro en silencio; (4) sumar estos casos a `backend/test/nlu.test.ts`.

**Mientras tanto, para el demo:** usar los botones y las frases que sí funcionan («hoy no puedo, se alargó la reunión», «muevela a las 9 de la noche», «el jueves a las 19:15»).
