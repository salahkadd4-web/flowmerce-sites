// blocks/rich-text.tsx — texte mis en forme : gras, italique, souligné, barré.
//
// L'éditeur (champ « richtext » de Puck) produit du HTML. Il est nettoyé à
// l'enregistrement (sanitizeRichText : balises p, br, strong, em, u, s, sans
// attribut) puis relu au rendu par notre propre lecteur, qui construit des
// éléments React : aucun HTML n'est jamais injecté dans la page (§7).

import type { RichtextField } from "@puckeditor/core";
import { createElement, Fragment, type CSSProperties, type ReactNode } from "react";
import { z } from "zod";

const ALLOWED = new Set(["p", "br", "strong", "em", "u", "s"]);
const ALIASES: Record<string, string> = { b: "strong", i: "em", del: "s", strike: "s" };

const DROP_WITH_CONTENT = /<(script|style|template|iframe|object|noscript|title|head|textarea|select)\b[\s\S]*?<\/\1\s*>/gi;
const COMMENT = /<!--[\s\S]*?-->/g;
const DECLARATION = /<![^>]*>|<\?[\s\S]*?\?>/g;
// Une balise, attributs entre guillemets compris (un « > » dans un attribut ne la coupe pas).
const TAG = /<\/?([a-zA-Z][a-zA-Z0-9-]*)(?:\s(?:[^<>"']|"[^"]*"|'[^']*')*)?\/?>/g;
const LOOKS_LIKE_HTML = /<\/?[a-zA-Z!]/;
const ENTITY = /&(#\d{1,7}|#x[0-9a-f]{1,6}|[a-z]{2,8});/gi;

const NAMED: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };

function escapeText(text: string): string {
  return text
    .replace(/&(?!(#\d{1,7}|#x[0-9a-f]{1,6}|[a-z]{2,8});)/gi, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function decodeEntities(text: string): string {
  return text.replace(ENTITY, (whole, body: string) => {
    if (body[0] === "#") {
      const code = body[1] === "x" || body[1] === "X" ? Number.parseInt(body.slice(2), 16) : Number(body.slice(1));
      return Number.isInteger(code) && code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : whole;
    }
    return NAMED[body.toLowerCase()] ?? whole;
  });
}

/** Ancien texte sans balises : une ligne vide sépare deux paragraphes, un retour devient <br>. */
function plainToRich(text: string): string {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p>${p.split("\n").map((line) => escapeText(line.trim())).join("<br>")}</p>`)
    .join("");
}

/** HTML réduit aux balises permises, sans attribut ; le reste garde son texte. */
export function sanitizeRichText(input: string): string {
  if (!LOOKS_LIKE_HTML.test(input)) return plainToRich(input);

  const cleaned = input.replace(COMMENT, "").replace(DROP_WITH_CONTENT, "").replace(DECLARATION, "");
  let out = "";
  let last = 0;
  for (const match of cleaned.matchAll(TAG)) {
    out += escapeText(cleaned.slice(last, match.index));
    last = match.index + match[0].length;
    const raw = match[1].toLowerCase();
    const name = ALIASES[raw] ?? raw;
    if (!ALLOWED.has(name)) continue;
    const closing = match[0][1] === "/";
    if (name === "br") {
      if (!closing) out += "<br>";
    } else {
      out += closing ? `</${name}>` : `<${name}>`;
    }
  }
  out += escapeText(cleaned.slice(last));
  return out;
}

/** Texte visible, sans balises, entités décodées. */
function visibleText(html: string): string {
  return decodeEntities(html.replace(/<br>/g, "\n").replace(TAG, ""));
}

/** Texte mis en forme : nettoyé, et borné sur sa longueur visible. */
export function richTextSchema(maxVisible: number) {
  return z.preprocess(
    (value) => (typeof value === "string" ? sanitizeRichText(value) : value),
    z
      .string()
      .max(maxVisible * 6)
      .refine((html) => visibleText(html).length <= maxVisible, { message: `${maxVisible} caractères au plus` }),
  );
}

/** Une chaîne vide (ou sans texte visible) est absente ; une valeur d'édition de Puck est présente. */
export function hasText(value: ReactNode): boolean {
  if (typeof value === "string") return visibleText(sanitizeRichText(value)).trim() !== "";
  return value !== null && value !== undefined && value !== false;
}

type Frame = { tag: string | null; children: ReactNode[] };

/** Paragraphes du HTML nettoyé, en éléments React. */
function readParagraphs(html: string): ReactNode[][] {
  const paragraphs: ReactNode[][] = [];
  let stack: Frame[] = [];
  let key = 0;

  const ensureParagraph = () => {
    if (stack.length === 0) stack = [{ tag: null, children: [] }];
  };
  const closeInline = () => {
    const frame = stack.pop()!;
    stack[stack.length - 1].children.push(createElement(frame.tag!, { key: key++ }, ...frame.children));
  };
  const closeParagraph = () => {
    while (stack.length > 1) closeInline();
    const children = stack[0]?.children ?? [];
    if (children.some((child) => (typeof child === "string" ? child.trim() !== "" : true))) paragraphs.push(children);
    stack = [];
  };

  const tokens = /<(\/?)(p|br|strong|em|u|s)>/g;
  let last = 0;
  const pushText = (text: string) => {
    if (text === "") return;
    if (stack.length === 0 && text.trim() === "") return;
    ensureParagraph();
    stack[stack.length - 1].children.push(decodeEntities(text));
  };

  for (const match of html.matchAll(tokens)) {
    pushText(html.slice(last, match.index));
    last = match.index + match[0].length;
    const [, closing, tag] = match;
    if (tag === "p") {
      closeParagraph();
      if (!closing) ensureParagraph();
    } else if (tag === "br") {
      ensureParagraph();
      stack[stack.length - 1].children.push(createElement("br", { key: key++ }));
    } else if (!closing) {
      ensureParagraph();
      stack.push({ tag, children: [] });
    } else if (stack.some((frame) => frame.tag === tag)) {
      while (stack[stack.length - 1].tag !== tag) closeInline();
      closeInline();
    }
  }
  pushText(html.slice(last));
  closeParagraph();
  return paragraphs;
}

type RichTextProps = {
  value: ReactNode;
  /** Dans un titre : paragraphes joints par un retour à la ligne, sans <p>. */
  inline?: boolean;
  className?: string;
  style?: CSSProperties;
};

/** Affiche un texte mis en forme ; dans l'éditeur, la valeur d'édition de Puck telle quelle. */
export function RichText({ value, inline = false, className, style }: RichTextProps) {
  if (typeof value !== "string") return value == null || value === false ? null : <>{value}</>;
  const paragraphs = readParagraphs(sanitizeRichText(value));
  if (paragraphs.length === 0) return null;
  if (inline) {
    return (
      <>
        {paragraphs.map((children, i) => (
          <Fragment key={i}>
            {i > 0 && <br />}
            {children}
          </Fragment>
        ))}
      </>
    );
  }
  return (
    <>
      {paragraphs.map((children, i) => (
        <p key={i} dir="auto" className={className} style={style}>
          {children}
        </p>
      ))}
    </>
  );
}

/** Champ « richtext » de Puck réduit aux quatre styles permis. */
export const RICH_TEXT_OPTIONS: RichtextField["options"] = {
  blockquote: false,
  bulletList: false,
  code: false,
  codeBlock: false,
  heading: false,
  horizontalRule: false,
  link: false,
  listItem: false,
  listKeymap: false,
  orderedList: false,
  textAlign: false,
};
