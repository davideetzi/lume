import type { NextAuthConfig } from "next-auth";

/**
 * Configurazione NextAuth Edge-compatibile (no Prisma, no bcrypt).
 * Usata da middleware. La configurazione completa con adapter e providers
 * vive in src/auth.ts e viene caricata dal route handler e dai server
 * components.
 */
export const authConfig = {
  pages: {
    signIn: "/signin",
    newUser: "/onboarding",
  },
  session: { strategy: "jwt" },
  providers: [], // i provider con dipendenze Node sono nel file principale
  callbacks: {
    session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
