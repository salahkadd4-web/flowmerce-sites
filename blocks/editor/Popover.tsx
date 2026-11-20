"use client";

// Petite fenêtre ouverte depuis une barre d'outils (Fond, Couleur, Réseaux…).
// Échap ou un clic à côté la ferment, et le focus revient au bouton qui l'a
// ouverte. Fonctionne aussi dans l'aperçu (iframe) : les écouteurs sont posés sur
// le document du bouton, pas sur celui de l'éditeur.

import { ChevronDown, type LucideIcon } from "lucide-react";
import { createContext, useContext, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { TOOL } from "./ToolbarButton";

type Props = {
  /** Nom de la fenêtre (bouton et fenêtre). */
  label: string;
  icon?: LucideIcon;
  /** Texte court affiché sur le bouton. */
  text?: string;
  /** Côté où la fenêtre s'aligne sous le bouton. */
  align?: "start" | "end";
  width?: number;
  children: ReactNode;
};

const CloseContext = createContext<() => void>(() => {});

/** Ferme la fenêtre en cours (après un choix définitif, par exemple). */
export function usePopoverClose(): () => void {
  return useContext(CloseContext);
}

export function Popover({ label, icon: Icon, text, align = "start", width = 264, children }: Props) {
  const [open, setOpen] = useState(false);
  const button = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const id = useId();

  const close = (returnFocus = true) => {
    setOpen(false);
    if (returnFocus) button.current?.focus();
  };
  const [closeAndFocus] = useState(() => () => {
    setOpen(false);
    button.current?.focus();
  });

  useEffect(() => {
    if (!open) return;
    const doc = button.current?.ownerDocument;
    if (!doc) return;
    // Premier contrôle de la fenêtre : le clavier y arrive directement.
    panel.current?.querySelector<HTMLElement>("button, input, select, textarea, [tabindex]")?.focus();

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (panel.current?.contains(target) || button.current?.contains(target)) return;
      close(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      event.stopPropagation();
      close();
    };
    doc.addEventListener("pointerdown", onPointerDown, true);
    doc.addEventListener("keydown", onKeyDown, true);
    return () => {
      doc.removeEventListener("pointerdown", onPointerDown, true);
      doc.removeEventListener("keydown", onKeyDown, true);
    };
  }, [open]);

  return (
    <div className="relative">
      <button
        ref={button}
        type="button"
        aria-label={label}
        title={label}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        onClick={() => setOpen((value) => !value)}
        className={`${TOOL} ${open ? "bg-brand-soft text-brand-ink" : ""}`}
      >
        {Icon && <Icon size={16} aria-hidden />}
        {text}
        <ChevronDown size={12} aria-hidden className="opacity-60" />
      </button>
      {open && (
        <div
          ref={panel}
          id={id}
          role="dialog"
          aria-label={label}
          style={{ width }}
          className={`absolute top-full z-50 mt-2 flex flex-col gap-3 rounded-card border border-line bg-white p-3 text-start text-[13px] text-ink shadow-xl ${
            align === "end" ? "end-0" : "start-0"
          }`}
        >
          <p className="text-[12px] font-bold tracking-wide text-faint uppercase">{label}</p>
          <CloseContext.Provider value={closeAndFocus}>{children}</CloseContext.Provider>
        </div>
      )}
    </div>
  );
}
