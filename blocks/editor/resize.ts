// Tailles au glissé des poignées (comme Google Slides), en valeurs proportionnelles :
// la même mise en page tient au téléphone comme à l'ordinateur.
// dx / dy : déplacement du pointeur depuis le début du geste, en pixels.

export type Handle = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const snap = (value: number, step: number) => Math.round(value / step) * step;

/** Côté horizontal tiré : +1 (droite), -1 (gauche), 0 (haut ou bas seulement). */
function horizontal(handle: Handle): 1 | -1 | 0 {
  return handle.endsWith("e") ? 1 : handle.endsWith("w") ? -1 : 0;
}

/** Côté vertical tiré : +1 (bas), -1 (haut), 0 (côtés seulement). */
function vertical(handle: Handle): 1 | -1 | 0 {
  return handle.startsWith("s") ? 1 : handle.startsWith("n") ? -1 : 0;
}

const isCorner = (handle: Handle) => handle.length === 2;

/**
 * Image : côtés et coins → largeur (en % de la section ; l'image est centrée, les deux
 * côtés bougent) ; haut et bas → hauteur du cadre (en % de la largeur). Un coin garde
 * les proportions.
 */
export function resizeImage(
  start: { width: number; height: number | null; naturalRatio: number },
  handle: Handle,
  dx: number,
  dy: number,
  box: { parentWidth: number; frameWidth: number },
): { width: number; height: number | null } {
  let { width, height } = start;
  const h = horizontal(handle);
  const v = vertical(handle);
  if (h !== 0) {
    const px = box.frameWidth + 2 * h * dx;
    width = clamp(snap((px / box.parentWidth) * 100, 5), 30, 100);
  }
  if (v !== 0 && !isCorner(handle)) {
    const frameHeight = (box.frameWidth * (height ?? start.naturalRatio * 100)) / 100;
    height = clamp(snap(((frameHeight + v * dy) / box.frameWidth) * 100, 5), 30, 200);
  }
  return { width, height };
}

const BUTTON_SIZES = ["s", "m", "l"] as const;
type ButtonSize = (typeof BUTTON_SIZES)[number];

/** Bouton : côtés → largeur en % du contenu (sous 20 % : automatique) ; haut et bas → taille S, M, L. */
export function resizeButton(
  start: { width: "auto" | number; size: ButtonSize },
  handle: Handle,
  dx: number,
  dy: number,
  box: { contentWidth: number; buttonWidth: number; centered: boolean },
): { width: "auto" | number; size: ButtonSize } {
  let { width, size } = start;
  const h = horizontal(handle);
  const v = vertical(handle);
  if (h !== 0) {
    const px = box.buttonWidth + (box.centered ? 2 : 1) * h * dx;
    const pct = snap((px / box.contentWidth) * 100, 10);
    width = pct < 20 ? "auto" : Math.min(100, pct);
  }
  if (v !== 0) {
    const steps = Math.round((v * dy) / 16);
    const index = clamp(BUTTON_SIZES.indexOf(size) + steps, 0, BUTTON_SIZES.length - 1);
    size = BUTTON_SIZES[index];
  }
  return { width, size };
}

const SECTION_WIDTHS = ["narrow", "normal", "wide"] as const;
type SectionWidth = (typeof SECTION_WIDTHS)[number];

/** Section : bas → hauteur en % de l'écran (sous 20 % : selon le contenu) ; côtés → largeur du contenu. */
export function resizeSection(
  start: { minHeight: number; width: SectionWidth },
  handle: Handle,
  dx: number,
  dy: number,
  box: { viewportHeight: number; sectionHeight: number },
): { minHeight: number; width: SectionWidth } {
  let { minHeight, width } = start;
  const h = horizontal(handle);
  if (vertical(handle) === 1) {
    const pct = snap(((box.sectionHeight + dy) / box.viewportHeight) * 100, 10);
    minHeight = pct < 20 ? 0 : Math.min(100, pct);
  }
  if (h !== 0) {
    const steps = Math.round((h * dx) / 80);
    width = SECTION_WIDTHS[clamp(SECTION_WIDTHS.indexOf(width) + steps, 0, SECTION_WIDTHS.length - 1)];
  }
  return { minHeight, width };
}

type StepKind = "imageWidth" | "imageHeight" | "buttonWidth" | "sectionHeight";

/** Un pas de clavier (flèches) sur une poignée. */
export function stepValue(kind: StepKind, value: number | "auto" | null, direction: 1 | -1): number | "auto" | null {
  switch (kind) {
    case "imageWidth":
      return clamp((value as number) + 5 * direction, 30, 100);
    case "imageHeight":
      return clamp(((value as number | null) ?? 100) + 5 * direction, 30, 200);
    case "buttonWidth": {
      if (value === "auto") return direction === 1 ? 50 : "auto";
      const next = (value as number) + 10 * direction;
      return next < 20 ? "auto" : Math.min(100, next);
    }
    case "sectionHeight": {
      const current = value as number;
      if (current === 0) return direction === 1 ? 20 : 0;
      const next = current + 10 * direction;
      return next < 20 ? 0 : Math.min(100, next);
    }
  }
}
