import type {
  ActionResponse,
  AppointmentView,
  CalendarWeek,
  ClockPreset,
  Message,
  MessagesPost,
  Meta,
  Summary,
  User,
} from './api-types';

const trimSlash = (s: string) => s.replace(/\/+$/, '');

export const defaultApiBase = trimSlash(
  (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:8787',
);

const BASE_KEY = 'lacita.apiBase';

export function apiBaseOverride(): string {
  try {
    return localStorage.getItem(BASE_KEY) ?? '';
  } catch {
    return '';
  }
}

/**
 * Deja la URL base tal como la usa el cliente: sin query, sin fragmento, sin barras finales y sin "/api…"
 * (el cliente ya agrega "/api"; así sirve pegar también "…/api/health", que es lo que imprime el backend).
 * Devuelve '' para vacío y null si no es una URL http(s) válida.
 */
export function normalizeApiBase(url: string): string | null {
  const raw = url.trim();
  if (!raw) return '';
  try {
    const u = new URL(raw);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
    const path = trimSlash(u.pathname.replace(/\/api(\/.*)?$/i, ''));
    return trimSlash(`${u.origin}${path}`);
  } catch {
    return null;
  }
}

/** Fija la API sin redeploy (queda en este navegador). Vacío vuelve a la del build. */
export function setApiBaseOverride(url: string): boolean {
  const clean = normalizeApiBase(url);
  if (clean === null) return false;
  try {
    if (clean) localStorage.setItem(BASE_KEY, clean);
    else localStorage.removeItem(BASE_KEY);
  } catch {
    return false;
  }
  return true;
}

export function getApiBase(): string {
  return trimSlash(apiBaseOverride() || defaultApiBase);
}

export const apiUrl = (path: string) => `${getApiBase()}${path}`;

const isLoopback = (h: string) => h === 'localhost' || h === '127.0.0.1' || h === '[::1]' || h === '::1';

/** La página está publicada pero la API apunta al computador de quien la abre. */
export function apiPointsToViewerMachine(): boolean {
  try {
    return isLoopback(new URL(getApiBase()).hostname) && !isLoopback(window.location.hostname);
  } catch {
    return false;
  }
}

const TOKEN_KEY = 'lacita.adminToken';

export function getAdminToken(): string {
  try {
    return sessionStorage.getItem(TOKEN_KEY) ?? '';
  } catch {
    return '';
  }
}

export function setAdminToken(token: string) {
  try {
    if (token) sessionStorage.setItem(TOKEN_KEY, token);
    else sessionStorage.removeItem(TOKEN_KEY);
  } catch {
    /* almacenamiento bloqueado: el token vive solo en esta llamada */
  }
}

export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message);
  }
}

async function req<T>(method: 'GET' | 'POST' | 'PATCH', path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const token = getAdminToken();
  if (token) headers['x-admin-token'] = token;

  let res: Response;
  try {
    res = await fetch(apiUrl(`/api${path}`), {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, 'network', 'No pudimos conectar con La Cita.');
  }

  if (!res.ok) {
    let code = 'http_error';
    let message = `Error ${res.status}`;
    try {
      const data = await res.json();
      code = data?.error?.code ?? code;
      message = data?.error?.message ?? message;
    } catch {
      /* respuesta sin JSON */
    }
    throw new ApiError(res.status, code, message);
  }
  return res.json() as Promise<T>;
}

export type DirectAction = 'weekly-capture' | 'default' | 'reminder' | 'move' | 'done';

export interface BusyInterval {
  start: string;
  end: string;
}

export const api = {
  meta: () => req<Meta>('GET', '/meta'),
  users: () => req<{ users: User[] }>('GET', '/users'),
  messages: (userId: string, after?: number) =>
    req<{ messages: Message[]; now: string }>(
      'GET',
      `/users/${encodeURIComponent(userId)}/messages${after ? `?after=${after}` : ''}`,
    ),
  send: (userId: string, body: { text?: string; action?: string; label?: string }) =>
    req<MessagesPost>('POST', `/users/${encodeURIComponent(userId)}/messages`, body),
  calendar: (userId: string, weekOf?: string) =>
    req<CalendarWeek>(
      'GET',
      `/users/${encodeURIComponent(userId)}/calendar${weekOf ? `?weekOf=${weekOf}` : ''}`,
    ),
  summary: (userId: string) => req<Summary>('GET', `/users/${encodeURIComponent(userId)}/summary`),
  appointments: (userId: string) =>
    req<{ appointments: AppointmentView[] }>('GET', `/users/${encodeURIComponent(userId)}/appointments`),
  action: (userId: string, kind: DirectAction, body: Record<string, unknown> = {}) =>
    req<ActionResponse>('POST', `/users/${encodeURIComponent(userId)}/${kind}`, body),
  reset: () => req<{ demoUserId: string; now: string }>('POST', '/demo/reset', {}),
  clock: (body: { preset: ClockPreset } | { advanceMinutes: number } | { reset: true } | { now: string }) =>
    req<{ now: string; simulated: boolean }>('POST', '/demo/clock', body),
  tick: () => req<unknown>('POST', '/jobs/tick', {}),
  // Pedido al backend (frontend/PEDIDOS-BACKEND.md §1): mientras no exista, el 404 se ignora.
  // Solo viajan inicio y fin de cada evento ocupado, nunca títulos (R2).
  syncBusy: (userId: string, weekOf: string, intervals: BusyInterval[]) =>
    req<unknown>('POST', `/users/${encodeURIComponent(userId)}/busy`, { weekOf, intervals }),
  // Pedido al backend (frontend/PEDIDOS-BACKEND.md §3): reglas de la sesión que usa el agente al proponer horarios.
  savePrefs: (userId: string, prefs: unknown) =>
    req<{ user: User }>('PATCH', `/users/${encodeURIComponent(userId)}/preferences`, prefs),
};
