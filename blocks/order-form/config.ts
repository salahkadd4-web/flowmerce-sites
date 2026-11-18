import type { ComponentConfig } from "@puckeditor/core";
import { createElement } from "react";
import type { StorefrontMetadata } from "@/lib/storefront";
import { OrderFormBlock } from "./OrderFormBlock";
import type { OrderFormProps } from "./schema";

type Props = Omit<OrderFormProps, "id">;

export const orderFormConfig: ComponentConfig<Props> = {
  label: "Formulaire de commande",
  fields: {
    title: { type: "text", label: "Titre" },
    submitLabel: { type: "text", label: "Texte du bouton" },
  },
  defaultProps: {
    title: "Commandez maintenant, payez à la livraison",
    submitLabel: "Confirmer la commande",
  },
  render: ({ puck, id: _id, ...props }) => {
    const metadata = puck.metadata as Partial<StorefrontMetadata>;
    const product = (metadata.pageProductId && metadata.products?.[metadata.pageProductId]) || null;
    return createElement(OrderFormBlock, { ...props, product, shipping: metadata.shipping ?? [], editing: puck.isEditing });
  },
};
