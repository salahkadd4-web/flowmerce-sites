"use client";

// Barre de mise en forme des textes (dans la page et dans le panneau) : gras,
// italique, souligné, barré — rien d'autre, comme le permet le nettoyage du texte
// (blocks/rich-text.tsx). Branchée par editor-config.ts, jamais envoyée aux acheteurs.

import { RichTextMenu } from "@puckeditor/core";

export function FourStylesMenu() {
  return (
    <RichTextMenu>
      <RichTextMenu.Group>
        <RichTextMenu.Bold />
        <RichTextMenu.Italic />
        <RichTextMenu.Underline />
        <RichTextMenu.Strikethrough />
      </RichTextMenu.Group>
    </RichTextMenu>
  );
}
