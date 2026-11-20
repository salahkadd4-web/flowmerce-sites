import { renderToStaticMarkup } from "react-dom/server";
import { ImageBox } from "@/blocks/image-box";
import { Section } from "@/blocks/Section";
import {
  buttonProps,
  buttonStyleSchema,
  colorOrAutoSchema,
  colorProps,
  hexColorSchema,
  imageWidthSchema,
  isDarkColor,
  PALETTE,
  sectionStyleSchema,
  sectionTone,
  typographySchema,
  type Tone,
} from "@/blocks/style";

const MEDIA = { url: "/media/" + "a".repeat(32) + ".png", width: 800, height: 600 };
const DEFAULTS = { tone: "light" as Tone, className: "bg-white", padding: "py-10", width: "max-w-3xl" };

it("refuse une couleur qui n'est pas #rrggbb", () => {
  for (const bad of ["red", "#fff", "#ff00001", "url(x)", "#ff0000;x"]) expect(hexColorSchema.safeParse(bad).success).toBe(false);
  expect(colorOrAutoSchema.parse("#FF0000")).toBe("#FF0000");
  expect(colorOrAutoSchema.parse("auto")).toBe("auto");
});

it("borne l'assombrissement à 0–80 par paliers de 10", () => {
  expect(sectionStyleSchema.safeParse({ overlay: 85 }).success).toBe(false);
  expect(sectionStyleSchema.safeParse({ overlay: 45 }).success).toBe(false);
  expect(sectionStyleSchema.parse(undefined)).toEqual({
    background: "default",
    backgroundColor: "#ffffff",
    backgroundImage: null,
    overlay: 40,
    spacing: "normal",
    width: "normal",
  });
  expect(typographySchema.parse(undefined)).toEqual({ titleSize: "m", titleColor: "auto", textSize: "m", textColor: "auto" });
});

it("propose 8 couleurs valides", () => {
  expect(PALETTE).toHaveLength(8);
  for (const { hex } of PALETTE) expect(hexColorSchema.safeParse(hex).success).toBe(true);
});

it("choisit un texte clair sur fond sombre", () => {
  expect(isDarkColor("#16265c")).toBe(true);
  expect(isDarkColor("#faf6f0")).toBe(false);
  expect(isDarkColor("#ffffff")).toBe(false);
  expect(sectionTone(sectionStyleSchema.parse({ background: "color", backgroundColor: "#4f46e5" }), "light")).toBe("dark");
  expect(sectionTone(sectionStyleSchema.parse({ background: "image", backgroundImage: MEDIA, overlay: 40 }), "light")).toBe("dark");
  expect(sectionTone(sectionStyleSchema.parse({ background: "image", backgroundImage: MEDIA, overlay: 30 }), "dark")).toBe("light");
});

it("fond image sans image : fond par défaut, aucune image", () => {
  const html = renderToStaticMarkup(
    <Section style={sectionStyleSchema.parse({ background: "image" })} defaults={DEFAULTS}>
      x
    </Section>,
  );
  expect(html).not.toContain("<img");
  expect(html).toContain("bg-white");
  expect(sectionTone(sectionStyleSchema.parse({ background: "image" }), "dark")).toBe("dark");
});

it("dessine l'image de fond et son assombrissement", () => {
  const html = renderToStaticMarkup(
    <Section style={sectionStyleSchema.parse({ background: "image", backgroundImage: MEDIA, overlay: 60 })} defaults={DEFAULTS}>
      x
    </Section>,
  );
  expect(html).toContain(MEDIA.url);
  expect(html).toContain("opacity:0.6");
});

it("fond coloré : la couleur choisie remplace le fond par défaut", () => {
  const html = renderToStaticMarkup(
    <Section style={sectionStyleSchema.parse({ background: "color", backgroundColor: "#faf6f0" })} defaults={DEFAULTS}>
      x
    </Section>,
  );
  expect(html).toContain("background-color:#faf6f0");
  expect(html).not.toContain("bg-white");
});

it("espacement et largeur : listes fermées", () => {
  const html = renderToStaticMarkup(
    <Section style={sectionStyleSchema.parse({ spacing: "airy", width: "wide" })} defaults={DEFAULTS}>
      x
    </Section>,
  );
  expect(html).toContain("py-16");
  expect(html).toContain("max-w-5xl");
});

it("couleur personnalisée : appliquée en style, auto : en classe", () => {
  expect(colorProps("#ff0000", "text-ink")).toEqual({ className: "", style: { color: "#ff0000" } });
  expect(colorProps("auto", "text-ink")).toEqual({ className: "text-ink" });
  expect(buttonProps(buttonStyleSchema.parse({}), "dark").className).toContain("bg-white");
  expect(buttonProps(buttonStyleSchema.parse({}), "light").className).toContain("bg-brand");
  expect(buttonProps(buttonStyleSchema.parse({ color: "#16265c" }), "light")).toMatchObject({ style: { backgroundColor: "#16265c" } });
  expect(buttonProps(buttonStyleSchema.parse({ color: "#16265c" }), "light").className).toContain("text-white");
  expect(buttonProps(buttonStyleSchema.parse({ color: "#faf6f0" }), "dark").className).toContain("text-ink");
});

it("la largeur d'image s'écrit en pourcentage", () => {
  expect(renderToStaticMarkup(<ImageBox width={70}>i</ImageBox>)).toContain("max-width:70%");
  expect(imageWidthSchema.safeParse(25).success).toBe(false);
  expect(imageWidthSchema.safeParse(75).success).toBe(false);
  expect(imageWidthSchema.parse(undefined)).toBe(100);
});
