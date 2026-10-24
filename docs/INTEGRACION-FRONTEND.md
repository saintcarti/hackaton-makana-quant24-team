# Integración del frontend con el backend

Guía para Benjamin y sus agentes. Todo lo que necesitas para conectar el frontend está aquí; no hace falta leer el código del backend.

Tipos TypeScript del contrato: [`api-types.ts`](./api-types.ts). Cópialo a tu proyecto.

## 1. Levantar el backend en local

```bash
cd backend
pnpm install          # usar pnpm, no npm (hook de seguridad del equipo)
pnpm dev              # http://localhost:8787
```

Sin ninguna variable de entorno funciona: estado en memoria, sin Telegram, solo reglas locales para entender texto. Comprueba con `curl http://localhost:8787/api/health`.

En el frontend define una sola variable con la URL base:

```
NEXT_PUBLIC_API_URL=http://localhost:8787     # Next.js
VITE_API_URL=http://localhost:8787            # Vite
```

La API tiene CORS abierto (`*`) y responde JSON. Todas las rutas empiezan con `/api`.

Las rutas de demo (`/api/demo/*`, `/api/jobs/*`) piden el header `x-admin-token` **solo si** el backend tiene `ADMIN_TOKEN` configurado. Si el backend desplegado lo usa, pide el valor y mándalo desde el panel de demo.

## 2. Idea central: el chat es un log de mensajes con botones

No hay que implementar lógica del producto en el front. El front hace tres cosas:

1. Pinta los **mensajes** (`Message`) en orden de `n`.
2. Cuando la usuaria toca un **botón**, manda `{ action, label }` al backend. Cuando escribe, manda `{ text }`.
3. Pinta lo que el backend devuelve en `replies`.

Los textos, los botones y el tono los decide el backend. Si copias un texto en el front, se desincroniza.

### Enviar un mensaje o tocar un botón

```ts
const res = await fetch(`${API}/api/users/${userId}/messages`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ action: button.action, label: button.label }),   // botón
  // body: JSON.stringify({ text: 'hoy no puedo, se alargó la reunión' }), // texto libre
});
const { replies, user, now } = await res.json() as MessagesPost;
```

`label` es opcional y solo sirve para que la burbuja de la usuaria muestre «Lunes 26 a las 19:15» en el historial en vez de un código.

### Un mensaje del backend

```json
{
  "n": 12, "id": "m12", "userId": "camila-sintetica", "dir": "out", "at": "2026-10-25T23:00:00.000Z",
  "text": "Hola, Camila. Antes de que parta la semana: ¿cuándo te queda mejor tu cita contigo? …",
  "buttons": [
    { "label": "lunes 26 a las 19:15", "action": "slot:a_1b2c3d4e:2026-10-26T22:15:00.000Z" },
    { "label": "miércoles 28 a las 19:15", "action": "slot:a_1b2c3d4e:2026-10-28T22:15:00.000Z" },
    { "label": "Otra hora", "action": "other_hour" },
    { "label": "Esta semana no", "action": "skip_week" }
  ]
}
```

- `buttons` puede faltar. Pinta cada botón con su `label`; al tocarlo, envía su `action` sin modificarlo. **Si el botón trae `url`, es un enlace** (p. ej. «📅 Conectar mi calendario»): ábrelo en una pestaña nueva y no envíes nada al backend.
- `attachment` (`kind: "ics"`) aparece cuando se agenda o mueve una cita. Ofrece dos botones: «Agregar a Google Calendar», que abre `attachment.gcalUrl` en una pestaña nueva (el evento llega prellenado), y «Descargar .ics», que abre `API + attachment.url`.
- Mensajes con `dir: "in"` son los de la usuaria (para reconstruir el historial al recargar).

### Cargar el historial y actualizarse en vivo

```ts
// Al abrir la pantalla
const { messages } = await (await fetch(`${API}/api/users/${userId}/messages`)).json();
let last = messages.at(-1)?.n ?? 0;

// Polling cada 1,5 s: sirve para ver lo que pasa en Telegram o por acciones del panel de demo
setInterval(async () => {
  const r = await (await fetch(`${API}/api/users/${userId}/messages?after=${last}`)).json();
  for (const m of r.messages) append(m);
  last = r.messages.at(-1)?.n ?? last;
}, 1500);
```

