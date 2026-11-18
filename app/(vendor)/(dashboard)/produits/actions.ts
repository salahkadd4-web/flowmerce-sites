"use server";

import { updateTag } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { isDashboardHost } from "@/lib/dashboard-host";
import { env } from "@/lib/env";
import { productsTag } from "@/lib/product-input";
import { prisma } from "@/lib/prisma";
import { createProductForUser, updateProductForUser } from "@/lib/products";

export type SaveProductState = { field?: string; error?: string };

export async function saveProduct(productId: unknown, input: unknown): Promise<SaveProductState> {
  // Seconde barrière derrière proxy.ts : jamais d'action vendeur depuis un site.
  if (!isDashboardHost((await headers()).get("host"), env.DASHBOARD_HOST)) {
    throw new Error("saveProduct appelée hors de l'hôte vendeur");
  }
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (productId !== null && typeof productId !== "string") return { error: "Produit introuvable" };

  const result = productId
    ? await updateProductForUser(session.user.id, productId, input)
    : await createProductForUser(session.user.id, input);
  if (!result.ok) return { field: result.field, error: result.error };

  // Les landing pages qui montrent ce produit se mettent à jour tout de suite.
  const tenant = await prisma.tenant.findUnique({ where: { ownerUserId: session.user.id }, select: { id: true } });
  if (tenant) updateTag(productsTag(tenant.id));

  redirect("/produits");
}
