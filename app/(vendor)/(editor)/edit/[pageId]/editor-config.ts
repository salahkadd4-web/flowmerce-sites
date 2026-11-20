// Configuration Puck de l'éditeur : la configuration partagée, plus les champs
// qui n'existent que côté client (envoi d'images, curseurs, couleurs). Importé
// seulement par Editor.tsx, jamais par une page publique (voir
// blocks/fields/editor-fields.ts).

import type { Config, Field } from "@puckeditor/core";
import { createElement } from "react";
import { ResizableImageBox } from "@/blocks/editor/ResizableImageBox";
import { textToolbar, type TextStyle } from "@/blocks/editor/TextToolbar";
import { ColorField } from "@/blocks/fields/ColorField";
import type { EditorFieldKind } from "@/blocks/fields/editor-fields";
import { MediaField } from "@/blocks/fields/MediaField";
import { RangeField } from "@/blocks/fields/RangeField";
import { FourStylesMenu } from "@/blocks/fields/RichTextMenus";
import type { ImageBoxProps } from "@/blocks/image-box";
import { puckConfig } from "@/blocks/puck.config";

const RENDERERS: Record<EditorFieldKind, unknown> = {
  media: MediaField,
  range: RangeField,
  color: ColorField,
};

type AnyField = Field & { editorKind?: EditorFieldKind; objectFields?: Record<string, AnyField> };
type Fields = Record<string, AnyField>;

/** Texte écrit dans la page → réglages de taille, couleur (et alignement) de sa barre. */
export const TEXT_STYLES: Record<string, Record<string, TextStyle>> = {
  Hero: {
    title: { size: "titleSize", color: "titleColor", align: true },
    subtitle: { size: "textSize", color: "textColor", align: true },
  },
  Text: {
    title: { size: "titleSize", color: "titleColor", align: true },
    body: { size: "textSize", color: "textColor", align: true },
  },
  Footer: {
    returnPolicy: { size: "textSize", color: "textColor" },
  },
};

/**
 * Remplace chaque emplacement de champ d'édition par son composant, groupes compris.
 * Textes : dans la page, la barre de mise en forme complète (quatre styles, taille,
 * couleur, alignement) ; ailleurs, les quatre styles permis.
 */
function withEditorRenderers(fields: Fields | undefined, textStyles: Record<string, TextStyle> = {}): Fields | undefined {
  if (!fields) return fields;
  return Object.fromEntries(
    Object.entries(fields).map(([name, field]) => {
      if (field.type === "custom" && field.editorKind) return [name, { ...field, render: RENDERERS[field.editorKind] }];
      if (field.type === "richtext") {
        const style = textStyles[name];
        return [name, { ...field, renderMenu: FourStylesMenu, renderInlineMenu: style ? textToolbar(style) : FourStylesMenu }];
      }
      if (field.type === "object" && field.objectFields) return [name, { ...field, objectFields: withEditorRenderers(field.objectFields) }];
      return [name, field];
    }),
  );
}

function withEditorFields(config: Config): Config {
  const components = Object.fromEntries(
    Object.entries(config.components).map(([name, component]) => [
      name,
      { ...component, fields: withEditorRenderers(component.fields as Fields | undefined, TEXT_STYLES[name]) },
    ]),
  ) as Config["components"];
  return { ...config, components };
}

/**
 * « Produit de la page » : liste des produits actifs du vendeur. Construite ici,
 * côté éditeur, pour que la configuration partagée n'ait rien à charger.
 */
function withProductField(config: Config, products: { id: string; name: string }[]): Config {
  const productId = {
    type: "select",
    label: "Produit de la page",
    options: [{ label: "Aucun produit", value: "" }, ...products.map((p) => ({ label: p.name, value: p.id }))],
  } as Field;
  return { ...config, root: { ...config.root, fields: { ...config.root?.fields, productId } } };
}

/** Blocs dont l'image se règle à la poignée, et le réglage qui porte sa largeur. */
const RESIZABLE = ["Hero", "Image", "Product"] as const;

/** Donne aux blocs à image une boîte à poignée à la place de la boîte simple. */
function withResizableImages(config: Config): Config {
  const components = { ...config.components };
  for (const name of RESIZABLE) {
    const component = components[name];
    if (!component?.render) continue;
    const render = component.render;
    components[name] = {
      ...component,
      render: (props) =>
        render({
          ...props,
          renderImageBox: (box: ImageBoxProps) =>
            createElement(ResizableImageBox, { blockId: props.id, prop: "imageWidth", width: box.width }, box.children),
        }),
    };
  }
  return { ...config, components };
}

export function buildEditorConfig(products: { id: string; name: string }[]): Config {
  return withProductField(withResizableImages(withEditorFields(puckConfig)), products);
}
