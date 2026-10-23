import { useState } from 'react';
import { googleClientId } from '../lib/google';

interface Props {
  onGoogle: () => Promise<void>;
  onDemo: () => void;
  telegramBot?: string;
}

export default function Login({ onGoogle, onDemo, telegramBot }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <main className="login">
      <section className="login-story">
        <div className="brand">La Cita</div>
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
            La Cita convierte esa frase en una hora real en tu calendario. Si el día se complica, la mueves.
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
        <div className="login-actions">
          <button className="btn btn-primary" onClick={google} disabled={busy || !googleClientId}>
            <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
              <path fill="currentColor" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62Z" />
              <path fill="currentColor" opacity=".85" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18Z" />
              <path fill="currentColor" opacity=".7" d="M3.97 10.72A5.4 5.4 0 0 1 3.68 9c0-.6.1-1.18.29-1.72V4.95H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.05l3.01-2.33Z" />
              <path fill="currentColor" opacity=".55" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58Z" />
            </svg>
            {busy ? 'Conectando…' : 'Entrar con Google'}
          </button>
          <button className="btn" onClick={onDemo}>
            Entrar como Camila sintética
          </button>
        </div>
        {!googleClientId && (
          <div className="notice">
            Google aún no está configurado en este despliegue (falta <code>VITE_GOOGLE_CLIENT_ID</code>). La demo
            con Camila sintética funciona igual.
          </div>
        )}
        {error && (
          <div className="notice" role="alert">
            {error}
          </div>
        )}
        <p className="fineprint">
          Solo pedimos permiso de lectura. Tu calendario se lee en este navegador y se olvida al cerrar la pestaña:
          no lo guardamos. Para el demo usa una cuenta de Google sintética.
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
