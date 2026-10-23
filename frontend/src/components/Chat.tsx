import { FormEvent, MouseEvent, useEffect, useRef, useState } from 'react';
import { api, apiUrl } from '../lib/api';
import type { Button, Message, User } from '../lib/api-types';
import { fmtTime } from '../lib/format';

interface Props {
  userId: string;
  users: User[];
  onUserChange: (id: string) => void;
  messages: Message[];
  merge: (m: Message[]) => void;
  loaded: boolean;
  error: string | null;
  errorStatus: number | null;
  onActivity: () => void;
  onError: (msg: string) => void;
  telegramBot?: string;
}

const msgKey = (m: Message) => `${m.n}:${m.at}`;
const LOCK_MAX_MS = 4000;

/** Posición en un grupo de mensajes seguidos del mismo lado (estilo iMessage). Botones o adjunto cierran el grupo. */
function groupPos(list: Message[], i: number): 'single' | 'first' | 'middle' | 'last' {
  const m = list[i];
  const prev = list[i - 1];
  const next = list[i + 1];
  const closes = (x: Message) => !!x.buttons?.length || !!x.attachment;
  const joinsPrev = !!prev && prev.dir === m.dir && !closes(prev);
  const joinsNext = !!next && next.dir === m.dir && !closes(m);
  if (joinsPrev && joinsNext) return 'middle';
  if (joinsPrev) return 'last';
  if (joinsNext) return 'first';
  return 'single';
}

export function userLabel(u: User) {
  if (u.channel.type === 'telegram') return `Telegram · chat …${u.id.replace(/^tg_/, '').slice(-4)}`;
  return u.synthetic ? `${u.name} (sintética)` : u.name;
}

export default function Chat({
  userId,
  users,
  onUserChange,
  messages,
  merge,
  loaded,
  error,
  errorStatus,
  onActivity,
  onError,
  telegramBot,
}: Props) {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  // Teclado ya respondido en esta pestaña: queda bloqueado hasta que el eco de la respuesta llegue del servidor.
  const [answeredKey, setAnsweredKey] = useState<string | null>(null);
  const logRef = useRef<HTMLDivElement>(null);

  const lastWithButtons = [...messages].reverse().find((m) => m.dir === 'out' && m.buttons?.length);
  const answeredOnServer =
    lastWithButtons !== undefined && messages.some((m) => m.dir === 'in' && m.n > lastWithButtons.n);
  const keyboardLocked =
    busy || answeredOnServer || (lastWithButtons !== undefined && answeredKey === msgKey(lastWithButtons));

  useEffect(() => setAnsweredKey(null), [userId]);

  // El bloqueo es temporal: se suelta cuando llega el eco de la respuesta o cuando ese mensaje ya no está en el log
  // (tras «Preparar» la nueva captura puede repetir n y casi el mismo `at`, y quedaría bloqueada).
  useEffect(() => {
    if (answeredKey && (answeredOnServer || !messages.some((m) => msgKey(m) === answeredKey))) {
      setAnsweredKey(null);
    }
  }, [messages, answeredOnServer, answeredKey]);

  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [messages.length]);

  async function send(body: { text?: string; action?: string; label?: string }, onFail?: () => void): Promise<boolean> {
    setBusy(true);
    try {
      const r = await api.send(userId, body);
      merge(r.replies);
      onActivity();
      return true;
    } catch (e) {
      onFail?.();
      onError(e instanceof Error ? e.message : 'No se pudo enviar.');
      return false;
    } finally {
      setBusy(false);
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const t = text.trim();
    if (!t || busy) return;
    setText('');
    send({ text: t }, () => setText(t));
  }

  async function tap(e: MouseEvent, m: Message, b: Button) {
    if (e.detail > 1 || keyboardLocked || m !== lastWithButtons) return;
    const key = msgKey(m);
    setAnsweredKey(key);
    const ok = await send({ action: b.action, label: b.label }, () => setAnsweredKey((k) => (k === key ? null : k)));
    // Tope duro desde que el servidor confirmó (no desde el toque: con red lenta liberaría un teclado ya respondido).
    // Si un reset externo trae una captura con la misma clave, el bloqueo no queda pegado.
    if (ok) window.setTimeout(() => setAnsweredKey((k) => (k === key ? null : k)), LOCK_MAX_MS);
  }

  const current = users.find((u) => u.id === userId);

  return (
    <section className="panel chat" aria-label="Conversación con gogym">
      <header className="chat-head">
        <div className="avatar" aria-hidden="true">
          C
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 650 }}>gogym</div>
          <div className="small muted">
            {current?.channel.type === 'telegram' ? 'Espejo del chat de Telegram' : 'Simulador · mismo flujo que Telegram'}
          </div>
        </div>
        {users.length > 1 && (
          <label>
            <span className="sr-only">Ver conversación de</span>
            <select value={userId} onChange={(e) => onUserChange(e.target.value)} disabled={busy}>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {userLabel(u)}
                </option>
              ))}
            </select>
          </label>
        )}
      </header>

      <div className="chat-log" ref={logRef} role="log" aria-live={loaded ? 'polite' : 'off'}>
        {messages.length === 0 && (
          <p className="chat-empty">
            {error && errorStatus === 404
              ? 'Esta conversación todavía no existe en la API.'
              : error
                ? 'No hay conexión con gogym. Revisa que la API esté arriba.'
                : 'Todavía no hay mensajes. El domingo a las 20:00 llega la primera pregunta: usa el panel de demo para adelantar el reloj.'}
          </p>
        )}
        {messages.map((m, i) => {
          const pos = groupPos(messages, i);
          return (
          <div key={msgKey(m)} className={`msg ${m.dir} g-${pos}`}>
            <div className="bubble">{m.text}</div>
            {m.buttons && m.buttons.length > 0 && (
              <div className="kb">
                {m.buttons.map((b) => (
                  <button
                    key={b.action}
                    type="button"
                    onClick={(e) => tap(e, m, b)}
                    disabled={keyboardLocked || m !== lastWithButtons}
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
            {(pos === 'last' || pos === 'single') && <time dateTime={m.at}>{fmtTime(m.at)}</time>}
          </div>
          );
        })}
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
          En el teléfono:{' '}
          <a href={`https://t.me/${encodeURIComponent(telegramBot)}`} target="_blank" rel="noreferrer">
            t.me/{telegramBot}
          </a>
        </p>
      )}
    </section>
  );
}
