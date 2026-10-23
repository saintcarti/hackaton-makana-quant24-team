import { useCallback, useEffect, useState } from 'react';
import Chat from './components/Chat';
import DemoPanel from './components/DemoPanel';
import Login from './components/Login';
import { History, NextUp } from './components/NextUp';
import WeekCalendar, { type GoogleState } from './components/WeekCalendar';
import { useMessages } from './hooks/useMessages';
import { api, ApiError } from './lib/api';
import type { AppointmentView, CalendarWeek, Summary, User } from './lib/api-types';
import { addDaysISO } from './lib/format';
import {
  fetchEvents,
  googleClientId,
  signInWithGoogle,
  signOutGoogle,
  type CalendarEvent,
  type GoogleSession,
} from './lib/google';

const TELEGRAM_BOT = (import.meta.env.VITE_TELEGRAM_BOT as string | undefined) || undefined;
const SESSION_KEY = 'lacita.session';

function readDemoFlag() {
  try {
    return sessionStorage.getItem(SESSION_KEY) === 'demo';
  } catch {
    return false;
  }
}

function writeDemoFlag(on: boolean) {
  try {
    if (on) sessionStorage.setItem(SESSION_KEY, 'demo');
    else sessionStorage.removeItem(SESSION_KEY);
  } catch {
    /* sin almacenamiento: la sesión dura lo que dure la pestaña */
  }
}

