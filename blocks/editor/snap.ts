// Largeur d'une image tirée à la poignée : en % de sa section, par paliers de 10,
// de 30 à 100 (mêmes bornes que imageWidthSchema, blocks/style.ts).

const MIN = 30;
const MAX = 100;
const STEP = 10;

export function snapWidth(boxPx: number, parentPx: number): number {
  if (!(parentPx > 0) || !Number.isFinite(boxPx)) return MAX;
  const percent = Math.round((boxPx / parentPx) * (100 / STEP)) * STEP;
  return Math.min(MAX, Math.max(MIN, percent));
}

export const WIDTH_STEP = STEP;
export const WIDTH_MIN = MIN;
export const WIDTH_MAX = MAX;
