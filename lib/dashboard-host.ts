// lib/dashboard-host.ts — l'hôte de la requête est-il l'espace vendeur ?
//
// Utilisé par le proxy (lib/routing.ts) et, en seconde barrière, par chaque
// server action de l'espace vendeur : une action ne doit pas dépendre du seul
// matcher du proxy pour refuser un appel venu d'un site vendeur.

export function isDashboardHost(host: string | null, dashboardHost: string): boolean {
  const value = host?.trim().toLowerCase();
  return !!value && value === dashboardHost.toLowerCase();
}
