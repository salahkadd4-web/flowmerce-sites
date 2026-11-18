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

export const editorConfig: Config = withMediaField(puckConfig);
