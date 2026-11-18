"use server";

import { updateTag } from "next/cache";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { isDashboardHost } from "@/lib/dashboard-host";
import { env } from "@/lib/env";
import { saveShippingForUser, shippingTag } from "@/lib/shipping";

export type SaveShippingResult = { ok: true } | { ok: false; error: string };

export async function saveShipping(siteId: unknown, rates: unknown): Promise<SaveShippingResult> {
  // Seconde barrière derrière proxy.ts : jamais d'action vendeur depuis un site.
  if (!isDashboardHost((await headers()).get("host"), env.DASHBOARD_HOST)) {
    throw new Error("saveShipping appelée hors de l'hôte vendeur");
  }
  const session = await auth();
  if (!session?.user) return { ok: false, error: "Votre session a expiré. Reconnectez-vous." };
  if (typeof siteId !== "string") return { ok: false, error: "Site introuvable" };

  const result = await saveShippingForUser(session.user.id, siteId, rates);
  // Le formulaire de commande du site propose aussitôt les nouvelles wilayas et frais.
  if (result.ok) updateTag(shippingTag(siteId));
  return result;
}
