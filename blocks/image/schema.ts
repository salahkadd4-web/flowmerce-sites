import { z } from "zod";
import { mediaSchema, text } from "@/blocks/shared";
import { imageWidthSchema, sectionStyleSchema } from "@/blocks/style";

export const IMAGE_ROUNDED = ["none", "soft", "strong"] as const;

export const imageSchema = z.object({
  id: z.string(),
  image: mediaSchema.nullable(),
  alt: z.string().trim().min(1).max(150),
  caption: text(200),
  width: z.enum(["full", "contained"]),
  imageWidth: imageWidthSchema,
  rounded: z.enum(IMAGE_ROUNDED).default("soft"),
  style: sectionStyleSchema,
});

export type ImageProps = z.infer<typeof imageSchema>;

export const IMAGE_FIELD_LABELS: Record<keyof ImageProps, string> = {
  id: "Identifiant",
  image: "Image",
  alt: "Texte alternatif",
  caption: "Légende",
  width: "Largeur",
  imageWidth: "Taille de l'image",
  rounded: "Coins arrondis",
  style: "Style",
};
