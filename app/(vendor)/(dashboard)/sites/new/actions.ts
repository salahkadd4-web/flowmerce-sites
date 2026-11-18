"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { isDashboardHost } from "@/lib/dashboard-host";
import { env } from "@/lib/env";
import { createSiteForUser } from "@/lib/site-create";

export type CreateSiteState = { field?: "name" | "subdomain"; error?: string };

export async function createSite(_previous: CreateSiteState, formData: FormData): Promise<CreateSiteState> {
  // Seconde barrière derrière proxy.ts : jamais d'action vendeur depuis un site.
  if (!isDashboardHost((await headers()).get("host"), env.DASHBOARD_HOST)) {
    throw new Error("createSite appelée hors de l'hôte vendeur");
  }
  const session = await auth();
  if (!session?.user) redirect("/login");

  const result = await createSiteForUser(
    { id: session.user.id, name: session.user.name ?? null, email: session.user.email },
    { name: String(formData.get("name") ?? ""), subdomain: String(formData.get("subdomain") ?? "") },
  );
  if (!result.ok) return { field: result.field, error: result.error };

  redirect(`/edit/${result.pageId}`);
}
