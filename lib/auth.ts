// lib/auth.ts — authentification provisoire (Phase 0), calquée sur flowmerce-web-app.
// Remplacée par le SSO Flowmerce en Phase 3.
//
// Cookies : noms propres, sans attribut `Domain` (lib/session-cookie.ts).
// Ils restent limités à l'hôte vendeur et ne sont jamais envoyés aux sites des
// vendeurs (§7). Le proxy bloque en plus /api/auth sur ces hôtes.

import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authorizeCredentials } from "@/lib/auth-credentials";
import { env } from "@/lib/env";
import { authCookies } from "@/lib/session-cookie";

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: env.AUTH_SECRET,
  // L'espace vendeur est servi avec le même protocole que les sites.
  cookies: authCookies(env.SITES_PROTOCOL),
  // L'hôte est contrôlé par proxy.ts : /api/auth et les server actions (dont
  // loginAction) ne sont joignables que sur DASHBOARD_HOST (lib/routing.ts).
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
