import { renderToStaticMarkup } from "react-dom/server";
import { RenderPage } from "@/components/site/RenderPage";
import type { PageContent } from "@/lib/page-content";

const page = (content: PageContent["content"]): PageContent => ({ root: { props: {} }, content });

it("rend les blocs Heading et Text", () => {
  const html = renderToStaticMarkup(
    <RenderPage
      content={page([
        { type: "Heading", props: { id: "h1", text: "Bienvenue sur la boutique test" } },
        { type: "Text", props: { id: "t1", text: "Cette page est lue en base." } },
      ])}
    />,
  );
  expect(html).toContain("Bienvenue sur la boutique test</h1>");
  expect(html).toContain("Cette page est lue en base.</p>");
});

it("ignore un bloc de type inconnu", () => {
  const html = renderToStaticMarkup(<RenderPage content={page([{ type: "Inconnu", props: { text: "x-secret" } }])} />);
  expect(html).not.toContain("x-secret");
});

it("échappe le texte au lieu d'injecter du HTML", () => {
  const html = renderToStaticMarkup(
    <RenderPage content={page([{ type: "Text", props: { text: "<script>alert(1)</script>" } }])} />,
  );
  expect(html).toContain("&lt;script&gt;");
  expect(html).not.toContain("<script>");
});

it("ignore un texte qui n'est pas une chaîne", () => {
  const html = renderToStaticMarkup(<RenderPage content={page([{ type: "Heading", props: { text: 42 } }])} />);
  expect(html).not.toContain("<h1");
  expect(html).not.toContain("42");
});
