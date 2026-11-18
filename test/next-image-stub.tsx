// Remplace next/image dans les tests unitaires (alias de vitest.config.mts).
// next/image a besoin du runtime Next ; les tests vérifient seulement ce que nos
// blocs lui passent. Un alias plutôt que vi.mock : sous Windows, le double
// chargement de vitest (lettre de lecteur en minuscule) empêche vi.mock de s'appliquer.

/* eslint-disable @next/next/no-img-element, jsx-a11y/alt-text */
export default function NextImageStub({ priority: _priority, ...props }: Record<string, unknown>) {
  return <img {...(props as React.ImgHTMLAttributes<HTMLImageElement>)} />;
}
