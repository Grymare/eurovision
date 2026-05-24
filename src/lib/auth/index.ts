import { db } from "@/db";
import { accounts, sessions, users, verificationTokens } from "@/db/schema";
import { AUTH_INTENT_COOKIE } from "@/lib/auth/constants";
import { getUserByEmail, verifyUserPassword } from "@/lib/auth/users";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import NextAuth, { type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import Nodemailer from "next-auth/providers/nodemailer";
import { cookies } from "next/headers";

const authConfig = {
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  providers: [
    Credentials({
      name: "Email and password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const email = credentials?.email;
        const password = credentials?.password;

        if (typeof email !== "string" || typeof password !== "string") {
          return null;
        }

        return verifyUserPassword(email, password);
      },
    }),
    ...(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET ?
      [
        Google({
          allowDangerousEmailAccountLinking: true,
        }),
      ]
    : []),
    ...(process.env.EMAIL_SERVER && process.env.EMAIL_FROM ?
      [
        Nodemailer({
          server: process.env.EMAIL_SERVER,
          from: process.env.EMAIL_FROM,
        }),
      ]
    : []),
  ],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/auth/login",
  },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider !== "google") {
        return true;
      }

      const email = user.email;

      if (!email) {
        return false;
      }

      const existing = await getUserByEmail(email);
      const cookieStore = await cookies();
      const intent = cookieStore.get(AUTH_INTENT_COOKIE)?.value;
      cookieStore.delete(AUTH_INTENT_COOKIE);

      if (intent === "login" && !existing) {
        return "/auth/login?error=no_account";
      }

      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.name = user.name;
        token.email = user.email;
      }

      return token;
    },
    session({ session, token }) {
      if (session.user) {
        if (token.sub) {
          session.user.id = token.sub;
        }

        if (typeof token.name === "string") {
          session.user.name = token.name;
        }

        if (typeof token.email === "string") {
          session.user.email = token.email;
        }
      }

      return session;
    },
  },
  trustHost: true,
} satisfies NextAuthConfig;

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
