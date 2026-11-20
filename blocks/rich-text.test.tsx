import { renderToStaticMarkup } from "react-dom/server";
import { hasText, RichText, richTextSchema, sanitizeRichText } from "@/blocks/rich-text";

it("garde gras, italique, souligné, barré", () => {
  expect(sanitizeRichText("<p><strong>a</strong> <em>b</em> <u>c</u> <s>d</s></p>")).toBe(
    "<p><strong>a</strong> <em>b</em> <u>c</u> <s>d</s></p>",
  );
  expect(sanitizeRichText("<p><b>a</b><i>b</i><del>c</del><strike>d</strike></p>")).toBe(
    "<p><strong>a</strong><em>b</em><s>c</s><s>d</s></p>",
  );
});

it("retire scripts, attributs et liens en gardant le texte collé", () => {
  const out = sanitizeRichText(
    '<div><p onclick="x()" style="color:red">Promo <a href="javascript:alert(1)">ici</a><script>alert(1)</script><span style="font-weight:700">!</span></p></div>',
  );
  expect(out).toBe("<p>Promo ici!</p>");
});

it("retire les commentaires et les styles collés depuis Word", () => {
  const out = sanitizeRichText('<!--[if gte mso 9]>x<![endif]--><style>p{color:red}</style><p class="MsoNormal"><font face="Arial">Bonjour</font></p>');
  expect(out).toBe("<p>Bonjour</p>");
});

it("lit un ancien texte simple comme des paragraphes", () => {
  expect(sanitizeRichText("Un\nDeux\n\nTrois <3")).toBe("<p>Un<br>Deux</p><p>Trois &lt;3</p>");
  expect(sanitizeRichText("")).toBe("");
});

it("échappe un < isolé au milieu d'un texte mis en forme", () => {
  expect(sanitizeRichText("<p>a < b <strong>c</strong></p>")).toBe("<p>a &lt; b <strong>c</strong></p>");
});

it("affiche sans injecter de HTML", () => {
  const html = renderToStaticMarkup(<RichText value={"<p>a <strong>b</strong></p><p><img src=x onerror=alert(1)>c</p>"} />);
  expect(html).toBe('<p dir="auto">a <strong>b</strong></p><p dir="auto">c</p>');
});

it("décode les entités sans les réinterpréter", () => {
  const html = renderToStaticMarkup(<RichText value={"<p>&lt;script&gt; &amp; &#233;</p>"} />);
  expect(html).toBe('<p dir="auto">&lt;script&gt; &amp; é</p>');
});

it("en ligne : paragraphes joints par un retour", () => {
  expect(renderToStaticMarkup(<h1><RichText value="<p>a</p><p>b</p>" inline /></h1>)).toBe("<h1>a<br/>b</h1>");
});

it("rend telle quelle la valeur d'édition de Puck", () => {
  expect(renderToStaticMarkup(<RichText value={<span>édition</span>} />)).toBe("<span>édition</span>");
});

it("compte la longueur visible, pas les balises", () => {
  expect(richTextSchema(5).safeParse("<p><strong>abcde</strong></p>").success).toBe(true);
  expect(richTextSchema(5).safeParse("<p>abcdef</p>").success).toBe(false);
  expect(richTextSchema(5).parse("<p onclick='x'>ok</p>")).toBe("<p>ok</p>");
  expect(hasText("<p> </p>")).toBe(false);
  expect(hasText("")).toBe(false);
  expect(hasText("<p>x</p>")).toBe(true);
  expect(hasText(<span />)).toBe(true);
});
