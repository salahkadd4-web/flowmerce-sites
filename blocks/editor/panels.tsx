"use client";

// Contenu des fenêtres des barres d'outils : fond, espacement, texte, bouton,
// contacts, réseaux, produit. Chaque réglage s'écrit dans la page par une action
// Puck (annulable par Ctrl+Z) ; un groupe absent part de ses valeurs par défaut.

import { createUsePuck } from "@puckeditor/core";
import { useState } from "react";
import { z } from "zod";
import { ImageUploader } from "@/components/media/ImageUploader";
import type { MediaValue } from "@/blocks/shared";
import { phoneSchema } from "@/blocks/shared";
import {
  DEFAULT_BUTTON,
  DEFAULT_SECTION_STYLE,
  DEFAULT_TYPOGRAPHY,
  type ButtonStyle,
  type SectionStyle,
  type Typography,
} from "@/blocks/style";
import { readGroup } from "./block-patch";
import { ColorSwatches } from "./ColorSwatches";
import { productAnchor } from "@/blocks/product/ProductBlock";
import { linkError, linkTargetOf, normalizeLink, ORDER_ANCHOR } from "./links";
import { RangeInput } from "./RangeInput";
import { SegmentedChoice } from "./SegmentedChoice";
import { TextInput } from "./TextInput";
import { usePageRoot, type BlockProps } from "./use-block";

const usePuck = createUsePuck();

type Setter = (path: string, value: unknown) => void;
type PanelProps = { props: BlockProps; set: Setter };

export const SIZE_CHOICES = [
  { value: "s", label: "Petite" },
  { value: "m", label: "Moyenne" },
  { value: "l", label: "Grande" },
  { value: "xl", label: "Très grande" },
] as const;

export function FondPanel({ props, set }: PanelProps) {
  const style = readGroup<SectionStyle>(props, "style", DEFAULT_SECTION_STYLE);
  return (
    <>
      <SegmentedChoice
        label="Fond"
        value={style.background}
        onChange={(value) => set("style.background", value)}
        options={[
          { value: "default", label: "Par défaut" },
          { value: "color", label: "Couleur" },
          { value: "image", label: "Image" },
        ]}
      />
      {style.background === "color" && (
        <ColorSwatches label="Couleur du fond" value={style.backgroundColor} onChange={(value) => set("style.backgroundColor", value)} />
      )}
      {style.background === "image" && (
        <>
          <ImageUploader
            id={`fond-${props.id}`}
            value={style.backgroundImage ? [style.backgroundImage as MediaValue] : []}
            onChange={(images) => set("style.backgroundImage", images[0] ?? null)}
            max={1}
          />
          <RangeInput
            label="Assombrissement de l'image"
            value={style.overlay}
            min={0}
            max={80}
            step={10}
            unit="%"
            onCommit={(value) => set("style.overlay", value)}
          />
        </>
      )}
    </>
  );
}

export function EspacementPanel({ props, set }: PanelProps) {
  const style = readGroup<SectionStyle>(props, "style", DEFAULT_SECTION_STYLE);
  return (
    <>
      <SegmentedChoice
        label="Hauteur de la section"
        value={style.spacing}
        onChange={(value) => set("style.spacing", value)}
        options={[
          { value: "compact", label: "Compacte" },
          { value: "normal", label: "Normale" },
          { value: "airy", label: "Aérée" },
        ]}
      />
      <SegmentedChoice
        label="Largeur du contenu"
        value={style.width}
        onChange={(value) => set("style.width", value)}
        options={[
          { value: "narrow", label: "Étroite" },
          { value: "normal", label: "Normale" },
          { value: "wide", label: "Large" },
        ]}
      />
    </>
  );
}

