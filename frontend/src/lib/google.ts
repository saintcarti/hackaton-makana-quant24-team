// Google Identity Services (modelo de token). El token vive solo en memoria:
// el calendario se lee en el navegador y se olvida al cerrar la pestaña (R2).

interface TokenResponse {
  access_token?: string;
  expires_in?: number;
  error?: string;
}

interface GoogleOAuth {
  accounts: {
    oauth2: {
      initTokenClient(config: {
        client_id: string;
        scope: string;
        callback: (r: TokenResponse) => void;
        error_callback?: (e: { type: string }) => void;
      }): { requestAccessToken(opts?: { prompt?: string }): void };
      revoke(token: string, done?: () => void): void;
      hasGrantedAllScopes(r: TokenResponse, ...scopes: string[]): boolean;
    };
  };
}

declare global {
  interface Window {
    google?: GoogleOAuth;
  }
}

const CALENDAR_SCOPE = 'https://www.googleapis.com/auth/calendar.readonly';
const SCOPES = ['openid', 'email', 'profile', CALENDAR_SCOPE].join(' ');

export const googleClientId = (import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined) || '';

let gisPromise: Promise<void> | null = null;

function loadGis(): Promise<void> {
  if (window.google?.accounts?.oauth2) return Promise.resolve();
  if (gisPromise) return gisPromise;
  gisPromise = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client';
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => {
      gisPromise = null;
      reject(new Error('No se pudo cargar Google. Revisa la conexión.'));
    };
    document.head.appendChild(s);
  });
  return gisPromise;
}

/** Precarga GIS para que el clic abra la ventana de Google sin esperar la descarga (si no, el navegador la bloquea). */
export function preloadGoogle() {
  if (googleClientId) loadGis().catch(() => undefined);
}

const POPUP_ERRORS: Record<string, string> = {
  popup_closed: 'Cerraste la ventana de Google.',
  popup_failed_to_open: 'Tu navegador bloqueó la ventana de Google: permite ventanas emergentes y vuelve a intentar.',
};

export interface GoogleSession {
  accessToken: string;
  expiresAt: number;
  name: string;
  email: string;
  picture?: string;
}

export async function signInWithGoogle(): Promise<GoogleSession> {
  if (!googleClientId) throw new Error('Falta VITE_GOOGLE_CLIENT_ID.');
  await loadGis();
  const token = await new Promise<TokenResponse>((resolve, reject) => {
    const oauth = window.google!.accounts.oauth2;
    const client = oauth.initTokenClient({
      client_id: googleClientId,
      scope: SCOPES,
      callback: (r) => {
        if (r.error || !r.access_token) return reject(new Error('Google no entregó el permiso.'));
        if (!oauth.hasGrantedAllScopes(r, CALENDAR_SCOPE)) {
          return reject(new Error('Google no dio permiso para leer tu calendario: vuelve a entrar y marca esa casilla.'));
        }
        resolve(r);
      },
      error_callback: (e) => reject(new Error(POPUP_ERRORS[e.type] ?? 'Google no respondió.')),
    });
    client.requestAccessToken({ prompt: '' });
  });

  const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${token.access_token}` },
  });
  const profile = res.ok ? await res.json() : {};
  return {
    accessToken: token.access_token!,
    expiresAt: Date.now() + (token.expires_in ?? 3600) * 1000,
    name: profile.given_name ?? profile.name ?? 'Tú',
    email: profile.email ?? '',
    picture: profile.picture,
  };
}

export function signOutGoogle(session: GoogleSession | null) {
  if (session && window.google?.accounts?.oauth2) {
    window.google.accounts.oauth2.revoke(session.accessToken);
  }
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay: boolean;
  /** Solo en eventos de día completo: fechas "YYYY-MM-DD" tal como vienen de Google (el fin es exclusivo). */
  allDayStart?: string;
  allDayEnd?: string;
}

export async function fetchEvents(session: GoogleSession, from: Date, to: Date): Promise<CalendarEvent[]> {
  const params = new URLSearchParams({
    timeMin: from.toISOString(),
    timeMax: to.toISOString(),
    singleEvents: 'true',
    orderBy: 'startTime',
    maxResults: '250',
  });
  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`,
    { headers: { Authorization: `Bearer ${session.accessToken}` } },
  );
  if (res.status === 401) throw new Error('La sesión de Google expiró. Vuelve a entrar.');
  if (!res.ok) throw new Error('No pudimos leer tu calendario de Google.');
  const data = await res.json();
  type RawEvent = {
    id: string;
    summary?: string;
    status?: string;
    transparency?: string;
    start: { dateTime?: string; date?: string };
    end: { dateTime?: string; date?: string };
  };
  return ((data.items ?? []) as RawEvent[])
    .filter((e) => e.status !== 'cancelled' && e.transparency !== 'transparent')
    // Las citas que agenda La Cita ya se pintan desde el backend.
    .filter((e) => !(e.summary ?? '').toLowerCase().includes('la cita'))
    .map((e) => ({
      id: e.id,
      title: e.summary ?? 'Ocupado',
      start: new Date(e.start.dateTime ?? `${e.start.date}T00:00:00`),
      end: new Date(e.end.dateTime ?? `${e.end.date}T00:00:00`),
      allDay: !e.start.dateTime,
      allDayStart: e.start.dateTime ? undefined : e.start.date,
      allDayEnd: e.end.dateTime ? undefined : e.end.date,
    }));
}
