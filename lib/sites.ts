// lib/sites.ts — sites de l'espace vendeur.
// Toujours filtré par le propriétaire du tenant (§7 : isolation par tenant).

import type { SiteStatus, SiteType } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type OwnerSite = {
  id: string;
  name: string;
  subdomain: string;
  type: SiteType;
  status: SiteStatus;
  /** Page d'accueil (slug ""), ou null si elle n'existe pas. */
  homePageId: string | null;
};

export async function listSitesForOwner(ownerUserId: string): Promise<OwnerSite[]> {
  const sites = await prisma.site.findMany({
    where: { tenant: { ownerUserId } },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      subdomain: true,
      type: true,
      status: true,
      pages: { where: { slug: "" }, select: { id: true }, take: 1 },
    },
  });
  return sites.map(({ pages, ...site }) => ({ ...site, homePageId: pages[0]?.id ?? null }));
}
