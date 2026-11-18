// lib/auth.ts — authentification provisoire (Phase 0), calquée sur flowmerce-web-app.
// Remplacée par le SSO Flowmerce en Phase 3.
//
// Cookie de session : aucune option `cookies` ici, volontairement. Sans attribut
// `Domain`, le cookie reste limité à l'hôte vendeur et n'est jamais envoyé aux
// sites des vendeurs (§7). Le proxy bloque en plus /api/auth sur ces hôtes.

import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authorizeCredentials } from "@/lib/auth-credentials";
import { env } from "@/lib/env";

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: env.AUTH_SECRET,
  // L'hôte est contrôlé par proxy.ts : l'auth n'est joignable que sur DASHBOARD_HOST.
  trustHost: true,
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" },
      },
      authorize: (credentials) =>
        authorizeCredentials(String(credentials?.email ?? ""), String(credentials?.password ?? "")),
    }),
  ],
  callbacks: {
    session({ session, token }) {
      if (session.user) {
        if (!token.sub) throw new Error("token.sub missing");
        session.user.id = token.sub;
      }
      return session;
    },
  },
});
