// Réglages de la page (racine Puck) : titre de l'onglet, langue, polices.
// Le « Produit de la page » est ajouté côté éditeur (editor-config.ts).

import type { Config } from "@puckeditor/core";
import { createElement, type ReactNode } from "react";
import { FONT_IDS, FONT_LABELS, isFontId } from "@/blocks/fonts";
import { isPageLang } from "@/blocks/i18n";
import { PageRoot } from "./PageRoot";

const FONT_OPTIONS = FONT_IDS.map((id) => ({ label: FONT_LABELS[id], value: id }));

export const rootConfig: NonNullable<Config["root"]> = {
  fields: {
    title: { type: "text", label: "Titre de la page (onglet du navigateur)" },
    lang: {
      type: "radio",
      label: "Langue de la page",
      options: [
        { label: "Français", value: "fr" },
        { label: "العربية", value: "ar" },
      ],
    },
    headingFont: { type: "select", label: "Police des titres", options: FONT_OPTIONS },
    bodyFont: { type: "select", label: "Police du texte", options: FONT_OPTIONS },
  },
  defaultProps: { title: "", lang: "fr", headingFont: "system", bodyFont: "system" },
  render: ({ children, lang, headingFont, bodyFont }: { children?: ReactNode; lang?: unknown; headingFont?: unknown; bodyFont?: unknown }) =>
    createElement(
      PageRoot,
      {
        lang: isPageLang(lang) ? lang : "fr",
        headingFont: isFontId(headingFont) ? headingFont : "system",
        bodyFont: isFontId(bodyFont) ? bodyFont : "system",
      },
      children,
    ),
};
