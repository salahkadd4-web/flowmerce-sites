// GET /media/<clé> — images des sites, servies sur tous les hôtes (le proxy laisse
// passer /media en lecture sur les sites). Chemin relatif : next/image l'optimise
// via images.localPatterns, sans passer par une IP locale (bloquée par Next 16).

import { isMediaKey } from "@/lib/media";
import { prisma } from "@/lib/prisma";
import { storage } from "@/lib/storage";

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  if (!isMediaKey(key)) return new Response(null, { status: 404 });

  const media = await prisma.media.findUnique({ where: { key }, select: { mimeType: true } });
  if (!media) return new Response(null, { status: 404 });

  const bytes = await storage.get(key);
  if (!bytes) return new Response(null, { status: 404 });

  return new Response(Buffer.from(bytes), {
    headers: {
      "Content-Type": media.mimeType,
      "Content-Length": String(bytes.byteLength),
      "X-Content-Type-Options": "nosniff",
      // La clé change à chaque envoi : le contenu d'une URL ne change jamais.
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
