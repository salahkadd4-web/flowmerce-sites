// GET /api/orders/communes?wilaya=16&lang=ar — communes d'une wilaya, pour le formulaire
// de commande. Chargées à la demande : la liste complète pèse environ 80 ko.

import { NextResponse } from "next/server";
import { isPageLang } from "@/blocks/i18n";
import { communesOf, wilayaName } from "@/lib/algeria/wilayas";

export function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const code = Number(params.get("wilaya"));
  const lang = params.get("lang");
  if (!Number.isInteger(code) || !wilayaName(code)) {
    return NextResponse.json({ error: "Wilaya inconnue" }, { status: 400 });
  }
  return NextResponse.json(
    { communes: communesOf(code, isPageLang(lang) ? lang : "fr") },
    { headers: { "Cache-Control": "public, max-age=86400, immutable" } },
  );
}