No hay WebSocket ni SSE: en Workers/serverless no son una buena base. El polling alcanza para el demo.

Cuidado con duplicados: lo que devuelve `POST /messages` (`replies`) también aparecerá en el siguiente polling. Deduplica por `n` (o `id`).

## 3. Los tres momentos del demo, paso a paso

El usuario de demo es `camila-sintetica`; su id también viene en `GET /api/meta` → `demoUserId`.

**Preparación (una vez antes de ensayar).**

```bash
curl -X POST $API/api/demo/reset -H 'Content-Type: application/json' -d '{}'
```

Borra todo, carga a Camila sintética con 6 semanas de historial y deja el reloj real.

**Momento 1 · Domingo 20:00: el «mañana parto» se vuelve cita.**

```ts
await post('/api/demo/clock', { preset: 'sunday-20' });                  // reloj simulado
const { replies } = await post(`/api/users/${id}/weekly-capture`, {});   // llega el mensaje con 4 botones
// la usuaria toca el primer horario:
await post(`/api/users/${id}/messages`, { action: replies[0].buttons[0].action });
// respuesta: «Listo: lunes 26 a las 19:15…» + attachment .ics
```

**Momento 2 · Lunes 18:30: el recordatorio.**

```ts
await post('/api/demo/clock', { preset: 'monday-1830' });
await post(`/api/users/${id}/reminder`, {});     // botón de demo: dispara el recordatorio a mano
```

Hazlo con un botón visible en el panel de demo. No finjas automatización: en producción el recordatorio lo dispara un cron de Cloudflare cada 5 minutos (`/api/jobs/tick`), pero ese cron se pausa mientras el reloj de demo está simulado, así que en el demo se dispara a mano.

**Momento 3 · «Hoy no puedo» y luego «listo».**

```ts
await post(`/api/users/${id}/messages`, { text: 'hoy no puedo, se alargó la reunión' });
// «Hecho, la moví al miércoles 28 a las 19:15. Mover no es fallar.» + nuevo .ics
// «Listo» solo aplica a una cita cercana (±36 h). Como la cita se movió al miércoles, adelanta antes el reloj
// hasta después de esa cita (la hora exacta sale de `appointment.startsAt` + 1 h):
await post('/api/demo/clock', { now: appointment.startsAt /* + 1 h, en ISO */ });
await post(`/api/users/${id}/messages`, { action: 'done' });
// «Listo. Tu mensualidad ya estaba pagada: hoy recuperaste $11.633 de los $34.900.»
```

Para mostrar la regla anti-snooze: repite «mueve» tres veces. A la tercera el backend ofrece «martes 20:30» o «sábado 11:00» en vez de repetir el mismo horario.

## 4. Referencia de endpoints

Base: `${API}/api`. Errores siempre como `{ "error": { "code": "...", "message": "..." } }` con status 400, 401, 404, 409 o 500.

### Chat

| Método | Ruta | Cuerpo | Respuesta |
|---|---|---|---|
| POST | `/users/:id/messages` | `{ text? , action? , label? }` (al menos uno de `text` o `action`) | `{ replies: Message[], user, now }` |
| GET | `/users/:id/messages?after=<n>` | | `{ messages: Message[], now }` |

Acciones (`action`) que el front puede mandar por su cuenta: `done`, `move`, `skip_week`, `other_hour`, `propose`. Las de horario (`slot:<apptId>:<ISO>`) vienen siempre dentro de un botón: no las construyas a mano.

### Acciones directas (botones del panel de demo)

Todas son `POST`, cuerpo opcional, y devuelven `{ appointment, replies, now }`.

| Ruta | Qué hace |
|---|---|
| `/users/:id/weekly-capture` | Envía la captura dominical (M1) |
| `/users/:id/default` | Aplica la cita por defecto (el silencio agenda) |
| `/users/:id/reminder` | Envía el recordatorio del día (M3) |
| `/users/:id/move` | MUEVE (M4); `{ appointmentId? }` |
| `/users/:id/done` | «Listo» (M6); `{ appointmentId? }` |

### Lectura para vistas

