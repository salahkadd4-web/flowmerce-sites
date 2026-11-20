import type { ComponentConfig } from "@puckeditor/core";
import { createElement } from "react";
import { buttonField, styleField, typographyField } from "@/blocks/fields/groups";
import { buttonStyleSchema, sectionStyleSchema, typographySchema } from "@/blocks/style";
import type { StorefrontMetadata } from "@/lib/storefront";
import { OrderFormBlock } from "./OrderFormBlock";
import type { OrderFormProps } from "./schema";

type Props = Omit<OrderFormProps, "id">;

export const orderFormConfig: ComponentConfig<Props> = {
  label: "Formulaire de commande",
  fields: {
    title: { type: "text", label: "Titre", contentEditable: true },
    submitLabel: { type: "text", label: "Texte du bouton", contentEditable: true },
    typography: typographyField({ text: false }),
    button: buttonField(),
    style: styleField(),
  },
  defaultProps: {
    title: "Commandez maintenant, payez à la livraison",
    submitLabel: "Confirmer la commande",
    typography: typographySchema.parse(undefined),
    button: buttonStyleSchema.parse({ size: "l" }),
    style: sectionStyleSchema.parse(undefined),
  },
  render: ({ puck, id: _id, ...props }) => {
    const metadata = puck.metadata as Partial<StorefrontMetadata>;
    const product = (metadata.pageProductId && metadata.products?.[metadata.pageProductId]) || null;
    return createElement(OrderFormBlock, {
      ...props,
      product,
      shipping: metadata.shipping ?? [],
      lang: metadata.lang ?? "fr",
      editing: puck.isEditing,
    });
  },
};
