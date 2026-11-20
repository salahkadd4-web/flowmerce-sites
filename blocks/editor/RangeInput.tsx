"use client";

// Curseur d'une fenêtre de l'éditeur (assombrissement d'un fond…), valeur affichée.
// La valeur s'écrit dans la page au relâchement : une seule étape d'historique.

import { useId, useState } from "react";

type Props = { label: string; value: number; min: number; max: number; step: number; unit: string; onCommit: (value: number) => void };

export function RangeInput({ label, value, min, max, step, unit, onCommit }: Props) {
  const id = useId();
  const [draft, setDraft] = useState<number | null>(null);
  const current = draft ?? value;
  const commit = () => {
    if (draft !== null && draft !== value) onCommit(draft);
    setDraft(null);
  };
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-[12px] font-semibold text-body">
        {label}
      </label>
      <div className="flex items-center gap-3">
        <input
          id={id}
          type="range"
          min={min}
          max={max}
          step={step}
          value={current}
          aria-valuetext={`${current} ${unit}`}
          onChange={(e) => setDraft(Number(e.target.value))}
          onPointerUp={commit}
          onKeyUp={commit}
          onBlur={commit}
          className="h-2 flex-1 cursor-pointer accent-brand"
        />
        <output htmlFor={id} className="w-12 text-end text-[13px] font-semibold tabular-nums text-ink">
          {current} {unit}
        </output>
      </div>
    </div>
  );
}
