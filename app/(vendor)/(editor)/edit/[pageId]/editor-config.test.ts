import { buildEditorConfig } from "./editor-config";

it("propose « Produit de la page » avec les produits du vendeur", () => {
  const config = buildEditorConfig([
    { id: "p1", name: "Chaussure cuir" },
    { id: "p2", name: "Sac à main" },
  ]);
  const field = config.root?.fields?.productId;
  expect(field).toMatchObject({ type: "select", label: "Produit de la page" });
  expect(field && "options" in field ? field.options : []).toEqual([
    { label: "Aucun produit", value: "" },
    { label: "Chaussure cuir", value: "p1" },
    { label: "Sac à main", value: "p2" },
  ]);
});

it("garde le titre de la page et branche l'envoi d'images", () => {
  const config = buildEditorConfig([]);
  expect(config.root?.fields?.title).toBeDefined();
  const image = config.components.Hero?.fields?.image;
  expect(image && "render" in image ? image.render.name : "").toBe("MediaField");
});
