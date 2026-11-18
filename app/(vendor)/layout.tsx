// app/layout.tsx — Flowmerce Sites
//
// Layout racine commun à l'espace vendeur et aux sites publics.
// Police et jetons identiques à flowmerce-web-app.

import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "../globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Flowmerce Sites",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" className={jakarta.variable}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
