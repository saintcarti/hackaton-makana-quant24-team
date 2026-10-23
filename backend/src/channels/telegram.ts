import { Button, Message } from '../types.js';

/** Adaptador Telegram (canal principal del demo). Sin dependencias: fetch directo a la Bot API. */
export class TelegramChannel {
  constructor(
    private token: string,
    private api = 'https://api.telegram.org',
  ) {}

  private url(method: string) {
    return `${this.api}/bot${this.token}/${method}`;
  }

  private async call(method: string, body: unknown) {
    const res = await fetch(this.url(method), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`Telegram ${method} ${res.status}: ${await res.text()}`);
    return res.json();
  }

  /** Botones en filas: los de horario de a 2, el resto de a 1. callback_data <= 64 bytes. */
  static keyboard(buttons: Button[]) {
    type Btn = { text: string; callback_data?: string; url?: string };
    const rows: Btn[][] = [];
    let row: Btn[] = [];
    for (const b of buttons) {
      row.push(b.url ? { text: b.label, url: b.url } : { text: b.label, callback_data: b.action.slice(0, 64) });
      if (row.length === 2 || !b.action.startsWith('slot:')) {
        rows.push(row);
        row = [];
      }
    }
    if (row.length) rows.push(row);
    return { inline_keyboard: rows };
  }

  async send(chatId: number, msg: Message, icsContent?: string) {
    const rows = msg.buttons?.length ? TelegramChannel.keyboard(msg.buttons).inline_keyboard : [];
    // Botón de URL: abre Google Calendar con el evento prellenado (no requiere OAuth).
    const inline: Array<Array<{ text: string; callback_data?: string; url?: string }>> = [...rows];
    if (msg.attachment?.gcalUrl) inline.push([{ text: '📅 Agregar a Google Calendar', url: msg.attachment.gcalUrl }]);
    await this.call('sendMessage', {
      chat_id: chatId,
      text: msg.text,
      ...(inline.length ? { reply_markup: { inline_keyboard: inline } } : {}),
    });
    if (msg.attachment && icsContent) {
      const form = new FormData();
      form.set('chat_id', String(chatId));
      form.set('document', new Blob([icsContent], { type: 'text/calendar' }), msg.attachment.filename);
      form.set('caption', 'Agrégala a tu calendario con un toque.');
      const res = await fetch(this.url('sendDocument'), { method: 'POST', body: form });
      if (!res.ok) throw new Error(`Telegram sendDocument ${res.status}: ${(await res.text()).slice(0, 200)}`);
    }
  }

  async answerCallback(callbackQueryId: string) {
    await this.call('answerCallbackQuery', { callback_query_id: callbackQueryId });
  }

  async setWebhook(url: string, secretToken?: string) {
    return this.call('setWebhook', {
      url,
      allowed_updates: ['message', 'callback_query'],
      ...(secretToken ? { secret_token: secretToken } : {}),
    });
  }
}

export interface TelegramInbound {
  chatId: number;
  text?: string;
  action?: string;
  callbackQueryId?: string;
}

/** Normaliza un Update de Telegram a algo que el motor entiende. Null si no es relevante. */
export function parseTelegramUpdate(update: any): TelegramInbound | null {
  if (update?.callback_query) {
    const cq = update.callback_query;
    const chatId = cq.message?.chat?.id;
    if (typeof chatId !== 'number' || typeof cq.data !== 'string') return null;
    return { chatId, action: cq.data, callbackQueryId: cq.id };
  }
  const m = update?.message;
  if (m && typeof m.chat?.id === 'number' && typeof m.text === 'string') {
    return { chatId: m.chat.id, text: m.text };
  }
  return null;
}