export default function App() {
  const [entered, setEntered] = useState(readDemoFlag);
  const [google, setGoogle] = useState<GoogleSession | null>(null);

  const [userId, setUserId] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [now, setNow] = useState<string | null>(null);
  const [simulated, setSimulated] = useState(false);

  const [weekOf, setWeekOf] = useState<string | null>(null);
  const [cal, setCal] = useState<CalendarWeek | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [appts, setAppts] = useState<AppointmentView[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [gState, setGState] = useState<GoogleState>('off');
  const [gNote, setGNote] = useState<string | null>(null);

  const [toast, setToast] = useState<string | null>(null);
  const { messages, merge, reset: resetChat, error: chatError } = useMessages(userId);

  const bump = useCallback(() => setRefreshKey((k) => k + 1), []);
  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast((t) => (t === msg ? null : t)), 3800);
  }, []);

  // Al entrar: quién es la usuaria demo y qué conversaciones existen (simulador + Telegram).
  useEffect(() => {
    if (!entered) return;
    let alive = true;
    (async () => {
      try {
        const [meta, list] = await Promise.all([api.meta(), api.users()]);
        if (!alive) return;
        setUserId((cur) => cur ?? meta.demoUserId);
        setUsers(list.users);
        setNow(meta.now);
        setSimulated(meta.clockSimulated);
      } catch (e) {
        if (alive) showToast(e instanceof Error ? e.message : 'Sin conexión con la API.');
      }
    })();
    return () => {
      alive = false;
    };
  }, [entered, refreshKey, showToast]);

  // Datos de la vista: semana, resumen e historial. Se refrescan con cada mensaje o acción de demo.
  useEffect(() => {
    if (!userId) return;
    let alive = true;
    (async () => {
      try {
        const [s, a, meta] = await Promise.all([api.summary(userId), api.appointments(userId), api.meta()]);
        // Sin semana elegida, la grilla sigue a la próxima cita (el domingo, eso es la semana que viene).
        const c = await api.calendar(userId, weekOf ?? s.nextAppointment?.weekOf ?? undefined);
        if (!alive) return;
        setCal(c);
        setSummary(s);
        setAppts(a.appointments);
        setNow(meta.now);
        setSimulated(meta.clockSimulated);
      } catch (e) {
        if (alive && !(e instanceof ApiError && e.status === 0)) {
          showToast(e instanceof Error ? e.message : 'No se pudo cargar tu semana.');
        }
      }
    })();
    return () => {
      alive = false;
    };
  }, [userId, weekOf, refreshKey, messages.length, showToast]);

  // Calendario de Google de la semana visible, leído en el navegador.
  useEffect(() => {
    if (!google || !cal || !userId) return;
    let alive = true;
    setGState('loading');
    const from = new Date(`${addDaysISO(cal.weekOf, -1)}T00:00:00`);
    const to = new Date(`${addDaysISO(cal.weekOf, 8)}T00:00:00`);
    fetchEvents(google, from, to)
      .then((evs) => {
        if (!alive) return;
        setEvents(evs);
        setGState('on');
        setGNote(evs.length ? null : 'Sin eventos en Google esta semana');
        // Entrega la disponibilidad al agente. Si el backend aún no tiene el endpoint, no se rompe nada.
        api
          .syncBusy(
            userId,
            cal.weekOf,
            evs.filter((e) => !e.allDay).map((e) => ({ start: e.start.toISOString(), end: e.end.toISOString() })),
          )
          .catch(() => undefined);
      })
      .catch((e) => {
        if (!alive) return;
        setGState('error');
        setGNote(e instanceof Error ? e.message : 'No pudimos leer Google Calendar.');
      });
    return () => {
      alive = false;
    };
  }, [google, cal?.weekOf, userId]);

  async function connectGoogle() {
    const g = await signInWithGoogle();
    setGoogle(g);
    setEntered(true);
  }

  async function connectFromCalendar() {
    try {
      await connectGoogle();
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'No pudimos conectar Google.');
    }
  }

  function enterDemo() {
    writeDemoFlag(true);
    setEntered(true);
  }

  function signOut() {
    signOutGoogle(google);
    setGoogle(null);
    setEvents([]);
    setGState('off');
    writeDemoFlag(false);
    setEntered(false);
  }

  if (!entered) {
    return <Login onGoogle={connectGoogle} onDemo={enterDemo} telegramBot={TELEGRAM_BOT} />;
  }

  const current = users.find((u) => u.id === userId) ?? null;
  const chatUsers = users.filter((u) => u.synthetic || u.channel.type === 'telegram');

  return (
    <>
      <header className="topbar">
        <span className="brand">La Cita</span>
        {current?.synthetic && <span className="chip hide-sm">Datos de {current.name} sintética</span>}
        <span className="spacer" />
        <div className="who">
          {google?.picture ? (
            <img src={google.picture} alt="" referrerPolicy="no-referrer" />
          ) : (
            <span className="initial" aria-hidden="true">
              {(google?.name ?? current?.name ?? 'C').charAt(0)}
            </span>
          )}
          <span className="hide-sm">{google?.name ?? current?.name ?? 'Camila'}</span>
        </div>
        <button className="btn btn-quiet btn-sm" onClick={signOut}>
          Salir
        </button>
      </header>

      <div className="layout">
        <div className="main-col">
          <NextUp summary={summary} synthetic={!!current?.synthetic} />
          <WeekCalendar
            cal={cal}
            events={events}
            now={now}
            window={current?.window ?? null}
            google={gState}
            googleNote={gNote}
            canConnect={!!googleClientId}
            onConnect={connectFromCalendar}
            onPrev={() => cal && setWeekOf(addDaysISO(cal.weekOf, -7))}
            onNext={() => cal && setWeekOf(addDaysISO(cal.weekOf, 7))}
            onToday={() => setWeekOf(null)}
            isCurrentWeek={weekOf === null || weekOf === summary?.nextAppointment?.weekOf}
          />
          {userId && (
            <DemoPanel
              userId={userId}
              now={now}
              simulated={simulated}
              onDone={(opts) => {
                if (opts?.resetChat) resetChat();
                if (opts?.followClock) setWeekOf(null);
                bump();
              }}
              onError={showToast}
              onInfo={showToast}
            />
          )}
          <History items={appts} />
        </div>

        <aside className="side-col">
          {userId && (
            <Chat
              userId={userId}
              users={chatUsers}
              onUserChange={(id) => {
                setUserId(id);
                setWeekOf(null);
              }}
              messages={messages}
              merge={merge}
              error={chatError}
              onActivity={bump}
              onError={showToast}
              telegramBot={TELEGRAM_BOT}
            />
          )}
        </aside>
      </div>

      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}
    </>
  );
}
