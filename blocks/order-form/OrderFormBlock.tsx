// Enveloppe serveur du formulaire de commande : porte l'ancre #commande visée par
// les boutons « Commander » ; le formulaire lui-même est le seul composant client
// des pages publiques (OrderForm).

import type { PublicProduct } from "@/lib/product-input";
import type { ShippingOption } from "@/lib/shipping";
import { OrderForm } from "./OrderForm";

export function OrderFormBlock({
  product,
  shipping,
  title,
  submitLabel,
  editing = false,
}: {
  product: PublicProduct | null;
  shipping: ShippingOption[];
  title: string;
  submitLabel: string;
  editing?: boolean;
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

  return (
    <section id="commande" className="scroll-mt-4 bg-page px-4 py-10">
      <div className="mx-auto max-w-xl">
        <OrderForm product={product!} shipping={shipping} title={title} submitLabel={submitLabel} />
      </div>
    </section>
  );
}
