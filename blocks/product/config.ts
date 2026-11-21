import type { ComponentConfig } from "@puckeditor/core";
import { createElement } from "react";
import { frameField, rangeField } from "@/blocks/fields/editor-fields";
import { buttonField, styleField, typographyField } from "@/blocks/fields/groups";
import { buttonStyleSchema, sectionStyleSchema, typographySchema } from "@/blocks/style";
import type { StorefrontMetadata } from "@/lib/storefront";
import { ProductBlock } from "./ProductBlock";
import type { ProductProps } from "./schema";

type Props = Omit<ProductProps, "id">;

export const productConfig: ComponentConfig<Props> = {
  label: "Fiche produit",
  fields: {
    buttonLabel: { type: "text", label: "Texte du bouton (vers le formulaire)", contentEditable: true },
    imageWidth: rangeField("Largeur de la photo principale", { min: 30, max: 100, step: 5, unit: "%" }),
    // Réglé aux poignées du haut et du bas de l'image (éditeur) ; null : proportions naturelles.
    imageHeight: frameField("Cadre de l'image"),
    thumbSize: {
      type: "radio",
      label: "Taille des miniatures",
      options: [
        { label: "Petites", value: "s" },
        { label: "Moyennes", value: "m" },
        { label: "Grandes", value: "l" },
      ],
    },
    typography: typographyField(),
    button: buttonField(),
    style: styleField(),
  },
  defaultProps: {
    buttonLabel: "Commander maintenant",
    imageWidth: 100,
    imageHeight: null,
    thumbSize: "m",
    typography: typographySchema.parse(undefined),
    button: buttonStyleSchema.parse(undefined),
    style: sectionStyleSchema.parse(undefined),
  },
  render: ({ puck, id, ...props }) => {
    const metadata = puck.metadata as Partial<StorefrontMetadata>;
    const product = (metadata.pageProductId && metadata.products?.[metadata.pageProductId]) || null;
    return createElement(ProductBlock, { ...props, blockId: id, lang: metadata.lang ?? "fr", product, editing: puck.isEditing });
  },
};
