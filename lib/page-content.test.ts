import { parsePageContent, validatePageContent } from "@/lib/page-content";

const HERO = {
  type: "Hero",
  props: {
    id: "hero-1",
    title: "Bienvenue",
    subtitle: "",
    image: null,
    buttonLabel: "Commander",
    buttonHref: "#commande",
    align: "center",
    background: "light",
  },
};

const page = (content: unknown[]) => ({ root: { props: { title: "Accueil" } }, content });

describe("validatePageContent (strict, à l'enregistrement)", () => {
  it("accepte une page valide", () => {
    const result = validatePageContent(page([HERO]));
    expect(result.ok).toBe(true);
  });

  it("refuse un bloc de type inconnu en le nommant", () => {
    const result = validatePageContent(page([HERO, { type: "Heading", props: { id: "h", text: "x" } }]));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("Heading");
  });

  it("refuse un bloc invalide en nommant le bloc et le champ", () => {
    const bad = { ...HERO, props: { ...HERO.props, buttonHref: "javascript:x" } };
    const result = validatePageContent(page([bad]));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("Bannière");
      expect(result.error).toContain("Lien du bouton");
    }
  });

  it("refuse une page sans tableau content", () => {
    expect(validatePageContent({ root: { props: {} } }).ok).toBe(false);
  });
});

describe("parsePageContent (tolérant, à l'affichage)", () => {
  it("écarte les blocs invalides ou inconnus et garde les autres", () => {
    const badHero = { ...HERO, props: { ...HERO.props, id: "hero-2", buttonHref: "javascript:x" } };
    const parsed = parsePageContent(page([HERO, { type: "Heading", props: { id: "h", text: "x" } }, badHero]));
    expect(parsed?.content).toHaveLength(1);
    expect(parsed?.content[0].props.id).toBe("hero-1");
  });

  it("écarte un bloc null ou sans props", () => {
    const parsed = parsePageContent(page([null, { type: "Hero" }, HERO]));
    expect(parsed?.content).toHaveLength(1);
  });

  it("complète un root absent et accepte des zones vides", () => {
    expect(parsePageContent({ content: [], zones: {} })).toEqual({ root: { props: {} }, content: [] });
  });

  it("ignore un titre de page qui n'est pas une chaîne", () => {
    const parsed = parsePageContent({ root: { props: { title: 42 } }, content: [HERO] });
    expect(parsed?.root.props.title).toBeUndefined();
    expect(parsed?.content).toHaveLength(1);
  });

  it("renvoie null pour une forme de page invalide", () => {
    expect(parsePageContent({ content: "x" })).toBeNull();
    expect(parsePageContent("texte")).toBeNull();
    expect(parsePageContent(null)).toBeNull();
  });
});

describe("produit de la page (root.props.productId)", () => {
  it("est accepté à l'enregistrement et conservé", () => {
    const result = validatePageContent({ root: { props: { title: "Accueil", productId: "prod-1" } }, content: [HERO] });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.content.root.props).toEqual({ title: "Accueil", productId: "prod-1" });
  });

  it("est refusé s'il n'est pas une chaîne", () => {
    expect(validatePageContent({ root: { props: { productId: 42 } }, content: [] }).ok).toBe(false);
  });

  it("est ignoré à l'affichage s'il est invalide, sans casser la page", () => {
    const parsed = parsePageContent({ root: { props: { productId: { evil: true } } }, content: [HERO] });
    expect(parsed?.root.props).toEqual({});
    expect(parsed?.content).toHaveLength(1);
  });

  it("vide compte comme absent", () => {
    const result = validatePageContent({ root: { props: { productId: "" } }, content: [] });
    expect(result.ok && result.content.root.props).toEqual({});
  });
});
