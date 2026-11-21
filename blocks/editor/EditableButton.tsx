"use client";

// Boîte d'un bouton dans l'éditeur : quand sa section est choisie, une barre
// apparaît juste au-dessus du bouton — couleur, couleur du texte, taille, et pour
// la bannière « Mène vers » — et des poignées comme dans Google Slides : les côtés
// règlent sa largeur (en % du contenu), le haut et le bas sa taille (S, M, L).
// Le texte du bouton s'écrit sur le bouton même.
// Injectée par editor-config.ts : jamais envoyée aux acheteurs.

import { createUsePuck, registerOverlayPortal, useGetPuck } from "@puckeditor/core";
import { Baseline, Link2, PaintBucket, Ruler } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { DEFAULT_BUTTON, type ButtonStyle } from "@/blocks/style";
import { readGroup, updateBlock, withPath, GROUP_DEFAULTS } from "./block-patch";
import { ButtonColorPanel, ButtonSizePanel, ButtonTextPanel, LinkPanel } from "./panels";
import { Popover } from "./Popover";
import { resizeButton, stepValue, type Handle } from "./resize";
import { ResizeHandles } from "./ResizeHandles";
import { useBlockSetter, type BlockProps } from "./use-block";

const usePuck = createUsePuck();

type Props = {
  blockId: string;
  linkable?: boolean;
  /** Place du bouton dans sa section : centré, au début, ou sur toute la largeur. */
  align?: "center" | "start" | "stretch";
  children?: ReactNode;
};

const HANDLES: readonly Handle[] = ["n", "s", "e", "w", "ne", "nw", "se", "sw"];
const SIZE_NAMES = { s: "Petit", m: "Moyen", l: "Grand" } as const;
const ITEMS = { center: "items-center", start: "items-start", stretch: "items-stretch" } as const;

export function EditableButton({ blockId, linkable = false, align = "stretch", children }: Props) {
  const props = usePuck((s) => ((s.selectedItem?.props as BlockProps | undefined)?.id === blockId ? (s.selectedItem!.props as BlockProps) : null));
  const selected = props !== null;
  const set = useBlockSetter(blockId);
  const getPuck = useGetPuck();
  const bar = useRef<HTMLDivElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const [rect, setRect] = useState<{ left: number; top: number; width: number; height: number } | null>(null);
  const [draftWidth, setDraftWidth] = useState<"auto" | number | null>(null);
  const start = useRef<{ contentWidth: number; buttonWidth: number } | null>(null);

  // Puck rend inertes les éléments d'un bloc (pointer-events: none) : la barre
  // est déclarée « portail » de Puck, qui lui rend le pointeur sans lancer le
  // déplacement du bloc.
  useEffect(() => {
    if (!selected) return;
    return registerOverlayPortal(bar.current, { disableDrag: true });
  }, [selected]);

  // Contour du bouton lui-même, pour y placer les poignées.
  const target = () => box.current?.querySelector<HTMLElement>(":scope > a, :scope > button") ?? null;
  useLayoutEffect(() => {
    if (!selected) return;
    const element = target();
    const wrapper = box.current;
    if (!element || !wrapper) return;
    const update = () => {
      const r = element.getBoundingClientRect();
      const w = wrapper.getBoundingClientRect();
      setRect({ left: r.left - w.left, top: r.top - w.top, width: r.width, height: r.height });
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    observer.observe(wrapper);
    return () => observer.disconnect();
  }, [selected]);

  const button = props ? readGroup<ButtonStyle>(props, "button", DEFAULT_BUTTON) : DEFAULT_BUTTON;
  const compute = (handle: Handle, dx: number, dy: number) => {
    const m = start.current ?? { contentWidth: box.current?.getBoundingClientRect().width ?? 1, buttonWidth: target()?.getBoundingClientRect().width ?? 1 };
    return resizeButton({ width: button.width ?? "auto", size: button.size }, handle, dx, dy, { ...m, centered: align === "center" });
  };
  const save = (next: { width: "auto" | number; size: ButtonStyle["size"] }) => {
    setDraftWidth(null);
    start.current = null;
    if (next.width === (button.width ?? "auto") && next.size === button.size) return;
    updateBlock(getPuck, blockId, (p) => withPath(withPath(p, "button.width", next.width, GROUP_DEFAULTS), "button.size", next.size, GROUP_DEFAULTS));
  };
  const describe = (next: { width: "auto" | number; size: ButtonStyle["size"] }) =>
    `${next.width === "auto" ? "Largeur automatique" : `${next.width} %`} · ${SIZE_NAMES[next.size]}`;

  return (
    <div ref={box} data-button-box={blockId} className={`relative flex w-full flex-col ${ITEMS[align]}`}>
      {/* Pendant le geste, la largeur suit la poignée. */}
      {draftWidth !== null && (
        <style>{`[data-button-box="${CSS.escape(blockId)}"] > a, [data-button-box="${CSS.escape(blockId)}"] > button { width: ${draftWidth === "auto" ? "auto" : `${draftWidth}%`} !important; }`}</style>
      )}
      {children}
      {selected && props && (
        <>
          {rect && (
            <div className="pointer-events-none absolute rounded-control" style={rect}>
              <ResizeHandles
                handles={HANDLES}
                label="le bouton"
                onPreview={(handle, dx, dy) => {
                  if (dx === 0 && dy === 0 && draftWidth === null) {
                    start.current = { contentWidth: box.current?.getBoundingClientRect().width ?? 1, buttonWidth: target()?.getBoundingClientRect().width ?? 1 };
                  }
                  const next = compute(handle, dx, dy);
                  setDraftWidth(next.width);
                  return describe(next);
                }}
                onCommit={(handle, dx, dy) => save(compute(handle, dx, dy))}
                onCancel={() => {
                  setDraftWidth(null);
                  start.current = null;
                }}
                onKey={(handle, direction) => {
                  if (handle === "n" || handle === "s") {
                    const sizes = ["s", "m", "l"] as const;
                    const index = Math.min(2, Math.max(0, sizes.indexOf(button.size) + direction));
                    save({ width: button.width ?? "auto", size: sizes[index] });
                  } else {
                    save({ width: stepValue("buttonWidth", button.width ?? "auto", direction) as "auto" | number, size: button.size });
                  }
                }}
              />
            </div>
          )}
          <div
            ref={bar}
            role="toolbar"
            aria-label="Bouton"
            onClick={(e) => e.stopPropagation()}
            className="absolute bottom-full start-1/2 z-40 mb-3 flex -translate-x-1/2 items-center gap-0.5 rounded-control border border-line bg-white p-1 text-ink shadow-lg rtl:translate-x-1/2"
          >
            <Popover label="Couleur du bouton" icon={PaintBucket} text="Couleur">
              <ButtonColorPanel props={props} set={set} />
            </Popover>
            <Popover label="Couleur du texte du bouton" icon={Baseline} text="Texte">
              <ButtonTextPanel props={props} set={set} />
            </Popover>
            <Popover label="Taille du bouton" icon={Ruler} text="Taille">
              <ButtonSizePanel props={props} set={set} />
            </Popover>
            {linkable && (
              <Popover label="Où mène le bouton" icon={Link2} text="Mène vers" align="end" width={288}>
                <LinkPanel props={props} set={set} />
              </Popover>
            )}
          </div>
        </>
      )}
    </div>
  );
}
