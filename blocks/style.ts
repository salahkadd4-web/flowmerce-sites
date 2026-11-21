// blocks/style.ts — réglages de style communs aux blocs : fond, couleurs, tailles.
//
// Toutes les valeurs viennent de listes fermées ou de nombres bornés ; une couleur
// est « auto » ou un #rrggbb validé. Seules ces valeurs validées atteignent un
// attribut style (§7 : aucun CSS arbitraire). Les classes Tailwind sont écrites
// en entier ici pour être vues par Tailwind.

import type { CSSProperties } from "react";
import { z } from "zod";
import { mediaSchema } from "@/blocks/shared";

/** Couleurs proposées en un clic : les jetons du thème (app/globals.css). */
export const PALETTE: readonly { name: string; hex: string }[] = [
  { name: "Blanc", hex: "#ffffff" },
  { name: "Gris clair", hex: "#f7f8fc" },
  { name: "Lavande", hex: "#ebeefb" },
  { name: "Sable", hex: "#faf6f0" },
  { name: "Indigo", hex: "#4f46e5" },
  { name: "Indigo foncé", hex: "#4338ca" },
  { name: "Nuit", hex: "#16265c" },
  { name: "Encre", hex: "#0f1a3d" },
];

export const hexColorSchema = z.string().regex(/^#[0-9a-f]{6}$/i);
export const colorOrAutoSchema = z.union([z.literal("auto"), hexColorSchema]);
export type ColorOrAuto = z.infer<typeof colorOrAutoSchema>;

export const sectionStyleSchema = z
  .object({
    background: z.enum(["default", "color", "image"]).default("default"),
    backgroundColor: hexColorSchema.default("#ffffff"),
    backgroundImage: mediaSchema.nullable().default(null),
    overlay: z.number().int().min(0).max(80).multipleOf(10).default(40),
    // Hauteur minimale, en % de la hauteur de l'écran (0 : selon le contenu). Poignée du bas.
    minHeight: z
      .number()
      .int()
      .min(0)
      .max(100)
      .multipleOf(10)
      .refine((value) => value === 0 || value >= 20)
      .default(0),
    spacing: z.enum(["compact", "normal", "airy"]).default("normal"),
    width: z.enum(["narrow", "normal", "wide"]).default("normal"),
  })
  .default({});
export type SectionStyle = z.infer<typeof sectionStyleSchema>;

export const SIZES = ["s", "m", "l", "xl"] as const;
export type Size = (typeof SIZES)[number];

export const typographySchema = z
  .object({
    titleSize: z.enum(SIZES).default("m"),
    titleColor: colorOrAutoSchema.default("auto"),
    textSize: z.enum(SIZES).default("m"),
    textColor: colorOrAutoSchema.default("auto"),
  })
  .default({});
export type Typography = z.infer<typeof typographySchema>;

export const BUTTON_SIZE_IDS = ["s", "m", "l"] as const;

export const buttonStyleSchema = z
  .object({
    color: colorOrAutoSchema.default("auto"),
    textColor: colorOrAutoSchema.default("auto"),
    size: z.enum(BUTTON_SIZE_IDS).default("m"),
    // Largeur : ajustée au texte, ou en % du contenu de la section. Poignées des côtés.
    width: z.union([z.literal("auto"), z.number().int().min(20).max(100).multipleOf(10)]).default("auto"),
  })
  .default({});
export type ButtonStyle = z.infer<typeof buttonStyleSchema>;

/** Largeur d'une image, en % de sa section, par paliers de 5 (poignées des côtés). */
export const imageWidthSchema = z.number().int().min(30).max(100).multipleOf(5).default(100);

/**
 * Cadre d'une image : sa hauteur en % de sa largeur (poignées du haut et du bas), ou
 * null pour ses proportions naturelles. La photo remplit le cadre, rognée, jamais déformée.
 */
export const imageHeightSchema = z.number().int().min(30).max(200).multipleOf(5).nullable().default(null);

/**
 * Réglages par défaut : un contenu enregistré avant ces réglages (ou relu d'un
 * cache plus ancien que le code) n'en a pas, et chaque bloc s'affiche alors comme avant.
 */
export const DEFAULT_SECTION_STYLE: SectionStyle = sectionStyleSchema.parse(undefined);
export const DEFAULT_TYPOGRAPHY: Typography = typographySchema.parse(undefined);
export const DEFAULT_BUTTON: ButtonStyle = buttonStyleSchema.parse(undefined);

/** Ton du fond : un fond sombre appelle un texte clair. */
export type Tone = "light" | "dark";

function channel(value: number): number {
  const c = value / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

/** Luminance relative WCAG d'un #rrggbb. */
function luminance(hex: string): number {
  const n = Number.parseInt(hex.slice(1), 16);
  return 0.2126 * channel((n >> 16) & 255) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255);
}

// Seuil où un texte blanc et un texte encre (#0f1a3d) offrent le même contraste :
// en dessous, le blanc se lit mieux.
const DARK_LUMINANCE = 0.2;

export function isDarkColor(hex: string): boolean {
  return luminance(hex) < DARK_LUMINANCE;
}

// Assombrissement à partir duquel un texte clair se lit sur une photo.
const DARK_OVERLAY = 40;

export function sectionTone(style: SectionStyle, defaultTone: Tone): Tone {
  if (style.background === "image" && style.backgroundImage) return style.overlay >= DARK_OVERLAY ? "dark" : "light";
  if (style.background === "color") return isDarkColor(style.backgroundColor) ? "dark" : "light";
  return defaultTone;
}

/** Couleur d'un texte : classe automatique selon le fond, ou couleur choisie. */
export function colorProps(value: ColorOrAuto, autoClass: string): { className: string; style?: CSSProperties } {
  return value === "auto" ? { className: autoClass } : { className: "", style: { color: value } };
}

export const TEXT_AUTO: Record<Tone, { title: string; text: string }> = {
  light: { title: "text-ink", text: "text-body" },
  dark: { title: "text-white", text: "text-white/80" },
};

export const HERO_TITLE_SIZES: Record<Size, string> = {
  s: "text-2xl sm:text-3xl",
  m: "text-3xl sm:text-4xl",
  l: "text-4xl sm:text-5xl",
  xl: "text-5xl sm:text-6xl",
};

export const SECTION_TITLE_SIZES: Record<Size, string> = {
  s: "text-xl",
  m: "text-2xl",
  l: "text-3xl",
  xl: "text-4xl",
};

export const TEXT_SIZES: Record<Size, string> = {
  s: "text-sm",
  m: "text-base",
  l: "text-lg",
  xl: "text-xl",
};

export const HERO_TEXT_SIZES: Record<Size, string> = {
  s: "text-sm sm:text-base",
  m: "text-base sm:text-lg",
  l: "text-lg sm:text-xl",
  xl: "text-xl sm:text-2xl",
};

export const BUTTON_SIZES: Record<ButtonStyle["size"], string> = {
  s: "px-4 py-2.5 text-sm",
  m: "px-6 py-3.5 text-base",
  l: "px-8 py-4 text-lg",
};

const BUTTON_BASE =
  "inline-flex items-center justify-center rounded-control font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current";

const BUTTON_AUTO: Record<Tone, string> = {
  light: "bg-brand text-on-brand hover:bg-brand-dark",
  dark: "bg-white text-deep hover:bg-haze",
};

/** Classes et style d'un bouton d'appel, selon ses réglages et le fond de la section. */
export function buttonProps(button: ButtonStyle, tone: Tone): { className: string; style?: CSSProperties } {
  const size = BUTTON_SIZES[button.size];
  const style: CSSProperties = {};
  let colors: string;
  if (button.color === "auto") {
    colors = BUTTON_AUTO[tone];
    if (button.textColor !== "auto") colors = colors.replace(/\btext-\S+/, "");
  } else {
    style.backgroundColor = button.color;
    colors = button.textColor === "auto" ? `${isDarkColor(button.color) ? "text-white" : "text-ink"} hover:opacity-90` : "hover:opacity-90";
  }
  if (button.textColor !== "auto") style.color = button.textColor;
  if (button.width !== undefined && button.width !== "auto") style.width = `${button.width}%`;
  const className = `${BUTTON_BASE} ${size} ${colors}`.replace(/\s+/g, " ").trim();
  return Object.keys(style).length > 0 ? { className, style } : { className };
}

export const SPACING: Record<Exclude<SectionStyle["spacing"], "normal">, string> = {
  compact: "py-6 sm:py-8",
  airy: "py-16 sm:py-24",
};

export const WIDTHS: Record<Exclude<SectionStyle["width"], "normal">, string> = {
  narrow: "max-w-xl",
  wide: "max-w-5xl",
};
