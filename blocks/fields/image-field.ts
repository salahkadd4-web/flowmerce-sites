// Champ « image » de la configuration partagée, sans composant client.
//
// La configuration (blocks/puck.config.ts) est aussi importée par les pages
// publiques : y référencer MediaField ("use client", qui importe l'éditeur Puck)
// enverrait tout l'éditeur aux acheteurs. Le rendu réel du champ est branché
// côté éditeur seulement (app/(vendor)/(editor)/edit/[pageId]/editor-config.ts).
// Test de garde : blocks/server-graph.test.ts.

import { createElement, Fragment } from "react";

export const IMAGE_FIELD_TYPE = "custom" as const;

export function imageField(label: string) {
  return { type: IMAGE_FIELD_TYPE, label, render: () => createElement(Fragment) };
}
