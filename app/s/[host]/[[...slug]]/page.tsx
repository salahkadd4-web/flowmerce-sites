// app/s/[host]/[[...slug]]/page.tsx — rendu public des sites vendeurs.
//
// proxy.ts réécrit `test.localhost:3100/promo` en `/s/test.localhost/promo`.
// L'hôte est résolu ici (avec cache), jamais dans le proxy (§4.3).

import type { Data } from "@puckeditor/core";
import { Render } from "@puckeditor/core/rsc";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { puckConfig } from "@/blocks/puck.config";
import { PUBLIC_FIELD_TRANSFORMS } from "@/blocks/render-transforms";
import { pageTitle } from "@/lib/page-title";
import { getStorefront } from "@/lib/storefront";
import { getPage, getSiteByHost } from "@/lib/tenant";

type Props = { params: Promise<{ host: string; slug?: string[] }> };

async function load(params: Props["params"]) {
  // `params` arrive déjà décodé : le décoder une seconde fois ferait lever
  // une URIError pour un hôte contenant « % ».
  const { host, slug } = await params;
  const site = await getSiteByHost(host);
  if (!site) return null;
  const page = await getPage(site.id, (slug ?? []).join("/"));
  if (!page) return null;
  return { site, page };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const data = await load(params);
  if (!data) return {};
  return { title: pageTitle(data.page.content.root.props.title, data.page.title, data.site.name) };
}

export default async function SitePage({ params }: Props) {
  const data = await load(params);
  if (!data) notFound();

  // Produit de la page et frais du site, relus à chaque rendu (en cache, invalidés
  // quand le vendeur les modifie) : passés aux blocs par la metadata de Puck.
  const storefront = await getStorefront(data.site, data.page.content.root.props.productId);

  // Rendu serveur de Puck : aucun code de l'éditeur n'est envoyé à l'acheteur.
  // Le contenu a déjà été filtré bloc par bloc par parsePageContent.
  return (
    <main className="min-h-dvh">
      <Render config={puckConfig} fieldTransforms={PUBLIC_FIELD_TRANSFORMS} data={data.page.content as Data} metadata={{ ...storefront, lang: data.page.content.root.props.lang ?? "fr" }} />
    </main>
  );
}
