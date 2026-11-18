// components/site/RenderPage.tsx — Flowmerce Sites
//
// Rendu provisoire du contenu publié, en attendant les blocs Puck (Phase 1).
// Le texte passe toujours par React (échappé) : jamais de HTML brut (§7).
// Un bloc inconnu ou mal formé est ignoré plutôt que de casser la page.

import type { ReactNode } from "react";
import type { PageBlock, PageContent } from "@/lib/page-content";

function renderBlock(block: PageBlock, index: number): ReactNode {
  const key = typeof block.props.id === "string" ? block.props.id : index;
  const text = block.props.text;
  if (typeof text !== "string") return null;

  switch (block.type) {
    case "Heading":
      return (
        <h1 key={key} className="text-3xl font-bold leading-tight text-ink">
          {text}
        </h1>
      );
    case "Text":
      return (
        <p key={key} className="text-base leading-relaxed text-body">
          {text}
        </p>
      );
    default:
      return null;
  }
}

export function RenderPage({ content }: { content: PageContent }) {
  return <div className="flex flex-col gap-4">{content.content.map(renderBlock)}</div>;
}
