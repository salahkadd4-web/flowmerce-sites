"use client";

// Fenêtre « Modèles » de l'éditeur : appliquer un modèle Flowmerce ou un des siens
// à la page (après confirmation ; Ctrl+Z revient en arrière), enregistrer la page
// comme modèle personnel, supprimer un modèle personnel, et donner ou retirer
// l'accord pour l'entraînement du générateur de modèles (IA).

import { useGetPuck, type Data } from "@puckeditor/core";
import { Check, Loader2, Save, Trash2, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { BTN_GHOST, BTN_PRIMARY, FIELD, FIELD_ERROR, FOCUS, HINT, LABEL } from "@/components/dashboard/ui";
import { TemplatePreview } from "@/components/templates/TemplatePreview";
import { deleteTemplate, listTemplates, loadTemplate, saveAsTemplate, setTemplateConsent, type TemplateCardData, type TemplatesState } from "../actions";
import { applyTemplate } from "./apply-template";

type Props = { open: boolean; onClose: () => void };

const CATEGORIES = ["Vêtements", "Chaussures", "Cosmétique", "Montres & accessoires", "Maison & cuisine", "Autre"];
const DATE = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" });

export function TemplatesDialog({ open, onClose }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const getPuck = useGetPuck();
  const [state, setState] = useState<TemplatesState | null>(null);
  const [error, setError] = useState("");
  const [confirming, setConfirming] = useState<TemplateCardData | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = async () => {
    const result = await listTemplates().catch(() => ({ ok: false as const, error: "Le serveur ne répond pas. Réessayez." }));
    if (result.ok) setState(result.state);
    else setError(result.error);
  };

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (open && !element.open) {
      setError("");
      setConfirming(null);
      element.showModal();
      void refresh();
    }
    if (!open && element.open) element.close();
  }, [open]);

  const apply = async (card: TemplateCardData) => {
    setBusy(true);
    setError("");
    const result = await loadTemplate(card.ref).catch(() => ({ ok: false as const, error: "Le serveur ne répond pas. Réessayez." }));
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    const { appState, dispatch } = getPuck();
    // recordHistory : Puck ne garde pas setData dans l'historique par défaut ; sans lui,
    // Ctrl+Z ne rendrait pas la page d'avant, contrairement à ce qu'annonce la confirmation.
    dispatch({ type: "setData", data: applyTemplate(appState.data, result.data) as Data, recordHistory: true });
    dispatch({ type: "setUi", ui: { itemSelector: null } });
    onClose();
  };

  const remove = async (card: TemplateCardData) => {
    if (!window.confirm(`Supprimer le modèle « ${card.name} » ? Les pages déjà créées avec lui ne changent pas.`)) return;
    await deleteTemplate(card.ref);
    await refresh();
  };

  return (
    <dialog
      ref={dialog}
      aria-labelledby="templates-title"
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      className="m-auto max-h-[90vh] w-[min(920px,calc(100vw-32px))] overflow-hidden rounded-card border border-line bg-surface p-0 shadow-2xl backdrop:bg-ink/40"
    >
      <div className="flex max-h-[90vh] flex-col">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 id="templates-title" className="text-[16px] font-bold text-ink">
            Modèles
          </h2>
          <button type="button" aria-label="Fermer" title="Fermer" onClick={onClose} className={`rounded-control p-1.5 text-body hover:text-ink ${FOCUS}`}>
            <X size={18} aria-hidden />
          </button>
        </div>

        <div className="flex flex-col gap-6 overflow-y-auto p-5">
          {error && (
            <p role="alert" className={FIELD_ERROR}>
              {error}
            </p>
          )}

          {confirming ? (
            <div role="alertdialog" aria-labelledby="confirm-title" aria-describedby="confirm-text" className="flex flex-col gap-4 rounded-card border border-line bg-page p-5">
              <p id="confirm-title" className="text-[15px] font-bold text-ink">
                Appliquer « {confirming.name} » ?
              </p>
              <p id="confirm-text" className="text-[14px] text-body">
                Votre page actuelle sera remplacée. Vous pourrez revenir en arrière avec Ctrl+Z. Le produit choisi, la langue et le nom de votre
                boutique sont gardés.
              </p>
              <div className="flex gap-2">
                <button type="button" className={BTN_PRIMARY} disabled={busy} autoFocus onClick={() => void apply(confirming)}>
                  {busy && <Loader2 size={15} className="animate-spin" aria-hidden />}
                  Remplacer la page
                </button>
                <button type="button" className={BTN_GHOST} disabled={busy} onClick={() => setConfirming(null)}>
                  Annuler
                </button>
              </div>
            </div>
          ) : !state ? (
            <p className="flex items-center gap-2 text-[14px] text-body">
              <Loader2 size={15} className="animate-spin" aria-hidden /> Chargement des modèles…
            </p>
          ) : (
            <>
              <CardGroup title="Modèles Flowmerce" cards={state.flowmerce} onPick={setConfirming} />
              <section aria-labelledby="mine-title" className="flex flex-col gap-3">
                <h3 id="mine-title" className="text-[13px] font-bold tracking-wide text-faint uppercase">
                  Mes modèles
                </h3>
                {state.mine.length === 0 ? (
                  <p className="text-[14px] text-body">Enregistrez votre page comme modèle pour la réutiliser sur un autre site.</p>
                ) : (
                  <CardGrid cards={state.mine} onPick={setConfirming} onDelete={(card) => void remove(card)} />
                )}
                <SaveForm onSaved={refresh} />
              </section>
              <ConsentBox consent={state.consent} onChange={refresh} />
            </>
          )}
        </div>
      </div>
    </dialog>
  );
}

