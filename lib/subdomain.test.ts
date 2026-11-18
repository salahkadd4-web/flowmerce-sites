import { slugifySubdomain, validateSubdomain } from "@/lib/subdomain";

describe("slugifySubdomain", () => {
  it("retire les accents et met en minuscules", () => {
    expect(slugifySubdomain("Élégance Shop")).toBe("elegance-shop");
  });
  it("remplace les caractères interdits et fusionne les tirets", () => {
    expect(slugifySubdomain("  Ma -- Boutique !! ")).toBe("ma-boutique");
  });
  it("coupe à 63 caractères sans finir par un tiret", () => {
    const slug = slugifySubdomain("a".repeat(62) + " b");
    expect(slug.length).toBeLessThanOrEqual(63);
    expect(slug.endsWith("-")).toBe(false);
  });
  it("renvoie une chaîne vide pour un nom sans lettre ni chiffre", () => {
    expect(slugifySubdomain("!!!")).toBe("");
  });
});

describe("validateSubdomain", () => {
  it("accepte un sous-domaine correct", () => {
    expect(validateSubdomain("ma-boutique")).toBeNull();
    expect(validateSubdomain("abc")).toBeNull();
  });
  it("refuse moins de 3 caractères", () => {
    expect(validateSubdomain("ab")).toBe("3 caractères minimum");
  });
  it("refuse plus de 63 caractères", () => {
    expect(validateSubdomain("a".repeat(64))).toBe("63 caractères maximum");
  });
  it.each(["-abc", "abc-", "ABC", "a_b", "ma boutique", "élé"])("refuse le format %j", (value) => {
    expect(validateSubdomain(value)).toBe(
      "Lettres minuscules, chiffres et tirets uniquement, sans tiret au début ni à la fin",
    );
  });
  it("refuse un sous-domaine réservé", () => {
    expect(validateSubdomain("app")).toBe("Ce sous-domaine est réservé");
    expect(validateSubdomain("admin")).toBe("Ce sous-domaine est réservé");
  });
});
