import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { Engine } from '../src/engine.js';
import { MemoryStore } from '../src/store.js';
import { DEMO_USER_ID } from '../src/seed.js';
import { dayPart } from '../src/slots.js';
import { zonedToUtc } from '../src/time.js';

const u = `/api/users/${DEMO_USER_ID}`;
const send = (method: string, body: unknown) => ({ method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

async function setup(now: string) {
  const app = createApp(new Engine({ store: new MemoryStore() }), {});
  const call = async (path: string, body: unknown = {}, method = 'POST') =>
    (await app.request(path, method === 'GET' ? undefined : send(method, body))).json<any>();
  await call('/api/demo/reset');
  await call('/api/demo/clock', { now });
  return { call };
}

// Oficina de 08:00 a 19:00 con almuerzo de 12:30 a 14:30, de lunes a viernes (semana del 26-oct)
const office = ['2026-10-26', '2026-10-27', '2026-10-28', '2026-10-29', '2026-10-30'].flatMap((d) => [
  { start: `${d}T08:00:00-03:00`, end: `${d}T12:30:00-03:00` },
  { start: `${d}T14:30:00-03:00`, end: `${d}T19:00:00-03:00` },
]);

describe('horarios flexibles: el gym abre 06:00–22:00 y el calendario está lleno de 08 a 19', () => {
  it('las partes del día', () => {
    expect(dayPart(zonedToUtc(2026, 10, 26, 6, 30)).id).toBe('morning');
    expect(dayPart(zonedToUtc(2026, 10, 26, 13, 0)).id).toBe('lunch');
    expect(dayPart(zonedToUtc(2026, 10, 26, 19, 15)).id).toBe('evening');
  });

  it('propone el almuerzo y después del trabajo, con margen contra las reuniones', async () => {
    const { call } = await setup('2026-10-25T23:00:00.000Z');
    await call(`${u}/busy`, { weekOf: '2026-10-26', intervals: office });
    const cap = await call(`${u}/weekly-capture`);
    const slots = cap.replies[0].buttons.filter((b: any) => b.action.startsWith('slot:'));
    expect(slots).toHaveLength(2);
    expect(slots.map((b: any) => b.label).join(' | ')).toMatch(/almuerzo/);
    expect(slots.map((b: any) => b.label).join(' | ')).toMatch(/tras el trabajo/);
    for (const b of slots) {
      const iso = b.action.split(':').slice(2).join(':');
      const start = Date.parse(iso);
      const end = start + 40 * 60_000;
      for (const m of office) {
        // ni dentro de una reunión ni a menos de 10 min de ella
        expect(start < Date.parse(m.end) + 10 * 60_000 && end + 10 * 60_000 > Date.parse(m.start)).toBe(false);
      }
    }
    expect(cap.replies[0].text).toMatch(/Miré tu calendario/);
    for (const b of slots) expect(b.label.length).toBeLessThanOrEqual(34); // cabe en un botón de Telegram
  });

  it('si la tarde-noche se llena, usa el almuerzo o antes del trabajo en vez de ir sin hueco', async () => {
    const { call } = await setup('2026-10-25T23:00:00.000Z');
    // lunes ocupado hasta las 23:00 salvo el almuerzo; el resto de los días libres a la hora de siempre
    await call(`${u}/busy`, {
      weekOf: '2026-10-26',
      intervals: [
        { start: '2026-10-26T08:00:00-03:00', end: '2026-10-26T12:30:00-03:00' },
        { start: '2026-10-26T14:30:00-03:00', end: '2026-10-26T23:00:00-03:00' },
      ],
    });
    const cap = await call(`${u}/weekly-capture`);
    const first = cap.replies[0].buttons.find((b: any) => b.action.startsWith('slot:'));
    expect(first.label).toMatch(/Lun 26/);
    expect(first.label).toMatch(/(almuerzo|antes del trabajo)/);
  });

  it('el horario del gym manda: nada antes de abrir ni después de cerrar', async () => {
    const { call } = await setup('2026-10-25T23:00:00.000Z');
    await call(`${u}/preferences`, { gymHours: { open: '06:00', close: '22:00' } }, 'PATCH');
    await call(`${u}/busy`, { weekOf: '2026-10-26', intervals: office });
    const cap = await call(`${u}/weekly-capture`);
    for (const b of cap.replies[0].buttons.filter((x: any) => x.action.startsWith('slot:'))) {
      const d = new Date(b.action.split(':').slice(2).join(':'));
      const hh = Number(d.toLocaleString('en-GB', { hour: '2-digit', hour12: false, timeZone: 'America/Santiago' }));
      expect(hh).toBeGreaterThanOrEqual(6);
      expect(hh).toBeLessThan(22);
    }
  });

  it('el calendario del día muestra todo el horario del gym', async () => {
    const { call } = await setup('2026-10-25T23:00:00.000Z');
    const week = await call(`${u}/calendar?weekOf=2026-10-26`, {}, 'GET');
    expect(week.hourRange).toEqual({ from: '05:30', to: '22:30' });
  });
});

describe('botones de Telegram', () => {
  it('cada horario va en su propia fila para que el texto no se corte', async () => {
    const { TelegramChannel } = await import('../src/channels/telegram.js');
    const kb = TelegramChannel.keyboard([
      { label: 'Lun 26 · 13:00 · almuerzo', action: 'slot:a:2026-10-26T16:00:00.000Z' },
      { label: 'Lun 26 · 19:15 · tras el trabajo', action: 'slot:a:2026-10-26T22:15:00.000Z' },
      { label: 'Otra hora', action: 'other_hour' },
    ]);
    expect(kb.inline_keyboard.map((r) => r.length)).toEqual([1, 1, 1]);
  });
});
