// lib/shipping.ts — frais de livraison d'un site par wilaya (§2.4).
// Une wilaya sans ligne n'est pas desservie : le formulaire ne la propose pas.

import { z } from "zod";
import { WILAYAS, wilayaName } from "@/lib/algeria/wilayas";
import { prisma } from "@/lib/prisma";

const price = z.number().int().min(0).max(100_000);

export const shippingInputSchema = z
  .array(
    z
      .object({ wilayaCode: z.number().int().min(1).max(69), home: price.nullable(), office: price.nullable() })
      .refine((r) => r.home !== null || r.office === null, "Prix bureau sans prix domicile"),
  )
  .max(69)
  .refine((rows) => new Set(rows.map((r) => r.wilayaCode)).size === rows.length, "Wilaya en double");

export type ShippingRow = { wilayaCode: number; name: string; home: number | null; office: number | null };
export type ShippingOption = { wilayaCode: number; name: string; home: number; office: number | null };

export function shippingTag(siteId: string): string {
  return "site-shipping:" + siteId;
}

export function findOwnedSite(userId: string, siteId: string) {
  return prisma.site.findFirst({
    where: { id: siteId, tenant: { ownerUserId: userId } },
    select: { id: true, name: true, subdomain: true, status: true, tenantId: true },
  });
}

/** Les 69 wilayas avec les frais du site (null = non desservie), ou null si le site n'est pas au vendeur. */
export async function getShippingTable(userId: string, siteId: string): Promise<ShippingRow[] | null> {
  const site = await findOwnedSite(userId, siteId);
  if (!site) return null;
  const rates = new Map((await prisma.shippingRate.findMany({ where: { siteId } })).map((r) => [r.wilayaCode, r]));
  return WILAYAS.map((w) => ({
    wilayaCode: w.code,
    name: w.fr,
    home: rates.get(w.code)?.home ?? null,
    office: rates.get(w.code)?.office ?? null,
  }));
}

export async function saveShippingForUser(
  userId: string,
  siteId: string,
  input: unknown,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const site = await findOwnedSite(userId, siteId);
  if (!site) return { ok: false, error: "Site introuvable" };

  const parsed = shippingInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Frais invalides" };

  const served = parsed.data.filter((r): r is { wilayaCode: number; home: number; office: number | null } => r.home !== null);
  await prisma.$transaction([
    prisma.shippingRate.deleteMany({ where: { siteId } }),
    prisma.shippingRate.createMany({
      data: served.map((r) => ({ siteId, wilayaCode: r.wilayaCode, home: r.home, office: r.office })),
    }),
  ]);
  return { ok: true };
}

/** Wilayas desservies par le site, pour le formulaire de commande. */
export async function shippingOptions(siteId: string): Promise<ShippingOption[]> {
  const rates = await prisma.shippingRate.findMany({ where: { siteId }, orderBy: { wilayaCode: "asc" } });
  return rates.flatMap((r) => {
    const name = wilayaName(r.wilayaCode);
    return name ? [{ wilayaCode: r.wilayaCode, name, home: r.home, office: r.office }] : [];
  });
}
