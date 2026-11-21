"use client";

// Boîte d'image de l'éditeur, comme dans Google Slides : quand sa section est
// choisie, un cadre et huit poignées. Les côtés règlent la largeur (l'image reste
// centrée), le haut et le bas la hauteur du cadre (la photo le remplit, rognée,
// jamais déformée), un coin la largeur en gardant les proportions. L'aperçu suit le
// geste, la valeur s'écrit au relâchement (annulable par Ctrl+Z).
// Injectée par editor-config.ts : jamais envoyée aux acheteurs.

import { createUsePuck, useGetPuck } from "@puckeditor/core";
import { useRef, useState, type ReactNode } from "react";
import { updateBlock } from "./block-patch";
import { ImageToolbar, type ImageToolbarProps } from "./ImageToolbar";
import { resizeImage, stepValue, type Handle } from "./resize";
import { ResizeHandles } from "./ResizeHandles";
import type { BlockProps } from "./use-block";

const usePuck = createUsePuck();

type Props = {
  /** Identifiant Puck du bloc. */
  blockId: string;
  width: number;
  /** Hauteur du cadre en % de la largeur ; null : proportions naturelles. */
  height?: number | null;
  /** Barre de l'image (remplacer, description, coins) ; absente pour la fiche produit. */
  toolbar?: Omit<ImageToolbarProps, "blockId">;
  children?: ReactNode;
};

const HANDLES: readonly Handle[] = ["n", "s", "e", "w", "ne", "nw", "se", "sw"];

type Size = { width: number; height: number | null };

export function ResizableImageBox({ blockId, width, height = null, toolbar, children }: Props) {
  const getPuck = useGetPuck();
  const selected = usePuck((s) => (s.selectedItem?.props as BlockProps | undefined)?.id === blockId);
  const box = useRef<HTMLDivElement>(null);
  const [draft, setDraft] = useState<Size | null>(null);
  const shown = draft ?? { width, height };

  /** Proportions naturelles de la photo (hauteur / largeur). */
  const naturalRatio = () => {
    const img = box.current?.querySelector("img");
    return img && img.naturalWidth > 0 ? img.naturalHeight / img.naturalWidth : 0.75;
  };

  // Mesures prises au début du geste : l'aperçu change la taille pendant le geste,
  // la mesurer à chaque mouvement ferait s'emballer le calcul.
  const start = useRef<{ parentWidth: number; frameWidth: number; ratio: number } | null>(null);
  const measure = () => {
    const element = box.current;
    const parentWidth = element?.parentElement?.getBoundingClientRect().width ?? 1;
    return { parentWidth, frameWidth: element?.getBoundingClientRect().width ?? parentWidth, ratio: naturalRatio() };
  };
  const compute = (handle: Handle, dx: number, dy: number): Size => {
    const m = start.current ?? measure();
    return resizeImage({ width, height, naturalRatio: m.ratio }, handle, dx, dy, { parentWidth: m.parentWidth, frameWidth: m.frameWidth });
  };

  const save = (next: Size) => {
    setDraft(null);
    if (next.width === width && next.height === height) return;
    updateBlock(getPuck, blockId, (props) => ({ ...props, imageWidth: next.width, imageHeight: next.height }));
  };

  const label = (size: Size) => (size.height === null ? `${size.width} %` : `${size.width} % · cadre ${size.height} %`);

  return (
    <div ref={box} className="relative mx-auto w-full" style={{ maxWidth: `${shown.width}%` }}>
      {/* Pendant le geste, le cadre suit la poignée (la photo garde object-fit: cover). */}
      {draft?.height != null && (
        <style>{`[data-frame="${CSS.escape(blockId)}"] img { aspect-ratio: 100 / ${draft.height} !important; object-fit: cover !important; }`}</style>
      )}
      <div data-frame={blockId}>{children}</div>
      {toolbar && <ImageToolbar blockId={blockId} {...toolbar} />}
      {selected && (
        <ResizeHandles
          handles={HANDLES}
          label="l'image"
          onPreview={(handle, dx, dy) => {
            if (dx === 0 && dy === 0 && !draft) start.current = measure();
            const next = compute(handle, dx, dy);
            setDraft(next);
            return label(next);
          }}
          onCommit={(handle, dx, dy) => {
            save(compute(handle, dx, dy));
            start.current = null;
          }}
          onCancel={() => {
            setDraft(null);
            start.current = null;
          }}
          onKey={(handle, direction) => {
            if (handle === "n" || handle === "s") {
              const base = height ?? Math.round((naturalRatio() * 100) / 5) * 5;
              save({ width, height: stepValue("imageHeight", base, direction) as number });
            } else {
              save({ width: stepValue("imageWidth", width, direction) as number, height });
            }
          }}
        />
      )}
    </div>
  );
}
