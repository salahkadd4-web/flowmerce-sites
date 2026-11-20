"use client";

// Choix d'une couleur dans une fenêtre de l'éditeur : « Automatique » (si permis),
// les 8 couleurs du thème en un clic, ou une couleur personnalisée.
// Valeur : "auto" ou #rrggbb, revalidée à l'enregistrement (blocks/style.ts).

import { Check } from "lucide-react";
import { useId } from "react";
import { PALETTE } from "@/blocks/style";

type Props = {
  label: string;
  value: string | undefined;
  onChange: (value: string) => void;
  allowAuto?: boolean;
};

const HEX = /^#[0-9a-f]{6}$/i;
const RING = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";

export function ColorSwatches({ label, value, onChange, allowAuto = false }: Props) {
  const id = useId();
  const current = value && (value === "auto" || HEX.test(value)) ? value : allowAuto ? "auto" : "#ffffff";
  const inPalette = PALETTE.some((c) => c.hex.toLowerCase() === current.toLowerCase());

  return (
    <div role="group" aria-label={label} className="flex flex-col gap-2.5">
      {allowAuto && (
        <button
          type="button"
          aria-pressed={current === "auto"}
          onClick={() => onChange("auto")}
          className={`self-start rounded-md border px-2.5 py-1 text-[12px] font-semibold ${RING} ${
            current === "auto" ? "border-brand bg-brand-soft text-brand-ink" : "border-line text-body"
          }`}
        >
          Automatique (selon le fond)
        </button>
      )}
      <div className="grid grid-cols-8 gap-1.5">
        {PALETTE.map((color) => {
          const selected = color.hex.toLowerCase() === current.toLowerCase();
          return (
            <button
              key={color.hex}
              type="button"
              aria-label={color.name}
              aria-pressed={selected}
              title={color.name}
              onClick={() => onChange(color.hex)}
              className={`relative size-6 rounded-full border border-line ${RING} ${selected ? "ring-2 ring-brand ring-offset-1" : ""}`}
              style={{ backgroundColor: color.hex }}
            >
              {selected && <Check size={12} aria-hidden className="absolute inset-0 m-auto text-white mix-blend-difference" />}
            </button>
          );
        })}
      </div>
      <label htmlFor={id} className="flex items-center gap-2 text-[12px] text-body">
        <input
          id={id}
          type="color"
          value={current === "auto" ? "#ffffff" : current}
          onChange={(e) => onChange(e.target.value)}
          className={`size-7 cursor-pointer rounded border border-line bg-white p-0.5 ${RING}`}
        />
        Autre couleur
        {current !== "auto" && !inPalette && <span className="font-mono text-ink">{current}</span>}
      </label>
    </div>
  );
}
