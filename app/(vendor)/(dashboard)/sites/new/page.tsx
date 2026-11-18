// « Créer un site » — nom, sous-domaine, modèle ; puis ouverture de l'éditeur.

import { Card, CardTitle, PageHeader } from "@/components/dashboard/ui";
import { env } from "@/lib/env";
import { NewSiteForm } from "./NewSiteForm";

export default function NewSitePage() {
  return (
    <div className="w-full max-w-3xl p-5 sm:p-10">
      <PageHeader
        title="Créer un site"
        subtitle="Choisissez un nom et une adresse. Vous pourrez tout modifier dans l'éditeur avant de publier."
      />
      <Card>
        <CardTitle>Votre site</CardTitle>
        <NewSiteForm rootDomain={env.SITES_ROOT_DOMAIN} protocol={env.SITES_PROTOCOL} port={env.SITES_PORT} />
      </Card>
    </div>
  );
}
