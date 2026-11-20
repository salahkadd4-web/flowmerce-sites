import { z } from "zod";
import { text } from "@/blocks/shared";
import { buttonStyleSchema, sectionStyleSchema, typographySchema } from "@/blocks/style";

export const orderFormSchema = z.object({
  id: z.string(),
  title: text(80),
  submitLabel: z.string().trim().min(1).max(40),
  typography: typographySchema,
  // Bouton de commande : grand par défaut (le rendu d'avant les réglages).
  button: buttonStyleSchema.default({ size: "l" }),
  style: sectionStyleSchema,
});

export type OrderFormProps = z.infer<typeof orderFormSchema>;

export const ORDER_FORM_FIELD_LABELS: Record<keyof OrderFormProps, string> = {
  id: "Identifiant",
  title: "Titre",
  submitLabel: "Texte du bouton",
  typography: "Texte",
  button: "Bouton",
  style: "Style",
};
