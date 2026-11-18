"use server";

import { OrderStatus } from "@prisma/client";
import { updateTag } from "next/cache";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { assertDashboardHost } from "@/lib/dashboard-host";
import { env } from "@/lib/env";
import { changeOrderStatus } from "@/lib/orders/manage";
import { productsTag } from "@/lib/product-input";

export type SetStatusResult = { ok: true } | { ok: false; error: string };

const STATUSES = new Set<string>(Object.values(OrderStatus));

export async function setOrderStatus(orderId: unknown, to: unknown, note: unknown): Promise<SetStatusResult> {
  // Seconde barrière derrière proxy.ts : jamais d'action vendeur depuis un site.
  assertDashboardHost((await headers()).get("host"), env.DASHBOARD_HOST);
  const session = await auth();
  if (!session?.user) return { ok: false, error: "Votre session a expiré. Reconnectez-vous." };
  if (typeof orderId !== "string" || typeof to !== "string" || !STATUSES.has(to)) {
    return { ok: false, error: "Commande introuvable" };
  }
  if (note !== undefined && typeof note !== "string") return { ok: false, error: "Note invalide" };

  const result = await changeOrderStatus(
    { id: session.user.id, email: session.user.email },
    orderId,
    to as OrderStatus,
    note === "" ? undefined : (note as string | undefined),
  );
  if (!result.ok) return result;

  // Confirmation, annulation après confirmation ou retour : le stock a bougé, la
  // landing affiche aussitôt la bonne disponibilité.
  if (result.stockMoved) updateTag(productsTag(result.tenantId));
  return { ok: true };
}
