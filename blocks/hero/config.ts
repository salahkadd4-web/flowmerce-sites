import type { ComponentConfig } from "@puckeditor/core";
import { createElement } from "react";
import { PendingMediaField } from "@/blocks/fields/PendingMediaField";
import { Hero } from "./Hero";
import type { HeroProps } from "./schema";

type Props = Omit<HeroProps, "id">;

const ALIGN = [
  { label: "À gauche", value: "left" },
  { label: "Centré", value: "center" },
];

export const heroConfig: ComponentConfig<Props> = {
  label: "Bannière",
  fields: {
    title: { type: "text", label: "Titre" },
    subtitle: { type: "textarea", label: "Sous-titre" },
    image: { type: "custom", label: "Image", render: PendingMediaField },
    buttonLabel: { type: "text", label: "Texte du bouton" },
    buttonHref: { type: "text", label: "Lien du bouton" },
    align: { type: "radio", label: "Alignement", options: ALIGN },
    background: {
      type: "select",
      label: "Fond",
      options: [
        { label: "Clair", value: "light" },
        { label: "Sombre", value: "dark" },
        { label: "Indigo", value: "indigo" },
        { label: "Sable", value: "sand" },
      ],
    },
  },
  defaultProps: {
    title: "Le nom de votre produit",
    subtitle: "Une phrase qui dit pourquoi vos clients vont l'adorer.",
    image: null,
    buttonLabel: "Commander maintenant",
    buttonHref: "#commande",
    align: "center",
    background: "light",
  },
  render: ({ puck: _puck, id: _id, ...props }) => createElement(Hero, props),
};
