import { randomUUID } from "node:crypto";
import { createOrder } from "@/lib/orders/intake";
import { prisma } from "@/lib/prisma";
import { createProductForUser } from "@/lib/products";
import { saveShippingForUser } from "@/lib/shipping";
import { createSiteForUser } from "@/lib/site-create";
import { resetDb } from "@/lib/test/db";

const A = { id: "user-a", name: "A", email: "a@test.local" };
const B = { id: "user-b", name: "B", email: "b@test.local" };
const HOST = "boutique.localhost:3100";


let productId: string;
let variant39: string;
let variant40: string;
let otherProductId: string;
let otherVariant: string;
let ipCounter = 0;

const ctx = (ip?: string) => ({ host: HOST, ip: ip ?? `10.0.0.${++ipCounter}`, userAgent: "test" });

function body(overrides: Record<string, unknown> = {}) {
  return {
    idempotencyKey: randomUUID(),
    productId,
    variantId: variant40,
    quantity: 2,
    customerName: "Amina Benali",
    // Un téléphone différent par commande : la limite par téléphone ne gêne pas les autres tests.
    phone: `0555${String(++ipCounter).padStart(6, "0")}`,
    wilayaCode: 16,
    commune: "Alger Centre",
    address: "12 rue Didouche Mourad",
    deliveryType: "HOME",
    website: "",
    elapsedMs: 60_000,
    ...overrides,
  };
}

beforeEach(async () => {
  await resetDb();
  const site = await createSiteForUser(A, { name: "Boutique", subdomain: "boutique" });
  const other = await createSiteForUser(B, { name: "Autre", subdomain: "autre" });
  if (!site.ok || !other.ok) throw new Error();
  await prisma.site.update({ where: { id: site.siteId }, data: { status: "PUBLISHED" } });
  await saveShippingForUser(A.id, site.siteId, [
    { wilayaCode: 16, home: 400, office: 250 },
    { wilayaCode: 31, home: 600, office: null },
  ]);
  const product = await createProductForUser(A.id, {
    name: "Chaussure cuir",
    description: "",
    price: 2500,
    comparePrice: null,
    images: [],
    optionAxes: [{ name: "Taille", values: ["39", "40"] }],
    stocks: { "Taille=39": 0, "Taille=40": 3 },
    active: true,
  });
  const foreign = await createProductForUser(B.id, {
    name: "Sac",
    description: "",
    price: 100,
    comparePrice: null,
    images: [],
    optionAxes: [],
    stocks: { "": 10 },
    active: true,
  });
  if (!product.ok || !foreign.ok) throw new Error();
  productId = product.productId;
  otherProductId = foreign.productId;
  const variants = await prisma.variant.findMany({ where: { productId } });
  variant39 = variants.find((v) => (v.options as Record<string, string>).Taille === "39")!.id;
  variant40 = variants.find((v) => (v.options as Record<string, string>).Taille === "40")!.id;
  otherVariant = (await prisma.variant.findFirstOrThrow({ where: { productId: otherProductId } })).id;
});
afterAll(() => prisma.$disconnect());

describe("commande valide", () => {
  it("enregistre la commande avec les montants du serveur", async () => {
    const result = await createOrder(ctx(), body({ phone: "0555 12 34 56" }));
    expect(result).toMatchObject({ ok: true, replayed: false });
    if (!result.ok) return;

    const order = await prisma.order.findUniqueOrThrow({
      where: { reference: result.reference },
      include: { items: true, events: true },
    });
    expect(order).toMatchObject({
      subtotal: 5000,
      shippingFee: 400,
      total: 5400,
      phone: "+213555123456",
      status: "NEW",
      wilayaCode: 16,
      deliveryType: "HOME",
    });
    expect(order.items).toEqual([
      expect.objectContaining({ productName: "Chaussure cuir", unitPrice: 2500, quantity: 2, options: { Taille: "40" } }),
    ]);
    expect(order.events).toEqual([expect.objectContaining({ from: null, to: "NEW", actor: "client" })]);
  });

  it("ignore les montants envoyés par le navigateur", async () => {
    const result = await createOrder(ctx(), body({ price: 1, total: 1, shippingFee: 0, subtotal: 1 }));
    if (!result.ok) throw new Error(result.error);
    expect(await prisma.order.findUniqueOrThrow({ where: { reference: result.reference } })).toMatchObject({ total: 5400 });
  });

  it("applique le prix bureau quand il est choisi", async () => {
    const result = await createOrder(ctx(), body({ deliveryType: "OFFICE", quantity: 1 }));
    if (!result.ok) throw new Error(result.error);
    expect(await prisma.order.findUniqueOrThrow({ where: { reference: result.reference } })).toMatchObject({ shippingFee: 250, total: 2750 });
  });

  it("garde la provenance UTM", async () => {
    const result = await createOrder(ctx(), body({ source: { utm_source: "facebook", utm_campaign: "noel" } }));
    if (!result.ok) throw new Error(result.error);
    expect((await prisma.order.findUniqueOrThrow({ where: { reference: result.reference } })).source).toEqual({
      utm_source: "facebook",
      utm_campaign: "noel",
    });
  });
});

