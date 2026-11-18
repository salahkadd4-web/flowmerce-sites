// lib/pages.ts — pages vues depuis l'espace vendeur : accès, brouillon, publication.
//
// Toute lecture et toute écriture passe par le contrôle de propriété
// (site.tenant.ownerUserId). Une page d'un autre vendeur répond exactement
// comme une page inexistante : aucune fuite d'existence.

import type { Prisma, SiteStatus } from "@prisma/client";
import { validatePageContent } from "@/lib/page-content";
import { prisma } from "@/lib/prisma";

const NOT_FOUND = { ok: false as const, error: "Page introuvable" };

export type OwnedPage = {
  id: string;
  title: string;
  draft: Prisma.JsonValue;
  published: Prisma.JsonValue | null;
  site: { id: string; tenantId: string; name: string; subdomain: string; status: SiteStatus };
};

export function findOwnedPage(userId: string, pageId: string): Promise<OwnedPage | null> {
  return prisma.page.findFirst({
    where: { id: pageId, site: { tenant: { ownerUserId: userId } } },
    select: {
      id: true,
      title: true,
      draft: true,
      published: true,
      site: { select: { id: true, tenantId: true, name: true, subdomain: true, status: true } },
    },
  });
}

export async function saveDraftForUser(
  userId: string,
  pageId: string,
  data: unknown,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const page = await findOwnedPage(userId, pageId);
  if (!page) return NOT_FOUND;

  const valid = validatePageContent(data);
  if (!valid.ok) return valid;

  await prisma.page.update({
    where: { id: page.id },
    data: { draft: valid.content as Prisma.InputJsonValue },
  });
  return { ok: true };
}

export async function publishPageForUser(
  userId: string,
  pageId: string,
  data: unknown,
): Promise<{ ok: true; siteId: string; subdomain: string } | { ok: false; error: string }> {
  const page = await findOwnedPage(userId, pageId);
  if (!page) return NOT_FOUND;
  // Publier ne doit jamais lever une suspension.
  if (page.site.status === "SUSPENDED") return { ok: false, error: "Ce site est suspendu" };

  const valid = validatePageContent(data);
  if (!valid.ok) return valid;
  const content = valid.content as Prisma.InputJsonValue;

  await prisma.$transaction([
    prisma.page.update({ where: { id: page.id }, data: { draft: content, published: content } }),
    prisma.pageVersion.create({ data: { pageId: page.id, content } }),
    // Brouillon → en ligne à la première publication ; la condition sur le statut
    // évite de rouvrir un site suspendu entre la lecture et l'écriture.
    prisma.site.updateMany({ where: { id: page.site.id, status: "DRAFT" }, data: { status: "PUBLISHED" } }),
  ]);
  return { ok: true, siteId: page.site.id, subdomain: page.site.subdomain };
}
