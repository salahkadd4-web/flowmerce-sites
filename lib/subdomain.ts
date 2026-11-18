// lib/subdomain.ts — choix du sous-domaine d'un site.

import { isReservedSubdomain } from "@/lib/host";

const FORMAT = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;

/** Proposition de sous-domaine à partir du nom du site : « Élégance Shop » → « elegance-shop ». */
export function slugifySubdomain(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 63)
    .replace(/-+$/, "");
}

/** Message d'erreur à afficher sous le champ, ou `null` si le sous-domaine convient. */
export function validateSubdomain(value: string): string | null {
  if (value.length < 3) return "3 caractères minimum";
  if (value.length > 63) return "63 caractères maximum";
  if (!FORMAT.test(value)) {
    return "Lettres minuscules, chiffres et tirets uniquement, sans tiret au début ni à la fin";
  }
  if (isReservedSubdomain(value)) return "Ce sous-domaine est réservé";
  return null;
}
