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

- `buttons` puede faltar. Pinta cada botón con su `label`; al tocarlo, envía su `action` sin modificarlo.
- `attachment` (`kind: "ics"`) aparece cuando se agenda o mueve una cita. Muestra un botón «Agregar a mi calendario» que abra `API + attachment.url`; el navegador descarga el `.ics`.
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

No hay WebSocket ni SSE: en Vercel serverless no son confiables. El polling alcanza para el demo.

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

Hazlo con un botón visible en el panel de demo. No finjas automatización: el plan gratuito de Vercel no garantiza la hora exacta. En producción lo hace `/api/jobs/tick`.

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

1. El backend se despliega en Vercel desde la carpeta `backend/` (entrada `api/index.ts`; reescritura de rutas en `vercel.json`).
2. Variables de entorno de producción: ver `backend/.env.example`. Sin Upstash el estado se pierde entre invocaciones serverless; para el demo usa Upstash o corre el backend en una máquina local con `pnpm start`.
3. En el front cambia `*_API_URL` a la URL desplegada y pide el `ADMIN_TOKEN` si se definió.
4. Plan B sin red (R6): corre el backend en la laptop del demo (`pnpm start`) y el front apuntando a `http://localhost:8787`. Todo el flujo funciona sin internet, salvo Telegram.

## 9. Cómo pedir cambios al backend

Si necesitas un campo, un endpoint o un mensaje distinto, pídelo con el caso de uso («la grilla necesita X para pintar Y»). El backend lo agrega y actualiza este documento y `api-types.ts` en el mismo commit. No parchees con datos falsos en el front.
