"use client";

// Éditeur de page, façon Word / PowerPoint : tout se règle dans la page même.
// Puck en mode composition : notre propre cadre (barre du haut, colonne des
// sections, aperçu au centre), sans panneau de réglages à droite. Même
// configuration que le rendu public (blocks/puck.config.ts), plus les barres
// d'outils de l'éditeur (editor-config.ts).

import "@puckeditor/core/puck.css";
import { Puck, useGetPuck, type Data } from "@puckeditor/core";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, useSyncExternalStore, type ReactNode } from "react";
import { AlertTriangle, Plus } from "lucide-react";
import { BTN_PRIMARY, Notice } from "@/components/dashboard/ui";
import { dictionaryFr } from "@/blocks/dictionary.fr";
import { isPageLang, type PageLang } from "@/blocks/i18n";
import type { PublicProduct } from "@/lib/product-input";
import type { ShippingOption } from "@/lib/shipping";
import type { StorefrontMetadata } from "@/lib/storefront";
import { buildEditorConfig } from "./editor-config";
import { publishPage, saveDraft } from "./actions";
import { installKeyboardEventGuard } from "./keyboard-event-guard";
import { createAutosave, type AutosaveStatus } from "./shell/autosave";
import { AddSectionDialog } from "./shell/AddSectionDialog";
import { PageSettingsDialog } from "./shell/PageSettingsDialog";
import { SectionBar } from "./shell/SectionBar";
import { SectionOverlay } from "./shell/SectionOverlay";
import { SectionsColumn } from "./shell/SectionsColumn";
import { SettingsPanel } from "./shell/SettingsPanel";
import { TemplatesDialog } from "./shell/TemplatesDialog";
import { TopBar, type Device } from "./shell/TopBar";

type Props = {
  pageId: string;
  site: { name: string; url: string; published: boolean };
  initialData: unknown;
  /** Produits actifs du vendeur et frais du site : mêmes données que le site public. */
  products: PublicProduct[];
  shipping: ShippingOption[];
};

const PANEL_KEY = "fm-editor-panel";
const PANEL_EVENT = "fm-editor-panel";

/** Choix du vendeur pour le panneau des réglages (stockage du navigateur ; sans lui, affiché). */
function readPanel(): boolean {
  try {
    return window.localStorage.getItem(PANEL_KEY) !== "0";
  } catch {
    return true;
  }
}
function writePanel(open: boolean) {
  try {
    window.localStorage.setItem(PANEL_KEY, open ? "1" : "0");
  } catch {
    // Stockage indisponible (navigation privée…) : le choix ne peut pas être retenu.
  }
  window.dispatchEvent(new Event(PANEL_EVENT));
}
function subscribePanel(notify: () => void) {
  window.addEventListener(PANEL_EVENT, notify);
  window.addEventListener("storage", notify);
  return () => {
    window.removeEventListener(PANEL_EVENT, notify);
    window.removeEventListener("storage", notify);
  };
}

const SERVER_DOWN = "Le serveur ne répond pas. Vos modifications ne sont pas perdues : réessayez.";

function langOf(data: unknown): PageLang {
  const value = (data as { root?: { props?: { lang?: unknown } } } | null)?.root?.props?.lang;
  return isPageLang(value) ? value : "fr";
}

function isEmptyPage(data: unknown): boolean {
  const content = (data as { content?: unknown } | null)?.content;
  return !Array.isArray(content) || content.length === 0;
}

function productIdOf(data: unknown): string | undefined {
  const value = (data as { root?: { props?: { productId?: unknown } } } | null)?.root?.props?.productId;
  return typeof value === "string" && value !== "" ? value : undefined;
}

