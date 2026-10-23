# Frontend · La Cita

Carpeta de Benjamin Caldera. Web de Camila: login, su semana (citas de La Cita + su Google Calendar), el chat que espeja Telegram y el panel de demo con los tres momentos del pitch.

Stack: Vite + React + TypeScript, CSS con tokens propios (postura: minimalismo cálido), fuentes locales con `@fontsource` para que el demo corra sin red (R6).

## Correr en local

```bash
cd ../backend && pnpm install && pnpm dev   # API en http://localhost:8787
cd ../frontend && pnpm install && pnpm dev  # web en http://localhost:5173
```

Copia `.env.example` a `.env.local` si necesitas cambiar la URL de la API, activar Google o mostrar el enlace del bot.

**Cambiar la API sin redesplegar:** en «Lo que ve el equipo» → *URL de la API*. Queda guardada en ese navegador y la página se recarga. Vacía vuelve a la del build (`VITE_API_URL`). Sirve para apuntar la web de Vercel al backend desplegado o a un túnel el día del demo.

**Deploy:** desde esta carpeta, `npx vercel@latest deploy --prod --yes` (proyecto `itsbenjaxs-projects/la-cita`, https://la-cita-nine.vercel.app). `VITE_API_URL` se inyecta al compilar: si cambia, hay que redesplegar.

**Plan B sin red (R6):** backend local (`pnpm start` en `backend/`) y esta web local (`pnpm build && pnpm preview`). Las fuentes van empaquetadas; Google es lo único que necesita internet.

## Qué hay

| Archivo | Qué hace |
|---|---|
| `src/App.tsx` | Sesión, carga de datos y refresco tras cada mensaje o acción de demo |
| `src/components/Login.tsx` | Entrada con Google o como Camila sintética |
| `src/components/WeekCalendar.tsx` | Semana con las citas (backend) y los eventos de Google |
| `src/components/Chat.tsx` | Simulador / espejo de Telegram: mensajes, botones, `.ics` |
| `src/components/DemoPanel.tsx` | Guion del demo: reset, domingo 20:00, silencio, lunes 18:30, «hoy no puedo», «listo» |
| `src/components/NextUp.tsx` | Próxima cita, plata recuperada e historial |
| `src/lib/api.ts` | Cliente del contrato HTTP (`src/lib/api-types.ts` es copia de `docs/api-types.ts`) |
| `src/lib/google.ts` | Google Identity Services + lectura de Calendar (solo lectura, token en memoria) |

Lo que el front necesita del backend y todavía no existe: `PEDIDOS-BACKEND.md`.

## Google Calendar (opcional)

1. Google Cloud Console → proyecto nuevo → habilitar **Google Calendar API**.
2. Pantalla de consentimiento en modo **Testing**, con la cuenta sintética de Camila como usuaria de prueba.
3. Credenciales → ID de cliente OAuth tipo **Aplicación web**. Orígenes JavaScript autorizados: `http://localhost:5173` y la URL de Vercel.
4. Pega el Client ID en `VITE_GOOGLE_CLIENT_ID`.

Usa una cuenta de Google sintética (R2: cero datos personales reales). Conviene cargarle eventos de trabajo realistas (obra 08:30–18:30, reunión que se alarga martes y jueves) para que la grilla cuente la historia.

## Reglas de presentación que respeta

Sin rachas, puntos ni porcentajes. Sin rojo. Los estados usan `AppointmentView.label` del backend. Mover es un estado normal. El único dinero visible es lo recuperado de la mensualidad.
