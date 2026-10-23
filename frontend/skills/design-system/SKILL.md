---
name: design-system
description: Build the La Cita component library and design tokens with zero-guilt tone. Includes buttons, cards, modals, color palette, typography, and microcopy rules. Use this to establish consistent styling across the app and ensure all messaging follows Camila's case rules (no shame language, neutral tones for moved appointments).
compatibility: Tailwind CSS, React, TypeScript
---

# Design System for La Cita

A component library and design tokens that embody La Cita's philosophy:
- **No guilt, no shame** — moved appointments are neutral, not failures
- **Warm but minimal** — clean UI, no gamification
- **Warm grays and ambers** — color choices reflect respect for the user's struggle

## Design Tokens

Create `components/tokens.ts`:

```typescript
export const colors = {
  // Palette
  white: '#FFFFFF',
  black: '#000000',
  
  // Grays (neutral, respectful)
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },
  
  // Blues (trust, action)
  blue: {
    50: '#EFF6FF',
    600: '#2563EB',
    700: '#1D4ED8',
  },
  
  // Ambers (moved appointments, gentle warnings)
  amber: {
    50: '#FFFBEB',
    100: '#FEF3C7',
    200: '#FDE68A',
    500: '#F59E0B',
    600: '#D97706',
  },
  
  // Greens (completed, positive)
  green: {
    50: '#F0FDF4',
    100: '#DCFCE7',
    600: '#16A34A',
  },
};

export const typography = {
  // Headings
  h1: 'text-3xl font-bold leading-tight',
  h2: 'text-2xl font-bold leading-tight',
  h3: 'text-xl font-semibold',
  
  // Body
  body: 'text-base font-normal leading-relaxed',
  bodySmall: 'text-sm font-normal leading-relaxed',
  
  // Labels & buttons
  label: 'text-sm font-semibold uppercase tracking-wide',
};

export const spacing = {
  xs: '0.25rem',
  sm: '0.5rem',
  md: '1rem',
  lg: '1.5rem',
  xl: '2rem',
  '2xl': '3rem',
};

export const radius = {
  sm: '0.375rem',
  md: '0.5rem',
  lg: '0.75rem',
};

export const shadows = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
};
```

## Components

### Button

Create `components/shared/Button.tsx`:

```typescript
'use client';

import { ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: Variant;
  size?: Size;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
}

const variants = {
  primary: 'bg-blue-600 text-white hover:bg-blue-700',
  secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300',
  danger: 'bg-red-600 text-white hover:bg-red-700',
};

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-base',
};

export default function Button({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  type = 'button',
  className = '',
}: ButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        rounded-md font-medium transition-colors
        ${sizes[size]}
        ${variants[variant]}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `}
    >
      {children}
    </button>
  );
}
```

### Card

Create `components/shared/Card.tsx`:

```typescript
'use client';

import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  status?: 'scheduled' | 'moved' | 'completed';
  className?: string;
}

const statusBorders = {
  scheduled: 'border-blue-200 bg-blue-50',
  moved: 'border-amber-200 bg-amber-50',
  completed: 'border-green-200 bg-green-50',
};

export default function Card({
  children,
  status,
  className = '',
}: CardProps) {
  const statusClass = status ? statusBorders[status] : 'border-gray-200 bg-white';

  return (
    <div
      className={`
        border rounded-lg p-4
        ${statusClass}
        ${className}
      `}
    >
      {children}
    </div>
  );
}
```

### Modal

Create `components/shared/Modal.tsx`:

```typescript
'use client';

import { ReactNode } from 'react';

interface ModalProps {
  isOpen: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
}

export default function Modal({
  isOpen,
  title,
  children,
  onClose,
}: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
        <h2 className="text-xl font-bold mb-4">{title}</h2>
        <div className="mb-6">{children}</div>
        <button
          onClick={onClose}
          className="w-full py-2 bg-gray-200 rounded hover:bg-gray-300 font-medium"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}
```

### StatusBadge

Create `components/shared/StatusBadge.tsx`:

```typescript
'use client';

type Status = 'scheduled' | 'moved' | 'completed' | 'missed';

const labels: Record<Status, string> = {
  scheduled: 'Programada',
  moved: 'Movida',
  completed: 'Realizada',
  missed: 'No realizada',
};

const colors: Record<Status, string> = {
  scheduled: 'bg-blue-100 text-blue-700',
  moved: 'bg-amber-100 text-amber-700',
  completed: 'bg-green-100 text-green-700',
  missed: 'bg-gray-100 text-gray-700',
};

