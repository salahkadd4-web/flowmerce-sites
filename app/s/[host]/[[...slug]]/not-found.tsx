// 404 d'un site vendeur : neutre, sans la marque Flowmerce — l'acheteur est
// sur la boutique du vendeur, pas sur la plateforme.

export default function SiteNotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-4 text-center">
      <h1 className="text-2xl font-bold text-ink">Page introuvable</h1>
      <p className="mt-2 text-[15px] text-body">Cette page n&apos;existe pas ou n&apos;est plus en ligne.</p>
    </main>
  );
}
