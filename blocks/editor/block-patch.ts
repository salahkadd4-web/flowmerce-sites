// Mise à jour d'un bloc depuis la page (barres d'outils de l'éditeur).
//
// Toujours par une action « replace » de Puck : la modification entre dans
// l'historique et Ctrl+Z l'annule. Un groupe de réglages absent (page enregistrée
// avant ces réglages) part de ses valeurs par défaut, pour qu'un premier
// changement écrive un groupe complet et valide.

import type { PuckApi } from "@puckeditor/core";
import { DEFAULT_BUTTON, DEFAULT_SECTION_STYLE, DEFAULT_TYPOGRAPHY } from "@/blocks/style";

type Props = Record<string, unknown>;
type GetPuck = () => PuckApi;

export const GROUP_DEFAULTS: Record<string, Props> = {
  typography: DEFAULT_TYPOGRAPHY,
  button: DEFAULT_BUTTON,
  style: DEFAULT_SECTION_STYLE,
};

function isObject(value: unknown): value is Props {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Groupe de réglages d'un bloc, complété par ses valeurs par défaut. */
export function readGroup<T extends object>(props: Props, key: string, defaults: T): T {
  const group = props[key];
  return isObject(group) ? ({ ...defaults, ...group } as T) : defaults;
}

/** Copie des réglages avec une valeur écrite à « groupe.réglage » ou « réglage ». */
export function withPath(props: Props, path: string, value: unknown, defaults: Record<string, Props> = {}): Props {
  const [head, ...rest] = path.split(".");
  if (rest.length === 0) return { ...props, [head]: value };
  const base = readGroup(props, head, defaults[head] ?? {});
  return { ...props, [head]: withPath(base, rest.join("."), value, {}) };
}

/** Remplace les réglages d'un bloc ; sans effet si le bloc n'existe plus. */
export function updateBlock(getPuck: GetPuck, id: string, change: (props: Props) => Props): void {
  const { getItemById, getSelectorForId, dispatch } = getPuck();
  const item = getItemById(id);
  const selector = getSelectorForId(id);
  if (!item || !selector) return;
  dispatch({
    type: "replace",
    destinationIndex: selector.index,
    destinationZone: selector.zone,
    data: { ...item, props: change(item.props as Props) as typeof item.props },
  });
}

/** Remplace les réglages de la page (langue, polices, produit…). */
export function updateRoot(getPuck: GetPuck, change: (props: Props) => Props): void {
  const { appState, dispatch } = getPuck();
  const root = appState.data.root;
  dispatch({ type: "replaceRoot", root: { ...root, props: change((root.props ?? {}) as Props) } });
}
