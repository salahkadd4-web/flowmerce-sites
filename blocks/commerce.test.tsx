import { renderToStaticMarkup } from "react-dom/server";
import { OrderForm } from "@/blocks/order-form/OrderForm";
import { OrderFormBlock } from "@/blocks/order-form/OrderFormBlock";
import { orderFormConfig } from "@/blocks/order-form/config";
import { ProductBlock } from "@/blocks/product/ProductBlock";
import { productConfig } from "@/blocks/product/config";
import { BLOCK_SCHEMAS } from "@/blocks/schemas";
import { BUYER_TEXT, fill } from "@/blocks/i18n";
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
  { wilayaCode: 16, name: "Alger", nameAr: "الجزائر", home: 400, office: 250 },
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

describe("Fiche produit — galerie et réglages", () => {
  const productDefaults = { ...productConfig.defaultProps! };
  const images = Array.from({ length: 8 }, (_, i) => ({ url: `/media/${String(i).repeat(32)}.png`, width: 800, height: 800 }));

  it("affiche au plus 6 photos et des miniatures vers chacune", () => {
    const html = renderToStaticMarkup(<ProductBlock {...productDefaults} blockId="Product-1" lang="fr" product={{ ...PRODUCT, images }} />);
    expect(html.match(/id="photo-Product-1-/g)).toHaveLength(6);
    expect(html).toContain('href="#photo-Product-1-2"');
    expect(html).not.toContain("photo-Product-1-7");
  });

  it("une seule photo : pas de miniatures", () => {
    const html = renderToStaticMarkup(<ProductBlock {...productDefaults} blockId="p" lang="fr" product={PRODUCT} />);
    expect(html).not.toContain('href="#photo-');
  });

  it("nettoie l'identifiant du bloc dans les ancres", () => {
    const html = renderToStaticMarkup(<ProductBlock {...productDefaults} blockId={'a"b<c'} lang="fr" product={{ ...PRODUCT, images }} />);
    expect(html).toContain('id="photo-abc-1"');
  });

  it("en arabe : textes de l'acheteur traduits", () => {
    const html = renderToStaticMarkup(<ProductBlock {...productDefaults} blockId="p" lang="ar" product={PRODUCT} />);
    expect(text(html)).toContain(text(fill(BUYER_TEXT.ar.save, { amount: formatDA(500) })));
    expect(text(html)).not.toContain("Économisez");
  });

  it("applique la largeur de la photo principale et la couleur du bouton", () => {
    const html = renderToStaticMarkup(
      <ProductBlock {...productDefaults} imageWidth={70} button={{ color: "#16265c", textColor: "auto", size: "l" }} blockId="p" lang="fr" product={PRODUCT} />,
    );
    expect(html).toContain("max-width:70%");
    expect(html).toContain("background-color:#16265c");
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
    for (const name of ["customerName", "phone", "wilayaCode", "commune", "address"]) {
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

  const FORM_PROPS = {
    product: PRODUCT,
    shipping: SHIPPING,
    title: "Commander",
    submitLabel: "Confirmer",
    lang: "fr" as const,
    titleClass: { className: "text-ink" },
    buttonClass: { className: "bg-brand" },
  };

  it("compteur − 1 + : moins grisé au départ, plus actif", () => {
    const html = renderToStaticMarkup(<OrderForm {...FORM_PROPS} />);
    expect(html).toMatch(/<button[^>]*aria-label="Diminuer la quantité"[^>]*disabled=""/);
    expect(html).not.toMatch(/<button[^>]*aria-label="Augmenter la quantité"[^>]*disabled=""/);
    expect(html).toContain('<output id="commande-quantity" aria-live="polite"');
    expect(html).toMatch(/<output[^>]*>1<\/output>/);
    expect(html).not.toContain('<select id="commande-quantity"');
  });

  it("en arabe : libellés et wilayas en arabe", () => {
    const html = renderToStaticMarkup(<OrderForm {...FORM_PROPS} lang="ar" />);
    expect(html).toContain(BUYER_TEXT.ar.fullName);
    expect(html).toContain(">الجزائر<");
    expect(html).not.toContain("Nom complet");
  });

  it("applique le style du bouton et du titre choisis", () => {
    const html = renderToStaticMarkup(
      <OrderForm {...FORM_PROPS} buttonClass={{ className: "x-btn", style: { backgroundColor: "#16265c" } }} titleClass={{ className: "", style: { color: "#ff0000" } }} />,
    );
    expect(html).toContain("background-color:#16265c");
    expect(html).toContain("color:#ff0000");
  });

  it("le bloc place le formulaire dans une section réglable", () => {
    const props = BLOCK_SCHEMAS.OrderForm.parse({ id: "f", ...orderFormConfig.defaultProps, style: { background: "color", backgroundColor: "#16265c" } });
    const html = renderToStaticMarkup(<OrderFormBlock {...props} product={PRODUCT} shipping={SHIPPING} />);
    expect(html).toContain('id="commande"');
    expect(html).toContain("background-color:#16265c");
  });

  it("annonce la rupture au lieu du formulaire", () => {
    const html = renderToStaticMarkup(<OrderForm product={SOLD_OUT} shipping={SHIPPING} title="" submitLabel="Confirmer" />);
    expect(text(html)).toContain("Rupture de stock");
    expect(html).not.toContain('name="customerName"');
  });
});
