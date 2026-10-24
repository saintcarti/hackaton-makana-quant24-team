import { describe, expect, it } from 'vitest';
import { Engine } from '../src/engine.js';
import { MemoryStore } from '../src/store.js';
import { parseTelegramUpdate } from '../src/channels/telegram.js';
import { zonedToUtc } from '../src/time.js';

const SUNDAY_20 = zonedToUtc(2026, 10, 25, 20, 0);

/** Telegram falso: numera los mensajes y anota lo que se le pide quitar. */
function fakeTelegram() {
  let next = 100;
  const sent: Array<{ id: number; text: string }> = [];
  const cleared: Array<{ messageId: number; text?: string }> = [];
  return {
    sent,
    cleared,
    tg: {
      send: async (_chat: number, msg: { text: string }) => {
        const id = next++;
        sent.push({ id, text: msg.text });
        return id;
      },
      clearButtons: async (_chat: number, messageId: number, text?: string) => {
        cleared.push({ messageId, text });
      },
    } as any,
  };
}

async function setup() {
  const fake = fakeTelegram();
  const engine = new Engine({ store: new MemoryStore(), telegram: fake.tg });
  await engine.run((c) => {
    engine.setClock(c, SUNDAY_20);
    engine.createUser(c, { id: 'tg1', channel: { type: 'telegram', chatId: 77 } });
  });
  return { engine, ...fake };
}

describe('botones que desaparecen al elegir', () => {
  it('al apretar un horario, ese mensaje queda con la elección y sin botones (también en Telegram)', async () => {
    const { engine, sent, cleared } = await setup();
    const appt = await engine.run((c) => engine.startCapture(c, 'tg1'));
    const captureId = sent[0]!.id;
    const slot = appt.options[0]!;
    await engine.run((c) => engine.handleInbound(c, 'tg1', { action: `slot:${appt.id}:${slot}`, tgMessageId: captureId }));

    const cap = await engine.read((c) => c.db.messages.find((m) => m.tgMessageId === captureId)!);
    expect(cap.buttons).toBeUndefined();
    expect(cap.chosen).toMatch(/lunes 26/); // etiqueta del botón elegido
    const edit = cleared.find((e) => e.messageId === captureId);
    expect(edit?.text).toMatch(/✔ /);
    // en el espejo del chat, lo que ella "dijo" es la etiqueta, no el código del botón
    const said = await engine.read((c) => c.db.messages.filter((m) => m.dir === 'in').at(-1)!);
    expect(said.text).toBe(cap.chosen);
  });

  it('una propuesta nueva borra los botones de la anterior', async () => {
    const { engine, sent, cleared } = await setup();
    await engine.run((c) => engine.startCapture(c, 'tg1'));
    const firstId = sent[0]!.id;
    await engine.run((c) => engine.startCapture(c, 'tg1'));
    expect(cleared.some((e) => e.messageId === firstId && e.text === undefined)).toBe(true);
    const old = await engine.read((c) => c.db.messages.find((m) => m.tgMessageId === firstId)!);
    expect(old.buttons).toBeUndefined();
  });

  it('si ella responde escribiendo la hora, los botones de la propuesta también se limpian', async () => {
    const { engine, sent, cleared } = await setup();
    await engine.run((c) => engine.startCapture(c, 'tg1'));
    const captureId = sent[0]!.id;
    await engine.run((c) => engine.handleInbound(c, 'tg1', { text: 'miércoles 20:00' }));
    expect(cleared.some((e) => e.messageId === captureId)).toBe(true);
    const cap = await engine.read((c) => c.db.messages.find((m) => m.tgMessageId === captureId)!);
    expect(cap.buttons).toBeUndefined();
  });

  it('el recordatorio conserva sus botones hasta que se usan o cambia la cita', async () => {
    const { engine } = await setup();
    const appt = await engine.run((c) => engine.startCapture(c, 'tg1'));
    await engine.run((c) => engine.chooseSlot(c, 'tg1', appt.id, appt.options[0]!));
    await engine.run((c) => engine.sendReminder(c, 'tg1'));
    const msgs = await engine.read((c) => c.db.messages.filter((m) => m.dir === 'out'));
    const reminder = msgs.find((m) => m.buttons?.some((b) => b.action === 'done'));
    expect(reminder).toBeTruthy();
    // el mensaje de la rutina y del calentamiento que vienen después no se los quitan
    expect(msgs.at(-1)!.buttons).toBeUndefined();
    await engine.run((c) => engine.handleInbound(c, 'tg1', { action: 'move' }));
    const after = await engine.read((c) => c.db.messages.find((m) => m.id === reminder!.id)!);
    expect(after.buttons).toBeUndefined();
    expect(after.chosen).toBeTruthy();
  });

  it('el id del mensaje viene en el callback de Telegram', () => {
    const inbound = parseTelegramUpdate({ callback_query: { id: 'q', data: 'move', message: { chat: { id: 5 }, message_id: 321 } } });
    expect(inbound).toMatchObject({ chatId: 5, action: 'move', messageId: 321 });
  });
});