| Método | Ruta | Devuelve |
|---|---|---|
| GET | `/users/:id/summary` | `Summary`: visitas, movidas, plata recuperada, próxima cita, visitas por semana |
| GET | `/users/:id/appointments` | `{ appointments: AppointmentView[] }`, orden cronológico |
| GET | `/users/:id/calendar?weekOf=YYYY-MM-DD` | `CalendarWeek` listo para pintar la grilla (por defecto, la semana del reloj). `weekOf` debe ser un lunes |
| GET | `/appointments/:id` | `{ appointment }` |
| GET | `/appointments/:id/ics` | Archivo `text/calendar` para descargar |
| GET | `/metrics` | Hipótesis H1–H3 de la sesión actual (excluye el seed) |
| GET | `/users`, `/users/:id` | Usuarios |
| POST | `/users` | Crea un usuario sintético `{ name?, gym?, monthlyFee? }` |
| GET | `/meta` | Zona horaria, `demoUserId`, hora actual del backend, si Telegram está activo |
| GET | `/health` | `{ ok: true }` |

### Rutina según el tiempo libre

Al agendar o mover una cita el backend arma `AppointmentView.routine` con los minutos que de verdad hay desde esa hora: el menor entre la duración que ella eligió, el próximo bloque ocupado de su calendario (Google conectado o `POST /busy`), la próxima cita y el cierre del gym. Si el hueco es más corto que `sessionMin`, la cita se acorta a lo que cabe (`durationMin` = `routine.minutes`, en múltiplos de 5; el evento de Google y el `.ics` se actualizan). Con menos de 20 min no hay rutina. La rutina usa los grupos del `focus` (todo el cuerpo si no hay split) y sale de un catálogo fijo de ejercicios básicos, sin LLM; cada semana rota las variantes. Qué mostrar: calentamiento + `items` (`name`, `sets × reps`).

En Telegram: el recordatorio del día trae un segundo mensaje con la rutina, y ella puede pedirla escribiendo «qué toca hoy» o «mi rutina». También va en la descripción del evento de Google y del `.ics`. R4: con pausa por dolor no hay rutina ni foco. Sin pesos, sin cifras del cuerpo y sin metas de resultado.

### El agente elige split y duración (modo automático)

Si la usuaria tiene `perWeek` (1, 2 o 3) y no `autoPlan: false`, el backend corre `autoDecide` (copia literal de `frontend/src/lib/autoplan.ts`: `backend/src/autoplan.ts`) en la captura dominical y cuando «mueve» pasa la cita a otra semana. Arma un `DayRoom` por día con `availableMinutes` (calendario conectado + `POST /busy` + otras citas + horario del gym), guarda `user.split` y `user.sessionMin` y recién entonces propone horarios, así que el mensaje del domingo ya nace con la duración de esa semana. No decide de nuevo una semana empezada (alguna cita ya llegó a su hora) ni guarda una decisión sin sesiones. Para el modo manual de la hoja de edición, la web manda `PATCH /preferences { autoPlan: false, split, sessionMin }`; con `autoPlan: true` vuelve al automático.

### Lenguaje natural

Las reglas entienden el día y la hora en texto libre: toman la hora destino («cámbiala para las 20:00»), ignoran la cláusula del motivo («debido a que hoy a las 19:15…»), dan prioridad al día nombrado sobre «hoy», y una pregunta («¿qué músculos trabajo el lunes?») nunca mueve la cita: responde la rutina o el foco de ese día. Si las reglas no entienden y hay Workers AI, el modelo solo extrae `{date, time}` (JSON validado); el texto que ve ella sale siempre de plantillas.

### Split y foco por sesión

`PATCH /users/:id/preferences { split: { id, sessions } }` guarda el split (`fullbody` 1·2·3, `upper-lower` 2·4, `ppl` 3·6, `torso-piernas-brazos` 3, `cinco-dias` 5; otra combinación responde 400 `invalid_split`). El backend corre el mismo planificador que la web (`backend/src/splits.ts` es copia literal de `frontend/src/lib/splits.ts`: si uno cambia, cambia el otro) y deja el foco en `AppointmentView.focus` al agendar o mover la cita. El recordatorio lo nombra: «Hoy toca Pull: espalda y bíceps», sin ejercicios, series ni repeticiones.

R4: si Camila menciona dolor, el agente deriva a un kinesiólogo o médico deportólogo, pone `user.painPause` y quita el foco de las citas que vienen. Mientras dure, ninguna cita nueva lleva `focus`. Se retoma cuando ella escribe algo como «ya lo conversé con mi kinesiólogo» (respuesta «Retomamos: …»). Hoy el agente agenda una cita por semana, así que el foco es el que el plan asigna a ese día; las demás sesiones del split siguen siendo sugerencias de la web (fase 2).

