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

// « facebook.com/maboutique », « www.instagram.com/x », « wa.me/213… » : un nom de
// domaine avec au moins un point, sans schéma — la saisie la plus courante.
const BARE_DOMAIN = /^(?:[a-z0-9-]+\.)+[a-z]{2,}(?:[/?#]\S*)?$/i;

/** Ajoute https:// à un lien saisi sans schéma ; laisse tout le reste tel quel. */
export function withDefaultScheme(value: unknown): unknown {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  return BARE_DOMAIN.test(trimmed) ? `https://${trimmed}` : trimmed;
}

const strictHref = z.string().max(500).refine(isSafeHref);

export const hrefSchema = z.preprocess(withDefaultScheme, strictHref);

/** Lien facultatif : chaîne vide = pas de lien. */
export const optionalHrefSchema = z.preprocess(withDefaultScheme, z.union([z.literal(""), strictHref]));

/** Téléphone tel qu'il s'écrit en Algérie : chiffres, +, espaces, points, tirets, parenthèses. */
export const phoneSchema = z.union([
  z.literal(""),
  z
    .string()
    .trim()
    .regex(/^[+0-9 .()-]{3,25}$/)
    .refine((value) => (value.match(/\d/g) ?? []).length >= 3),
]);

/** Lien tel: : seuls les chiffres et le + initial comptent. */
export function telHref(phone: string): string {
  return `tel:${phone.replace(/[^+0-9]/g, "")}`;
}

/**
 * Image d'une page : envoyée par le vendeur (lib/media.ts, chemin /media/<clé>),
 * ou photo d'un modèle servie par le site (public/templates/<modèle>/<nom>).
 */
export const mediaSchema = z.object({
  url: z.string().regex(/^\/(media\/[a-f0-9]{32}|templates\/[a-z0-9-]+\/[a-z0-9-]+)\.(jpg|png|webp|avif)$/),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
});

export type MediaValue = z.infer<typeof mediaSchema>;

export const alignSchema = z.enum(["left", "center"]);

/** Chaîne bornée, vide permise. */
export const text = (max: number) => z.string().max(max);
