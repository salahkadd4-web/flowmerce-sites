// blocks/puck.config.ts — configuration Puck unique.
// Partagée par l'éditeur (<Puck>, client) et le rendu public (Render de
// @puckeditor/core/rsc, serveur) : chaque bloc est écrit une seule fois.

import type { Config } from "@puckeditor/core";
import { footerConfig } from "@/blocks/footer/config";
import { heroConfig } from "@/blocks/hero/config";
import { imageConfig } from "@/blocks/image/config";
import { orderFormConfig } from "@/blocks/order-form/config";
import { productConfig } from "@/blocks/product/config";
import { textConfig } from "@/blocks/text/config";

export const puckConfig: Config = {
  components: {
    Hero: heroConfig,
    Product: productConfig,
    Text: textConfig,
    OrderForm: orderFormConfig,
    Image: imageConfig,
    Footer: footerConfig,
  } as Config["components"],
  root: {
    fields: {
      title: { type: "text", label: "Titre de la page (onglet du navigateur)" },
    },
  },
};
