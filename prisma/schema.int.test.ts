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

async function siteWithProduct() {
  const tenant = await createTenant();
  const site = await prisma.site.create({ data: siteData(tenant.id, "boutique") });
  const product = await prisma.product.create({
    data: { tenantId: tenant.id, name: "Chaussure", price: 2500, variants: { create: [{ options: {}, stock: 3 }] } },
    include: { variants: true },
  });
  return { tenant, site, product };
}

function orderData(tenantId: string, siteId: string, key: string, reference: string) {
  return {
    tenantId,
    siteId,
    idempotencyKey: key,
    reference,
    customerName: "Client",
    phone: "+213555123456",
    wilayaCode: 16,
    commune: "Alger Centre",
    address: "Rue des Martyrs",
    deliveryType: "HOME" as const,
    subtotal: 2500,
    shippingFee: 400,
    total: 2900,
  };
}

it("refuse deux commandes avec la même clé d'idempotence ou la même référence", async () => {
  const { tenant, site } = await siteWithProduct();
  await prisma.order.create({ data: orderData(tenant.id, site.id, "k1", "AAAA-AAAA") });
  await expect(prisma.order.create({ data: orderData(tenant.id, site.id, "k1", "BBBB-BBBB") })).rejects.toMatchObject({ code: "P2002" });
  await expect(prisma.order.create({ data: orderData(tenant.id, site.id, "k2", "AAAA-AAAA") })).rejects.toMatchObject({ code: "P2002" });
});

it("refuse deux tarifs de livraison pour la même wilaya d'un site", async () => {
  const { site } = await siteWithProduct();
  await prisma.shippingRate.create({ data: { siteId: site.id, wilayaCode: 16, home: 400 } });
  await expect(prisma.shippingRate.create({ data: { siteId: site.id, wilayaCode: 16, home: 500 } })).rejects.toMatchObject({ code: "P2002" });
});

it("supprime produits et variantes avec le tenant", async () => {
  const { tenant } = await siteWithProduct();
  await prisma.order.deleteMany();
  await prisma.tenant.delete({ where: { id: tenant.id } });
  expect(await prisma.product.count()).toBe(0);
  expect(await prisma.variant.count()).toBe(0);
});

it("garde la ligne de commande quand le produit est supprimé", async () => {
  const { tenant, site, product } = await siteWithProduct();
  const order = await prisma.order.create({
    data: {
      ...orderData(tenant.id, site.id, "k3", "CCCC-CCCC"),
      items: { create: [{ productId: product.id, variantId: product.variants[0].id, productName: "Chaussure", unitPrice: 2500, quantity: 1 }] },
    },
  });
  await prisma.product.delete({ where: { id: product.id } });
  const items = await prisma.orderItem.findMany({ where: { orderId: order.id } });
  expect(items).toHaveLength(1);
  expect(items[0]).toMatchObject({ productId: null, variantId: null, productName: "Chaussure" });
});
