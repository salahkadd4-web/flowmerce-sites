// app/s/[host]/layout.tsx — layout racine des sites vendeurs.
//
// Séparé de celui de l'espace vendeur (app/(vendor)/layout.tsx) : la langue et
// le sens d'écriture viennent du site, et l'acheteur ne télécharge aucune
// police (pile système). La navigation entre les deux layouts recharge la page,
// ce qui n'arrive jamais : un site et l'espace vendeur n'ont pas le même hôte.

import "../../globals.css";
import { getSiteByHost } from "@/lib/tenant";

const SYSTEM_FONTS = 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

export default async function SiteRootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ host: string }>;
}) {
  const { host } = await params;
  const site = await getSiteByHost(host);
  const locale = site?.locale ?? "fr";

  return (
    <html lang={locale} dir={locale === "ar" ? "rtl" : "ltr"}>
      <body className="bg-white text-ink antialiased" style={{ fontFamily: SYSTEM_FONTS }}>
        {children}
      </body>
    </html>
  );
}
