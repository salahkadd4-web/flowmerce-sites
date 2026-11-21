// Groupes de réglages communs du panneau : Texte, Bouton, Style.
// Repliés par défaut : le vendeur voit d'abord le contenu du bloc.

import type { Field } from "@puckeditor/core";
import { colorField, imageField, rangeField } from "@/blocks/fields/editor-fields";

// Paliers des poignées : 0 (selon le contenu) puis 20 à 100 % de l'écran ; bouton automatique puis 20 à 100 %.
const STEPS = [20, 30, 40, 50, 60, 70, 80, 90, 100];

const GROUP = { type: "object" as const, collapsible: true, defaultExpanded: false };

const SIZE_OPTIONS = [
  { label: "Petite", value: "s" },
  { label: "Moyenne", value: "m" },
  { label: "Grande", value: "l" },
  { label: "Très grande", value: "xl" },
];

export const ALIGN_OPTIONS = [
  { label: "Au début de la ligne", value: "left" },
  { label: "Centré", value: "center" },
];

export function styleField(): Field {
  return {
    ...GROUP,
    label: "Style",
    objectFields: {
      background: {
        type: "radio" as const,
        label: "Fond",
        options: [
          { label: "Par défaut", value: "default" },
          { label: "Couleur", value: "color" },
          { label: "Image", value: "image" },
        ],
      },
      backgroundColor: colorField("Couleur du fond", { auto: false }),
      backgroundImage: imageField("Image de fond"),
      overlay: rangeField("Assombrissement de l'image", { min: 0, max: 80, step: 10, unit: "%" }),
      spacing: {
        type: "radio" as const,
        label: "Hauteur de la section",
        options: [
          { label: "Compacte", value: "compact" },
          { label: "Normale", value: "normal" },
          { label: "Aérée", value: "airy" },
        ],
      },
      minHeight: {
        type: "select" as const,
        label: "Hauteur minimale de la section",
        options: [{ label: "Selon le contenu", value: 0 }, ...STEPS.map((v) => ({ label: `${v} % de l'écran`, value: v }))],
      },
      width: {
        type: "radio" as const,
        label: "Largeur du contenu",
        options: [
          { label: "Étroite", value: "narrow" },
          { label: "Normale", value: "normal" },
          { label: "Large", value: "wide" },
        ],
      },
    },
  };
}

export function typographyField({ title = true, text = true }: { title?: boolean; text?: boolean } = {}): Field {
  return {
    ...GROUP,
    label: "Texte",
    objectFields: {
      ...(title
        ? {
            titleSize: { type: "select" as const, label: "Taille du titre", options: SIZE_OPTIONS },
            titleColor: colorField("Couleur du titre", { auto: true }),
          }
        : {}),
      ...(text
        ? {
            textSize: { type: "select" as const, label: "Taille du texte", options: SIZE_OPTIONS },
            textColor: colorField("Couleur du texte", { auto: true }),
          }
        : {}),
    },
  };
}

export function buttonField(): Field {
  return {
    ...GROUP,
    label: "Bouton",
    objectFields: {
      color: colorField("Couleur du bouton", { auto: true }),
      textColor: colorField("Couleur du texte du bouton", { auto: true }),
      size: {
        type: "radio" as const,
        label: "Taille du bouton",
        options: [
          { label: "Petit", value: "s" },
          { label: "Moyen", value: "m" },
          { label: "Grand", value: "l" },
        ],
      },
      width: {
        type: "select" as const,
        label: "Largeur du bouton",
        options: [{ label: "Automatique (selon le texte)", value: "auto" }, ...STEPS.map((v) => ({ label: `${v} % du contenu`, value: v }))],
      },
    },
  };
}
