// Fiche produit : photos, prix, économie, description, choix disponibles.
// Composant serveur, sans JavaScript : les photos défilent en CSS (scroll-snap) et
// une miniature mène à sa photo par une ancre.

import Image from "next/image";
import type { ReactNode } from "react";
import { BUYER_TEXT, fill, type PageLang } from "@/blocks/i18n";
import { renderImageBox as defaultImageBox, type RenderImageBox } from "@/blocks/image-box";
import { hasText } from "@/blocks/rich-text";
import { Section } from "@/blocks/Section";
import {
  buttonProps,
  buttonStyleSchema,
  colorProps,
  SECTION_TITLE_SIZES,
  sectionStyleSchema,
  sectionTone,
  TEXT_AUTO,
  TEXT_SIZES,
  typographySchema,
} from "@/blocks/style";
import { formatDA } from "@/lib/money";
import { MAX_PRODUCT_IMAGES, type PublicProduct } from "@/lib/product-input";
import type { ProductProps } from "./schema";

const THUMBS: Record<ProductProps["thumbSize"], string> = { s: "size-14", m: "size-20", l: "size-28" };

const DEFAULTS = { tone: "light" as const, className: "", padding: "py-10", width: "max-w-3xl" };

/** Ancre d'une photo : identifiant du bloc nettoyé, numéro à partir de 1. */
export function photoAnchor(blockId: string, index: number): string {
  return `photo-${blockId.replace(/[^A-Za-z0-9_-]/g, "")}-${index + 1}`;
}

/** Valeurs d'un axe disponibles dans au moins une variante en stock. */
function availableValues(product: PublicProduct, axis: string): Set<string> {
  return new Set(product.variants.filter((v) => v.inStock).map((v) => v.options[axis]).filter(Boolean));
}

type Props = Partial<Omit<ProductProps, "id" | "buttonLabel">> & {
  product: PublicProduct | null;
  buttonLabel: ReactNode;
  blockId?: string;
  lang?: PageLang;
  editing?: boolean;
  renderImageBox?: RenderImageBox;
};

export function ProductBlock({
  product,
  buttonLabel,
  blockId = "produit",
  lang = "fr",
  imageWidth = 100,
  thumbSize = "m",
  typography = typographySchema.parse(undefined),
  button = buttonStyleSchema.parse(undefined),
  style = sectionStyleSchema.parse(undefined),
  editing = false,
  renderImageBox = defaultImageBox,
}: Props) {
  if (!product) {
    if (!editing) return null;
    return (
      <section className="px-4 py-8">
        <div className="mx-auto max-w-3xl rounded-card border-2 border-dashed border-line bg-page p-8 text-center text-[14px] text-faint">
          Choisissez le produit de la page dans les réglages de la page (panneau de droite, onglet « Page »).
        </div>
      </section>
    );
  }

  const t = BUYER_TEXT[lang];
  const tone = sectionTone(style, DEFAULTS.tone);
  const titleColor = colorProps(typography.titleColor, TEXT_AUTO[tone].title);
  const textColor = colorProps(typography.textColor, TEXT_AUTO[tone].text);
  const action = buttonProps(button, tone);
  const images = product.images.slice(0, MAX_PRODUCT_IMAGES);
  const soldOut = product.variants.every((v) => !v.inStock);
  const saving = product.comparePrice ? product.comparePrice - product.price : 0;
  const paragraphs = product.description.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  const photoAlt = (i: number) => (i === 0 ? product.name : fill(t.photoAlt, { name: product.name, n: i + 1 }));

  return (
    <Section style={style} defaults={DEFAULTS} inner="flex flex-col gap-6">
      {images.length > 0 && (
        <div className="flex flex-col gap-3">
          {renderImageBox({
            width: imageWidth,
            children: (
              <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2" aria-label={t.photos}>
                {images.map((image, i) => (
                  <Image
                    key={image.url}
                    id={photoAnchor(blockId, i)}
                    src={image.url}
                    alt={photoAlt(i)}
                    width={image.width}
                    height={image.height}
                    sizes="(max-width: 768px) 100vw, 768px"
                    preload={i === 0}
                    className="h-auto w-full shrink-0 scroll-mt-4 snap-center rounded-card object-cover"
                  />
                ))}
              </div>
            ),
          })}
          {images.length > 1 && (
            <ul className="m-0 flex list-none flex-wrap justify-center gap-2 p-0">
              {images.map((image, i) => (
                <li key={image.url}>
                  <a
                    href={`#${photoAnchor(blockId, i)}`}
                    aria-label={photoAlt(i)}
                    className="block overflow-hidden rounded-control border border-line focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                  >
                    <Image src={image.url} alt="" width={image.width} height={image.height} sizes="112px" className={`${THUMBS[thumbSize]} object-cover`} />
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="flex flex-col gap-3">
        <h2 dir="auto" className={`font-bold leading-snug ${SECTION_TITLE_SIZES[typography.titleSize]} ${titleColor.className}`} style={titleColor.style}>
          {product.name}
        </h2>
        <p className="flex flex-wrap items-baseline gap-3">
          <span className={`text-3xl font-extrabold ${titleColor.className}`} style={titleColor.style}>
            {formatDA(product.price)}
          </span>
          {product.comparePrice && <s className={`text-lg ${TEXT_AUTO[tone].text}`}>{formatDA(product.comparePrice)}</s>}
          {saving > 0 && (
            <span className="rounded-full bg-green-50 px-3 py-1 text-[13px] font-semibold text-green-800">
              {fill(t.save, { amount: formatDA(saving) })}
            </span>
          )}
        </p>
        {soldOut && <p className="rounded-control bg-red-50 px-3 py-2 text-[14px] font-semibold text-red-800">{t.soldOut}</p>}
      </div>

      {paragraphs.map((paragraph, i) => (
        <p
          key={i}
          dir="auto"
          className={`whitespace-pre-line leading-relaxed ${TEXT_SIZES[typography.textSize]} ${textColor.className}`}
          style={textColor.style}
        >
          {paragraph}
        </p>
      ))}

      {product.optionAxes.map((axis) => {
        const available = availableValues(product, axis.name);
        return (
          <div key={axis.name}>
            <p className={`mb-2 text-[14px] font-semibold ${TEXT_AUTO[tone].title}`}>{axis.name}</p>
            <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
              {axis.values.map((value) => (
                <li
                  key={value}
                  className={`rounded-control border border-line bg-white px-3 py-1.5 text-[14px] ${
                    available.has(value) ? "text-ink" : "text-faint line-through"
                  }`}
                >
                  {value}
                  {!available.has(value) && <span className="sr-only"> ({t.unavailable})</span>}
                </li>
              ))}
            </ul>
          </div>
        );
      })}

      {!soldOut && hasText(buttonLabel) && (
        <a href="#commande" className={action.className} style={action.style}>
          {buttonLabel}
        </a>
      )}
    </Section>
  );
}
