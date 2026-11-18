// « Mes sites » — liste des sites du vendeur connecté, avec création, édition et aperçu.
// Structure de liste reprise de flowmerce-web-app (app/dashboard/api-keys/page.tsx).

import Link from "next/link";
import { Eye, ExternalLink, Globe, PenLine, Plus, Truck } from "lucide-react";
import {
  BTN_GHOST,
  BTN_PRIMARY,
  Card,
  EmptyState,
  FOCUS,
  PageHeader,
  SiteStatusBadge,
} from "@/components/dashboard/ui";
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
      <PageHeader
        title="Mes sites"
        subtitle={`${sites.length} site${sites.length !== 1 ? "s" : ""}.`}
        action={
          sites.length > 0 && (
            <Link href="/sites/new" className={BTN_PRIMARY}>
              <Plus size={15} strokeWidth={2} aria-hidden />
              Créer un site
            </Link>
          )
        }
      />

      {sites.length === 0 ? (
        <Card padded={false}>
          <EmptyState
            icon={Globe}
            title="Aucun site pour l'instant."
            hint="Créez votre landing page en quelques minutes, puis publiez-la sur votre propre adresse."
            action={
              <Link href="/sites/new" className={BTN_PRIMARY}>
                <Plus size={15} strokeWidth={2} aria-hidden />
                Créer mon premier site
              </Link>
            }
          />
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

                  {site.status === "PUBLISHED" ? (
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`mt-3 inline-flex items-center gap-1.5 rounded-control text-[13px] font-semibold text-brand-ink hover:underline ${FOCUS}`}
                    >
                      {url.replace(/^https?:\/\//, "")}
                      <ExternalLink size={13} strokeWidth={2} aria-hidden />
                    </a>
                  ) : site.status === "SUSPENDED" ? (
                    <p className="mt-3 text-[13px] font-medium text-red-800">
                      Site suspendu : il n&apos;est plus visible et ne peut pas être publié.
                    </p>
                  ) : (
                    <p className="mt-3 text-[13px] text-body">
                      Pas encore en ligne : publiez-le depuis l&apos;éditeur.
                    </p>
                  )}

                  <div className="mt-4 flex flex-wrap gap-2">
                    {site.homePageId && (
                      <>
                        <Link href={`/edit/${site.homePageId}`} className={BTN_GHOST}>
                          <PenLine size={15} aria-hidden />
                          Modifier la page
                        </Link>
                        <a href={`/preview/${site.homePageId}`} target="_blank" rel="noopener noreferrer" className={BTN_GHOST}>
                          <Eye size={15} aria-hidden />
                          Aperçu
                        </a>
                      </>
                    )}
                    <Link href={`/sites/${site.id}/livraison`} className={BTN_GHOST}>
                      <Truck size={15} aria-hidden />
                      Livraison
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
      )}
    </div>
  );
}
