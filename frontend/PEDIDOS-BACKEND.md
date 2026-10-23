# Pedidos del frontend al backend

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

**Fuera a propósito:** rutinas, ejercicios, series y grupos musculares. El caso lo pone en «lo que mata la solución» (`docs/hackathon/senales/00-bases/scoring-contract.md:50`) y R4 prohíbe prescribir ejercicio con dolor.
