import { validatePageContent } from "@/lib/page-content";
import { templateById } from "@/templates";
import { applyTemplate } from "./apply-template";

type Block = { type: string; props: Record<string, unknown> & { id: string } };
type Page = { root: { props: Record<string, unknown> }; content: Block[] };

const current: Page = {
  root: { props: { title: "Ma page", lang: "ar", headingFont: "cairo", bodyFont: "cairo", productId: "p42" } },
  content: [
    { type: "Hero", props: { id: "hero-1", title: "Ancien" } },
    { type: "Footer", props: { id: "footer-1", shopName: "Boutique Amina" } },
  ],
};
const template = templateById("montres")!.data as Page;

describe("applyTemplate", () => {
  it("garde le produit, la langue et le titre de la page ; prend le reste du modèle", () => {
    const next = applyTemplate(current, template) as Page;
    expect(next.root.props).toMatchObject({ productId: "p42", lang: "ar", title: "Ma page", headingFont: "playfair", bodyFont: "montserrat" });
    expect(next.content.map((b) => b.type)).toEqual(template.content.map((b) => b.type));
  });

  it("garde le nom de la boutique du pied de page", () => {
    const next = applyTemplate(current, template) as Page;
    expect(next.content.find((b) => b.type === "Footer")?.props.shopName).toBe("Boutique Amina");
  });

  it("donne de nouveaux identifiants, tous différents, et le bouton de la bannière suit la fiche produit", () => {
    const next = applyTemplate(current, template) as Page;
    const ids = next.content.map((b) => b.props.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(template.content.map((b) => b.props.id)).not.toContain(id);
    const product = next.content.find((b) => b.type === "Product")!;
    const hero = next.content.find((b) => b.type === "Hero")!;
    expect(hero.props.buttonHref).toBe(`#produit-${product.props.id}`);
  });

  it("le résultat est une page valide, et le modèle n'est pas modifié", () => {
    const before = JSON.stringify(template);
    const next = applyTemplate(current, template);
    expect(validatePageContent(next).ok).toBe(true);
    expect(JSON.stringify(template)).toBe(before);
  });

  it("une page sans pied de page prend le nom du modèle", () => {
    const next = applyTemplate({ ...current, content: [] }, template) as Page;
    expect(next.content.find((b) => b.type === "Footer")?.props.shopName).toBe("Heure d'Or");
  });
});
