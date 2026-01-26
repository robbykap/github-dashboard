# GitHub Dashboard Documentation

Welcome to the GitHub Dashboard documentation. This guide will help you understand, debug, and maintain the application.

## Quick Start

1. **New to the codebase?** Start with [ARCHITECTURE.md](./ARCHITECTURE.md)
2. **Having auth issues?** See [AUTH_GUIDE.md](./AUTH_GUIDE.md)
3. **Something broken?** Check [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
4. **New to Next.js?** Read [NEXTJS_BASICS.md](./NEXTJS_BASICS.md)
5. **New to TypeScript?** Read [TYPESCRIPT_BASICS.md](./TYPESCRIPT_BASICS.md)

## Documentation Index

| Document | Description | Read When... |
|----------|-------------|--------------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | System overview, data flow, file structure | You want to understand how parts connect |
| [AUTH_GUIDE.md](./AUTH_GUIDE.md) | OAuth flow, debugging auth issues | Login isn't working, getting 401 errors |
| [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) | Common problems and solutions | Something is broken |
| [NEXTJS_BASICS.md](./NEXTJS_BASICS.md) | Next.js concepts used in this app | Confused by App Router, middleware, etc. |
| [TYPESCRIPT_BASICS.md](./TYPESCRIPT_BASICS.md) | TypeScript patterns explained | Confused by types, interfaces, generics |

## Project Structure At-a-Glance

```
github-dashboard/
├── lib/                 # Core config (auth, github, openai)
├── services/            # Business logic (AI, GitHub operations)
├── hooks/               # React state management
├── components/          # UI components by feature
├── types/               # TypeScript definitions
├── prompts/             # AI prompt templates
├── app/api/             # API route handlers
└── docs/                # You are here
```

## Common Tasks

### I need to fix authentication
1. Read [AUTH_GUIDE.md](./AUTH_GUIDE.md)
2. Check environment variables
3. Verify GitHub OAuth App settings

### I need to understand how data flows
1. Read [ARCHITECTURE.md](./ARCHITECTURE.md)
2. Look at the request lifecycle diagrams
3. Trace through the file-to-function mapping

### I need to add a new feature
1. Understand the architecture: [ARCHITECTURE.md](./ARCHITECTURE.md)
2. Create components in `components/`
3. Add API routes in `app/api/`
4. Add types in `types/`

### I need to modify AI behavior
1. Edit prompts in `prompts/`
2. Or modify logic in `services/ai-service.ts`

### I need to debug an error
1. Check [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
2. Add console.logs (locations listed in troubleshooting)
3. Check browser DevTools and server logs

## Environment Setup

Required environment variables (in `.env.local`):

```bash
# GitHub OAuth
GITHUB_CLIENT_ID=your_client_id
GITHUB_CLIENT_SECRET=your_client_secret

# NextAuth
AUTH_SECRET=your_generated_secret    # openssl rand -base64 32
NEXTAUTH_URL=http://localhost:3000

# AI Features
OPENAI_API_KEY=your_openai_key
```

## Running the App

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run linter
npm run lint
```

## Getting Help with Claude Code

The `/CLAUDE.md` file at the project root contains context for Claude Code. When asking Claude for help:

1. Reference specific files when possible
2. Describe the error or behavior you're seeing
3. Mention what you've already tried

Example prompt:
> "I'm getting a 401 error when calling /api/github/issues. I've checked that I'm logged in. Can you help me debug why the token might not be reaching the API route?"

## File Quick Reference

| Need to... | Look at... |
|------------|------------|
| Fix auth | `lib/auth.ts`, `middleware.ts` |
| Fix API | `app/api/[endpoint]/route.ts` |
| Fix AI | `services/ai-service.ts`, `prompts/` |
| Fix UI | `components/[feature]/` |
| Add types | `types/ai.ts` or `types/github.ts` |
| Fix state | `hooks/use*.ts` |
