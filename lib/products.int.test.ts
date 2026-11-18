import { prisma } from "@/lib/prisma";
import { createProductForUser, findOwnedProduct, listProductsForOwner, updateProductForUser } from "@/lib/products";
import { resetDb } from "@/lib/test/db";

const A = "user-a";
const B = "user-b";

const INPUT = {
  name: "Chaussure cuir",
  description: "Faite main.",
  price: 2500,
  comparePrice: 3000,
  images: [],
  optionAxes: [{ name: "Taille", values: ["39", "40", "41"] }],
  stocks: { "Taille=39": 5, "Taille=40": 3, "Taille=41": 0 },
  active: true,
};

beforeEach(async () => {
  await resetDb();
  await prisma.tenant.create({ data: { name: "A", ownerUserId: A } });
  await prisma.tenant.create({ data: { name: "B", ownerUserId: B } });
});
afterAll(() => prisma.$disconnect());

async function stocksOf(productId: string) {
  const variants = await prisma.variant.findMany({ where: { productId } });
  return Object.fromEntries(variants.map((v) => [(v.options as Record<string, string>).Taille ?? "", v.stock]));
}

it("crée une variante par combinaison avec son stock", async () => {
  const result = await createProductForUser(A, INPUT);
  expect(result.ok).toBe(true);
  if (!result.ok) return;
  expect(await stocksOf(result.productId)).toEqual({ "39": 5, "40": 3, "41": 0 });
});

it("refuse la création sans tenant", async () => {
  expect(await createProductForUser("sans-site", INPUT)).toEqual({ ok: false, error: "Créez d'abord un site" });
});

it("synchronise les variantes à la mise à jour en gardant les stocks", async () => {
  const created = await createProductForUser(A, INPUT);
  if (!created.ok) throw new Error();
  const variantBefore = await prisma.variant.findFirstOrThrow({ where: { productId: created.productId, options: { equals: { Taille: "39" } } } });

  const result = await updateProductForUser(A, created.productId, {
    ...INPUT,
    optionAxes: [{ name: "Taille", values: ["39", "42"] }],
    stocks: { "Taille=39": 7, "Taille=42": 2 },
  });

  expect(result).toEqual({ ok: true, productId: created.productId });
  expect(await stocksOf(created.productId)).toEqual({ "39": 7, "42": 2 });
  const variantAfter = await prisma.variant.findFirstOrThrow({ where: { productId: created.productId, options: { equals: { Taille: "39" } } } });
  expect(variantAfter.id).toBe(variantBefore.id);
});

it("ne laisse pas un autre vendeur lire ni modifier le produit", async () => {
  const created = await createProductForUser(A, INPUT);
  if (!created.ok) throw new Error();
  expect(await findOwnedProduct(B, created.productId)).toBeNull();
  expect(await updateProductForUser(B, created.productId, { ...INPUT, price: 1 })).toEqual({ ok: false, error: "Produit introuvable" });
  expect((await prisma.product.findUniqueOrThrow({ where: { id: created.productId } })).price).toBe(2500);
  expect(await listProductsForOwner(B)).toEqual([]);
});

it("liste les produits avec leur stock total", async () => {
  await createProductForUser(A, INPUT);
  const list = await listProductsForOwner(A);
  expect(list).toEqual([expect.objectContaining({ name: "Chaussure cuir", price: 2500, totalStock: 8, active: true, image: null })]);
});

it("refuse un contenu invalide en nommant le champ", async () => {
  const result = await createProductForUser(A, { ...INPUT, price: 0 });
  expect(result).toMatchObject({ ok: false, field: "price" });
});
