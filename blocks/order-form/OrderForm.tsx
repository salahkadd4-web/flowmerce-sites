"use client";

// Formulaire de commande COD — seul composant client des pages publiques.
// N'importe rien de Puck ni du serveur (garde : blocks/server-graph.test.ts).
// Le total affiché est indicatif : le serveur recalcule tout (lib/orders/intake.ts).

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { formatDA } from "@/lib/money";
import type { PublicProduct } from "@/lib/product-input";
import type { ShippingOption } from "@/lib/shipping";
import { computeTotals, MAX_QUANTITY } from "./totals";

type Props = { product: PublicProduct; shipping: ShippingOption[]; title: string; submitLabel: string };
type Field = "variantId" | "quantity" | "customerName" | "phone" | "wilayaCode" | "commune" | "address" | "deliveryType";

// 16 px minimum : sous iOS, un champ plus petit fait zoomer la page à la saisie.
const LABEL = "mb-1.5 block text-[15px] font-semibold text-ink";
const INPUT =
  "w-full rounded-control border border-line bg-white px-3.5 py-3 text-base text-ink placeholder:text-faint focus-visible:border-brand focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand disabled:opacity-60";
const ERROR = "mt-1.5 text-[14px] font-medium text-red-700";

const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"] as const;

function firstAvailable(product: PublicProduct): Record<string, string> {
  const variant = product.variants.find((v) => v.inStock) ?? product.variants[0];
  return { ...(variant?.options ?? {}) };
}

