import { insertionIndex, listSections } from "./sections";

describe("insertionIndex", () => {
  it("après la section choisie, sinon à la fin", () => {
    expect(insertionIndex(null, 3)).toBe(3);
    expect(insertionIndex(0, 3)).toBe(1);
    expect(insertionIndex(2, 3)).toBe(3);
  });

  it("une sélection hors de la page compte comme aucune", () => {
    expect(insertionIndex(7, 3)).toBe(3);
    expect(insertionIndex(-1, 3)).toBe(3);
  });
});

describe("listSections", () => {
  it("garde l'ordre de la page et nomme chaque section en clair", () => {
    const sections = listSections([
      { type: "Hero", props: { id: "a" } },
      { type: "OrderForm", props: { id: "b" } },
      { type: "Ancien", props: { id: "c" } },
    ]);
    expect(sections).toEqual([
      { id: "a", type: "Hero", label: "Bannière", index: 0 },
      { id: "b", type: "OrderForm", label: "Formulaire de commande", index: 1 },
      { id: "c", type: "Ancien", label: "Ancien", index: 2 },
    ]);
  });
});
