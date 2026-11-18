// Utilitaire de tests d'intégration : vide la base de test entre deux tests.
// Ordre enfant → parent pour respecter les clés étrangères.

import { prisma } from "@/lib/prisma";

export async function resetDb(): Promise<void> {
  if (!process.env.DATABASE_URL?.includes("_test")) {
    throw new Error("resetDb refuse de vider une base qui n'est pas une base de test");
  }
  await prisma.pageVersion.deleteMany();
  await prisma.page.deleteMany();
  await prisma.media.deleteMany();
  await prisma.site.deleteMany();
  await prisma.tenant.deleteMany();
  await prisma.user.deleteMany();
}
