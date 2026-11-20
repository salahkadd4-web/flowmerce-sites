import { renderToStaticMarkup } from "react-dom/server";
import { fontFamily } from "@/blocks/fonts";
import { BUYER_TEXT, fill } from "@/blocks/i18n";
import { rootConfig } from "@/blocks/root/config";
import { PageRoot } from "@/blocks/root/PageRoot";

it("une page arabe s'écrit de droite à gauche", () => {
  const html = renderToStaticMarkup(
    <PageRoot lang="ar" headingFont="system" bodyFont="system">
      x
    </PageRoot>,
  );
  expect(html).toContain('dir="rtl"');
  expect(html).toContain('lang="ar"');
});

it("une page sans réglage reste en français, de gauche à droite", () => {
  const html = renderToStaticMarkup(<PageRoot>x</PageRoot>);
  expect(html).toContain('dir="ltr"');
  expect(html).toContain('lang="fr"');
});

it("applique les polices choisies", () => {
  const html = renderToStaticMarkup(
    <PageRoot lang="fr" headingFont="amiri" bodyFont="cairo">
      x
    </PageRoot>,
  );
  expect(fontFamily("cairo")).toMatch(/^'Cairo', system-ui/);
  expect(html).toContain("font-family:&#x27;Cairo&#x27;, system-ui");
  expect(html).toContain("--font-heading:&#x27;Amiri&#x27;, system-ui");
});

it("chaque langue a tous les textes de l'acheteur", () => {
  expect(Object.keys(BUYER_TEXT.ar).sort()).toEqual(Object.keys(BUYER_TEXT.fr).sort());
  expect(Object.keys(BUYER_TEXT.ar.errors).sort()).toEqual(Object.keys(BUYER_TEXT.fr.errors).sort());
  expect(fill(BUYER_TEXT.fr.save, { amount: "500 DA" })).toBe("Économisez 500 DA");
});

it("propose langue et polices dans les réglages de la page", () => {
  expect(rootConfig.fields?.lang).toMatchObject({ label: "Langue de la page" });
  expect(rootConfig.fields?.headingFont).toMatchObject({ label: "Police des titres" });
  expect(rootConfig.fields?.bodyFont).toMatchObject({ label: "Police du texte" });
});
