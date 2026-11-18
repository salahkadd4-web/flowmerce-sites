"use server";

import { updateTag } from "next/cache";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { isDashboardHost } from "@/lib/dashboard-host";
import { env } from "@/lib/env";
import { publishPageForUser, saveDraftForUser } from "@/lib/pages";
import { siteHostTag, sitePagesTag, siteTag } from "@/lib/tenant";

export type EditorActionResult = { ok: true } | { ok: false; error: string };

/** Garde commune : hôte vendeur (seconde barrière derrière proxy.ts) puis session. */
async function currentUserId(): Promise<string | null> {
  if (!isDashboardHost((await headers()).get("host"), env.DASHBOARD_HOST)) {
    throw new Error("Action de l'éditeur appelée hors de l'hôte vendeur");
  }
  const session = await auth();
  return session?.user?.id ?? null;
}

// Les arguments d'une server action arrivent du navigateur : un objet à la place
// de l'identifiant deviendrait un filtre Prisma.
const NOT_FOUND: EditorActionResult = { ok: false, error: "Page introuvable" };

export async function saveDraft(pageId: unknown, data: unknown): Promise<EditorActionResult> {
  const userId = await currentUserId();
  if (!userId) return { ok: false, error: "Votre session a expiré. Reconnectez-vous." };
  if (typeof pageId !== "string") return NOT_FOUND;
  return saveDraftForUser(userId, pageId, data);
}

export async function publishPage(pageId: unknown, data: unknown): Promise<EditorActionResult> {
  const userId = await currentUserId();
  if (!userId) return { ok: false, error: "Votre session a expiré. Reconnectez-vous." };
  if (typeof pageId !== "string") return NOT_FOUND;

  const result = await publishPageForUser(userId, pageId, data);
  if (!result.ok) return result;

  // Lecture immédiate de la publication par le vendeur (doc Next 16 : updateTag).
  updateTag(sitePagesTag(result.siteId));
  updateTag(siteTag(result.siteId));
  updateTag(siteHostTag(`${result.subdomain}.${env.SITES_ROOT_DOMAIN}`));
  return { ok: true };
}
