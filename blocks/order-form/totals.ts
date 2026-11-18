// Calcul des montants d'une commande — partagé par le formulaire (affichage
// indicatif) et le serveur (qui fait foi). En dinars entiers.

export function computeTotals({
  unitPrice,
  quantity,
  shippingFee,
}: {
  unitPrice: number;
  quantity: number;
  shippingFee: number;
}): { subtotal: number; total: number } {
  const subtotal = unitPrice * quantity;
  return { subtotal, total: subtotal + shippingFee };
}

export const MAX_QUANTITY = 10;
