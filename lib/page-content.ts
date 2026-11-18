// lib/page-content.ts — Flowmerce Sites
//
// Forme du JSON d'une page, identique à celle de Puck (Phase 1) :
//   { root: { props }, content: [{ type, props }] }
// Le contenu vient de la base : il est validé avant tout rendu.

import { z } from "zod";

const PageBlockSchema = z.object({
  type: z.string(),
  props: z.record(z.unknown()),
});

const PageContentSchema = z.object({
  root: z
    .object({ props: z.object({ title: z.string().optional() }).passthrough() })
    .default({ props: {} }),
  content: z.array(PageBlockSchema),
});

export type PageBlock = z.infer<typeof PageBlockSchema>;
export type PageContent = z.infer<typeof PageContentSchema>;

/** Contenu validé, ou `null` s'il n'a pas la forme attendue. */
export function parsePageContent(json: unknown): PageContent | null {
  const result = PageContentSchema.safeParse(json);
  return result.success ? result.data : null;
}
