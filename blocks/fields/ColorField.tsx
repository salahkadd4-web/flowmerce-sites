"use client";

// Champ Puck « couleur » : « Automatique » (si permis), les 8 couleurs du thème
// en un clic, ou une couleur personnalisée. La valeur est "auto" ou un #rrggbb,
// revalidé à l'enregistrement (blocks/style.ts).

import { FieldLabel } from "@puckeditor/core";
import { Check, Palette } from "lucide-react";
import type { ColorOptions } from "@/blocks/fields/editor-fields";
import { PALETTE } from "@/blocks/style";
import { FOCUS } from "@/components/dashboard/ui";

type Props = {
  id: string;
  field: { label?: string; editorOptions?: ColorOptions };
  value: string | undefined;
  onChange: (value: string) => void;
  readOnly?: boolean;
};

const HEX = /^#[0-9a-f]{6}$/i;

export function ColorField({ id, field, value, onChange, readOnly }: Props) {
  const allowAuto = field.editorOptions?.auto ?? false;
  const current = value && (value === "auto" || HEX.test(value)) ? value : allowAuto ? "auto" : "#ffffff";
  const inPalette = PALETTE.some((c) => c.hex.toLowerCase() === current.toLowerCase());
  const swatch = `relative size-7 rounded-full border border-line ${FOCUS} disabled:cursor-not-allowed`;

  return (
    <FieldLabel label={field.label ?? ""} icon={<Palette size={16} />} el="div" readOnly={readOnly}>
      <div className="flex flex-col gap-2" role="group" aria-label={field.label}>
        {allowAuto && (
          <button
            type="button"
            aria-pressed={current === "auto"}
            disabled={readOnly}
            onClick={() => onChange("auto")}
            className={`self-start rounded-control border px-2.5 py-1 text-[12px] font-semibold ${FOCUS} ${
              current === "auto" ? "border-brand bg-brand-soft text-brand-ink" : "border-line text-body"
            }`}
          >
            Automatique (selon le fond)
          </button>
        )}
        <div className="flex flex-wrap items-center gap-2">
          {PALETTE.map((color) => {
            const selected = color.hex.toLowerCase() === current.toLowerCase();
            return (
              <button
                key={color.hex}
                type="button"
                aria-label={color.name}
                aria-pressed={selected}
                title={color.name}
                disabled={readOnly}
                onClick={() => onChange(color.hex)}
                className={`${swatch} ${selected ? "ring-2 ring-brand ring-offset-1" : ""}`}
                style={{ backgroundColor: color.hex }}
              >
                {selected && (
                  <Check size={14} aria-hidden className="absolute inset-0 m-auto text-white mix-blend-difference" />
                )}
              </button>
            );
          })}
        </div>
        <label htmlFor={id} className="flex items-center gap-2 text-[12px] text-body">
          <input
            id={id}
            type="color"
            disabled={readOnly}
            value={current === "auto" ? "#ffffff" : current}
            onChange={(e) => onChange(e.target.value)}
            className={`size-7 cursor-pointer rounded border border-line bg-white p-0.5 ${FOCUS}`}
          />
          Personnalisée
          {current !== "auto" && !inPalette && <span className="font-mono text-ink">{current}</span>}
        </label>
      </div>
    </FieldLabel>
  );
}
