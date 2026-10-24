import { apptDescription } from './ics.js';
import { TZ } from './time.js';
import { Appointment, GoogleLink, User } from './types.js';

/** Cliente mínimo de Google OAuth + Calendar. Solo `fetch` y Web Crypto: corre igual en Node y en Workers. */
export interface GoogleConfig {
  clientId: string;
  clientSecret: string;
  /** URL pública del backend, sin barra final: `${publicUrl}/api/google/callback` es la URI de redirección. */
  publicUrl: string;
}

export const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/calendar.freebusy',
];

const CAL = 'https://www.googleapis.com/calendar/v3';
export const redirectUri = (cfg: GoogleConfig) => `${cfg.publicUrl}/api/google/callback`;

export function googleConfigFromEnv(env: Record<string, string | undefined>): GoogleConfig | null {
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET || !env.PUBLIC_URL) return null;
  return { clientId: env.GOOGLE_CLIENT_ID, clientSecret: env.GOOGLE_CLIENT_SECRET, publicUrl: env.PUBLIC_URL.replace(/\/$/, '') };
}

// ───────────── state firmado (anti-CSRF y vincula el callback con la usuaria) ─────────────

const enc = new TextEncoder();
const hex = (buf: ArrayBuffer) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');

async function hmac(secret: string, data: string) {
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return hex(await crypto.subtle.sign('HMAC', key, enc.encode(data)));
}

