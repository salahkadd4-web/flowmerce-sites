import { canTransition, ORDER_STATUS_LABELS, ordersToCsv, type OrderCsvRow } from "@/lib/orders/status";

describe("transitions de statut", () => {
  it.each([
    ["NEW", "CONFIRMED"],
    ["NEW", "CANCELLED"],
    ["CONFIRMED", "SHIPPED"],
    ["CONFIRMED", "CANCELLED"],
    ["SHIPPED", "DELIVERED"],
    ["SHIPPED", "RETURNED"],
    ["DELIVERED", "RETURNED"],
  ] as const)("autorise %s → %s", (from, to) => {
    expect(canTransition(from, to)).toBe(true);
  });

  it.each([
    ["NEW", "SHIPPED"],
    ["NEW", "DELIVERED"],
    ["DELIVERED", "CONFIRMED"],
    ["CANCELLED", "NEW"],
    ["RETURNED", "SHIPPED"],
    ["CONFIRMED", "CONFIRMED"],
  ] as const)("refuse %s → %s", (from, to) => {
    expect(canTransition(from, to)).toBe(false);
  });

  it("a un libellé français pour chaque statut", () => {
    expect(ORDER_STATUS_LABELS).toEqual({
      NEW: "Nouvelle",
      CONFIRMED: "Confirmée",
      SHIPPED: "Expédiée",
      DELIVERED: "Livrée",
      RETURNED: "Retournée",
      CANCELLED: "Annulée",
    });
  });
});

describe("export CSV", () => {
  const row: OrderCsvRow = {
    createdAt: new Date("2026-11-18T10:30:00Z"),
    reference: "K7Q4-M2XP",
    siteName: "Boutique",
    customerName: "Amina Benali",
    phone: "+213555123456",
    wilaya: "Alger",
    commune: "Bab El Oued",
    address: "8 rue Larbi Ben M'hidi",
    deliveryType: "HOME",
    items: "Chaussure cuir (Taille 40) × 2",
    subtotal: 5000,
    shippingFee: 400,
    total: 5400,
    status: "NEW",
  };

  it("commence par le BOM UTF-8 et un en-tête français, séparateur point-virgule", () => {
    const csv = ordersToCsv([row]);
    expect(csv.startsWith("﻿")).toBe(true);
    const [header, line] = csv.slice(1).split("\r\n");
    expect(header.split(";")[0]).toBe("Date");
    expect(header).toContain("Référence");
    expect(line).toContain("K7Q4-M2XP");
    expect(line).toContain("Nouvelle");
    expect(line).toContain("À domicile");
  });

  it("neutralise les formules (injection dans Excel)", () => {
    const csv = ordersToCsv([{ ...row, customerName: '=HYPERLINK("http://evil","clic")', address: "+33 rue", commune: "-1", items: "@SUM(A1)" }]);
    expect(csv).toContain(`"'=HYPERLINK(""http://evil"",""clic"")"`);
    expect(csv).toContain("'+33 rue");
    expect(csv).toContain("'-1");
    expect(csv).toContain("'@SUM(A1)");
  });

  it("met entre guillemets les cellules qui contiennent ; \" ou un saut de ligne", () => {
    const csv = ordersToCsv([{ ...row, address: 'Cité "les pins"; bloc 3\nétage 2' }]);
    expect(csv).toContain('"Cité ""les pins""; bloc 3\nétage 2"');
  });
});
