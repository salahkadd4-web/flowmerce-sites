// Enveloppe serveur du formulaire de commande : porte l'ancre #commande visée par
// les boutons « Commander » et le fond de la section ; le formulaire lui-même est
// le seul composant client des pages publiques (OrderForm).

import type { ReactNode } from "react";
import type { RenderButton } from "@/blocks/button-box";
import type { PageLang } from "@/blocks/i18n";
import { Section } from "@/blocks/Section";
import {
  buttonProps,
  buttonStyleSchema,
  colorProps,
  SECTION_TITLE_SIZES,
  sectionStyleSchema,
  typographySchema,
  type ButtonStyle,
  type SectionStyle,
  type Typography,
} from "@/blocks/style";
import type { PublicProduct } from "@/lib/product-input";
import type { ShippingOption } from "@/lib/shipping";
import { OrderForm } from "./OrderForm";

const DEFAULTS = { tone: "light" as const, className: "bg-page", padding: "py-10", width: "max-w-xl" };

export function OrderFormBlock({
  product,
  shipping,
  title,
  submitLabel,
  lang = "fr",
  typography = typographySchema.parse(undefined),
  button = buttonStyleSchema.parse({ size: "l" }),
  style = sectionStyleSchema.parse(undefined),
  editing = false,
  renderButton,
}: {
  product: PublicProduct | null;
  shipping: ShippingOption[];
  title: ReactNode;
  submitLabel: ReactNode;
  lang?: PageLang;
  typography?: Typography;
  button?: ButtonStyle;
  style?: SectionStyle;
  editing?: boolean;
  renderButton?: RenderButton;
}) {
  const missing = !product
    ? "Choisissez le produit de la page dans les réglages de la page pour afficher le formulaire de commande."
    : shipping.length === 0
      ? "Indiquez vos frais de livraison (Mes sites → Livraison) pour que les acheteurs puissent commander."
      : null;

  if (missing) {
    if (!editing) return null;
    return (
      <section id="commande" className="px-4 py-8">
        <div className="mx-auto max-w-xl rounded-card border-2 border-dashed border-line bg-page p-8 text-center text-[14px] text-faint">
          {missing}
        </div>
      </section>
    );
  }

  // Titre et bouton sont sur la carte blanche du formulaire : leurs couleurs
  // automatiques ne dépendent pas du fond de la section.
  const titleColor = colorProps(typography.titleColor, "text-ink");
  const titleClass = {
    className: `${SECTION_TITLE_SIZES[typography.titleSize]} ${titleColor.className}`.trim(),
    ...(titleColor.style ? { style: titleColor.style } : {}),
  };
  const action = buttonProps(button, "light");

  return (
    <Section id="commande" style={style} defaults={DEFAULTS}>
      <OrderForm
        product={product!}
        shipping={shipping}
        title={title}
        submitLabel={submitLabel}
        lang={lang}
        titleClass={titleClass}
        buttonClass={action}
        renderButton={renderButton}
      />
    </Section>
  );
}
