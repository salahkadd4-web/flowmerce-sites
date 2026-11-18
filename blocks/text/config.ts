import type { ComponentConfig } from "@puckeditor/core";
import { createElement } from "react";
import type { TextProps } from "./schema";
import { Text } from "./Text";

type Props = Omit<TextProps, "id">;

export const textConfig: ComponentConfig<Props> = {
  label: "Texte",
  fields: {
    title: { type: "text", label: "Titre" },
    body: { type: "textarea", label: "Texte (une ligne vide sépare deux paragraphes)" },
    align: {
      type: "radio",
      label: "Alignement",
      options: [
        { label: "À gauche", value: "left" },
        { label: "Centré", value: "center" },
      ],
    },
  },
  defaultProps: {
    title: "Pourquoi choisir notre produit",
    body: "Premier avantage : dites ce qui le rend unique.\n\nDeuxième avantage : rassurez sur la qualité.\n\nTroisième avantage : livraison partout en Algérie, paiement à la livraison.",
    align: "left",
  },
  render: ({ puck: _puck, id: _id, ...props }) => createElement(Text, props),
};
