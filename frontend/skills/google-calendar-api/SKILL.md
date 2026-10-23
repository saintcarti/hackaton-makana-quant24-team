---
name: google-calendar-api
description: Read and write events to Camila's Google Calendar. Finds available time slots, creates gym appointments with .ics attachments, handles timezone conversions. Use this to fetch calendar data, create/update events, and identify free slots in the user's schedule.
compatibility: Google Calendar API v3, Next.js API routes
---

# Google Calendar API Integration

Read/write gym appointments to Camila's personal Google Calendar. This skill:
- Fetches existing calendar events
- Finds free slots within her work hours (19:00–21:00)
- Creates gym appointments with .ics file
- Moves appointments without deleting (MOVE action)
- Handles timezone (America/Santiago)

## Setup

Install Google API client:

```bash
pnpm add googleapis
```

## Create `lib/google-calendar.ts`

```typescript
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

const calendar = google.calendar('v3');
const TIMEZONE = 'America/Santiago';
const GYM_DURATION_MINUTES = 40;

interface TimeSlot {
  start: string; // ISO 8601
  end: string;
}

export async function getCalendarEvents(
  accessToken: string,
  dateRange: { start: Date; end: Date }
): Promise<any[]> {
  const oauth2Client = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );
  oauth2Client.setCredentials({ access_token: accessToken });

  const response = await calendar.events.list({
    auth: oauth2Client,
    calendarId: 'primary',
    timeMin: dateRange.start.toISOString(),
    timeMax: dateRange.end.toISOString(),
    singleEvents: true,
    orderBy: 'startTime',
  });

  return response.data.items || [];
}

export async function findAvailableSlots(
  accessToken: string,
  date: Date
): Promise<TimeSlot[]> {
  // Get events for the day
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const events = await getCalendarEvents(accessToken, {
    start: startOfDay,
    end: endOfDay,
  });

  // Extract busy times
  const busyTimes = events
    .filter((e) => e.start && e.end && !e.transparency?.includes('transparent'))
    .map((e) => ({
      start: new Date(e.start.dateTime || e.start.date),
      end: new Date(e.end.dateTime || e.end.date),
    }));

  // Find slots in 19:00–21:00 window
  const slots: TimeSlot[] = [];
  let current = new Date(date);
  current.setHours(19, 0, 0, 0); // 19:00

  const end = new Date(date);
  end.setHours(21, 0, 0, 0); // 21:00

  while (current < end) {
    const slotEnd = new Date(current);
    slotEnd.setMinutes(slotEnd.getMinutes() + GYM_DURATION_MINUTES);

    const isAvailable = !busyTimes.some(
      (busy) => current < busy.end && slotEnd > busy.start
    );

    if (isAvailable && slotEnd <= end) {
      slots.push({
        start: current.toISOString(),
        end: slotEnd.toISOString(),
      });
    }

    current.setMinutes(current.getMinutes() + 15); // 15-min increments
  }

  return slots;
}

export async function createGymAppointment(
  accessToken: string,
  slot: TimeSlot,
  summary: string = 'La Cita — Gym'
): Promise<string> {
  // eventId
  const oauth2Client = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );
  oauth2Client.setCredentials({ access_token: accessToken });

  const event = {
    summary,
    description: 'Cita de gym — coordinada por La Cita',
    start: {
      dateTime: slot.start,
      timeZone: TIMEZONE,
    },
    end: {
      dateTime: slot.end,
      timeZone: TIMEZONE,
    },
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'notification', minutes: 30 },
        { method: 'notification', minutes: 1 },
      ],
    },
  };

  const response = await calendar.events.insert({
    auth: oauth2Client,
    calendarId: 'primary',
    requestBody: event,
  });

  return response.data.id || '';
}

export async function updateGymAppointment(
  accessToken: string,
  eventId: string,
  slot: TimeSlot
): Promise<void> {
  const oauth2Client = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );
  oauth2Client.setCredentials({ access_token: accessToken });

  await calendar.events.update({
    auth: oauth2Client,
    calendarId: 'primary',
    eventId,
    requestBody: {
      start: {
        dateTime: slot.start,
        timeZone: TIMEZONE,
      },
      end: {
        dateTime: slot.end,
        timeZone: TIMEZONE,
      },
    },
  });
}

export async function deleteGymAppointment(
  accessToken: string,
  eventId: string
): Promise<void> {
  const oauth2Client = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );
  oauth2Client.setCredentials({ access_token: accessToken });

  await calendar.events.delete({
    auth: oauth2Client,
    calendarId: 'primary',
    eventId,
  });
}

export function generateICS(
  slot: TimeSlot,
  summary: string = 'La Cita — Gym'
): string {
  // Generate .ics file content for .ics download
  const start = new Date(slot.start).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const end = new Date(slot.end).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//La Cita//Gym Appointments//EN
BEGIN:VEVENT
UID:${Date.now()}@lacita.local
DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z
DTSTART:${start}
DTEND:${end}
SUMMARY:${summary}
DESCRIPTION:Cita de gym
LOCATION:Tu gimnasio
END:VEVENT
END:VCALENDAR`;
}
```

## API Route: Fetch Available Slots

Create `app/api/slots/route.ts`:

```typescript
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { findAvailableSlots } from '@/lib/google-calendar';

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.accessToken) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const date = new Date(searchParams.get('date') || new Date());

  try {
    const slots = await findAvailableSlots(session.accessToken, date);
    return Response.json({ slots });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
```

## API Route: Create Appointment

Create `app/api/appointments/route.ts`:

```typescript
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createGymAppointment, generateICS } from '@/lib/google-calendar';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.accessToken) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { start, end } = await req.json();
  const slot = { start, end };

  try {
    const eventId = await createGymAppointment(session.accessToken, slot);
    const ics = generateICS(slot);

    return Response.json({
      eventId,
      ics,
      message: 'Cita creada',
    });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
```

## Timezone Handling

All times are stored in `America/Santiago` (Chile standard time). Convert UTC to local time on the frontend for display.

## Notes

- Events created via the API are visible in Camila's Google Calendar instantly
- `findAvailableSlots()` respects existing events and free/busy status
- `.ics` file can be imported into any calendar app
- Reminders are set to 30 min and 1 min before the appointment

## Next Step

Trigger `calendar-ui` to build the visual calendar component.
