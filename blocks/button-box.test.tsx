import { renderToStaticMarkup } from "react-dom/server";
import type { ReactNode } from "react";
import { Hero } from "@/blocks/hero/Hero";
import { heroConfig } from "@/blocks/hero/config";
import { OrderForm } from "@/blocks/order-form/OrderForm";
import { productAnchor, ProductBlock } from "@/blocks/product/ProductBlock";
import type { PublicProduct } from "@/lib/product-input";

const PRODUCT: PublicProduct = {
  id: "p1",
  name: "Chaussure cuir",
  description: "",
  price: 2500,
  comparePrice: null,
  images: [],
  optionAxes: [],
  variants: [{ id: "v", options: {}, inStock: true }],
};

// Boîte d'édition factice : marque le bouton qu'elle reçoit.
const marked = ({ children }: { children: ReactNode }) => <span data-boite="bouton">{children}</span>;

describe("renderButton (barre d'outils du bouton, éditeur seulement)", () => {
  it("sans boîte, la bannière rend son bouton comme avant", () => {
    const html = renderToStaticMarkup(<Hero {...heroConfig.defaultProps!} />);
    expect(html).toContain('href="#commande"');
    expect(html).not.toContain("data-boite");
  });

  it("la bannière passe son bouton à la boîte d'édition", () => {
    const html = renderToStaticMarkup(<Hero {...heroConfig.defaultProps!} renderButton={marked} />);
    expect(html).toMatch(/<span data-boite="bouton"><a href="#commande"/);
  });

  it("dans l'éditeur, un bouton sans lien reste visible (sinon plus moyen de le régler)", () => {
    const props = { ...heroConfig.defaultProps!, buttonHref: "" };
    expect(renderToStaticMarkup(<Hero {...props} />)).not.toContain("Commander maintenant");
    const html = renderToStaticMarkup(<Hero {...props} editing renderButton={marked} />);
    expect(html).toContain("Commander maintenant");
    expect(html).not.toContain('href=""');
  });

  it("la fiche produit passe son bouton à la boîte d'édition", () => {
    const html = renderToStaticMarkup(<ProductBlock product={PRODUCT} buttonLabel="Commander" renderButton={marked} />);
    expect(html).toMatch(/<span data-boite="bouton"><a href="#commande"/);
  });

  it("le formulaire passe son bouton d'envoi à la boîte d'édition", () => {
    const html = renderToStaticMarkup(<OrderForm product={PRODUCT} shipping={[]} title="Commander" submitLabel="Confirmer" renderButton={marked} />);
    expect(html).toMatch(/<span data-boite="bouton"><button type="submit"/);
  });

  it("la fiche produit porte une ancre, cible possible du bouton de la bannière", () => {
    const html = renderToStaticMarkup(<ProductBlock product={PRODUCT} buttonLabel="Commander" blockId="Product-1" />);
    expect(productAnchor("Product-1")).toBe("produit-Product-1");
    expect(html).toContain('id="produit-Product-1"');
  });
});
