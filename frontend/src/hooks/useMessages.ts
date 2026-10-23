import { useCallback, useEffect, useRef, useState } from 'react';
import { api, ApiError } from '../lib/api';
import type { Message } from '../lib/api-types';

const POLL_MS = 1500;

const same = (a: Message, b: Message) => a.n === b.n && a.id === b.id && a.at === b.at;

/**
 * El log del servidor manda. Un reset del demo o un reinicio de la API reinician la numeración (n vuelve a 1),
 * así que no se usa un cursor ?after= que solo crece: se trae el log completo de la usuaria (decenas de mensajes)
 * y se reemplaza el estado cuando difiere.
 */
function reconcile(prev: Message[], server: Message[]): Message[] {
  if (prev.length === server.length && prev.every((m, i) => same(m, server[i]))) return prev;
  // Servidor "atrasado": su log es un prefijo del nuestro (respuestas del POST ya mostradas). Se espera al próximo.
  if (server.length > 0 && server.length < prev.length && server.every((m, i) => same(m, prev[i]))) return prev;
  return server;
}

export function useMessages(userId: string | null) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [errorStatus, setErrorStatus] = useState<number | null>(null);
  const [loaded, setLoaded] = useState(false);
  const currentUser = useRef(userId);
  // Sube con cada reset o respuesta mostrada: un polling pedido antes trae un log viejo y se descarta.
  const epoch = useRef(0);

  /** Muestra al tiro las respuestas de un POST, solo si son de la usuaria que se está mirando. */
  const merge = useCallback((incoming: Message[]) => {
    const mine = incoming.filter((m) => m.userId === currentUser.current);
    if (!mine.length) return;
    epoch.current += 1;
    setMessages((prev) => {
      const seen = new Set(prev.map((m) => m.n));
      const fresh = mine.filter((m) => !seen.has(m.n));
      if (!fresh.length) return prev;
      return [...prev, ...fresh].sort((a, b) => a.n - b.n);
    });
  }, []);

  const reset = useCallback(() => {
    epoch.current += 1;
    setMessages([]);
  }, []);

  useEffect(() => {
    currentUser.current = userId;
    epoch.current += 1;
    setMessages([]);
    setLoaded(false);
    setError(null);
    setErrorStatus(null);
    if (!userId) return;
    let alive = true;
    let timer: number | undefined;

    // setTimeout encadenado y no setInterval: nunca hay dos pollings en vuelo, así que no llegan desordenados.
    const load = async () => {
      const startedAt = epoch.current;
      try {
        const r = await api.messages(userId);
        if (!alive || startedAt !== epoch.current) return;
        const server = r.messages.filter((m) => m.userId === userId).sort((a, b) => a.n - b.n);
        setMessages((prev) => reconcile(prev, server));
        setLoaded(true);
        setError(null);
        setErrorStatus(null);
      } catch (e) {
        if (!alive) return;
        setError(e instanceof Error ? e.message : 'Sin conexión');
        setErrorStatus(e instanceof ApiError ? e.status : 0);
      } finally {
        if (alive) timer = window.setTimeout(load, POLL_MS);
      }
    };

    load();
    return () => {
      alive = false;
      if (timer) window.clearTimeout(timer);
    };
  }, [userId]);

  return { messages, merge, reset, error, errorStatus, loaded };
}
