# gogym para cualquier persona (beta cerrada)

El producto ya no es solo para Camila: cada persona tiene su propia cuenta, su propio calendario y su propio agente.

## Cómo entra alguien

1. Escribe `/start TU-CÓDIGO` al bot de Telegram (el código de invitación lo define `INVITE_CODE`; sin él, el bot responde «beta cerrada» y no guarda nada).
2. El bot le da la bienvenida, le dice qué guarda y le pregunta **cuántas veces por semana** quiere ir.
3. Le ofrece **conectar su Google Calendar** (OAuth; solo lee horas ocupadas y crea sus citas). Se puede saltar con «Más tarde».
4. Desde ahí el agente trabaja con **su** día: busca huecos antes del trabajo, al almuerzo o después, arma la rutina con el tiempo real, corre la cita sola si una reunión se alarga y, si pasan dos citas sin hacerse, le escribe una vez para retomar «suave».

## Comandos del bot

| Comando | Qué hace |
|---|---|
| `/start CÓDIGO` | Entra (beta cerrada) y empieza la bienvenida |
| `/web` | Da un código de 6 dígitos (10 min, un solo uso) para entrar a la web con **su** cuenta |
| `/privacidad` | Dice qué guarda |
| `/borrar` | Borra todo (citas, chat, permiso del calendario —se revoca en Google— y sus eventos en el calendario) |

## La web

En la pantalla de entrada: «Entrar con mi código». La sesión (7 días) es solo de esa persona: las usuarias de Telegram **no se ven sin sesión**; el simulador de Camila sintética sigue abierto para la demo. El token admin ve todo (panel de demo).

## Variables

`INVITE_CODE` (beta cerrada) y `SESSION_SECRET` (firma las sesiones). Se guardan como secretos del Worker (`wrangler secret put`) y en `backend/.env`. Sin `SESSION_SECRET` no hay protección por usuaria (modo local/tests).

## Por qué es una beta cerrada y no pública (regla R2)

Un calendario real contiene datos personales reales. Las bases del evento piden **solo datos sintéticos**, y abrir el producto al público dentro del evento nos arriesgaría a una descalificación. Por eso:

- El acceso es **por invitación** y OAuth de Google está en modo «En pruebas» (solo entran cuentas agregadas como usuarias de prueba).
- Durante el evento se usan **cuentas de prueba** (como la de Camila), nunca calendarios de personas reales.
- Cada persona puede **borrar todo** con `/borrar`.
- Para pasar a público hay que: verificar la app de Google, política de privacidad, términos y cifrado de los permisos en reposo. Está fuera del alcance del evento.

El respaldo de «esto se vende» son las entrevistas en el gimnasio (5 de 6 personas dijeron que lo usarían), no usuarios reales con datos reales.
