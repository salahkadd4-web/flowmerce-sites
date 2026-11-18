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
  it("échappe le HTML et découpe les paragraphes sur les lignes vides", () => {
    const html = renderToStaticMarkup(<Text title="" body={"<script>x</script>\n\nDeux"} align="left" />);
    expect(html).toContain("&lt;script&gt;");
    expect(html).not.toContain("<script>");
    expect(html.match(/<p /g)).toHaveLength(2);
  });

  it("n'affiche rien sans titre ni texte", () => {
    expect(renderToStaticMarkup(<Text title="" body="  " align="left" />)).toBe("");
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
