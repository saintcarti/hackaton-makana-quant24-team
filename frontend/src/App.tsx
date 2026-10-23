import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ApiUrlForm from './components/ApiUrlForm';
import Chat, { userLabel } from './components/Chat';
import DemoPanel from './components/DemoPanel';
import Login from './components/Login';
import NextUp from './components/NextUp';
import SessionSetup from './components/SessionSetup';
import SixWeeks from './components/SixWeeks';
import WeekCalendar, { type GoogleState, type Suggestion } from './components/WeekCalendar';
import { useMessages } from './hooks/useMessages';
import { api, ApiError, apiPointsToViewerMachine, getApiBase } from './lib/api';
import type { AppointmentView, CalendarWeek, Summary, User } from './lib/api-types';
import { toSegments } from './lib/calendar';
import { fitWeek, pickSuggestions, type TakenInterval } from './lib/fit';
import { addDaysISO, santiagoParts } from './lib/format';
import {
  fetchEvents,
  googleClientId,
  preloadGoogle,
  signInWithGoogle,
  signOutGoogle,
  type CalendarEvent,
  type GoogleSession,
} from './lib/google';
import { loadPrefs, savePrefsLocal, type SessionPrefs } from './lib/prefs';
import { SAMPLE_LABEL, sampleWorkWeek } from './lib/sampleCalendar';

const TELEGRAM_BOT = (import.meta.env.VITE_TELEGRAM_BOT as string | undefined) || undefined;
const SESSION_KEY = 'lacita.session';
const SAMPLE_KEY = 'lacita.sampleCalendar';

function readSampleFlag() {
  try {
    return localStorage.getItem(SAMPLE_KEY) === '1';
  } catch {
    return false;
  }
}
const RETRY_MS = 2500;
const DATA_RETRY_MS = 3000;
const USERS_POLL_MS = 10_000;
const CLOCK_TICK_MS = 30_000;
const ACTIVE_STATUSES = new Set(['proposed', 'confirmed', 'reminded', 'done']);
const LOCAL_PREFS_NOTE = 'El agente todavía no usa estas reglas: quedan en este navegador hasta que el backend las reciba.';

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

