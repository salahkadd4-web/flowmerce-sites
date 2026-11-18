"use client";

// Champ Puck « image » : une image, par le composant d'envoi partagé.
// La valeur du champ est { url, width, height } ou null.

import { FieldLabel } from "@puckeditor/core";
import { Image as ImageIcon } from "lucide-react";
import { ImageUploader } from "@/components/media/ImageUploader";
import type { MediaValue } from "@/blocks/shared";

type Props = {
  id: string;
  field: { label?: string };
  value: MediaValue | null | undefined;
  onChange: (value: MediaValue | null) => void;
  readOnly?: boolean;
};

export function MediaField({ id, field, value, onChange, readOnly }: Props) {
  return (
    // Puck ne dessine pas le libellé d'un champ personnalisé : FieldLabel, comme ses champs natifs.
    <FieldLabel label={field.label ?? "Image"} icon={<ImageIcon size={16} />} el="div" readOnly={readOnly}>
      <ImageUploader
        id={id}
        value={value ? [value] : []}
        onChange={(images) => onChange(images[0] ?? null)}
        max={1}
        disabled={readOnly}
      />
    </FieldLabel>
  );
}
