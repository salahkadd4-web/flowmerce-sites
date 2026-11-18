// lib/tenant-queries.ts — Flowmerce Sites
//
// Requêtes brutes de résolution hôte → site → page, sans cache : testables
// hors de Next. Les pages passent par lib/tenant.ts, qui les met en cache.

import { getSubdomain, isReservedSubdomain } from "@/lib/host";
import { parsePageContent, type PageContent } from "@/lib/page-content";
import { prisma } from "@/lib/prisma";

export type PublicSite = {
  id: string;
  tenantId: string;
  name: string;
  subdomain: string;
  locale: string;
  theme: unknown;
};

/**
 * Site publié servi sous `host`, ou `null`. Seuls les sous-domaines de
 * `rootDomain` sont reconnus ; les domaines personnalisés (table `Domain`)
 * arrivent en Phase 4.
 */
export async function findPublishedSiteByHost(
  host: string,
  rootDomain: string,
): Promise<PublicSite | null> {
  const subdomain = getSubdomain(host, rootDomain);
  if (!subdomain || isReservedSubdomain(subdomain)) return null;

  return prisma.site.findFirst({
    where: { subdomain, status: "PUBLISHED" },
    select: { id: true, tenantId: true, name: true, subdomain: true, locale: true, theme: true },
  });
}

/**
 * Version publiée de la page `slug` du site, ou `null` (absente, non publiée,
 * invalide, ou site qui n'est plus publié). Le statut du site est revérifié ici :
 * invalider le tag `site:<id>` suffit à retirer toutes les pages d'un site
 * suspendu, même si la résolution de l'hôte est encore en cache.
 */
export async function findPublishedPage(
  siteId: string,
  slug: string,
): Promise<{ title: string; content: PageContent } | null> {
  const page = await prisma.page.findUnique({
    where: { siteId_slug: { siteId, slug } },
    select: { title: true, published: true, site: { select: { status: true } } },
  });
  if (!page || page.published === null || page.site.status !== "PUBLISHED") return null;

  const content = parsePageContent(page.published);
  return content ? { title: page.title, content } : null;
}
