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
