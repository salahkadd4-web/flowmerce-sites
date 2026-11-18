"use client";

// Champ Puck « image » : choisir, remplacer ou retirer une image.
// L'image part vers POST /api/media, qui vérifie son contenu ; la valeur du champ
// est { url, width, height } ou null.

import { FieldLabel } from "@puckeditor/core";
import Image from "next/image";
import { useRef, useState } from "react";
import { Image as ImageIcon, ImagePlus, Loader2, Trash2 } from "lucide-react";
import { BTN_GHOST, FIELD_ERROR, HINT } from "@/components/dashboard/ui";
import type { MediaValue } from "@/blocks/shared";

type Props = {
  id: string;
  field: { label?: string };
  value: MediaValue | null | undefined;
  onChange: (value: MediaValue | null) => void;
  readOnly?: boolean;
};

export function MediaField({ id, field, value, onChange, readOnly }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function upload(file: File) {
    setUploading(true);
    setError("");
    try {
      const body = new FormData();
      body.set("file", file);
      const response = await fetch("/api/media", { method: "POST", body });
      const json = (await response.json().catch(() => ({}))) as Partial<MediaValue> & { error?: string };
      if (!response.ok || !json.url || !json.width || !json.height) {
        setError(json.error ?? "L'envoi a échoué. Réessayez.");
        return;
      }
      onChange({ url: json.url, width: json.width, height: json.height });
    } catch {
      setError("L'envoi a échoué. Vérifiez votre connexion et réessayez.");
    } finally {
      setUploading(false);
      if (input.current) input.current.value = "";
    }
  }

  return (
    // Puck ne dessine pas le libellé d'un champ personnalisé : FieldLabel, comme ses champs natifs.
    <FieldLabel label={field.label ?? "Image"} icon={<ImageIcon size={16} />} el="div" readOnly={readOnly}>
    <div className="flex flex-col gap-2">
      {value && (
        <Image
          src={value.url}
          alt=""
          width={value.width}
          height={value.height}
          sizes="280px"
          className="h-auto w-full rounded-control border border-line"
        />
      )}

      <input
        ref={input}
        id={id}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        className="sr-only"
        disabled={readOnly || uploading}
        aria-describedby={`${id}-hint${error ? ` ${id}-error` : ""}`}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void upload(file);
        }}
      />

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className={BTN_GHOST}
          disabled={readOnly || uploading}
          onClick={() => input.current?.click()}
        >
          {uploading ? <Loader2 size={15} className="animate-spin" aria-hidden /> : <ImagePlus size={15} aria-hidden />}
          {uploading ? "Envoi en cours" : value ? "Remplacer" : "Choisir une image"}
        </button>
        {value && !uploading && (
          <button type="button" className={BTN_GHOST} disabled={readOnly} onClick={() => onChange(null)}>
            <Trash2 size={15} aria-hidden />
            Retirer
          </button>
        )}
      </div>

      <p id={`${id}-hint`} className={HINT}>
        JPEG, PNG, WebP ou AVIF, 5 Mo maximum.
      </p>
      {error && (
        <p id={`${id}-error`} role="alert" className={FIELD_ERROR}>
          {error}
        </p>
      )}
    </div>
    </FieldLabel>
  );
}
