// lib/storefront.ts — données fraîches passées aux blocs d'une page (metadata de Puck).
//
// Le JSON de la page ne garde que l'identifiant du produit ; prix, photos et
// disponibilité sont relus ici (approche 1 de la conception 1B/1C) et mis en
// cache, invalidés quand le vendeur modifie un produit ou ses frais.

import { unstable_cache } from "next/cache";
import type { PageLang } from "@/blocks/i18n";
import { productsTag, toPublicProduct, type PublicProduct } from "@/lib/product-input";
import { prisma } from "@/lib/prisma";
import { shippingOptions, shippingTag, type ShippingOption } from "@/lib/shipping";
import { siteTag } from "@/lib/tenant";

export type StorefrontMetadata = {
  products: Record<string, PublicProduct>;
  shipping: ShippingOption[];
  /** Produit choisi dans les réglages de la page, lu par les blocs. */
  pageProductId?: string;
  /** Langue de la page (réglage de la racine), pour les textes fixes de l'acheteur. */
  lang?: PageLang;
};

/** Sans cache : testable hors de Next. Produit inactif ou d'un autre vendeur → absent. */
export async function loadStorefront(
  site: { id: string; tenantId: string },
  productId: string | undefined,
): Promise<StorefrontMetadata> {
  const [product, shipping] = await Promise.all([
    productId
      ? prisma.product.findFirst({
          where: { id: productId, tenantId: site.tenantId, active: true },
          include: { variants: { orderBy: { id: "asc" } } },
        })
      : null,
    shippingOptions(site.id),
  ]);
  return {
    products: product ? { [product.id]: toPublicProduct(product) } : {},
    shipping,
    ...(product ? { pageProductId: product.id } : {}),
  };
}

export function getStorefront(site: { id: string; tenantId: string }, productId: string | undefined) {
  return unstable_cache(() => loadStorefront(site, productId), ["storefront", site.id, productId ?? ""], {
    tags: [productsTag(site.tenantId), shippingTag(site.id), siteTag(site.id)],
    revalidate: 300,
  })();
}
