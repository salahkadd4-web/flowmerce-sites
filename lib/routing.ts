// lib/routing.ts — Flowmerce Sites
//
// Décision du proxy, à partir de l'hôte et du chemin seuls (§4.3) : aucune
// requête en base ici. La résolution hôte → site se fait dans la page
// `app/s/[host]/[[...slug]]`, avec cache.

import { normalizeHost } from "@/lib/host";

export type RouteDecision =
  | { kind: "pass" }
  | { kind: "site"; rewritePath: string }
  | { kind: "not-found" };

function isUnder(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(prefix + "/");
}

export function routeRequest(
  input: { host: string | null; pathname: string; search: string },
  cfg: { dashboardHost: string },
): RouteDecision {
  const host = input.host?.trim();
  if (!host) return { kind: "not-found" };

  // Espace vendeur. Le dossier interne des sites n'y est pas accessible :
  // sinon n'importe quel site s'afficherait sous l'hôte vendeur.
  if (host.toLowerCase() === cfg.dashboardHost.toLowerCase()) {
    return isUnder(input.pathname, "/s") ? { kind: "not-found" } : { kind: "pass" };
  }

  // Site vendeur. L'authentification n'existe que sur l'hôte vendeur (§7).
  if (isUnder(input.pathname, "/api/auth")) return { kind: "not-found" };
  // Les autres API (commandes COD en Phase 1) sont servies telles quelles.
  if (isUnder(input.pathname, "/api")) return { kind: "pass" };

  const path = input.pathname === "/" ? "" : input.pathname;
  return {
    kind: "site",
    rewritePath: `/s/${encodeURIComponent(normalizeHost(host))}${path}${input.search}`,
  };
}
