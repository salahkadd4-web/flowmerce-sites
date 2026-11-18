// lib/media-store.ts — enregistrement d'une image envoyée par un vendeur.
// Séparé de lib/media.ts (fonctions pures) parce qu'il touche la base et le disque.

import { randomBytes } from "node:crypto";
import { inspectImage } from "@/lib/media";
import { prisma } from "@/lib/prisma";
import { storage } from "@/lib/storage";

export async function storeMedia(
  tenantId: string,
  bytes: Uint8Array,
): Promise<
  { ok: true; media: { id: string; url: string; width: number; height: number } } | { ok: false; error: string }
> {
  const image = inspectImage(bytes);
  if (!image.ok) return image;

  const key = `${randomBytes(16).toString("hex")}.${image.ext}`;
  const url = `/media/${key}`;

  // Le fichier d'abord : une ligne Media ne doit jamais pointer vers un fichier absent.
  await storage.put(key, bytes);
  try {
    const media = await prisma.media.create({
      data: {
        tenantId,
        key,
        url,
        mimeType: image.mimeType,
        width: image.width,
        height: image.height,
        sizeBytes: bytes.byteLength,
      },
      select: { id: true, url: true, width: true, height: true },
    });
    return { ok: true, media };
  } catch (error) {
    await storage.remove(key);
    throw error;
  }
}
