import NextAuth from 'next-auth';
import GitHub from 'next-auth/providers/github';
import type { NextAuthConfig } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    accessToken?: string;
    openaiApiKey?: string;
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      login?: string;
    };
  }
}

declare module '@auth/core/jwt' {
  interface JWT {
    accessToken?: string;
    login?: string;
    openaiApiKey?: string;
  }
}

export const authConfig: NextAuthConfig = {
  providers: [
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      // When using a GitHub App, permissions are configured in the app settings
      // not via OAuth scopes. Leave authorization empty to use app-configured permissions.
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile, trigger, session }) {
      // Store GitHub access token in JWT on initial sign in
      if (account && account.access_token) {
        token.accessToken = account.access_token;
      }
      // Store GitHub username
      if (profile && 'login' in profile) {
        token.login = profile.login as string;
      }
      // Handle session updates (for storing OpenAI API key)
      if (trigger === 'update' && session?.openaiApiKey !== undefined) {
        token.openaiApiKey = session.openaiApiKey;
      }
      return token;
    },
    async session({ session, token }) {
      // Pass access token and login to the client session
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
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const isProtectedRoute =
        request.nextUrl.pathname.startsWith('/dashboard') ||
        request.nextUrl.pathname.startsWith('/api/github') ||
        request.nextUrl.pathname.startsWith('/api/chat-issue') ||
        request.nextUrl.pathname.startsWith('/api/summarize') ||
        request.nextUrl.pathname.startsWith('/api/prioritize');

      if (isProtectedRoute && !isLoggedIn) {
        return false; // Redirect to login
      }
      return true;
    },
  },
  pages: {
    signIn: '/',
    error: '/',
  },
  session: {
    strategy: 'jwt',
  },
};

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth(authConfig);
