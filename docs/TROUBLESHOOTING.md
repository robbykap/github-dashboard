# Troubleshooting Guide

Quick solutions for common issues in the GitHub Dashboard.

## Authentication Errors

### Symptom: Can't log in / "Sign in with GitHub" does nothing

**Check:**
1. Environment variables set correctly?
   ```bash
   # In .env.local:
   GITHUB_CLIENT_ID=your_id
   GITHUB_CLIENT_SECRET=your_secret
   AUTH_SECRET=generated_secret
   NEXTAUTH_URL=http://localhost:3000
   ```
2. Did you restart the dev server after changing `.env.local`?
3. GitHub OAuth callback URL matches exactly?

**Debug:**
```typescript
// Add to lib/auth.ts temporarily:
console.log('ENV CHECK:', {
  clientId: process.env.GITHUB_CLIENT_ID,
  hasSecret: !!process.env.GITHUB_CLIENT_SECRET,
  authSecret: !!process.env.AUTH_SECRET,
  nextauthUrl: process.env.NEXTAUTH_URL
});
```

### Symptom: 401 Unauthorized on API calls

**Cause**: Session not available or token missing.

**Check:**
1. Are you logged in? Check for `authjs.session-token` cookie in DevTools.
2. Is the route protected by middleware? See `middleware.ts` matcher.

**Debug in API route:**
```typescript
export async function GET() {
  const session = await auth();
  console.log('Session:', session);
  console.log('Token:', session?.accessToken);
  // ...
}
```

### Symptom: Redirect loop (keeps bouncing between pages)

**Cause**: Middleware logic conflict.

**Fix**: Add logging to see what's happening:
```typescript
// In middleware.ts:
export default auth((req) => {
  console.log('PATH:', req.nextUrl.pathname, 'AUTH:', !!req.auth?.user);
  // ...
});
```

### Symptom: "redirect_uri_mismatch" error

**Fix**: Update GitHub OAuth App settings:
- **Local**: `http://localhost:3000/api/auth/callback/github`
- **Production**: `https://your-domain.com/api/auth/callback/github`

No trailing slash. Exact match required.

---

## API Errors

### Symptom: 403 Forbidden from GitHub API

**Cause**: Rate limit hit or insufficient permissions.

**Check:**
1. Rate limit: GitHub allows 5000 requests/hour for authenticated users
2. Permissions: Check GitHub App/OAuth App permissions

**Debug:**
```typescript
// In github-service.ts:
try {
  const response = await octokit.rest.repos.listForAuthenticatedUser();
} catch (error) {
  console.log('GitHub Error:', error.status, error.message);
  if (error.status === 403) {
    console.log('Rate limit remaining:', error.response?.headers['x-ratelimit-remaining']);
  }
}
```

### Symptom: 404 Not Found on GitHub API calls

**Cause**: Repo doesn't exist, or user doesn't have access.

**Check:**
```typescript
// Make sure repo format is correct: "owner/repo"
const [owner, repo] = repoFullName.split('/');
console.log('Fetching:', { owner, repo });
```

### Symptom: 500 Internal Server Error

**Debug**: Check server logs in terminal where `npm run dev` is running.

**Common causes:**
1. Missing environment variable
2. JSON parse error (API returned non-JSON)
3. Type error (accessing property of undefined)

**Add try-catch:**
```typescript
try {
  const data = await someApiCall();
  return NextResponse.json(data);
} catch (error) {
  console.error('API Error:', error);
  return NextResponse.json(
    { error: error instanceof Error ? error.message : 'Unknown error' },
    { status: 500 }
  );
}
```

---

## AI Features Not Working

### Symptom: AI features return errors or no response

**Check:**
1. OpenAI API key set in settings or environment?
2. Key has credits? Check OpenAI dashboard.

**Debug in ai-service.ts:**
```typescript
export async function summarizeIssue(title, body, apiKey) {
  console.log('API Key provided:', !!apiKey);
  console.log('API Key length:', apiKey?.length);
  // ...
}
```

### Symptom: Chat issue creation doesn't update preview

