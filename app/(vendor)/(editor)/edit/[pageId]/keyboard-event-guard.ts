// Garde des événements clavier pour l'éditeur Puck.
//
// Puck 0.24 écoute keydown / keyup sur le document et appelle
// e.getModifierState("AltGraph") sans vérifier que l'événement est un
// KeyboardEvent. Le remplissage automatique du navigateur et certaines
// extensions (gestionnaires de mots de passe…) envoient de simples Event
// « keydown » : Puck plante alors (« e.getModifierState is not a function »).
//
// En phase de capture sur la fenêtre — donc avant les écouteurs de Puck sur
// le document —, on donne à ces événements un getModifierState qui répond
// « aucune touche de modification ». Rien n'est bloqué : tous les autres
// écouteurs reçoivent l'événement comme avant.

const TYPES = ["keydown", "keyup"] as const;

// Forme objet plutôt que `true` : l'EventTarget de Node 24 (tests) ne retire pas
// un écouteur ajouté avec le booléen. Les navigateurs acceptent les deux.
const CAPTURE = { capture: true } as const;

function patch(event: Event) {
  if (typeof (event as Partial<KeyboardEvent>).getModifierState === "function") return;
  Object.defineProperty(event, "getModifierState", { value: () => false, configurable: true });
}

/** Installe la garde sur `target` (la fenêtre de l'éditeur) ; renvoie la fonction qui la retire. */
export function installKeyboardEventGuard(target: EventTarget): () => void {
  for (const type of TYPES) target.addEventListener(type, patch, CAPTURE);
  return () => {
    for (const type of TYPES) target.removeEventListener(type, patch, CAPTURE);
  };
}
