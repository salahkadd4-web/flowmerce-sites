"use client";

// Champ Puck « curseur » : une valeur bornée, par paliers (largeur d'image,
// assombrissement d'un fond). Bornes et unité : editorOptions du champ
// (blocks/fields/editor-fields.ts).

import { FieldLabel } from "@puckeditor/core";
import { SlidersHorizontal } from "lucide-react";
import type { RangeOptions } from "@/blocks/fields/editor-fields";

type Props = {
  id: string;
  field: { label?: string; editorOptions?: RangeOptions };
  value: number | undefined;
  onChange: (value: number) => void;
  readOnly?: boolean;
};

const FALLBACK: RangeOptions = { min: 0, max: 100, step: 10, unit: "%" };

export function RangeField({ id, field, value, onChange, readOnly }: Props) {
  const { min, max, step, unit } = field.editorOptions ?? FALLBACK;
  const current = typeof value === "number" ? value : max;
  const shown = `${current} ${unit}`.trim();

  return (
    <FieldLabel label={field.label ?? ""} icon={<SlidersHorizontal size={16} />} el="div" readOnly={readOnly}>
      <div className="flex items-center gap-3">
        <input
          id={id}
          type="range"
          min={min}
          max={max}
          step={step}
          value={current}
          disabled={readOnly}
          aria-valuetext={shown}
          aria-label={field.label}
          onChange={(e) => onChange(Number(e.target.value))}
          className="h-2 flex-1 cursor-pointer accent-brand disabled:cursor-not-allowed"
        />
        <output htmlFor={id} className="w-12 text-end text-[13px] font-semibold tabular-nums text-ink">
          {shown}
        </output>
      </div>
    </FieldLabel>
  );
}
