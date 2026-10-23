---
name: setup-nextjs
description: Bootstrap a Next.js project with auth flow, API routes, and component structure for La Cita frontend MVP. Use this when starting a new Next.js project, setting up authentication, or establishing the basic folder structure with TypeScript configuration and environment variables.
compatibility: Node.js 18+, pnpm or npm
---

# Setup Next.js for La Cita

Set up a production-ready Next.js project with TypeScript, Tailwind CSS, and the authentication/API infrastructure for La Cita (gym appointment scheduling with Google Calendar integration).

## Project Structure

Create this folder layout:

```
frontend/
├── app/                          # Next.js app router
│   ├── layout.tsx               # Root layout with providers
│   ├── page.tsx                 # Login page (entry point)
│   ├── dashboard/               # Protected routes
│   │   ├── layout.tsx
│   │   ├── page.tsx             # Calendar view (main product)
│   │   └── settings/
│   │       └── page.tsx
│   ├── api/                     # Backend proxy routes
│   │   ├── auth/
│   │   │   ├── callback/route.ts      # OAuth callback
│   │   │   └── logout/route.ts
│   │   └── telegram/            # Telegram webhook proxy
│   │       └── route.ts
│   └── utils/
│       ├── auth.ts              # Session management
│       └── env.ts               # Environment validation
├── components/
│   ├── Calendar.tsx             # Main calendar component
│   ├── AppointmentCard.tsx
│   └── shared/                  # Shared components (buttons, modals, etc)
│       ├── Button.tsx
│       └── Modal.tsx
├── lib/
│   ├── auth.ts                  # NextAuth.js config (or similar)
│   ├── google-calendar.ts       # Google Calendar client
│   └── backend-client.ts        # API client to backend
├── types/
│   └── index.ts                 # Shared types from backend
├── .env.example                 # Template for env vars
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.ts
└── README.md
```

## Environment Variables

Create `.env.local` (never commit this):

```
# Google OAuth
NEXT_PUBLIC_GOOGLE_CLIENT_ID=<from Google Cloud Console>
GOOGLE_CLIENT_SECRET=<from Google Cloud Console>
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/callback

# Backend API
NEXT_PUBLIC_BACKEND_URL=http://localhost:8787
BACKEND_API_KEY=<optional, if backend requires>

# Session (for secure cookie)
NEXTAUTH_SECRET=<run: openssl rand -base64 32>
```

## Dependencies to Install

```bash
pnpm add next react react-dom typescript @types/react
pnpm add tailwindcss postcss autoprefixer
pnpm add next-auth @react-oauth/google
pnpm add axios zod
pnpm add -D @types/node
```

## Key Files to Create

### 1. `app/layout.tsx` — Root Layout

```typescript
import type { Metadata } from 'next';
import { Providers } from '@/lib/providers';
import './globals.css';

export const metadata: Metadata = {
  title: 'La Cita — Tu Calendario de Gym',
  description: 'Coordina tus citas de gym sin culpa',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
```

### 2. `lib/auth.ts` — NextAuth Configuration

Configure Google OAuth with NextAuth.js. Store session in secure httpOnly cookie. Redirect unauthenticated users to login.

### 3. `middleware.ts` — Protected Routes

Protect `/dashboard` routes. Redirect to login if no session.

```typescript
import { withAuth } from 'next-auth/middleware';

export const config = { matcher: ['/dashboard/:path*'] };

export default withAuth(function middleware(req) {
  // Optional: add logging or custom logic
});
```

## Development Workflow

```bash
# Install dependencies
pnpm install

# Configure Google OAuth
# 1. Go to Google Cloud Console
# 2. Create OAuth 2.0 credentials (Web application)
# 3. Add http://localhost:3000/api/auth/callback to authorized redirect URIs
# 4. Copy Client ID and Secret to .env.local

# Run dev server
pnpm dev

# Open http://localhost:3000
```

## TypeScript Strict Mode

Set in `tsconfig.json`:

```json
{
  "compilerOptions": {
    "strict": true,
    "strictNullChecks": true,
    "noImplicitAny": true,
    "noImplicitThis": true
  }
}
```

## Notes

- **No app-wide state library yet** — use React Context + hooks until the app grows (YAGNI)
- **Tailwind only** — no component libraries; we build the design system ourselves in the `design-system` skill
- **Environment validation** — use Zod to validate env vars at startup; fail fast if missing
- **Session storage** — NextAuth.js handles secure cookie-based sessions; no need for localStorage

## Next Step

After setup, trigger the `google-oauth` skill to configure authentication.
