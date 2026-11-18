// « Mes sites » — liste des sites du vendeur connecté.
// Structure de liste reprise de flowmerce-web-app (app/dashboard/api-keys/page.tsx).

import { ExternalLink, Globe } from "lucide-react";
import { Card, EmptyState, FOCUS, PageHeader, SiteStatusBadge } from "@/components/dashboard/ui";
import { auth } from "@/lib/auth";
import { env } from "@/lib/env";
import { siteUrl } from "@/lib/host";
import { listSitesForOwner } from "@/lib/sites";

const TYPE_LABEL = { LANDING: "Landing page", STORE: "Boutique" } as const;

export default async function SitesPage() {
  // Le layout redirige déjà sans session ; la page ne lit que le vendeur connecté.
  const session = await auth();
  const sites = session?.user ? await listSitesForOwner(session.user.id) : [];

  return (
    <div className="w-full max-w-3xl p-5 sm:p-10">
      <PageHeader title="Mes sites" subtitle={`${sites.length} site${sites.length !== 1 ? "s" : ""}.`} />

      {sites.length === 0 ? (
        <Card padded={false}>
          <EmptyState icon={Globe} title="Aucun site pour l'instant." />
        </Card>
      ) : (
        <Card padded={false}>
          <ul className="divide-y divide-line list-none m-0 p-0">
            {sites.map((site) => {
              const url = siteUrl(site.subdomain, {
                rootDomain: env.SITES_ROOT_DOMAIN,
                protocol: env.SITES_PROTOCOL,
                port: env.SITES_PORT,
              });
              return (
                <li key={site.id} className="p-6">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-[14px] font-bold text-ink">{site.name}</p>
                      <p className="mt-0.5 text-[12px] text-body">{TYPE_LABEL[site.type]}</p>
                    </div>
                    <SiteStatusBadge status={site.status} />
                  </div>
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`mt-3 inline-flex items-center gap-1.5 rounded-control text-[13px] font-semibold text-brand-ink hover:underline ${FOCUS}`}
                  >
                    {url.replace(/^https?:\/\//, "")}
                    <ExternalLink size={13} strokeWidth={2} aria-hidden />
                  </a>
                </li>
              );
            })}
          </ul>
        </Card>
      )}
    </div>
  );
}
