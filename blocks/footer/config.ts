import type { ComponentConfig } from "@puckeditor/core";
import { createElement } from "react";
import { Footer } from "./Footer";
import type { FooterProps } from "./schema";

type Props = Omit<FooterProps, "id">;

export const footerConfig: ComponentConfig<Props> = {
  label: "Pied de page",
  fields: {
    shopName: { type: "text", label: "Nom de la boutique" },
    phone: { type: "text", label: "Téléphone" },
    email: { type: "text", label: "Email" },
    facebook: { type: "text", label: "Lien Facebook (ex. facebook.com/maboutique)" },
    instagram: { type: "text", label: "Lien Instagram (ex. instagram.com/maboutique)" },
    tiktok: { type: "text", label: "Lien TikTok (ex. tiktok.com/@maboutique)" },
    returnPolicy: { type: "textarea", label: "Politique de retour" },
  },
  defaultProps: {
    shopName: "Ma boutique",
    phone: "",
    email: "",
    facebook: "",
    instagram: "",
    tiktok: "",
    returnPolicy: "Échange ou remboursement sous 7 jours après la livraison, produit non utilisé.",
  },
  render: ({ puck: _puck, id: _id, ...props }) => createElement(Footer, props),
};
