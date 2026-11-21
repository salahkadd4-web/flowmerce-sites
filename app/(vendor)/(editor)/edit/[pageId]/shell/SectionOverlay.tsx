"use client";

// Contour de la section choisie (remplace celui de Puck), avec ses poignées comme
// dans Google Slides : le bord du bas règle sa hauteur (en % de l'écran), les bords
// des côtés la largeur de son contenu (étroite, normale, large).

import { useGetPuck } from "@puckeditor/core";
import { useRef, useState, type ReactNode } from "react";
import { GROUP_DEFAULTS, readGroup, updateBlock, withPath } from "@/blocks/editor/block-patch";
import { resizeSection, stepValue, type Handle } from "@/blocks/editor/resize";
import { ResizeHandles } from "@/blocks/editor/ResizeHandles";
import { isBlockType } from "@/blocks/schemas";
import { DEFAULT_SECTION_STYLE, type SectionStyle } from "@/blocks/style";

type Props = { children: ReactNode; hover: boolean; isSelected: boolean; componentId: string; componentType: string };

const HANDLES: readonly Handle[] = ["s", "e", "w"];
const WIDTH_NAMES = { narrow: "Contenu étroit", normal: "Contenu normal", wide: "Contenu large" } as const;
const WIDTHS = ["narrow", "normal", "wide"] as const;

export function SectionOverlay({ children, isSelected, componentId, componentType }: Props) {
  const getPuck = useGetPuck();
  const anchor = useRef<HTMLSpanElement>(null);
  const start = useRef<{ viewportHeight: number; sectionHeight: number } | null>(null);
  const [draft, setDraft] = useState<number | null>(null);

  const current = (): SectionStyle => {
    const item = getPuck().getItemById(componentId);
    return readGroup<SectionStyle>((item?.props ?? {}) as Record<string, unknown>, "style", DEFAULT_SECTION_STYLE);
  };
  const measure = () => {
    const doc = anchor.current?.ownerDocument;
    const element = doc?.querySelector(`[data-puck-component="${CSS.escape(componentId)}"]`);
    return { viewportHeight: doc?.defaultView?.innerHeight ?? 800, sectionHeight: element?.getBoundingClientRect().height ?? 0 };
  };
  const compute = (handle: Handle, dx: number, dy: number) => {
    const style = current();
    return resizeSection({ minHeight: style.minHeight ?? 0, width: style.width }, handle, dx, dy, start.current ?? measure());
  };
  const save = (next: { minHeight: number; width: SectionStyle["width"] }) => {
    setDraft(null);
    start.current = null;
    const style = current();
    if (next.minHeight === (style.minHeight ?? 0) && next.width === style.width) return;
    updateBlock(getPuck, componentId, (p) => withPath(withPath(p, "style.minHeight", next.minHeight, GROUP_DEFAULTS), "style.width", next.width, GROUP_DEFAULTS));
  };

  return (
    <>
      {children}
      <span ref={anchor} hidden />
      {/* Pendant le geste, la hauteur suit la poignée. */}
      {draft !== null && (
        <style>{`[data-puck-component="${CSS.escape(componentId)}"] { min-height: ${draft === 0 ? "auto" : `${draft}svh`} !important; }`}</style>
      )}
      {isSelected && isBlockType(componentType) && (
        <ResizeHandles
          handles={HANDLES}
          label="la section"
          inset
          onPreview={(handle, dx, dy) => {
            if (dx === 0 && dy === 0 && draft === null) start.current = measure();
            const next = compute(handle, dx, dy);
            if (handle === "s") setDraft(next.minHeight);
            return handle === "s" ? (next.minHeight === 0 ? "Hauteur selon le contenu" : `Hauteur ${next.minHeight} % de l'écran`) : WIDTH_NAMES[next.width];
          }}
          onCommit={(handle, dx, dy) => save(compute(handle, dx, dy))}
          onCancel={() => {
            setDraft(null);
            start.current = null;
          }}
          onKey={(handle, direction) => {
            const style = current();
            if (handle === "s") save({ minHeight: stepValue("sectionHeight", style.minHeight ?? 0, direction) as number, width: style.width });
            else {
              const index = Math.min(2, Math.max(0, WIDTHS.indexOf(style.width) + direction));
              save({ minHeight: style.minHeight ?? 0, width: WIDTHS[index] });
            }
          }}
        />
      )}
    </>
  );
}
