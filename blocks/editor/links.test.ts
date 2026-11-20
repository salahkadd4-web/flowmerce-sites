import { linkError, linkTargetOf } from "./links";

describe("linkError", () => {
  it("accepte un lien vide (pas de lien) et un lien saisi sans https://", () => {
    expect(linkError("")).toBeNull();
    expect(linkError("facebook.com/maboutique")).toBeNull();
    expect(linkError("wa.me/213555123456")).toBeNull();
    expect(linkError("https://instagram.com/x")).toBeNull();
    expect(linkError("#commande")).toBeNull();
  });

  it("refuse ce qui n'est pas un lien sûr", () => {
    expect(linkError("javascript:alert(1)")).toBe("Lien non valable");
    expect(linkError("data:text/html,x")).toBe("Lien non valable");
    expect(linkError("pas un lien")).toBe("Lien non valable");
  });
});

describe("linkTargetOf", () => {
  it("reconnaît le formulaire, la fiche produit, ou un autre lien", () => {
    expect(linkTargetOf("#commande", "#produit-p1")).toBe("order");
    expect(linkTargetOf("#produit-p1", "#produit-p1")).toBe("product");
    expect(linkTargetOf("https://wa.me/213", "#produit-p1")).toBe("other");
    expect(linkTargetOf("#produit-p1", null)).toBe("other");
  });
});
