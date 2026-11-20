import { Render } from "@puckeditor/core/rsc";
import type { Data } from "@puckeditor/core";
import { renderToStaticMarkup } from "react-dom/server";
import { heroConfig } from "@/blocks/hero/config";
import { puckConfig } from "@/blocks/puck.config";
import { PUBLIC_FIELD_TRANSFORMS } from "@/blocks/render-transforms";
import { BLOCK_SCHEMAS } from "@/blocks/schemas";

const hero = BLOCK_SCHEMAS.Hero.parse({ id: "h1", ...heroConfig.defaultProps, title: "<p>Prix <s>3900</s> <strong>2900</strong></p>" });
const data = { root: { props: {} }, content: [{ type: "Hero", props: hero }] } as unknown as Data;

it("sans transformation, Puck insère son propre rendu du texte mis en forme", () => {
  expect(renderToStaticMarkup(<Render config={puckConfig} data={data} />)).toContain("rich-text");
});

it("le site public lit le texte mis en forme par notre lecteur, sans HTML injecté par Puck", () => {
  const html = renderToStaticMarkup(<Render config={puckConfig} data={data} fieldTransforms={PUBLIC_FIELD_TRANSFORMS} />);
  expect(html).not.toContain("rich-text");
  expect(html).toMatch(/<h1[^>]*>Prix <s>3900<\/s> <strong>2900<\/strong><\/h1>/);
});

it("une bannière d'un ancien contenu sans réglages de style s'affiche quand même", () => {
  const { style: _s, typography: _t, button: _b, imageWidth: _w, ...old } = hero;
  const stale = { root: { props: {} }, content: [{ type: "Hero", props: old }] } as unknown as Data;
  expect(renderToStaticMarkup(<Render config={puckConfig} data={stale} fieldTransforms={PUBLIC_FIELD_TRANSFORMS} />)).toContain("<h1");
});
