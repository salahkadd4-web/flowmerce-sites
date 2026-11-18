// lib/host.ts — Flowmerce Sites
//
// Fonctions pures sur les noms d'hôte : aucune dépendance à `env` ni à la base,
// pour pouvoir servir dans le proxy comme dans les pages, et être testées seules.

/** Sous-domaines qu'aucun vendeur ne peut prendre (§4.3). */
export const RESERVED_SUBDOMAINS: ReadonlySet<string> = new Set([
  "app", "api", "www", "admin", "mail", "sites", "dashboard", "static",
  "cdn", "assets", "help", "support", "status", "blog", "docs", "s",
]);

/** `"TEST.Localhost:3000."` → `"test.localhost"` : minuscules, sans port ni point final. */
export function normalizeHost(host: string): string {
  return host.trim().toLowerCase().replace(/:\d+$/, "").replace(/\.$/, "");
}

/**
 * L'étiquette unique placée devant `rootDomain`, ou `null` : hôte égal à la
 * racine, sous-domaine imbriqué (`a.b.racine`) ou autre domaine.
 */
export function getSubdomain(host: string, rootDomain: string): string | null {
  const normalized = normalizeHost(host);
  const suffix = "." + normalizeHost(rootDomain);
  if (!normalized.endsWith(suffix)) return null;
  const label = normalized.slice(0, -suffix.length);
  if (label === "" || label.includes(".")) return null;
  return label;
}

export function isReservedSubdomain(label: string): boolean {
  return RESERVED_SUBDOMAINS.has(label.toLowerCase());
}

/** Adresse publique d'un site, telle qu'affichée au vendeur. */
export function siteUrl(
  subdomain: string,
  cfg: { rootDomain: string; protocol: "http" | "https"; port?: string },
): string {
  const port = cfg.port ? `:${cfg.port}` : "";
  return `${cfg.protocol}://${subdomain}.${cfg.rootDomain}${port}`;
}
