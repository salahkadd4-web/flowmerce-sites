import type { ReactElement } from "react";
import { buildEditorConfig, TEXT_STYLES } from "./editor-config";

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

it("la barre de mise en forme du texte : quatre styles, puis taille, couleur et alignement de ce texte", () => {
  const config = buildEditorConfig([]);
  for (const [block, name] of [["Hero", "title"], ["Hero", "subtitle"], ["Text", "title"], ["Text", "body"], ["Footer", "returnPolicy"]] as const) {
    const field = config.components[block]?.fields?.[name as never] as unknown as { renderMenu?: { name: string }; renderInlineMenu?: { name: string } };
    // Menu du panneau : les quatre styles (le panneau ne sert plus qu'aux réglages de la page).
    expect(field.renderMenu?.name).toBe("FourStylesMenu");
    expect(field.renderInlineMenu?.name).toBe("TextToolbar");
  }
});

it("chaque texte règle sa propre taille et sa propre couleur", () => {
  expect(TEXT_STYLES.Hero.title).toEqual({ size: "titleSize", color: "titleColor", align: true });
  expect(TEXT_STYLES.Hero.subtitle).toEqual({ size: "textSize", color: "textColor", align: true });
  expect(TEXT_STYLES.Text.body).toEqual({ size: "textSize", color: "textColor", align: true });
  expect(TEXT_STYLES.Footer.returnPolicy).toEqual({ size: "textSize", color: "textColor" });
});

it("la barre d'un texte est la même d'une construction à l'autre (sinon Puck remonte l'aperçu)", () => {
  const first = buildEditorConfig([]).components.Hero?.fields?.title as unknown as { renderInlineMenu: unknown };
  const second = buildEditorConfig([{ id: "p1", name: "x" }]).components.Hero?.fields?.title as unknown as { renderInlineMenu: unknown };
  expect(first.renderInlineMenu).toBe(second.renderInlineMenu);
});

describe("panneau des réglages : les réglages des poignées y ont leur champ", () => {
  type Group = { objectFields: Record<string, { type: string; render?: { name: string }; options?: { label: string; value: unknown }[] }> };

  it("le cadre d'une image : proportions naturelles ou hauteur choisie", () => {
    const config = buildEditorConfig([]);
    for (const name of ["Hero", "Image", "Product"] as const) {
      const field = config.components[name]?.fields?.imageHeight as unknown as { render?: { name: string } };
      expect(field.render?.name).toBe("FrameField");
    }
  });

  it("la hauteur d'une section : selon le contenu, ou de 20 à 100 % de l'écran (jamais 10)", () => {
    const style = buildEditorConfig([]).components.Text?.fields?.style as unknown as Group;
    const values = style.objectFields.minHeight.options!.map((o) => o.value);
    expect(values).toEqual([0, 20, 30, 40, 50, 60, 70, 80, 90, 100]);
  });

  it("la largeur d'un bouton : automatique, ou de 20 à 100 % du contenu", () => {
    const button = buildEditorConfig([]).components.Hero?.fields?.button as unknown as Group;
    const values = button.objectFields.width.options!.map((o) => o.value);
    expect(values).toEqual(["auto", 20, 30, 40, 50, 60, 70, 80, 90, 100]);
  });
});
