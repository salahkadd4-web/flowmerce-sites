// blocks/schemas.ts — type de bloc → schéma de ses props.
// Seule définition de ce qu'est un bloc valide : utilisée à l'enregistrement
// (validatePageContent, strict) et à l'affichage (parsePageContent, bloc par bloc).

import type { z } from "zod";
import { FOOTER_FIELD_LABELS, footerSchema } from "@/blocks/footer/schema";
import { HERO_FIELD_LABELS, heroSchema } from "@/blocks/hero/schema";
import { IMAGE_FIELD_LABELS, imageSchema } from "@/blocks/image/schema";
import { TEXT_FIELD_LABELS, textSchema } from "@/blocks/text/schema";

export const BLOCK_TYPES = ["Hero", "Text", "Image", "Footer"] as const;
export type BlockType = (typeof BLOCK_TYPES)[number];

export const BLOCK_SCHEMAS: Record<BlockType, z.ZodTypeAny> = {
  Hero: heroSchema,
  Text: textSchema,
  Image: imageSchema,
  Footer: footerSchema,
};

/** Nom du bloc tel que le vendeur le voit dans l'éditeur. */
export const BLOCK_LABELS: Record<BlockType, string> = {
  Hero: "Bannière",
  Text: "Texte",
  Image: "Image",
  Footer: "Pied de page",
};

export const BLOCK_FIELD_LABELS: Record<BlockType, Record<string, string>> = {
  Hero: HERO_FIELD_LABELS,
  Text: TEXT_FIELD_LABELS,
  Image: IMAGE_FIELD_LABELS,
  Footer: FOOTER_FIELD_LABELS,
};

export function isBlockType(type: unknown): type is BlockType {
  return typeof type === "string" && (BLOCK_TYPES as readonly string[]).includes(type);
}
