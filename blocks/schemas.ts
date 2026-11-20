// blocks/schemas.ts — type de bloc → schéma de ses props.
// Seule définition de ce qu'est un bloc valide : utilisée à l'enregistrement
// (validatePageContent, strict) et à l'affichage (parsePageContent, bloc par bloc).

import type { z } from "zod";
import { FOOTER_FIELD_LABELS, footerSchema } from "@/blocks/footer/schema";
import { HERO_FIELD_LABELS, heroSchema } from "@/blocks/hero/schema";
import { IMAGE_FIELD_LABELS, imageSchema } from "@/blocks/image/schema";
import { ORDER_FORM_FIELD_LABELS, orderFormSchema } from "@/blocks/order-form/schema";
import { PRODUCT_FIELD_LABELS, productSchema } from "@/blocks/product/schema";
import { TEXT_FIELD_LABELS, textSchema } from "@/blocks/text/schema";

export const BLOCK_TYPES = ["Hero", "Text", "Image", "Footer", "Product", "OrderForm"] as const;
export type BlockType = (typeof BLOCK_TYPES)[number];

export const BLOCK_SCHEMAS: Record<BlockType, z.ZodTypeAny> = {
  Hero: heroSchema,
  Text: textSchema,
  Image: imageSchema,
  Footer: footerSchema,
  Product: productSchema,
  OrderForm: orderFormSchema,
};

/** Nom du bloc tel que le vendeur le voit dans l'éditeur. */
export const BLOCK_LABELS: Record<BlockType, string> = {
  Hero: "Bannière",
  Text: "Texte",
  Image: "Image",
  Footer: "Pied de page",
  Product: "Fiche produit",
  OrderForm: "Formulaire de commande",
};

/** Ce que fait chaque bloc, sous son nom dans la colonne des blocs de l'éditeur. */
export const BLOCK_DESCRIPTIONS: Record<BlockType, string> = {
  Hero: "Titre, image et bouton d'appel",
  Product: "Photos, prix et choix du produit",
  Text: "Titre et paragraphes",
  OrderForm: "Commande payée à la livraison",
  Image: "Une photo, sa taille et sa légende",
  Footer: "Contacts, réseaux et politique de retour",
};

export const BLOCK_FIELD_LABELS: Record<BlockType, Record<string, string>> = {
  Hero: HERO_FIELD_LABELS,
  Text: TEXT_FIELD_LABELS,
  Image: IMAGE_FIELD_LABELS,
  Footer: FOOTER_FIELD_LABELS,
  Product: PRODUCT_FIELD_LABELS,
  OrderForm: ORDER_FORM_FIELD_LABELS,
};

export function isBlockType(type: unknown): type is BlockType {
  return typeof type === "string" && (BLOCK_TYPES as readonly string[]).includes(type);
}
