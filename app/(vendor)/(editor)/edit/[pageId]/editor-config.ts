// Configuration Puck de l'éditeur : la configuration partagée, plus les champs
// qui n'existent que côté client (envoi d'images). Importé seulement par Editor.tsx,
// jamais par une page publique (voir blocks/fields/image-field.ts).

import type { Config, Field } from "@puckeditor/core";
import { MediaField } from "@/blocks/fields/MediaField";
import { puckConfig } from "@/blocks/puck.config";

const WITH_IMAGE_FIELD = ["Hero", "Image"] as const;

function withMediaField(config: Config): Config {
  const components = { ...config.components };
  for (const name of WITH_IMAGE_FIELD) {
    const component = components[name];
    const image = component?.fields?.image;
    if (!component || !image || image.type !== "custom") continue;
    const mediaField = { type: "custom", label: image.label, render: MediaField } as Field;
    components[name] = { ...component, fields: { ...component.fields, image: mediaField } };
  }
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
  return withProductField(withMediaField(puckConfig), products);
}
