// lib/media.ts — vérification des images envoyées par les vendeurs.
//
// Le type est établi par le contenu du fichier (signature et en-têtes lus par
// image-size), jamais par son nom ni par le type annoncé par le navigateur.
// SVG refusé : il peut contenir du script.

import { imageSize } from "image-size";

export const MAX_MEDIA_BYTES = 5 * 1024 * 1024;

const ALLOWED = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  avif: "image/avif",
} as const;

export type MediaExt = keyof typeof ALLOWED;

const UNSUPPORTED = "Format non pris en charge : JPEG, PNG, WebP ou AVIF";

export function inspectImage(
  bytes: Uint8Array,
):
  | { ok: true; ext: MediaExt; mimeType: string; width: number; height: number }
  | { ok: false; error: string } {
  if (bytes.byteLength > MAX_MEDIA_BYTES) return { ok: false, error: "Image trop lourde (5 Mo maximum)" };
  if (bytes.byteLength === 0) return { ok: false, error: UNSUPPORTED };

  let result: { type?: string; width?: number; height?: number };
  try {
    result = imageSize(bytes);
  } catch {
    return { ok: false, error: UNSUPPORTED };
  }

  const ext = result.type as MediaExt | undefined;
  if (!ext || !(ext in ALLOWED) || !result.width || !result.height) return { ok: false, error: UNSUPPORTED };
  return { ok: true, ext, mimeType: ALLOWED[ext], width: result.width, height: result.height };
}

const MEDIA_KEY = /^[a-f0-9]{32}\.(jpg|png|webp|avif)$/;

/** Nom de fichier généré par storeMedia : seul format accepté par le stockage et la route /media. */
export function isMediaKey(key: string): boolean {
  return MEDIA_KEY.test(key);
}
