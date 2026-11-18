import { prisma } from "@/lib/prisma";
import { listSitesForOwner } from "@/lib/sites";
import { resetDb } from "@/lib/test/db";

async function owner(email: string) {
  const user = await prisma.user.create({ data: { email, passwordHash: "x" } });
  const tenant = await prisma.tenant.create({ data: { name: email, ownerUserId: user.id } });
  return { user, tenant };
}

function site(tenantId: string, subdomain: string, createdAt: Date) {
  return prisma.site.create({
    data: { tenantId, subdomain, name: subdomain, type: "LANDING", theme: {}, createdAt },
  });
}

beforeEach(resetDb);
afterAll(() => prisma.$disconnect());

it("liste les sites du vendeur, du plus récent au plus ancien", async () => {
  const a = await owner("a@test.local");
  await site(a.tenant.id, "a1", new Date("2026-11-01"));
  await site(a.tenant.id, "a2", new Date("2026-11-02"));
  const sites = await listSitesForOwner(a.user.id);
  expect(sites.map((s) => s.subdomain)).toEqual(["a2", "a1"]);
});

it("ne montre jamais les sites d'un autre vendeur", async () => {
  const a = await owner("a@test.local");
  const b = await owner("b@test.local");
  await site(a.tenant.id, "a1", new Date("2026-11-01"));
  await site(b.tenant.id, "b1", new Date("2026-11-03"));
  expect((await listSitesForOwner(b.user.id)).map((s) => s.subdomain)).toEqual(["b1"]);
  expect((await listSitesForOwner(a.user.id)).map((s) => s.subdomain)).toEqual(["a1"]);
});

it("renvoie une liste vide pour un utilisateur sans site", async () => {
  expect(await listSitesForOwner("inconnu")).toEqual([]);
});
