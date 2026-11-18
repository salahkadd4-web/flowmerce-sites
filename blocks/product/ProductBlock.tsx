// Fiche produit : photos, prix, économie, description, choix disponibles.
// Composant serveur, sans JavaScript : les photos défilent en CSS (scroll-snap).

import Image from "next/image";
import { formatDA } from "@/lib/money";
import type { PublicProduct } from "@/lib/product-input";

/** Valeurs d'un axe disponibles dans au moins une variante en stock. */
function availableValues(product: PublicProduct, axis: string): Set<string> {
  return new Set(product.variants.filter((v) => v.inStock).map((v) => v.options[axis]).filter(Boolean));
}

export function ProductBlock({
  product,
  buttonLabel,
  editing = false,
}: {
  product: PublicProduct | null;
  buttonLabel: string;
  editing?: boolean;
}) {
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

  const soldOut = product.variants.every((v) => !v.inStock);
  const saving = product.comparePrice ? product.comparePrice - product.price : 0;
  const paragraphs = product.description.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);

  return (
    <section className="px-4 py-10">
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        {product.images.length > 0 && (
          <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2" aria-label="Photos du produit">
            {product.images.map((image, i) => (
              <Image
                key={image.url}
                src={image.url}
                alt={i === 0 ? product.name : `${product.name} — photo ${i + 1}`}
                width={image.width}
                height={image.height}
                sizes="(max-width: 768px) 85vw, 640px"
                className="h-auto w-[85%] shrink-0 snap-center rounded-card object-cover sm:w-[640px]"
              />
            ))}
          </div>
        )}

        <div className="flex flex-col gap-3">
          <h2 className="text-2xl font-bold leading-snug text-ink">{product.name}</h2>
          <p className="flex flex-wrap items-baseline gap-3">
            <span className="text-3xl font-extrabold text-ink">{formatDA(product.price)}</span>
            {product.comparePrice && <s className="text-lg text-faint">{formatDA(product.comparePrice)}</s>}
            {saving > 0 && (
              <span className="rounded-full bg-green-50 px-3 py-1 text-[13px] font-semibold text-green-800">
                Économisez {formatDA(saving)}
              </span>
            )}
          </p>
          {soldOut && (
            <p className="rounded-control bg-red-50 px-3 py-2 text-[14px] font-semibold text-red-800">Rupture de stock</p>
          )}
        </div>

        {paragraphs.map((paragraph, i) => (
          <p key={i} className="whitespace-pre-line text-base leading-relaxed text-body">
            {paragraph}
          </p>
        ))}

        {product.optionAxes.map((axis) => {
          const available = availableValues(product, axis.name);
          return (
            <div key={axis.name}>
              <p className="mb-2 text-[14px] font-semibold text-ink">{axis.name}</p>
              <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
                {axis.values.map((value) => (
                  <li
                    key={value}
                    className={`rounded-control border px-3 py-1.5 text-[14px] ${
                      available.has(value) ? "border-line text-ink" : "border-line text-faint line-through"
                    }`}
                  >
                    {value}
                    {!available.has(value) && <span className="sr-only"> (épuisé)</span>}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}

        {!soldOut && buttonLabel.trim() !== "" && (
          <a
            href="#commande"
            className="inline-flex items-center justify-center rounded-control bg-brand px-6 py-3.5 text-base font-semibold text-on-brand transition-colors hover:bg-brand-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            {buttonLabel}
          </a>
        )}
      </div>
    </section>
  );
}
