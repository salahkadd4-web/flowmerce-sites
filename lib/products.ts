// lib/products.ts — catalogue du vendeur (§2.4), toujours filtré par le propriétaire.

import type { Prisma } from "@prisma/client";
import type { MediaValue } from "@/blocks/shared";
import { buildVariants, productInputSchema, variantKey, type ProductInput } from "@/lib/product-input";
import { prisma } from "@/lib/prisma";

type SaveResult = { ok: true; productId: string } | { ok: false; field?: string; error: string };

const NOT_FOUND = { ok: false as const, error: "Produit introuvable" };

function parse(input: unknown): { ok: true; data: ProductInput } | { ok: false; field?: string; error: string } {
  const result = productInputSchema.safeParse(input);
  if (result.success) return { ok: true, data: result.data };
  const issue = result.error.issues[0];
  return { ok: false, field: issue?.path[0] ? String(issue.path[0]) : undefined, error: issue?.message ?? "Produit invalide" };
}

function productData(data: ProductInput) {
  return {
    name: data.name,
    description: data.description,
    price: data.price,
    comparePrice: data.comparePrice,
    images: data.images as Prisma.InputJsonValue,
    optionAxes: data.optionAxes as Prisma.InputJsonValue,
    active: data.active,
  };
}

export async function createProductForUser(userId: string, input: unknown): Promise<SaveResult> {
  const tenant = await prisma.tenant.findUnique({ where: { ownerUserId: userId }, select: { id: true } });
  if (!tenant) return { ok: false, error: "Créez d'abord un site" };

  const parsed = parse(input);
  if (!parsed.ok) return parsed;
  const { data } = parsed;

  const product = await prisma.product.create({
    data: {
      ...productData(data),
      tenantId: tenant.id,
      variants: {
        create: buildVariants(data.optionAxes).map((options) => ({ options, stock: data.stocks[variantKey(options)] ?? 0 })),
      },
    },
    select: { id: true },
  });
  return { ok: true, productId: product.id };
}

export async function updateProductForUser(userId: string, productId: string, input: unknown): Promise<SaveResult> {
  const existing = await findOwnedProduct(userId, productId);
  if (!existing) return NOT_FOUND;

  const parsed = parse(input);
  if (!parsed.ok) return parsed;
  const { data } = parsed;

  // Variantes rapprochées par leur clé : conservées (stock mis à jour), créées ou
  // supprimées. Les lignes de commande gardent leur copie (variantId passe à null).
  const wanted = new Map(buildVariants(data.optionAxes).map((options) => [variantKey(options), options]));
  const current = new Map(existing.variants.map((v) => [variantKey(v.options as Record<string, string>), v]));

  await prisma.$transaction([
    prisma.product.update({ where: { id: productId }, data: productData(data) }),
    prisma.variant.deleteMany({
      where: { productId, id: { in: [...current].filter(([key]) => !wanted.has(key)).map(([, v]) => v.id) } },
    }),
    ...[...wanted].map(([key, options]) => {
      const stock = data.stocks[key] ?? 0;
      const found = current.get(key);
      return found
        ? prisma.variant.update({ where: { id: found.id }, data: { stock } })
        : prisma.variant.create({ data: { productId, options, stock } });
    }),
  ]);
  return { ok: true, productId };
}

export function findOwnedProduct(userId: string, productId: string) {
  return prisma.product.findFirst({
    where: { id: productId, tenant: { ownerUserId: userId } },
    include: { variants: true },
  });
}

export async function listProductsForOwner(userId: string): Promise<
  { id: string; name: string; price: number; image: MediaValue | null; totalStock: number; active: boolean }[]
> {
  const products = await prisma.product.findMany({
    where: { tenant: { ownerUserId: userId } },
    orderBy: { createdAt: "desc" },
    include: { variants: { select: { stock: true } } },
  });
  return products.map((p) => ({
    id: p.id,
    name: p.name,
    price: p.price,
    image: ((p.images as MediaValue[] | null) ?? [])[0] ?? null,
    totalStock: p.variants.reduce((sum, v) => sum + v.stock, 0),
    active: p.active,
  }));
}

/** Produits actifs du vendeur, avec variantes : pour l'éditeur (choix du produit de la page). */
export function listActiveProductsWithVariants(userId: string) {
  return prisma.product.findMany({
    where: { tenant: { ownerUserId: userId }, active: true },
    orderBy: { createdAt: "desc" },
    include: { variants: true },
  });
}
