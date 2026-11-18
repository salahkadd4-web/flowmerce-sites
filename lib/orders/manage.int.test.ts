import { randomUUID } from "node:crypto";
import { createOrder } from "@/lib/orders/intake";
import { changeOrderStatus, findOwnedOrder, listOrdersForOwner } from "@/lib/orders/manage";
import { prisma } from "@/lib/prisma";
import { createProductForUser } from "@/lib/products";
import { saveShippingForUser } from "@/lib/shipping";
import { createSiteForUser } from "@/lib/site-create";
import { resetDb } from "@/lib/test/db";

const A = { id: "user-a", name: "A", email: "a@test.local" };
const B = { id: "user-b", name: "B", email: "b@test.local" };
let variantId: string;
let productId: string;
let n = 0;

async function order(quantity: number) {
  const result = await createOrder(
    { host: "boutique.localhost:3100", ip: `10.1.0.${++n}`, userAgent: null },
    {
      idempotencyKey: randomUUID(),
      productId,
      variantId,
      quantity,
      customerName: "Client Test",
      phone: `0661${String(++n).padStart(6, "0")}`,
      wilayaCode: 16,
      commune: "Alger Centre",
      address: "1 rue de test",
      deliveryType: "HOME",
      website: "",
      elapsedMs: 60_000,
    },
  );
  if (!result.ok) throw new Error(result.error);
  return prisma.order.findUniqueOrThrow({ where: { reference: result.reference } });
}

const stock = async () => (await prisma.variant.findUniqueOrThrow({ where: { id: variantId } })).stock;

beforeEach(async () => {
  await resetDb();
  const site = await createSiteForUser(A, { name: "Boutique", subdomain: "boutique" });
  await createSiteForUser(B, { name: "Autre", subdomain: "autre" });
  if (!site.ok) throw new Error();
  await prisma.site.update({ where: { id: site.siteId }, data: { status: "PUBLISHED" } });
  await saveShippingForUser(A.id, site.siteId, [{ wilayaCode: 16, home: 400, office: null }]);
  const product = await createProductForUser(A.id, {
    name: "Chaussure",
    description: "",
    price: 2500,
    comparePrice: null,
    images: [],
    optionAxes: [],
    stocks: { "": 2 },
    active: true,
  });
  if (!product.ok) throw new Error();
  productId = product.productId;
  variantId = (await prisma.variant.findFirstOrThrow({ where: { productId } })).id;
});
afterAll(() => prisma.$disconnect());

describe("stock", () => {
  it("décrémente à la confirmation, refuse quand il ne suffit plus", async () => {
    const first = await order(1);
    const second = await order(2);
    expect(await changeOrderStatus(A, first.id, "CONFIRMED")).toEqual({ ok: true });
    expect(await stock()).toBe(1);

    expect(await changeOrderStatus(A, second.id, "CONFIRMED")).toEqual({ ok: false, error: "Stock insuffisant pour confirmer" });
    expect((await prisma.order.findUniqueOrThrow({ where: { id: second.id } })).status).toBe("NEW");
    expect(await stock()).toBe(1);
  });

  it("ne confirme qu'une fois deux clics simultanés", async () => {
    const o = await order(1);
    const results = await Promise.all([changeOrderStatus(A, o.id, "CONFIRMED"), changeOrderStatus(A, o.id, "CONFIRMED")]);
    expect(results.filter((r) => r.ok)).toHaveLength(1);
    expect(await stock()).toBe(1);
    expect(await prisma.orderStatusEvent.count({ where: { orderId: o.id, to: "CONFIRMED" } })).toBe(1);
  });

  it("rend le stock à l'annulation après confirmation", async () => {
    const o = await order(2);
    await changeOrderStatus(A, o.id, "CONFIRMED");
    expect(await stock()).toBe(0);
    await changeOrderStatus(A, o.id, "CANCELLED");
    expect(await stock()).toBe(2);
  });

  it("ne touche pas le stock à l'annulation d'une nouvelle commande", async () => {
    const o = await order(1);
    await changeOrderStatus(A, o.id, "CANCELLED");
    expect(await stock()).toBe(2);
  });

  it("rend le stock au retour après livraison", async () => {
    const o = await order(1);
    for (const to of ["CONFIRMED", "SHIPPED", "DELIVERED"] as const) await changeOrderStatus(A, o.id, to);
    expect(await stock()).toBe(1);
    await changeOrderStatus(A, o.id, "RETURNED");
    expect(await stock()).toBe(2);
  });
});

describe("historique et transitions", () => {
  it("enregistre chaque changement avec l'acteur et la note", async () => {
    const o = await order(1);
    await changeOrderStatus(A, o.id, "CONFIRMED", "Confirmée par téléphone");
    await changeOrderStatus(A, o.id, "SHIPPED");
    const detail = await findOwnedOrder(A.id, o.id);
    expect(detail?.events.map((e) => [e.from, e.to, e.actor, e.note])).toEqual([
      [null, "NEW", "client", null],
      ["NEW", "CONFIRMED", "a@test.local", "Confirmée par téléphone"],
      ["CONFIRMED", "SHIPPED", "a@test.local", null],
    ]);
  });

  it("refuse une transition non permise", async () => {
    const o = await order(1);
    expect(await changeOrderStatus(A, o.id, "DELIVERED")).toEqual({ ok: false, error: "Changement de statut impossible" });
  });

  it("refuse une note trop longue", async () => {
    const o = await order(1);
    expect((await changeOrderStatus(A, o.id, "CONFIRMED", "x".repeat(301))).ok).toBe(false);
  });
});

describe("isolation", () => {
  it("un autre vendeur ne voit ni ne modifie la commande", async () => {
    const o = await order(1);
    expect((await listOrdersForOwner(B.id, {})).orders).toEqual([]);
    expect(await findOwnedOrder(B.id, o.id)).toBeNull();
    expect(await changeOrderStatus(B, o.id, "CONFIRMED")).toEqual({ ok: false, error: "Commande introuvable" });
    expect(await stock()).toBe(2);
  });
});

describe("liste", () => {
  it("liste la plus récente d'abord, filtre par statut", async () => {
    const first = await order(1);
    const second = await order(1);
    await changeOrderStatus(A, first.id, "CANCELLED");
    const all = await listOrdersForOwner(A.id, {});
    expect(all.orders.map((o) => o.id)).toEqual([second.id, first.id]);
    expect(all.total).toBe(2);
    expect(all.orders[0]).toMatchObject({ wilaya: "Alger", siteName: "Boutique", total: 2900, status: "NEW" });
    expect((await listOrdersForOwner(A.id, { status: "CANCELLED" })).orders.map((o) => o.id)).toEqual([first.id]);
  });
});
