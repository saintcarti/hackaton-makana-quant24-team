import { useEffect, useState } from 'react';
import { api, setSession } from '../lib/api';
import type { GoogleStatus } from '../lib/api-types';
import { googleClientId, preloadGoogle } from '../lib/google';

interface Props {
  onGoogle: () => Promise<void>;
  onDemo: () => void;
  /** Entró una usuaria real con el código de Telegram. */
  onCode: (userId: string) => void;
  telegramBot?: string;
}

export default function Login({ onGoogle, onDemo, onCode, telegramBot }: Props) {
  const [code, setCode] = useState('');
  const [codeBusy, setCodeBusy] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(preloadGoogle, []);

  // Google conectado en el servidor (OAuth del backend) para la Camila sintética: es la vía principal.
  const [srv, setSrv] = useState<GoogleStatus | null>(null);
  useEffect(() => {
    let alive = true;
    api
      .meta()
      .then((m) => api.googleStatus(m.demoUserId))
      .then((s) => alive && setSrv(s))
      .catch(() => alive && setSrv(null));
    return () => {
      alive = false;
    };
  }, []);
  const serverGoogle = !!srv?.configured;

  async function google() {
    setBusy(true);
    setError(null);
    try {
      await onGoogle();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No pudimos entrar con Google.');
    } finally {
      setBusy(false);
    }
  }

  async function enterWithCode(e: React.FormEvent) {
    e.preventDefault();
    if (!/^\d{6}$/.test(code.trim())) {
      setError('El código tiene 6 dígitos. Escribe /web en el bot de Telegram para pedir uno.');
      return;
    }
    setCodeBusy(true);
    setError(null);
    try {
      const r = await api.exchangeCode(code.trim());
      setSession(r);
      onCode(r.userId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No pudimos validar el código.');
    } finally {
      setCodeBusy(false);
    }
  }

  return (
    <main className="login">
      <section className="login-story">
        <div className="brand">gogym</div>
        <div>
          <div className="eyebrow">Domingo, 23:55</div>
          <h1 className="display login-quote">«Mañana parto.»</h1>
          <ul className="login-week" aria-label="La semana de siempre">
            <li>
              <b>Lun</b> La reunión se alarga hasta las 20:10.
            </li>
            <li>
              <b>Mié</b> Alarma 06:30. Apagada cuatro veces.
            </li>
            <li>
              <b>Sáb</b> Abre la app del gym. No va.
            </li>
            <li>
              <b>Dom</b> Se cobra la mensualidad.
            </li>
          </ul>
          <p className="login-lede">
            gogym convierte esa frase en una hora real en tu calendario. Si el día se complica, la mueves.
            Mover no es fallar.
          </p>
        </div>
        <p className="fineprint">Hackatón Señales · Caso 1 · Demo con personas sintéticas.</p>
      </section>

      <section className="login-panel">
        <h2 className="display">Tu semana, con una hora para ti</h2>
        <p className="muted" style={{ margin: 0 }}>
          Conecta tu Google Calendar para ver tus reuniones junto a tu cita. La conversación pasa por Telegram:
          aquí ves el calendario completo.
        </p>
        {/* Sin Google configurado no se muestra un botón deshabilitado como acción principal. */}
        <div className="login-actions">
          {googleClientId && (
            <button className="btn btn-primary" onClick={google} disabled={busy}>
              <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
                <path fill="currentColor" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62Z" />
                <path fill="currentColor" opacity=".85" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18Z" />
                <path fill="currentColor" opacity=".7" d="M3.97 10.72A5.4 5.4 0 0 1 3.68 9c0-.6.1-1.18.29-1.72V4.95H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.05l3.01-2.33Z" />
                <path fill="currentColor" opacity=".55" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58Z" />
              </svg>
              {busy ? 'Conectando…' : 'Entrar con Google'}
            </button>
          )}
          <button className={`btn${googleClientId ? '' : ' btn-primary'}`} onClick={onDemo}>
            Entrar como Camila sintética
          </button>
          {srv?.configured && srv.connectUrl && !srv.connected && (
            <a className="btn" href={srv.connectUrl} target="_blank" rel="noreferrer">
              Conectar Google Calendar
            </a>
          )}
        </div>
        <form className="login-code" onSubmit={enterWithCode}>
          <label htmlFor="login-code-input" className="small muted">
            ¿Ya hablaste con el bot? Escribe /web en Telegram y entra con tu código
          </label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              id="login-code-input"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="123456"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              style={{ flex: 1 }}
            />
            <button className="btn" type="submit" disabled={codeBusy}>
              {codeBusy ? 'Entrando…' : 'Entrar con mi código'}
            </button>
          </div>
        </form>
        {serverGoogle && (
          <div className="notice">
            {srv?.connected
              ? 'Google Calendar conectado: Camila sintética usa su calendario real.'
              : 'Google está listo. «Conectar Google Calendar» abre Google en otra pestaña: autoriza con la cuenta sintética de Camila y vuelve aquí.'}
          </div>
        )}
        {!googleClientId && !serverGoogle && (
          <div className="notice">
            Google todavía no está configurado en este despliegue. La demo con Camila sintética funciona igual.
          </div>
        )}
        {error && (
          <div className="notice" role="alert">
            {error}
          </div>
        )}
        <p className="fineprint">
          Solo pedimos permiso de lectura. El agente lee solo tus horas ocupadas, sin títulos, para que no te proponga
          horarios que choquen. Para el demo usa una cuenta de
          Google sintética.
          {telegramBot && (
            <>
              {' '}
              El agente vive en{' '}
              <a href={`https://t.me/${telegramBot}`} target="_blank" rel="noreferrer">
                t.me/{telegramBot}
              </a>
              .
            </>
          )}
        </p>
      </section>
    </main>
  );
}
