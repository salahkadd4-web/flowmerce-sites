import { validatePageContent } from "@/lib/page-content";
import { prisma } from "@/lib/prisma";
import { createSiteForUser } from "@/lib/site-create";
import { resetDb } from "@/lib/test/db";

const USER = { id: "user-create", name: "Amina", email: "amina@test.local" };

beforeEach(resetDb);
afterAll(() => prisma.$disconnect());

it("crée le tenant, le site en brouillon et sa page au premier site", async () => {
  const result = await createSiteForUser(USER, { name: "Ma Boutique", subdomain: "ma-boutique" });
  expect(result.ok).toBe(true);
  if (!result.ok) return;

  const tenant = await prisma.tenant.findUnique({ where: { ownerUserId: USER.id } });
  expect(tenant?.name).toBe("Amina");

  const site = await prisma.site.findUnique({ where: { id: result.siteId } });
  expect(site).toMatchObject({ name: "Ma Boutique", subdomain: "ma-boutique", type: "LANDING", status: "DRAFT", locale: "fr" });

  const page = await prisma.page.findUnique({ where: { id: result.pageId } });
  expect(page).toMatchObject({ siteId: result.siteId, slug: "", title: "Ma Boutique", published: null });
  expect(validatePageContent(page?.draft).ok).toBe(true);
});

it("crée la page à partir du modèle choisi", async () => {
  const result = await createSiteForUser(USER, { name: "Simple", subdomain: "simple", templateId: "landing-fr" });
  expect(result.ok).toBe(true);
  if (!result.ok) return;
  const page = await prisma.page.findUniqueOrThrow({ where: { id: result.pageId } });
  expect(validatePageContent(page.draft).ok).toBe(true);
});

it("un modèle pro : le pied de page porte le nom du site", async () => {
  const result = await createSiteForUser(USER, { name: "Boutique Amina", subdomain: "amina", templateId: "mode" });
  if (!result.ok) throw new Error(result.error);
  const page = await prisma.page.findUniqueOrThrow({ where: { id: result.pageId } });
  const content = (page.draft as { content: { type: string; props: { shopName?: string } }[] }).content;
  expect(content.find((block) => block.type === "Footer")?.props.shopName).toBe("Boutique Amina");
  expect(validatePageContent(page.draft).ok).toBe(true);
});

it("refuse un modèle inconnu sans rien créer", async () => {
  expect(await createSiteForUser(USER, { name: "X", subdomain: "inconnu", templateId: "inconnu" })).toEqual({
    ok: false,
    field: "template",
    error: "Choisissez un modèle",
  });
  expect(await prisma.site.count()).toBe(0);
});

it("réutilise le même tenant pour un deuxième site", async () => {
  await createSiteForUser(USER, { name: "Premier", subdomain: "premier" });
  await createSiteForUser(USER, { name: "Second", subdomain: "second" });
  expect(await prisma.tenant.count()).toBe(1);
  expect(await prisma.site.count()).toBe(2);
});

it("prend l'email comme nom de tenant quand l'utilisateur n'a pas de nom", async () => {
  await createSiteForUser({ ...USER, name: null }, { name: "Boutique", subdomain: "boutique" });
  expect((await prisma.tenant.findUnique({ where: { ownerUserId: USER.id } }))?.name).toBe("amina@test.local");
});

it("refuse un sous-domaine déjà pris", async () => {
  await createSiteForUser(USER, { name: "Premier", subdomain: "pris" });
  const result = await createSiteForUser({ id: "autre", name: "B", email: "b@test.local" }, { name: "B", subdomain: "pris" });
  expect(result).toEqual({ ok: false, field: "subdomain", error: "Ce sous-domaine est déjà pris" });
});

it("refuse un sous-domaine invalide ou réservé sans rien créer", async () => {
  expect(await createSiteForUser(USER, { name: "X", subdomain: "app" })).toEqual({
    ok: false,
    field: "subdomain",
    error: "Ce sous-domaine est réservé",
  });
  expect(await prisma.tenant.count()).toBe(0);
});

it("refuse un nom vide ou trop long", async () => {
  expect(await createSiteForUser(USER, { name: "   ", subdomain: "vide" })).toEqual({
    ok: false,
    field: "name",
    error: "Donnez un nom à votre site",
  });
  expect(await createSiteForUser(USER, { name: "a".repeat(61), subdomain: "long" })).toEqual({
    ok: false,
    field: "name",
    error: "60 caractères maximum",
  });
});
