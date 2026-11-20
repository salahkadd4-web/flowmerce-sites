"use client";

// Barre du haut de l'éditeur, de gauche à droite : retour et nom du site ;
// format de l'aperçu ; annuler / rétablir ; état de l'enregistrement ; réglages
// de la page, aperçu, publication. Chaque bouton porte son nom en clair.

import { createUsePuck } from "@puckeditor/core";
import Link from "next/link";
import { ArrowLeft, Check, CloudOff, Eye, Loader2, Monitor, Redo2, Send, Settings2, Smartphone, Undo2 } from "lucide-react";
import { BTN_GHOST, BTN_PRIMARY, FOCUS } from "@/components/dashboard/ui";
import type { AutosaveStatus } from "./autosave";

const usePuck = createUsePuck();

export type Device = "phone" | "desktop";

type Props = {
  site: { name: string; url: string };
  status: AutosaveStatus;
  publishing: boolean;
  published: boolean;
  device: Device;
  onDevice: (device: Device) => void;
  onRetry: () => void;
  onOpenSettings: () => void;
  onPreview: () => void;
  onPublish: () => void;
};

const ICON_BUTTON = `inline-flex size-9 items-center justify-center rounded-control text-body transition-colors hover:bg-page hover:text-ink disabled:cursor-not-allowed disabled:opacity-35 ${FOCUS}`;

export function TopBar({ site, status, publishing, published, device, onDevice, onRetry, onOpenSettings, onPreview, onPublish }: Props) {
  const back = usePuck((s) => s.history.back);
  const forward = usePuck((s) => s.history.forward);
  const hasPast = usePuck((s) => s.history.hasPast);
  const hasFuture = usePuck((s) => s.history.hasFuture);
  const unsaved = status === "pending" || status === "saving" || status === "error";

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-line bg-surface px-3">
      <Link
        href="/"
        // Navigation interne : beforeunload ne se déclenche pas, d'où la confirmation ici.
        onClick={(event) => {
          if (unsaved && !window.confirm("Quitter l'éditeur ? Les dernières modifications ne sont pas encore enregistrées.")) {
            event.preventDefault();
          }
        }}
        className={`inline-flex items-center gap-1.5 rounded-control px-2 py-1.5 text-[13px] font-semibold text-body hover:text-ink ${FOCUS}`}
      >
        <ArrowLeft size={15} aria-hidden />
        Mes sites
      </Link>
      <span aria-hidden className="h-6 w-px bg-line" />
      <p className="min-w-0 truncate text-[14px] font-bold text-ink" title={site.name}>
        {site.name}
      </p>

      <div className="ms-auto flex items-center gap-3">
        <div role="radiogroup" aria-label="Format de l'aperçu" className="flex rounded-control border border-line bg-page p-0.5">
          {(
            [
              ["phone", "Téléphone", Smartphone],
              ["desktop", "Ordinateur", Monitor],
            ] as const
          ).map(([value, label, Icon]) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={device === value}
              onClick={() => onDevice(value)}
              className={`inline-flex items-center gap-1.5 rounded-[6px] px-2.5 py-1.5 text-[12px] font-semibold ${FOCUS} ${
                device === value ? "bg-surface text-brand-ink shadow-sm" : "text-body hover:text-ink"
              }`}
            >
              <Icon size={14} aria-hidden />
              {label}
            </button>
          ))}
        </div>

        <div className="flex items-center">
          <button type="button" className={ICON_BUTTON} aria-label="Annuler (Ctrl+Z)" title="Annuler (Ctrl+Z)" disabled={!hasPast} onClick={() => back()}>
            <Undo2 size={17} aria-hidden />
          </button>
          <button type="button" className={ICON_BUTTON} aria-label="Rétablir (Ctrl+Y)" title="Rétablir (Ctrl+Y)" disabled={!hasFuture} onClick={() => forward()}>
            <Redo2 size={17} aria-hidden />
          </button>
        </div>

        <SaveStatus status={status} published={published} url={site.url} onRetry={onRetry} />
      </div>

      <div className="flex items-center gap-2">
        <button type="button" className={BTN_GHOST} onClick={onOpenSettings}>
          <Settings2 size={15} aria-hidden />
          Réglages de la page
        </button>
        <button type="button" className={BTN_GHOST} disabled={publishing} onClick={onPreview}>
          <Eye size={15} aria-hidden />
          Aperçu
        </button>
        <button type="button" className={BTN_PRIMARY} disabled={publishing} onClick={onPublish}>
          {publishing ? <Loader2 size={15} className="animate-spin" aria-hidden /> : <Send size={15} aria-hidden />}
          Publier
        </button>
      </div>
    </header>
  );
}

function SaveStatus({ status, published, url, onRetry }: { status: AutosaveStatus; published: boolean; url: string; onRetry: () => void }) {
  return (
    <span id="editor-status" role="status" aria-live="polite" className="flex w-44 items-center gap-1.5 text-[12px] text-faint">
      {status === "saving" && (
        <>
          <Loader2 size={13} className="animate-spin" aria-hidden /> Enregistrement…
        </>
      )}
      {status === "pending" && "Modifications en cours"}
      {(status === "saved" || status === "clean") && (
        <>
          <Check size={13} aria-hidden className="text-risk-low" />
          {published ? (
            <>
              Publié —{" "}
              <a href={url} target="_blank" rel="noopener noreferrer" className={`font-semibold text-brand-ink hover:underline ${FOCUS}`}>
                voir le site
              </a>
            </>
          ) : (
            "Enregistré"
          )}
        </>
      )}
      {status === "error" && (
        <>
          <CloudOff size={13} aria-hidden className="text-red-700" />
          <span className="text-red-700">Non enregistré —</span>
          <button type="button" onClick={onRetry} className={`font-semibold text-brand-ink underline ${FOCUS}`}>
            Réessayer
          </button>
        </>
      )}
    </span>
  );
}
