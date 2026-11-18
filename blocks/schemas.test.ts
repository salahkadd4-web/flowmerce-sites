import { BLOCK_SCHEMAS } from "@/blocks/schemas";

const HERO = {
  id: "hero-1",
  title: "Le nom de votre produit",
  subtitle: "Une phrase qui donne envie d'acheter.",
  image: null,
  buttonLabel: "Commander maintenant",
  buttonHref: "#commande",
  align: "center",
  background: "light",
};

const MEDIA = { url: "/media/" + "a".repeat(32) + ".png", width: 800, height: 600 };

describe("Hero", () => {
  it("accepte un Hero complet", () => {
    expect(BLOCK_SCHEMAS.Hero.safeParse(HERO).success).toBe(true);
    expect(BLOCK_SCHEMAS.Hero.safeParse({ ...HERO, image: MEDIA }).success).toBe(true);
  });
  it("refuse un lien de bouton javascript:", () => {
    expect(BLOCK_SCHEMAS.Hero.safeParse({ ...HERO, buttonHref: "javascript:x" }).success).toBe(false);
  });
  it("accepte un Hero sans bouton (lien vide)", () => {
    expect(BLOCK_SCHEMAS.Hero.safeParse({ ...HERO, buttonHref: "" }).success).toBe(true);
  });
  it("refuse un titre de 121 caractères", () => {
    expect(BLOCK_SCHEMAS.Hero.safeParse({ ...HERO, title: "a".repeat(121) }).success).toBe(false);
  });
  it("refuse un fond hors de la palette", () => {
    expect(BLOCK_SCHEMAS.Hero.safeParse({ ...HERO, background: "#ff0000" }).success).toBe(false);
  });
  it("refuse une image qui ne vient pas de /media", () => {
    const image = { ...MEDIA, url: "https://evil.com/x.png" };
    expect(BLOCK_SCHEMAS.Hero.safeParse({ ...HERO, image }).success).toBe(false);
  });
});

describe("Text", () => {
  it("refuse un texte de plus de 3 000 caractères", () => {
    const text = { id: "t", title: "", body: "a".repeat(3001), align: "left" };
    expect(BLOCK_SCHEMAS.Text.safeParse(text).success).toBe(false);
    expect(BLOCK_SCHEMAS.Text.safeParse({ ...text, body: "a".repeat(3000) }).success).toBe(true);
  });
});

describe("Image", () => {
  it("exige un texte alternatif", () => {
    const image = { id: "i", image: MEDIA, alt: "", caption: "", width: "contained" };
    expect(BLOCK_SCHEMAS.Image.safeParse(image).success).toBe(false);
    expect(BLOCK_SCHEMAS.Image.safeParse({ ...image, alt: "Photo du produit" }).success).toBe(true);
  });
});

describe("Footer", () => {
  const footer = {
    id: "f",
    shopName: "Ma Boutique",
    phone: "+213 555 00 00 00",
    email: "contact@boutique.dz",
    facebook: "https://facebook.com/maboutique",
    instagram: "",
    tiktok: "",
    returnPolicy: "Retour sous 7 jours.",
  };
  it("accepte un pied de page complet", () => {
    expect(BLOCK_SCHEMAS.Footer.safeParse(footer).success).toBe(true);
  });
  it("refuse un lien de réseau social javascript:", () => {
    expect(BLOCK_SCHEMAS.Footer.safeParse({ ...footer, facebook: "javascript:x" }).success).toBe(false);
  });
  it("refuse un email invalide", () => {
    expect(BLOCK_SCHEMAS.Footer.safeParse({ ...footer, email: "pas-un-email" }).success).toBe(false);
  });
});

describe("saisies courantes des vendeurs", () => {
  const footer = {
    id: "f",
    shopName: "Ma Boutique",
    phone: "",
    email: "",
    facebook: "",
    instagram: "",
    tiktok: "",
    returnPolicy: "",
  };
  const parse = (props: Record<string, unknown>) => BLOCK_SCHEMAS.Footer.safeParse({ ...footer, ...props });

  it("complète un lien de réseau social saisi sans https://", () => {
    const result = parse({ facebook: "facebook.com/maboutique", instagram: "www.instagram.com/ma.boutique" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.facebook).toBe("https://facebook.com/maboutique");
      expect(result.data.instagram).toBe("https://www.instagram.com/ma.boutique");
    }
  });

  it("complète le lien du bouton saisi sans https://", () => {
    const result = BLOCK_SCHEMAS.Hero.safeParse({ ...HERO, buttonHref: "wa.me/213555000000" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.buttonHref).toBe("https://wa.me/213555000000");
  });

  it("ne complète ni une ancre, ni un lien dangereux, ni un mot seul", () => {
    expect(BLOCK_SCHEMAS.Hero.safeParse({ ...HERO, buttonHref: "#commande" }).success).toBe(true);
    expect(parse({ facebook: "javascript:alert(1)" }).success).toBe(false);
    expect(parse({ facebook: "maboutique" }).success).toBe(false);
  });

  it.each(["0555-12-34-56", "0555.12.34.56", "(021) 23 45 67", "+213 555 12 34 56"])(
    "accepte le téléphone %s",
    (phone) => {
      expect(parse({ phone }).success).toBe(true);
    },
  );

  it("refuse un téléphone sans chiffres suffisants", () => {
    expect(parse({ phone: "abc" }).success).toBe(false);
    expect(parse({ phone: "--" }).success).toBe(false);
  });
});

describe("Hero — texte alternatif de l'image", () => {
  it("accepte un texte alternatif et garde la compatibilité des anciens contenus", () => {
    const withAlt = BLOCK_SCHEMAS.Hero.safeParse({ ...HERO, imageAlt: "Chaussure noire en cuir" });
    expect(withAlt.success && withAlt.data.imageAlt).toBe("Chaussure noire en cuir");
    const old = BLOCK_SCHEMAS.Hero.safeParse(HERO);
    expect(old.success && old.data.imageAlt).toBe("");
  });

  it("refuse un texte alternatif de plus de 150 caractères", () => {
    expect(BLOCK_SCHEMAS.Hero.safeParse({ ...HERO, imageAlt: "a".repeat(151) }).success).toBe(false);
  });
});
