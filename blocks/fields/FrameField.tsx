"use client";

// Champ Puck « cadre d'une image » (panneau des réglages) : proportions naturelles
// de la photo, ou cadre choisi — sa hauteur en % de sa largeur, de 30 à 200 par pas
// de 5. Même réglage que les poignées du haut et du bas de l'image dans la page.

import { FieldLabel } from "@puckeditor/core";
import { Proportions } from "lucide-react";

type Props = {
  id: string;
  field: { label?: string };
  value: number | null | undefined;
  onChange: (value: number | null) => void;
  readOnly?: boolean;
};

export function FrameField({ id, field, value, onChange, readOnly }: Props) {
  const framed = typeof value === "number";
  const current = framed ? value : 100;
  const choice = "rounded px-2 py-1.5 text-[12px] font-semibold flex-1 focus-visible:outline-2 focus-visible:outline-brand";

  return (
    <FieldLabel label={field.label ?? ""} icon={<Proportions size={16} />} el="div" readOnly={readOnly}>
      <div className="flex flex-col gap-3">
        <div role="radiogroup" aria-label={field.label} className="flex rounded-md border border-line bg-surface p-0.5">
          <button
            type="button"
            role="radio"
            aria-checked={!framed}
            disabled={readOnly}
            onClick={() => onChange(null)}
            className={`${choice} ${!framed ? "bg-white text-brand-ink shadow-sm" : "text-body"}`}
          >
            Proportions de la photo
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={framed}
            disabled={readOnly}
            onClick={() => onChange(current)}
            className={`${choice} ${framed ? "bg-white text-brand-ink shadow-sm" : "text-body"}`}
          >
            Cadre choisi
          </button>
        </div>
        {framed && (
          <div className="flex items-center gap-3">
            <input
              id={id}
              type="range"
              min={30}
              max={200}
              step={5}
              value={current}
              disabled={readOnly}
              aria-label="Hauteur du cadre, en % de la largeur"
              aria-valuetext={`${current} %`}
              onChange={(e) => onChange(Number(e.target.value))}
              className="h-2 flex-1 cursor-pointer accent-brand"
            />
            <output htmlFor={id} className="w-12 text-end text-[13px] font-semibold tabular-nums text-ink">
              {current} %
            </output>
          </div>
        )}
      </div>
    </FieldLabel>
  );
}
