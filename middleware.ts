/**
 * Route Protection Middleware
 *
 * This middleware runs BEFORE every request that matches the 'matcher' config.
 * It protects routes by checking authentication status and redirecting as needed.
 *
 * How it works:
 * 1. Request comes in (e.g., user navigates to /dashboard)
 * 2. Next.js checks if URL matches the 'matcher' patterns
 * 3. If matched, this middleware runs BEFORE the page loads
 * 4. We check auth status and either allow, redirect, or block
 *
 * Related files:
 * - lib/auth.ts: Provides the auth() wrapper and configuration
 * - components/providers/SessionProvider.tsx: Client-side session
 *
 * @see docs/AUTH_GUIDE.md for detailed explanation
 */

import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

/**
 * The auth() wrapper injects authentication info into the request.
 * req.auth contains the session if user is logged in, undefined otherwise.
 */
export default auth((req) => {
  // Check if user is logged in by looking for a user object in auth
  const isLoggedIn = !!req.auth?.user;
  const { pathname } = req.nextUrl;

  // ---------------------------------------------------------------------------
  // PROTECTED ROUTES
  // ---------------------------------------------------------------------------
  // These routes require the user to be logged in.
  // If not logged in, redirect to login page with a callback URL.
  const isProtectedRoute =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/api/github') ||
    pathname.startsWith('/api/chat-issue') ||
    pathname.startsWith('/api/summarize') ||
    pathname.startsWith('/api/prioritize');

  // Redirect unauthenticated users to login page
  if (isProtectedRoute && !isLoggedIn) {
    // Build login URL with callback so user returns here after login
    const loginUrl = new URL('/', req.nextUrl.origin);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ---------------------------------------------------------------------------
  // AUTO-REDIRECT LOGGED-IN USERS
  // ---------------------------------------------------------------------------
  // If user is already logged in and visits the home page (login page),
  // redirect them straight to the dashboard.
  if (pathname === '/' && isLoggedIn) {
    return NextResponse.redirect(new URL('/dashboard', req.nextUrl.origin));
  }

  // ---------------------------------------------------------------------------
  // ALLOW REQUEST
  // ---------------------------------------------------------------------------
  // If none of the above conditions matched, allow the request to proceed
  return NextResponse.next();
});

/**
 * Matcher Configuration
 *
 * Only run middleware on these paths. This is a performance optimization -
 * we don't want to run auth checks on every static asset, image, etc.
 *
 * Pattern syntax:
 * - '/dashboard/:path*' matches /dashboard and ALL sub-paths
 *   (e.g., /dashboard, /dashboard/settings, /dashboard/issues/123)
 * - '/api/github/:path*' matches /api/github and ALL sub-paths
 * - '/' matches only the home page exactly
 *
 * Note: API routes that don't need auth (like /api/auth/*) are NOT in matcher,
 * so they won't run through this middleware.
 */
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
