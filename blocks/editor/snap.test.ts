import { snapWidth } from "@/blocks/editor/snap";

it("arrondit au palier de 10 % entre 30 et 100", () => {
  expect(snapWidth(700, 1000)).toBe(70);
  expect(snapWidth(651, 1000)).toBe(70);
  expect(snapWidth(649, 1000)).toBe(60);
  expect(snapWidth(100, 1000)).toBe(30);
  expect(snapWidth(-50, 1000)).toBe(30);
  expect(snapWidth(1500, 1000)).toBe(100);
});

it("section de largeur nulle : pleine largeur", () => {
  expect(snapWidth(500, 0)).toBe(100);
  expect(snapWidth(Number.NaN, 1000)).toBe(100);
});
