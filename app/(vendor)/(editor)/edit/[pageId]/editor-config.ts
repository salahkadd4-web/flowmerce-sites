// Configuration Puck de l'éditeur : la configuration partagée, plus les champs
// qui n'existent que côté client (envoi d'images, curseurs, couleurs). Importé
// seulement par Editor.tsx, jamais par une page publique (voir
// blocks/fields/editor-fields.ts).

import type { Config, Field } from "@puckeditor/core";
import { ColorField } from "@/blocks/fields/ColorField";
import type { EditorFieldKind } from "@/blocks/fields/editor-fields";
import { MediaField } from "@/blocks/fields/MediaField";
import { RangeField } from "@/blocks/fields/RangeField";
import { puckConfig } from "@/blocks/puck.config";

const RENDERERS: Record<EditorFieldKind, unknown> = {
  media: MediaField,
  range: RangeField,
  color: ColorField,
};

type AnyField = Field & { editorKind?: EditorFieldKind; objectFields?: Record<string, AnyField> };
type Fields = Record<string, AnyField>;

/** Remplace chaque emplacement de champ d'édition par son composant, groupes compris. */
function withEditorRenderers(fields: Fields | undefined): Fields | undefined {
  if (!fields) return fields;
  return Object.fromEntries(
    Object.entries(fields).map(([name, field]) => {
      if (field.type === "custom" && field.editorKind) return [name, { ...field, render: RENDERERS[field.editorKind] }];
      if (field.type === "object" && field.objectFields) return [name, { ...field, objectFields: withEditorRenderers(field.objectFields) }];
      return [name, field];
    }),
  );
}

function withEditorFields(config: Config): Config {
  const components = Object.fromEntries(
    Object.entries(config.components).map(([name, component]) => [
      name,
      { ...component, fields: withEditorRenderers(component.fields as Fields | undefined) },
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

export function buildEditorConfig(products: { id: string; name: string }[]): Config {
  return withProductField(withEditorFields(puckConfig), products);
}
