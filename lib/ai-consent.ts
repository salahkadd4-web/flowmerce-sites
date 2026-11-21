// lib/ai-consent.ts — accord du vendeur pour que ses modèles de pages servent à
// entraîner le générateur de modèles (IA). Faux par défaut ; daté quand il est donné,
// effacé avec sa date quand il est retiré. Seul un choix explicite le change.

import { prisma } from "@/lib/prisma";

export async function aiTrainingConsentOf(userId: string): Promise<{ consent: boolean; at: Date | null }> {
  const tenant = await prisma.tenant.findUnique({
    where: { ownerUserId: userId },
    select: { aiTrainingConsent: true, aiTrainingConsentAt: true },
  });
  return { consent: tenant?.aiTrainingConsent ?? false, at: tenant?.aiTrainingConsentAt ?? null };
}

export async function setAiTrainingConsent(userId: string, consent: boolean): Promise<void> {
  await prisma.tenant.updateMany({
    where: { ownerUserId: userId },
    data: consent ? { aiTrainingConsent: true, aiTrainingConsentAt: new Date() } : { aiTrainingConsent: false, aiTrainingConsentAt: null },
  });
}
