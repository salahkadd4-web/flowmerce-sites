"use client";

// Formulaire de création de site — champs écrits comme le formulaire « Créer une
// clé » de flowmerce-web-app (libellé au-dessus, aide et erreur en dessous).

import { useActionState, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { BTN_PRIMARY, FIELD, FIELD_ERROR, HINT, LABEL } from "@/components/dashboard/ui";
import { siteUrl } from "@/lib/host";
import { slugifySubdomain } from "@/lib/subdomain";
import { createSite, type CreateSiteState } from "./actions";

type Props = { rootDomain: string; protocol: "http" | "https"; port?: string };

export function NewSiteForm({ rootDomain, protocol, port }: Props) {
  const [state, action, pending] = useActionState<CreateSiteState, FormData>(createSite, {});
  const [name, setName] = useState("");
  const [subdomain, setSubdomain] = useState("");
  // Le sous-domaine suit le nom tant que le vendeur ne l'a pas modifié lui-même.
  const [subdomainEdited, setSubdomainEdited] = useState(false);

  const nameError = state.field === "name" ? state.error : undefined;
  const subdomainError = state.field === "subdomain" ? state.error : undefined;
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

      <fieldset>
        <legend className={LABEL}>Modèle</legend>
        <label className="flex cursor-pointer items-start gap-3 rounded-card border-2 border-brand bg-brand-soft p-4">
          <input type="radio" name="template" value="landing-fr" defaultChecked className="sr-only" />
          <span
            aria-hidden
            className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-brand text-on-brand"
          >
            <Check size={12} strokeWidth={3} />
          </span>
          <span className="min-w-0">
            <span className="block text-[14px] font-bold text-ink">Landing page — produit unique</span>
            <span className="mt-0.5 block text-[12px] text-body">
              Bannière, avantages, photo et pied de page, en français. Le formulaire de commande arrive bientôt.
            </span>
          </span>
        </label>
      </fieldset>

      <div>
        <button type="submit" disabled={pending} className={BTN_PRIMARY}>
          {pending && <Loader2 size={15} className="animate-spin" aria-hidden />}
          {pending ? "Création" : "Créer le site"}
        </button>
      </div>
    </form>
  );
}
