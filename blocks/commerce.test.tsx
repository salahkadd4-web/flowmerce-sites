import { renderToStaticMarkup } from "react-dom/server";
import { OrderForm } from "@/blocks/order-form/OrderForm";
import { OrderFormBlock } from "@/blocks/order-form/OrderFormBlock";
import { orderFormConfig } from "@/blocks/order-form/config";
import { ProductBlock } from "@/blocks/product/ProductBlock";
import { productConfig } from "@/blocks/product/config";
import { BLOCK_SCHEMAS } from "@/blocks/schemas";
import { formatDA } from "@/lib/money";
import type { PublicProduct } from "@/lib/product-input";
import type { ShippingOption } from "@/lib/shipping";

const PRODUCT: PublicProduct = {
  id: "p1",
  name: "Chaussure cuir",
  description: "Cuir véritable.\n\nCousue main.",
  price: 2500,
  comparePrice: 3000,
  images: [{ url: "/media/" + "a".repeat(32) + ".png", width: 800, height: 800 }],
  optionAxes: [{ name: "Taille", values: ["39", "40", "41"] }],
  variants: [
    { id: "v39", options: { Taille: "39" }, inStock: true },
    { id: "v40", options: { Taille: "40" }, inStock: true },
    { id: "v41", options: { Taille: "41" }, inStock: false },
  ],
};
const SOLD_OUT = { ...PRODUCT, variants: PRODUCT.variants.map((v) => ({ ...v, inStock: false })) };
const SHIPPING: ShippingOption[] = [
  { wilayaCode: 16, name: "Alger", home: 400, office: 250 },
  { wilayaCode: 31, name: "Oran", home: 600, office: null },
];
const text = (html: string) => html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");

it("formate les dinars", () => {
  expect(formatDA(2500)).toBe("2 500 DA");
  expect(formatDA(1250000)).toBe("1 250 000 DA");
  expect(formatDA(0)).toBe("0 DA");
});

describe("Fiche produit", () => {
  it("a des réglages par défaut valides", () => {
    expect(BLOCK_SCHEMAS.Product.safeParse({ id: "x", ...productConfig.defaultProps }).success).toBe(true);
  });

  it("affiche nom, prix, prix barré, économie et bouton vers le formulaire", () => {
    const html = renderToStaticMarkup(<ProductBlock product={PRODUCT} buttonLabel="Commander" />);
    expect(html).toContain("Chaussure cuir");
    expect(html).toContain(formatDA(2500));
    expect(html).toMatch(/<s[^>]*>[^<]*3 000 DA/);
    expect(text(html)).toContain("Économisez 500 DA");
    expect(html).toContain('href="#commande"');
    expect(html.match(/<p /g)?.length).toBeGreaterThanOrEqual(2);
  });

  it("annonce une rupture de stock totale", () => {
    expect(text(renderToStaticMarkup(<ProductBlock product={SOLD_OUT} buttonLabel="Commander" />))).toContain("Rupture de stock");
  });

  it("sans produit : rien sur le site, un message dans l'éditeur", () => {
    expect(renderToStaticMarkup(<ProductBlock product={null} buttonLabel="Commander" />)).toBe("");
    expect(renderToStaticMarkup(<ProductBlock product={null} buttonLabel="Commander" editing />)).toContain(
      "Choisissez le produit de la page dans les réglages de la page",
    );
  });
});

describe("Formulaire de commande", () => {
  it("a des réglages par défaut valides", () => {
    expect(BLOCK_SCHEMAS.OrderForm.safeParse({ id: "x", ...orderFormConfig.defaultProps }).success).toBe(true);
  });

  it("porte l'ancre #commande visée par les boutons", () => {
    const html = renderToStaticMarkup(<OrderFormBlock product={PRODUCT} shipping={SHIPPING} title="Commander" submitLabel="Confirmer" />);
    expect(html).toContain('id="commande"');
  });

  it("sans frais de livraison : un message au vendeur dans l'éditeur, rien en public", () => {
    const props = { product: PRODUCT, shipping: [], title: "Commander", submitLabel: "Confirmer" };
    expect(renderToStaticMarkup(<OrderFormBlock {...props} />)).toBe("");
    expect(renderToStaticMarkup(<OrderFormBlock {...props} editing />)).toContain("frais de livraison");
  });

  it("sans produit : un message au vendeur dans l'éditeur, rien en public", () => {
    const props = { product: null, shipping: SHIPPING, title: "Commander", submitLabel: "Confirmer" };
    expect(renderToStaticMarkup(<OrderFormBlock {...props} />)).toBe("");
    expect(renderToStaticMarkup(<OrderFormBlock {...props} editing />)).toContain("produit de la page");
  });

  it("propose les champs de la commande COD", () => {
    const html = renderToStaticMarkup(<OrderForm product={PRODUCT} shipping={SHIPPING} title="Commander" submitLabel="Confirmer la commande" />);
    for (const name of ["customerName", "phone", "wilayaCode", "commune", "address", "quantity"]) {
      expect(html).toContain(`name="${name}"`);
    }
    expect(html).toMatch(/autoComplete="name"|autocomplete="name"/i);
    expect(html).toMatch(/inputMode="tel"|inputmode="tel"/i);
    expect(html).toContain(">Alger<");
    expect(html).toContain(">Oran<");
    expect(html).toContain("Confirmer la commande");
  });

  it("propose les tailles et marque celles épuisées", () => {
    const html = renderToStaticMarkup(<OrderForm product={PRODUCT} shipping={SHIPPING} title="" submitLabel="Confirmer" />);
    expect(html).toMatch(/<option[^>]*value="39"[^>]*>39<\/option>/);
    expect(html).toMatch(/<option[^>]*disabled=""[^>]*value="41"|<option[^>]*value="41"[^>]*disabled=""/);
  });

  it("cache un champ piège aux humains", () => {
    const html = renderToStaticMarkup(<OrderForm product={PRODUCT} shipping={SHIPPING} title="" submitLabel="Confirmer" />);
    expect(html).toMatch(/<input[^>]*name="website"[^>]*tabindex="-1"|<input[^>]*tabindex="-1"[^>]*name="website"/i);
  });

  it("annonce la rupture au lieu du formulaire", () => {
    const html = renderToStaticMarkup(<OrderForm product={SOLD_OUT} shipping={SHIPPING} title="" submitLabel="Confirmer" />);
    expect(text(html)).toContain("Rupture de stock");
    expect(html).not.toContain('name="customerName"');
  });
});
