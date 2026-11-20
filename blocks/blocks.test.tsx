import { renderToStaticMarkup } from "react-dom/server";
import { footerConfig } from "@/blocks/footer/config";
import { Footer } from "@/blocks/footer/Footer";
import { heroConfig } from "@/blocks/hero/config";
import { Hero } from "@/blocks/hero/Hero";
import { imageConfig } from "@/blocks/image/config";
import { ImageBlock } from "@/blocks/image/ImageBlock";
import { BLOCK_SCHEMAS } from "@/blocks/schemas";
import { textConfig } from "@/blocks/text/config";
import { Text } from "@/blocks/text/Text";

// next/image est remplacé par une simple <img> dans les tests unitaires
// (alias dans vitest.config.mts, voir test/next-image-stub.tsx).

const MEDIA = { url: "/media/" + "a".repeat(32) + ".png", width: 800, height: 600 };

describe("réglages par défaut", () => {
  it.each([
    ["Hero", heroConfig.defaultProps],
    ["Text", textConfig.defaultProps],
    ["Image", imageConfig.defaultProps],
    ["Footer", footerConfig.defaultProps],
  ] as const)("les réglages par défaut du bloc %s sont valides", (type, defaults) => {
    expect(BLOCK_SCHEMAS[type].safeParse({ id: "x", ...defaults }).success).toBe(true);
  });

  it("chaque bloc s'affiche avec ses réglages par défaut", () => {
    expect(renderToStaticMarkup(<Hero {...heroConfig.defaultProps!} />)).toContain(heroConfig.defaultProps!.title);
    expect(renderToStaticMarkup(<Text {...textConfig.defaultProps!} />)).toContain(textConfig.defaultProps!.title);
    expect(renderToStaticMarkup(<Footer {...footerConfig.defaultProps!} />)).toContain(footerConfig.defaultProps!.shopName);
  });
});

describe("Hero", () => {
  it("n'affiche pas un bouton au lien javascript:", () => {
    const html = renderToStaticMarkup(
      <Hero {...heroConfig.defaultProps!} buttonLabel="Cliquez" buttonHref="javascript:alert(1)" />,
    );
    expect(html).not.toContain("javascript");
    expect(html).not.toContain("Cliquez");
  });

  it("affiche le bouton vers l'ancre de commande", () => {
    const html = renderToStaticMarkup(<Hero {...heroConfig.defaultProps!} buttonLabel="Commander" buttonHref="#commande" />);
    expect(html).toContain('href="#commande"');
  });

  it("affiche l'image choisie", () => {
    const html = renderToStaticMarkup(<Hero {...heroConfig.defaultProps!} image={MEDIA} />);
    expect(html).toContain("<img");
  });
});

describe("Text", () => {
  it("échappe un texte simple et le découpe sur les lignes vides", () => {
    const html = renderToStaticMarkup(<Text {...textConfig.defaultProps!} title="" body={"Un\n\nDeux <3"} />);
    expect(html).toContain("Deux &lt;3");
    expect(html.match(/<p /g)).toHaveLength(2);
  });

  it("n'affiche rien sans titre ni texte", () => {
    expect(renderToStaticMarkup(<Text {...textConfig.defaultProps!} title="" body="  " />)).toBe("");
  });
});

describe("Image", () => {
  it("n'affiche rien sur le site sans image choisie", () => {
    expect(renderToStaticMarkup(<ImageBlock {...imageConfig.defaultProps!} image={null} />)).toBe("");
  });

  it("montre un emplacement dans l'éditeur sans image choisie", () => {
    expect(renderToStaticMarkup(<ImageBlock {...imageConfig.defaultProps!} image={null} editing />)).toContain(
      "Choisissez une image",
    );
  });

  it("affiche l'image avec son texte alternatif", () => {
    const html = renderToStaticMarkup(<ImageBlock {...imageConfig.defaultProps!} image={MEDIA} alt="Chaussure noire" />);
    expect(html).toContain('alt="Chaussure noire"');
  });
});

describe("Footer", () => {
  it("n'affiche pas un réseau social au lien javascript:", () => {
    const html = renderToStaticMarkup(<Footer {...footerConfig.defaultProps!} facebook="javascript:x" />);
    expect(html).not.toContain("javascript");
    expect(html).not.toContain("Facebook");
  });

  it("construit les liens téléphone et email", () => {
    const html = renderToStaticMarkup(
      <Footer {...footerConfig.defaultProps!} phone="+213 555 00 00 00" email="contact@boutique.dz" />,
    );
    expect(html).toContain('href="tel:+213555000000"');
    expect(html).toContain('href="mailto:contact@boutique.dz"');
  });
});

describe("Footer — téléphone", () => {
  it("compose le lien tel: avec les seuls chiffres", () => {
    const html = renderToStaticMarkup(<Footer {...footerConfig.defaultProps!} phone="0555-12-34-56" />);
    expect(html).toContain('href="tel:0555123456"');
  });
});

