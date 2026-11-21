"use client";

// Poignées de redimensionnement, comme dans Google Slides : un carré à chaque coin,
// une barre au milieu de chaque bord. On les tire à la souris ou au doigt ; une
// bulle montre la valeur pendant le geste ; la valeur s'écrit au relâchement (une
// étape d'historique, annulable par Ctrl+Z). Échap ou un geste interrompu annule.
// Au clavier : chaque poignée est un bouton, les flèches changent la valeur d'un pas.
//
// Dans un bloc, Puck rend les éléments inertes et glisse le bloc au moindre appui :
// chaque poignée est déclarée « portail » de Puck, avec ses écouteurs posés en phase
// de capture avant cette déclaration (Puck arrête l'appui en capture).

import { registerOverlayPortal } from "@puckeditor/core";
import { useEffect, useRef, useState } from "react";
import type { Handle } from "./resize";

type Props = {
  handles: readonly Handle[];
  /** Ce que l'on redimensionne, pour les noms des poignées (« l'image », « le bouton »…). */
  label: string;
  /** Pendant le geste : met à jour l'aperçu et rend le texte de la bulle. */
  onPreview: (handle: Handle, dx: number, dy: number) => string;
  /** Au relâchement : écrit la valeur. */
  onCommit: (handle: Handle, dx: number, dy: number) => void;
  /** Geste annulé : l'aperçu revient à la valeur enregistrée. */
  onCancel: () => void;
  /** Flèches du clavier sur une poignée : un pas dans un sens. */
  onKey: (handle: Handle, direction: 1 | -1) => void;
  /** Poignées des bords posées à l'intérieur du cadre (section pleine largeur : rien ne dépasse de la page). */
  inset?: boolean;
};

const NAMES: Record<Handle, string> = {
  n: "bord du haut",
  s: "bord du bas",
  e: "bord droit",
  w: "bord gauche",
  ne: "coin en haut à droite",
  nw: "coin en haut à gauche",
  se: "coin en bas à droite",
  sw: "coin en bas à gauche",
};

/** Poignées des bords à l'intérieur du cadre. */
const INSET: Partial<Record<Handle, string>> = {
  n: "left-1/2 top-1 h-2.5 w-8 -translate-x-1/2 cursor-ns-resize rounded-full",
  s: "left-1/2 bottom-1 h-2.5 w-8 -translate-x-1/2 cursor-ns-resize rounded-full",
  e: "right-1 top-1/2 h-8 w-2.5 -translate-y-1/2 cursor-ew-resize rounded-full",
  w: "left-1 top-1/2 h-8 w-2.5 -translate-y-1/2 cursor-ew-resize rounded-full",
};

const PLACE: Record<Handle, string> = {
  n: "left-1/2 top-0 h-2.5 w-8 -translate-x-1/2 -translate-y-1/2 cursor-ns-resize rounded-full",
  s: "left-1/2 bottom-0 h-2.5 w-8 -translate-x-1/2 translate-y-1/2 cursor-ns-resize rounded-full",
  e: "right-0 top-1/2 h-8 w-2.5 translate-x-1/2 -translate-y-1/2 cursor-ew-resize rounded-full",
  w: "left-0 top-1/2 h-8 w-2.5 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize rounded-full",
  ne: "right-0 top-0 size-3 translate-x-1/2 -translate-y-1/2 cursor-nesw-resize rounded-[3px]",
  nw: "left-0 top-0 size-3 -translate-x-1/2 -translate-y-1/2 cursor-nwse-resize rounded-[3px]",
  se: "right-0 bottom-0 size-3 translate-x-1/2 translate-y-1/2 cursor-nwse-resize rounded-[3px]",
  sw: "left-0 bottom-0 size-3 -translate-x-1/2 translate-y-1/2 cursor-nesw-resize rounded-[3px]",
};

/** Flèche → sens d'un pas pour une poignée : vers l'extérieur agrandit. */
function keyDirection(handle: Handle, key: string): 1 | -1 | 0 {
  const out: Record<string, Handle[]> = {
    ArrowRight: ["e", "ne", "se"],
    ArrowLeft: ["w", "nw", "sw"],
    ArrowDown: ["s", "se", "sw"],
    ArrowUp: ["n", "ne", "nw"],
  };
  const inward: Record<string, Handle[]> = {
    ArrowLeft: ["e", "ne", "se"],
    ArrowRight: ["w", "nw", "sw"],
    ArrowUp: ["s", "se", "sw"],
    ArrowDown: ["n", "ne", "nw"],
  };
  if (out[key]?.includes(handle)) return 1;
  if (inward[key]?.includes(handle)) return -1;
  return 0;
}

