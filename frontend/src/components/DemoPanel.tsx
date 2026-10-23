import { useState } from 'react';
import { api, getAdminToken, setAdminToken } from '../lib/api';
import { fmtDay, fmtTime, capitalize } from '../lib/format';

interface Props {
  userId: string;
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

export default function DemoPanel({ userId, now, simulated, onDone, onError, onInfo }: Props) {
  const [running, setRunning] = useState<string | null>(null);
  const [open, setOpen] = useState(true);
  const [token, setToken] = useState(getAdminToken());

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
      detail: 'Termina la cita y fue. La mensualidad deja de ser culpa y pasa a ser uso.',
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

  async function run(step: Step) {
    setRunning(step.n);
    try {
      await step.run();
      onDone({ resetChat: step.resetChat, followClock: true });
    } catch (e) {
      onError(e instanceof Error ? e.message : 'Algo no respondió.');
    } finally {
      setRunning(null);
    }
  }

  async function clockReset() {
    try {
      await api.clock({ reset: true });
      onDone({ followClock: true });
      onInfo('Reloj de vuelta a la hora real.');
    } catch (e) {
      onError(e instanceof Error ? e.message : 'No se pudo.');
    }
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
          <div className="demo-steps">
            {steps.map((s) => (
              <button key={s.n} className="step" onClick={() => run(s)} disabled={running !== null}>
                <span className="n">{running === s.n ? '…' : s.n}</span>
                <span className="l">{s.label}</span>
                <span className="d">{s.detail}</span>
              </button>
            ))}
          </div>
          <div className="demo-tools">
            <button
              className="btn btn-sm"
              onClick={async () => {
                try {
                  await api.clock({ advanceMinutes: 151 });
                  await api.tick();
                  onDone({ followClock: true });
                } catch (e) {
                  onError(e instanceof Error ? e.message : 'No se pudo.');
                }
              }}
            >
              Adelantar 2,5 h y correr el reloj
            </button>
            <button className="btn btn-sm btn-quiet" onClick={clockReset}>
              Volver a la hora real
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
          </div>
        </div>
      )}
    </section>
  );
}
