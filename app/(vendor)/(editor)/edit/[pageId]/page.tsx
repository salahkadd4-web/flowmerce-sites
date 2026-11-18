// Éditeur d'une page (hôte vendeur). Hors du layout du tableau de bord : Puck
// occupe tout l'écran. Session et propriété vérifiées ici.

import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { env } from "@/lib/env";
import { siteUrl } from "@/lib/host";
import { findOwnedPage } from "@/lib/pages";
import { toPublicProduct } from "@/lib/product-input";
import { listActiveProductsWithVariants } from "@/lib/products";
import { shippingOptions } from "@/lib/shipping";
import { Editor } from "./Editor";

export const metadata: Metadata = { title: "Éditeur — Flowmerce Sites" };

export default async function EditPage({ params }: { params: Promise<{ pageId: string }> }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { pageId } = await params;
  const page = await findOwnedPage(session.user.id, pageId);
  if (!page) notFound();

  const url = siteUrl(page.site.subdomain, {
    rootDomain: env.SITES_ROOT_DOMAIN,
    protocol: env.SITES_PROTOCOL,
    port: env.SITES_PORT,
  });

  // Mêmes données que le site public (lib/storefront.ts), pour un aperçu fidèle :
  // tous les produits actifs du vendeur (choix du produit de la page) et les frais du site.
  const [products, shipping] = await Promise.all([
    listActiveProductsWithVariants(session.user.id),
    shippingOptions(page.site.id),
  ]);

  return (
    <Editor
      pageId={page.id}
      site={{ name: page.site.name, url, published: page.site.status === "PUBLISHED" }}
      initialData={page.draft}
      products={products.map(toPublicProduct)}
      shipping={shipping}
    />
  );
}
