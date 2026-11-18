import { z } from "zod";
import { mediaSchema, text } from "@/blocks/shared";

export const imageSchema = z.object({
  id: z.string(),
  image: mediaSchema.nullable(),
  alt: z.string().trim().min(1).max(150),
  caption: text(200),
  width: z.enum(["full", "contained"]),
});

export type ImageProps = z.infer<typeof imageSchema>;

export const IMAGE_FIELD_LABELS: Record<keyof ImageProps, string> = {
  id: "Identifiant",
  image: "Image",
  alt: "Texte alternatif",
  caption: "Légende",
  width: "Largeur",
};
