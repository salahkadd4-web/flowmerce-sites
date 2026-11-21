"use client";

// Petite fenêtre ouverte depuis une barre d'outils (Fond, Couleur, Réseaux…).
// Échap ou un clic à côté la ferment, et le focus revient au bouton qui l'a
// ouverte.
//
// La fenêtre s'ouvre au premier plan du document du bouton (l'aperçu est un
// iframe), en position fixe sous le bouton — ou au-dessus s'il n'y a pas la place
// — et toujours dans la page : une section qui coupe ce qui dépasse (fond image)
// ne la tronque pas. Elle porte data-puck-rte-menu : ouverte depuis la barre d'un
// texte en cours d'écriture, Puck la compte dans cette barre et garde le texte actif.

import { ChevronDown, type LucideIcon } from "lucide-react";
import { createContext, useContext, useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { TOOL } from "./ToolbarButton";

type Props = {
  /** Nom de la fenêtre (bouton et fenêtre). */
  label: string;
  icon?: LucideIcon;
  /** Texte court affiché sur le bouton. */
  text?: string;
  /** Côté du bouton sur lequel la fenêtre s'aligne. */
  align?: "start" | "end";
  width?: number;
  children: ReactNode;
};

const CloseContext = createContext<() => void>(() => {});

/** Ferme la fenêtre en cours (après un choix définitif, par exemple). */
export function usePopoverClose(): () => void {
  return useContext(CloseContext);
}

const MARGIN = 8;

export function Popover({ label, icon: Icon, text, align = "start", width = 264, children }: Props) {
  const [doc, setDoc] = useState<Document | null>(null);
  const open = doc !== null;
  const [position, setPosition] = useState<CSSProperties>({ visibility: "hidden" });
  const button = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const id = useId();

  const [closeAndFocus] = useState(() => () => {
    setDoc(null);
    button.current?.focus();
  });

  // Place la fenêtre près du bouton, dans la page ; suit le défilement.
  useLayoutEffect(() => {
    if (!doc) return;
    const place = () => {
      const anchor = button.current?.getBoundingClientRect();
      const element = panel.current;
      if (!anchor || !element || !button.current) return;
      const view = doc.documentElement;
      const w = Math.min(width, view.clientWidth - 2 * MARGIN);
      const h = element.offsetHeight;
      const rtl = getComputedStyle(button.current).direction === "rtl";
      const toEnd = (align === "end") !== rtl;
      let left = toEnd ? anchor.right - w : anchor.left;
      left = Math.max(MARGIN, Math.min(left, view.clientWidth - MARGIN - w));
      const below = anchor.bottom + MARGIN;
      const above = anchor.top - MARGIN - h;
      const top = below + h <= view.clientHeight - MARGIN || above < MARGIN ? below : above;
      setPosition({ position: "fixed", top, left, width: w });
    };
    place();
    const win = doc.defaultView;
    win?.addEventListener("scroll", place, true);
    win?.addEventListener("resize", place);
    return () => {
      win?.removeEventListener("scroll", place, true);
      win?.removeEventListener("resize", place);
    };
  }, [doc, align, width]);

  useEffect(() => {
    if (!doc) return;
    // Premier contrôle de la fenêtre : le clavier y arrive directement.
    panel.current?.querySelector<HTMLElement>("button, input, select, textarea, [tabindex]")?.focus();

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (panel.current?.contains(target) || button.current?.contains(target)) return;
      setDoc(null);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      event.stopPropagation();
      closeAndFocus();
    };
    doc.addEventListener("pointerdown", onPointerDown, true);
    doc.addEventListener("keydown", onKeyDown, true);
    return () => {
      doc.removeEventListener("pointerdown", onPointerDown, true);
      doc.removeEventListener("keydown", onKeyDown, true);
    };
  }, [doc, closeAndFocus]);

  return (
    <>
      <button
        ref={button}
        type="button"
        aria-label={label}
        title={label}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        onClick={() => {
          setPosition({ visibility: "hidden" });
          setDoc((current) => (current ? null : (button.current?.ownerDocument ?? null)));
        }}
        className={`${TOOL} ${open ? "bg-brand-soft text-brand-ink" : ""}`}
      >
        {Icon && <Icon size={16} aria-hidden />}
        {/* Aperçu téléphone (étroit) : l'icône seule, son nom reste dans l'infobulle. */}
        {text && <span className="max-sm:hidden">{text}</span>}
        <ChevronDown size={12} aria-hidden className="opacity-60" />
      </button>
      {doc &&
        createPortal(
          <div
            ref={panel}
            id={id}
            role="dialog"
            aria-label={label}
            data-puck-rte-menu=""
            // Les clics dans la fenêtre ne remontent pas jusqu'à la section (Puck la re-sélectionnerait).
            onClick={(e) => e.stopPropagation()}
            style={position}
            className="z-[2147483000] flex max-h-[min(480px,calc(100vh-16px))] flex-col gap-3 overflow-y-auto rounded-card border border-line bg-white p-3 text-start font-sans text-[13px] text-ink shadow-xl"
          >
            <p className="text-[12px] font-bold tracking-wide text-faint uppercase">{label}</p>
            <CloseContext.Provider value={closeAndFocus}>{children}</CloseContext.Provider>
          </div>,
          doc.body,
        )}
    </>
  );
}
