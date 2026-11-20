import { z } from "zod";
import { text } from "@/blocks/shared";
import { buttonStyleSchema, imageWidthSchema, sectionStyleSchema, typographySchema } from "@/blocks/style";

export const THUMB_SIZES = ["s", "m", "l"] as const;

// Le produit lui-même n'est pas dans le bloc : c'est le « Produit de la page »
// (root.props.productId), relu frais à chaque rendu (lib/storefront.ts).
export const productSchema = z.object({
  id: z.string(),
  buttonLabel: text(40),
  imageWidth: imageWidthSchema,
  thumbSize: z.enum(THUMB_SIZES).default("m"),
  typography: typographySchema,
  button: buttonStyleSchema,
  style: sectionStyleSchema,
});

export type ProductProps = z.infer<typeof productSchema>;

export const PRODUCT_FIELD_LABELS: Record<keyof ProductProps, string> = {
  id: "Identifiant",
  buttonLabel: "Texte du bouton",
  imageWidth: "Largeur de la photo principale",
  thumbSize: "Taille des miniatures",
  typography: "Texte",
  button: "Bouton",
  style: "Style",
};
