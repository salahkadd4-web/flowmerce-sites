"use client";

// Éditeur Puck : même configuration que le rendu public (blocks/puck.config.ts).
// En-tête : retour, aperçu, enregistrer, publier, avec l'état des modifications.

import "@puckeditor/core/puck.css";
import { Puck, useGetPuck, type Data } from "@puckeditor/core";
import Link from "next/link";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ClipboardList,
  Eye,
  GripVertical,
  Image as ImageIcon,
  Loader2,
  MousePointerClick,
  PanelBottom,
  PanelTop,
  Save,
  Send,
  ShoppingBag,
  Type,
  type LucideIcon,
} from "lucide-react";
import { BTN_GHOST, BTN_PRIMARY, FOCUS, Notice } from "@/components/dashboard/ui";
import { dictionaryFr } from "@/blocks/dictionary.fr";
import { isPageLang, type PageLang } from "@/blocks/i18n";
import { BLOCK_DESCRIPTIONS, BLOCK_LABELS, isBlockType, type BlockType } from "@/blocks/schemas";
import type { PublicProduct } from "@/lib/product-input";
import type { ShippingOption } from "@/lib/shipping";
import type { StorefrontMetadata } from "@/lib/storefront";
import { buildEditorConfig } from "./editor-config";
import { publishPage, saveDraft, type EditorActionResult } from "./actions";
import { installKeyboardEventGuard } from "./keyboard-event-guard";

type Status = "clean" | "dirty" | "saving" | "saved" | "publishing" | "published";

type Props = {
  pageId: string;
  site: { name: string; url: string; published: boolean };
  initialData: unknown;
  /** Produits actifs du vendeur et frais du site : mêmes données que le site public. */
  products: PublicProduct[];
  shipping: ShippingOption[];
};

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

export function Editor({ pageId, site, initialData, products, shipping }: Props) {
  const [status, setStatus] = useState<Status>("clean");
  const config = useMemo(() => buildEditorConfig(products), [products]);
  // Produit de la page suivi en direct : la fiche et le formulaire s'affichent dès qu'il est choisi.
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
    setPageProductId(productIdOf(data));
    setLang(langOf(data));
    setEmpty(isEmptyPage(data));
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
        <EmptyPageContext.Provider value={empty}>
          <Puck
            config={config}
            metadata={metadata}
            data={initialData as Partial<Data>}
            dictionary={dictionaryFr}
            viewports={VIEWPORTS}
            onChange={onChange}
            headerTitle={site.name}
            height="100%"
            // Aperçu mobile par défaut : la majorité du trafic des landing pages (§2.2).
            ui={{ viewports: { current: { width: VIEWPORTS[0].width, height: "auto" }, controlsVisible: true, options: VIEWPORTS } }}
            overrides={{
              // Composants stables (hors du rendu) : une fonction recréée à chaque rendu
              // ferait remonter l'aperçu par Puck, et le texte en cours de saisie perdrait le focus.
              drawerItem: DrawerItem,
              preview: PreviewWithHint,
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
        </EmptyPageContext.Provider>
      </div>
    </div>
  );
}

/** Page vide : lu par l'aperçu, qui garde ainsi une identité stable. */
const EmptyPageContext = createContext(false);

function PreviewWithHint({ children }: { children?: ReactNode }) {
  const empty = useContext(EmptyPageContext);
  return (
    <>
      {empty && (
        <div className="mx-auto w-full max-w-md px-4 pt-4">
          <Notice icon={MousePointerClick} title="Votre page est vide">
            Glissez un bloc depuis la colonne de gauche pour commencer.
          </Notice>
        </div>
      )}
      {children}
    </>
  );
}

const BLOCK_ICONS: Record<BlockType, LucideIcon> = {
  Hero: PanelTop,
  Product: ShoppingBag,
  Text: Type,
  OrderForm: ClipboardList,
  Image: ImageIcon,
  Footer: PanelBottom,
};

/** Bloc de la colonne de gauche : icône, nom et ce qu'il contient. */
function DrawerItem({ name }: { name: string; children?: ReactNode }) {
  if (!isBlockType(name)) return <div className="rounded-control border border-line bg-white px-3 py-2.5 text-[13px]">{name}</div>;
  const Icon = BLOCK_ICONS[name];
  return (
    <div className="flex cursor-grab items-center gap-3 rounded-control border border-line bg-white px-3 py-2.5 transition-colors hover:border-brand hover:bg-brand-soft">
      <Icon size={16} aria-hidden className="shrink-0 text-brand" />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-[13px] font-semibold text-ink">{BLOCK_LABELS[name]}</span>
        <span className="text-[12px] leading-snug text-faint">{BLOCK_DESCRIPTIONS[name]}</span>
      </span>
      <GripVertical size={16} aria-hidden className="shrink-0 text-faint" />
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
