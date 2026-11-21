import { isSafeHref, mediaSchema } from "@/blocks/shared";

describe("isSafeHref", () => {
  it.each([
    "#commande",
    "https://wa.me/213555000000",
    "http://exemple.dz/page",
    "tel:+213 555 00 00 00",
    "mailto:contact@boutique.dz",
    "  https://exemple.dz  ",
  ])("accepte %s", (href) => {
    expect(isSafeHref(href)).toBe(true);
  });

  it.each([
    "javascript:alert(1)",
    "  JavaScript:alert(1)",
    "java\tscript:alert(1)",
    "data:text/html,<script>x</script>",
    "vbscript:x",
    "//evil.com",
    "#",
    "#a b",
    "https://",
    "tel:abc",
    "mailto:pas-un-email",
    "",
  ])("refuse %j", (href) => {
    expect(isSafeHref(href)).toBe(false);
  });
});

describe("mediaSchema", () => {
  const ok = (url: string) => mediaSchema.safeParse({ url, width: 100, height: 100 }).success;

  it("accepte une image envoyée par le vendeur et une photo d'un modèle", () => {
    expect(ok(`/media/${"a".repeat(32)}.png`)).toBe(true);
    expect(ok("/templates/mode/banniere.webp")).toBe(true);
    expect(ok("/templates/maison-cuisine/table-2.jpg")).toBe(true);
  });

  it("refuse tout autre chemin", () => {
    expect(ok("/templates/../media/x.webp")).toBe(false);
    expect(ok("/templates/Mode/x.webp")).toBe(false);
    expect(ok("/templates/mode/x.svg")).toBe(false);
    expect(ok("/templates/mode/sous/x.webp")).toBe(false);
    expect(ok("https://images.unsplash.com/photo.webp")).toBe(false);
    expect(ok("/media/x.png")).toBe(false);
  });
});
