---
name: animate
description: Build smooth, taste-driven animations for La Cita using the right easing curves, durations, and properties. Based on emilkowalski/skills and Apple design principles. Use this whenever adding transitions, entrance/exit animations, or micro-interactions to ensure animations feel natural and accessible.
compatibility: Tailwind CSS, CSS animations, React
---

# Animate — Smooth Transitions for La Cita

Build animations that feel like native apps, not sloppy web. Based on [emilkowalski/skills](https://github.com/emilkowalski/skills) and [Apple Design](https://github.com/emilkowalski/skills/tree/main/skills/apple-design).

## Core Principles

**Easing matters more than duration.**

- **Entrance (appear):** `ease-out` — fast start, slow end. Feels responsive.
- **Exit (disappear):** `ease-in` — slow start, fast end. Feels weighty.
- **Continuous (hover, drag):** `ease-in-out` — smooth throughout.

**Duration by context:**
- Button tap/hover: `100ms`
- Card entrance: `300ms`
- Modal open/close: `400–500ms`
- Page transitions: `500–600ms`

**Animate ONLY these properties:**
- `opacity` — for fades
- `transform` — for position, scale, rotate (GPU-accelerated)
- `filter` — blur, brightness (use sparingly)

**NEVER animate:**
- `width` / `height` (causes layout shift)
- `color` (pair with opacity if needed)
- `padding` / `margin` (use transforms instead)

## Tailwind CSS Utilities

Add to `tailwind.config.ts`:

```typescript
export default {
  theme: {
    extend: {
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'fade-out': {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(12px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'slide-down': {
          '0%': { transform: 'translateY(-12px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'scale-in': {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      animation: {
        'fade-in': 'fade-in 300ms ease-out',
        'fade-out': 'fade-out 300ms ease-in',
        'slide-up': 'slide-up 400ms ease-out',
        'slide-down': 'slide-down 400ms ease-out',
        'scale-in': 'scale-in 300ms ease-out',
      },
      transitionTimingFunction: {
        'ease-out': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'ease-in': 'cubic-bezier(0.7, 0, 0.84, 0)',
      },
    },
  },
};
```

## Modal Entrance Animation

```typescript
'use client';

import { ReactNode, useState, useEffect } from 'react';

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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(isOpen);
  }, [isOpen]);

  if (!mounted) return null;

  return (
    <div
      className={`fixed inset-0 z-50 transition-opacity duration-300 ${
        isOpen ? 'opacity-100' : 'opacity-0'
      }`}
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
      onClick={onClose}
    >
      <div
        className={`
          fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
          w-full max-w-sm bg-white rounded-lg p-6
          transition-all duration-400
          ${
            isOpen
              ? 'opacity-100 scale-100'
              : 'opacity-0 scale-95'
          }
        `}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold mb-4">{title}</h2>
        <div className="mb-6">{children}</div>
        <button
          onClick={onClose}
          className="w-full py-2 bg-gray-200 rounded hover:bg-gray-300 transition-colors duration-200 font-medium"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}
```

## Button Tap Feedback

```typescript
'use client';

import { useState } from 'react';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
}

export default function Button({ children, onClick }: ButtonProps) {
  const [isPressed, setIsPressed] = useState(false);

  return (
    <button
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      onClick={onClick}
      className={`
        px-4 py-2 bg-blue-600 text-white rounded-lg font-medium
        transition-transform duration-100
        ${isPressed ? 'scale-95' : 'scale-100'}
        hover:bg-blue-700
      `}
    >
      {children}
    </button>
  );
}
```

## Accessibility: Respect Motion Preferences

```typescript
export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function getAnimationClass(animated: string, noMotion: string): string {
  return prefersReducedMotion() ? noMotion : animated;
}

// Usage
<div
  className={getAnimationClass(
    'animate-fade-in',
    'opacity-100' // fallback: instant appearance
  )}
>
  Content
</div>
```

## Appointment Card Entrance

```typescript
'use client';

import { useEffect, useState } from 'react';

interface AppointmentCardProps {
  appointment: any;
  index: number; // For staggered entrance
}

export default function AppointmentCard({
  appointment,
  index,
}: AppointmentCardProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Stagger each card by 50ms
    const timer = setTimeout(() => setIsVisible(true), index * 50);
    return () => clearTimeout(timer);
  }, [index]);

  return (
    <div
      className={`
        transition-all duration-300
        ${
          isVisible
            ? 'opacity-100 translate-y-0'
            : 'opacity-0 translate-y-3'
        }
      `}
    >
      {/* Card content */}
    </div>
  );
}
```

## What NOT to Do

❌ **Don't animate layout shifts:**
```typescript
// BAD — animates width, causes reflow
<div className="transition-all duration-300 hover:w-96">
```

✅ **Instead, use transform:**
```typescript
// GOOD — GPU-accelerated, no reflow
<div className="transition-transform duration-300 hover:scale-110">
```

❌ **Don't use ease-in for entrance:**
```typescript
// BAD — feels sluggish on appear
<div className="animate-slide-in" style={{animationTimingFunction: 'ease-in'}}>
```

✅ **Use ease-out for entrance:**
```typescript
// GOOD — feels responsive
<div className="animate-slide-up"> {/* ease-out by default */}
```

## Testing Animations

Use [microsoft/playwright-cli](https://github.com/microsoft/playwright-cli) to capture animation transitions:

```typescript
// tests/animations.spec.ts
import { test, expect } from '@playwright/test';

test('modal opens with smooth animation', async ({ page }) => {
  await page.goto('http://localhost:3000');
  const modal = page.locator('[data-testid="modal"]');
  
  // Modal should start at opacity 0
  let styles = await modal.evaluate(el => {
    return window.getComputedStyle(el).opacity;
  });
  expect(styles).toBe('0');
  
  // Trigger open
  await page.locator('button:has-text("Open")').click();
  
  // Wait for animation to complete (400ms)
  await page.waitForTimeout(400);
  
  // Modal should be at opacity 1
  styles = await modal.evaluate(el => {
    return window.getComputedStyle(el).opacity;
  });
  expect(styles).toBe('1');
});
```

## References

- [emilkowalski/skills — animate](https://github.com/emilkowalski/skills/tree/main/skills/animate)
- [emilkowalski/skills — apple-design](https://github.com/emilkowalski/skills/tree/main/skills/apple-design)
- [7 Practical Animation Tips](https://emilkowal.ski/ui/7-practical-animation-tips)
- [Agents with Taste](https://emilkowal.ski/ui/agents-with-taste)
- [web-design-guidelines](https://github.com/vercel-labs/agent-skills/tree/main/skills/web-design-guidelines)

## Next Step

Use these animations in Calendar entrance, Modal transitions, and Button feedback.
