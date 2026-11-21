// Boîte d'un bouton de section (bannière, fiche produit, formulaire).
// Sur le site : le bouton tel quel ; dans l'éditeur, editor-config.ts la remplace
// par une boîte avec la barre d'outils du bouton (blocks/editor/EditableButton.tsx).

import type { ReactNode } from "react";

export type RenderButton = (box: { children: ReactNode }) => ReactNode;

export const renderButton: RenderButton = ({ children }) => children;
