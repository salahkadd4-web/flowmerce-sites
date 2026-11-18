import type { ComponentConfig } from "@puckeditor/core";
import { createElement } from "react";
import { MediaField } from "@/blocks/fields/MediaField";
import { ImageBlock } from "./ImageBlock";
import type { ImageProps } from "./schema";

type Props = Omit<ImageProps, "id">;

export const imageConfig: ComponentConfig<Props> = {
  label: "Image",
  fields: {
    image: { type: "custom", label: "Image", render: MediaField },
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
  },
  defaultProps: {
    image: null,
    alt: "Photo du produit",
    caption: "",
    width: "contained",
  },
  render: ({ puck, id: _id, ...props }) => createElement(ImageBlock, { ...props, editing: puck.isEditing }),
};