describe("Footer — icônes", () => {
  const props = {
    ...footerConfig.defaultProps!,
    phone: "0555 12 34 56",
    email: "contact@boutique.dz",
    facebook: "https://facebook.com/maboutique",
    instagram: "https://instagram.com/maboutique",
    tiktok: "https://tiktok.com/@maboutique",
  };
  const html = renderToStaticMarkup(<Footer {...props} />);
  const link = (href: string) => html.match(new RegExp(`<a[^>]*href="${href.replace(/[.?+]/g, "\$&")}"[^>]*>(.*?)</a>`))?.[1] ?? "";

  it.each([
    ["tel:0555123456", "0555 12 34 56"],
    ["mailto:contact@boutique.dz", "contact@boutique.dz"],
    ["https://facebook.com/maboutique", "Facebook"],
    ["https://instagram.com/maboutique", "Instagram"],
    ["https://tiktok.com/@maboutique", "TikTok"],
  ])("le lien %s porte une icône décorative et garde son texte", (href, text) => {
    const content = link(href);
    expect(content).toMatch(/<svg[^>]*aria-hidden="true"/);
    expect(content).toContain(text);
  });

  it("garde le mot Téléphone / Email pour les lecteurs d'écran", () => {
    expect(link("tel:0555123456")).toMatch(/class="sr-only"[^>]*>Téléphone/);
    expect(link("mailto:contact@boutique.dz")).toMatch(/class="sr-only"[^>]*>Email/);
  });
});

describe("Texte et Image — réglages", () => {
  it("un ancien texte sans balises garde ses paragraphes", () => {
    const props = BLOCK_SCHEMAS.Text.parse({ id: "t", title: "Titre", body: "Un\n\nDeux", align: "left" });
    expect(renderToStaticMarkup(<Text {...props} />).match(/<p /g)).toHaveLength(2);
  });

  it("n'exécute pas de HTML collé dans le texte", () => {
    const props = BLOCK_SCHEMAS.Text.parse({ id: "t", title: "", body: "<script>x</script><p>ok</p>", align: "left" });
    const html = renderToStaticMarkup(<Text {...props} />);
    expect(html).not.toContain("<script");
    expect(html).toContain("ok");
  });

  it("fond coloré sombre : texte clair", () => {
    const props = BLOCK_SCHEMAS.Text.parse({
      id: "t",
      title: "T",
      body: "b",
      align: "left",
      style: { background: "color", backgroundColor: "#0f1a3d" },
    });
    expect(renderToStaticMarkup(<Text {...props} />)).toContain("text-white");
  });

  it("image : largeur en pourcentage et coins prononcés", () => {
    const props = BLOCK_SCHEMAS.Image.parse({
      id: "i",
      image: MEDIA,
      alt: "x",
      caption: "",
      width: "contained",
      imageWidth: 50,
      rounded: "strong",
    });
    const html = renderToStaticMarkup(<ImageBlock {...props} />);
    expect(html).toContain("max-width:50%");
    expect(html).toContain("rounded-3xl");
  });

  it("image pleine largeur : bord à bord, sans arrondi", () => {
    const props = BLOCK_SCHEMAS.Image.parse({ id: "i", image: MEDIA, alt: "x", caption: "", width: "full" });
    const html = renderToStaticMarkup(<ImageBlock {...props} />);
    expect(html).not.toContain("rounded-card");
    expect(html).not.toContain("px-4");
  });
});

describe("Hero — réglages", () => {
  const defaults = BLOCK_SCHEMAS.Hero.parse({ id: "h", ...heroConfig.defaultProps });

  it("une ancienne bannière « Sombre » garde son fond nuit et un texte clair", () => {
    const props = BLOCK_SCHEMAS.Hero.parse({
      id: "h",
      title: "T",
      subtitle: "",
      image: null,
      buttonLabel: "",
      buttonHref: "",
      align: "center",
      background: "dark",
    });
    expect(props.style).toMatchObject({ background: "color", backgroundColor: "#16265c" });
    expect(renderToStaticMarkup(<Hero {...props} />)).toContain("text-white");
  });

  it("une ancienne bannière « Claire » garde le fond par défaut", () => {
    const props = BLOCK_SCHEMAS.Hero.parse({ ...defaults, style: undefined, background: "light" });
    expect(props.style.background).toBe("default");
  });

  it("met en forme des mots du titre", () => {
    const html = renderToStaticMarkup(<Hero {...defaults} title="<p>Prix <s>3900</s> <strong>2900</strong></p>" />);
    expect(html).toContain("<s>3900</s>");
    expect(html).toContain("<strong>2900</strong>");
  });

  it("applique taille et couleur du titre et la largeur d'image", () => {
    const html = renderToStaticMarkup(
      <Hero {...defaults} image={MEDIA} imageWidth={60} typography={{ ...defaults.typography, titleSize: "xl", titleColor: "#ff0000" }} />,
    );
    expect(html).toContain("text-5xl");
    expect(html).toContain("color:#ff0000");
    expect(html).toContain("max-width:60%");
  });

  it("les réglages par défaut reproduisent l'ancienne bannière claire", () => {
    const html = renderToStaticMarkup(<Hero {...defaults} />);
    expect(html).toContain("bg-white");
    expect(html).toContain("bg-brand");
  });

  it("le panneau range les réglages en groupes Texte, Bouton, Style", () => {
    expect(heroConfig.fields?.typography).toMatchObject({ type: "object", label: "Texte" });
    expect(heroConfig.fields?.button).toMatchObject({ type: "object", label: "Bouton" });
    expect(heroConfig.fields?.style).toMatchObject({ type: "object", label: "Style" });
    expect(heroConfig.fields?.title).toMatchObject({ type: "richtext", contentEditable: true });
    expect(heroConfig.fields?.buttonLabel).toMatchObject({ type: "text", contentEditable: true });
  });
});

describe("Hero — image", () => {
  it("rend le texte alternatif de l'image", () => {
    const html = renderToStaticMarkup(<Hero {...heroConfig.defaultProps!} image={MEDIA} imageAlt="Chaussure noire en cuir" />);
    expect(html).toContain('alt="Chaussure noire en cuir"');
  });
});
