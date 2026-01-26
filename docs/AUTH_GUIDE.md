# GitHub OAuth Authentication Guide

This guide explains how authentication works in the GitHub Dashboard and how to debug common OAuth issues.

## How GitHub OAuth Works

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         OAuth 2.0 Flow Overview                             │
└─────────────────────────────────────────────────────────────────────────────┘

1. USER CLICKS "SIGN IN WITH GITHUB"
   ↓
   Browser redirects to: github.com/login/oauth/authorize?client_id=...

2. USER AUTHORIZES ON GITHUB
   ↓
   GitHub redirects to: your-app.com/api/auth/callback/github?code=abc123

3. NEXTAUTH EXCHANGES CODE FOR TOKEN
   ↓
   Server sends code to GitHub, receives access_token

4. NEXTAUTH CREATES SESSION
   ↓
   Token encrypted into JWT cookie, user redirected to /dashboard

5. SUBSEQUENT REQUESTS
   ↓
   JWT cookie sent automatically, middleware checks auth status
```

## Key Files Explained

### 1. `lib/auth.ts` - Authentication Configuration

This is the heart of authentication. Let's break it down:

```typescript
// --- MODULE AUGMENTATION ---
// TypeScript doesn't know about our custom session fields.
// We "augment" the NextAuth types to add them.

declare module 'next-auth' {
  interface Session {
    accessToken?: string;      // GitHub token for API calls
    openaiApiKey?: string;     // User's OpenAI key (optional)
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      login?: string;          // GitHub username
    };
  }
}

declare module '@auth/core/jwt' {
  interface JWT {
    accessToken?: string;      // Stored in encrypted cookie
    login?: string;
    openaiApiKey?: string;
  }
}
```

```typescript
// --- PROVIDER CONFIGURATION ---

providers: [
  GitHub({
    clientId: process.env.GITHUB_CLIENT_ID!,
    clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    // Permissions configured in GitHub App settings, not here
  }),
],
```

```typescript
// --- CALLBACKS ---
// These run at specific points in the auth lifecycle

callbacks: {
  // JWT CALLBACK: Runs when JWT is created or updated
  async jwt({ token, account, profile, trigger, session }) {
    // On initial sign-in, store the GitHub token
    if (account && account.access_token) {
      token.accessToken = account.access_token;
    }
    // Store GitHub username from profile
    if (profile && 'login' in profile) {
      token.login = profile.login as string;
    }
    // Handle session updates (for OpenAI key storage)
    if (trigger === 'update' && session?.openaiApiKey !== undefined) {
      token.openaiApiKey = session.openaiApiKey;
    }
    return token;
  },

  // SESSION CALLBACK: Runs when session is accessed
  async session({ session, token }) {
    // Copy data from JWT to session (client-accessible)
    session.accessToken = token.accessToken;
    session.openaiApiKey = token.openaiApiKey;
    if (token.login) {
      session.user.login = token.login;
    }
    if (token.sub) {
      session.user.id = token.sub;
    }
    return session;
  },

  // AUTHORIZED CALLBACK: Runs on every request (via middleware)
  authorized({ auth, request }) {
    const isLoggedIn = !!auth?.user;
    const isProtectedRoute = /* ... */;

    if (isProtectedRoute && !isLoggedIn) {
      return false;  // Triggers redirect to login
    }
    return true;
  },
},
```

### 2. `middleware.ts` - Route Protection

Middleware runs BEFORE every request reaches your pages or API routes.

```typescript
import { auth } from '@/lib/auth';

export default auth((req) => {
  const isLoggedIn = !!req.auth?.user;
  const { pathname } = req.nextUrl;

  // Protected routes that require authentication
  const isProtectedRoute =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/api/github') ||
    pathname.startsWith('/api/chat-issue') ||
    pathname.startsWith('/api/summarize') ||
    pathname.startsWith('/api/prioritize');

  // Redirect unauthenticated users to login page
  if (isProtectedRoute && !isLoggedIn) {
    const loginUrl = new URL('/', req.nextUrl.origin);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect authenticated users from home to dashboard
  if (pathname === '/' && isLoggedIn) {
    return NextResponse.redirect(new URL('/dashboard', req.nextUrl.origin));
  }

  return NextResponse.next();
});

// MATCHER: Only run middleware on these routes
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/api/github/:path*',
    '/api/chat-issue',
    '/api/summarize',
    '/api/prioritize',
    '/',
  ],
};
```

### 3. `components/providers/SessionProvider.tsx` - Client Auth State

Wraps your app to provide auth state to client components:

```typescript
'use client';
import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react';

export function SessionProvider({ children }) {
  return <NextAuthSessionProvider>{children}</NextAuthSessionProvider>;
}
```

Components can then use:
```typescript
import { useSession } from 'next-auth/react';

function MyComponent() {
  const { data: session, status } = useSession();
  // session.user.name, session.accessToken, etc.
}
```

---

## Environment Variables Checklist

| Variable | Source | Purpose |
|----------|--------|---------|
| `GITHUB_CLIENT_ID` | GitHub OAuth App settings | Identifies your app to GitHub |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth App settings | Proves your app's identity |
| `AUTH_SECRET` | Generate with `openssl rand -base64 32` | Encrypts JWT cookies |
| `NEXTAUTH_URL` | Your app URL | Callback URL base |

### How to Get GitHub OAuth Credentials

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click "OAuth Apps" → "New OAuth App"
3. Fill in:
   - **Application name**: Your app name
   - **Homepage URL**: `http://localhost:3000` (or production URL)
   - **Authorization callback URL**: `http://localhost:3000/api/auth/callback/github`