function CardGroup({ title, cards, onPick }: { title: string; cards: TemplateCardData[]; onPick: (card: TemplateCardData) => void }) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="text-[13px] font-bold tracking-wide text-faint uppercase">{title}</h3>
      <CardGrid cards={cards} onPick={onPick} />
    </section>
  );
}

function CardGrid({ cards, onPick, onDelete }: { cards: TemplateCardData[]; onPick: (card: TemplateCardData) => void; onDelete?: (card: TemplateCardData) => void }) {
  return (
    <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
      {cards.map((card) => (
        <li key={card.ref} className="relative">
          <button
            type="button"
            onClick={() => onPick(card)}
            className={`group flex h-full w-full flex-col overflow-hidden rounded-card border-2 border-line bg-surface text-start transition-colors hover:border-brand/50 ${FOCUS}`}
          >
            <span className="relative block aspect-[4/5] overflow-hidden bg-page">
              <TemplatePreview preview={card.preview} cover={card.cover} />
            </span>
            <span className="flex flex-col gap-0.5 p-3">
              <span className="text-[11px] font-bold tracking-wide text-brand-ink uppercase">{card.category}</span>
              <span className="text-[14px] font-bold text-ink">{card.name}</span>
            </span>
          </button>
          {onDelete && (
            <button
              type="button"
              aria-label={`Supprimer le modèle ${card.name}`}
              title="Supprimer ce modèle"
              onClick={() => onDelete(card)}
              className={`absolute end-2 top-2 rounded-full bg-white/95 p-1.5 text-red-700 shadow hover:bg-white ${FOCUS}`}
            >
              <Trash2 size={15} aria-hidden />
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}

function SaveForm({ onSaved }: { onSaved: () => Promise<void> }) {
  const getPuck = useGetPuck();
  const id = useId();
  const [name, setName] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [pending, setPending] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setPending(true);
    setError("");
    setSaved(false);
    const result = await saveAsTemplate(name, category, getPuck().appState.data).catch(() => ({ ok: false as const, error: "Le serveur ne répond pas. Réessayez." }));
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setName("");
    setSaved(true);
    await onSaved();
  };

  return (
    <form onSubmit={(e) => void submit(e)} className="flex flex-col gap-3 rounded-card border border-line bg-page p-4" noValidate>
      <p className="text-[14px] font-bold text-ink">Enregistrer cette page comme modèle</p>
      <div className="grid gap-3 sm:grid-cols-[1fr_220px_auto] sm:items-end">
        <div>
          <label htmlFor={`${id}-name`} className={LABEL}>
            Nom du modèle
          </label>
          <input
            id={`${id}-name`}
            value={name}
            maxLength={60}
            onChange={(e) => setName(e.target.value)}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? `${id}-error` : undefined}
            className={FIELD}
            placeholder="Ma vitrine d'été"
          />
        </div>
        <div>
          <label htmlFor={`${id}-category`} className={LABEL}>
            Catégorie
          </label>
          <select id={`${id}-category`} value={category} onChange={(e) => setCategory(e.target.value)} className={FIELD}>
            {CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
        <button type="submit" disabled={pending} className={BTN_PRIMARY}>
          {pending ? <Loader2 size={15} className="animate-spin" aria-hidden /> : <Save size={15} aria-hidden />}
          Enregistrer
        </button>
      </div>
      {error && (
        <p id={`${id}-error`} role="alert" className={FIELD_ERROR}>
          {error}
        </p>
      )}
      {saved && (
        <p role="status" className="flex items-center gap-1.5 text-[13px] font-medium text-risk-low">
          <Check size={14} aria-hidden /> Modèle enregistré : il apparaît dans « Mes modèles » et à la création d&apos;un site.
        </p>
      )}
    </form>
  );
}

function ConsentBox({ consent, onChange }: { consent: TemplatesState["consent"]; onChange: () => Promise<void> }) {
  const [pending, setPending] = useState(false);
  // La case suit le clic tout de suite ; l'état du serveur la confirme ensuite.
  const [checked, setChecked] = useState(consent.consent);
  const [shown, setShown] = useState(consent.consent);
  if (shown !== consent.consent) {
    setShown(consent.consent);
    setChecked(consent.consent);
  }
  return (
    <div className="flex items-start gap-3 rounded-card border border-line p-4">
      <input
        id="templates-ai-consent"
        type="checkbox"
        checked={checked}
        disabled={pending}
        aria-describedby="templates-ai-consent-hint"
        onChange={async (e) => {
          setChecked(e.target.checked);
          setPending(true);
          await setTemplateConsent(e.target.checked);
          await onChange();
          setPending(false);
        }}
        className="mt-0.5 size-4 shrink-0 cursor-pointer accent-brand"
      />
      <div>
        <label htmlFor="templates-ai-consent" className="cursor-pointer text-[14px] font-semibold text-ink">
          J&apos;accepte que mes modèles de pages servent à améliorer le générateur de modèles de Flowmerce
        </label>
        <p id="templates-ai-consent-hint" className={HINT}>
          {consent.consent && consent.at
            ? `Accord donné le ${DATE.format(new Date(consent.at))}. Décochez pour le retirer.`
            : "Facultatif. Vos commandes et les coordonnées de vos clients n'en font jamais partie. Vous pouvez retirer cet accord à tout moment."}
        </p>
      </div>
    </div>
  );
}
