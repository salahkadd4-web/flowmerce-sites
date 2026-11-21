// « Créer un site » — nom, sous-domaine, modèle ; puis ouverture de l'éditeur.

import { Card, CardTitle, PageHeader } from "@/components/dashboard/ui";
import { auth } from "@/lib/auth";
import { listCustomTemplates } from "@/lib/custom-templates";
import { env } from "@/lib/env";
import { TEMPLATES } from "@/templates";
import { NewSiteForm } from "./NewSiteForm";

export default async function NewSitePage() {
  // Modèles du vendeur après ceux de Flowmerce (le layout du tableau de bord garantit la session).
  const session = await auth();
  const mine = session?.user ? await listCustomTemplates(session.user.id) : [];
  return (
    <div className="w-full max-w-5xl p-5 sm:p-10">
      <PageHeader
        title="Créer un site"
        subtitle="Choisissez un nom et une adresse. Vous pourrez tout modifier dans l'éditeur avant de publier."
      />
      <Card>
        <CardTitle>Votre site</CardTitle>
        <NewSiteForm
          rootDomain={env.SITES_ROOT_DOMAIN}
          protocol={env.SITES_PROTOCOL}
          port={env.SITES_PORT}
          // Le contenu des modèles reste sur le serveur : le formulaire n'en reçoit que la carte.
          templates={[
            ...TEMPLATES.map(({ id, name, category, description, preview }) => ({ id, name, category, description, preview })),
            ...mine.map((t) => ({ id: `perso:${t.id}`, name: t.name, category: `Mon modèle · ${t.category}`, description: "Votre modèle enregistré", preview: null, cover: t.cover })),
          ]}
        />
      </Card>
    </div>
  );
}
