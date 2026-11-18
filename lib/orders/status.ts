// lib/orders/status.ts — statuts d'une commande, transitions permises, export CSV.
// Fonctions pures (sans base) : utilisées par la gestion des commandes et l'interface.

import type { DeliveryType, OrderStatus } from "@prisma/client";
import { formatAlgerianPhone } from "@/lib/phone";

/** Table des transitions (conception 1B/1C). RETURNED et CANCELLED sont définitifs. */
export const ORDER_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  NEW: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED", "RETURNED"],
  DELIVERED: ["RETURNED"],
  RETURNED: [],
  CANCELLED: [],
};

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return ORDER_TRANSITIONS[from].includes(to);
}

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  NEW: "Nouvelle",
  CONFIRMED: "Confirmée",
  SHIPPED: "Expédiée",
  DELIVERED: "Livrée",
  RETURNED: "Retournée",
  CANCELLED: "Annulée",
};

/** Libellé du bouton qui mène à ce statut. */
export const ORDER_ACTION_LABELS: Record<OrderStatus, string> = {
  NEW: "Remettre en nouvelle",
  CONFIRMED: "Confirmer",
  SHIPPED: "Marquer expédiée",
  DELIVERED: "Marquer livrée",
  RETURNED: "Marquer retournée",
  CANCELLED: "Annuler",
};

export const DELIVERY_LABELS: Record<DeliveryType, string> = {
  HOME: "À domicile",
  OFFICE: "Au bureau",
};

export type OrderCsvRow = {
  createdAt: Date;
  reference: string;
  siteName: string;
  customerName: string;
  phone: string;
  wilaya: string;
  commune: string;
  address: string;
  deliveryType: DeliveryType;
  items: string;
  subtotal: number;
  shippingFee: number;
  total: number;
  status: OrderStatus;
};

const HEADER = [
  "Date",
  "Référence",
  "Site",
  "Client",
  "Téléphone",
  "Wilaya",
  "Commune",
  "Adresse",
  "Livraison",
  "Produits",
  "Sous-total (DA)",
  "Frais de livraison (DA)",
  "Total (DA)",
  "Statut",
];

/**
 * Cellule CSV sûre : une valeur qui commence par = + - @ serait exécutée comme
 * une formule par Excel ou LibreOffice — préfixée d'une apostrophe. Guillemets
 * si elle contient ; " ou un saut de ligne.
 */
function cell(value: string | number): string {
  let text = String(value);
  if (typeof value === "string" && /^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return /[;"\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/** Export pour Excel (BOM UTF-8, séparateur « ; », fins de ligne CRLF). */
export function ordersToCsv(rows: OrderCsvRow[]): string {
  const lines = rows.map((r) =>
    [
      r.createdAt.toISOString().slice(0, 16).replace("T", " "),
      r.reference,
      r.siteName,
      r.customerName,
      // Format courant « 0555 12 34 56 » : le « + » de +213… serait pris pour une formule.
      formatAlgerianPhone(r.phone),
      r.wilaya,
      r.commune,
      r.address,
      DELIVERY_LABELS[r.deliveryType],
      r.items,
      r.subtotal,
      r.shippingFee,
      r.total,
      ORDER_STATUS_LABELS[r.status],
    ]
      .map(cell)
      .join(";"),
  );
  return "﻿" + [HEADER.map(cell).join(";"), ...lines].join("\r\n");
}
