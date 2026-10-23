import { FormEvent, MouseEvent, useRef, useState } from 'react';
import {
  api,
  apiBaseOverride,
  defaultApiBase,
  getAdminToken,
  setAdminToken,
  setApiBaseOverride,
} from '../lib/api';
import { capitalize, fmtDay, fmtTime } from '../lib/format';

interface Props {
  userId: string;
  targetLabel: string;
  now: string | null;
  simulated: boolean;
  onDone: (opts?: { resetChat?: boolean; followClock?: boolean }) => void;
  onError: (msg: string) => void;
  onInfo: (msg: string) => void;
}

interface Step {
  n: string;
  label: string;
  detail: string;
  run: () => Promise<unknown>;
  resetChat?: boolean;
}

// Tras terminar una acción, los botones siguen bloqueados un momento: un doble clic correría el paso dos veces
// (en «Lunes 18:30» eso salta el reloj a la semana siguiente y rompe el resto del guion).
const COOLDOWN_MS = 700;

export default function DemoPanel({ userId, targetLabel, now, simulated, onDone, onError, onInfo }: Props) {
  const [running, setRunning] = useState<string | null>(null);
  const runningRef = useRef(false);
  const [open, setOpen] = useState(true);
  const [token, setToken] = useState(getAdminToken());
  const [apiDraft, setApiDraft] = useState(apiBaseOverride());

  async function guarded(id: string, e: MouseEvent, fn: () => Promise<unknown>, opts?: { resetChat?: boolean }) {
    if (e.detail > 1 || runningRef.current) return;
    runningRef.current = true;
    setRunning(id);
    try {
      await fn();
      onDone({ resetChat: opts?.resetChat, followClock: true });
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Algo no respondió.');
    } finally {
      window.setTimeout(() => {
        runningRef.current = false;
        setRunning(null);
      }, COOLDOWN_MS);
    }
  }

  const steps: Step[] = [
    {
      n: '0',
      label: 'Preparar a Camila',
      detail: 'Borra todo y carga 6 semanas de historial sintético.',
      run: () => api.reset(),
      resetChat: true,
    },
    {
      n: '1',
      label: 'Domingo 20:00',
      detail: 'Llega la pregunta: dos horarios, otra hora o esta semana no.',
      run: async () => {
        await api.clock({ preset: 'sunday-20' });
        return api.action(userId, 'weekly-capture');
      },
    },
    {
      n: '1b',
      label: 'Si no responde',
      detail: 'El silencio también agenda: queda su horario de siempre.',
      run: () => api.action(userId, 'default'),
    },
    {
      n: '2',
      label: 'Lunes 18:30',
      detail: 'Un solo recordatorio antes de la cita.',
      run: async () => {
        await api.clock({ preset: 'monday-1830' });
        return api.action(userId, 'reminder');
      },
    },
    {
      n: '3',
      label: '«Hoy no puedo»',
      detail: 'Se alarga la reunión: la cita se mueve, no se borra.',
      run: () => api.send(userId, { text: 'hoy no puedo, se alargó la reunión' }),
    },
    {
      n: '3b',
      label: '«Me duele la espalda»',
      detail: 'R4: no receta ejercicio, deriva a kinesiólogo. La cita queda.',
      run: () => api.send(userId, { text: 'y ahora que lo pienso, me duele la espalda' }),
    },
    {
      n: '4',
      label: '«Listo»',
      detail: 'Termina la cita y fue: la mensualidad ya pagada pasa a ser uso.',
      run: async () => {
        // «Listo» aplica a la cita del día: primero el reloj llega al final de la próxima cita.
        const s = await api.summary(userId);
        const next = s.nextAppointment;
        if (next?.startsAt) {
          const end = new Date(new Date(next.startsAt).getTime() + (next.durationMin + 5) * 60_000);
          await api.clock({ now: end.toISOString() });
        }
        return api.send(userId, { action: 'done', label: 'Listo' });
      },
    },
  ];

  function saveApi(e: FormEvent) {
    e.preventDefault();
    if (!setApiBaseOverride(apiDraft)) {
      onError('Esa URL no sirve: usa algo como https://la-cita-api.vercel.app');
      return;
    }
    // Recarga para que todo (chat, semana, usuarias) se lea desde la nueva API.
    window.location.reload();
  }

  return (
    <section className="panel demo" aria-label="Panel de demo">
      <div className="panel-head">
        <h2 className="display" style={{ fontSize: '1.25rem' }}>
          Panel de demo
        </h2>
        {now && (
          <span className={`chip${simulated ? ' chip-accent' : ''}`}>
            {simulated ? 'Reloj simulado' : 'Hora real'} · {capitalize(fmtDay(now))}, {fmtTime(now)}
          </span>
        )}
        <div className="spacer" />
        <button className="btn btn-quiet btn-sm" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
          {open ? 'Ocultar' : 'Mostrar'}
        </button>
      </div>
      {open && (
        <div className="panel-body">
          <p className="small" style={{ margin: '0 0 0.75rem' }}>
            Actúa sobre: <b>{targetLabel}</b>
            <span className="muted"> · se cambia en el selector del chat. «Preparar» reinicia todo.</span>
          </p>
          <div className="demo-steps">
            {steps.map((s) => (
              <button
                key={s.n}
                className="step"
                onClick={(e) => guarded(s.n, e, s.run, { resetChat: s.resetChat })}
                disabled={running !== null}
              >
                <span className="n">{running === s.n ? '…' : s.n}</span>
                <span className="l">{s.label}</span>
                <span className="d">{s.detail}</span>
              </button>
            ))}
          </div>
          <div className="demo-tools">
            <button
              className="btn btn-sm"
              disabled={running !== null}
              onClick={(e) =>
                guarded('advance', e, async () => {
                  await api.clock({ advanceMinutes: 151 });
                  await api.tick();
                })
              }
            >
              Adelantar 2,5 h y correr el reloj
            </button>
            <button
              className="btn btn-sm btn-quiet"
              disabled={running !== null}
              onClick={(e) =>
                guarded('clock-reset', e, async () => {
                  await api.clock({ reset: true });
                  onInfo('Reloj de vuelta a la hora real.');
                })
              }
            >
              Volver a la hora real
            </button>
          </div>
          <form className="demo-tools" onSubmit={saveApi}>
            <label className="small muted" htmlFor="api-base">
              URL de la API
            </label>
            <input
              id="api-base"
              className="wide"
              value={apiDraft}
              placeholder={defaultApiBase}
              onChange={(e) => setApiDraft(e.target.value)}
              inputMode="url"
              autoComplete="off"
            />
            <button className="btn btn-sm" type="submit">
              Usar esta API
            </button>
            <span style={{ flex: 1 }} />
            <label className="small muted" htmlFor="admin-token">
              Token admin
            </label>
            <input
              id="admin-token"
              type="password"
              value={token}
              placeholder="solo si el backend lo pide"
              onChange={(e) => {
                setToken(e.target.value);
                setAdminToken(e.target.value);
              }}
            />
          </form>
        </div>
      )}
    </section>
  );
}
