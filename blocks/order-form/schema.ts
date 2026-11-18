import { z } from "zod";
import { text } from "@/blocks/shared";

export const orderFormSchema = z.object({
  id: z.string(),
  title: text(80),
  submitLabel: z.string().trim().min(1).max(40),
});

export type OrderFormProps = z.infer<typeof orderFormSchema>;

export const ORDER_FORM_FIELD_LABELS: Record<keyof OrderFormProps, string> = {
  id: "Identifiant",
  title: "Titre",
  submitLabel: "Texte du bouton",
};