export default function StatusBadge({ status }: { status: Status }) {
  return (
    <span className={`px-2 py-1 text-xs font-medium rounded ${colors[status]}`}>
      {labels[status]}
    </span>
  );
}
```

## Microcopy Rules

File: `lib/copy.ts`

```typescript
export const copy = {
  // Actions
  button: {
    confirm: 'Listo',
    move: 'Mover',
    schedule: 'Agendar cita',
    login: 'Inicia sesión con Google',
  },

  // Status messages
  status: {
    scheduled: 'Tu cita está agendada.',
    moved: 'Movimos tu cita al nuevo horario.',
    completed: 'Excelente, tu cita fue realizada.',
    missed: 'No hay cita para este día.',
  },

  // Instructions (zero-guilt tone)
  instructions: {
    moveReason: 'Si no te queda el horario, no hay problema. Muévela cuando sea.',
    slotPicker: 'Elige un horario que te funcione.',
    recovery: 'Tu mensualidad ya estaba pagada: hoy recuperaste $11.633 de los $34.900.',
  },

  // Errors (never blame the user)
  errors: {
    networkError: 'No pudimos conectar. Recargá la página cuando puedas.',
    authError: 'Inicia sesión nuevamente para continuar.',
    appointmentError: 'Algo pasó con tu cita. Probamos de nuevo.',
  },

  // Empty states
  empty: {
    noAppointments: 'No hay citas para este día.',
    noSlots: 'Todos los horarios están ocupados hoy.',
  },
};
```

## Color Usage Rules

```
Blue (primary):      Buttons, scheduled appointments, important actions
Amber (secondary):   Moved appointments, gentle alerts, non-critical info
Green (success):     Completed appointments, confirmations
Gray (neutral):      Backgrounds, borders, disabled states, text

🚫 NEVER use red for missed appointments or failures.
🚫 NEVER show "failed", "missed", "absent" language.
🚫 NEVER display shame-inducing metrics (streaks, percentages, rankings).
```

## Global Styles

Create `app/globals.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

html {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto Mono',
    sans-serif;
  scroll-behavior: smooth;
}

body {
  @apply bg-gray-50 text-gray-900;
}

/* Ensure buttons are always clickable */
button {
  @apply cursor-pointer;
}

button:disabled {
  @apply cursor-not-allowed opacity-50;
}

/* Link styling */
a {
  @apply text-blue-600 hover:text-blue-700 underline;
}
```

## Usage

```typescript
import Button from '@/components/shared/Button';
import Card from '@/components/shared/Card';
import { copy } from '@/lib/copy';

export function AppointmentView() {
  return (
    <Card status="scheduled">
      <h3>Tu cita</h3>
      <p>Lunes, 19:15</p>
      <Button onClick={handleMove}>{copy.button.move}</Button>
    </Card>
  );
}
```

## Typography Scale

```
Display:  3xl (2rem / 32px)  — Page titles
Heading:  2xl (1.5rem / 24px) — Section headings
Title:    xl (1.25rem / 20px) — Card titles
Body:     base (1rem / 16px)  — Regular text
Small:    sm (0.875rem / 14px) — Helper text, metadata
```

## Spacing System

All spacing follows the baseline scale: 4px, 8px, 12px, 16px, 24px, 32px.

## Motion & Animation Rules

Reference: [emilkowalski/skills — animate, apple-design](https://github.com/emilkowalski/skills)

**Entrance animations:**
- Use `ease-out` easing (fast start, slow end — feels responsive)
- Duration: 200–300ms for buttons, 400–500ms for modals
- Animate: opacity + transform (not color or layout)

**Exit animations:**
- Use `ease-in` easing (slow start, fast end — feels weighty)
- Tap feedback: `scale(0.97)` + `duration: 100ms`
- Modal close: opacity fade + subtle scale out

**What NOT to animate:**
- Layout shifts (use CSS grid, not JS)
- Color changes alone (pair with opacity if needed)
- Unnecessary micro-interactions (every hover doesn't need motion)

**Accessibility:**
- Respect `prefers-reduced-motion` media query
- Never use motion for critical info transfer
- Transitions should feel natural, not jarring

## Notes

- No border-radius uniformity — use different radii for different components (reference: emilkowalski/apple-design)
- No glassmorphism — clean, solid colors
- No unnecessary shadows — 1-2 subtle shadows max (reference: emilkowalski/skills §shadows)
- Accessibility — all buttons have minimum 44px height, color contrast passes APCA
- Mobile — use `mobile-native` patterns: avoid zoom on input, handle 100vh bug, sticky hover states

## References

- [emilkowalski/skills](https://github.com/emilkowalski/skills) — Animation & design expertise
- [vercel-labs/web-design-guidelines](https://github.com/vercel-labs/agent-skills/tree/main/skills/web-design-guidelines) — Web design best practices
- [apple-design](https://github.com/emilkowalski/skills/tree/main/skills/apple-design) — Apple's fluid motion principles
- [playwright-cli](https://github.com/microsoft/playwright-cli) — Testing animations in CI

## Next Step

Components are ready; use them in the Calendar, Modal, and other views. When adding animations, trigger the `animate` skill.
