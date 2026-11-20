"use client";

// Bouton d'une barre d'outils de l'éditeur : une icône, et son nom en clair pour
// l'infobulle et les lecteurs d'écran. Un interrupteur (gras…) dit s'il est enfoncé.

import { forwardRef, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

export const TOOL =
  "inline-flex h-8 min-w-8 items-center justify-center gap-1.5 rounded-md px-1.5 text-[13px] font-semibold text-ink transition-colors hover:bg-brand-soft hover:text-brand-ink focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-40";

type Props = {
  label: string;
  icon?: LucideIcon;
  /** Interrupteur : enfoncé ou non. Absent pour une action simple. */
  active?: boolean;
  disabled?: boolean;
  tone?: "danger";
  onClick: () => void;
  /** Texte affiché à côté de l'icône (sinon l'icône seule). */
  children?: ReactNode;
};

export const ToolbarButton = forwardRef<HTMLButtonElement, Props>(function ToolbarButton(
  { label, icon: Icon, active, disabled, tone, onClick, children },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={active === undefined ? undefined : active}
      disabled={disabled}
      onClick={onClick}
      className={`${TOOL} ${active ? "bg-brand-soft text-brand-ink" : ""} ${tone === "danger" ? "text-red-700 hover:bg-red-50 hover:text-red-800" : ""}`}
    >
      {Icon && <Icon size={16} aria-hidden />}
      {children}
    </button>
  );
});
