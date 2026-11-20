// lib/algeria/wilayas.ts — 69 wilayas et leurs communes.
//
// Données : Wilaya_Commune_FR.json et Wilaya_Commune_AR.json, copiés de Caba-Store
// (données de Salah, 69 wilayas, 1 577 communes). Les listes FR et AR ne sont pas
// alignées commune par commune : une commune est valide si elle figure dans l'une
// ou l'autre liste de sa wilaya.
//
// Importable côté serveur uniquement pour les communes (≈ 80 ko de JSON) : le
// formulaire public les charge à la demande (GET /api/orders/communes).

import communesAr from "./Wilaya_Commune_AR.json";
import communesFr from "./Wilaya_Commune_FR.json";

type RawWilaya = { code: string; name: string; communes: string[] };

export type Wilaya = { code: number; fr: string; ar: string };

const FR = communesFr as RawWilaya[];
const AR = communesAr as RawWilaya[];
const arByCode = new Map(AR.map((w) => [Number(w.code), w]));

export const WILAYAS: readonly Wilaya[] = FR.map((w) => ({
  code: Number(w.code),
  fr: w.name,
  ar: arByCode.get(Number(w.code))?.name ?? w.name,
}));

const byCode = new Map(WILAYAS.map((w) => [w.code, w]));
const frCommunes = new Map(FR.map((w) => [Number(w.code), w.communes.map((c) => c.trim())]));
const arCommunes = new Map(AR.map((w) => [Number(w.code), w.communes.map((c) => c.trim())]));
const allCommunes = new Map<number, Set<string>>();
for (const list of [FR, AR]) {
  for (const w of list) {
    const set = allCommunes.get(Number(w.code)) ?? new Set<string>();
    for (const commune of w.communes) set.add(commune.trim());
    allCommunes.set(Number(w.code), set);
  }
}

export function wilayaName(code: number): string | null {
  return byCode.get(code)?.fr ?? null;
}

/** Nom arabe de la wilaya. */
export function wilayaNameAr(code: number): string | null {
  return byCode.get(code)?.ar ?? null;
}

/** Communes de la wilaya affichées à l'acheteur, dans la langue de la page. */
export function communesOf(code: number, lang: "fr" | "ar" = "fr"): readonly string[] {
  return (lang === "ar" ? arCommunes : frCommunes).get(code) ?? [];
}

export function isCommuneOf(code: number, commune: string): boolean {
  const value = commune.trim();
  return value !== "" && (allCommunes.get(code)?.has(value) ?? false);
}