4. Click "Register application"
5. Copy the **Client ID**
6. Click "Generate a new client secret" and copy it

### Create `.env.local`

```bash
GITHUB_CLIENT_ID=your_client_id_here
GITHUB_CLIENT_SECRET=your_client_secret_here
AUTH_SECRET=generated_secret_here
NEXTAUTH_URL=http://localhost:3000
OPENAI_API_KEY=your_openai_key_here
```

---

## Debugging OAuth Issues

### Step 1: Check Browser DevTools

**Network Tab:**
1. Open DevTools (F12 or Cmd+Opt+I)
2. Go to Network tab
3. Filter by "auth"
4. Look for failed requests (red)
5. Click request → see response body for error message

**Application Tab (Cookies):**
1. Go to Application → Cookies → your domain
2. Look for `authjs.session-token` cookie
3. If missing: auth didn't complete
4. If present but getting 401s: token may be expired/invalid

### Step 2: Check Environment Variables

```bash
# In your terminal, check if variables are set:
echo $GITHUB_CLIENT_ID
echo $NEXTAUTH_URL

# Or add to lib/auth.ts temporarily:
console.log('GITHUB_CLIENT_ID:', process.env.GITHUB_CLIENT_ID);
```

### Step 3: Check GitHub App Settings

1. Go to GitHub → Settings → Developer settings → OAuth Apps
2. Verify **Authorization callback URL** matches exactly:
   - Local: `http://localhost:3000/api/auth/callback/github`
   - Production: `https://your-domain.com/api/auth/callback/github`
3. Common mistake: trailing slash mismatch

### Step 4: Check Server Logs

```bash
npm run dev
```

Look for errors in the terminal when you try to log in.

---

## Common Error Messages and Fixes

### "redirect_uri_mismatch"

**Cause**: GitHub callback URL doesn't match your app's config.

**Fix**:
1. Go to GitHub OAuth App settings
2. Update "Authorization callback URL" to exactly match:
   ```
   http://localhost:3000/api/auth/callback/github
   ```
3. No trailing slash, exact match required

### "401 Unauthorized" on API calls

**Cause**: Token not being sent with requests, or token expired.

**Debug**:
1. Check session exists: `const session = await auth();`
2. Check token exists: `console.log(session?.accessToken);`
3. Check middleware isn't blocking: add console.log to `middleware.ts`

**Fix**: Ensure API routes get session correctly:
```typescript
const session = await auth();
if (!session?.accessToken) {
  return NextResponse.json({ error: 'No token' }, { status: 401 });
}
```

### "500 Internal Server Error" during login

**Cause**: Usually missing environment variables or misconfigured secret.

**Fix**:
1. Ensure `AUTH_SECRET` is set
2. Regenerate it: `openssl rand -base64 32`
3. Restart dev server after changing `.env.local`

### Infinite redirect loop

**Cause**: Middleware and auth config conflicting.

**Debug**:
1. Add console.log to `middleware.ts`:
   ```typescript
   console.log('Path:', pathname, 'Logged in:', isLoggedIn);
   ```
2. Check if you're protecting the login page itself

### Session exists but `accessToken` is undefined

**Cause**: JWT callback not storing the token.

**Fix**: Check `lib/auth.ts` jwt callback:
```typescript
if (account && account.access_token) {
  token.accessToken = account.access_token;
}
```

### "Configuration error" in production

**Cause**: Missing `NEXTAUTH_URL` or wrong value.

**Fix**: Set `NEXTAUTH_URL` to your production URL:
```
NEXTAUTH_URL=https://your-app.com
```

---

## Token Lifecycle

```
1. User logs in
   ↓
2. GitHub returns access_token
   ↓
3. jwt() callback stores in token
   ↓
4. Token encrypted into cookie (authjs.session-token)
   ↓
5. On each request:
   - Cookie decrypted
   - session() callback creates session object
   - API routes access via auth()
   ↓
6. Token expires (based on GitHub's token lifetime)
   ↓
7. User must re-authenticate
```

---

## Adding Console Logs for Debugging

### In `lib/auth.ts`

```typescript
callbacks: {
  async jwt({ token, account, profile }) {
    console.log('[JWT] account:', account);
    console.log('[JWT] profile:', profile);
    console.log('[JWT] token before:', token);
    // ... existing code ...
    console.log('[JWT] token after:', token);
    return token;
  },
  async session({ session, token }) {
    console.log('[SESSION] token:', token);
    console.log('[SESSION] session before:', session);
    // ... existing code ...
    console.log('[SESSION] session after:', session);
    return session;
  },
}
```

### In `middleware.ts`

```typescript
export default auth((req) => {
  console.log('[MIDDLEWARE] path:', req.nextUrl.pathname);
  console.log('[MIDDLEWARE] auth:', req.auth);
  // ... existing code ...
});
```

---

## Quick Reference

**Login flow files:**
- Config: `lib/auth.ts`
- Protection: `middleware.ts`
- Client state: `components/providers/SessionProvider.tsx`

**Environment variables:**
- `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` - from GitHub
- `AUTH_SECRET` - generate with openssl
- `NEXTAUTH_URL` - your app URL

**Debug locations:**
- Browser: Network tab, Application tab (cookies)
- Server: terminal output from `npm run dev`

**GitHub settings:**
- OAuth Apps: github.com/settings/developers
- Callback URL: `{your-url}/api/auth/callback/github`
