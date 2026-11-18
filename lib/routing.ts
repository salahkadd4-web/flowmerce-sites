// lib/routing.ts — Flowmerce Sites
//
// Décision du proxy, à partir de l'hôte et du chemin seuls (§4.3) : aucune
// requête en base ici. La résolution hôte → site se fait dans la page
// `app/s/[host]/[[...slug]]`, avec cache.

import { isDashboardHost } from "@/lib/dashboard-host";
import { normalizeHost } from "@/lib/host";

export type RouteDecision =
  | { kind: "pass" }
  | { kind: "site"; rewritePath: string }
  | { kind: "not-found" };

function isUnder(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(prefix + "/");
}

const READ_METHODS = new Set(["GET", "HEAD"]);

export function routeRequest(
  input: {
    host: string | null;
    pathname: string;
    search: string;
    method: string;
    /** La requête porte l'en-tête `Next-Action` (appel de server action). */
    isServerAction: boolean;
  },
  cfg: { dashboardHost: string },
): RouteDecision {
  const host = input.host?.trim();
  if (!host) return { kind: "not-found" };

  // Espace vendeur. Le dossier interne des sites n'y est pas accessible :
  // sinon n'importe quel site s'afficherait sous l'hôte vendeur.
  if (isDashboardHost(host, cfg.dashboardHost)) {
    return isUnder(input.pathname, "/s") ? { kind: "not-found" } : { kind: "pass" };
  }

  // Site vendeur. Next exécute un server action d'après l'en-tête `Next-Action`,
  // quelle que soit la page visée : sans ce refus, la connexion et toute action
  // du tableau de bord seraient appelables depuis n'importe quel site vendeur.
  if (input.isServerAction) return { kind: "not-found" };
  // L'authentification n'existe que sur l'hôte vendeur (§7).
  if (isUnder(input.pathname, "/api/auth")) return { kind: "not-found" };
  // Les autres API (commandes COD en Phase 1) sont servies telles quelles.
  if (isUnder(input.pathname, "/api")) return { kind: "pass" };
  // Les pages d'un site sont en lecture seule.
  if (!READ_METHODS.has(input.method.toUpperCase())) return { kind: "not-found" };

  const path = input.pathname === "/" ? "" : input.pathname;
  return {
    kind: "site",
    rewritePath: `/s/${encodeURIComponent(normalizeHost(host))}${path}${input.search}`,
  };
}
