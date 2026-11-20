// Sections de la page, dans l'ordre : ce que montre la colonne de gauche.

import { BLOCK_LABELS, isBlockType } from "@/blocks/schemas";

/** Zone racine de Puck : la page elle-même. */
export const ROOT_ZONE = "root:default-zone";

export type SectionRow = { id: string; type: string; label: string; index: number };

export function listSections(content: readonly { type: string; props: { id: string } }[]): SectionRow[] {
  return content.map((item, index) => ({
    id: item.props.id,
    type: item.type,
    label: isBlockType(item.type) ? BLOCK_LABELS[item.type] : item.type,
    index,
  }));
}

/** Place d'une nouvelle section : juste après la section choisie, sinon à la fin. */
export function insertionIndex(selectedIndex: number | null, count: number): number {
  if (selectedIndex === null || selectedIndex < 0 || selectedIndex >= count) return count;
  return selectedIndex + 1;
}
