import type { ComponentConfig } from "@puckeditor/core";
import { createElement } from "react";
import { imageField, rangeField } from "@/blocks/fields/editor-fields";
import { ALIGN_OPTIONS, buttonField, styleField, typographyField } from "@/blocks/fields/groups";
import { RICH_TEXT_OPTIONS } from "@/blocks/rich-text";
import { buttonStyleSchema, sectionStyleSchema, typographySchema } from "@/blocks/style";
import { Hero } from "./Hero";
import type { HeroProps } from "./schema";

type Props = Omit<HeroProps, "id">;

export const heroConfig: ComponentConfig<Props> = {
  label: "Bannière",
  fields: {
    title: { type: "richtext", label: "Titre", contentEditable: true, options: RICH_TEXT_OPTIONS },
    subtitle: { type: "richtext", label: "Sous-titre", contentEditable: true, options: RICH_TEXT_OPTIONS },
    image: imageField("Image"),
    imageAlt: { type: "text", label: "Description de l'image (pour les lecteurs d'écran)" },
    imageWidth: rangeField("Largeur de l'image", { min: 30, max: 100, step: 10, unit: "%" }),
    buttonLabel: { type: "text", label: "Texte du bouton", contentEditable: true },
    buttonHref: { type: "text", label: "Lien du bouton" },
    align: { type: "radio", label: "Alignement", options: ALIGN_OPTIONS },
    typography: typographyField(),
    button: buttonField(),
    style: styleField(),
  },
  defaultProps: {
    title: "Le nom de votre produit",
    subtitle: "Une phrase qui dit pourquoi vos clients vont l'adorer.",
    image: null,
    imageAlt: "",
    imageWidth: 100,
    buttonLabel: "Commander maintenant",
    buttonHref: "#commande",
    align: "center",
    typography: typographySchema.parse(undefined),
    button: buttonStyleSchema.parse(undefined),
    style: sectionStyleSchema.parse(undefined),
  },
  render: ({ puck, id: _id, ...props }) => createElement(Hero, { ...props, editing: puck.isEditing }),
};