export function Editor({ pageId, site, initialData, products, shipping }: Props) {
  const config = useMemo(() => buildEditorConfig(products), [products]);
  // Produit et langue de la page suivis en direct : la fiche, le formulaire et les
  // textes de l'acheteur suivent le choix du vendeur.
  const [pageProductId, setPageProductId] = useState(() => productIdOf(initialData));
  const [lang, setLang] = useState(() => langOf(initialData));
  const [empty, setEmpty] = useState(() => isEmptyPage(initialData));
  const metadata = useMemo<StorefrontMetadata>(
    () => ({
      products: Object.fromEntries(products.map((p) => [p.id, p])),
      shipping,
      ...(pageProductId ? { pageProductId } : {}),
      lang,
    }),
    [products, shipping, pageProductId, lang],
  );

  const [status, setStatus] = useState<AutosaveStatus>("clean");
  const [error, setError] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [isOnline, setIsOnline] = useState(site.published);
  const [justPublished, setJustPublished] = useState(false);
  const [device, setDevice] = useState<Device>("phone");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  // Panneau des réglages à droite : affiché par défaut, le choix du vendeur est retenu.
  const panelOpen = useSyncExternalStore(subscribePanel, readPanel, () => true);
  const togglePanel = useCallback(() => writePanel(!readPanel()), []);
  const emptyPage = useMemo(() => ({ empty, onAdd: () => setAddOpen(true) }), [empty]);
  const [autosave] = useState(() =>
    createAutosave<Data>({
      // Le premier onChange de Puck (chargement de la page) n'est pas une modification.
      initial: initialData as Data,
      onStatus: setStatus,
      save: async (data) => {
        try {
          const result = await saveDraft(pageId, data);
          if (!result.ok) {
            setError(result.error);
            return false;
          }
          setError("");
          return true;
        } catch {
          setError(SERVER_DOWN);
          return false;
        }
      },
    }),
  );
  useEffect(() => () => autosave.dispose(), [autosave]);

  // Remplissage automatique et extensions envoient des keydown incomplets qui
  // font planter les raccourcis de Puck (voir keyboard-event-guard.ts).
  useEffect(() => installKeyboardEventGuard(window), []);

  // Avertir avant de quitter tant que tout n'est pas enregistré.
  useEffect(() => {
    if (status !== "pending" && status !== "saving" && status !== "error") return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [status]);

  // Ctrl+S (ou Cmd+S) : enregistrer tout de suite plutôt que d'ouvrir « Enregistrer sous ».
  // Ici pour l'éditeur ; dans l'aperçu (iframe), par SaveShortcutFrame.
  const flush = useCallback(() => void autosave.flush(), [autosave]);
  useEffect(() => listenSaveShortcut(window.document, flush), [flush]);

  const onChange = useCallback(
    (data: Data) => {
      setPageProductId(productIdOf(data));
      setLang(langOf(data));
      setEmpty(isEmptyPage(data));
      autosave.change(data);
      if (!autosave.isIdle()) setJustPublished(false);
    },
    [autosave],
  );

  const publish = useCallback(
    async (data: Data) => {
      setPublishing(true);
      setError("");
      try {
        // La publication part de la dernière version : rien ne doit rester en route.
        await autosave.flush();
        const result = await publishPage(pageId, data).catch(() => ({ ok: false as const, error: SERVER_DOWN }));
        if (!result.ok) {
          setError(result.error);
          return;
        }
        autosave.markSaved(data);
        setIsOnline(true);
        setJustPublished(true);
      } finally {
        setPublishing(false);
      }
    },
    [autosave, pageId],
  );

  // L'aperçu affiche le brouillon enregistré : on enregistre d'abord. L'onglet est
  // ouvert dès le clic (sinon le navigateur le bloquerait), puis dirigé vers l'aperçu.
  const preview = useCallback(async () => {
    const url = `/preview/${pageId}`;
    if (autosave.isIdle()) {
      window.open(url, "_blank", "noopener");
      return;
    }
    const tab = window.open("", "_blank");
    if (await autosave.flush()) {
      if (tab) tab.location.href = url;
    } else {
      tab?.close();
    }
  }, [autosave, pageId]);

  return (
    <div className="flex h-dvh flex-col bg-page">
      <FlushContext.Provider value={flush}>
      <EmptyPageContext.Provider value={emptyPage}>
        <Puck
          config={config}
          metadata={metadata}
          data={initialData as Partial<Data>}
          dictionary={dictionaryFr}
          onChange={onChange}
          height="100%"
          overrides={{
            // Composants stables (hors du rendu) : une fonction recréée à chaque rendu
            // ferait remonter l'aperçu par Puck, et le texte en cours de saisie perdrait le focus.
            preview: PreviewWithHint,
            actionBar: SectionBar,
            iframe: SaveShortcutFrame,
            componentOverlay: SectionOverlay,
          }}
        >
          <EditorLayout
            site={site}
            status={status}
            error={error}
            publishing={publishing}
            published={justPublished && isOnline}
            device={device}
            onDevice={setDevice}
            onRetry={() => void autosave.flush()}
            onPreview={() => void preview()}
            onPublish={publish}
            settingsOpen={settingsOpen}
            onSettings={setSettingsOpen}
            addOpen={addOpen}
            onAdd={setAddOpen}
            templatesOpen={templatesOpen}
            onTemplates={setTemplatesOpen}
            panelOpen={panelOpen}
            onTogglePanel={togglePanel}
          />
        </Puck>
      </EmptyPageContext.Provider>
      </FlushContext.Provider>
    </div>
  );
}

type LayoutProps = {
  site: Props["site"];
  status: AutosaveStatus;
  error: string;
  publishing: boolean;
  published: boolean;
  device: Device;
  onDevice: (device: Device) => void;
  onRetry: () => void;
  onPreview: () => void;
  onPublish: (data: Data) => void;
  settingsOpen: boolean;
  onSettings: (open: boolean) => void;
  addOpen: boolean;
  onAdd: (open: boolean) => void;
  templatesOpen: boolean;
  onTemplates: (open: boolean) => void;
  panelOpen: boolean;
  onTogglePanel: () => void;
};

/** Cadre de l'éditeur, rendu dans Puck (accès à son état et à ses actions). */
function EditorLayout({
  site,
  status,
  error,
  publishing,
  published,
  device,
  onDevice,
  onRetry,
  onPreview,
  onPublish,
  settingsOpen,
  onSettings,
  addOpen,
  onAdd,
  templatesOpen,
  onTemplates,
  panelOpen,
  onTogglePanel,
}: LayoutProps) {
  const getPuck = useGetPuck();
  return (
    <div className="flex h-full flex-col">
      <TopBar
        site={site}
        status={status}
        publishing={publishing}
        published={published}
        device={device}
        onDevice={onDevice}
        onRetry={onRetry}
        onOpenSettings={() => onSettings(true)}
        onOpenTemplates={() => onTemplates(true)}
        panelOpen={panelOpen}
        onTogglePanel={onTogglePanel}
        onPreview={onPreview}
        onPublish={() => onPublish(getPuck().appState.data as Data)}
      />
      {error && (
        <div className="border-b border-line bg-surface p-3">
          <Notice tone="danger" icon={AlertTriangle} title="Action impossible">
            {error}
          </Notice>
        </div>
      )}
      <div className="flex min-h-0 flex-1">
        <SectionsColumn onAdd={() => onAdd(true)} />
        <main className="flex min-w-0 flex-1 justify-center overflow-hidden p-4">
          <div
            className="editor-canvas h-full overflow-hidden rounded-card border border-line bg-surface shadow-sm transition-[width] duration-200"
            style={{ width: device === "phone" ? 390 : "100%" }}
          >
            <Puck.Preview />
          </div>
        </main>
        {panelOpen && <SettingsPanel onClose={onTogglePanel} />}
      </div>
      <PageSettingsDialog open={settingsOpen} onClose={() => onSettings(false)} />
      <AddSectionDialog open={addOpen} onClose={() => onAdd(false)} />
      <TemplatesDialog open={templatesOpen} onClose={() => onTemplates(false)} />
    </div>
  );
}

/** Ctrl+S / Cmd+S sur un document : enregistrer tout de suite. */
function listenSaveShortcut(doc: Document, flush: () => void): () => void {
  const onKeyDown = (event: KeyboardEvent) => {
    if ((event.ctrlKey || event.metaKey) && event.key?.toLowerCase() === "s") {
      event.preventDefault();
      flush();
    }
  };
  doc.addEventListener("keydown", onKeyDown);
  return () => doc.removeEventListener("keydown", onKeyDown);
}

/** Enregistrement immédiat, lu par l'aperçu. */
const FlushContext = createContext<() => void>(() => {});

/** Document de l'aperçu (iframe) : y écoute Ctrl+S, car ses touches ne remontent pas à l'éditeur. */
function SaveShortcutFrame({ children, document: doc }: { children?: ReactNode; document?: Document }) {
  const flush = useContext(FlushContext);
  useEffect(() => (doc ? listenSaveShortcut(doc, flush) : undefined), [doc, flush]);
  return <>{children}</>;
}

/** Page vide : lu par l'aperçu, qui garde ainsi une identité stable. */
const EmptyPageContext = createContext<{ empty: boolean; onAdd: () => void }>({ empty: false, onAdd: () => {} });

function PreviewWithHint({ children }: { children?: ReactNode }) {
  const { empty, onAdd } = useContext(EmptyPageContext);
  return (
    <>
      {empty && (
        <div className="mx-auto flex w-full max-w-sm flex-col items-center gap-3 px-6 py-16 text-center">
          <p className="text-[17px] font-bold text-ink">Votre page est vide</p>
          <p className="text-[14px] text-body">Ajoutez une première section : une bannière, votre produit, le formulaire de commande…</p>
          <button type="button" onClick={onAdd} className={BTN_PRIMARY}>
            <Plus size={16} aria-hidden />
            Ajouter une section
          </button>
        </div>
      )}
      {children}
    </>
  );
}
