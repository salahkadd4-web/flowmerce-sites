"use client";

// Formulaire produit — même écriture que « Créer un site » (libellé, aide et
// erreur sous le champ, bouton principal avec état d'envoi).

import { useMemo, useState, useTransition } from "react";
import { AlertTriangle, Loader2, Plus, Trash2 } from "lucide-react";
import { BTN_GHOST, BTN_PRIMARY, FIELD, FIELD_ERROR, HINT, LABEL, Notice } from "@/components/dashboard/ui";
import { ImageUploader } from "@/components/media/ImageUploader";
import type { MediaValue } from "@/blocks/shared";
import { buildVariants, parseOptionValues, variantKey } from "@/lib/product-input";
import { saveProduct } from "./actions";

export type ProductFormValues = {
  name: string;
  description: string;
  price: number | null;
  comparePrice: number | null;
  images: MediaValue[];
  optionAxes: { name: string; values: string[] }[];
  stocks: Record<string, number>;
  active: boolean;
};

const toNumber = (value: string) => (value.trim() === "" ? null : Number(value));

export function ProductForm({ productId, initial }: { productId: string | null; initial: ProductFormValues }) {
  const [name, setName] = useState(initial.name);
  const [description, setDescription] = useState(initial.description);
  const [price, setPrice] = useState(initial.price?.toString() ?? "");
  const [comparePrice, setComparePrice] = useState(initial.comparePrice?.toString() ?? "");
  const [images, setImages] = useState(initial.images);
  const [axes, setAxes] = useState(initial.optionAxes.map((a) => ({ name: a.name, values: a.values.join(", ") })));
  const [stocks, setStocks] = useState<Record<string, string>>(
    Object.fromEntries(Object.entries(initial.stocks).map(([k, v]) => [k, String(v)])),
  );
  const [active, setActive] = useState(initial.active);
  const [error, setError] = useState<{ field?: string; message: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const parsedAxes = useMemo(
    () => axes.map((a) => ({ name: a.name.trim(), values: parseOptionValues(a.values) })).filter((a) => a.name && a.values.length),
    [axes],
  );
  const variants = useMemo(() => buildVariants(parsedAxes), [parsedAxes]);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    const input = {
      name,
      description,
      price: toNumber(price) ?? 0,
      comparePrice: toNumber(comparePrice),
      images,
      optionAxes: parsedAxes,
      stocks: Object.fromEntries(variants.map((v) => [variantKey(v), toNumber(stocks[variantKey(v)] ?? "") ?? 0])),
      active,
    };
    startTransition(async () => {
      const result = await saveProduct(productId, input);
      if (result?.error) setError({ field: result.field, message: result.error });
    });
  }

  const errorFor = (field: string) =>
    error?.field === field ? (
      <p id={`product-${field}-error`} role="alert" className={FIELD_ERROR}>
        {error.message}
      </p>
    ) : null;

  return (
    <form onSubmit={submit} className="flex flex-col gap-6" noValidate>
      {error && !error.field && (
        <Notice tone="danger" icon={AlertTriangle} title="Enregistrement impossible">
          {error.message}
        </Notice>
      )}

      <div>
        <label htmlFor="product-name" className={LABEL}>Nom du produit</label>
        <input id="product-name" className={FIELD} value={name} maxLength={120} disabled={pending} onChange={(e) => setName(e.target.value)} aria-invalid={error?.field === "name" || undefined} />
        {errorFor("name")}
      </div>

      <div>
        <label htmlFor="product-description" className={LABEL}>Description</label>
        <textarea id="product-description" className={`${FIELD} min-h-32`} value={description} maxLength={3000} disabled={pending} onChange={(e) => setDescription(e.target.value)} aria-describedby="product-description-hint" />
        <p id="product-description-hint" className={HINT}>Une ligne vide sépare deux paragraphes.</p>
        {errorFor("description")}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="product-price" className={LABEL}>Prix (DA)</label>
          <input id="product-price" className={FIELD} inputMode="numeric" value={price} disabled={pending} onChange={(e) => setPrice(e.target.value.replace(/[^\d]/g, ""))} aria-invalid={error?.field === "price" || undefined} />
          {errorFor("price")}
        </div>
        <div>
          <label htmlFor="product-compare" className={LABEL}>Prix barré (DA, facultatif)</label>
          <input id="product-compare" className={FIELD} inputMode="numeric" value={comparePrice} disabled={pending} onChange={(e) => setComparePrice(e.target.value.replace(/[^\d]/g, ""))} aria-describedby="product-compare-hint" aria-invalid={error?.field === "comparePrice" || undefined} />
          <p id="product-compare-hint" className={HINT}>Ancien prix affiché barré, supérieur au prix.</p>
          {errorFor("comparePrice")}
        </div>
      </div>

      <div>
        <p className={LABEL}>Photos</p>
        <ImageUploader id="product-images" value={images} onChange={setImages} max={8} disabled={pending} />
        {errorFor("images")}
      </div>

      <fieldset className="flex flex-col gap-3">
        <legend className={LABEL}>Options (taille, couleur…)</legend>
        {axes.map((axis, index) => (
          <div key={index} className="grid gap-2 sm:grid-cols-[10rem_1fr_auto] sm:items-start">
            <input aria-label={`Nom de l'option ${index + 1}`} placeholder="Taille" className={FIELD} value={axis.name} maxLength={30} disabled={pending} onChange={(e) => setAxes((list) => list.map((a, i) => (i === index ? { ...a, name: e.target.value } : a)))} />
            <input aria-label={`Valeurs de l'option ${index + 1}`} placeholder="38, 39, 40" className={FIELD} value={axis.values} disabled={pending} onChange={(e) => setAxes((list) => list.map((a, i) => (i === index ? { ...a, values: e.target.value } : a)))} />
            <button type="button" className={BTN_GHOST} disabled={pending} onClick={() => setAxes((list) => list.filter((_, i) => i !== index))}>
              <Trash2 size={15} aria-hidden />
              Retirer
            </button>
          </div>
        ))}
        {axes.length < 2 && (
          <div>
            <button type="button" className={BTN_GHOST} disabled={pending} onClick={() => setAxes((list) => [...list, { name: "", values: "" }])}>
              <Plus size={15} aria-hidden />
              Ajouter une option
            </button>
          </div>
        )}
        <p className={HINT}>Deux options au plus. Valeurs séparées par des virgules.</p>
        {errorFor("optionAxes")}
      </fieldset>

      <div>
        <p className={LABEL}>Stock</p>
        <ul className="m-0 flex list-none flex-col divide-y divide-line rounded-control border border-line p-0">
          {variants.map((options) => {
            const key = variantKey(options);
            const label = Object.values(options).join(" / ") || "Stock du produit";
            return (
              <li key={key} className="flex items-center justify-between gap-4 px-3 py-2">
                <label htmlFor={`stock-${key}`} className="text-[14px] text-ink">{label}</label>
                <input
                  id={`stock-${key}`}
                  className={`${FIELD} w-28`}
                  inputMode="numeric"
                  value={stocks[key] ?? "0"}
                  disabled={pending}
                  onChange={(e) => setStocks((s) => ({ ...s, [key]: e.target.value.replace(/[^\d]/g, "") }))}
                />
              </li>
            );
          })}
        </ul>
        <p className={HINT}>Le stock baisse quand vous confirmez une commande, pas quand l&apos;acheteur commande.</p>
        {errorFor("stocks")}
      </div>

      <label className="flex items-center gap-2.5 text-[14px] text-ink">
        <input type="checkbox" checked={active} disabled={pending} onChange={(e) => setActive(e.target.checked)} className="size-4 accent-brand" />
        Produit actif (visible sur les pages qui l&apos;utilisent)
      </label>

      <div>
        <button type="submit" disabled={pending} className={BTN_PRIMARY}>
          {pending && <Loader2 size={15} className="animate-spin" aria-hidden />}
          {pending ? "Enregistrement" : "Enregistrer le produit"}
        </button>
      </div>
    </form>
  );
}