### Un solo evento por cita, y corrimiento automático

Con Google conectado el agente crea el evento y lo **mueve** (mismo evento) cuando la cita cambia; por eso no manda `.ics` ni el botón «Agregar a Google Calendar» (`attachment` ausente): importarlo a mano duplicaría el evento. Sin Google conectado sí va el `.ics` (con `SEQUENCE` para que una reimportación actualice). Lo «ocupado» sale de las reuniones reales del calendario sin contar las citas del propio agente. En cada `tick` (cron cada 5 min en hora real; `POST /jobs/tick` en el demo con reloj simulado), si una reunión nueva pisa una cita de los próximos 7 días, el agente la corre solo al siguiente hueco y avisa («Vi que tu calendario cambió… La corrí al…»); no cuenta como un MUEVE de ella y lo hace como máximo 2 veces por cita. Si no hay hueco cercano avisa una vez y pide día y hora. `POST /demo/reset` borra antes las citas del agente en Google para no dejar eventos huérfanos.

### Proactividad: calentar en el camino y pausas activas

Sin que ella pregunte, el agente propone movimiento en los tiempos muertos: (1) el recordatorio del día trae un tercer mensaje, «Para llegar con el cuerpo listo al gym», con caminata a paso ligero y, si hay 12+ min libres antes de la cita, trote suave al final (hasta 20 min en total, según lo que deje la reunión anterior del calendario); (2) en cada `tick`, si el día de la cita tiene un hueco de 10+ min entre dos reuniones (entre 09:00 y 19:00 y al menos 45 min antes de la cita), manda una sola pausa activa de 3 o 5 movimientos sin equipo. También responde cuando ella pregunta («¿qué me recomiendas para calentar?», «me iré caminando…»), y si la pregunta viene junto con la hora, agenda **y** contesta. Todo es texto de plantilla, sin cifras del cuerpo. R4: con pausa por dolor no se manda nada de esto.

### Recomendar una hora con lo que ella cuenta

Si Camila pregunta qué tiene agendado o qué hora le conviene («¿qué hora me recomiendas?»), el agente **no agenda**: responde con su calendario (próximos 7 días, con título y hora) y propone opciones para elegir. Entiende la reunión que ella menciona («una reunión el jueves a las 7 de la tarde, lo más probable es que se alargue»: la cuenta como ocupada 60 min, o 90 si dice que puede alargarse) y cuánto demora en llegar («20 minutos caminando, 15 si troto» → `user.commute`; el trayecto mezclado cuenta ~70 % caminando y ~30 % trotando). Esa reunión más el trayecto se descuentan al elegir la hora; si el mismo día no calza con su ventana, ofrece otros días y lo dice. Después el calentamiento usa su trayecto real («Sal 19 min antes de tu cita…»). Una pregunta nunca agenda ni mueve: solo una hora dicha como respuesta («Otra hora» abierta) o una orden («cámbiala para las 20:00») lo hace.

### Huecos en todo el día (el gym abre 05:30–23:00)

Con `user.flexTimes` (por defecto sí) la ventana 19:00–21:00 deja de ser un límite: el agente busca hueco en todo el horario del gym (`gymHours`, por defecto 05:30–23:00) entre las reuniones del calendario. Si hay reuniones cargadas (Google conectado u ocupación informada con `POST /busy`), no propone solo después del trabajo: reparte en partes del día y rotula cada botón («Lun 26 · 13:00 · almuerzo», «Lun 26 · 19:15 · tras el trabajo», «… · antes del trabajo» (etiquetas cortas, caben en un botón de Telegram; un horario por fila); orden de preferencia: después del trabajo, almuerzo, antes del trabajo, media tarde). Deja 10 min de margen antes y después de cada reunión para que un atraso corto no choque, y la rutina se arma con el tiempo que realmente queda hasta la próxima reunión o el cierre del gym. Si una reunión se alarga y pisa la cita, el corrimiento automático la mueve al siguiente hueco del día. Sin reuniones cargadas se mantiene el hábito de siempre (19:15). `CalendarWeek.hourRange` es `05:00–23:30` en este modo (antes `18:00–21:30`): la grilla debe leerlo. `PATCH /preferences { flexTimes: false }` vuelve a la ventana fija.

