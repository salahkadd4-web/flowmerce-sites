"use client";

// Fenêtre « Ajouter une section » : chaque type de section, son icône et ce qu'il
// contient. Un clic l'ajoute après la section choisie (sinon à la fin), la choisit
// et l'amène à l'écran.

import { useGetPuck } from "@puckeditor/core";
import { X } from "lucide-react";
import { useEffect, useRef } from "react";
import { FOCUS } from "@/components/dashboard/ui";
import { BLOCK_DESCRIPTIONS, BLOCK_LABELS, type BlockType } from "@/blocks/schemas";
import { BLOCK_ICONS } from "./block-icons";
import { insertionIndex, ROOT_ZONE } from "./sections";
import { scrollToSection } from "./SectionsColumn";

type Props = { open: boolean; onClose: () => void };

/** Dans l'ordre où elles se suivent d'habitude sur une landing page. */
const ADD_ORDER: readonly BlockType[] = ["Hero", "Product", "Text", "Image", "OrderForm", "Footer"];

export function AddSectionDialog({ open, onClose }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const getPuck = useGetPuck();

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (open && !element.open) element.showModal();
    if (!open && element.open) element.close();
  }, [open]);

  const add = (type: string) => {
    const { appState, dispatch } = getPuck();
    const selector = appState.ui.itemSelector;
    const selected = selector && (selector.zone ?? ROOT_ZONE) === ROOT_ZONE ? selector.index : null;
    const index = insertionIndex(selected, appState.data.content.length);
    const id = `${type}-${crypto.randomUUID()}`;
    dispatch({ type: "insert", componentType: type, destinationIndex: index, destinationZone: ROOT_ZONE, id });
    dispatch({ type: "setUi", ui: { itemSelector: { index, zone: ROOT_ZONE } } });
    onClose();
    // L'aperçu affiche la nouvelle section au rendu suivant.
    setTimeout(() => scrollToSection(id), 150);
  };

  return (
    <dialog
      ref={dialog}
      aria-labelledby="add-section-title"
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      className="m-auto w-[min(560px,calc(100vw-32px))] rounded-card border border-line bg-surface p-0 shadow-2xl backdrop:bg-ink/40"
    >
      <div className="flex items-center justify-between border-b border-line px-5 py-4">
        <h2 id="add-section-title" className="text-[16px] font-bold text-ink">
          Ajouter une section
        </h2>
        <button type="button" aria-label="Fermer" title="Fermer" onClick={onClose} className={`rounded-control p-1.5 text-body hover:text-ink ${FOCUS}`}>
          <X size={18} aria-hidden />
        </button>
      </div>
      <ul className="grid grid-cols-1 gap-2 p-4 sm:grid-cols-2">
        {ADD_ORDER.map((type) => {
          const Icon = BLOCK_ICONS[type];
          return (
            <li key={type}>
              <button
                type="button"
                onClick={() => add(type)}
                className={`flex h-full w-full items-start gap-3 rounded-card border border-line bg-surface p-3 text-start transition-colors hover:border-brand hover:bg-brand-soft ${FOCUS}`}
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-control bg-brand-soft text-brand">
                  <Icon size={18} aria-hidden />
                </span>
                <span className="min-w-0">
                  <span className="block text-[14px] font-bold text-ink">{BLOCK_LABELS[type]}</span>
                  <span className="mt-0.5 block text-[12px] leading-snug text-body">{BLOCK_DESCRIPTIONS[type]}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </dialog>
  );
}
