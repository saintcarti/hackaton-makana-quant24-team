import { useCallback, useEffect, useRef, useState } from 'react';
import Chat, { userLabel } from './components/Chat';
import DemoPanel from './components/DemoPanel';
import Login from './components/Login';
import NextUp from './components/NextUp';
import SixWeeks from './components/SixWeeks';
import WeekCalendar, { type GoogleState } from './components/WeekCalendar';
import { useMessages } from './hooks/useMessages';
import { api, ApiError, apiPointsToViewerMachine, getApiBase } from './lib/api';
import type { AppointmentView, CalendarWeek, Summary, User } from './lib/api-types';
import { addDaysISO } from './lib/format';
import {
  fetchEvents,
  googleClientId,
  preloadGoogle,
  signInWithGoogle,
  signOutGoogle,
  type CalendarEvent,
  type GoogleSession,
} from './lib/google';

const TELEGRAM_BOT = (import.meta.env.VITE_TELEGRAM_BOT as string | undefined) || undefined;
const SESSION_KEY = 'lacita.session';
const RETRY_MS = 2500;
const USERS_POLL_MS = 10_000;
const CLOCK_TICK_MS = 30_000;

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

  const [demoUserId, setDemoUserId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [now, setNow] = useState<string | null>(null);
  const [simulated, setSimulated] = useState(false);
  const clockOffset = useRef(0);
  const [apiDown, setApiDown] = useState(false);
  const [retry, setRetry] = useState(0);

  const [weekOf, setWeekOf] = useState<string | null>(null);
  const [cal, setCal] = useState<CalendarWeek | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [appts, setAppts] = useState<AppointmentView[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [gState, setGState] = useState<GoogleState>('off');
  const [gNote, setGNote] = useState<string | null>(null);

  const [view, setView] = useState<'camila' | 'equipo'>('camila');
  const [toast, setToast] = useState<string | null>(null);
  const { messages, merge, reset: resetChat, error: chatError, loaded: chatLoaded } = useMessages(userId);

  const bump = useCallback(() => setRefreshKey((k) => k + 1), []);
  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast((t) => (t === msg ? null : t)), 3800);
  }, []);

  /** La hora del backend (real o simulada) avanza sola: se guarda el desfase y se proyecta entre recargas. */
  const applyServerClock = useCallback((iso: string, isSimulated: boolean) => {
    clockOffset.current = Date.parse(iso) - Date.now();
    setNow(iso);
    setSimulated(isSimulated);
  }, []);

  /** Lista de usuarias + reconciliación: si la seleccionada ya no existe (p. ej. tras un reset), vuelve a la demo. */
  const syncUsers = useCallback((list: User[], demoId: string) => {
    setUsers(list);
    setUserId((cur) => (cur && list.some((u) => u.id === cur) ? cur : demoId));
  }, []);

  useEffect(preloadGoogle, []);

  // Al entrar: usuaria demo, conversaciones (simulador + Telegram) y reloj. Si la API no responde, reintenta sola.
  useEffect(() => {
    if (!entered) return;
    let alive = true;
    let timer: number | undefined;
    (async () => {
      try {
        const [meta, list] = await Promise.all([api.meta(), api.users()]);
        if (!alive) return;
        setDemoUserId(meta.demoUserId);
        syncUsers(list.users, meta.demoUserId);
        applyServerClock(meta.now, meta.clockSimulated);
        setApiDown(false);
      } catch {
        if (!alive) return;
        setApiDown(true);
        timer = window.setTimeout(() => setRetry((r) => r + 1), RETRY_MS);
      }
    })();
    return () => {
      alive = false;
      if (timer) window.clearTimeout(timer);
    };
  }, [entered, refreshKey, retry, syncUsers, applyServerClock]);

  // Quien le escribe al bot crea una usuaria tg_<chatId>: la lista se refresca sola para que aparezca en el selector.
  useEffect(() => {
    if (!entered || !demoUserId) return;
    const t = window.setInterval(() => {
      api
        .users()
        .then((l) => syncUsers(l.users, demoUserId))
        .catch(() => undefined);
    }, USERS_POLL_MS);
    return () => window.clearInterval(t);
  }, [entered, demoUserId, syncUsers]);

  // Línea de «ahora» y reloj del panel: avanzan entre recargas con el desfase del backend.
  useEffect(() => {
    if (!entered) return;
    const t = window.setInterval(() => {
      setNow((cur) => (cur ? new Date(Date.now() + clockOffset.current).toISOString() : cur));
    }, CLOCK_TICK_MS);
    return () => window.clearInterval(t);
  }, [entered]);

  // Cuando el chat vuelve a conectar después de una caída, todo se recarga.
  const prevChatError = useRef<string | null>(null);
  useEffect(() => {
    if (prevChatError.current && !chatError) bump();
    prevChatError.current = chatError;
  }, [chatError, bump]);

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
        applyServerClock(meta.now, meta.clockSimulated);
      } catch (e) {
        if (!alive) return;
        // Una usuaria que el reset borró responde 404: la reconciliación de usuarias la saca; no hace falta avisar.
        if (e instanceof ApiError && (e.status === 0 || e.status === 404)) return;
        showToast(e instanceof Error ? e.message : 'No se pudo cargar tu semana.');
      }
    })();
    return () => {
      alive = false;
    };
  }, [userId, weekOf, refreshKey, messages.length, showToast, applyServerClock]);

  const isDemoUser = userId !== null && userId === demoUserId;

  // Calendario de Google de la semana visible, leído en el navegador. Solo aplica a la usuaria demo (la de la sesión).
  useEffect(() => {
    if (!google || !cal || !userId || !isDemoUser) return;
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
        // Entrega al agente solo las horas ocupadas (sin títulos). Si el backend aún no tiene el endpoint, no pasa nada.
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
        setEvents([]);
        setGState('error');
        setGNote(e instanceof Error ? e.message : 'No pudimos leer Google Calendar.');
      });
    return () => {
      alive = false;
    };
  }, [google, cal?.weekOf, userId, isDemoUser]);

  async function connectGoogle() {
    const g = await signInWithGoogle();
    setGoogle(g);
    setGNote(null);
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
    setGNote(null);
    // Sin usuaria seleccionada se detiene el polling del chat y la próxima entrada parte de cero.
    setUserId(null);
    setDemoUserId(null);
    setUsers([]);
    setCal(null);
    setSummary(null);
    setAppts([]);
    setWeekOf(null);
    setView('camila');
    writeDemoFlag(false);
    setEntered(false);
  }

  if (!entered) {
    return <Login onGoogle={connectGoogle} onDemo={enterDemo} telegramBot={TELEGRAM_BOT} />;
  }

  const current = users.find((u) => u.id === userId) ?? null;
  const chatUsers = users.filter((u) => u.synthetic || u.channel.type === 'telegram');
  const offline = apiDown || !!chatError;

  return (
    <>
      <header className="topbar">
        <span className="brand">La Cita</span>
        <div className="seg" role="group" aria-label="Vista">
          <button aria-pressed={view === 'camila'} onClick={() => setView('camila')}>
            <span className="hide-sm">Lo que ve Camila</span>
            <span className="show-sm">Camila</span>
          </button>
          <button aria-pressed={view === 'equipo'} onClick={() => setView('equipo')}>
            <span className="hide-sm">Lo que ve el equipo</span>
            <span className="show-sm">Equipo</span>
          </button>
        </div>
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

      {offline && (
        <div className="banner" role="alert">
          {apiPointsToViewerMachine() ? (
            <>
              Esta web busca la API en <code>{getApiBase()}</code>, o sea en este mismo computador, y no responde.
              Levanta el backend acá o pon la URL publicada en <b>Lo que ve el equipo → URL de la API</b>.
            </>
          ) : (
            <>
              No hay conexión con la API (<code>{getApiBase()}</code>). Reintentando sola cada pocos segundos.
            </>
          )}
        </div>
      )}

      <div className="layout">
        <div className="main-col">
          {view === 'camila' && <NextUp summary={summary} appts={appts} now={now} synthetic={!!current?.synthetic} />}
          {view === 'equipo' && userId && (
            <DemoPanel
              userId={userId}
              targetLabel={current ? userLabel(current) : userId}
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
          <WeekCalendar
            cal={cal}
            events={isDemoUser ? events : []}
            now={now}
            window={current?.window ?? null}
            google={isDemoUser ? gState : 'off'}
            googleNote={isDemoUser ? gNote : null}
            canConnect={!!googleClientId && isDemoUser}
            onConnect={connectFromCalendar}
            onPrev={() => cal && setWeekOf(addDaysISO(cal.weekOf, -7))}
            onNext={() => cal && setWeekOf(addDaysISO(cal.weekOf, 7))}
            onToday={() => setWeekOf(null)}
            isCurrentWeek={weekOf === null || weekOf === summary?.nextAppointment?.weekOf}
          />
          {view === 'equipo' && <SixWeeks appts={appts} now={now} />}
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
              loaded={chatLoaded}
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
