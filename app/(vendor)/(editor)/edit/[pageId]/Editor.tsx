"use client";

// Éditeur Puck : même configuration que le rendu public (blocks/puck.config.ts).
// En-tête : retour, aperçu, enregistrer, publier, avec l'état des modifications.

import "@puckeditor/core/puck.css";
import { Puck, useGetPuck, type Data } from "@puckeditor/core";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { AlertTriangle, ArrowLeft, Eye, Loader2, Save, Send } from "lucide-react";
import { BTN_GHOST, BTN_PRIMARY, FOCUS, Notice } from "@/components/dashboard/ui";
import { dictionaryFr } from "@/blocks/dictionary.fr";
import { editorConfig } from "./editor-config";
import { publishPage, saveDraft, type EditorActionResult } from "./actions";
import { installKeyboardEventGuard } from "./keyboard-event-guard";

type Status = "clean" | "dirty" | "saving" | "saved" | "publishing" | "published";

type Props = {
  pageId: string;
  site: { name: string; url: string; published: boolean };
  initialData: unknown;
};

const VIEWPORTS = [
  { width: 360, height: "auto" as const, label: "Mobile" },
  { width: 1280, height: "auto" as const, label: "Bureau" },
];

const STATUS_TEXT: Record<Status, string> = {
  clean: "Aucune modification",
  dirty: "Modifications non enregistrées",
  saving: "Enregistrement…",
  saved: "Enregistré",
  publishing: "Publication…",
  published: "Publié",
};

export function Editor({ pageId, site, initialData }: Props) {
  const [status, setStatus] = useState<Status>("clean");
  const [error, setError] = useState("");
  const [isOnline, setIsOnline] = useState(site.published);
  // Dernier contenu enregistré : « modifié » se compare à lui, pas au premier onChange.
  const savedSnapshot = useRef(JSON.stringify(initialData));

  // Remplissage automatique et extensions envoient des keydown incomplets qui
  // font planter les raccourcis de Puck (voir keyboard-event-guard.ts).
  useEffect(() => installKeyboardEventGuard(window), []);

  // Avertir avant de quitter avec des modifications non enregistrées.
  useEffect(() => {
    if (status !== "dirty") return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [status]);

  const onChange = useCallback((data: Data) => {
    setStatus((current) => {
      if (current === "saving" || current === "publishing") return current;
      return JSON.stringify(data) === savedSnapshot.current ? current : "dirty";
    });
  }, []);

  const run = useCallback(
    async (kind: "save" | "publish", data: Data): Promise<boolean> => {
      setError("");
      setStatus(kind === "save" ? "saving" : "publishing");
      let result: EditorActionResult;
      try {
        result = kind === "save" ? await saveDraft(pageId, data) : await publishPage(pageId, data);
      } catch {
        result = { ok: false, error: "Le serveur ne répond pas. Vos modifications ne sont pas perdues : réessayez." };
      }
      if (!result.ok) {
        setError(result.error);
        setStatus("dirty");
        return false;
      }
      savedSnapshot.current = JSON.stringify(data);
      setStatus(kind === "save" ? "saved" : "published");
      if (kind === "publish") setIsOnline(true);
      return true;
    },
    [pageId],
  );

  // L'aperçu affiche le brouillon enregistré : s'il reste des modifications, on
  // enregistre d'abord. L'onglet est ouvert dès le clic (sinon le navigateur le
  // bloquerait comme fenêtre surgissante), puis dirigé vers l'aperçu.
  const preview = useCallback(
    async (data: Data, dirty: boolean) => {
      const url = `/preview/${pageId}`;
      if (!dirty) {
        window.open(url, "_blank", "noopener");
        return;
      }
      const tab = window.open("", "_blank");
      if (await run("save", data)) {
        if (tab) tab.location.href = url;
      } else {
        tab?.close();
      }
    },
    [pageId, run],
  );

  return (
    <div className="flex h-dvh flex-col">
      {error && (
        <div className="border-b border-line bg-surface p-3">
          <Notice tone="danger" icon={AlertTriangle} title="Action impossible">
            {error}
          </Notice>
        </div>
      )}
      <div className="min-h-0 flex-1">
        <Puck
          config={editorConfig}
          data={initialData as Partial<Data>}
          dictionary={dictionaryFr}
          viewports={VIEWPORTS}
          onChange={onChange}
          headerTitle={site.name}
          height="100%"
          // Aperçu mobile par défaut : la majorité du trafic des landing pages (§2.2).
          ui={{ viewports: { current: { width: VIEWPORTS[0].width, height: "auto" }, controlsVisible: true, options: VIEWPORTS } }}
          overrides={{
            headerActions: () => (
              <HeaderActions
                site={site}
                status={status}
                isOnline={isOnline}
                onSave={(data) => void run("save", data)}
                onPublish={(data) => void run("publish", data)}
                onPreview={(data) => void preview(data, status === "dirty")}
              />
            ),
          }}
        />
      </div>
    </div>
  );
}

function HeaderActions({
  site,
  status,
  isOnline,
  onSave,
  onPublish,
  onPreview,
}: {
  site: Props["site"];
  status: Status;
  isOnline: boolean;
  onSave: (data: Data) => void;
  onPublish: (data: Data) => void;
  onPreview: (data: Data) => void;
}) {
  const getPuck = useGetPuck();
  const busy = status === "saving" || status === "publishing";
  const currentData = () => getPuck().appState.data as Data;

  return (
    <div className="flex flex-nowrap items-center gap-2 whitespace-nowrap">
      <Link
        href="/"
        // Navigation interne : beforeunload ne se déclenche pas, d'où la confirmation ici.
        onClick={(event) => {
          if (status === "dirty" && !window.confirm("Quitter l'éditeur ? Vos modifications non enregistrées seront perdues.")) {
            event.preventDefault();
          }
        }}
        className={`inline-flex items-center gap-1.5 rounded-control px-2 py-1.5 text-[13px] font-semibold text-body hover:text-ink ${FOCUS}`}
      >
        <ArrowLeft size={15} aria-hidden />
        Mes sites
      </Link>

      <span id="editor-status" role="status" aria-live="polite" className="hidden px-2 text-[12px] text-faint lg:inline">
        {status === "published" && isOnline ? (
          <>
            Publié —{" "}
            <a href={site.url} target="_blank" rel="noopener noreferrer" className={`font-semibold text-brand-ink hover:underline ${FOCUS}`}>
              voir le site
            </a>
          </>
        ) : (
          STATUS_TEXT[status]
        )}
      </span>

      <button type="button" className={BTN_GHOST} disabled={busy} onClick={() => onPreview(currentData())}>
        <Eye size={15} aria-hidden />
        Aperçu
      </button>
      <button type="button" className={BTN_GHOST} disabled={busy} onClick={() => onSave(currentData())}>
        {status === "saving" ? <Loader2 size={15} className="animate-spin" aria-hidden /> : <Save size={15} aria-hidden />}
        Enregistrer
      </button>
      <button type="button" className={BTN_PRIMARY} disabled={busy} onClick={() => onPublish(currentData())}>
        {status === "publishing" ? <Loader2 size={15} className="animate-spin" aria-hidden /> : <Send size={15} aria-hidden />}
        Publier
      </button>
    </div>
  );
}
