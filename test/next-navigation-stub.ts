// Remplace next/navigation dans les tests unitaires (alias de vitest.config.mts) :
// useRouter exige le routeur de Next, absent d'un rendu de test. La navigation
// réelle est vérifiée dans le navigateur.

const router = { push: () => {}, replace: () => {}, refresh: () => {}, back: () => {}, forward: () => {}, prefetch: () => {} };

export function useRouter() {
  return router;
}

export function usePathname() {
  return "/";
}

export function useSearchParams() {
  return new URLSearchParams();
}
