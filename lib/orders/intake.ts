// lib/orders/intake.ts — réception d'une commande COD (§2.4, §4.5, §7).
//
// Seul point d'écriture public. Le site vient de l'en-tête Host, jamais du corps ;
// le serveur recalcule prix, frais et total ; une même clé d'idempotence ne crée
// qu'une commande ; aucun service extérieur n'est appelé (l'acheteur n'attend
// que la base).

import { Prisma } from "@prisma/client";
import { z } from "zod";
import { computeTotals, MAX_QUANTITY } from "@/blocks/order-form/totals";
import { isCommuneOf } from "@/lib/algeria/wilayas";
import { env } from "@/lib/env";
import { newOrderReference } from "@/lib/orders/reference";
import { normalizeAlgerianPhone } from "@/lib/phone";
import { prisma } from "@/lib/prisma";
import { hitRateLimit } from "@/lib/ratelimit";
import { findPublishedSiteByHost } from "@/lib/tenant-queries";

export const IP_LIMIT = { count: 5, windowSeconds: 600 };
export const PHONE_LIMIT = { count: 3, windowSeconds: 3600 };
export const MIN_FILL_MS = 3000;

const utm = z.string().max(100);

export const orderInputSchema = z.object({
  idempotencyKey: z.string().uuid(),
  productId: z.string().min(1).max(40),
  variantId: z.string().min(1).max(40),
  quantity: z.number().int().min(1).max(MAX_QUANTITY),
  customerName: z.string().trim().min(2).max(80),
  phone: z.string().max(30),
  wilayaCode: z.number().int(),
  commune: z.string().trim().min(1).max(100),
  address: z.string().trim().min(5).max(200),
  deliveryType: z.enum(["HOME", "OFFICE"]),
  website: z.string().max(200),
  startedAt: z.number(),
  source: z
    .object({ utm_source: utm, utm_medium: utm, utm_campaign: utm, utm_content: utm, utm_term: utm })
    .partial()
    .optional(),
});

export type OrderField = keyof z.infer<typeof orderInputSchema>;

const FIELD_ERRORS: Partial<Record<OrderField, string>> = {
  quantity: `Quantité de 1 à ${MAX_QUANTITY}`,
  customerName: "Indiquez votre nom complet",
  phone: "Numéro de téléphone algérien invalide",
  wilayaCode: "Choisissez votre wilaya",
  commune: "Choisissez votre commune",
  address: "Indiquez votre adresse",
  deliveryType: "Choisissez le mode de livraison",
  variantId: "Choisissez une option",
};

export type CreateOrderResult =
  | { ok: true; reference: string; replayed: boolean }
  | { ok: false; status: 400 | 404 | 409 | 429; field?: OrderField; error: string };

const fail = (status: 400 | 404 | 409 | 429, error: string, field?: OrderField): CreateOrderResult => ({
  ok: false,
  status,
  error,
  ...(field ? { field } : {}),
});

async function replay(idempotencyKey: string): Promise<CreateOrderResult | null> {
  const existing = await prisma.order.findUnique({ where: { idempotencyKey }, select: { reference: true } });
  return existing ? { ok: true, reference: existing.reference, replayed: true } : null;
}

export async function createOrder(
  ctx: { host: string; ip: string | null; userAgent: string | null },
  body: unknown,
): Promise<CreateOrderResult> {
  const parsed = orderInputSchema.safeParse(body);
  if (!parsed.success) {
    const field = String(parsed.error.issues[0]?.path[0] ?? "") as OrderField;
    return fail(400, FIELD_ERRORS[field] ?? "Formulaire incomplet", FIELD_ERRORS[field] ? field : undefined);
  }
  const input = parsed.data;

  // Robots : champ piège rempli ou formulaire envoyé trop vite. Message générique.
  if (input.website !== "" || Date.now() - input.startedAt < MIN_FILL_MS) {
    return fail(400, "Votre commande n'a pas pu être envoyée. Réessayez dans un instant.");
  }

  const site = await findPublishedSiteByHost(ctx.host, env.SITES_ROOT_DOMAIN);
  if (!site) return fail(404, "Boutique introuvable");

  const replayed = await replay(input.idempotencyKey);
  if (replayed) return replayed;

  const phone = normalizeAlgerianPhone(input.phone);
  if (!phone) return fail(400, FIELD_ERRORS.phone!, "phone");

  const tooMany = "Trop de commandes en peu de temps. Réessayez plus tard.";
  if (ctx.ip && !(await hitRateLimit(`order:ip:${ctx.ip}`, IP_LIMIT.count, IP_LIMIT.windowSeconds))) return fail(429, tooMany);
  if (!(await hitRateLimit(`order:phone:${phone}`, PHONE_LIMIT.count, PHONE_LIMIT.windowSeconds))) return fail(429, tooMany);

  const variant = await prisma.variant.findFirst({
    where: { id: input.variantId, productId: input.productId, product: { tenantId: site.tenantId, active: true } },
    include: { product: { select: { name: true, price: true } } },
  });
  if (!variant) return fail(404, "Produit introuvable");
  if (variant.stock < input.quantity) return fail(409, "Ce choix est en rupture de stock", "variantId");

  const rate = await prisma.shippingRate.findUnique({
    where: { siteId_wilayaCode: { siteId: site.id, wilayaCode: input.wilayaCode } },
  });
  if (!rate) return fail(400, "Livraison non disponible dans cette wilaya", "wilayaCode");
  if (input.deliveryType === "OFFICE" && rate.office === null) {
    return fail(400, "Livraison au bureau non disponible dans cette wilaya", "deliveryType");
  }
  if (!isCommuneOf(input.wilayaCode, input.commune)) return fail(400, FIELD_ERRORS.commune!, "commune");

  const shippingFee = input.deliveryType === "OFFICE" ? rate.office! : rate.home;
  const { subtotal, total } = computeTotals({ unitPrice: variant.product.price, quantity: input.quantity, shippingFee });

  for (let attempt = 0; attempt < 3; attempt++) {
    const reference = newOrderReference();
    try {
      await prisma.order.create({
        data: {
          tenantId: site.tenantId,
          siteId: site.id,
          idempotencyKey: input.idempotencyKey,
          reference,
          customerName: input.customerName,
          phone,
          wilayaCode: input.wilayaCode,
          commune: input.commune,
          address: input.address,
          deliveryType: input.deliveryType,
          subtotal,
          shippingFee,
          total,
          ip: ctx.ip,
          userAgent: ctx.userAgent?.slice(0, 300) ?? null,
          source: input.source ?? Prisma.DbNull,
          items: {
            create: [
              {
                productId: input.productId,
                variantId: variant.id,
                productName: variant.product.name,
                options: variant.options as Prisma.InputJsonValue,
                unitPrice: variant.product.price,
                quantity: input.quantity,
              },
            ],
          },
          events: { create: [{ from: null, to: "NEW", actor: "client" }] },
        },
      });
      return { ok: true, reference, replayed: false };
    } catch (error) {
      if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") throw error;
      // Course sur la même clé d'idempotence : l'autre envoi a gagné.
      const raced = await replay(input.idempotencyKey);
      if (raced) return raced;
      // Sinon collision de référence (rarissime) : nouvel essai.
    }
  }
  throw new Error("Impossible d'attribuer une référence de commande");
}
