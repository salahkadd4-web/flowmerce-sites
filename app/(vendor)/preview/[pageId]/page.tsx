// Aperçu du brouillon (hôte vendeur, propriétaire seulement). Même rendu Puck que
// le site public, avec les polices système du site et un bandeau « non publié ».

import type { Data } from "@puckeditor/core";
import { Render } from "@puckeditor/core/rsc";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { puckConfig } from "@/blocks/puck.config";
import { auth } from "@/lib/auth";
import { parsePageContent } from "@/lib/page-content";
import { findOwnedPage } from "@/lib/pages";

export const metadata: Metadata = { title: "Aperçu — Flowmerce Sites", robots: { index: false } };

const SYSTEM_FONTS = 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

export default async function PreviewPage({ params }: { params: Promise<{ pageId: string }> }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { pageId } = await params;
  const page = await findOwnedPage(session.user.id, pageId);
  if (!page) notFound();

  const content = parsePageContent(page.draft) ?? { root: { props: {} }, content: [] };

  return (
    <div className="min-h-dvh bg-white" style={{ fontFamily: SYSTEM_FONTS }}>
      <p className="sticky top-0 z-10 bg-amber-50 px-4 py-2 text-center text-[13px] font-semibold text-amber-900">
        Aperçu — non publié. Les acheteurs ne voient pas encore ces modifications.
      </p>
      <main>
        <Render config={puckConfig} data={content as Data} />
      </main>
    </div>
  );
}