### Botones que desaparecen al elegir

Al apretar un botón, el mensaje queda con la elección (`Message.chosen`, p. ej. «Lun 26 · 13:45 · almuerzo») y sin `buttons`; en Telegram el mensaje se edita («✔ Lun 26 · 13:45 · almuerzo») y se le quita el teclado. Si ella responde escribiendo, o llega una propuesta nueva, o la cita se confirma/mueve/cierra, los botones viejos (horarios, «Otra hora», «Esta semana no», «Mueve», «Listo») se limpian también. La respuesta de ella en el espejo del chat es la etiqueta del botón, no el código. Ojo con el polling `?after=n`: solo trae mensajes nuevos, así que un mensaje viejo ya cargado no se entera de que perdió los botones; la web debe ocultar los de un mensaje que ya tiene una respuesta de ella después (`Chat.tsx` lo hace).

### Reglas de la sesión y disponibilidad

| Método | Ruta | Cuerpo → respuesta |
|---|---|---|
| PATCH | `/users/:id/preferences` | `{ gymHours?: {open,close}, window?: {start,end}, sessionMin?: 30\|40\|50\|60, perWeek?, days?: number[], split?: {id, sessions} }` (todo opcional, merge) → `{ user }`. Las reglas aplican a las **próximas** propuestas (captura dominical, «mueve», renegociación); una cita ya agendada no cambia. La sesión debe caber entera en `window ∩ gymHours`; si no cabe en ningún día, `weekly-capture` responde 409 `no_slots`. `perWeek > 1` se guarda pero el flujo dominical sigue agendando una cita por semana (fase 2). |
| POST | `/users/:id/busy` | `{ weekOf: "YYYY-MM-DD", intervals: [{start, end}] }` (ISO con zona) → `{ ok, count }`. Reemplaza los bloques ocupados de esa semana (lista vacía los borra). Solo inicio y fin, sin títulos (R2). El agente los esquiva igual que a un calendario conectado. Sirve para el plan B sin Google. |

### Google Calendar (conexión real)

Si la usuaria conecta su Google Calendar, el backend crea la cita en su calendario, la mueve cuando ella pide «mueve» y propone horarios que no chocan con sus reuniones. El front solo ofrece el enlace de conexión.

| Método | Ruta | Qué hace |
|---|---|---|
| GET | `/users/:id/google` | `GoogleStatus`: `{ configured, connected, connectUrl }` |
| GET | `/google/connect?userId=:id` | Redirige a Google para autorizar. Abre `connectUrl` en una pestaña nueva; al terminar, Google devuelve a una página «Calendario conectado» |
| POST | `/users/:id/google/disconnect` | Desconecta el calendario |
| GET | `/users/:id/google/events` (admin) | `{ events: [{ id, title, start, end, isLaCita, isDemoMeeting }] }`: próximos 21 días del calendario conectado; útil para mostrar el calendario real en el panel |
| POST | `/google/demo-events` (admin) | `{ userId }`: siembra el calendario conectado con las reuniones inventadas de una jefa de proyectos (próximas 2 semanas) |
| POST | `/google/demo-events/clear` (admin) | `{ userId }`: borra esos eventos de demo |
| POST | `/google/demo-meeting` (admin) | `{ userId, start, end, title? }` (ISO con zona): agrega una reunión al calendario conectado para el demo («se alargó la reunión»). Después `POST /jobs/tick` hace que el agente corra la cita al siguiente hueco |
| POST | `/google/appointments/clear` (admin) | `{ userId, keepLinked? }`: borra solo las citas que creó el agente en el calendario (deja las reuniones de demo); con `keepLinked: true` borra solo los huérfanos y respeta los eventos de las citas vigentes. Úsalo junto con `/demo/reset` para dejar a Camila limpia |

Tras conectar, el backend manda un mensaje al chat («Listo, quedó conectado tu Google Calendar…»), que aparece en el siguiente polling. El token de Google nunca sale del backend. La conexión funciona solo para usuarias de prueba autorizadas en el proyecto de Google (modo «En pruebas»).

### Demo y scheduler (piden `x-admin-token` si está configurado)

