// POST /api/orders — commande COD envoyée par le formulaire d'un site vendeur.
// Toute la logique est dans lib/orders/intake.ts ; ici, seulement le HTTP.

import { NextResponse } from "next/server";
import { isDashboardHost } from "@/lib/dashboard-host";
import { env } from "@/lib/env";
import { checkOrderRequest } from "@/lib/orders/http";
import { createOrder } from "@/lib/orders/intake";

export const runtime = "nodejs";

const MAX_BODY_BYTES = 10_000;

export async function POST(request: Request) {
  const host = request.headers.get("host");
  // Une commande appartient à un site : jamais sur l'hôte vendeur.
  if (!host || isDashboardHost(host, env.DASHBOARD_HOST)) return new NextResponse(null, { status: 404 });

  const refused = checkOrderRequest({
    host,
    origin: request.headers.get("origin"),
    contentType: request.headers.get("content-type"),
  });
  if (refused) return NextResponse.json({ error: refused }, { status: 403 });

  const text = await request.text();
  if (text.length > MAX_BODY_BYTES) return NextResponse.json({ error: "Requête trop volumineuse" }, { status: 413 });

  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null;
  const result = await createOrder({ host, ip, userAgent: request.headers.get("user-agent") }, body);

  if (!result.ok) {
    return NextResponse.json({ error: result.error, ...(result.field ? { field: result.field } : {}) }, { status: result.status });
  }
  return NextResponse.json({ reference: result.reference });
}
