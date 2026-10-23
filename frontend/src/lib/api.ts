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

const BASE = ((import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:8787').replace(/\/$/, '');

export const apiUrl = (path: string) => `${BASE}${path}`;

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

async function req<T>(method: 'GET' | 'POST', path: string, body?: unknown): Promise<T> {
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
  syncBusy: (userId: string, weekOf: string, intervals: BusyInterval[]) =>
    req<unknown>('POST', `/users/${encodeURIComponent(userId)}/busy`, { weekOf, intervals }),
};
