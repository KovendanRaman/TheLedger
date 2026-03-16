import type { NextAuthConfig } from "next-auth";

/**
 * Minimal Auth.js config that is safe to run in the Next.js Edge Runtime.
 * It contains NO Node.js-only imports (no bcrypt, no Drizzle DB).
 * The full config (auth/index.ts) extends this with the Credentials provider.
 */
export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt" },
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    session({ session, token }) {
      if (token.id) session.user.id = token.id as string;
      return session;
    },
  },
};
