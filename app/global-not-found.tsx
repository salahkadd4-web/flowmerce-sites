// 404 des adresses qui ne correspondent à aucune route (hôte vendeur).
// L'application a deux layouts racines (espace vendeur, sites) : ce fichier ne
// passe par aucun des deux, d'où son propre <html> et l'import des styles.
// Les sites vendeurs ont leur propre 404 (app/s/[host]/[[...slug]]/not-found.tsx).

import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Page introuvable",
};

export default function GlobalNotFound() {
  return (
    <html lang="fr">
      <body className="bg-page text-ink antialiased">
        <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-4 text-center">
          <h1 className="text-2xl font-bold">Page introuvable</h1>
          <p className="mt-2 text-[15px] text-body">Cette adresse ne correspond à aucune page.</p>
          <Link
            href="/"
            className="mt-6 font-semibold text-brand-ink hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            Retour à l&apos;espace vendeur
          </Link>
        </main>
      </body>
    </html>
  );
}
