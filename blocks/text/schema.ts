import { z } from "zod";
import { alignSchema, text } from "@/blocks/shared";

export const textSchema = z.object({
  id: z.string(),
  title: text(120),
  body: text(3000),
  align: alignSchema,
});

export type TextProps = z.infer<typeof textSchema>;

export const TEXT_FIELD_LABELS: Record<keyof TextProps, string> = {
  id: "Identifiant",
  title: "Titre",
  body: "Texte",
  align: "Alignement",
};
