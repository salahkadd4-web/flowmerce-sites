import { z } from "zod";
import { richTextSchema } from "@/blocks/rich-text";
import { alignSchema } from "@/blocks/shared";
import { sectionStyleSchema, typographySchema } from "@/blocks/style";

export const textSchema = z.object({
  id: z.string(),
  title: richTextSchema(120),
  body: richTextSchema(3000),
  align: alignSchema,
  typography: typographySchema,
  style: sectionStyleSchema,
});

export type TextProps = z.infer<typeof textSchema>;

export const TEXT_FIELD_LABELS: Record<keyof TextProps, string> = {
  id: "Identifiant",
  title: "Titre",
  body: "Texte",
  align: "Alignement",
  typography: "Texte",
  style: "Style",
};