| Método | Ruta | Cuerpo |
|---|---|---|
| POST | `/demo/reset` | `{ seed?: boolean (true), now?: ISO, keepGoogle?: boolean (true) }`. Borra citas, chat y usuarias, pero conserva las conexiones de Google Calendar; con `keepGoogle: false` también las borra |
| POST | `/demo/clock` | Uno de: `{ preset: 'sunday-20' \| 'sunday-2330' \| 'monday-1830' \| 'monday-2000' }`, `{ now: ISO }`, `{ advanceMinutes: n }`, `{ reset: true }` |
| GET | `/demo/clock` | `{ now, simulated }` (abierto) |
| POST | `/jobs/tick` | Ejecuta lo que toca a la hora actual: captura dominical, cita por defecto, recordatorio. Es idempotente |
| POST | `/telegram/set-webhook` | `{ url }` (lo usa el backend, no el front) |

Para ver el efecto del silencio en el demo: `POST /demo/clock { advanceMinutes: 151 }` y luego `POST /jobs/tick`.

## 5. Reglas de presentación (el tono es el producto)

El caso de Camila dice que la culpa le quita las ganas de ir. Por eso el frontend también tiene reglas:

- **No inventes rachas, puntos, medallas, porcentajes de cumplimiento ni «días seguidos».** `Summary` no trae ninguno a propósito.
- **Nunca muestres «falta», «fallaste» o «ausente».** Para el estado de una cita usa siempre `AppointmentView.label` («Pasó» para `lapsed`, «Movida», «Realizada»). Una cita movida es un estado normal y positivo, no una advertencia.
- Colores: nada de rojo para citas pasadas o movidas. Usa tonos neutros o cálidos.
- No agregues contenido de rutinas, ejercicios ni consejos de salud. Si la usuaria menciona dolor, el backend ya responde; solo muéstralo.
- No muestres peso, fotos de progreso ni métricas del cuerpo.
- No muestres precios ni descuentos. El único dinero visible es «recuperaste $X de tu mensualidad», y viene en el texto del backend.
- El texto de los mensajes viene del backend: no lo recortes ni lo reescribas.

## 6. Datos que ves en el panel de Camila sintética

Después de `POST /demo/reset`, `GET /users/camila-sintetica/summary` entrega 11 visitas en las últimas 6 semanas, 4 citas movidas, 0 cadenas rotas y $127.967 recuperados (11 visitas × $11.633; es una estimación: la mensualidad repartida en 3 visitas al mes). Son datos inventados (regla R2); rotúlalos como «Camila sintética» en la pantalla.

## 7. Telegram (canal principal del demo)

El backend lo maneja entero. El frontend no necesita nada, salvo mostrar un enlace `t.me/<nombre_del_bot>` para que el jurado abra el bot. Cada chat de Telegram crea su propia usuaria sintética `tg_<chatId>` (sin guardar nombre ni datos personales). Esos usuarios aparecen en `GET /users` y puedes ver su conversación con `GET /users/tg_<chatId>/messages`, útil para proyectar en la pantalla lo que el jurado ve en su teléfono.

## 8. Desplegar y apuntar el front a producción

El backend corre en **Cloudflare Workers**: un Worker de entrada reenvía todo a un Durable Object que guarda el estado, y un cron cada 5 minutos ejecuta `/api/jobs/tick` (se pausa mientras el reloj de demo está simulado). La IA usa el binding de Workers AI, sin tokens extra.

1. Despliegue (lo hace el backend): `cd backend && pnpm run deploy`. **Ya está desplegado en `https://la-cita-api.x-liberona.workers.dev`** (usa esa URL como `*_API_URL`).
2. En el front cambia `*_API_URL` a esa URL y pide el `ADMIN_TOKEN` al backend para las rutas de demo.
3. CORS está abierto por defecto. Si quieres restringirlo, el backend define `CORS_ORIGIN` con la URL del front.
4. Plan B sin red (R6): corre el backend en la laptop del demo con `cd backend && pnpm start` (puerto 8787, estado en memoria) y apunta el front a `http://localhost:8787`. Todo el flujo funciona sin internet, salvo Telegram y la IA (que cae a reglas locales).

## 9. Cómo pedir cambios al backend

Si necesitas un campo, un endpoint o un mensaje distinto, pídelo con el caso de uso («la grilla necesita X para pintar Y»). El backend lo agrega y actualiza este documento y `api-types.ts` en el mismo commit. No parchees con datos falsos en el front.
