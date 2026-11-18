// lib/orders/manage.ts — commandes dans l'espace vendeur : liste, détail,
// changement de statut avec stock et historique (§2.4).
//
// Stock : décrémenté à la confirmation (pas à la commande : les commandes
// fictives ne bloquent rien), rendu à l'annulation après confirmation et au retour.

import type { OrderStatus, Prisma } from "@prisma/client";
import { wilayaName } from "@/lib/algeria/wilayas";
import { canTransition, type OrderCsvRow } from "@/lib/orders/status";
import { prisma } from "@/lib/prisma";

export const ORDERS_PAGE_SIZE = 50;
const NOTE_MAX = 300;

export type OrderFilters = { status?: OrderStatus; siteId?: string; page?: number };

export type OrderRow = {
  id: string;
  reference: string;
  createdAt: Date;
  customerName: string;
  phone: string;
  wilaya: string;
  total: number;
  status: OrderStatus;
  siteName: string;
};

function where(userId: string, filters: OrderFilters): Prisma.OrderWhereInput {
  return {
    tenant: { ownerUserId: userId },
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.siteId ? { siteId: filters.siteId } : {}),
  };
}

export async function listOrdersForOwner(
  userId: string,
  filters: OrderFilters,
): Promise<{ orders: OrderRow[]; total: number; pageSize: number }> {
  const page = Math.max(1, Math.floor(filters.page ?? 1));
  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where: where(userId, filters),
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * ORDERS_PAGE_SIZE,
      take: ORDERS_PAGE_SIZE,
      include: { site: { select: { name: true } } },
    }),
    prisma.order.count({ where: where(userId, filters) }),
  ]);
  return {
    orders: orders.map((o) => ({
      id: o.id,
      reference: o.reference,
      createdAt: o.createdAt,
      customerName: o.customerName,
      phone: o.phone,
      wilaya: wilayaName(o.wilayaCode) ?? String(o.wilayaCode),
      total: o.total,
      status: o.status,
      siteName: o.site.name,
    })),
    total,
    pageSize: ORDERS_PAGE_SIZE,
  };
}

export function findOwnedOrder(userId: string, orderId: string) {
  return prisma.order.findFirst({
    where: { id: orderId, tenant: { ownerUserId: userId } },
    include: {
      site: { select: { id: true, name: true } },
      items: true,
      events: { orderBy: { createdAt: "asc" } },
    },
  });
}

/** Lignes de l'export CSV (mêmes filtres que la liste, 5 000 commandes au plus). */
export async function listOrdersForExport(userId: string, filters: OrderFilters): Promise<OrderCsvRow[]> {
  const orders = await prisma.order.findMany({
    where: where(userId, filters),
    orderBy: { createdAt: "desc" },
    take: 5000,
    include: { site: { select: { name: true } }, items: true },
  });
  return orders.map((o) => ({
    createdAt: o.createdAt,
    reference: o.reference,
    siteName: o.site.name,
    customerName: o.customerName,
    phone: o.phone,
    wilaya: wilayaName(o.wilayaCode) ?? String(o.wilayaCode),
    commune: o.commune,
    address: o.address,
    deliveryType: o.deliveryType,
    items: o.items.map(itemLabel).join(" ; "),
    subtotal: o.subtotal,
    shippingFee: o.shippingFee,
    total: o.total,
    status: o.status,
  }));
}

/** « Chaussure cuir (Taille 40) × 2 » */
export function itemLabel(item: { productName: string; options: Prisma.JsonValue; quantity: number }): string {
  const options = Object.entries((item.options as Record<string, string> | null) ?? {})
    .map(([name, value]) => `${name} ${value}`)
    .join(", ");
  return `${item.productName}${options ? ` (${options})` : ""} × ${item.quantity}`;
}

class StatusChangeError extends Error {}

export async function changeOrderStatus(
  user: { id: string; email: string },
  orderId: string,
  to: OrderStatus,
  note?: string,
): Promise<{ ok: true; tenantId: string; stockMoved: boolean } | { ok: false; error: string }> {
  if (note !== undefined && note.length > NOTE_MAX) return { ok: false, error: `Note de ${NOTE_MAX} caractères au plus` };

  const order = await prisma.order.findFirst({
    where: { id: orderId, tenant: { ownerUserId: user.id } },
    include: { items: { select: { variantId: true, quantity: true } } },
  });
  if (!order) return { ok: false, error: "Commande introuvable" };
  const from = order.status;
  if (!canTransition(from, to)) return { ok: false, error: "Changement de statut impossible" };

  const takeStock = to === "CONFIRMED";
  const giveBack = (to === "CANCELLED" && from === "CONFIRMED") || to === "RETURNED";

  try {
    await prisma.$transaction(async (tx) => {
      // Conditionné au statut lu : un second clic simultané ne passe pas.
      const moved = await tx.order.updateMany({ where: { id: order.id, status: from }, data: { status: to } });
      if (moved.count === 0) throw new StatusChangeError("La commande a changé entre-temps. Rechargez la page.");

      for (const item of order.items) {
        if (!item.variantId) continue;
        if (takeStock) {
          const taken = await tx.variant.updateMany({
            where: { id: item.variantId, stock: { gte: item.quantity } },
            data: { stock: { decrement: item.quantity } },
          });
          if (taken.count === 0) throw new StatusChangeError("Stock insuffisant pour confirmer");
        } else if (giveBack) {
          await tx.variant.updateMany({ where: { id: item.variantId }, data: { stock: { increment: item.quantity } } });
        }
      }

      await tx.orderStatusEvent.create({
        data: { orderId: order.id, from, to, actor: user.email, note: note?.trim() || null },
      });
    });
  } catch (error) {
    if (error instanceof StatusChangeError) return { ok: false, error: error.message };
    throw error;
  }
  // stockMoved : la landing doit être rafraîchie (stock affiché).
  return { ok: true, tenantId: order.tenantId, stockMoved: takeStock || giveBack };
}
