import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { resetDb } from "@/lib/test/db";
import { findPublishedPage, findPublishedSiteByHost } from "@/lib/tenant-queries";

const ROOT = "localhost";
const CONTENT = {
  root: { props: { title: "Accueil" } },
  content: [
    {
      type: "Hero",
      props: {
        id: "h1",
        title: "Bonjour",
        subtitle: "",
        image: null,
        buttonLabel: "",
        buttonHref: "",
        align: "center",
        background: "light",
      },
    },
    { type: "Text", props: { id: "t1", title: "", body: "Texte", align: "left" } },
  ],
};

async function createSite(subdomain: string, status: "DRAFT" | "PUBLISHED" | "SUSPENDED" = "PUBLISHED") {
  const tenant = await prisma.tenant.create({ data: { name: subdomain, ownerUserId: "u-" + subdomain } });
  return prisma.site.create({
    data: { tenantId: tenant.id, subdomain, name: "Site " + subdomain, type: "LANDING", theme: {}, status },
  });
}

beforeEach(resetDb);
afterAll(() => prisma.$disconnect());

describe("findPublishedSiteByHost", () => {
  it("trouve un site publié par son sous-domaine", async () => {
    await createSite("test");
    const site = await findPublishedSiteByHost("test.localhost:3000", ROOT);
    expect(site?.subdomain).toBe("test");
  });

  it("trouve le site malgré la casse et le point final", async () => {
    await createSite("test");
    expect((await findPublishedSiteByHost("TEST.localhost.", ROOT))?.subdomain).toBe("test");
  });

  it("ignore les sites en brouillon ou suspendus", async () => {
    await createSite("brouillon", "DRAFT");
    await createSite("suspendu", "SUSPENDED");
    expect(await findPublishedSiteByHost("brouillon.localhost", ROOT)).toBeNull();
    expect(await findPublishedSiteByHost("suspendu.localhost", ROOT)).toBeNull();
  });

  it("ignore un sous-domaine réservé même présent en base", async () => {
    await createSite("app");
    expect(await findPublishedSiteByHost("app.localhost", ROOT)).toBeNull();
  });

  it("renvoie null pour un hôte inconnu, la racine ou un sous-domaine imbriqué", async () => {
    await createSite("test");
    expect(await findPublishedSiteByHost("inconnu.localhost", ROOT)).toBeNull();
    expect(await findPublishedSiteByHost("localhost", ROOT)).toBeNull();
    expect(await findPublishedSiteByHost("a.test.localhost", ROOT)).toBeNull();
  });
});

describe("findPublishedPage", () => {
  it("renvoie la page publiée et son contenu", async () => {
    const site = await createSite("test");
    await prisma.page.create({ data: { siteId: site.id, slug: "", title: "Accueil", draft: CONTENT, published: CONTENT } });
    const page = await findPublishedPage(site.id, "");
    expect(page?.title).toBe("Accueil");
    expect(page?.content.content).toHaveLength(2);
  });

  it("n'affiche jamais un brouillon non publié", async () => {
    const site = await createSite("test");
    await prisma.page.create({ data: { siteId: site.id, slug: "promo", title: "Promo", draft: CONTENT, published: Prisma.DbNull } });
    expect(await findPublishedPage(site.id, "promo")).toBeNull();
  });

  it("renvoie null pour un contenu publié abîmé", async () => {
    const site = await createSite("test");
    await prisma.page.create({ data: { siteId: site.id, slug: "casse", title: "Cassé", draft: {}, published: { foo: 1 } } });
    expect(await findPublishedPage(site.id, "casse")).toBeNull();
  });

  it("ne renvoie pas la page d'un autre site", async () => {
    const site = await createSite("test");
    const other = await createSite("autre");
    await prisma.page.create({ data: { siteId: other.id, slug: "autre", title: "Autre", draft: CONTENT, published: CONTENT } });
    expect(await findPublishedPage(site.id, "autre")).toBeNull();
  });
});
