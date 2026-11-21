// Emplacement d'une section encore vide (image ou produit pas choisi), dans
// l'éditeur seulement. Sur le site, rien ne s'affiche. editor-config.ts y ajoute
// le bouton qui règle le manque (blocks/editor/EmptyAction.tsx).

import type { ReactNode } from "react";

export type EmptyKind = "image" | "product";
export type RenderEmpty = (box: { kind: EmptyKind; message: string }) => ReactNode;

export const renderEmpty: RenderEmpty = ({ message }) => message;

export const EMPTY_MESSAGES: Record<EmptyKind, string> = {
  image: "Aucune image pour l'instant.",
  product: "Aucun produit choisi pour cette page.",
};
