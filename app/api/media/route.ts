// POST /api/media — envoi d'une image depuis l'éditeur (hôte vendeur uniquement).
// Le proxy refuse déjà /api/media sur les sites ; la route le vérifie aussi.

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isDashboardHost } from "@/lib/dashboard-host";
import { env } from "@/lib/env";
import { MAX_MEDIA_BYTES } from "@/lib/media";
import { storeMedia } from "@/lib/media-store";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

// Marge pour l'enveloppe multipart autour du fichier.
const MAX_REQUEST_BYTES = MAX_MEDIA_BYTES + 64 * 1024;

export async function POST(request: Request) {
  if (!isDashboardHost(request.headers.get("host"), env.DASHBOARD_HOST)) {
    return new NextResponse(null, { status: 404 });
  }

  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Connexion requise" }, { status: 401 });

  const tenant = await prisma.tenant.findUnique({
    where: { ownerUserId: session.user.id },
    select: { id: true },
  });
  if (!tenant) return NextResponse.json({ error: "Créez d'abord un site" }, { status: 403 });

  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > MAX_REQUEST_BYTES) {
    return NextResponse.json({ error: "Image trop lourde (5 Mo maximum)" }, { status: 413 });
  }

  let file: FormDataEntryValue | null;
  try {
    file = (await request.formData()).get("file");
  } catch {
    return NextResponse.json({ error: "Envoi invalide" }, { status: 400 });
  }
  if (!(file instanceof File)) return NextResponse.json({ error: "Aucun fichier reçu" }, { status: 400 });

  const result = await storeMedia(tenant.id, new Uint8Array(await file.arrayBuffer()));
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });

  return NextResponse.json(result.media);
}
