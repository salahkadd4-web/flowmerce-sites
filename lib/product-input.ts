// lib/product-input.ts — produit : saisie du vendeur, variantes, forme publique.
// Fonctions pures (sans base) : utilisées par le formulaire, le serveur et les tests.

import { z } from "zod";
import { mediaSchema, type MediaValue } from "@/blocks/shared";

export type OptionAxis = { name: string; values: string[] };

const axisSchema = z
  .object({
    name: z.string().trim().min(1, "Nom d'option manquant").max(30),
    values: z.array(z.string().trim().min(1).max(30)).min(1, "Au moins une valeur").max(20, "20 valeurs au plus"),
  })
  .refine((axis) => new Set(axis.values).size === axis.values.length, { message: "Valeurs en double", path: ["values"] });

export const productInputSchema = z
  .object({
    name: z.string().trim().min(1, "Donnez un nom au produit").max(120, "120 caractères maximum"),
    description: z.string().max(3000, "3 000 caractères maximum"),
    price: z.number().int("Prix en dinars entiers").min(1, "Prix obligatoire").max(10_000_000),
    comparePrice: z.number().int().max(10_000_000).nullable(),
    images: z.array(mediaSchema).max(8, "8 photos au plus"),
    optionAxes: z
      .array(axisSchema)
      .max(2, "Deux options au plus")
      .refine((axes) => new Set(axes.map((a) => a.name)).size === axes.length, "Deux options portent le même nom"),
    stocks: z.record(z.number().int("Stock entier").min(0, "Stock positif").max(100_000)),
    active: z.boolean(),
  })
  .refine((p) => p.comparePrice === null || p.comparePrice > p.price, {
    message: "Le prix barré doit être supérieur au prix",
    path: ["comparePrice"],
  });

export type ProductInput = z.infer<typeof productInputSchema>;

/** Clé stable d'une variante, indépendante de l'ordre des options : « Couleur=noir|Taille=39 ». */
export function variantKey(options: Record<string, string>): string {
  return Object.keys(options)
    .sort()
    .map((name) => `${name}=${options[name]}`)
    .join("|");
}

/** Toutes les combinaisons des axes ; une variante unique {} sans axe. */
export function buildVariants(axes: OptionAxis[]): Record<string, string>[] {
  return axes.reduce<Record<string, string>[]>(
    (combinations, axis) => combinations.flatMap((combo) => axis.values.map((value) => ({ ...combo, [axis.name]: value }))),
    [{}],
  );
}

/** Produit tel qu'il part dans la page (et donc dans le navigateur) : jamais le stock exact. */
export type PublicProduct = {
  id: string;
  name: string;
  description: string;
  price: number;
  comparePrice: number | null;
  images: MediaValue[];
  optionAxes: OptionAxis[];
  variants: { id: string; options: Record<string, string>; inStock: boolean }[];
};

export function toPublicProduct(product: {
  id: string;
  name: string;
  description: string;
  price: number;
  comparePrice: number | null;
  images: unknown;
  optionAxes: unknown;
  variants: { id: string; options: unknown; stock: number }[];
}): PublicProduct {
  const images = z.array(mediaSchema).safeParse(product.images);
  const axes = z.array(axisSchema).safeParse(product.optionAxes);
  return {
    id: product.id,
    name: product.name,
    description: product.description,
    price: product.price,
    comparePrice: product.comparePrice,
    images: images.success ? images.data : [],
    optionAxes: axes.success ? axes.data : [],
    variants: product.variants.map((v) => ({
      id: v.id,
      options: (v.options ?? {}) as Record<string, string>,
      inStock: v.stock > 0,
    })),
  };
}

export function productsTag(tenantId: string): string {
  return "tenant-products:" + tenantId;
}
