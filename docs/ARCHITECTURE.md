# GitHub Dashboard Architecture

This document explains how the application is structured and how data flows through it.

## System Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              BROWSER (Client)                               │
│  ┌─────────────┐  ┌──────────────────┐  ┌────────────────────────────────┐  │
│  │  React UI   │──│  Custom Hooks    │──│  SessionProvider (Auth State)  │  │
│  │  Components │  │  (useCreate...)  │  │                                │  │
│  └─────────────┘  └──────────────────┘  └────────────────────────────────┘  │
│         │                  │                           │                    │
└─────────│──────────────────│───────────────────────────│────────────────────┘
          │ User Actions     │ API Calls                 │ Auth Check
          ▼                  ▼                           ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           NEXT.JS SERVER                                    │
│  ┌──────────────────┐  ┌────────────────────┐  ┌──────────────────────┐    │
│  │   middleware.ts  │──│   API Routes       │──│   lib/auth.ts        │    │
│  │  (Route Guard)   │  │  /api/github/*     │  │   (NextAuth Config)  │    │
│  │                  │  │  /api/chat-issue   │  │                      │    │
│  └──────────────────┘  └────────────────────┘  └──────────────────────┘    │
│                                 │                                           │
│                    ┌────────────┴────────────┐                             │
│                    ▼                         ▼                             │
│         ┌──────────────────┐      ┌──────────────────┐                     │
│         │ github-service.ts│      │  ai-service.ts   │                     │
│         │ (GitHub Logic)   │      │  (AI Logic)      │                     │
│         └──────────────────┘      └──────────────────┘                     │
│                    │                         │                             │
└────────────────────│─────────────────────────│─────────────────────────────┘
                     │                         │
                     ▼                         ▼
              ┌────────────┐            ┌────────────┐
              │  GitHub    │            │  OpenAI    │
              │  REST API  │            │  API       │
              │  GraphQL   │            │            │
              └────────────┘            └────────────┘
```

## Layer Descriptions

### 1. Browser Layer (Client-Side)

**Components** (`/components`)
- React components that render the UI
- Organized by feature: `activity/`, `chat/`, `issues/`, `layout/`, `preview/`, `settings/`, `ui/`
- All components in subdirectories use `'use client'` directive (run in browser)

**Custom Hooks** (`/hooks`)
- Manage complex state and side effects
- `useCreateIssueFlow.ts` - State machine for issue creation
- `useRepositoryIssues.ts` - Fetch and cache issues/PRs
- `useActivitySummaries.ts` - Activity feed with AI summaries

**SessionProvider** (`/components/providers/SessionProvider.tsx`)
- Wraps the app to provide auth state to all components
- Uses NextAuth's `useSession()` hook internally

### 2. Server Layer (Next.js)

**Middleware** (`/middleware.ts`)
- Runs on EVERY request before it reaches API routes or pages
- Checks authentication status
- Redirects unauthorized users to login
- See: [AUTH_GUIDE.md](./AUTH_GUIDE.md) for details

**API Routes** (`/app/api/`)
- Server-side endpoints that handle requests
- Each folder with `route.ts` becomes an API endpoint
- Example: `/app/api/github/issues/route.ts` → `POST /api/github/issues`

**Auth Configuration** (`/lib/auth.ts`)
- NextAuth setup with GitHub OAuth
- Handles login, logout, session management
- See: [AUTH_GUIDE.md](./AUTH_GUIDE.md) for details

### 3. Services Layer (Business Logic)

**GitHub Service** (`/services/github-service.ts`)
- Wraps GitHub REST and GraphQL APIs
- Used by API routes to fetch repos, issues, PRs, projects

**AI Service** (`/services/ai-service.ts`)
- Wraps OpenAI API
- Functions: summarization, prioritization, chat-based issue creation
- Uses prompt templates from `/prompts/`

### 4. External APIs

**GitHub API**
- REST API for issues, PRs, repos
- GraphQL API for GitHub Projects v2 (custom fields)

**OpenAI API**
- GPT-4o-mini for all AI features
- Function calling for structured responses

---

## Request Lifecycle Examples

### Example 1: User Loads Dashboard

```
1. Browser requests /dashboard
2. middleware.ts intercepts:
   - Checks: is user logged in?
   - If NO: redirect to / (login page)
   - If YES: allow request to continue
3. Dashboard page component renders
4. useRepositoryIssues hook triggers
5. Hook calls fetch('/api/github/issues')
6. API route:
   - Gets session (with GitHub token)
   - Calls github-service.ts
   - github-service.ts calls GitHub API
   - Returns issues to client
7. React re-renders with issues data
```

### Example 2: User Creates Issue via Chat

```
1. User types message in ChatInterface
2. useCreateIssueFlow.handleSendMessage() called
3. Hook calls POST /api/chat-issue with:
   - conversation_history
   - user message
   - current preview data
4. API route:
   - Gets session
   - Calls ai-service.chatIssueCreation()
5. ai-service.ts:
   - Loads prompt template
   - Calls OpenAI with tools (update_preview, signal_issue_ready)
   - Parses tool calls
   - Returns { status, preview_data } or { status: 'ready', issue_data }
6. Hook updates state:
   - If 'continue': update livePreviewData, show response
   - If 'ready': set flowState to 'editing_fields'
7. User clicks "Create Issue"
8. Hook calls POST /api/github/issues
9. API route creates issue via github-service.ts
10. Success: flowState → 'completed'
```

### Example 3: OAuth Login Flow

```
1. User clicks "Sign in with GitHub"
2. NextAuth redirects to GitHub OAuth
3. User authorizes app
4. GitHub redirects back with code
5. NextAuth exchanges code for access token
6. jwt() callback stores token in JWT
7. session() callback exposes user info
8. middleware.ts redirects / → /dashboard
```

See [AUTH_GUIDE.md](./AUTH_GUIDE.md) for detailed OAuth explanation.

---

## File-to-Function Mapping

| File | Primary Purpose |
|------|-----------------|
| `lib/auth.ts` | OAuth config, session callbacks, export auth handlers |
| `lib/github.ts` | Create Octokit client, GraphQL queries |
| `lib/openai.ts` | Create OpenAI client, token limits |
| `middleware.ts` | Route protection before requests |
| `services/ai-service.ts` | All AI features (summarize, prioritize, chat) |
| `services/github-service.ts` | All GitHub operations |
| `hooks/useCreateIssueFlow.ts` | Issue creation state machine |
| `hooks/useRepositoryIssues.ts` | Fetch issues/PRs with caching |
| `types/ai.ts` | TypeScript types for AI features |
| `types/github.ts` | TypeScript types for GitHub data |

---

## State Machine: Issue Creation Flow

The `useCreateIssueFlow` hook manages a state machine:

```
┌──────────────┐
│   chatting   │◄──────────────────────────────┐
│ (User chats) │                               │
└──────┬───────┘                               │
       │ AI signals ready                      │ User rejects
       ▼                                       │
┌──────────────────┐                           │
│  editing_fields  │───────────────────────────┘
│ (Config project) │
└──────┬───────────┘
       │ User clicks create
       ▼
┌──────────────┐
│   creating   │
│ (API call)   │
└──────┬───────┘
       │ Success
       ▼
┌──────────────┐
│  completed   │
│ (Show link)  │
└──────────────┘
```

States:
- `chatting` - User describes issue in chat
- `editing_fields` - Issue ready, user configures project/assignees
- `creating` - API call in progress
- `completed` - Issue created, show link

---

## Key Architecture Decisions

### 1. Server-Only Services
Files import `'server-only'` to ensure they only run on the server:
```typescript
import 'server-only';
```
This prevents accidentally bundling sensitive code (API keys, tokens) into client JavaScript.

### 2. JWT Session Strategy
Tokens stored in encrypted JWTs (not database):
- Simpler: No database required
- Secure: Tokens encrypted, never exposed to client
- Stateless: Scales easily

### 3. Tool-Based AI Orchestration
OpenAI function calling returns structured data:
```typescript
tools: [
  { function: { name: 'update_preview', ... } },
  { function: { name: 'signal_issue_ready', ... } }
]
```
This ensures AI responses are parseable, not freeform text.

### 4. Hybrid Readiness Detection
Two-phase check for "user wants to create issue":
1. Fast keyword match (no API call)
2. LLM fallback for nuanced signals

### 5. Dynamic Project Field Discovery
GitHub Projects v2 custom fields fetched at runtime via GraphQL, not hardcoded.

---

## Related Documentation

- [AUTH_GUIDE.md](./AUTH_GUIDE.md) - OAuth flow and debugging
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - Common issues and fixes
- [NEXTJS_BASICS.md](./NEXTJS_BASICS.md) - Next.js concepts
- [TYPESCRIPT_BASICS.md](./TYPESCRIPT_BASICS.md) - TypeScript patterns