const b64 = (s: string) => btoa(unescape(encodeURIComponent(s))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const unb64 = (s: string) => decodeURIComponent(escape(atob(s.replace(/-/g, '+').replace(/_/g, '/'))));

export async function signState(secret: string, userId: string, ttlMs = 15 * 60_000, now = Date.now()): Promise<string> {
  const payload = `${userId}|${now + ttlMs}`;
  return `${b64(payload)}.${await hmac(secret, payload)}`;
}

/** Devuelve el userId si la firma es válida y no venció; null si no. */
export async function verifyState(secret: string, state: string, now = Date.now()): Promise<string | null> {
  const [p, sig] = state.split('.');
  if (!p || !sig) return null;
  let payload: string;
  try {
    payload = unb64(p);
  } catch {
    return null;
  }
  const expected = await hmac(secret, payload);
  if (expected.length !== sig.length) return null;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ sig.charCodeAt(i);
  if (diff !== 0) return null;
  const [userId, exp] = payload.split('|');
  return userId && Number(exp) > now ? userId : null;
}

export function authUrl(cfg: GoogleConfig, state: string): string {
  const q = new URLSearchParams({
    client_id: cfg.clientId,
    redirect_uri: redirectUri(cfg),
    response_type: 'code',
    scope: GOOGLE_SCOPES.join(' '),
    access_type: 'offline',
    prompt: 'consent',
    include_granted_scopes: 'true',
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${q.toString()}`;
}

// ───────────── tokens ─────────────

async function tokenRequest(params: Record<string, string>) {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(params).toString(),
  });
  const json = (await res.json()) as { access_token?: string; refresh_token?: string; expires_in?: number; error?: string; error_description?: string };
  if (!res.ok || !json.access_token) throw new Error(`Google token: ${json.error ?? res.status} ${json.error_description ?? ''}`.trim());
  return json;
}

export async function exchangeCode(cfg: GoogleConfig, code: string, now = Date.now()): Promise<GoogleLink> {
  const t = await tokenRequest({
    code,
    client_id: cfg.clientId,
    client_secret: cfg.clientSecret,
    redirect_uri: redirectUri(cfg),
    grant_type: 'authorization_code',
  });
  if (!t.refresh_token) throw new Error('Google no entregó refresh_token (revoca el acceso de la app en la cuenta y reconecta)');
  return {
    refreshToken: t.refresh_token,
    accessToken: t.access_token,
    expiresAt: now + (t.expires_in ?? 3600) * 1000,
    connectedAt: new Date(now).toISOString(),
  };
}

/** Devuelve un access token vigente; refresca y muta `link` si hace falta. */
export async function accessToken(cfg: GoogleConfig, link: GoogleLink, now = Date.now()): Promise<string> {
  if (link.accessToken && link.expiresAt && link.expiresAt - 60_000 > now) return link.accessToken;
  const t = await tokenRequest({
    refresh_token: link.refreshToken,
    client_id: cfg.clientId,
    client_secret: cfg.clientSecret,
    grant_type: 'refresh_token',
  });
  link.accessToken = t.access_token;
  link.expiresAt = now + (t.expires_in ?? 3600) * 1000;
  return link.accessToken!;
}

/**
 * Ejecuta `fn` con un access token vigente. Si Google lo rechaza (401: revocado o caducado antes de tiempo),
 * descarta el token en caché, pide uno nuevo con el refresh token y reintenta una vez.
 */
export async function withToken<T>(cfg: GoogleConfig, link: GoogleLink, now: number, fn: (token: string) => Promise<T>): Promise<T> {
  try {
    return await fn(await accessToken(cfg, link, now));
  } catch (err) {
    if (!/401/.test((err as Error).message)) throw err;
    link.accessToken = undefined;
    link.expiresAt = undefined;
    return fn(await accessToken(cfg, link, now));
  }
}

// ───────────── Calendar ─────────────

async function api(token: string, method: string, path: string, body?: unknown) {
  const res = await fetch(`${CAL}${path}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (res.status === 204) return { status: 204, json: null as any };
  const json = (await res.json().catch(() => null)) as any;
  return { status: res.status, json };
}

function eventBody(appt: Appointment, user: User) {
  const start = new Date(appt.startsAt!);
  const end = new Date(start.getTime() + appt.durationMin * 60000);
  return {
    summary: 'Tu cita contigo · gogym',
    description: apptDescription(appt),
    location: `${appt.venue} (${user.gym})`,
    start: { dateTime: start.toISOString(), timeZone: TZ },
    end: { dateTime: end.toISOString(), timeZone: TZ },
    reminders: { useDefault: false, overrides: [{ method: 'popup', minutes: 45 }] },
    extendedProperties: { private: { laCita: '1', apptId: appt.id } },
  };
}

/** Crea o mueve el evento. Devuelve el id del evento. Si el evento fue borrado a mano, lo recrea. */
export async function upsertEvent(token: string, appt: Appointment, user: User): Promise<string> {
  const body = eventBody(appt, user);
  if (appt.eventId) {
    const r = await api(token, 'PATCH', `/calendars/primary/events/${encodeURIComponent(appt.eventId)}`, body);
    if (r.status === 200 && r.json?.status !== 'cancelled') return appt.eventId;
    if (r.status !== 404 && r.status !== 410 && r.json?.status !== 'cancelled') throw new Error(`Calendar PATCH ${r.status}`);
  }
  const r = await api(token, 'POST', '/calendars/primary/events', body);
  if (r.status !== 200 || !r.json?.id) throw new Error(`Calendar POST ${r.status}: ${JSON.stringify(r.json?.error ?? '').slice(0, 200)}`);
  return r.json.id as string;
}

/** Bloques ocupados [start,end] en ms epoch dentro del rango. */
export async function freeBusy(token: string, fromMs: number, toMs: number): Promise<Array<[number, number]>> {
  const r = await api(token, 'POST', '/freeBusy', {
    timeMin: new Date(fromMs).toISOString(),
    timeMax: new Date(toMs).toISOString(),
    timeZone: TZ,
    items: [{ id: 'primary' }],
  });
  if (r.status !== 200) throw new Error(`Calendar freeBusy ${r.status}: ${JSON.stringify(r.json?.error ?? '').slice(0, 300)}`);
  const busy = (r.json?.calendars?.primary?.busy ?? []) as Array<{ start: string; end: string }>;
  return busy.map((b) => [Date.parse(b.start), Date.parse(b.end)] as [number, number]);
}

/** Eventos inventados para la Camila sintética (marcados para poder borrarlos). */
export async function createDemoEvent(token: string, summary: string, start: Date, end: Date) {
  const r = await api(token, 'POST', '/calendars/primary/events', {
    summary,
    start: { dateTime: start.toISOString(), timeZone: TZ },
    end: { dateTime: end.toISOString(), timeZone: TZ },
    extendedProperties: { private: { laCitaDemo: '1' } },
  });
  if (r.status !== 200) throw new Error(`Calendar demo POST ${r.status}: ${JSON.stringify(r.json?.error ?? '').slice(0, 300)}`);
  return r.json.id as string;
}

/** Borra los eventos marcados con la propiedad privada `prop` (laCitaDemo = reuniones inventadas; laCita = citas que creó el agente). */
export async function clearMarkedEvents(token: string, prop: 'laCitaDemo' | 'laCita'): Promise<number> {
  let deleted = 0;
  let pageToken: string | undefined;
  do {
    const q = new URLSearchParams({ privateExtendedProperty: `${prop}=1`, maxResults: '100', showDeleted: 'false' });
    if (pageToken) q.set('pageToken', pageToken);
    const r = await api(token, 'GET', `/calendars/primary/events?${q.toString()}`);
    if (r.status !== 200) throw new Error(`Calendar list ${r.status}: ${JSON.stringify(r.json?.error ?? '').slice(0, 300)}`);
    for (const ev of r.json.items ?? []) {
      const d = await api(token, 'DELETE', `/calendars/primary/events/${encodeURIComponent(ev.id)}`);
      if (d.status === 204 || d.status === 200) deleted += 1;
    }
    pageToken = r.json.nextPageToken;
  } while (pageToken);
  return deleted;
}

export const clearDemoEvents = (token: string) => clearMarkedEvents(token, 'laCitaDemo');

/** Borra un evento (ya borrado o inexistente cuenta como hecho). */
export async function deleteEvent(token: string, eventId: string): Promise<void> {
  const r = await api(token, 'DELETE', `/calendars/primary/events/${encodeURIComponent(eventId)}`);
  if (![200, 204, 404, 410].includes(r.status)) throw new Error(`Calendar DELETE ${r.status}`);
}

/**
 * Bloques ocupados reales: las reuniones del calendario, SIN las citas que creó el agente (si no, la propia cita
 * contaría como ocupada y al mover o calcular el hueco chocaría consigo misma). Ignora cancelados, "disponible" y
 * eventos de día completo.
 */
export async function busyFromEvents(token: string, fromMs: number, toMs: number): Promise<Array<[number, number]>> {
  const events = await listEvents(token, fromMs, toMs);
  return events
    .filter((e: any) => !e.isLaCita && !e.cancelled && !e.transparent && e.start?.includes('T') && e.end?.includes('T'))
    .map((e: any) => [Date.parse(e.start), Date.parse(e.end)] as [number, number])
    .filter(([s, e]: [number, number]) => Number.isFinite(s) && Number.isFinite(e) && e > s);
}

const AGENT_TITLES = new Set(['Tu cita contigo · gogym', 'La Cita contigo']);

/**
 * Borra las citas del agente del calendario: las marcadas por él y las que quedaron sueltas porque alguien importó el
 * .ics a mano (mismo título, sin marca). Las reuniones de demo y las reales no se tocan.
 */
export async function clearAppointmentEvents(token: string, nowMs = Date.now(), keepIds: Set<string> = new Set()): Promise<number> {
  const events = await listEvents(token, nowMs - 60 * 86400_000, nowMs + 120 * 86400_000);
  let deleted = 0;
  for (const ev of events as any[]) {
    if (!ev.isLaCita && !AGENT_TITLES.has(ev.title)) continue;
    if (keepIds.has(ev.id)) continue;
    const d = await api(token, 'DELETE', `/calendars/primary/events/${encodeURIComponent(ev.id)}`);
    if (d.status === 204 || d.status === 200) deleted += 1;
  }
  return deleted;
}

/** Eventos próximos del calendario principal (para verificar/mostrar en el panel de demo). */
export async function listEvents(token: string, fromMs: number, toMs: number) {
  const q = new URLSearchParams({
    timeMin: new Date(fromMs).toISOString(),
    timeMax: new Date(toMs).toISOString(),
    singleEvents: 'true',
    orderBy: 'startTime',
    maxResults: '250',
  });
  const r = await api(token, 'GET', `/calendars/primary/events?${q.toString()}`);
  if (r.status !== 200) throw new Error(`Calendar events ${r.status}: ${JSON.stringify(r.json?.error ?? '').slice(0, 300)}`);
  return (r.json.items ?? []).map((e: any) => ({
    id: e.id as string,
    title: (e.summary ?? '') as string,
    start: (e.start?.dateTime ?? e.start?.date) as string,
    end: (e.end?.dateTime ?? e.end?.date) as string,
    cancelled: e.status === 'cancelled',
    transparent: e.transparency === 'transparent',
    isLaCita: e.extendedProperties?.private?.laCita === '1',
    isDemoMeeting: e.extendedProperties?.private?.laCitaDemo === '1',
  }));
}
