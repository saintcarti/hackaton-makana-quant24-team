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

Tras conectar, el backend manda un mensaje al chat («Listo, quedó conectado tu Google Calendar…»), que aparece en el siguiente polling. El token de Google nunca sale del backend. La conexión funciona solo para usuarias de prueba autorizadas en el proyecto de Google (modo «En pruebas»).

### Demo y scheduler (piden `x-admin-token` si está configurado)

| Método | Ruta | Cuerpo |
|---|---|---|
| POST | `/demo/reset` | `{ seed?: boolean (true), now?: ISO }` |
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
