/**
 * Authentication Configuration
 *
 * This file configures NextAuth.js for GitHub OAuth authentication.
 * It handles login, logout, and session management.
 *
 * Key concepts:
 * - JWT Strategy: Tokens stored in encrypted cookies (no database needed)
 * - Callbacks: Functions that run at specific points in auth lifecycle
 * - Module Augmentation: Extending NextAuth's types with our custom fields
 *
 * Related files:
 * - middleware.ts: Uses auth() for route protection
 * - components/providers/SessionProvider.tsx: Client-side session access
 *
 * @see docs/AUTH_GUIDE.md for detailed OAuth flow explanation
 */

import NextAuth from 'next-auth';
import GitHub from 'next-auth/providers/github';
import type { NextAuthConfig } from 'next-auth';

// =============================================================================
// MODULE AUGMENTATION
// =============================================================================
// TypeScript doesn't know about our custom session fields (accessToken, login).
// Module augmentation "extends" the library's types with our additions.
// This lets TypeScript recognize session.accessToken without errors.

declare module 'next-auth' {
  interface Session {
    // GitHub access token - used for API calls on behalf of the user
    accessToken?: string;
    // User's OpenAI API key (stored in session for AI features)
    openaiApiKey?: string;
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      // GitHub username (e.g., "octocat") - useful for @mentions
      login?: string;
    };
  }
}

declare module '@auth/core/jwt' {
  interface JWT {
    // These fields are stored in the encrypted JWT cookie
    accessToken?: string;
    login?: string;
    openaiApiKey?: string;
  }
}

// =============================================================================
// AUTHENTICATION CONFIGURATION
// =============================================================================

export const authConfig: NextAuthConfig = {
  // ---------------------------------------------------------------------------
  // PROVIDERS
  // ---------------------------------------------------------------------------
  // Configure which authentication methods are available.
  // We use GitHub OAuth - users click "Sign in with GitHub" and authorize.
  providers: [
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      // Note: When using a GitHub App, permissions are configured in the app
      // settings on GitHub, not via OAuth scopes here.
    }),
  ],

  // ---------------------------------------------------------------------------
  // CALLBACKS
  // ---------------------------------------------------------------------------
  // Callbacks are functions that execute at specific points in the auth flow.
  // They let us customize what data is stored and returned.
  callbacks: {
    /**
     * JWT Callback
     *
     * Runs when:
     * 1. User signs in (account/profile available)
     * 2. Session is accessed (only token available)
     * 3. Session is updated (trigger === 'update')
     *
     * The token returned here gets encrypted and stored in a cookie.
     * We store the GitHub access token here so we can use it for API calls.
     */
    async jwt({ token, account, profile, trigger, session }) {
      // On initial sign-in, GitHub returns the access token in 'account'
      // We copy it to our JWT so it persists across requests
      if (account && account.access_token) {
        token.accessToken = account.access_token;
      }

      // Store GitHub username from the profile
      // profile.login is the GitHub username (e.g., "octocat")
      if (profile && 'login' in profile) {
        token.login = profile.login as string;
      }

      // Handle session updates (for storing OpenAI API key from settings)
      // When client calls update({ openaiApiKey: 'sk-...' }), this runs
      if (trigger === 'update' && session?.openaiApiKey !== undefined) {
        token.openaiApiKey = session.openaiApiKey;
      }

      return token;
    },

    /**
     * Session Callback
     *
     * Runs whenever the session is accessed (useSession, auth(), etc.)
     * Copies data from the JWT to the session object.
     *
     * Important: The session object is what components see.
     * The JWT is encrypted and not directly accessible.
     */
    async session({ session, token }) {
      // Copy data from JWT to session so components can access it
      session.accessToken = token.accessToken;
      session.openaiApiKey = token.openaiApiKey;

      if (token.login) {
        session.user.login = token.login;
      }

      // token.sub is the user's unique ID from the provider
      if (token.sub) {
        session.user.id = token.sub;
      }

      return session;
    },

    /**
     * Authorized Callback
     *
     * Runs on every request that matches the middleware matcher.
     * Return false to redirect to login, true to allow access.
     *
     * Note: This is checked by middleware.ts, which uses auth() wrapper.
     */
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;

      // Define which routes require authentication
      const isProtectedRoute =
        request.nextUrl.pathname.startsWith('/dashboard') ||
        request.nextUrl.pathname.startsWith('/api/github') ||
        request.nextUrl.pathname.startsWith('/api/chat-issue') ||
        request.nextUrl.pathname.startsWith('/api/summarize') ||
        request.nextUrl.pathname.startsWith('/api/prioritize');

      // Redirect to login if accessing protected route without auth
      if (isProtectedRoute && !isLoggedIn) {
        return false; // Triggers redirect to pages.signIn
      }

      return true;
    },
  },

  // ---------------------------------------------------------------------------
  // PAGES
  // ---------------------------------------------------------------------------
  // Custom page routes for authentication flows
  pages: {
    signIn: '/',  // Login page (our home page has the sign-in button)
    error: '/',   // Error page (show errors on home page)
  },

  // ---------------------------------------------------------------------------
  // SESSION STRATEGY
  // ---------------------------------------------------------------------------
  // 'jwt' = Store session in encrypted cookie (stateless, no database)
  // 'database' = Store session in database (requires adapter)
  session: {
    strategy: 'jwt',
  },

  // Trust the host header in production
  // Required for reverse proxies like AWS Amplify, Vercel, etc.
  trustHost: true,
};

// =============================================================================
// EXPORTS
// =============================================================================
// NextAuth returns several utilities we can use throughout the app

export const {
  handlers: { GET, POST },  // API route handlers for /api/auth/*
  auth,                      // Get session on server (in API routes, middleware)
  signIn,                    // Trigger sign in programmatically
  signOut,                   // Trigger sign out programmatically
} = NextAuth(authConfig);