describe("horloge du téléphone", () => {
  it("accepte la commande d'un téléphone dont l'horloge avance (le délai est mesuré par le formulaire)", async () => {
    // L'ancien protocole envoyait l'heure du téléphone : 2 minutes d'avance suffisaient à refuser.
    const result = await createOrder(ctx(), body({ elapsedMs: 8000, startedAt: Date.now() + 120_000 }));
    expect(result).toMatchObject({ ok: true });
  });

  it("refuse un délai négatif ou absent", async () => {
    expect(await createOrder(ctx(), body({ elapsedMs: -5 }))).toMatchObject({ ok: false, status: 400 });
    expect(await createOrder(ctx(), body({ elapsedMs: undefined }))).toMatchObject({ ok: false, status: 400 });
  });
});

describe("idempotence", () => {
  it("renvoie la même commande pour la même clé", async () => {
    const payload = body();
    const first = await createOrder(ctx(), payload);
    const second = await createOrder(ctx(), payload);
    expect(second).toEqual({ ...first, replayed: true });
    expect(await prisma.order.count()).toBe(1);
  });

  it("n'enregistre qu'une commande pour deux envois simultanés", async () => {
    const payload = body();
    const [a, b] = await Promise.all([createOrder(ctx(), payload), createOrder(ctx(), payload)]);
    expect(a.ok && b.ok).toBe(true);
    if (a.ok && b.ok) expect(a.reference).toBe(b.reference);
    expect(await prisma.order.count()).toBe(1);
  });
});

describe("refus", () => {
  it.each([0, 11, -1, 1.5, "2"])("refuse la quantité %j", async (quantity) => {
    expect(await createOrder(ctx(), body({ quantity }))).toMatchObject({ ok: false, status: 400, field: "quantity" });
  });

  it("refuse le produit d'un autre vendeur", async () => {
    expect(await createOrder(ctx(), body({ productId: otherProductId, variantId: otherVariant }))).toMatchObject({ ok: false, status: 404 });
  });

  it("refuse une variante d'un autre produit", async () => {
    expect(await createOrder(ctx(), body({ variantId: otherVariant }))).toMatchObject({ ok: false, status: 404 });
  });

  it("refuse un produit inactif", async () => {
    await prisma.product.update({ where: { id: productId }, data: { active: false } });
    expect(await createOrder(ctx(), body())).toMatchObject({ ok: false, status: 404 });
  });

  it("refuse un site en brouillon ou un hôte inconnu", async () => {
    await prisma.site.updateMany({ where: { subdomain: "boutique" }, data: { status: "DRAFT" } });
    expect(await createOrder(ctx(), body())).toMatchObject({ ok: false, status: 404 });
    expect(await createOrder({ ...ctx(), host: "inconnu.localhost:3100" }, body())).toMatchObject({ ok: false, status: 404 });
  });

  it("refuse une variante en rupture ou un stock insuffisant", async () => {
    expect(await createOrder(ctx(), body({ variantId: variant39, quantity: 1 }))).toMatchObject({ ok: false, status: 409, field: "variantId" });
    expect(await createOrder(ctx(), body({ quantity: 4 }))).toMatchObject({ ok: false, status: 409, field: "variantId" });
  });

  it("refuse une commune d'une autre wilaya", async () => {
    expect(await createOrder(ctx(), body({ commune: "Reggane" }))).toMatchObject({ ok: false, status: 400, field: "commune" });
  });

  it("refuse une wilaya inconnue ou non desservie", async () => {
    expect(await createOrder(ctx(), body({ wilayaCode: 70 }))).toMatchObject({ ok: false, status: 400, field: "wilayaCode" });
    expect(await createOrder(ctx(), body({ wilayaCode: 1, commune: "Adrar" }))).toMatchObject({ ok: false, status: 400, field: "wilayaCode" });
  });

  it("refuse le bureau quand il n'est pas proposé", async () => {
    expect(await createOrder(ctx(), body({ wilayaCode: 31, commune: "Oran", deliveryType: "OFFICE" }))).toMatchObject({
      ok: false,
      status: 400,
      field: "deliveryType",
    });
  });

  it("refuse un téléphone qui n'est pas algérien", async () => {
    expect(await createOrder(ctx(), body({ phone: "+33 6 12 34 56 78" }))).toMatchObject({ ok: false, status: 400, field: "phone" });
  });

  it("refuse silencieusement un robot (champ piège rempli ou envoi trop rapide)", async () => {
    expect(await createOrder(ctx(), body({ website: "http://spam" }))).toMatchObject({ ok: false, status: 400 });
    expect(await createOrder(ctx(), body({ elapsedMs: 1000 }))).toMatchObject({ ok: false, status: 400 });
    expect(await prisma.order.count()).toBe(0);
  });
});

