import { z } from "zod";
import { richTextSchema } from "@/blocks/rich-text";
import { alignSchema, mediaSchema, optionalHrefSchema, text } from "@/blocks/shared";
import { buttonStyleSchema, imageWidthSchema, sectionStyleSchema, typographySchema } from "@/blocks/style";

/** Anciens fonds de la bannière (avant les réglages de style) → couleur équivalente. */
const LEGACY_BACKGROUNDS: Record<string, string | null> = {
  light: null,
  dark: "#16265c",
  indigo: "#4f46e5",
  sand: "#faf6f0",
};

/** Une bannière enregistrée avant les réglages de style garde son fond. */
function legacyHeroStyle(raw: unknown): unknown {
  if (!raw || typeof raw !== "object") return raw;
  const { background, ...props } = raw as Record<string, unknown>;
  if (props.style !== undefined || typeof background !== "string") return props;
  const color = LEGACY_BACKGROUNDS[background];
  return color ? { ...props, style: { background: "color", backgroundColor: color } } : props;
}

export const heroSchema = z.preprocess(
  legacyHeroStyle,
  z.object({
    id: z.string(),
    title: richTextSchema(120),
    subtitle: richTextSchema(300),
    image: mediaSchema.nullable(),
    // Ajouté en 1C : absent des anciens contenus, d'où la valeur par défaut.
    imageAlt: text(150).default(""),
    imageWidth: imageWidthSchema,
    buttonLabel: text(40),
    buttonHref: optionalHrefSchema,
    align: alignSchema,
    typography: typographySchema,
    button: buttonStyleSchema,
    style: sectionStyleSchema,
  }),
);

export type HeroProps = z.infer<typeof heroSchema>;

export const HERO_FIELD_LABELS: Record<keyof HeroProps, string> = {
  id: "Identifiant",
  title: "Titre",
  subtitle: "Sous-titre",
  image: "Image",
  imageAlt: "Description de l'image",
  imageWidth: "Largeur de l'image",
  buttonLabel: "Texte du bouton",
  buttonHref: "Lien du bouton",
  align: "Alignement",
  typography: "Texte",
  button: "Bouton",
  style: "Style",
};
