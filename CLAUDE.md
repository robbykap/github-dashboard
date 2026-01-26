# Claude Code Context

This file helps Claude Code understand and work with the GitHub Dashboard project.

## Project Overview

An AI-powered GitHub dashboard for managing issues and pull requests. Built with Next.js 16, TypeScript, and OpenAI GPT-4o-mini.

**Core Features:**
- View repositories, issues, and PRs
- AI-powered issue summarization
- Conversational issue creation (chat to create issues)
- GitHub Projects v2 integration
- Activity tracking

## Key Directories

```
/lib           → Core configuration (auth, github client, openai client)
/services      → Business logic (AI features, GitHub operations)
/hooks         → React state management hooks
/components    → UI components organized by feature
/types         → TypeScript type definitions
/prompts       → AI prompt templates (markdown files)
/app/api       → API route handlers
/docs          → Project documentation
```

## Critical Files

| File | Purpose |
|------|---------|
| `lib/auth.ts` | NextAuth config, OAuth callbacks, session handling |
| `middleware.ts` | Route protection (redirects unauthenticated users) |
| `services/ai-service.ts` | All AI features (summarize, prioritize, chat) |
| `services/github-service.ts` | GitHub API wrapper |
| `hooks/useCreateIssueFlow.ts` | Issue creation state machine |
| `types/ai.ts` | AI/chat type definitions |
| `types/github.ts` | GitHub API type definitions |

## Common Tasks

### Debug Authentication Issues

1. Check `lib/auth.ts` - OAuth configuration and callbacks
2. Check `middleware.ts` - Route protection rules
3. Verify environment variables (see below)
4. Check browser DevTools: Network tab for failed auth calls, Application tab for cookies
5. See `docs/AUTH_GUIDE.md` for detailed OAuth debugging

### Add a New API Endpoint

1. Create folder: `app/api/[endpoint-name]/`
2. Create `route.ts` inside with GET/POST handlers
3. Add types to `types/*.ts` if needed
4. Call service functions from `services/`

Example:
```typescript
// app/api/example/route.ts
import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  // ... your logic
  return NextResponse.json({ data: result });
}
```

### Modify AI Behavior

1. **Prompt changes**: Edit files in `prompts/*.md`
2. **Logic changes**: Edit `services/ai-service.ts`
3. **New AI feature**: Add function to `ai-service.ts`, add types to `types/ai.ts`

### Add a New Component

1. Create component in appropriate `components/[feature]/` folder
2. Add `'use client'` directive at top if it uses hooks/state
3. Export from `components/[feature]/index.ts`

### Modify Issue Creation Flow

The flow is managed by `hooks/useCreateIssueFlow.ts`:
- States: `chatting` → `editing_fields` → `creating` → `completed`
- UI: `components/chat/ChatInterface.tsx`
- Preview: `components/preview/LiveIssuePreview.tsx`

## Environment Variables

```bash
# Required for GitHub OAuth
GITHUB_CLIENT_ID=       # From GitHub OAuth App settings
GITHUB_CLIENT_SECRET=   # From GitHub OAuth App settings

# Required for NextAuth
AUTH_SECRET=            # Run: openssl rand -base64 32
NEXTAUTH_URL=           # Your app URL (e.g., http://localhost:3000)

# Required for AI features
OPENAI_API_KEY=         # From OpenAI dashboard
```

## Code Patterns

### Server-Only Code
Files that access secrets use `'server-only'`:
```typescript
import 'server-only';  // Prevents bundling into client JS
```

### Client Components
Components with React hooks use `'use client'`:
```typescript
'use client';
import { useState } from 'react';
```

### API Route Pattern
```typescript
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const body = await request.json();
  // ... handle request
}
```

### Type Imports
Use type-only imports for types:
```typescript
import type { GitHubIssue } from '@/types/github';
```

## When Debugging

1. **Auth issues**: Start with `lib/auth.ts` and `middleware.ts`
2. **API errors**: Check the API route in `app/api/`, then the service file
3. **UI issues**: Check the component and its hook
4. **AI issues**: Check `services/ai-service.ts` and `prompts/`

## Documentation

- `docs/ARCHITECTURE.md` - System overview and data flow
- `docs/AUTH_GUIDE.md` - OAuth debugging guide
- `docs/TROUBLESHOOTING.md` - Common issues and fixes
- `docs/NEXTJS_BASICS.md` - Next.js concepts
- `docs/TYPESCRIPT_BASICS.md` - TypeScript patterns

## Testing Changes

```bash
npm run dev    # Start development server
npm run build  # Check for TypeScript errors
npm run lint   # Check for linting issues
```
