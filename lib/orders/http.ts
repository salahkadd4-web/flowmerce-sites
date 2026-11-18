// Contrôles HTTP de POST /api/orders, avant toute lecture du corps.
//
// JSON obligatoire : un formulaire HTML ne peut pas poster du JSON depuis un autre
// site sans requête préalable (CORS). Origin obligatoire et égale à l'hôte : la
// commande vient de la page du site lui-même.

export function checkOrderRequest(headers: {
  host: string | null;
  origin: string | null;
  contentType: string | null;
}): string | null {
  if (!headers.contentType?.toLowerCase().startsWith("application/json")) return "Format de requête non pris en charge";
  if (!headers.host || !headers.origin) return "Origine de la requête manquante";

  let originHost: string;
  try {
    originHost = new URL(headers.origin).host.toLowerCase();
  } catch {
    return "Origine de la requête invalide";
  }
  return originHost === headers.host.toLowerCase() ? null : "Origine de la requête refusée";
}
