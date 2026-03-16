import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { db } from "@/backend/lib/db";
import { users } from "@/backend/lib/db/schema";

// Extend Auth.js types so session.user.id is always present
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
    };
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const result = await db
          .select()
          .from(users)
          .where(eq(users.email, String(credentials.email)))
          .limit(1);

        const user = result[0];
        if (!user) return null;

        const valid = await bcrypt.compare(
          String(credentials.password),
          user.passwordHash
        );
        if (!valid) return null;

        return { id: user.id, email: user.email, name: user.fullName };
      },
    }),
  ],

  session: { strategy: "jwt" },

  pages: {
    signIn: "/login",
  },

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
});
