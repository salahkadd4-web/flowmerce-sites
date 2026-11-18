import { pageTitle } from "@/lib/page-title";

it("prend le titre de la page défini dans l'éditeur", () => {
  expect(pageTitle("Promo", "Accueil", "Boutique")).toBe("Promo");
});
it("passe au titre de la page si celui de l'éditeur est vide", () => {
  expect(pageTitle("", "Accueil", "Boutique")).toBe("Accueil");
});
it("finit par le nom du site", () => {
  expect(pageTitle("  ", "", "Boutique")).toBe("Boutique");
});
it("ignore un titre d'éditeur qui n'est pas une chaîne", () => {
  expect(pageTitle(42, "Accueil", "B")).toBe("Accueil");
});
