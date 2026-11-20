"use client";

// Fenêtre « Réglages de la page » : titre de l'onglet, langue, polices, produit.
// Ce sont les réglages de la racine Puck : la section sélectionnée est
// désélectionnée, et Puck.Fields affiche alors ceux de la page. <dialog> natif :
// Échap ferme, le focus reste dans la fenêtre puis revient au bouton.

import { Puck, useGetPuck } from "@puckeditor/core";
import { X } from "lucide-react";
import { useEffect, useRef } from "react";
import { BTN_PRIMARY, FOCUS } from "@/components/dashboard/ui";

type Props = { open: boolean; onClose: () => void };

export function PageSettingsDialog({ open, onClose }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const getPuck = useGetPuck();

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (open && !element.open) {
      getPuck().dispatch({ type: "setUi", ui: { itemSelector: null } });
      element.showModal();
    }
    if (!open && element.open) element.close();
  }, [open, getPuck]);

  return (
    <dialog
      ref={dialog}
      aria-labelledby="page-settings-title"
      onClose={onClose}
      onClick={(event) => {
        // Clic sur le fond assombri (hors de la fenêtre) : fermer.
        if (event.target === event.currentTarget) onClose();
      }}
      className="m-auto w-[min(480px,calc(100vw-32px))] rounded-card border border-line bg-surface p-0 shadow-2xl backdrop:bg-ink/40"
    >
      <div className="flex items-center justify-between border-b border-line px-5 py-4">
        <h2 id="page-settings-title" className="text-[16px] font-bold text-ink">
          Réglages de la page
        </h2>
        <button type="button" aria-label="Fermer" title="Fermer" onClick={onClose} className={`rounded-control p-1.5 text-body hover:text-ink ${FOCUS}`}>
          <X size={18} aria-hidden />
        </button>
      </div>
      <div className="page-settings max-h-[65vh] overflow-y-auto">{open && <Puck.Fields />}</div>
      <div className="flex justify-end border-t border-line px-5 py-3">
        <button type="button" className={BTN_PRIMARY} onClick={onClose}>
          Terminé
        </button>
      </div>
    </dialog>
  );
}
