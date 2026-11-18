import { buildVariants, productInputSchema, toPublicProduct, variantKey } from "@/lib/product-input";

const VALID = {
  name: "Chaussure cuir",
  description: "Faite main.",
  price: 2500,
  comparePrice: 3000,
  images: [],
  optionAxes: [{ name: "Taille", values: ["39", "40"] }],
  stocks: { "Taille=39": 5, "Taille=40": 0 },
  active: true,
};

describe("variantes", () => {
  it("une variante unique sans axe", () => {
    expect(buildVariants([])).toEqual([{}]);
  });

  it("toutes les combinaisons de deux axes", () => {
    const variants = buildVariants([
      { name: "Taille", values: ["39", "40"] },
      { name: "Couleur", values: ["noir", "marron", "bleu"] },
    ]);
    expect(variants).toHaveLength(6);
    expect(variants).toContainEqual({ Taille: "40", Couleur: "bleu" });
  });

  it("une clé de variante indépendante de l'ordre des options", () => {
    expect(variantKey({ Taille: "39", Couleur: "noir" })).toBe("Couleur=noir|Taille=39");
    expect(variantKey({ Couleur: "noir", Taille: "39" })).toBe("Couleur=noir|Taille=39");
    expect(variantKey({})).toBe("");
  });
});

describe("productInputSchema", () => {
  it("accepte un produit valide", () => {
    expect(productInputSchema.safeParse(VALID).success).toBe(true);
  });

  it("refuse un prix barré inférieur ou égal au prix", () => {
    expect(productInputSchema.safeParse({ ...VALID, comparePrice: 2500 }).success).toBe(false);
    expect(productInputSchema.safeParse({ ...VALID, comparePrice: null }).success).toBe(true);
  });

  it("refuse trois axes et les valeurs en double", () => {
    const axis = { name: "A", values: ["1"] };
    expect(productInputSchema.safeParse({ ...VALID, optionAxes: [axis, { ...axis, name: "B" }, { ...axis, name: "C" }] }).success).toBe(false);
    expect(productInputSchema.safeParse({ ...VALID, optionAxes: [{ name: "Taille", values: ["39", "39"] }] }).success).toBe(false);
  });

  it("refuse deux axes de même nom", () => {
    const axes = [{ name: "Taille", values: ["39"] }, { name: "Taille", values: ["40"] }];
    expect(productInputSchema.safeParse({ ...VALID, optionAxes: axes }).success).toBe(false);
  });

  it("refuse un prix nul, négatif ou décimal", () => {
    for (const price of [0, -1, 12.5]) expect(productInputSchema.safeParse({ ...VALID, price }).success).toBe(false);
  });
});

describe("toPublicProduct", () => {
  it("dit si chaque variante est disponible sans exposer le stock", () => {
    const product = toPublicProduct({
      id: "p1",
      name: "Chaussure",
      description: "",
      price: 2500,
      comparePrice: null,
      images: [],
      optionAxes: [{ name: "Taille", values: ["39", "40"] }],
      variants: [
        { id: "v1", options: { Taille: "39" }, stock: 5 },
        { id: "v2", options: { Taille: "40" }, stock: 0 },
      ],
    });
    expect(product.variants).toEqual([
      { id: "v1", options: { Taille: "39" }, inStock: true },
      { id: "v2", options: { Taille: "40" }, inStock: false },
    ]);
    expect(JSON.stringify(product)).not.toContain("stock\"");
  });
});
