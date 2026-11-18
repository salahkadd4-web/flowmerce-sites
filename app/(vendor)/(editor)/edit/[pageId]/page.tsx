// Éditeur d'une page (hôte vendeur). Hors du layout du tableau de bord : Puck
// occupe tout l'écran. Session et propriété vérifiées ici.

import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { env } from "@/lib/env";
import { siteUrl } from "@/lib/host";
import { findOwnedPage } from "@/lib/pages";
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

  return (
    <Editor
      pageId={page.id}
      site={{ name: page.site.name, url, published: page.site.status === "PUBLISHED" }}
      initialData={page.draft}
    />
  );
}
