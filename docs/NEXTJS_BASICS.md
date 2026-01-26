# Next.js Basics for This Project

This guide explains the Next.js concepts used in the GitHub Dashboard, with examples from the actual codebase.

## What is Next.js?

Next.js is a React framework that adds:
- File-based routing (folders become URLs)
- Server-side rendering (faster initial load)
- API routes (backend code in the same project)
- Middleware (code that runs before requests)

## 1. App Router (File-Based Routing)

### How It Works

In Next.js App Router, **folders become URLs**:

```
app/
├── page.tsx           → URL: /
├── dashboard/
│   ├── page.tsx       → URL: /dashboard
│   └── activity/
│       └── page.tsx   → URL: /dashboard/activity
└── api/
    └── github/
        └── issues/
            └── route.ts  → API: /api/github/issues
```

### Special File Names

| File | Purpose |
|------|---------|
| `page.tsx` | The UI for a route |
| `layout.tsx` | Wraps pages (shared UI like header/sidebar) |
| `route.ts` | API endpoint handler |
| `loading.tsx` | Loading UI while page fetches data |
| `error.tsx` | Error UI when something fails |

### Example from This Project

```
app/
├── page.tsx              # Login page (/)
├── layout.tsx            # Root layout (wraps everything)
└── dashboard/
    ├── page.tsx          # Dashboard home (/dashboard)
    ├── layout.tsx        # Dashboard layout (sidebar, header)
    └── activity/
        └── page.tsx      # Activity page (/dashboard/activity)
```

## 2. The `'use client'` Directive

### Server vs Client Components

By default, components in Next.js 13+ are **Server Components**:
- Run on the server
- Can't use React hooks (`useState`, `useEffect`)
- Can't use browser APIs (`window`, `document`)
- Can directly access databases, files, etc.

**Client Components** run in the browser:
- Can use React hooks
- Can use browser APIs
- Need the `'use client'` directive at the top

### When to Use `'use client'`

Add `'use client'` when your component:
- Uses `useState`, `useEffect`, `useCallback`, etc.
- Uses event handlers (`onClick`, `onChange`)
- Uses browser APIs (`window`, `localStorage`)
- Uses third-party libraries that need browser

### Example from This Project

```typescript
// components/chat/ChatInterface.tsx
'use client';  // ← Needed because it uses useState, handlers

import { useState } from 'react';

export default function ChatInterface() {
  const [inputValue, setInputValue] = useState('');  // ← React hook

  const handleSend = () => {  // ← Event handler
    // ...
  };

  return (
    <input
      value={inputValue}
      onChange={(e) => setInputValue(e.target.value)}  // ← Event
    />
  );
}
```

```typescript
// services/ai-service.ts
import 'server-only';  // ← No 'use client' - this is server-only code

// This file can use Node.js APIs, access secrets, etc.
// It will NEVER be sent to the browser
```

### Common Mistake

```typescript
// ERROR: Using hooks in Server Component
// app/dashboard/page.tsx (no 'use client')

import { useState } from 'react';  // ❌ Error!

export default function Dashboard() {
  const [count, setCount] = useState(0);  // ❌ Can't use hooks
}
```

**Fix**: Add `'use client'` at the top, OR move state to a Client Component.

## 3. API Routes (`route.ts` Files)

### How They Work

Files named `route.ts` in the `app/api/` folder become API endpoints:

```typescript
// app/api/github/issues/route.ts
// This becomes: POST /api/github/issues

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

// Handle POST requests
export async function POST(request: Request) {
  // 1. Check authentication
  const session = await auth();
  if (!session?.accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Parse request body
  const body = await request.json();

  // 3. Do something (call GitHub API, etc.)
  const result = await createIssue(body);

  // 4. Return response
  return NextResponse.json({ success: true, data: result });
}

// Handle GET requests
export async function GET() {
  // ...
}
```

### Supported HTTP Methods

