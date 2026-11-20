// Transformations de rendu des pages publiques (Render de @puckeditor/core/rsc).
//
// Sans elles, Puck convertit lui-même chaque champ « richtext » en HTML (tiptap +
// injection) avant de le passer au bloc : notre lecteur sûr (blocks/rich-text.tsx)
// serait contourné et un <div> se retrouverait dans les titres. Le texte arrive
// donc tel qu'enregistré (déjà nettoyé), et RichText le lit.

export const PUBLIC_FIELD_TRANSFORMS = {
  richtext: ({ value }: { value: unknown }) => value,
};
