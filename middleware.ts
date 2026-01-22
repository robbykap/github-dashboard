import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

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
