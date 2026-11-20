import { prisma } from "@/lib/prisma";
import { createProductForUser } from "@/lib/products";
import { saveShippingForUser } from "@/lib/shipping";
import { createSiteForUser } from "@/lib/site-create";
import { loadStorefront } from "@/lib/storefront";
import { resetDb } from "@/lib/test/db";

const A = { id: "user-a", name: "A", email: "a@test.local" };
const B = { id: "user-b", name: "B", email: "b@test.local" };
const product = (name: string, active = true) => ({
  name,
  description: "",
  price: 1000,
  comparePrice: null,
  images: [],
  optionAxes: [],
  stocks: { "": 2 },
  active,
});

let site: { id: string; tenantId: string };
let mine: string;
let inactive: string;
let foreign: string;

beforeEach(async () => {
  await resetDb();
  const a = await createSiteForUser(A, { name: "A", subdomain: "site-a" });
  await createSiteForUser(B, { name: "B", subdomain: "site-b" });
  if (!a.ok) throw new Error();
  site = await prisma.site.findUniqueOrThrow({ where: { id: a.siteId }, select: { id: true, tenantId: true } });
  await saveShippingForUser(A.id, site.id, [{ wilayaCode: 16, home: 400, office: null }]);
  const results = await Promise.all([
    createProductForUser(A.id, product("Mien")),
    createProductForUser(A.id, product("Inactif", false)),
    createProductForUser(B.id, product("Étranger")),
  ]);
  [mine, inactive, foreign] = results.map((r) => (r.ok ? r.productId : ""));
});
afterAll(() => prisma.$disconnect());

it("donne le produit de la page et les frais du site", async () => {
  const data = await loadStorefront(site, mine);
  expect(Object.keys(data.products)).toEqual([mine]);
  expect(data.products[mine]).toMatchObject({ name: "Mien", price: 1000 });
  expect(data.products[mine].variants[0]).toEqual(expect.objectContaining({ inStock: true }));
  expect(data.shipping).toEqual([{ wilayaCode: 16, name: "Alger", nameAr: "الجزائر", home: 400, office: null }]);
});

it("n'expose ni un produit inactif ni celui d'un autre vendeur", async () => {
  expect((await loadStorefront(site, inactive)).products).toEqual({});
  expect((await loadStorefront(site, foreign)).products).toEqual({});
});

it("sans produit de la page, seulement les frais", async () => {
  const data = await loadStorefront(site, undefined);
  expect(data.products).toEqual({});
  expect(data.shipping).toHaveLength(1);
});
