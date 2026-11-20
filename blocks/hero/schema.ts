import { z } from "zod";
import { richTextSchema } from "@/blocks/rich-text";
import { alignSchema, mediaSchema, optionalHrefSchema, text } from "@/blocks/shared";
import { buttonStyleSchema, imageWidthSchema, sectionStyleSchema, typographySchema } from "@/blocks/style";

/** Anciens fonds de la bannière (avant les réglages de style) → fond et bouton équivalents. */
const LEGACY_BACKGROUNDS: Record<string, { color: string; button?: Record<string, string> } | null> = {
  light: null,
  dark: { color: "#16265c" },
  // Bouton blanc au texte indigo foncé, comme avant.
  indigo: { color: "#4f46e5", button: { textColor: "#4338ca" } },
  // Bouton nuit, comme avant.
  sand: { color: "#faf6f0", button: { color: "#16265c" } },
};

/** Une bannière enregistrée avant les réglages de style garde son fond et son bouton. */
function legacyHeroStyle(raw: unknown): unknown {
  if (!raw || typeof raw !== "object") return raw;
  const { background, ...props } = raw as Record<string, unknown>;
  if (props.style !== undefined || typeof background !== "string") return props;
  const legacy = LEGACY_BACKGROUNDS[background];
  if (!legacy) return props;
  return {
    ...props,
    style: { background: "color", backgroundColor: legacy.color },
    ...(legacy.button && props.button === undefined ? { button: legacy.button } : {}),
  };
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
