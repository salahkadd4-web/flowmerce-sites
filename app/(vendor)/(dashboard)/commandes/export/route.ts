// GET /commandes/export — commandes filtrées au format CSV (Excel), hôte vendeur seulement.

import { auth } from "@/lib/auth";
import { isDashboardHost } from "@/lib/dashboard-host";
import { env } from "@/lib/env";
import { listOrdersForExport } from "@/lib/orders/manage";
import { ordersToCsv } from "@/lib/orders/status";
import { parseOrderFilters } from "../filters";

export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!isDashboardHost(request.headers.get("host"), env.DASHBOARD_HOST)) return new Response(null, { status: 404 });
  const session = await auth();
  if (!session?.user) return new Response(null, { status: 401 });

  const params = Object.fromEntries(new URL(request.url).searchParams);
  const rows = await listOrdersForExport(session.user.id, parseOrderFilters(params));
  const day = new Date().toISOString().slice(0, 10);

  return new Response(ordersToCsv(rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="commandes-${day}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
