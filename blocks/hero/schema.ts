import { z } from "zod";
import { alignSchema, mediaSchema, optionalHrefSchema, text } from "@/blocks/shared";

export const HERO_BACKGROUNDS = ["light", "dark", "indigo", "sand"] as const;

export const heroSchema = z.object({
  id: z.string(),
  title: text(120),
  subtitle: text(300),
  image: mediaSchema.nullable(),
  // Ajouté en 1C : absent des anciens contenus, d'où la valeur par défaut.
  imageAlt: text(150).default(""),
  buttonLabel: text(40),
  buttonHref: optionalHrefSchema,
  align: alignSchema,
  background: z.enum(HERO_BACKGROUNDS),
});

export type HeroProps = z.infer<typeof heroSchema>;

export const HERO_FIELD_LABELS: Record<keyof HeroProps, string> = {
  id: "Identifiant",
  title: "Titre",
  subtitle: "Sous-titre",
  image: "Image",
  imageAlt: "Description de l'image",
  buttonLabel: "Texte du bouton",
  buttonHref: "Lien du bouton",
  align: "Alignement",
  background: "Fond",
};
