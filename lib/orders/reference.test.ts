import { isOrderReference, newOrderReference } from "@/lib/orders/reference";

it("produit une référence XXXX-XXXX sans caractère ambigu", () => {
  for (let i = 0; i < 1000; i++) {
    const reference = newOrderReference();
    expect(reference).toMatch(/^[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/);
    expect(isOrderReference(reference)).toBe(true);
  }
});

it("reconnaît une référence valide et rien d'autre", () => {
  expect(isOrderReference("K7Q4-M2XP")).toBe(true);
  expect(isOrderReference("K7Q4-M2X0")).toBe(false);
  expect(isOrderReference("<script>")).toBe(false);
  expect(isOrderReference("")).toBe(false);
});
