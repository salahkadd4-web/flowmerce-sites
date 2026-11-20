// Liens saisis par le vendeur dans les barres d'outils (bouton, réseaux sociaux).
// Mêmes règles qu'à l'enregistrement (blocks/shared.ts) : refusés tout de suite,
// avec un message, plutôt qu'écrits puis rejetés à la sauvegarde.

import { isSafeHref, withDefaultScheme } from "@/blocks/shared";

/** Message d'erreur d'un lien, ou null s'il est acceptable (vide = pas de lien). */
export function linkError(value: string): string | null {
  const href = String(withDefaultScheme(value));
  if (href === "") return null;
  return isSafeHref(href) ? null : "Lien non valable";
}

/** Lien tel qu'il sera enregistré : https:// ajouté s'il manquait. */
export function normalizeLink(value: string): string {
  return String(withDefaultScheme(value));
}

export const ORDER_ANCHOR = "#commande";

/** Où mène un bouton : le formulaire, la fiche produit de la page, ou un autre lien. */
export function linkTargetOf(href: string, productAnchor: string | null): "order" | "product" | "other" {
  if (href === ORDER_ANCHOR) return "order";
  if (productAnchor !== null && href === productAnchor) return "product";
  return "other";
}
