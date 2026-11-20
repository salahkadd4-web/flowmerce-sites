"use client";

// Boîte d'image de l'éditeur : comme ImageBox (blocks/image-box.tsx), plus une
// poignée qu'on tire pour régler la largeur, comme dans Google Slides. La largeur
// suit le pointeur par paliers de 10 %, s'affiche pendant le geste, et
// s'enregistre au relâchement dans le bloc (annulable par Ctrl+Z).
// Injectée par editor-config.ts : jamais envoyée aux acheteurs.

import { registerOverlayPortal, useGetPuck } from "@puckeditor/core";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { snapWidth, WIDTH_MAX, WIDTH_MIN, WIDTH_STEP } from "./snap";

type Props = {
  /** Identifiant Puck du bloc. */
  blockId: string;
  /** Réglage du bloc qui porte la largeur (imageWidth). */
  prop: string;
  width: number;
  children?: ReactNode;
};

export function ResizableImageBox({ blockId, prop, width, children }: Props) {
  const getPuck = useGetPuck();
  const box = useRef<HTMLDivElement>(null);
  const handle = useRef<HTMLButtonElement>(null);
  const [draft, setDraft] = useState<number | null>(null);
  const shown = draft ?? width;

  // Dernières valeurs, lues par les écouteurs natifs posés une seule fois.
  const latest = useRef({ width, blockId, prop, getPuck });
  latest.current = { width, blockId, prop, getPuck };

  useEffect(() => {
    const element = handle.current;
    if (!element) return;
    let dragging = false;
    let value = latest.current.width;

    const measure = (clientX: number) => {
      const parent = box.current?.parentElement;
      if (!parent) return latest.current.width;
      const rect = parent.getBoundingClientRect();
      return snapWidth(Math.abs(clientX - (rect.left + rect.width / 2)) * 2, rect.width);
    };

    const down = (event: PointerEvent) => {
      event.preventDefault();
      event.stopPropagation();
      element.setPointerCapture(event.pointerId);
      dragging = true;
      value = latest.current.width;
      setDraft(value);
    };
    const move = (event: PointerEvent) => {
      if (!dragging) return;
      event.stopPropagation();
      value = measure(event.clientX);
      setDraft(value);
    };
    const up = (event: PointerEvent) => {
      if (!dragging) return;
      event.stopPropagation();
      dragging = false;
      setDraft(null);
      save(measure(event.clientX));
    };
    const cancel = () => {
      dragging = false;
      setDraft(null);
    };

    // En phase de capture, et avant registerOverlayPortal : Puck y arrête l'appui
    // (stopPropagation en capture), ce qui empêcherait un écouteur ordinaire de
    // la poignée de le recevoir.
    const listeners = [
      ["pointerdown", down],
      ["pointermove", move],
      ["pointerup", up],
      ["pointercancel", cancel],
    ] as const;
    for (const [type, listener] of listeners) element.addEventListener(type, listener, { capture: true });

    // Puck rend inertes les éléments d'un bloc (pointer-events: none) et glisse le
    // bloc entier au moindre appui : la poignée est déclarée « portail » de Puck,
    // qui lui rend le pointeur et ne lance pas le déplacement du bloc.
    const unregister = registerOverlayPortal(element, { disableDrag: true });

    return () => {
      unregister?.();
      for (const [type, listener] of listeners) element.removeEventListener(type, listener, { capture: true });
    };
  }, []);

  function save(value: number) {
    const current = latest.current;
    if (value === current.width) return;
    const { getItemById, getSelectorForId, dispatch } = current.getPuck();
    const item = getItemById(current.blockId);
    const selector = getSelectorForId(current.blockId);
    if (!item || !selector) return;
    dispatch({
      type: "replace",
      destinationIndex: selector.index,
      destinationZone: selector.zone,
      data: { ...item, props: { ...item.props, [current.prop]: value } },
    });
  }

  function onKeyDown(event: React.KeyboardEvent) {
    const delta = event.key === "ArrowRight" || event.key === "ArrowUp" ? WIDTH_STEP : event.key === "ArrowLeft" || event.key === "ArrowDown" ? -WIDTH_STEP : 0;
    if (delta === 0) return;
    event.preventDefault();
    event.stopPropagation();
    save(Math.min(WIDTH_MAX, Math.max(WIDTH_MIN, width + delta)));
  }

  return (
    <div ref={box} className="group/resize relative mx-auto w-full" style={{ maxWidth: `${shown}%` }}>
      {children}
      <button
        ref={handle}
        type="button"
        aria-label={`Redimensionner l'image (${width} %)`}
        title="Tirer pour redimensionner"
        onKeyDown={onKeyDown}
        className="absolute -end-3 top-1/2 h-12 w-6 -translate-y-1/2 cursor-ew-resize touch-none rounded-full border-2 border-brand bg-white shadow-md opacity-0 transition-opacity group-hover/resize:opacity-100 focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
      >
        <span aria-hidden="true" className="mx-auto block h-5 w-0.5 rounded-full bg-brand" />
      </button>
      {draft !== null && (
        <span
          aria-live="polite"
          className="pointer-events-none absolute start-1/2 top-3 -translate-x-1/2 rounded-full bg-ink px-3 py-1 text-[13px] font-semibold text-white shadow"
        >
          {draft} %
        </span>
      )}
    </div>
  );
}
