import { z } from "zod";
import { text } from "@/blocks/shared";

// Le produit lui-même n'est pas dans le bloc : c'est le « Produit de la page »
// (root.props.productId), relu frais à chaque rendu (lib/storefront.ts).
export const productSchema = z.object({
  id: z.string(),
  buttonLabel: text(40),
});

export type ProductProps = z.infer<typeof productSchema>;

export const PRODUCT_FIELD_LABELS: Record<keyof ProductProps, string> = {
  id: "Identifiant",
  buttonLabel: "Texte du bouton",
};