export function OrderForm({ product, shipping, title, submitLabel }: Props) {
  const router = useRouter();
  const [selection, setSelection] = useState<Record<string, string>>(() => firstAvailable(product));
  const [quantity, setQuantity] = useState(1);
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [wilayaCode, setWilayaCode] = useState<number | "">("");
  const [communes, setCommunes] = useState<string[]>([]);
  const [communesState, setCommunesState] = useState<"idle" | "loading" | "error">("idle");
  const [commune, setCommune] = useState("");
  const [address, setAddress] = useState("");
  const [deliveryType, setDeliveryType] = useState<"HOME" | "OFFICE">("HOME");
  const [website, setWebsite] = useState("");
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [formError, setFormError] = useState("");
  const [sending, setSending] = useState(false);

  // Fixés à l'ouverture : la même clé rend un nouvel envoi idempotent (double clic,
  // nouvel essai après une coupure réseau).
  const startedAt = useRef(0);
  const idempotencyKey = useRef("");
  useEffect(() => {
    startedAt.current = Date.now();
    idempotencyKey.current = crypto.randomUUID();
  }, []);

  const soldOut = product.variants.every((v) => !v.inStock);
  const variant = product.variants.find((v) => product.optionAxes.every((axis) => v.options[axis.name] === selection[axis.name]));
  const rate = shipping.find((s) => s.wilayaCode === wilayaCode);
  const shippingFee = rate ? (deliveryType === "OFFICE" && rate.office !== null ? rate.office : rate.home) : 0;
  const { subtotal, total } = computeTotals({ unitPrice: product.price, quantity, shippingFee });

  const availableByAxis = useMemo(
    () =>
      Object.fromEntries(
        product.optionAxes.map((axis) => [
          axis.name,
          new Set(product.variants.filter((v) => v.inStock).map((v) => v.options[axis.name])),
        ]),
      ),
    [product],
  );

  async function chooseWilaya(value: string) {
    const code = value === "" ? "" : Number(value);
    setWilayaCode(code);
    setCommune("");
    setCommunes([]);
    const next = shipping.find((s) => s.wilayaCode === code);
    if (!next || next.office === null) setDeliveryType("HOME");
    if (code === "") return;
    setCommunesState("loading");
    try {
      const response = await fetch(`/api/orders/communes?wilaya=${code}`);
      const json = (await response.json()) as { communes?: string[] };
      setCommunes(json.communes ?? []);
      setCommunesState(response.ok ? "idle" : "error");
    } catch {
      setCommunesState("error");
    }
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setFormError("");
    setErrors({});
    if (!variant || !variant.inStock) {
      setErrors({ variantId: "Ce choix est épuisé. Choisissez une autre option." });
      return;
    }

    setSending(true);
    try {
      const params = new URLSearchParams(window.location.search);
      const source = Object.fromEntries(UTM_KEYS.flatMap((key) => (params.get(key) ? [[key, params.get(key)!.slice(0, 100)]] : [])));
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idempotencyKey: idempotencyKey.current,
          productId: product.id,
          variantId: variant.id,
          quantity,
          customerName,
          phone,
          wilayaCode: wilayaCode === "" ? 0 : wilayaCode,
          commune,
          address,
          deliveryType,
          website,
          startedAt: startedAt.current,
          ...(Object.keys(source).length ? { source } : {}),
        }),
      });
      const json = (await response.json().catch(() => ({}))) as { reference?: string; error?: string; field?: Field };
      if (response.ok && json.reference) {
        router.push(`/merci?ref=${encodeURIComponent(json.reference)}`);
        return;
      }
      const message = json.error ?? "La commande n'a pas pu être envoyée. Réessayez.";
      if (json.field) setErrors({ [json.field]: message });
      else setFormError(message);
    } catch {
      setFormError("Connexion impossible. Vérifiez votre réseau et réessayez : votre commande ne sera pas envoyée deux fois.");
    } finally {
      setSending(false);
    }
  }

  const describedBy = (field: Field) => (errors[field] ? `commande-${field}-error` : undefined);
  const fieldError = (field: Field) =>
    errors[field] ? (
      <p id={`commande-${field}-error`} role="alert" className={ERROR}>
        {errors[field]}
      </p>
    ) : null;

  if (soldOut) {
    return (
      <div className="rounded-card bg-white p-6 text-center">
        {title && <h2 className="mb-2 text-2xl font-bold text-ink">{title}</h2>}
        <p className="text-[15px] font-semibold text-red-800">Rupture de stock : ce produit n&apos;est plus disponible pour le moment.</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-5 rounded-card bg-white p-5 shadow-sm shadow-ink/5 sm:p-7">
      {title && <h2 className="text-2xl font-bold text-ink">{title}</h2>}

      {product.optionAxes.map((axis) => (
        <div key={axis.name}>
          <label htmlFor={`commande-option-${axis.name}`} className={LABEL}>
            {axis.name}
          </label>
          <select
            id={`commande-option-${axis.name}`}
            name={`option-${axis.name}`}
            value={selection[axis.name] ?? ""}
            disabled={sending}
            onChange={(e) => setSelection((s) => ({ ...s, [axis.name]: e.target.value }))}
            aria-describedby={describedBy("variantId")}
            className={INPUT}
          >
            {axis.values.map((value) => {
              const available = availableByAxis[axis.name]?.has(value);
              return (
                <option key={value} value={value} disabled={!available}>
                  {available ? value : `${value} (épuisé)`}
                </option>
              );
            })}
          </select>
        </div>
      ))}
      {fieldError("variantId")}

      <div>
        <label htmlFor="commande-quantity" className={LABEL}>
          Quantité
        </label>
        <select
          id="commande-quantity"
          name="quantity"
          value={quantity}
          disabled={sending}
          onChange={(e) => setQuantity(Number(e.target.value))}
          aria-describedby={describedBy("quantity")}
          className={INPUT}
        >
          {Array.from({ length: MAX_QUANTITY }, (_, i) => i + 1).map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
        {fieldError("quantity")}
      </div>

      <div>
        <label htmlFor="commande-name" className={LABEL}>
          Nom complet
        </label>
        <input
          id="commande-name"
          name="customerName"
          autoComplete="name"
          required
          maxLength={80}
          disabled={sending}
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          aria-invalid={errors.customerName ? true : undefined}
          aria-describedby={describedBy("customerName")}
          className={INPUT}
        />
        {fieldError("customerName")}
      </div>

      <div>
        <label htmlFor="commande-phone" className={LABEL}>
          Téléphone
        </label>
        <input
          id="commande-phone"
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="05 55 12 34 56"
          required
          maxLength={30}
          disabled={sending}
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          aria-invalid={errors.phone ? true : undefined}
          aria-describedby={describedBy("phone")}
          className={INPUT}
        />
        {fieldError("phone")}
      </div>

      <div>
        <label htmlFor="commande-wilaya" className={LABEL}>
          Wilaya
        </label>
        <select
          id="commande-wilaya"
          name="wilayaCode"
          required
          disabled={sending}
          value={wilayaCode}
          onChange={(e) => void chooseWilaya(e.target.value)}
          aria-invalid={errors.wilayaCode ? true : undefined}
          aria-describedby={describedBy("wilayaCode")}
          className={INPUT}
        >
          <option value="">Choisissez votre wilaya</option>
          {shipping.map((s) => (
            <option key={s.wilayaCode} value={s.wilayaCode}>
              {s.name}
            </option>
          ))}
        </select>
        {fieldError("wilayaCode")}
      </div>

      <div>
        <label htmlFor="commande-commune" className={LABEL}>
          Commune
        </label>
        <select
          id="commande-commune"
          name="commune"
          required
          disabled={sending || wilayaCode === "" || communesState === "loading"}
          value={commune}
          onChange={(e) => setCommune(e.target.value)}
          aria-invalid={errors.commune ? true : undefined}
          aria-describedby={describedBy("commune")}
          className={INPUT}
        >
          <option value="">
            {wilayaCode === "" ? "Choisissez d'abord la wilaya" : communesState === "loading" ? "Chargement…" : "Choisissez votre commune"}
          </option>
          {communes.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        {communesState === "error" && <p className={ERROR}>Impossible de charger les communes. Réessayez.</p>}
        {fieldError("commune")}
      </div>

      <div>
        <label htmlFor="commande-address" className={LABEL}>
          Adresse
        </label>
        <input
          id="commande-address"
          name="address"
          autoComplete="street-address"
          required
          maxLength={200}
          disabled={sending}
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          aria-invalid={errors.address ? true : undefined}
          aria-describedby={describedBy("address")}
          className={INPUT}
        />
        {fieldError("address")}
      </div>

      {rate && (
        <fieldset>
          <legend className={LABEL}>Livraison</legend>
          <div className="flex flex-col gap-2">
            {(["HOME", "OFFICE"] as const)
              .filter((type) => type === "HOME" || rate.office !== null)
              .map((type) => (
                <label key={type} className="flex cursor-pointer items-center gap-3 rounded-control border border-line px-3.5 py-3 text-base text-ink has-[:checked]:border-brand has-[:checked]:bg-brand-soft">
                  <input
                    type="radio"
                    name="deliveryType"
                    value={type}
                    checked={deliveryType === type}
                    disabled={sending}
                    onChange={() => setDeliveryType(type)}
                    className="size-4 accent-brand"
                  />
                  <span className="flex-1">{type === "HOME" ? "À domicile" : "Au bureau de livraison"}</span>
                  <span className="font-semibold">{formatDA(type === "HOME" ? rate.home : rate.office!)}</span>
                </label>
              ))}
          </div>
          {fieldError("deliveryType")}
        </fieldset>
      )}

      {/* Champ piège : invisible et inaccessible aux humains, rempli par les robots. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label>
          Site web
          <input name="website" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
        </label>
      </div>

      <dl className="flex flex-col gap-1.5 rounded-control bg-page p-4 text-[15px]">
        <div className="flex justify-between gap-4">
          <dt className="text-body">
            {product.name} × {quantity}
          </dt>
          <dd className="font-semibold text-ink">{formatDA(subtotal)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-body">Livraison</dt>
          <dd className="font-semibold text-ink">{rate ? formatDA(shippingFee) : "—"}</dd>
        </div>
        <div className="mt-1 flex justify-between gap-4 border-t border-line pt-2 text-lg">
          <dt className="font-bold text-ink">Total</dt>
          <dd className="font-extrabold text-ink">{formatDA(total)}</dd>
        </div>
        <p className="mt-1 text-[13px] text-body">Paiement à la livraison.</p>
      </dl>

      {formError && (
        <p role="alert" className="rounded-control bg-red-50 px-3.5 py-3 text-[14px] font-medium text-red-800">
          {formError}
        </p>
      )}

      <button
        type="submit"
        disabled={sending}
        className="inline-flex items-center justify-center rounded-control bg-brand px-6 py-4 text-lg font-bold text-on-brand transition-colors hover:bg-brand-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-60"
      >
        {sending ? "Envoi en cours…" : submitLabel}
      </button>
    </form>
  );
}
