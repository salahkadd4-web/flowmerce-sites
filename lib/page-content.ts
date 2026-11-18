// lib/page-content.ts — Flowmerce Sites
//
// JSON d'une page au format Puck : { root: { props }, content: [{ type, props }], zones? }.
//
//   validatePageContent  stricte, à l'enregistrement : rien d'invalide n'entre en base.
//   parsePageContent     tolérante, à l'affichage : un bloc invalide est écarté,
//                        les autres s'affichent (un bloc ne met jamais la page hors ligne).

import { z } from "zod";
import { BLOCK_FIELD_LABELS, BLOCK_LABELS, BLOCK_SCHEMAS, isBlockType } from "@/blocks/schemas";

export type PageBlock = { type: string; props: Record<string, unknown> };
export type PageContent = { root: { props: { title?: string } }; content: PageBlock[] };

const RootSchema = z
  .object({ props: z.record(z.unknown()).default({}) })
  .default({ props: {} });

/** Forme de la page seule : les blocs sont vérifiés un par un ensuite. */
const PageShapeSchema = z.object({
  root: RootSchema,
  content: z.array(z.unknown()),
  zones: z.record(z.unknown()).optional(),
});

const RawBlockSchema = z.object({ type: z.string(), props: z.record(z.unknown()) });

function rootProps(props: Record<string, unknown>): PageContent["root"]["props"] {
  const title = props.title;
  return typeof title === "string" && title.length <= 120 ? { title } : {};
}

type BlockCheck = { ok: true; block: PageBlock } | { ok: false; error: string };

function checkBlock(raw: unknown): BlockCheck {
  const shape = RawBlockSchema.safeParse(raw);
  if (!shape.success) return { ok: false, error: "Bloc mal formé" };

  const { type, props } = shape.data;
  if (!isBlockType(type)) return { ok: false, error: `Bloc ${type} : type inconnu` };

  const result = BLOCK_SCHEMAS[type].safeParse(props);
  if (result.success) return { ok: true, block: { type, props: result.data } };

  const field = String(result.error.issues[0]?.path[0] ?? "");
  const label = BLOCK_FIELD_LABELS[type][field] ?? field;
  return { ok: false, error: `Bloc ${BLOCK_LABELS[type]} : « ${label} » invalide` };
}

export function validatePageContent(
  json: unknown,
): { ok: true; content: PageContent } | { ok: false; error: string } {
  const shape = PageShapeSchema.safeParse(json);
  if (!shape.success) return { ok: false, error: "Contenu de page invalide" };

  const title = shape.data.root.props.title;
  if (title !== undefined && (typeof title !== "string" || title.length > 120)) {
    return { ok: false, error: "« Titre de la page » invalide" };
  }

  const blocks: PageBlock[] = [];
  for (const raw of shape.data.content) {
    const check = checkBlock(raw);
    if (!check.ok) return check;
    blocks.push(check.block);
  }
  return { ok: true, content: { root: { props: rootProps(shape.data.root.props) }, content: blocks } };
}

/** Contenu affichable, ou `null` si la forme même de la page est invalide. */
export function parsePageContent(json: unknown): PageContent | null {
  const shape = PageShapeSchema.safeParse(json);
  if (!shape.success) return null;

  const blocks: PageBlock[] = [];
  for (const raw of shape.data.content) {
    const check = checkBlock(raw);
    if (check.ok) blocks.push(check.block);
    else console.warn(`[page-content] bloc écarté à l'affichage — ${check.error}`);
  }
  return { root: { props: rootProps(shape.data.root.props) }, content: blocks };
}
