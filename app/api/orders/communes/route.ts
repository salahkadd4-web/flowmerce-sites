// GET /api/orders/communes?wilaya=16 — communes d'une wilaya, pour le formulaire
// de commande. Chargées à la demande : la liste complète pèse environ 80 ko.

import { NextResponse } from "next/server";
import { communesOf, wilayaName } from "@/lib/algeria/wilayas";

export function GET(request: Request) {
  const code = Number(new URL(request.url).searchParams.get("wilaya"));
  if (!Number.isInteger(code) || !wilayaName(code)) {
    return NextResponse.json({ error: "Wilaya inconnue" }, { status: 400 });
  }
  return NextResponse.json(
    { communes: communesOf(code) },
    { headers: { "Cache-Control": "public, max-age=86400, immutable" } },
  );
}
