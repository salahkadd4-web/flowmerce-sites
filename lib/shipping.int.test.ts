import { prisma } from "@/lib/prisma";
import { findOwnedSite, getShippingTable, saveShippingForUser, shippingOptions } from "@/lib/shipping";
import { createSiteForUser } from "@/lib/site-create";
import { resetDb } from "@/lib/test/db";

const A = { id: "user-a", name: "A", email: "a@test.local" };
const B = { id: "user-b", name: "B", email: "b@test.local" };
let siteA: string;

beforeEach(async () => {
  await resetDb();
  const site = await createSiteForUser(A, { name: "A", subdomain: "site-a" });
  await createSiteForUser(B, { name: "B", subdomain: "site-b" });
  if (!site.ok) throw new Error();
  siteA = site.siteId;
});
afterAll(() => prisma.$disconnect());

const everywhere = (home: number, office: number | null) =>
  Array.from({ length: 69 }, (_, i) => ({ wilayaCode: i + 1, home, office }));

it("enregistre puis relit les frais des 69 wilayas", async () => {
  expect(await saveShippingForUser(A.id, siteA, everywhere(600, 400))).toEqual({ ok: true });
  const table = await getShippingTable(A.id, siteA);
  expect(table).toHaveLength(69);
  expect(table?.[15]).toEqual({ wilayaCode: 16, name: "Alger", home: 600, office: 400 });
});

it("une wilaya sans prix domicile n'est plus desservie", async () => {
  await saveShippingForUser(A.id, siteA, everywhere(600, 400));
  const rates = everywhere(600, null).map((r) => (r.wilayaCode === 11 ? { ...r, home: null } : r));
  await saveShippingForUser(A.id, siteA, rates);
  const options = await shippingOptions(siteA);
  expect(options).toHaveLength(68);
  expect(options.find((o) => o.wilayaCode === 11)).toBeUndefined();
  expect(options[0]).toEqual({ wilayaCode: 1, name: "Adrar", home: 600, office: null });
  expect((await getShippingTable(A.id, siteA))?.[10]).toEqual({ wilayaCode: 11, name: "Tamanrasset", home: null, office: null });
});

it("refuse un prix bureau sans prix domicile", async () => {
  const result = await saveShippingForUser(A.id, siteA, [{ wilayaCode: 16, home: null, office: 300 }]);
  expect(result.ok).toBe(false);
});

it("refuse une wilaya hors de 1 à 69", async () => {
  expect((await saveShippingForUser(A.id, siteA, [{ wilayaCode: 70, home: 500, office: null }])).ok).toBe(false);
});

it("ne laisse pas un autre vendeur lire ni modifier les frais", async () => {
  expect(await findOwnedSite(B.id, siteA)).toBeNull();
  expect(await getShippingTable(B.id, siteA)).toBeNull();
  expect(await saveShippingForUser(B.id, siteA, everywhere(1, 1))).toEqual({ ok: false, error: "Site introuvable" });
  expect(await shippingOptions(siteA)).toEqual([]);
});
