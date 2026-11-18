// Titre d'une page publique : celui de l'éditeur, sinon celui de la page,
// sinon le nom du site. Une chaîne vide ou faite d'espaces compte comme absente.

export function pageTitle(rootTitle: unknown, title: string, siteName: string): string {
  for (const candidate of [rootTitle, title, siteName]) {
    if (typeof candidate === "string" && candidate.trim() !== "") return candidate.trim();
  }
  return siteName;
}
