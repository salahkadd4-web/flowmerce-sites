import type { ComponentConfig } from "@puckeditor/core";
import { createElement } from "react";
import { ALIGN_OPTIONS, styleField, typographyField } from "@/blocks/fields/groups";
import { RICH_TEXT_OPTIONS } from "@/blocks/rich-text";
import { sectionStyleSchema, typographySchema } from "@/blocks/style";
import type { TextProps } from "./schema";
import { Text } from "./Text";

type Props = Omit<TextProps, "id">;

export const textConfig: ComponentConfig<Props> = {
  label: "Texte",
  fields: {
    title: { type: "richtext", label: "Titre", contentEditable: true, options: RICH_TEXT_OPTIONS },
    body: { type: "richtext", label: "Texte", contentEditable: true, options: RICH_TEXT_OPTIONS },
    align: { type: "radio", label: "Alignement", options: ALIGN_OPTIONS },
    typography: typographyField(),
    style: styleField(),
  },
  defaultProps: {
    title: "Pourquoi choisir notre produit",
    // Déjà en paragraphes : l'éditeur enregistre ce qu'il charge, et un texte simple
    // y deviendrait un seul paragraphe aux lignes collées sur le site.
    body: "<p>Premier avantage : dites ce qui le rend unique.</p><p>Deuxième avantage : rassurez sur la qualité.</p><p>Troisième avantage : livraison partout en Algérie, paiement à la livraison.</p>",
    align: "left",
    typography: typographySchema.parse(undefined),
    style: sectionStyleSchema.parse(undefined),
  },
  render: ({ puck: _puck, id: _id, ...props }) => createElement(Text, props),
};
