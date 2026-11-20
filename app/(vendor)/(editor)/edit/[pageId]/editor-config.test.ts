import type { ReactElement } from "react";
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

it("branche les champs d'édition jusque dans les groupes", () => {
  const config = buildEditorConfig([]);
  const style = config.components.Hero?.fields?.style as unknown as { objectFields: Record<string, { render?: { name: string } }> };
  expect(style.objectFields.backgroundImage.render?.name).toBe("MediaField");
  expect(style.objectFields.overlay.render?.name).toBe("RangeField");
  expect(style.objectFields.backgroundColor.render?.name).toBe("ColorField");
  const width = config.components.Image?.fields?.imageWidth;
  expect(width && "render" in width ? width.render.name : "").toBe("RangeField");
  const button = config.components.OrderForm?.fields?.button as unknown as { objectFields: Record<string, { render?: { name: string } }> };
  expect(button.objectFields.color.render?.name).toBe("ColorField");
});

it("garde les réglages de chaque champ remplacé", () => {
  const config = buildEditorConfig([]);
  const style = config.components.Text?.fields?.style as unknown as { objectFields: Record<string, { label?: string; editorOptions?: unknown }> };
  expect(style.objectFields.overlay).toMatchObject({ label: "Assombrissement de l'image", editorOptions: { min: 0, max: 80, step: 10, unit: "%" } });
});

it("propose la langue et les polices de la page", () => {
  const root = buildEditorConfig([]).root?.fields;
  expect(root?.lang).toMatchObject({ label: "Langue de la page" });
  expect(root?.bodyFont).toMatchObject({ label: "Police du texte" });
});

it("l'éditeur donne une poignée aux blocs à image", () => {
  for (const name of ["Hero", "Image", "Product"] as const) {
    const component = buildEditorConfig([]).components[name]!;
    const element = component.render({
      ...component.defaultProps,
      id: "b1",
      puck: { isEditing: true, metadata: {} },
    } as never) as ReactElement<{ renderImageBox?: unknown }>;
    expect(typeof element.props.renderImageBox).toBe("function");
  }
});

it("la barre de mise en forme propose gras, italique, souligné et barré", () => {
  const config = buildEditorConfig([]);
  for (const [block, name] of [["Hero", "title"], ["Text", "body"], ["Footer", "returnPolicy"]] as const) {
    const field = config.components[block]?.fields?.[name as never] as unknown as { renderMenu?: { name: string }; renderInlineMenu?: { name: string } };
    expect(field.renderMenu?.name).toBe("FourStylesMenu");
    expect(field.renderInlineMenu?.name).toBe("FourStylesMenu");
  }
});
