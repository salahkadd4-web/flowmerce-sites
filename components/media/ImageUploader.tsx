"use client";

// Envoi d'images (POST /api/media, qui vérifie le contenu) : une ou plusieurs,
// avec aperçu, ordre (gauche / droite) et retrait. Utilisé par les produits et,
// à une image, par le champ « image » de l'éditeur (blocks/fields/MediaField.tsx).

import Image from "next/image";
import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight, ImagePlus, Loader2, X } from "lucide-react";
import { BTN_GHOST, FIELD_ERROR, FOCUS, HINT } from "@/components/dashboard/ui";
import type { MediaValue } from "@/blocks/shared";

type Props = {
  id: string;
  value: MediaValue[];
  onChange: (value: MediaValue[]) => void;
  max: number;
  disabled?: boolean;
};

const ICON_BUTTON = `flex size-7 items-center justify-center rounded-full bg-white/90 text-ink shadow-sm hover:bg-white disabled:opacity-40 ${FOCUS}`;

export function ImageUploader({ id, value, onChange, max, disabled }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const full = value.length >= max;

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
      const image = { url: json.url, width: json.width, height: json.height };
      onChange(max === 1 ? [image] : [...value, image]);
    } catch {
      setError("L'envoi a échoué. Vérifiez votre connexion et réessayez.");
    } finally {
      setUploading(false);
      if (input.current) input.current.value = "";
    }
  }

  function move(index: number, by: -1 | 1) {
    const next = [...value];
    [next[index], next[index + by]] = [next[index + by], next[index]];
    onChange(next);
  }

  return (
    <div className="flex flex-col gap-2">
      {value.length > 0 && (
        <ul className={`m-0 grid list-none gap-2 p-0 ${max === 1 ? "grid-cols-1" : "grid-cols-3 sm:grid-cols-4"}`}>
          {value.map((image, index) => (
            <li key={image.url} className="relative">
              <Image
                src={image.url}
                alt={`Photo ${index + 1}`}
                width={image.width}
                height={image.height}
                sizes={max === 1 ? "280px" : "160px"}
                className="aspect-square h-auto w-full rounded-control border border-line object-cover"
              />
              <div className="absolute inset-x-1 top-1 flex justify-between">
                {max > 1 ? (
                  <span className="flex gap-1">
                    <button type="button" aria-label="Déplacer à gauche" className={ICON_BUTTON} disabled={disabled || index === 0} onClick={() => move(index, -1)}>
                      <ChevronLeft size={14} aria-hidden />
                    </button>
                    <button type="button" aria-label="Déplacer à droite" className={ICON_BUTTON} disabled={disabled || index === value.length - 1} onClick={() => move(index, 1)}>
                      <ChevronRight size={14} aria-hidden />
                    </button>
                  </span>
                ) : (
                  <span />
                )}
                <button
                  type="button"
                  aria-label="Retirer la photo"
                  className={ICON_BUTTON}
                  disabled={disabled}
                  onClick={() => onChange(value.filter((_, i) => i !== index))}
                >
                  <X size={14} aria-hidden />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <input
        ref={input}
        id={id}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        className="sr-only"
        disabled={disabled || uploading || (full && max > 1)}
        aria-describedby={`${id}-hint${error ? ` ${id}-error` : ""}`}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void upload(file);
        }}
      />

      {!(full && max > 1) && (
        <div>
          <button type="button" className={BTN_GHOST} disabled={disabled || uploading} onClick={() => input.current?.click()}>
            {uploading ? <Loader2 size={15} className="animate-spin" aria-hidden /> : <ImagePlus size={15} aria-hidden />}
            {uploading ? "Envoi en cours" : max === 1 && value.length ? "Remplacer" : max === 1 ? "Choisir une image" : "Ajouter une photo"}
          </button>
        </div>
      )}

      <p id={`${id}-hint`} className={HINT}>
        JPEG, PNG, WebP ou AVIF, 5 Mo maximum{max > 1 ? ` — ${value.length} sur ${max} photos` : ""}.
      </p>
      {error && (
        <p id={`${id}-error`} role="alert" className={FIELD_ERROR}>
          {error}
        </p>
      )}
    </div>
  );
}