**Check:**
1. Open DevTools Network tab
2. Look for POST to `/api/chat-issue`
3. Check response body for `preview_data`

**Debug in useCreateIssueFlow.ts:**
```typescript
const data = await res.json();
console.log('Chat response:', data);
console.log('Preview data:', data.preview_data);
```

### Symptom: AI says "I'm thinking..." but never responds

**Cause**: OpenAI API call failing silently.

**Check server logs** - look for errors from `ai-service.ts`.

---

## Build / TypeScript Errors

### Symptom: `npm run build` fails with type errors

**Common fixes:**

1. **Missing types**: Add type annotations
   ```typescript
   // Before (error):
   const items = [];
   // After (fixed):
   const items: GitHubIssue[] = [];
   ```

2. **Optional chaining**: Access potentially undefined properties safely
   ```typescript
   // Before (error):
   user.login
   // After (fixed):
   user?.login
   ```

3. **Type assertion**: When you know the type better than TypeScript
   ```typescript
   const value = data.field as string;
   ```

### Symptom: "Module not found" errors

**Check:**
1. File exists at the import path?
2. Using correct alias? (`@/` maps to project root)
3. File has correct extension? (`.ts` vs `.tsx`)

```typescript
// Correct import with alias:
import { auth } from '@/lib/auth';

// Incorrect (will fail):
import { auth } from 'lib/auth';
```

### Symptom: "Cannot use import statement outside a module"

**Cause**: Server code imported in client component.

**Fix**: Add `'use client'` at top of file if using React hooks, OR move server code to API route.

---

## UI / Component Issues

### Symptom: Component not rendering

**Check:**
1. Component exported correctly?
2. `'use client'` directive present for interactive components?
3. Check browser console for errors

### Symptom: State not updating

**Common issues:**

1. **Not using state setter correctly:**
   ```typescript
   // Wrong:
   items.push(newItem);
   // Correct:
   setItems([...items, newItem]);
   ```

2. **Stale closure:**
   ```typescript
   // Add dependency to useEffect/useCallback
   useEffect(() => {
     // ...
   }, [dependency]); // <-- Add missing dependencies
   ```

### Symptom: Infinite re-renders

**Cause**: State update in render or missing useEffect dependencies.

**Debug:**
```typescript
console.log('Rendering MyComponent', { prop1, state1 });
```

---

## Where to Add Console Logs

### For Auth Issues
```
lib/auth.ts          → jwt() and session() callbacks
middleware.ts        → auth wrapper function
```

### For API Issues
```
app/api/*/route.ts   → At start of handler, after session check
services/*.ts        → Before/after external API calls
```

### For UI Issues
```
hooks/use*.ts        → In handlers, in useEffect callbacks
components/*.tsx     → At top of component function
```

### For AI Issues
```
services/ai-service.ts   → Before/after OpenAI calls
hooks/useCreateIssueFlow.ts → In handleSendMessage response handling
```

---

## Quick Diagnostic Commands

```bash
# Check if env vars are loaded
node -e "console.log(process.env.GITHUB_CLIENT_ID)"

# Run type check
npm run build

# Check for lint errors
npm run lint

# Clear Next.js cache
rm -rf .next

# Clear node_modules and reinstall
rm -rf node_modules && npm install
```

---

## Getting More Help

1. **Check the documentation:**
   - [ARCHITECTURE.md](./ARCHITECTURE.md) - How the app works
   - [AUTH_GUIDE.md](./AUTH_GUIDE.md) - OAuth deep dive
   - [NEXTJS_BASICS.md](./NEXTJS_BASICS.md) - Next.js patterns
   - [TYPESCRIPT_BASICS.md](./TYPESCRIPT_BASICS.md) - Type patterns

2. **Search the codebase:**
   - Use grep/search for error messages
   - Check similar functionality for patterns

3. **Check external docs:**
   - [NextAuth.js docs](https://authjs.dev/)
   - [Next.js docs](https://nextjs.org/docs)
   - [OpenAI API docs](https://platform.openai.com/docs)
   - [GitHub API docs](https://docs.github.com/en/rest)