export function ResizeHandles(props: Props) {
  const [bubble, setBubble] = useState<string | null>(null);
  return (
    <>
      {/* Cadre de sélection, comme sur une diapositive. */}
      <span aria-hidden className="pointer-events-none absolute inset-0 rounded-[inherit] outline-2 outline-offset-0 outline-brand" />
      {props.handles.map((handle) => (
        <HandleButton key={handle} handle={handle} {...props} onBubble={setBubble} />
      ))}
      {bubble !== null && (
        <span
          aria-live="polite"
          className="pointer-events-none absolute left-1/2 top-2 z-40 -translate-x-1/2 rounded-full bg-ink px-3 py-1 text-[13px] font-semibold whitespace-nowrap text-white shadow"
        >
          {bubble}
        </span>
      )}
    </>
  );
}

function HandleButton({
  handle,
  label,
  onPreview,
  onCommit,
  onCancel,
  onKey,
  onBubble,
  inset = false,
}: Props & { handle: Handle; onBubble: (text: string | null) => void }) {
  const ref = useRef<HTMLButtonElement>(null);
  // Dernières fonctions, lues par les écouteurs natifs posés une seule fois.
  const latest = useRef({ onPreview, onCommit, onCancel, onBubble });
  useEffect(() => {
    latest.current = { onPreview, onCommit, onCancel, onBubble };
  });

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    let origin: { x: number; y: number } | null = null;
    // Dernière position vue : un relâchement hors de l'aperçu (iframe) n'y arrive pas ;
    // le navigateur signale alors la perte du pointeur, et le geste s'arrête là.
    let last = { dx: 0, dy: 0 };

    const end = (event: PointerEvent, commit: boolean) => {
      if (!origin) return;
      event.stopPropagation();
      const dx = event.type === "lostpointercapture" ? last.dx : event.clientX - origin.x;
      const dy = event.type === "lostpointercapture" ? last.dy : event.clientY - origin.y;
      origin = null;
      latest.current.onBubble(null);
      if (commit) latest.current.onCommit(handle, dx, dy);
      else latest.current.onCancel();
    };
    const down = (event: PointerEvent) => {
      event.preventDefault();
      event.stopPropagation();
      element.setPointerCapture(event.pointerId);
      origin = { x: event.clientX, y: event.clientY };
      last = { dx: 0, dy: 0 };
      latest.current.onBubble(latest.current.onPreview(handle, 0, 0));
    };
    const move = (event: PointerEvent) => {
      if (!origin) return;
      event.stopPropagation();
      last = { dx: event.clientX - origin.x, dy: event.clientY - origin.y };
      latest.current.onBubble(latest.current.onPreview(handle, last.dx, last.dy));
    };
    const up = (event: PointerEvent) => end(event, true);
    const cancel = (event: PointerEvent) => end(event, false);
    const escape = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || !origin) return;
      event.preventDefault();
      event.stopPropagation();
      origin = null;
      latest.current.onBubble(null);
      latest.current.onCancel();
    };

    const listeners = [
      ["pointerdown", down],
      ["pointermove", move],
      ["pointerup", up],
      ["pointercancel", cancel],
      ["lostpointercapture", up],
    ] as const;
    for (const [type, listener] of listeners) element.addEventListener(type, listener as EventListener, { capture: true });
    const doc = element.ownerDocument;
    doc.addEventListener("keydown", escape, true);
    const unregister = registerOverlayPortal(element, { disableDrag: true });

    return () => {
      unregister?.();
      for (const [type, listener] of listeners) element.removeEventListener(type, listener as EventListener, { capture: true });
      doc.removeEventListener("keydown", escape, true);
    };
  }, [handle]);

  return (
    <button
      ref={ref}
      type="button"
      aria-label={`Redimensionner ${label} — ${NAMES[handle]} (flèches du clavier)`}
      title={`Tirer pour redimensionner (${NAMES[handle]})`}
      // Le clic qui suit le relâchement ne remonte pas à l'aperçu (il désélectionnerait la section).
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => {
        const direction = keyDirection(handle, event.key);
        if (direction === 0) return;
        event.preventDefault();
        event.stopPropagation();
        onKey(handle, direction);
      }}
      className={`absolute z-30 touch-none border-2 border-brand bg-white shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${(inset && INSET[handle]) || PLACE[handle]}`}
    />
  );
}
