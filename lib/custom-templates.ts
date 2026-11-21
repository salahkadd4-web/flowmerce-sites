// lib/custom-templates.ts — modèles personnels d'un vendeur : une page qu'il a
// conçue, enregistrée sous un nom pour la réutiliser (dans l'éditeur ou à la
// création d'un site). Contenu validé par les schémas des blocs à l'enregistrement
// et de nouveau à l'usage. Chaque accès passe par le propriétaire (tenant.ownerUserId) :
// le modèle d'un autre vendeur répond comme un modèle absent.

import type { Prisma } from "@prisma/client";
import { validatePageContent } from "@/lib/page-content";
import { prisma } from "@/lib/prisma";

export const MAX_CUSTOM_TEMPLATES = 20;
const MAX_NAME = 60;
const MAX_CATEGORY = 40;

export type CustomTemplateCard = {
  id: string;
  name: string;
  category: string;
  createdAt: Date;
  /** Aperçu dessiné de la première section : photo ou couleur de fond, et titre. */
  cover: { image: string | null; color: string | null; title: string };
};

type SaveResult = { ok: true; id: string } | { ok: false; error: string };

/** Texte visible d'un titre (sans balises de mise en forme). */
function plainTitle(value: unknown): string {
  return typeof value === "string" ? value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 80) : "";
}

function coverOf(data: unknown): CustomTemplateCard["cover"] {
  const first = (data as { content?: { props?: Record<string, unknown> }[] } | null)?.content?.[0]?.props ?? {};
  const style = (first.style ?? {}) as { background?: string; backgroundColor?: string; backgroundImage?: { url?: string } | null };
  return {
    image: style.background === "image" && typeof style.backgroundImage?.url === "string" ? style.backgroundImage.url : null,
    color: style.background === "color" && typeof style.backgroundColor === "string" ? style.backgroundColor : null,
    title: plainTitle(first.title),
  };
}

export async function saveCustomTemplate(userId: string, name: unknown, category: unknown, data: unknown): Promise<SaveResult> {
  const cleanName = typeof name === "string" ? name.trim() : "";
  if (!cleanName) return { ok: false, error: "Donnez un nom au modèle" };
  if (cleanName.length > MAX_NAME) return { ok: false, error: `${MAX_NAME} caractères maximum` };
  const cleanCategory = typeof category === "string" && category.trim() !== "" && category.trim().length <= MAX_CATEGORY ? category.trim() : "Autre";

  const content = validatePageContent(data);
  if (!content.ok) return { ok: false, error: "Contenu de page invalide" };

  const tenant = await prisma.tenant.findUnique({ where: { ownerUserId: userId }, select: { id: true } });
  if (!tenant) return { ok: false, error: "Créez d'abord un site" };

  // Compte et création dans la même transaction : deux enregistrements simultanés
  // ne dépassent pas la limite.
  return prisma.$transaction(async (tx) => {
    const count = await tx.customTemplate.count({ where: { tenantId: tenant.id } });
    if (count >= MAX_CUSTOM_TEMPLATES) return { ok: false as const, error: `${MAX_CUSTOM_TEMPLATES} modèles au plus : supprimez-en un` };
    const created = await tx.customTemplate.create({
      data: { tenantId: tenant.id, name: cleanName, category: cleanCategory, data: content.content as unknown as Prisma.InputJsonValue },
      select: { id: true },
    });
    return { ok: true as const, id: created.id };
  });
}

export async function listCustomTemplates(userId: string): Promise<CustomTemplateCard[]> {
  const rows = await prisma.customTemplate.findMany({
    where: { tenant: { ownerUserId: userId } },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, category: true, createdAt: true, data: true },
  });
  return rows.map(({ data, ...row }) => ({ ...row, cover: coverOf(data) }));
}

/** Contenu d'un modèle du vendeur, revalidé ; null s'il n'existe pas ou n'est pas à lui. */
export async function customTemplateForUser(userId: string, id: unknown): Promise<unknown | null> {
  if (typeof id !== "string") return null;
  const row = await prisma.customTemplate.findFirst({ where: { id, tenant: { ownerUserId: userId } }, select: { data: true } });
  if (!row) return null;
  const content = validatePageContent(row.data);
  return content.ok ? content.content : null;
}

export async function deleteCustomTemplate(userId: string, id: unknown): Promise<boolean> {
  if (typeof id !== "string") return false;
  const result = await prisma.customTemplate.deleteMany({ where: { id, tenant: { ownerUserId: userId } } });
  return result.count === 1;
}