Export functions named after HTTP methods:
- `GET` - Fetch data
- `POST` - Create data
- `PUT` - Update data (full replacement)
- `PATCH` - Update data (partial)
- `DELETE` - Delete data

### Example Request/Response

```typescript
// Client code calling the API:
const response = await fetch('/api/github/issues', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    repo: 'owner/repo',
    title: 'Bug report',
    body: 'Something is broken'
  })
});

const data = await response.json();
// data = { success: true, issue_url: '...' }
```

## 4. Middleware

### What is Middleware?

Middleware is code that runs **before** every request. It can:
- Check authentication
- Redirect users
- Add headers
- Log requests

### How It Works in This Project

```typescript
// middleware.ts (at project root)
import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

export default auth((req) => {
  const isLoggedIn = !!req.auth?.user;
  const { pathname } = req.nextUrl;

  // Protected routes need login
  if (pathname.startsWith('/dashboard') && !isLoggedIn) {
    return NextResponse.redirect(new URL('/', req.nextUrl.origin));
  }

  // Logged-in users go straight to dashboard
  if (pathname === '/' && isLoggedIn) {
    return NextResponse.redirect(new URL('/dashboard', req.nextUrl.origin));
  }

  return NextResponse.next();  // Continue to the page
});

// Only run middleware on these paths
export const config = {
  matcher: ['/dashboard/:path*', '/api/github/:path*', '/'],
};
```

### The Matcher Config

The `matcher` tells Next.js which routes to run middleware on:

```typescript
export const config = {
  matcher: [
    '/dashboard/:path*',    // /dashboard and all sub-paths
    '/api/github/:path*',   // /api/github and all sub-paths
    '/',                    // Just the home page
  ],
};
```

Pattern syntax:
- `:path` matches one segment (`/dashboard/foo`)
- `:path*` matches zero or more segments (`/dashboard`, `/dashboard/foo/bar`)

## 5. Layouts

### What is a Layout?

A layout wraps pages with shared UI (like headers, sidebars):

```typescript
// app/dashboard/layout.tsx
export default function DashboardLayout({
  children,  // ← The page content
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="dashboard-container">
      <Sidebar />
      <main>{children}</main>  {/* ← Page renders here */}
    </div>
  );
}
```

### Layout Nesting

Layouts nest automatically:

```
app/layout.tsx          ← Root layout (auth provider, global styles)
  └── app/dashboard/layout.tsx  ← Dashboard layout (sidebar)
        └── app/dashboard/page.tsx  ← Page content
```

The page at `/dashboard` gets wrapped by BOTH layouts.

## 6. Path Aliases (`@/`)

### What is `@/`?

Instead of relative imports like `../../lib/auth`, we use `@/lib/auth`.

The `@` alias is configured in `tsconfig.json`:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

### Example

```typescript
// Without alias (confusing):
import { auth } from '../../../lib/auth';

// With alias (clear):
import { auth } from '@/lib/auth';
```

## Quick Reference

| Concept | File | Purpose |
|---------|------|---------|
| Page | `page.tsx` | UI for a URL |
| Layout | `layout.tsx` | Shared wrapper UI |
| API Route | `route.ts` | Backend endpoint |
| Middleware | `middleware.ts` | Pre-request checks |
| Client Component | `'use client'` | Interactive React |
| Server Component | (default) | Static/data-fetching React |

## Common Patterns in This Project

### 1. Protected API Route
```typescript
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  // ... rest of handler
}
```

### 2. Client Component with Server Data
```typescript
'use client';

export default function MyComponent() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch('/api/my-endpoint')
      .then(res => res.json())
      .then(setData);
  }, []);

  return <div>{data ? <List items={data} /> : <Loading />}</div>;
}
```

### 3. Type-Safe Imports
```typescript
import type { GitHubIssue } from '@/types/github';  // ← Type-only import
import { auth } from '@/lib/auth';                   // ← Value import
```
