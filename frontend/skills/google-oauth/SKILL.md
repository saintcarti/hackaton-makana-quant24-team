---
name: google-oauth
description: Configure Google OAuth login flow for La Cita. Sets up NextAuth.js with Google provider, manages session tokens, and handles secure redirects. Use this after setup-nextjs to enable users to login with their Google account and grant Calendar access.
compatibility: Next.js 13+, NextAuth.js 4.x
---

# Google OAuth Setup for La Cita

Configure NextAuth.js with Google OAuth provider. This enables:
- Login with Google account
- Automatic scope approval for Google Calendar access
- Secure session management in httpOnly cookies
- Refresh token rotation

## Step 1: Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing: `La Cita`
3. Enable APIs:
   - Google Calendar API
   - Google+ API (for user profile)
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Choose "Web application"
6. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (dev)
   - `https://<your-vercel-domain>/api/auth/callback/google` (prod)
7. Copy **Client ID** and **Client Secret** to `.env.local`:

```
GOOGLE_CLIENT_ID=<your-client-id>
GOOGLE_CLIENT_SECRET=<your-client-secret>
NEXTAUTH_SECRET=<openssl rand -base64 32>
```

## Step 2: Configure NextAuth.js

Create `lib/auth.ts`:

```typescript
import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  pages: {
    signIn: '/',
    error: '/?error=auth',
  },
  callbacks: {
    async jwt({ token, account }) {
      // Store Google tokens in JWT for later use
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.expiresAt = account.expires_at;
      }
      // Refresh token if expired
      if (token.expiresAt && token.expiresAt * 1000 < Date.now()) {
        return refreshAccessToken(token);
      }
      return token;
    },
    async session({ session, token }) {
      // Pass Google tokens to session
      session.accessToken = token.accessToken as string;
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

async function refreshAccessToken(token: any) {
  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        grant_type: 'refresh_token',
        refresh_token: token.refreshToken,
      }),
    });

    if (!response.ok) throw new Error('Token refresh failed');

    const data = await response.json();
    return {
      ...token,
      accessToken: data.access_token,
      expiresAt: Math.floor(Date.now() / 1000) + data.expires_in,
    };
  } catch (error) {
    console.error('Token refresh error:', error);
    return { ...token, error: 'RefreshAccessTokenError' };
  }
}
```

## Step 3: Add NextAuth Route Handler

Create `app/api/auth/[...nextauth]/route.ts`:

```typescript
import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
```

## Step 4: Add Providers Wrapper

Create `lib/providers.tsx`:

```typescript
'use client';

import { SessionProvider } from 'next-auth/react';
import { ReactNode } from 'react';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      {children}
    </SessionProvider>
  );
}
```

Add to `app/layout.tsx`:

```typescript
import { Providers } from '@/lib/providers';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
```

## Step 5: Create Login Page

Create `app/page.tsx`:

```typescript
'use client';

import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function LoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/dashboard');
    }
  }, [status, router]);

  if (status === 'loading') {
    return <div className="flex items-center justify-center h-screen">Cargando...</div>;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-6 text-center">La Cita</h1>
        <p className="text-gray-600 mb-8 text-center">Coordina tus citas de gym</p>
        <button
          onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
        >
          Inicia sesión con Google
        </button>
      </div>
    </div>
  );
}
```

## Step 6: Protect Dashboard Routes

Create `middleware.ts` (root of project):

```typescript
import { withAuth } from 'next-auth/middleware';

export const config = {
  matcher: ['/dashboard/:path*'],
};

export default withAuth(function middleware() {
  // Middleware runs; if no session, NextAuth redirects to login
});
```

## Session Type Augmentation

Create `types/next-auth.d.ts`:

```typescript
import NextAuth, { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session extends DefaultSession {
    accessToken?: string;
    user?: {
      id?: string;
    } & DefaultSession['user'];
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: number;
    error?: string;
  }
}
```

## Testing

1. Start dev server: `pnpm dev`
2. Visit `http://localhost:3000`
3. Click "Inicia sesión con Google"
4. Approve the OAuth scope (Calendar access)
5. Should redirect to `/dashboard` with valid session
6. Check browser cookies: `next-auth.session-token` should be present (httpOnly)

## Troubleshooting

- **"Redirect URI mismatch"** — Verify callback URI in Google Cloud Console matches exactly
- **"Invalid client"** — Check `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `.env.local`
- **"Token refresh failed"** — Ensure refresh token is stored; some users may need to re-authenticate
- **Session not persisting** — Check that `NEXTAUTH_SECRET` is set and matches across restarts

## Security Notes

- **Never log credentials** — access tokens are sensitive
- **httpOnly cookies** — NextAuth uses httpOnly by default; never expose tokens in JavaScript
- **CORS** — Google OAuth redirects are server-side; no CORS issues
- **Token rotation** — Refresh tokens are rotated automatically by Google

## Next Step

After OAuth is working, trigger the `google-calendar-api` skill to read/write calendar events.
