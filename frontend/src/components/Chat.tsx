import { FormEvent, useEffect, useRef, useState } from 'react';
import { api, apiUrl } from '../lib/api';
import type { Button, Message, User } from '../lib/api-types';
import { fmtTime } from '../lib/format';

interface Props {
  userId: string;
  users: User[];
  onUserChange: (id: string) => void;
  messages: Message[];
  merge: (m: Message[]) => void;
  error: string | null;
  onActivity: () => void;
  onError: (msg: string) => void;
  telegramBot?: string;
}

function userLabel(u: User) {
  if (u.channel.type === 'telegram') return `Telegram · ${u.name || u.id}`;
  return u.synthetic ? `${u.name} (sintética)` : u.name;
}

export default function Chat({
  userId,
  users,
  onUserChange,
  messages,
  merge,
  error,
  onActivity,
  onError,
  telegramBot,
}: Props) {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);

  // Solo se pueden tocar los botones del último mensaje con botones, y solo si la usuaria aún no respondió.
  const lastWithButtons = [...messages].reverse().find((m) => m.dir === 'out' && m.buttons?.length)?.n;
  const answered = lastWithButtons !== undefined && messages.some((m) => m.dir === 'in' && m.n > lastWithButtons);

  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [messages.length]);

  async function send(body: { text?: string; action?: string; label?: string }) {
    setBusy(true);
    try {
      const r = await api.send(userId, body);
      merge(r.replies);
      onActivity();
    } catch (e) {
      onError(e instanceof Error ? e.message : 'No se pudo enviar.');
    } finally {
      setBusy(false);
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const t = text.trim();
    if (!t || busy) return;
    setText('');
    send({ text: t });
  }

  function tap(b: Button) {
    if (!busy) send({ action: b.action, label: b.label });
  }

  const current = users.find((u) => u.id === userId);

  return (
    <section className="panel chat" aria-label="Conversación con La Cita">
      <header className="chat-head">
        <div className="avatar" aria-hidden="true">
          C
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 650 }}>La Cita</div>
          <div className="small muted">
            {current?.channel.type === 'telegram' ? 'Espejo del chat de Telegram' : 'Simulador · mismo flujo que Telegram'}
          </div>
        </div>
        {users.length > 1 && (
          <label>
            <span className="sr-only">Ver conversación de</span>
            <select value={userId} onChange={(e) => onUserChange(e.target.value)}>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {userLabel(u)}
                </option>
              ))}
            </select>
          </label>
        )}
      </header>

      <div className="chat-log" ref={logRef} aria-live="polite">
        {messages.length === 0 && (
          <p className="chat-empty">
            {error
              ? 'No hay conexión con La Cita. Revisa que la API esté arriba.'
              : 'Todavía no hay mensajes. El domingo a las 20:00 llega la primera pregunta: usa el panel de demo para adelantar el reloj.'}
          </p>
        )}
        {messages.map((m) => (
          <div key={m.n} className={`msg ${m.dir}`}>
            <div className="bubble">{m.text}</div>
            {m.buttons && m.buttons.length > 0 && (
              <div className="kb">
                {m.buttons.map((b) => (
                  <button
                    key={b.action}
                    type="button"
                    onClick={() => tap(b)}
                    disabled={busy || answered || m.n !== lastWithButtons}
                  >
                    {b.label}
                  </button>
                ))}
              </div>
            )}
            {m.attachment?.kind === 'ics' && (
              <a className="ics" href={apiUrl(m.attachment.url)} download={m.attachment.filename}>
                <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="2" y="3" width="12" height="11" rx="2" />
                  <path d="M2 6.5h12M5.5 1.5v3M10.5 1.5v3M8 8.5v3M6.5 10h3" strokeLinecap="round" />
                </svg>
                Agregar a mi calendario
              </a>
            )}
            <time dateTime={m.at}>{fmtTime(m.at)}</time>
          </div>
        ))}
      </div>

      <form className="chat-compose" onSubmit={onSubmit}>
        <label className="sr-only" htmlFor="compose">
          Escribe un mensaje
        </label>
        <input
          id="compose"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Ej: hoy no puedo, se alargó la reunión"
          autoComplete="off"
        />
        <button className="btn btn-primary" type="submit" disabled={busy || !text.trim()}>
          Enviar
        </button>
      </form>
      {telegramBot && (
        <p className="small muted" style={{ margin: 0, padding: '0 1rem 0.75rem' }}>
          En el teléfono: <a href={`https://t.me/${telegramBot}`} target="_blank" rel="noreferrer">t.me/{telegramBot}</a>
        </p>
      )}
    </section>
  );
}
