---
name: calendar-ui
description: Build the visual calendar component showing Camila's gym appointments. Displays available slots, shows confirmed appointments with status badges (scheduled, moved, completed), and provides UI for confirming or moving appointments. Use this to create the main calendar view in the dashboard.
compatibility: React, Tailwind CSS, TypeScript
---

# Calendar UI Component

Build a clean, visual calendar showing:
- Confirmed gym appointments from Google Calendar
- Status of each appointment (Programada, Movida, Realizada)
- Available time slots (19:00–21:00 window)
- Buttons to confirm or move each appointment
- No guilt language (avoid red colors for missed appointments)

## Component: `components/Calendar.tsx`

```typescript
'use client';

import { useState, useEffect } from 'react';
import { format, addDays, isToday } from 'date-fns';
import { es } from 'date-fns/locale';
import AppointmentCard from './AppointmentCard';
import SlotPicker from './SlotPicker';

interface Appointment {
  id: string;
  start: string;
  end: string;
  status: 'scheduled' | 'moved' | 'completed' | 'missed';
  title: string;
}

export default function Calendar() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [showSlotPicker, setShowSlotPicker] = useState(false);

  useEffect(() => {
    fetchAppointments();
  }, [selectedDate]);

  async function fetchAppointments() {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/appointments?date=${format(selectedDate, 'yyyy-MM-dd')}`
      );
      const data = await res.json();
      setAppointments(data.appointments || []);
    } catch (error) {
      console.error('Failed to fetch appointments:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Tu Calendario</h1>

      {/* Date Navigation */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => setSelectedDate(addDays(selectedDate, -1))}
          className="px-3 py-2 bg-gray-200 rounded hover:bg-gray-300"
        >
          ← Anterior
        </button>
        <div className="flex-1">
          <p className="text-lg font-semibold">
            {format(selectedDate, 'EEEE, d MMMM', { locale: es })}
          </p>
          {isToday(selectedDate) && <p className="text-sm text-green-600">Hoy</p>}
        </div>
        <button
          onClick={() => setSelectedDate(addDays(selectedDate, 1))}
          className="px-3 py-2 bg-gray-200 rounded hover:bg-gray-300"
        >
          Siguiente →
        </button>
      </div>

      {/* Appointments for the day */}
      <div className="space-y-4 mb-8">
        {loading && <p className="text-gray-500">Cargando...</p>}
        {!loading && appointments.length === 0 && (
          <p className="text-gray-500">No hay citas para este día</p>
        )}
        {appointments.map((apt) => (
          <AppointmentCard
            key={apt.id}
            appointment={apt}
            onMove={() => setShowSlotPicker(true)}
            onComplete={() => handleComplete(apt.id)}
          />
        ))}
      </div>

      {/* Slot Picker Modal */}
      {showSlotPicker && (
        <SlotPicker
          date={selectedDate}
          onSelect={async (slot) => {
            await handleMoveAppointment(appointments[0]?.id, slot);
            setShowSlotPicker(false);
          }}
          onClose={() => setShowSlotPicker(false)}
        />
      )}

      {/* Add New Appointment */}
      {appointments.length === 0 && (
        <button
          onClick={() => setShowSlotPicker(true)}
          className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
        >
          Agendar cita
        </button>
      )}
    </div>
  );

  async function handleComplete(appointmentId: string) {
    try {
      await fetch(`/api/appointments/${appointmentId}/complete`, {
        method: 'POST',
      });
      fetchAppointments();
    } catch (error) {
      console.error('Failed to complete appointment:', error);
    }
  }

  async function handleMoveAppointment(appointmentId: string, newSlot: any) {
    try {
      await fetch(`/api/appointments/${appointmentId}/move`, {
        method: 'POST',
        body: JSON.stringify(newSlot),
      });
      fetchAppointments();
    } catch (error) {
      console.error('Failed to move appointment:', error);
    }
  }
}
```

## Component: `components/AppointmentCard.tsx`

```typescript
'use client';

interface Appointment {
  id: string;
  start: string;
  end: string;
  status: 'scheduled' | 'moved' | 'completed' | 'missed';
  title: string;
}

const statusLabels = {
  scheduled: { label: 'Programada', color: 'bg-blue-50 border-blue-200' },
  moved: { label: 'Movida', color: 'bg-amber-50 border-amber-200' },
  completed: { label: 'Realizada', color: 'bg-green-50 border-green-200' },
  missed: { label: 'No realizada', color: 'bg-gray-50 border-gray-200' },
};

export default function AppointmentCard({
  appointment,
  onMove,
  onComplete,
}: {
  appointment: Appointment;
  onMove: () => void;
  onComplete: () => void;
}) {
  const status = statusLabels[appointment.status];
  const time = new Date(appointment.start).toLocaleTimeString('es', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className={`p-4 border rounded-lg ${status.color}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="font-semibold">{appointment.title}</p>
          <p className="text-sm text-gray-600">{time}</p>
        </div>
        <span className="text-xs font-medium px-2 py-1 bg-white rounded">
          {status.label}
        </span>
      </div>

      {/* Actions */}
      {appointment.status === 'scheduled' && (
        <div className="mt-3 flex gap-2">
          <button
            onClick={onComplete}
            className="flex-1 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700"
          >
            Listo
          </button>
          <button
            onClick={onMove}
            className="flex-1 py-2 text-sm bg-amber-600 text-white rounded hover:bg-amber-700"
          >
            Mover
          </button>
        </div>
      )}
    </div>
  );
}
```

## Component: `components/SlotPicker.tsx`

```typescript
'use client';

import { useState, useEffect } from 'react';

export default function SlotPicker({
  date,
  onSelect,
  onClose,
}: {
  date: Date;
  onSelect: (slot: { start: string; end: string }) => void;
  onClose: () => void;
}) {
  const [slots, setSlots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSlots();
  }, [date]);

  async function fetchSlots() {
    setLoading(true);
    try {
      const res = await fetch(`/api/slots?date=${date.toISOString().split('T')[0]}`);
      const data = await res.json();
      setSlots(data.slots || []);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg max-w-sm w-full">
        <h2 className="text-xl font-bold mb-4">Elige un horario</h2>

        {loading && <p className="text-gray-500">Cargando horarios disponibles...</p>}

        {!loading && slots.length === 0 && (
          <p className="text-gray-500 mb-4">
            No hay horarios disponibles hoy. Elige otro día.
          </p>
        )}

        <div className="space-y-2 mb-6">
          {slots.map((slot) => {
            const time = new Date(slot.start).toLocaleTimeString('es', {
              hour: '2-digit',
              minute: '2-digit',
            });
            return (
              <button
                key={slot.start}
                onClick={() => onSelect(slot)}
                className="w-full p-3 text-left border rounded hover:bg-blue-50 hover:border-blue-300"
              >
                {time}
              </button>
            );
          })}
        </div>

        <button
          onClick={onClose}
          className="w-full py-2 bg-gray-300 rounded hover:bg-gray-400"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}
```

## Styling Notes

- **No guilt colors** — avoid red; use neutral grays and warm ambers for "moved" status
- **Neutral language** — "Movida" (moved) not "Cancelada" (cancelled) or "Fallida" (failed)
- **Clear typography** — time is prominent; status is secondary
- **Touch-friendly buttons** — minimum 44px height for mobile

## Next Step

Trigger `backend-client` to connect with Saintcarti's backend for Telegram integration.
