// templates/index.ts — modèles proposés à la création d'un site.
//
// Chaque modèle est un contenu de page Puck complet, validé par les schémas des
// blocs (templates.test.ts). Leurs photos sont des fichiers du site
// (public/templates/<modèle>/), libres d'usage commercial (public/templates/CREDITS.md).

import landingFr from "./landing-fr.json";

export type TemplateInfo = {
  id: string;
  name: string;
  /** Catégorie de produits pour laquelle le modèle est pensé. */
  category: string;
  description: string;
  /** Aperçu du modèle (capture), ou null pour le modèle simple. */
  preview: string | null;
  data: unknown;
};

export const TEMPLATES: readonly TemplateInfo[] = [
  {
    id: "landing-fr",
    name: "Modèle simple",
    category: "Tous produits",
    description: "Bannière, fiche produit, avantages, formulaire de commande et pied de page, à compléter.",
    preview: null,
    data: landingFr,
  },
];

export function templateById(id: string): TemplateInfo | undefined {
  return TEMPLATES.find((template) => template.id === id);
}
