"use server";

import { updateTag } from "next/cache";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { assertDashboardHost } from "@/lib/dashboard-host";
import { env } from "@/lib/env";
import { publishPageForUser, saveDraftForUser } from "@/lib/pages";
import { siteHostTag, sitePagesTag, siteTag } from "@/lib/tenant";
import { aiTrainingConsentOf, setAiTrainingConsent } from "@/lib/ai-consent";
import { customTemplateForUser, deleteCustomTemplate, listCustomTemplates, saveCustomTemplate } from "@/lib/custom-templates";
import { templateById, TEMPLATES } from "@/templates";

export type EditorActionResult = { ok: true } | { ok: false; error: string };

/** Garde commune : hôte vendeur (seconde barrière derrière proxy.ts) puis session. */
async function currentUserId(): Promise<string | null> {
  assertDashboardHost((await headers()).get("host"), env.DASHBOARD_HOST);
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

// ───────── Modèles (fenêtre « Modèles » de l'éditeur) ─────────

export type TemplateCardData = {
  /** « landing-fr », « mode »… pour un modèle Flowmerce ; « perso:<id> » pour un modèle du vendeur. */
  ref: string;
  name: string;
  category: string;
  description: string;
  preview: string | null;
  cover?: { image: string | null; color: string | null; title: string };
};

export type TemplatesState = {
  flowmerce: TemplateCardData[];
  mine: TemplateCardData[];
  consent: { consent: boolean; at: string | null };
};

const SESSION_EXPIRED = "Votre session a expiré. Reconnectez-vous.";

export async function listTemplates(): Promise<{ ok: true; state: TemplatesState } | { ok: false; error: string }> {
  const userId = await currentUserId();
  if (!userId) return { ok: false, error: SESSION_EXPIRED };
  const [mine, consent] = await Promise.all([listCustomTemplates(userId), aiTrainingConsentOf(userId)]);
  return {
    ok: true,
    state: {
      flowmerce: TEMPLATES.map((t) => ({ ref: t.id, name: t.name, category: t.category, description: t.description, preview: t.preview })),
      mine: mine.map((t) => ({ ref: `perso:${t.id}`, name: t.name, category: t.category, description: "Votre modèle", preview: null, cover: t.cover })),
      consent: { consent: consent.consent, at: consent.at?.toISOString() ?? null },
    },
  };
}

/** Contenu d'un modèle (Flowmerce, ou du vendeur lui-même), à appliquer à la page. */
export async function loadTemplate(ref: unknown): Promise<{ ok: true; data: unknown } | { ok: false; error: string }> {
  const userId = await currentUserId();
  if (!userId) return { ok: false, error: SESSION_EXPIRED };
  if (typeof ref !== "string") return { ok: false, error: "Modèle introuvable" };
  const data = ref.startsWith("perso:") ? await customTemplateForUser(userId, ref.slice(6)) : (templateById(ref)?.data ?? null);
  return data ? { ok: true, data } : { ok: false, error: "Modèle introuvable" };
}

export async function saveAsTemplate(name: unknown, category: unknown, data: unknown): Promise<{ ok: true } | { ok: false; error: string }> {
  const userId = await currentUserId();
  if (!userId) return { ok: false, error: SESSION_EXPIRED };
  const result = await saveCustomTemplate(userId, name, category, data);
  return result.ok ? { ok: true } : result;
}

export async function deleteTemplate(ref: unknown): Promise<{ ok: boolean }> {
  const userId = await currentUserId();
  if (!userId || typeof ref !== "string" || !ref.startsWith("perso:")) return { ok: false };
  return { ok: await deleteCustomTemplate(userId, ref.slice(6)) };
}

export async function setTemplateConsent(consent: unknown): Promise<{ ok: boolean }> {
  const userId = await currentUserId();
  if (!userId || typeof consent !== "boolean") return { ok: false };
  await setAiTrainingConsent(userId, consent);
  return { ok: true };
}