/** Taille et couleur d'un texte (titre ou paragraphes) d'une section. */
export function TextStylePanel({ props, set, title = true, text = true }: PanelProps & { title?: boolean; text?: boolean }) {
  const typography = readGroup<Typography>(props, "typography", DEFAULT_TYPOGRAPHY);
  return (
    <>
      {title && (
        <>
          <SegmentedChoice label="Taille du titre" value={typography.titleSize} onChange={(v) => set("typography.titleSize", v)} options={SIZE_CHOICES} />
          <ColorSwatches label="Couleur du titre" value={typography.titleColor} onChange={(v) => set("typography.titleColor", v)} allowAuto />
        </>
      )}
      {text && (
        <>
          <SegmentedChoice label="Taille du texte" value={typography.textSize} onChange={(v) => set("typography.textSize", v)} options={SIZE_CHOICES} />
          <ColorSwatches label="Couleur du texte" value={typography.textColor} onChange={(v) => set("typography.textColor", v)} allowAuto />
        </>
      )}
    </>
  );
}

export function ButtonColorPanel({ props, set }: PanelProps) {
  const button = readGroup<ButtonStyle>(props, "button", DEFAULT_BUTTON);
  return <ColorSwatches label="Couleur du bouton" value={button.color} onChange={(v) => set("button.color", v)} allowAuto />;
}

export function ButtonTextPanel({ props, set }: PanelProps) {
  const button = readGroup<ButtonStyle>(props, "button", DEFAULT_BUTTON);
  return <ColorSwatches label="Couleur du texte du bouton" value={button.textColor} onChange={(v) => set("button.textColor", v)} allowAuto />;
}

export function ButtonSizePanel({ props, set }: PanelProps) {
  const button = readGroup<ButtonStyle>(props, "button", DEFAULT_BUTTON);
  return (
    <SegmentedChoice
      label="Taille du bouton"
      value={button.size}
      onChange={(v) => set("button.size", v)}
      options={[
        { value: "s", label: "Petit" },
        { value: "m", label: "Moyen" },
        { value: "l", label: "Grand" },
      ]}
    />
  );
}

/** Image d'une section (bannière) et sa description pour les lecteurs d'écran. */
export function ImagePanel({ props, set, imageKey = "image", altKey = "imageAlt" }: PanelProps & { imageKey?: string; altKey?: string }) {
  const image = props[imageKey] as MediaValue | null | undefined;
  return (
    <>
      <ImageUploader id={`image-${props.id}`} value={image ? [image] : []} onChange={(images) => set(imageKey, images[0] ?? null)} max={1} />
      <TextInput
        label="Description de l'image"
        hint="Ce que montre l'image, pour les lecteurs d'écran."
        value={String(props[altKey] ?? "")}
        onCommit={(value) => set(altKey, value)}
      />
    </>
  );
}

const PHONE_ERROR = "Numéro non valable (chiffres, +, espaces)";
const emailSchema = z.union([z.literal(""), z.string().email().max(120)]);

export function ContactsPanel({ props, set }: PanelProps) {
  return (
    <>
      <TextInput
        label="Téléphone"
        type="tel"
        placeholder="0555 12 34 56"
        value={String(props.phone ?? "")}
        validate={(value) => (phoneSchema.safeParse(value).success ? null : PHONE_ERROR)}
        onCommit={(value) => set("phone", value)}
      />
      <TextInput
        label="Email"
        type="email"
        placeholder="contact@maboutique.dz"
        value={String(props.email ?? "")}
        validate={(value) => (emailSchema.safeParse(value).success ? null : "Adresse email non valable")}
        onCommit={(value) => set("email", value)}
      />
    </>
  );
}

const NETWORKS = [
  { key: "facebook", label: "Facebook", placeholder: "facebook.com/maboutique" },
  { key: "instagram", label: "Instagram", placeholder: "instagram.com/maboutique" },
  { key: "tiktok", label: "TikTok", placeholder: "tiktok.com/@maboutique" },
] as const;

