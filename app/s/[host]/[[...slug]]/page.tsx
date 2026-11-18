// app/s/[host]/[[...slug]]/page.tsx — rendu public des sites vendeurs.
//
// proxy.ts réécrit `test.localhost:3100/promo` en `/s/test.localhost/promo`.
// L'hôte est résolu ici (avec cache), jamais dans le proxy (§4.3).

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RenderPage } from "@/components/site/RenderPage";
import { getPage, getSiteByHost } from "@/lib/tenant";

type Props = { params: Promise<{ host: string; slug?: string[] }> };

async function load(params: Props["params"]) {
  const { host, slug } = await params;
  const site = await getSiteByHost(decodeURIComponent(host));
  if (!site) return null;
  const page = await getPage(site.id, (slug ?? []).join("/"));
  if (!page) return null;
  return { site, page };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const data = await load(params);
  if (!data) return {};
  return { title: data.page.content.root.props.title ?? data.page.title ?? data.site.name };
}

export default async function SitePage({ params }: Props) {
  const data = await load(params);
  if (!data) notFound();

  const { site, page } = data;
  return (
    <main
      lang={site.locale}
      dir={site.locale === "ar" ? "rtl" : "ltr"}
      className="mx-auto min-h-screen max-w-3xl px-4 py-12"
    >
      <RenderPage content={page.content} />
    </main>
  );
}
