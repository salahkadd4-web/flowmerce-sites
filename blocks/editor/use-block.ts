"use client";

// La section choisie dans la page, et de quoi la modifier (barres d'outils).

import { createUsePuck, useGetPuck } from "@puckeditor/core";
import { useCallback } from "react";
import { GROUP_DEFAULTS, updateBlock, updateRoot, withPath } from "./block-patch";

const usePuck = createUsePuck();

export type BlockProps = Record<string, unknown> & { id: string };

export function useSelectedBlock() {
  const selected = usePuck((s) => s.selectedItem);
  const getPuck = useGetPuck();
  const id = (selected?.props as BlockProps | undefined)?.id ?? null;

  /** Écrit une valeur à « groupe.réglage » ou « réglage » dans la section choisie. */
  const set = useCallback(
    (path: string, value: unknown) => {
      if (id) updateBlock(getPuck, id, (props) => withPath(props, path, value, GROUP_DEFAULTS));
    },
    [getPuck, id],
  );

  return { id, type: selected?.type ?? null, props: (selected?.props ?? {}) as BlockProps, set };
}

/** Réglages de la page (langue, polices, produit), et de quoi les modifier. */
export function usePageRoot() {
  const rootProps = usePuck((s) => s.appState.data.root.props ?? {}) as Record<string, unknown>;
  const getPuck = useGetPuck();
  const setRoot = useCallback((key: string, value: unknown) => updateRoot(getPuck, (props) => ({ ...props, [key]: value })), [getPuck]);
  return { rootProps, setRoot };
}

/** Modifie un bloc donné par son identifiant (barres placées dans le bloc). */
export function useBlockSetter(id: string) {
  const getPuck = useGetPuck();
  return useCallback(
    (path: string, value: unknown) => updateBlock(getPuck, id, (props) => withPath(props, path, value, GROUP_DEFAULTS)),
    [getPuck, id],
  );
}
