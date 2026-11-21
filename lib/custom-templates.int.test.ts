import { prisma } from "@/lib/prisma";
import { createSiteForUser } from "@/lib/site-create";
import { resetDb } from "@/lib/test/db";
import { templateById } from "@/templates";
import { customTemplateForUser, deleteCustomTemplate, listCustomTemplates, MAX_CUSTOM_TEMPLATES, saveCustomTemplate } from "./custom-templates";

const AMINA = { id: "user-amina", name: "Amina", email: "amina@test.local" };
const KARIM = { id: "user-karim", name: "Karim", email: "karim@test.local" };
const PAGE = templateById("mode")!.data;

beforeEach(async () => {
  await resetDb();
  await createSiteForUser(AMINA, { name: "Boutique Amina", subdomain: "amina" });
  await createSiteForUser(KARIM, { name: "Boutique Karim", subdomain: "karim" });
});
afterAll(() => prisma.$disconnect());

it("enregistre la page comme modèle, et la liste avec son aperçu", async () => {
  const result = await saveCustomTemplate(AMINA.id, "  Ma vitrine  ", "Vêtements", PAGE);
  expect(result.ok).toBe(true);
  const list = await listCustomTemplates(AMINA.id);
  expect(list).toHaveLength(1);
  expect(list[0]).toMatchObject({ name: "Ma vitrine", category: "Vêtements" });
  expect(list[0].cover).toMatchObject({ image: "/templates/mode/banniere.webp", title: "L'élégance au quotidien" });
});

it("refuse un nom vide ou trop long, et une catégorie trop longue devient « Autre »", async () => {
  expect(await saveCustomTemplate(AMINA.id, "   ", "Mode", PAGE)).toEqual({ ok: false, error: "Donnez un nom au modèle" });
  expect(await saveCustomTemplate(AMINA.id, "x".repeat(61), "Mode", PAGE)).toEqual({ ok: false, error: "60 caractères maximum" });
  await saveCustomTemplate(AMINA.id, "Long", "c".repeat(41), PAGE);
  expect((await listCustomTemplates(AMINA.id))[0].category).toBe("Autre");
});

it("refuse un contenu de page invalide", async () => {
  expect(await saveCustomTemplate(AMINA.id, "Cassé", "Autre", { content: [{ type: "Inconnu", props: {} }] })).toMatchObject({ ok: false });
  expect(await saveCustomTemplate(AMINA.id, "Pas une page", "Autre", "texte")).toMatchObject({ ok: false });
});

it(`limite à ${MAX_CUSTOM_TEMPLATES} modèles par vendeur`, async () => {
  for (let i = 0; i < MAX_CUSTOM_TEMPLATES; i++) expect((await saveCustomTemplate(AMINA.id, `M${i}`, "Autre", PAGE)).ok).toBe(true);
  expect(await saveCustomTemplate(AMINA.id, "Un de trop", "Autre", PAGE)).toEqual({ ok: false, error: `${MAX_CUSTOM_TEMPLATES} modèles au plus : supprimez-en un` });
});

it("refuse sans site (pas de compte vendeur)", async () => {
  expect(await saveCustomTemplate("inconnu", "X", "Autre", PAGE)).toEqual({ ok: false, error: "Créez d'abord un site" });
});

it("le modèle d'un autre vendeur n'est ni visible, ni lisible, ni supprimable", async () => {
  const saved = await saveCustomTemplate(AMINA.id, "Secret", "Autre", PAGE);
  if (!saved.ok) throw new Error(saved.error);
  expect(await listCustomTemplates(KARIM.id)).toEqual([]);
  expect(await customTemplateForUser(KARIM.id, saved.id)).toBeNull();
  expect(await deleteCustomTemplate(KARIM.id, saved.id)).toBe(false);
  expect(await customTemplateForUser(AMINA.id, saved.id)).not.toBeNull();
  expect(await deleteCustomTemplate(AMINA.id, { id: saved.id })).toBe(false);
  expect(await deleteCustomTemplate(AMINA.id, saved.id)).toBe(true);
  expect(await listCustomTemplates(AMINA.id)).toEqual([]);
});

it("un modèle n'emporte ni le titre d'onglet ni le produit de la page d'origine", async () => {
  const page = structuredClone(PAGE) as { root: { props: Record<string, unknown> } };
  page.root.props = { ...page.root.props, title: "Boutique Amina — soldes", productId: "p-amina" };
  const saved = await saveCustomTemplate(AMINA.id, "Soldes", "Autre", page);
  if (!saved.ok) throw new Error(saved.error);
  const data = (await customTemplateForUser(AMINA.id, saved.id)) as { root: { props: Record<string, unknown> } };
  expect(data.root.props.title).toBe("");
  expect(data.root.props).not.toHaveProperty("productId");
});
