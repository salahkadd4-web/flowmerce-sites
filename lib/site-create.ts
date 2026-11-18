// lib/site-create.ts — création d'un site à partir du modèle de landing page.
//
// Le tenant du vendeur naît avec son premier site (§4.5). Le site est créé en
// brouillon : rien n'est public avant la première publication.

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { validateSubdomain } from "@/lib/subdomain";
import template from "@/templates/landing-fr.json";

type CreateResult =
  | { ok: true; siteId: string; pageId: string }
  | { ok: false; field: "name" | "subdomain"; error: string };

export async function createSiteForUser(
  user: { id: string; name: string | null; email: string },
  input: { name: string; subdomain: string },
): Promise<CreateResult> {
  const name = input.name.trim();
  if (!name) return { ok: false, field: "name", error: "Donnez un nom à votre site" };
  if (name.length > 60) return { ok: false, field: "name", error: "60 caractères maximum" };

  const subdomain = input.subdomain.trim();
  const subdomainError = validateSubdomain(subdomain);
  if (subdomainError) return { ok: false, field: "subdomain", error: subdomainError };

  try {
    return await prisma.$transaction(async (tx) => {
      // upsert : un seul tenant par utilisateur (Tenant.ownerUserId unique).
      const tenant = await tx.tenant.upsert({
        where: { ownerUserId: user.id },
        update: {},
        create: { ownerUserId: user.id, name: user.name ?? user.email },
      });

      const site = await tx.site.create({
        data: { tenantId: tenant.id, type: "LANDING", name, subdomain, theme: {}, locale: "fr" },
      });

      const page = await tx.page.create({
        data: { siteId: site.id, slug: "", title: name, draft: template },
      });

      return { ok: true as const, siteId: site.id, pageId: page.id };
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { ok: false, field: "subdomain", error: "Ce sous-domaine est déjà pris" };
    }
    throw error;
  }
}
