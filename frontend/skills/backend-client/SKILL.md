---
name: backend-client
description: Create HTTP client to communicate with La Cita backend (Saintcarti's API). Handles message sending to Telegram, appointment state management, and error handling with retry logic. Use this to connect the frontend to the backend for real-time coordination between web and Telegram.
compatibility: axios, TypeScript, Next.js API routes
---

# Backend Client Integration

Create a typed HTTP client that communicates with Saintcarti's backend API. This handles:
- Sending messages to Camila via Telegram
- Fetching appointment state
- Syncing calendar events with backend
- Error handling and retry logic

## Install Axios

```bash
pnpm add axios
```

## Create `lib/backend-client.ts`

```typescript
import axios, { AxiosError } from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8787';

interface ApiError {
  code: string;
  message: string;
}

const client = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
});

// Error handling
client.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    console.error('Backend API error:', error.response?.data || error.message);
    throw error;
  }
);

// User Messages
export async function sendMessage(userId: string, payload: any) {
  const response = await client.post(`/api/users/${userId}/messages`, payload);
  return response.data;
}

export async function getMessages(userId: string, options?: { after?: number }) {
  const response = await client.get(`/api/users/${userId}/messages`, {
    params: options,
  });
  return response.data;
}

// Appointments
export async function getAppointments(userId: string) {
  const response = await client.get(`/api/users/${userId}/appointments`);
  return response.data;
}

export async function getSummary(userId: string) {
  const response = await client.get(`/api/users/${userId}/summary`);
  return response.data;
}

// Calendar
export async function getCalendarWeek(
  userId: string,
  options?: { weekOf?: string }
) {
  const response = await client.get(`/api/users/${userId}/calendar`, {
    params: options,
  });
  return response.data;
}

// Direct Actions
export async function weeklyCapture(userId: string) {
  const response = await client.post(`/api/users/${userId}/weekly-capture`, {});
  return response.data;
}

export async function sendReminder(userId: string) {
  const response = await client.post(`/api/users/${userId}/reminder`, {});
  return response.data;
}

export async function moveAppointment(
  userId: string,
  appointmentId?: string
) {
  const response = await client.post(`/api/users/${userId}/move`, {
    appointmentId,
  });
  return response.data;
}

export async function completeAppointment(
  userId: string,
  appointmentId?: string
) {
  const response = await client.post(`/api/users/${userId}/done`, {
    appointmentId,
  });
  return response.data;
}

// Meta
export async function getMeta() {
  const response = await client.get('/api/meta');
  return response.data;
}

// Telegram
export async function sendTelegramMessage(
  chatId: string,
  text: string,
  buttons?: any[]
) {
  // Proxy to backend's Telegram handler
  const response = await client.post('/api/telegram/send', {
    chatId,
    text,
    buttons,
  });
  return response.data;
}

export default client;
```

## Types: `types/api.ts`

```typescript
export interface Message {
  n: number;
  id: string;
  userId: string;
  dir: 'in' | 'out';
  at: string;
  text: string;
  buttons?: Button[];
  attachment?: {
    kind: 'ics';
    url: string;
  };
}

export interface Button {
  label: string;
  action: string;
}

export interface MessagesPost {
  replies: Message[];
  user: any;
  now: string;
}

export interface Appointment {
  id: string;
  status: 'scheduled' | 'moved' | 'completed' | 'missed';
  start: string;
  end: string;
  label: string;
}

export interface Summary {
  visitas: number;
  movidas: number;
  recuperado: number;
  proxima_cita: Appointment | null;
}

export interface CalendarWeek {
  week: string;
  days: CalendarDay[];
}

export interface CalendarDay {
  date: string;
  appointments: Appointment[];
  availableSlots: TimeSlot[];
}

export interface TimeSlot {
  start: string;
  end: string;
}
```

## API Route: Proxy Messages

Create `app/api/backend-proxy/messages/route.ts`:

```typescript
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sendMessage } from '@/lib/backend-client';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { action, text, label } = await req.json();

  const userId = session.user?.email || 'unknown'; // Use email as user ID

  try {
    const result = await sendMessage(userId, {
      text: text || undefined,
      action: action || undefined,
      label: label || undefined,
    });
    return Response.json(result);
  } catch (error: any) {
    return Response.json(
      { error: error.message },
      { status: error.response?.status || 500 }
    );
  }
}
```

## Polling Hook: `hooks/useBackendMessages.ts`

```typescript
'use client';

import { useEffect, useState } from 'react';
import { Message } from '@/types/api';
import { getMessages } from '@/lib/backend-client';

export function useBackendMessages(userId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const data = await getMessages(userId);
        setMessages(data.messages || []);
      } catch (err: any) {
        setError(err.message);
      }
    };

    fetchMessages();

    // Poll every 2 seconds
    const interval = setInterval(fetchMessages, 2000);
    return () => clearInterval(interval);
  }, [userId]);

  return { messages, loading, error };
}
```

## Error Handling

Wrap backend calls in try-catch and retry on network errors:

```typescript
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      if (i === maxRetries - 1) throw error;
      if (error.code !== 'ECONNREFUSED') throw error;
      // Network error; wait and retry
      await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
  throw new Error('Max retries exceeded');
}
```

## Usage in Components

```typescript
'use client';

import { useBackendMessages } from '@/hooks/useBackendMessages';
import { sendMessage } from '@/lib/backend-client';

export function ChatView({ userId }: { userId: string }) {
  const { messages } = useBackendMessages(userId);

  const handleSendMessage = async (text: string) => {
    try {
      await sendMessage(userId, { text });
    } catch (error) {
      console.error('Failed to send:', error);
    }
  };

  return (
    <div>
      {messages.map((msg) => (
        <div key={msg.id}>
          <p>{msg.text}</p>
          {msg.buttons?.map((btn) => (
            <button
              key={btn.action}
              onClick={() => sendMessage(userId, { action: btn.action })}
            >
              {btn.label}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}
```

## Notes

- **Polling every 2 seconds** — backend state can change from Telegram; poll to stay in sync
- **Deduplicate** — track `message.n` to avoid showing the same message twice
- **Error resilience** — retry network errors; fail gracefully on auth/validation errors
- **User ID** — use email or custom ID; must match backend's user identifier

## Next Step

Trigger `design-system` to build the component library with zero-guilt tones.
