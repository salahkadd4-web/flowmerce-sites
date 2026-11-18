import { prisma } from "@/lib/prisma";
import { resetDb } from "@/lib/test/db";

async function createTenant() {
  return prisma.tenant.create({ data: { name: "Boutique", ownerUserId: "user-1" } });
}

function siteData(tenantId: string, subdomain: string) {
  return { tenantId, subdomain, name: subdomain, type: "LANDING" as const, theme: {} };
}

beforeEach(resetDb);
afterAll(() => prisma.$disconnect());

it("refuse deux sites avec le même sous-domaine", async () => {
  const tenant = await createTenant();
  await prisma.site.create({ data: siteData(tenant.id, "dup") });
  await expect(prisma.site.create({ data: siteData(tenant.id, "dup") })).rejects.toMatchObject({
    code: "P2002",
  });
});

it("supprime les sites et pages avec le tenant", async () => {
  const tenant = await createTenant();
  const site = await prisma.site.create({ data: siteData(tenant.id, "cascade") });
  await prisma.page.create({ data: { siteId: site.id, slug: "", title: "Accueil", draft: {} } });

  await prisma.tenant.delete({ where: { id: tenant.id } });

  expect(await prisma.site.count()).toBe(0);
  expect(await prisma.page.count()).toBe(0);
});

it("refuse deux pages avec le même slug sur un site", async () => {
  const tenant = await createTenant();
  const site = await prisma.site.create({ data: siteData(tenant.id, "pages") });
  const page = { siteId: site.id, slug: "promo", title: "Promo", draft: {} };
  await prisma.page.create({ data: page });
  await expect(prisma.page.create({ data: page })).rejects.toMatchObject({ code: "P2002" });
});
