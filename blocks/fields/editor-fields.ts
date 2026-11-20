// Champs d'édition de la configuration partagée, sans composant client.
//
// La configuration (blocks/puck.config.ts) est aussi importée par les pages
// publiques : y référencer un champ client ("use client", qui importe l'éditeur
// Puck) enverrait tout l'éditeur aux acheteurs. Ici, seul un emplacement est
// déclaré (editorKind + editorOptions) ; le vrai composant est branché côté
// éditeur seulement (app/(vendor)/(editor)/edit/[pageId]/editor-config.ts).
// Test de garde : blocks/server-graph.test.ts.

import { createElement, Fragment } from "react";

export type EditorFieldKind = "media" | "range" | "color";
export type RangeOptions = { min: number; max: number; step: number; unit: string };
export type ColorOptions = { auto: boolean };

export type EditorFieldPlaceholder = {
  type: "custom";
  label: string;
  editorKind: EditorFieldKind;
  editorOptions?: RangeOptions | ColorOptions;
  render: () => ReturnType<typeof createElement>;
};

function placeholder(editorKind: EditorFieldKind, label: string, editorOptions?: RangeOptions | ColorOptions): EditorFieldPlaceholder {
  return { type: "custom", label, editorKind, ...(editorOptions ? { editorOptions } : {}), render: () => createElement(Fragment) };
}

/** Une image envoyée par le vendeur. */
export function imageField(label: string) {
  return placeholder("media", label);
}

/** Un curseur borné, par paliers. */
export function rangeField(label: string, options: RangeOptions) {
  return placeholder("range", label, options);
}

/** Une couleur : palette, personnalisée, et « Automatique » si permis. */
export function colorField(label: string, options: ColorOptions) {
  return placeholder("color", label, options);
}
