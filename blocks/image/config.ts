import type { ComponentConfig } from "@puckeditor/core";
import { createElement } from "react";
import { imageField, rangeField } from "@/blocks/fields/editor-fields";
import { styleField } from "@/blocks/fields/groups";
import { sectionStyleSchema } from "@/blocks/style";
import { ImageBlock } from "./ImageBlock";
import type { ImageProps } from "./schema";

type Props = Omit<ImageProps, "id">;

export const imageConfig: ComponentConfig<Props> = {
  label: "Image",
  fields: {
    image: imageField("Image"),
    alt: { type: "text", label: "Texte alternatif (décrit l'image)" },
    caption: { type: "text", label: "Légende" },
    width: {
      type: "radio",
      label: "Largeur",
      options: [
        { label: "Contenue", value: "contained" },
        { label: "Pleine largeur", value: "full" },
      ],
    },
    imageWidth: rangeField("Taille de l'image", { min: 30, max: 100, step: 10, unit: "%" }),
    rounded: {
      type: "radio",
      label: "Coins arrondis",
      options: [
        { label: "Aucun", value: "none" },
        { label: "Légers", value: "soft" },
        { label: "Prononcés", value: "strong" },
      ],
    },
    style: styleField(),
  },
  defaultProps: {
    image: null,
    alt: "Photo du produit",
    caption: "",
    width: "contained",
    imageWidth: 100,
    rounded: "soft",
    style: sectionStyleSchema.parse(undefined),
  },
  render: ({ puck, id: _id, ...props }) => createElement(ImageBlock, { ...props, editing: puck.isEditing }),
};
