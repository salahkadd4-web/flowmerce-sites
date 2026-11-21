import { resizeButton, resizeImage, resizeSection, stepValue } from "./resize";

describe("resizeImage", () => {
  const start = { width: 100, height: null, naturalRatio: 0.75 };
  const box = { parentWidth: 400, frameWidth: 400 };

  it("bords des côtés : la largeur suit, l'image reste centrée (les deux côtés bougent)", () => {
    expect(resizeImage(start, "e", -100, 0, box)).toEqual({ width: 50, height: null });
    expect(resizeImage(start, "w", 100, 0, box)).toEqual({ width: 50, height: null });
    expect(resizeImage(start, "e", -1000, 0, box).width).toBe(30);
    expect(resizeImage({ ...start, width: 50 }, "e", 1000, 0, { parentWidth: 400, frameWidth: 200 }).width).toBe(100);
  });

  it("bords du haut et du bas : le cadre change de hauteur, en partant des proportions naturelles", () => {
    expect(resizeImage(start, "s", 0, 60, box)).toEqual({ width: 100, height: 90 });
    expect(resizeImage(start, "n", 0, 60, box)).toEqual({ width: 100, height: 60 });
    expect(resizeImage({ ...start, height: 50 }, "s", 0, 20, box)).toEqual({ width: 100, height: 55 });
    expect(resizeImage(start, "s", 0, 5000, box).height).toBe(200);
    expect(resizeImage(start, "n", 0, 5000, box).height).toBe(30);
  });

  it("coins : la largeur change, les proportions restent", () => {
    expect(resizeImage(start, "se", -100, 300, box)).toEqual({ width: 50, height: null });
    expect(resizeImage({ ...start, height: 120 }, "nw", 100, -80, box)).toEqual({ width: 50, height: 120 });
  });

  it("arrondit au pas de 5", () => {
    expect(resizeImage(start, "e", -7, 0, box).width).toBe(95);
  });
});

describe("resizeButton", () => {
  const box = { contentWidth: 300, buttonWidth: 150, centered: true };

  it("côtés : largeur en % du contenu, par pas de 10 ; trop étroit, retour à « automatique »", () => {
    expect(resizeButton({ width: "auto", size: "m" }, "e", 30, 0, box)).toEqual({ width: 70, size: "m" });
    expect(resizeButton({ width: "auto", size: "m" }, "w", 30, 0, box)).toEqual({ width: 30, size: "m" });
    expect(resizeButton({ width: 50, size: "m" }, "e", -100, 0, box).width).toBe("auto");
    expect(resizeButton({ width: 50, size: "m" }, "e", 1000, 0, box).width).toBe(100);
  });

  it("un bouton aligné au début ne grandit que d'un côté", () => {
    expect(resizeButton({ width: "auto", size: "m" }, "e", 30, 0, { ...box, centered: false })).toEqual({ width: 60, size: "m" });
  });

  it("haut et bas : la hauteur passe par les tailles du bouton", () => {
    expect(resizeButton({ width: "auto", size: "m" }, "s", 0, 32, box).size).toBe("l");
    expect(resizeButton({ width: "auto", size: "m" }, "n", 0, 20, box).size).toBe("s");
    expect(resizeButton({ width: "auto", size: "s" }, "n", 0, 200, box).size).toBe("s");
  });

  it("coins : les deux", () => {
    expect(resizeButton({ width: "auto", size: "m" }, "se", 30, 32, box)).toEqual({ width: 70, size: "l" });
  });
});

describe("resizeSection", () => {
  const box = { viewportHeight: 800, sectionHeight: 400 };

  it("bord du bas : hauteur en % de l'écran, par pas de 10 ; trop basse, retour à « selon le contenu »", () => {
    expect(resizeSection({ minHeight: 0, width: "normal" }, "s", 0, 240, box)).toEqual({ minHeight: 80, width: "normal" });
    expect(resizeSection({ minHeight: 50, width: "normal" }, "s", 0, -300, box).minHeight).toBe(0);
    expect(resizeSection({ minHeight: 0, width: "normal" }, "s", 0, 5000, box).minHeight).toBe(100);
  });

  it("côtés : la largeur du contenu passe par Étroite, Normale, Large", () => {
    expect(resizeSection({ minHeight: 0, width: "normal" }, "e", 90, 0, box).width).toBe("wide");
    expect(resizeSection({ minHeight: 0, width: "normal" }, "w", -90, 0, box).width).toBe("wide");
    expect(resizeSection({ minHeight: 0, width: "normal" }, "e", -90, 0, box).width).toBe("narrow");
    expect(resizeSection({ minHeight: 0, width: "wide" }, "e", 500, 0, box).width).toBe("wide");
  });
});

describe("stepValue (flèches du clavier sur une poignée)", () => {
  it("un pas à la fois, dans les bornes", () => {
    expect(stepValue("imageWidth", 100, 1)).toBe(100);
    expect(stepValue("imageWidth", 100, -1)).toBe(95);
    expect(stepValue("imageHeight", null, 1)).toBe(105);
    expect(stepValue("imageHeight", 30, -1)).toBe(30);
    expect(stepValue("buttonWidth", "auto", 1)).toBe(50);
    expect(stepValue("buttonWidth", 20, -1)).toBe("auto");
    expect(stepValue("sectionHeight", 0, 1)).toBe(20);
    expect(stepValue("sectionHeight", 20, -1)).toBe(0);
  });
});