export function ReseauxPanel({ props, set }: PanelProps) {
  return (
    <>
      {NETWORKS.map((network) => (
        <TextInput
          key={network.key}
          label={network.label}
          type="url"
          placeholder={network.placeholder}
          value={String(props[network.key] ?? "")}
          validate={linkError}
          onCommit={(value) => set(network.key, normalizeLink(value))}
        />
      ))}
    </>
  );
}

/** Produit de la page (réglage de la page) : la fiche et le formulaire le montrent. */
export function ProductChoicePanel() {
  const { rootProps, setRoot } = usePageRoot();
  const field = usePuck((s) => s.config.root?.fields?.productId) as { options?: { label: string; value: string }[] } | undefined;
  const options = field?.options ?? [];
  const current = typeof rootProps.productId === "string" ? rootProps.productId : "";
  const real = options.filter((o) => o.value !== "");
  if (real.length === 0) {
    return (
      <p className="text-[13px] text-body">
        Vous n&apos;avez pas encore de produit actif.{" "}
        <a href="/produits/new" target="_blank" rel="noopener" className="font-semibold text-brand-ink underline">
          Créer un produit
        </a>
      </p>
    );
  }
  return (
    <div role="radiogroup" aria-label="Produit de la page" className="flex max-h-64 flex-col gap-1 overflow-y-auto">
      {real.map((option) => {
        const checked = option.value === current;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={checked}
            onClick={() => setRoot("productId", option.value)}
            className={`rounded-md border px-3 py-2 text-start text-[13px] font-semibold focus-visible:outline-2 focus-visible:outline-brand ${
              checked ? "border-brand bg-brand-soft text-brand-ink" : "border-line text-ink hover:border-brand/50"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export function PhotosPanel({ props, set }: PanelProps) {
  return (
    <SegmentedChoice
      label="Taille des miniatures"
      value={(props.thumbSize as "s" | "m" | "l" | undefined) ?? "m"}
      onChange={(v) => set("thumbSize", v)}
      options={[
        { value: "s", label: "Petites" },
        { value: "m", label: "Moyennes" },
        { value: "l", label: "Grandes" },
      ]}
    />
  );
}

/** « Mène vers » du bouton de la bannière : le formulaire, la fiche produit, ou un autre lien. */
export function LinkPanel({ props, set }: PanelProps) {
  const content = usePuck((s) => s.appState.data.content);
  const product = content.find((item) => item.type === "Product");
  const productHref = product ? `#${productAnchor(String(product.props.id))}` : null;
  const href = String(props.buttonHref ?? "");
  // « Autre lien » choisi : le champ s'affiche, le lien actuel reste tant qu'aucune
  // adresse n'est saisie (un lien vide masquerait le bouton et fermerait la fenêtre).
  const [otherChosen, setOtherChosen] = useState(false);
  const target = otherChosen ? "other" : linkTargetOf(href, productHref);
  const options = [
    { value: "order", label: "Commande" },
    ...(productHref ? [{ value: "product", label: "Produit" }] : []),
    { value: "other", label: "Autre lien" },
  ] as const;
  return (
    <>
      <SegmentedChoice
        label="Le bouton mène vers"
        value={target}
        options={options as readonly { value: "order" | "product" | "other"; label: string }[]}
        onChange={(value) => {
          setOtherChosen(value === "other");
          if (value === "order") set("buttonHref", ORDER_ANCHOR);
          else if (value === "product" && productHref) set("buttonHref", productHref);
        }}
      />
      {target === "order" && <p className="text-[12px] text-body">Le formulaire de commande de la page.</p>}
      {target === "product" && <p className="text-[12px] text-body">La fiche du produit, plus bas dans la page.</p>}
      {target === "other" && (
        <TextInput
          label="Adresse du lien"
          type="url"
          placeholder="wa.me/213555123456"
          hint="Une page web, WhatsApp… Sans adresse, le bouton n'apparaît pas sur le site."
          value={linkTargetOf(href, productHref) === "other" ? href : ""}
          validate={linkError}
          onCommit={(value) => set("buttonHref", normalizeLink(value))}
        />
      )}
    </>
  );
}
