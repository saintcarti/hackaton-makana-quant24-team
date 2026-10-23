import { FormEvent, useState } from 'react';
import { apiBaseOverride, defaultApiBase, normalizeApiBase, setApiBaseOverride } from '../lib/api';

/** URL de la API sin redesplegar. Vive en el panel del equipo y también en el aviso de «sin conexión». */
export default function ApiUrlForm({ id = 'api-base' }: { id?: string }) {
  const [draft, setDraft] = useState(apiBaseOverride());
  const [error, setError] = useState<string | null>(null);
  const override = apiBaseOverride();

  function save(e: FormEvent) {
    e.preventDefault();
    const normalized = normalizeApiBase(draft);
    if (normalized === null) {
      setError('Esa URL no sirve: usa algo como https://la-cita-api.vercel.app');
      return;
    }
    if (normalized === override) return;
    if (!setApiBaseOverride(normalized)) {
      setError('Este navegador no deja guardar la URL.');
      return;
    }
    // Recarga para que todo (chat, semana, usuarias) se lea desde la nueva API.
    window.location.reload();
  }

  function useBuildDefault() {
    if (!override) return;
    setApiBaseOverride('');
    window.location.reload();
  }

  return (
    <form className="demo-tools api-form" onSubmit={save}>
      <label className="small muted" htmlFor={id}>
        URL de la API
      </label>
      <input
        id={id}
        className="wide"
        value={draft}
        placeholder={defaultApiBase}
        onChange={(e) => {
          setDraft(e.target.value);
          setError(null);
        }}
        inputMode="url"
        autoComplete="off"
        spellCheck={false}
      />
      <button className="btn btn-sm" type="submit">
        Usar esta API
      </button>
      {override && (
        <button className="btn btn-sm btn-quiet" type="button" onClick={useBuildDefault}>
          Volver a la del build
        </button>
      )}
      {error && (
        <span className="small" role="alert">
          {error}
        </span>
      )}
    </form>
  );
}
