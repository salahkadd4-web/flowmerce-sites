import template from "@/templates/landing-fr.json";
import { validatePageContent } from "@/lib/page-content";

it("le modèle de landing page est un contenu valide", () => {
  const result = validatePageContent(template);
  expect(result.ok).toBe(true);
});

it("le modèle contient bannière, fiche produit, texte, formulaire et pied de page", () => {
  expect(template.content.map((block) => block.type)).toEqual(["Hero", "Product", "Text", "OrderForm", "Footer"]);
});

it("chaque bloc du modèle a un identifiant unique", () => {
  const ids = template.content.map((block) => block.props.id);
  expect(new Set(ids).size).toBe(ids.length);
});

it("le modèle ouvre sur une bannière sombre et alterne les fonds", () => {
  const result = validatePageContent(template);
  if (!result.ok) throw new Error(result.error);
  expect(result.content.content[0].props.style).toMatchObject({ background: "color", backgroundColor: "#16265c" });
  expect(result.content.content[2].props.style).toMatchObject({ background: "color", backgroundColor: "#faf6f0" });
  expect(result.content.root.props).toMatchObject({ lang: "fr", headingFont: "system", bodyFont: "system" });
});
