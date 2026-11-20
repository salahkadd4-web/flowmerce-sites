// Remplace next/font/google dans les tests unitaires (alias de vitest.config.mts) :
// les polices sont téléchargées par Next à la construction, pas dans un test.

function font(name: string) {
  return () => ({ className: "", variable: "", style: { fontFamily: `'${name}'` } });
}

export const Cairo = font("Cairo");
export const Tajawal = font("Tajawal");
export const Almarai = font("Almarai");
export const IBM_Plex_Sans_Arabic = font("IBM Plex Sans Arabic");
export const Noto_Kufi_Arabic = font("Noto Kufi Arabic");
export const Amiri = font("Amiri");
export const Plus_Jakarta_Sans = font("Plus Jakarta Sans");
