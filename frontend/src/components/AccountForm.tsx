import { useState, type FormEvent } from 'react';
import { api, setSession } from '../lib/api';

interface Props {
  /** Entró con su cuenta: la sesión ya quedó guardada. */
  onEntered: (userId: string) => void;
}

/** Crear cuenta / iniciar sesión. Solo alias y contraseña: sin correo ni nombre real (beta con datos de prueba). */
export default function AccountForm({ onEntered }: Props) {
  const [mode, setMode] = useState<'login' | 'register'>('register');
  const [alias, setAlias] = useState('');
  const [password, setPassword] = useState('');
  const [invite, setInvite] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const r =
        mode === 'register'
          ? await api.register(alias.trim(), password, invite.trim() || undefined)
          : await api.login(alias.trim(), password);
      setSession({ token: r.token, userId: r.userId });
      onEntered(r.userId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No pudimos entrar. Intenta de nuevo.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="account-form" onSubmit={submit} aria-label={mode === 'register' ? 'Crear cuenta' : 'Iniciar sesión'}>
      <div className="account-tabs" role="tablist">
        <button type="button" role="tab" aria-selected={mode === 'register'} onClick={() => setMode('register')}>
          Crear cuenta
        </button>
        <button type="button" role="tab" aria-selected={mode === 'login'} onClick={() => setMode('login')}>
          Ya tengo cuenta
        </button>
      </div>

      <label>
        <span className="small muted">Alias (no uses tu nombre real)</span>
        <input
          value={alias}
          onChange={(e) => setAlias(e.target.value)}
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          placeholder="ana.gym"
          required
          minLength={3}
          maxLength={24}
        />
      </label>
      <label>
        <span className="small muted">Contraseña (mínimo 8 caracteres)</span>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
          required
          minLength={8}
          maxLength={72}
        />
      </label>
      {mode === 'register' && (
        <label>
          <span className="small muted">Código de invitación (beta cerrada)</span>
          <input value={invite} onChange={(e) => setInvite(e.target.value)} autoCapitalize="none" spellCheck={false} />
        </label>
      )}

      <button className="btn btn-primary" type="submit" disabled={busy}>
        {busy ? 'Un momento…' : mode === 'register' ? 'Crear mi cuenta' : 'Entrar'}
      </button>
      {error && (
        <div className="notice" role="alert">
          {error}
        </div>
      )}
      <p className="fineprint" style={{ margin: 0 }}>
        Beta con datos de prueba: usa una cuenta de Google de prueba, no la tuya real. Puedes borrar tu cuenta cuando quieras.
      </p>
    </form>
  );
}
