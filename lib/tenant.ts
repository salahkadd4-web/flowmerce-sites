// lib/tenant.ts — Flowmerce Sites
//
// Résolution hôte → site et lecture des pages, mises en cache (§4.3, étape 4).
// Les tags permettent d'invalider à la publication (Phase 1) et au changement
// de domaine (Phase 4) : revalidateTag(siteHostTag(host), "max").
//
// `unstable_cache` garde aussi les `null` (hôte inconnu, page absente). Sans
// limite, un site créé après une première visite resterait introuvable tant
// qu'aucun tag n'est invalidé : CACHE_SECONDS borne cette durée.

import { unstable_cache } from "next/cache";
import { env } from "@/lib/env";
import { normalizeHost } from "@/lib/host";
import { findPublishedPage, findPublishedSiteByHost } from "@/lib/tenant-queries";

const CACHE_SECONDS = 300;

export function siteHostTag(host: string): string {
  return "site-host:" + normalizeHost(host);
}

export function sitePagesTag(siteId: string): string {
  return "site-pages:" + siteId;
}

/**
 * Tout ce qui dépend du site (pages comprises). L'invalider retire d'un coup un
 * site suspendu : findPublishedPage revérifie son statut.
 */
export function siteTag(siteId: string): string {
  return "site:" + siteId;
}

export function getSiteByHost(host: string) {
  const normalized = normalizeHost(host);
  return unstable_cache(
    () => findPublishedSiteByHost(normalized, env.SITES_ROOT_DOMAIN),
    ["site-by-host", normalized],
    { tags: [siteHostTag(normalized)], revalidate: CACHE_SECONDS },
  )();
}

export function getPage(siteId: string, slug: string) {
  return unstable_cache(
    () => findPublishedPage(siteId, slug),
    ["page", siteId, slug],
    { tags: [sitePagesTag(siteId), siteTag(siteId)], revalidate: CACHE_SECONDS },
  )();
}
