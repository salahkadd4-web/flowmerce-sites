import type { ComponentConfig } from "@puckeditor/core";
import { createElement } from "react";
import type { StorefrontMetadata } from "@/lib/storefront";
import { ProductBlock } from "./ProductBlock";
import type { ProductProps } from "./schema";

type Props = Omit<ProductProps, "id">;

export const productConfig: ComponentConfig<Props> = {
  label: "Fiche produit",
  fields: {
    buttonLabel: { type: "text", label: "Texte du bouton (vers le formulaire)" },
  },
  defaultProps: {
    buttonLabel: "Commander maintenant",
  },
  render: ({ puck, id: _id, ...props }) => {
    const metadata = puck.metadata as Partial<StorefrontMetadata>;
    const product = (metadata.pageProductId && metadata.products?.[metadata.pageProductId]) || null;
    return createElement(ProductBlock, { ...props, product, editing: puck.isEditing });
  },
};
