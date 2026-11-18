import { findOwnedPage, publishPageForUser, saveDraftForUser } from "@/lib/pages";
import { prisma } from "@/lib/prisma";
import { createSiteForUser } from "@/lib/site-create";
import { resetDb } from "@/lib/test/db";
import template from "@/templates/landing-fr.json";

const A = { id: "user-a", name: "A", email: "a@test.local" };
const B = { id: "user-b", name: "B", email: "b@test.local" };

const EDITED = {
  ...template,
  content: template.content.map((block) =>
    block.type === "Hero" ? { ...block, props: { ...block.props, title: "Titre modifié" } } : block,
  ),
};
const INVALID = { ...template, content: [...template.content, { type: "Heading", props: { id: "h", text: "x" } }] };

let pageA: string;
let siteA: string;

beforeEach(async () => {
  await resetDb();
  const a = await createSiteForUser(A, { name: "Site A", subdomain: "site-a" });
  await createSiteForUser(B, { name: "Site B", subdomain: "site-b" });
  if (!a.ok) throw new Error("création impossible");
  pageA = a.pageId;
  siteA = a.siteId;
});
afterAll(() => prisma.$disconnect());

const draftOf = async (id: string) => (await prisma.page.findUniqueOrThrow({ where: { id } })).draft;

describe("findOwnedPage", () => {
  it("renvoie la page à son propriétaire", async () => {
    const page = await findOwnedPage(A.id, pageA);
    expect(page?.site).toMatchObject({ id: siteA, subdomain: "site-a", status: "DRAFT" });
  });

  it("ne renvoie pas la page d'un autre vendeur", async () => {
    expect(await findOwnedPage(B.id, pageA)).toBeNull();
  });

  it("renvoie null pour une page inexistante", async () => {
    expect(await findOwnedPage(A.id, "inexistante")).toBeNull();
  });
});

describe("saveDraftForUser", () => {
  it("enregistre le brouillon du propriétaire sans publier", async () => {
    expect(await saveDraftForUser(A.id, pageA, EDITED)).toEqual({ ok: true });
    const page = await prisma.page.findUniqueOrThrow({ where: { id: pageA } });
    expect((page.draft as typeof EDITED).content[0].props.title).toBe("Titre modifié");
    expect(page.published).toBeNull();
  });

  it("refuse le brouillon d'un autre vendeur avec le même message qu'une page absente", async () => {
    const before = await draftOf(pageA);
    expect(await saveDraftForUser(B.id, pageA, EDITED)).toEqual({ ok: false, error: "Page introuvable" });
    expect(await saveDraftForUser(B.id, "inexistante", EDITED)).toEqual({ ok: false, error: "Page introuvable" });
    expect(await draftOf(pageA)).toEqual(before);
  });

  it("refuse un contenu invalide sans rien écrire", async () => {
    const before = await draftOf(pageA);
    const result = await saveDraftForUser(A.id, pageA, INVALID);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("Heading");
    expect(await draftOf(pageA)).toEqual(before);
  });
});

describe("publishPageForUser", () => {
  it("publie, crée une version et passe le site en ligne", async () => {
    const result = await publishPageForUser(A.id, pageA, EDITED);
    expect(result).toEqual({ ok: true, siteId: siteA, subdomain: "site-a" });

    const page = await prisma.page.findUniqueOrThrow({ where: { id: pageA } });
    expect((page.published as typeof EDITED).content[0].props.title).toBe("Titre modifié");
    expect(page.draft).toEqual(page.published);
    expect(await prisma.pageVersion.count({ where: { pageId: pageA } })).toBe(1);
    expect((await prisma.site.findUniqueOrThrow({ where: { id: siteA } })).status).toBe("PUBLISHED");
  });

  it("garde une version par publication", async () => {
    await publishPageForUser(A.id, pageA, EDITED);
    await publishPageForUser(A.id, pageA, template);
    expect(await prisma.pageVersion.count({ where: { pageId: pageA } })).toBe(2);
  });

  it("refuse de publier la page d'un autre vendeur", async () => {
    expect(await publishPageForUser(B.id, pageA, EDITED)).toEqual({ ok: false, error: "Page introuvable" });
    expect(await prisma.pageVersion.count()).toBe(0);
  });

  it("refuse de publier un site suspendu sans rien changer", async () => {
    await prisma.site.update({ where: { id: siteA }, data: { status: "SUSPENDED" } });
    expect(await publishPageForUser(A.id, pageA, EDITED)).toEqual({ ok: false, error: "Ce site est suspendu" });
    expect((await prisma.site.findUniqueOrThrow({ where: { id: siteA } })).status).toBe("SUSPENDED");
    expect(await prisma.pageVersion.count()).toBe(0);
    expect((await prisma.page.findUniqueOrThrow({ where: { id: pageA } })).published).toBeNull();
  });

  it("refuse un contenu invalide sans rien publier", async () => {
    expect((await publishPageForUser(A.id, pageA, INVALID)).ok).toBe(false);
    expect(await prisma.pageVersion.count()).toBe(0);
  });
});
