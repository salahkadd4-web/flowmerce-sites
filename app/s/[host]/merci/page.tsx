// Page Merci d'un site, après une commande. Segment statique : prioritaire sur
// [[...slug]]. La référence vient de l'URL et n'est vérifiée que par son format :
// aucune lecture en base, rien d'autre n'est exposé à qui devinerait une référence.

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { isOrderReference } from "@/lib/orders/reference";
import { getSiteByHost } from "@/lib/tenant";

export const metadata: Metadata = { title: "Merci pour votre commande", robots: { index: false } };

type Props = {
  params: Promise<{ host: string }>;
  searchParams: Promise<{ ref?: string | string[] }>;
};

export default async function ThankYouPage({ params, searchParams }: Props) {
  const { host } = await params;
  const site = await getSiteByHost(host);
  if (!site) notFound();

  const { ref } = await searchParams;
  const reference = typeof ref === "string" && isOrderReference(ref) ? ref : null;

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-4 py-12 text-center">
      <span aria-hidden className="mb-5 flex size-14 items-center justify-center rounded-full bg-green-50 text-3xl text-green-700">
        ✓
      </span>
      <h1 className="text-2xl font-bold text-ink">Merci ! Votre commande est enregistrée.</h1>
      {reference && (
        <p className="mt-4 text-[15px] text-body">
          Référence de votre commande :{" "}
          <span className="font-mono text-lg font-bold tracking-wider text-ink">{reference}</span>
        </p>
      )}
      <p className="mt-4 text-[15px] leading-relaxed text-body">
        {site.name} va vous appeler pour confirmer votre commande. Gardez votre téléphone à portée de main.
      </p>
      <p className="mt-2 text-[15px] text-body">Vous paierez à la livraison.</p>
      <Link href="/" className="mt-8 font-semibold text-brand-ink hover:underline">
        Retour à la boutique
      </Link>
    </main>
  );
}