describe("limitation de débit", () => {
  it("refuse la 6e commande d'une même IP en 10 minutes", async () => {
    await prisma.variant.update({ where: { id: variant40 }, data: { stock: 100 } });
    const results = [];
    for (let i = 0; i < 6; i++) results.push(await createOrder(ctx("1.1.1.1"), body({ quantity: 1 })));
    expect(results.slice(0, 5).every((r) => r.ok)).toBe(true);
    expect(results[5]).toMatchObject({ ok: false, status: 429 });
  });

  it("compte la limite par IP site par site (opérateurs mobiles : une IP pour beaucoup d'acheteurs)", async () => {
    await prisma.variant.update({ where: { id: variant40 }, data: { stock: 100 } });
    const other = await prisma.site.findFirstOrThrow({ where: { subdomain: "autre" } });
    await prisma.site.update({ where: { id: other.id }, data: { status: "PUBLISHED" } });
    await saveShippingForUser(B.id, other.id, [{ wilayaCode: 16, home: 300, office: null }]);
    for (let i = 0; i < 5; i++) expect((await createOrder(ctx("2.2.2.2"), body({ quantity: 1 }))).ok).toBe(true);

    const elsewhere = await createOrder(
      { host: "autre.localhost:3100", ip: "2.2.2.2", userAgent: null },
      body({ productId: otherProductId, variantId: otherVariant, quantity: 1 }),
    );
    expect(elsewhere).toMatchObject({ ok: true });
  });

  it("refuse la 4e commande d'un même téléphone en une heure", async () => {
    await prisma.variant.update({ where: { id: variant40 }, data: { stock: 100 } });
    const results = [];
    for (let i = 0; i < 4; i++) results.push(await createOrder(ctx(), body({ quantity: 1, phone: "0661 22 33 44" })));
    expect(results.slice(0, 3).every((r) => r.ok)).toBe(true);
    expect(results[3]).toMatchObject({ ok: false, status: 429 });
  });

  it("ne compte pas, pour un téléphone, les envois refusés (pas de blocage ciblé d'un acheteur)", async () => {
    await prisma.variant.update({ where: { id: variant40 }, data: { stock: 100 } });
    for (let i = 0; i < 5; i++) await createOrder(ctx(), body({ quantity: 1, phone: "0770 11 22 33", commune: "Reggane" }));
    expect(await createOrder(ctx(), body({ quantity: 1, phone: "0770 11 22 33" }))).toMatchObject({ ok: true });
  });

  it("limite aussi les requêtes sans adresse IP", async () => {
    await prisma.variant.update({ where: { id: variant40 }, data: { stock: 100 } });
    const results = [];
    for (let i = 0; i < 6; i++) results.push(await createOrder({ host: HOST, ip: null, userAgent: null }, body({ quantity: 1 })));
    expect(results[5]).toMatchObject({ ok: false, status: 429 });
  });
});
