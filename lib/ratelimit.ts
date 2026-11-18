// lib/ratelimit.ts — limitation de débit à fenêtre fixe (§4.2, §7).
//
// Pilote local : table RateLimit, incrémentée en une seule requête SQL atomique
// (sûre sous des appels simultanés). Au déploiement, un pilote Redis / Upstash
// gardera la même signature.

import { prisma } from "@/lib/prisma";

/** Compte un appel pour `key` ; vrai s'il reste sous `limit` dans la fenêtre de `windowSeconds`. */
export async function hitRateLimit(key: string, limit: number, windowSeconds: number): Promise<boolean> {
  const rows = await prisma.$queryRaw<{ count: number }[]>`
    INSERT INTO "RateLimit" ("key", "count", "resetAt")
    VALUES (${key}, 1, now() + make_interval(secs => ${windowSeconds}))
    ON CONFLICT ("key") DO UPDATE SET
      "count"   = CASE WHEN "RateLimit"."resetAt" <= now() THEN 1 ELSE "RateLimit"."count" + 1 END,
      "resetAt" = CASE WHEN "RateLimit"."resetAt" <= now() THEN EXCLUDED."resetAt" ELSE "RateLimit"."resetAt" END
    RETURNING "count"`;
  return Number(rows[0]?.count ?? Infinity) <= limit;
}
