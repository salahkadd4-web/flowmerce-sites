"use client";

// Formulaire de création de site — champs écrits comme le formulaire « Créer une
// clé » de flowmerce-web-app (libellé au-dessus, aide et erreur en dessous).

import { useActionState, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { BTN_PRIMARY, FIELD, FIELD_ERROR, HINT, LABEL } from "@/components/dashboard/ui";
import { TemplatePreview, type TemplateCover } from "@/components/templates/TemplatePreview";
import { siteUrl } from "@/lib/host";
import { slugifySubdomain } from "@/lib/subdomain";
import { createSite, type CreateSiteState } from "./actions";

/** Ce que le formulaire montre d'un modèle (sans son contenu). */
export type TemplateCard = { id: string; name: string; category: string; description: string; preview: string | null; cover?: TemplateCover };

type Props = { rootDomain: string; protocol: "http" | "https"; port?: string; templates: TemplateCard[] };

export function NewSiteForm({ rootDomain, protocol, port, templates }: Props) {
  const [state, action, pending] = useActionState<CreateSiteState, FormData>(createSite, {});
  const [name, setName] = useState("");
  const [subdomain, setSubdomain] = useState("");
  // Le sous-domaine suit le nom tant que le vendeur ne l'a pas modifié lui-même.
  const [subdomainEdited, setSubdomainEdited] = useState(false);
  const [templateId, setTemplateId] = useState(templates[0]?.id ?? "");

  const nameError = state.field === "name" ? state.error : undefined;
  const subdomainError = state.field === "subdomain" ? state.error : undefined;
  const templateError = state.field === "template" ? state.error : undefined;
  const address = siteUrl(subdomain || "votre-boutique", { rootDomain, protocol, port }).replace(/^https?:\/\//, "");

  return (
    <form action={action} className="flex flex-col gap-6" noValidate>
      <div>
        <label htmlFor="site-name" className={LABEL}>
          Nom du site
        </label>
        <input
          id="site-name"
          name="name"
          type="text"
          required
          maxLength={60}
          autoFocus
          disabled={pending}
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (!subdomainEdited) setSubdomain(slugifySubdomain(e.target.value));
          }}
          aria-invalid={nameError ? true : undefined}
          aria-describedby={nameError ? "site-name-error" : undefined}
          className={FIELD}
        />
        {nameError && (
          <p id="site-name-error" role="alert" className={FIELD_ERROR}>
            {nameError}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="site-subdomain" className={LABEL}>
          Sous-domaine
        </label>
        <input
          id="site-subdomain"
          name="subdomain"
          type="text"
          required
          maxLength={63}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          disabled={pending}
          value={subdomain}
          onChange={(e) => {
            setSubdomainEdited(true);
            setSubdomain(e.target.value.toLowerCase());
          }}
          aria-invalid={subdomainError ? true : undefined}
          aria-describedby={subdomainError ? "site-subdomain-hint site-subdomain-error" : "site-subdomain-hint"}
          className={FIELD}
        />
        <p id="site-subdomain-hint" className={HINT}>
          Adresse du site : <span className="font-semibold text-body">{address}</span>
        </p>
        {subdomainError && (
          <p id="site-subdomain-error" role="alert" className={FIELD_ERROR}>
            {subdomainError}
          </p>
        )}
      </div>

      <fieldset aria-describedby={templateError ? "site-template-error" : undefined}>
        <legend className={LABEL}>Modèle</legend>
        <p className={`${HINT} -mt-1 mb-3`}>Un point de départ complet : vous changerez textes, photos et couleurs dans l&apos;éditeur.</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => {
            const checked = template.id === templateId;
            return (
              <label
                key={template.id}
                className={`group flex cursor-pointer flex-col overflow-hidden rounded-card border-2 bg-surface transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-brand ${
                  checked ? "border-brand" : "border-line hover:border-brand/40"
                }`}
              >
                <input
                  type="radio"
                  name="template"
                  value={template.id}
                  checked={checked}
                  disabled={pending}
                  onChange={() => setTemplateId(template.id)}
                  className="sr-only"
                />
                <span className="relative block aspect-[4/5] overflow-hidden bg-page">
                  <TemplatePreview preview={template.preview} cover={template.cover} />
                  {checked && (
                    <span aria-hidden className="absolute end-2 top-2 flex size-6 items-center justify-center rounded-full bg-brand text-on-brand shadow">
                      <Check size={14} strokeWidth={3} />
                    </span>
                  )}
                </span>
                <span className="flex flex-col gap-0.5 p-3">
                  <span className="text-[11px] font-bold tracking-wide text-brand-ink uppercase">{template.category}</span>
                  <span className="text-[14px] font-bold text-ink">{template.name}</span>
                  <span className="text-[12px] leading-snug text-body">{template.description}</span>
                </span>
              </label>
            );
          })}
        </div>
        {templateError && (
          <p id="site-template-error" role="alert" className={FIELD_ERROR}>
            {templateError}
          </p>
        )}
      </fieldset>

      <div className="flex items-start gap-3 rounded-card border border-line bg-page p-4">
        <input
          id="site-ai-consent"
          name="aiTrainingConsent"
          type="checkbox"
          disabled={pending}
          aria-describedby="site-ai-consent-hint"
          className="mt-0.5 size-4 shrink-0 cursor-pointer accent-brand"
        />
        <div>
          <label htmlFor="site-ai-consent" className="cursor-pointer text-[14px] font-semibold text-ink">
            J&apos;accepte que mes modèles de pages servent à améliorer le générateur de modèles de Flowmerce
          </label>
          <p id="site-ai-consent-hint" className={HINT}>
            Facultatif. Vos pages et vos modèles pourront servir à entraîner un modèle d&apos;intelligence artificielle qui propose des
            modèles. Vos commandes et les coordonnées de vos clients n&apos;en font jamais partie. Vous pouvez retirer cet accord à tout
            moment, depuis la fenêtre « Modèles » de l&apos;éditeur.
          </p>
        </div>
      </div>

      <div>
        <button type="submit" disabled={pending} className={BTN_PRIMARY}>
          {pending && <Loader2 size={15} className="animate-spin" aria-hidden />}
          {pending ? "Création" : "Créer le site"}
        </button>
      </div>
    </form>
  );
}
