// proxy.ts — routage multi-tenant par nom de domaine (ex-middleware.ts, Next 16).
// La décision est dans lib/routing.ts ; ce fichier ne fait que l'appliquer.
// Aucune requête en base ici.

import { NextResponse, type NextRequest } from "next/server";
import { env } from "@/lib/env";
import { routeRequest } from "@/lib/routing";

export function proxy(request: NextRequest): NextResponse {
  const decision = routeRequest(
    {
      host: request.headers.get("host"),
      pathname: request.nextUrl.pathname,
      search: request.nextUrl.search,
    },
    { dashboardHost: env.DASHBOARD_HOST },
  );

  switch (decision.kind) {
    case "pass":
      return NextResponse.next();
    case "site":
      return NextResponse.rewrite(new URL(decision.rewritePath, request.url));
    case "not-found":
      return new NextResponse(null, { status: 404 });
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
