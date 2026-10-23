import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../lib/api';
import type { Message } from '../lib/api-types';

const POLL_MS = 1500;

/** Log de mensajes de una usuaria: carga inicial + polling con ?after=, deduplicado por n. */
export function useMessages(userId: string | null) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [error, setError] = useState<string | null>(null);
  // Cursor del polling: solo lo avanza el propio polling. Si lo avanzaran las respuestas del POST,
  // el mensaje entrante de la usuaria (n menor que las respuestas) quedaría salteado.
  const lastN = useRef(0);

  const merge = useCallback((incoming: Message[]) => {
    if (!incoming.length) return;
    setMessages((prev) => {
      const seen = new Set(prev.map((m) => m.n));
      const fresh = incoming.filter((m) => !seen.has(m.n));
      if (!fresh.length) return prev;
      return [...prev, ...fresh].sort((a, b) => a.n - b.n);
    });
  }, []);

  const reset = useCallback(() => {
    lastN.current = 0;
    setMessages([]);
  }, []);

  useEffect(() => {
    if (!userId) return;
    let alive = true;
    lastN.current = 0;
    setMessages([]);

    const load = async () => {
      try {
        const r = await api.messages(userId, lastN.current || undefined);
        if (!alive) return;
        if (r.messages.length) lastN.current = Math.max(lastN.current, ...r.messages.map((m) => m.n));
        merge(r.messages);
        setError(null);
      } catch (e) {
        if (alive) setError(e instanceof Error ? e.message : 'Sin conexión');
      }
    };

    load();
    const t = setInterval(load, POLL_MS);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [userId, merge]);

  return { messages, merge, reset, error };
}
