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

it("refuse deux tenants pour le même utilisateur", async () => {
  await prisma.tenant.create({ data: { name: "A", ownerUserId: "same-user" } });
  await expect(prisma.tenant.create({ data: { name: "B", ownerUserId: "same-user" } })).rejects.toMatchObject({
    code: "P2002",
  });
});

it("supprime versions et médias avec le tenant", async () => {
  const tenant = await createTenant();
  const site = await prisma.site.create({ data: siteData(tenant.id, "versions") });
  const page = await prisma.page.create({ data: { siteId: site.id, slug: "", title: "Accueil", draft: {} } });
  await prisma.pageVersion.create({ data: { pageId: page.id, content: {} } });
  await prisma.media.create({
    data: {
      tenantId: tenant.id,
      key: "a".repeat(32) + ".png",
      url: "/media/" + "a".repeat(32) + ".png",
      mimeType: "image/png",
      width: 1,
      height: 1,
      sizeBytes: 68,
    },
  });

  await prisma.tenant.delete({ where: { id: tenant.id } });

  expect(await prisma.pageVersion.count()).toBe(0);
  expect(await prisma.media.count()).toBe(0);
});
