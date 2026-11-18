// blocks/shared.ts — règles communes aux blocs (§7 : aucun contenu exécutable).

import { z } from "zod";

const ANCHOR = /^#[A-Za-z0-9_-]{1,100}$/;
const TEL = /^tel:[+0-9 ]{3,20}$/;
const MAILTO = /^mailto:[^\s@]+@[^\s@]+\.[^\s@]+$/;
const HTTP = /^https?:\/\/\S+$/i;

/**
 * Lien autorisé dans un bloc : ancre de la page, http(s), tel: ou mailto:.
 * Tout le reste (javascript:, data:, vbscript:, //hôte, caractères de contrôle…)
 * est refusé. Vérifié à l'enregistrement et de nouveau au rendu.
 */
export function isSafeHref(href: string): boolean {
  const value = href.trim();
  if (ANCHOR.test(value) || TEL.test(value) || MAILTO.test(value)) return true;
  if (!HTTP.test(value)) return false;
  try {
    const url = new URL(value);
    return (url.protocol === "https:" || url.protocol === "http:") && url.hostname !== "";
  } catch {
    return false;
  }
}

export const hrefSchema = z.string().trim().max(500).refine(isSafeHref);

/** Lien facultatif : chaîne vide = pas de lien. */
export const optionalHrefSchema = z.union([z.literal(""), hrefSchema]);

/** Image envoyée par le vendeur (lib/media.ts) : chemin /media/<clé>. */
export const mediaSchema = z.object({
  url: z.string().regex(/^\/media\/[a-f0-9]{32}\.(jpg|png|webp|avif)$/),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
});

export type MediaValue = z.infer<typeof mediaSchema>;

export const alignSchema = z.enum(["left", "center"]);

/** Chaîne bornée, vide permise. */
export const text = (max: number) => z.string().max(max);
