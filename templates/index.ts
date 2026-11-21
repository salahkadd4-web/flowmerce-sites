// templates/index.ts — modèles proposés à la création d'un site.
//
// Chaque modèle est un contenu de page Puck complet, validé par les schémas des
// blocs (templates.test.ts). Leurs photos sont des fichiers du site
// (public/templates/<modèle>/), libres d'usage commercial (public/templates/CREDITS.md).

import beaute from "./beaute.json";
import chaussures from "./chaussures.json";
import landingFr from "./landing-fr.json";
import maison from "./maison.json";
import mode from "./mode.json";
import montres from "./montres.json";

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
  {
    id: "mode",
    name: "Mode intemporelle",
    category: "Vêtements",
    description: "Ivoire et noir, titres Playfair : une vitrine sobre pour une collection de vêtements.",
    preview: "/templates/mode/apercu.webp",
    data: mode,
  },
  {
    id: "chaussures",
    name: "Cuir & caractère",
    category: "Chaussures",
    description: "Anthracite et camel : met en valeur le cuir, la pointure et le confort.",
    preview: "/templates/chaussures/apercu.webp",
    data: chaussures,
  },
  {
    id: "beaute",
    name: "Beauté naturelle",
    category: "Cosmétique",
    description: "Rose poudré, titres Cormorant : douceur et routine de soin en trois gestes.",
    preview: "/templates/beaute/apercu.webp",
    data: beaute,
  },
  {
    id: "montres",
    name: "Heure d'or",
    category: "Montres & accessoires",
    description: "Bleu nuit et or : l'écrin d'une montre ou d'un bijou à offrir.",
    preview: "/templates/montres/apercu.webp",
    data: montres,
  },
  {
    id: "maison",
    name: "Art de la table",
    category: "Maison & cuisine",
    description: "Lin et olive : vaisselle, ustensiles et objets de la maison.",
    preview: "/templates/maison/apercu.webp",
    data: maison,
  },
];

export function templateById(id: string): TemplateInfo | undefined {
  return TEMPLATES.find((template) => template.id === id);
}
