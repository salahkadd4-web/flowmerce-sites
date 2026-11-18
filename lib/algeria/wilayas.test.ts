import { communesOf, isCommuneOf, WILAYAS, wilayaName } from "@/lib/algeria/wilayas";

it("contient les 69 wilayas, codes 1 à 69", () => {
  expect(WILAYAS).toHaveLength(69);
  expect(WILAYAS.map((w) => w.code)).toEqual(Array.from({ length: 69 }, (_, i) => i + 1));
});

it("donne le nom français d'une wilaya, ou null", () => {
  expect(wilayaName(16)).toBe("Alger");
  expect(wilayaName(69)).toBe("El Abiodh Sidi Cheikh");
  expect(wilayaName(70)).toBeNull();
  expect(wilayaName(0)).toBeNull();
});

it("porte aussi le nom arabe", () => {
  expect(WILAYAS[0]).toEqual({ code: 1, fr: "Adrar", ar: "أدرار" });
});

it("liste les communes d'une wilaya", () => {
  expect(communesOf(1)).toContain("Adrar");
  expect(communesOf(1)).toContain("Reggane");
  expect(communesOf(70)).toEqual([]);
  expect(WILAYAS.reduce((n, w) => n + communesOf(w.code).length, 0)).toBe(1577);
});

it("vérifie qu'une commune appartient à sa wilaya (listes FR et AR)", () => {
  expect(isCommuneOf(1, " Reggane ")).toBe(true);
  expect(isCommuneOf(1, "أدرار")).toBe(true);
  expect(isCommuneOf(16, "Reggane")).toBe(false);
  expect(isCommuneOf(1, "")).toBe(false);
});
