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
