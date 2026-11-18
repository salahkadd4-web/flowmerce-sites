import { computeTotals } from "@/blocks/order-form/totals";

it("calcule sous-total et total", () => {
  expect(computeTotals({ unitPrice: 2500, quantity: 2, shippingFee: 400 })).toEqual({ subtotal: 5000, total: 5400 });
  expect(computeTotals({ unitPrice: 1200, quantity: 1, shippingFee: 0 })).toEqual({ subtotal: 1200, total: 1200 });
});
