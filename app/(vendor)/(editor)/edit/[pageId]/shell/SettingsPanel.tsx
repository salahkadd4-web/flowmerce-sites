"use client";

// Panneau des réglages, à droite : tous les réglages de la section choisie (ou de
// la page quand rien n'est choisi), en complément des barres d'outils dans la page.
// Les deux modes modifient la même page : un changement dans l'un se voit dans l'autre.

import { createUsePuck, Puck } from "@puckeditor/core";
import { X } from "lucide-react";
import { FOCUS } from "@/components/dashboard/ui";
import { BLOCK_LABELS, isBlockType } from "@/blocks/schemas";

const usePuck = createUsePuck();

export function SettingsPanel({ onClose }: { onClose: () => void }) {
  const type = usePuck((s) => s.selectedItem?.type ?? null);
  const title = type ? (isBlockType(type) ? BLOCK_LABELS[type] : type) : "Page";

  return (
    <aside aria-labelledby="settings-panel-title" className="flex w-80 shrink-0 flex-col border-s border-line bg-surface">
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <h2 id="settings-panel-title" className="text-[14px] font-bold text-ink">
          <span className="text-[12px] font-semibold tracking-wide text-faint uppercase">Réglages · </span>
          {title}
        </h2>
        <button type="button" aria-label="Masquer le panneau des réglages" title="Masquer le panneau" onClick={onClose} className={`rounded-control p-1.5 text-body hover:text-ink ${FOCUS}`}>
          <X size={16} aria-hidden />
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <Puck.Fields />
      </div>
    </aside>
  );
}
