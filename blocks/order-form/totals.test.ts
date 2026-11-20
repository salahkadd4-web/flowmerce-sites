import { computeTotals, MAX_QUANTITY, stepQuantity } from "@/blocks/order-form/totals";

it("le compteur reste entre 1 et 10", () => {
  expect(stepQuantity(1, -1)).toBe(1);
  expect(stepQuantity(1, 1)).toBe(2);
  expect(stepQuantity(MAX_QUANTITY, 1)).toBe(MAX_QUANTITY);
  expect(stepQuantity(MAX_QUANTITY, -1)).toBe(MAX_QUANTITY - 1);
});

it("calcule sous-total et total", () => {
  expect(computeTotals({ unitPrice: 2500, quantity: 2, shippingFee: 400 })).toEqual({ subtotal: 5000, total: 5400 });
  expect(computeTotals({ unitPrice: 1200, quantity: 1, shippingFee: 0 })).toEqual({ subtotal: 1200, total: 1200 });
});
