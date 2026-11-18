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
};

export function listSitesForOwner(ownerUserId: string): Promise<OwnerSite[]> {
  return prisma.site.findMany({
    where: { tenant: { ownerUserId } },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, subdomain: true, type: true, status: true },
  });
}
