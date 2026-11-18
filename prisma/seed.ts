// prisma/seed.ts — données de départ du développement local.
//
// Idempotent : relancer `npm run db:seed` met à jour les mêmes lignes au lieu
// d'en créer de nouvelles.
//
//   Espace vendeur  http://localhost:3100      vendeur@test.local / motdepasse-test
//   Site public     http://test.localhost:3100

import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";

const EMAIL = "vendeur@test.local";
const PASSWORD = "motdepasse-test";
const TENANT_ID = "seed-tenant-test";

const HOME_CONTENT = {
  root: { props: { title: "Accueil" } },
  content: [
    { type: "Heading", props: { id: "h1", text: "Bienvenue sur la boutique test" } },
    { type: "Text", props: { id: "t1", text: "Cette page est lue en base." } },
  ],
};

async function main() {
  const passwordHash = await bcrypt.hash(PASSWORD, 10);
  const user = await prisma.user.upsert({
    where: { email: EMAIL },
    update: { passwordHash, name: "Vendeur Test" },
    create: { email: EMAIL, passwordHash, name: "Vendeur Test" },
  });

  const tenant = await prisma.tenant.upsert({
    where: { id: TENANT_ID },
    update: { name: "Boutique Test", ownerUserId: user.id },
    create: { id: TENANT_ID, name: "Boutique Test", ownerUserId: user.id },
  });

  const siteData = {
    tenantId: tenant.id,
    type: "LANDING" as const,
    name: "Boutique Test",
    theme: {},
    locale: "fr",
    status: "PUBLISHED" as const,
  };
  const site = await prisma.site.upsert({
    where: { subdomain: "test" },
    update: siteData,
    create: { ...siteData, subdomain: "test" },
  });

  await prisma.page.upsert({
    where: { siteId_slug: { siteId: site.id, slug: "" } },
    update: { title: "Accueil", draft: HOME_CONTENT, published: HOME_CONTENT },
    create: { siteId: site.id, slug: "", title: "Accueil", draft: HOME_CONTENT, published: HOME_CONTENT },
  });

  console.log(`Seed OK — ${EMAIL} / ${PASSWORD} — site « test » publié`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
