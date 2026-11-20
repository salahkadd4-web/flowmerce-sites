// blocks/fonts.ts — polices au choix d'une page, lisibles en français et en arabe.
//
// Servies par le site lui-même (next/font les télécharge à la construction) :
// aucune requête vers Google chez l'acheteur. preload: false — une police que la
// page n'utilise pas n'est jamais téléchargée par le navigateur.

import { Almarai, Amiri, Cairo, IBM_Plex_Sans_Arabic, Noto_Kufi_Arabic, Tajawal } from "next/font/google";

const cairo = Cairo({ subsets: ["arabic", "latin"], display: "swap", preload: false });
const tajawal = Tajawal({ subsets: ["arabic", "latin"], weight: ["400", "500", "700", "800"], display: "swap", preload: false });
const almarai = Almarai({ subsets: ["arabic"], weight: ["400", "700", "800"], display: "swap", preload: false });
const plexArabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  preload: false,
});
const notoKufi = Noto_Kufi_Arabic({ subsets: ["arabic", "latin"], display: "swap", preload: false });
const amiri = Amiri({ subsets: ["arabic", "latin"], weight: ["400", "700"], display: "swap", preload: false });

/** Pile système : celle du layout des sites (app/s/[host]/layout.tsx). */
export const SYSTEM_FONTS = 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

export const FONT_IDS = ["system", "cairo", "tajawal", "almarai", "plex-arabic", "noto-kufi", "amiri"] as const;
export type FontId = (typeof FONT_IDS)[number];

export const FONT_LABELS: Record<FontId, string> = {
  system: "Système (par défaut)",
  cairo: "Cairo",
  tajawal: "Tajawal",
  almarai: "Almarai",
  "plex-arabic": "IBM Plex Sans Arabic",
  "noto-kufi": "Noto Kufi Arabic",
  amiri: "Amiri (élégante)",
};

const FAMILIES: Record<Exclude<FontId, "system">, string> = {
  cairo: cairo.style.fontFamily,
  tajawal: tajawal.style.fontFamily,
  almarai: almarai.style.fontFamily,
  "plex-arabic": plexArabic.style.fontFamily,
  "noto-kufi": notoKufi.style.fontFamily,
  amiri: amiri.style.fontFamily,
};

export function isFontId(value: unknown): value is FontId {
  return typeof value === "string" && (FONT_IDS as readonly string[]).includes(value);
}

export function fontFamily(id: FontId): string {
  return id === "system" ? SYSTEM_FONTS : `${FAMILIES[id]}, ${SYSTEM_FONTS}`;
}
