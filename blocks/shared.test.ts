import { isSafeHref } from "@/blocks/shared";

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