/** Sin conexión de verdad: red caída o el servidor falló. Un 404 (usuaria inexistente) es otra cosa. */
const isOffline = (status: number | null) => status !== null && (status === 0 || status >= 500);

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
  const [sampleOn, setSampleOn] = useState(readSampleFlag);

  const [prefsVersion, setPrefsVersion] = useState(0);
  const [prefsNote, setPrefsNote] = useState<string | null>(null);
  const [preparing, setPreparing] = useState(false);

  const [view, setView] = useState<'camila' | 'equipo'>('camila');
  const [toast, setToast] = useState<string | null>(null);
  const {
    messages,
    merge,
    reset: resetChat,
    error: chatError,
    errorStatus: chatErrorStatus,
    loaded: chatLoaded,
  } = useMessages(userId);

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
    let alive = true;
    const t = window.setInterval(() => {
      api
        .users()
        .then((l) => {
          // Una respuesta que llega después de «Salir» no debe volver a seleccionar a nadie.
          if (alive) syncUsers(l.users, demoUserId);
        })
        .catch(() => undefined);
    }, USERS_POLL_MS);
    return () => {
      alive = false;
      window.clearInterval(t);
    };
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
    let retryTimer: number | undefined;
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
        // Una usuaria que el reset borró responde 404: la reconciliación la saca o el aviso pide prepararla.
        if (e instanceof ApiError && e.status === 404) return;
        if (e instanceof ApiError && isOffline(e.status)) {
          retryTimer = window.setTimeout(() => setRefreshKey((k) => k + 1), DATA_RETRY_MS);
          return;
        }
        showToast(e instanceof Error ? e.message : 'No se pudo cargar tu semana.');
      }
    })();
    return () => {
      alive = false;
      if (retryTimer) window.clearTimeout(retryTimer);
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

  // Plan B sin Google ni red (R6): la semana de ejemplo de Camila sintética, rotulada como inventada.
  const sampleActive = sampleOn && !google && isDemoUser;
  useEffect(() => {
    if (google || !cal || !userId || !isDemoUser) return;
    if (!sampleOn) {
      setEvents([]);
      return;
    }
    const evs = sampleWorkWeek(cal.weekOf);
    setEvents(evs);
    api
      .syncBusy(
        userId,
        cal.weekOf,
        evs.map((e) => ({ start: e.start.toISOString(), end: e.end.toISOString() })),
      )
      .catch(() => undefined);
  }, [google, sampleOn, cal?.weekOf, userId, isDemoUser]);

  function toggleSample() {
    setSampleOn((on) => {
      const next = !on;
      try {
        if (next) localStorage.setItem(SAMPLE_KEY, '1');
        else localStorage.removeItem(SAMPLE_KEY);
      } catch {
        /* sin almacenamiento: vale solo para esta pestaña */
      }
      return next;
    });
  }

  const current = users.find((u) => u.id === userId) ?? null;
  const busyLabel = isDemoUser && gState === 'on' ? 'Tu calendario de Google' : sampleActive ? SAMPLE_LABEL : null;

  // ── Sesión que cabe ──────────────────────────────────────────────────────────
  // La lista de usuarias se refresca cada 10 s con objetos nuevos: se recalcula solo si cambió el contenido.
  const currentSignature = current ? JSON.stringify(current) : '';
  const prefsState = useMemo(
    () => (isDemoUser && current ? loadPrefs(current) : null),
    [isDemoUser, currentSignature, prefsVersion],
  );
  const segments = useMemo(
    () => (cal && isDemoUser ? toSegments(events, cal.days) : []),
    [events, cal, isDemoUser],
  );
  const fitEntries = useMemo(() => {
    if (!cal || !prefsState) return [];
    const taken: TakenInterval[] = cal.blocks
      .filter((b) => ACTIVE_STATUSES.has(b.status))
      .map((b) => ({ dayIndex: b.dayIndex, startMin: b.startMinutes, endMin: b.startMinutes + b.durationMin }));
    const nowParts = now ? santiagoParts(new Date(now)) : null;
    const entries = fitWeek({
      days: cal.days,
      prefs: prefsState.prefs,
      busy: segments,
      taken,
      now: nowParts,
      preferredTime: current?.preferredTime,
    });
    return pickSuggestions(entries, prefsState.prefs.perWeek);
  }, [cal, prefsState, segments, now, current?.preferredTime]);
  const suggestions: Suggestion[] = prefsState
    ? fitEntries
        .filter((e) => e.suggested && e.slot)
        .map((e) => ({
          key: `s-${e.date}`,
          dayIndex: e.dayIndex,
          startMin: e.slot!.startMin,
          endMin: e.slot!.endMin,
          label: `Cabe ${prefsState.prefs.sessionMin}'`,
        }))
    : [];

  async function savePrefs(p: SessionPrefs) {
    if (!userId) return;
    try {
      const r = await api.savePrefs(userId, p);
      // El backend devuelve la usuaria con sus reglas: desde ahora es la fuente de verdad.
      setUsers((list) => list.map((u) => (u.id === r.user.id ? r.user : u)));
      savePrefsLocal(userId, p);
      setPrefsNote(null);
      bump();
    } catch (e) {
      const stored = savePrefsLocal(userId, p);
      if (e instanceof ApiError && (e.status === 404 || e.status === 405)) setPrefsNote(LOCAL_PREFS_NOTE);
      else setPrefsNote(stored ? 'No pudimos guardarlas en La Cita; quedaron en este navegador.' : 'No pudimos guardar tus reglas.');
    }
    setPrefsVersion((v) => v + 1);
  }

  async function prepareCamila() {
    if (preparing) return;
    setPreparing(true);
    try {
      await api.reset();
      resetChat();
      setWeekOf(null);
      bump();
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'No se pudo preparar a Camila.');
    } finally {
      setPreparing(false);
    }
  }

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
    setPrefsNote(null);
    writeDemoFlag(false);
    setEntered(false);
  }

  if (!entered) {
    return <Login onGoogle={connectGoogle} onDemo={enterDemo} telegramBot={TELEGRAM_BOT} />;
  }

  const chatUsers = users.filter((u) => u.synthetic || u.channel.type === 'telegram');
  const offline = apiDown || isOffline(chatErrorStatus);
  const notPrepared = !offline && chatErrorStatus === 404;
  const isCurrentWeek = weekOf === null || weekOf === summary?.nextAppointment?.weekOf;
  const weekTitle = !cal ? '' : isCurrentWeek ? 'esta semana' : `semana del ${Number(cal.weekOf.slice(8))}`;
  const shownNote = prefsNote ?? (prefsState?.source === 'local' ? LOCAL_PREFS_NOTE : null);

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
          <p style={{ margin: 0 }}>
            {apiPointsToViewerMachine() ? (
              <>
                Esta web busca la API en <code>{getApiBase()}</code>, o sea en este mismo computador, y no responde.
                Levanta el backend acá o pega la URL publicada:
              </>
            ) : (
              <>
                No hay conexión con la API (<code>{getApiBase()}</code>). Reintentando sola; si cambió de lugar, pega
                la URL nueva:
              </>
            )}
          </p>
          <ApiUrlForm id="api-base-banner" />
        </div>
      )}
      {notPrepared && (
        <div className="banner" role="alert">
          <p style={{ margin: 0 }}>
            Camila sintética no está cargada en esta API (por ejemplo, porque el backend recién partió).
          </p>
          <div className="demo-tools">
            <button className="btn btn-sm btn-primary" onClick={prepareCamila} disabled={preparing}>
              {preparing ? 'Preparando…' : 'Preparar a Camila'}
            </button>
            <span className="small">Es el mismo paso «0» del panel del equipo.</span>
          </div>
        </div>
      )}

      <div className="layout">
        <div className="main-col">
          {view === 'camila' && <NextUp summary={summary} appts={appts} now={now} synthetic={!!current?.synthetic} />}
          {view === 'camila' && prefsState && cal && (
            <SessionSetup
              key={userId ?? 'none'}
              prefs={prefsState.prefs}
              source={prefsState.source}
              entries={fitEntries}
              weekTitle={weekTitle}
              calendarPhrase={
                isDemoUser && gState === 'on'
                  ? 'tu calendario de Google'
                  : sampleActive
                    ? 'el calendario de ejemplo de Camila (inventado)'
                    : null
              }
              saveNote={shownNote}
              onSave={savePrefs}
            />
          )}
          {view === 'equipo' && userId && (
            <DemoPanel
              userId={userId}
              targetLabel={current ? userLabel(current) : userId}
              now={now}
              simulated={simulated}
              sampleOn={sampleOn}
              googleConnected={!!google}
              onToggleSample={toggleSample}
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
            segments={isDemoUser ? segments : []}
            now={now}
            window={view === 'camila' && prefsState ? prefsState.prefs.window : current?.window ?? null}
            gymHours={view === 'camila' && prefsState ? prefsState.prefs.gymHours : null}
            suggestions={view === 'camila' ? suggestions : []}
            busyLabel={busyLabel}
            google={isDemoUser ? gState : 'off'}
            googleNote={isDemoUser ? gNote : null}
            canConnect={!!googleClientId && isDemoUser}
            onConnect={connectFromCalendar}
            onPrev={() => cal && setWeekOf(addDaysISO(cal.weekOf, -7))}
            onNext={() => cal && setWeekOf(addDaysISO(cal.weekOf, 7))}
            onToday={() => setWeekOf(null)}
            isCurrentWeek={isCurrentWeek}
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
