"use client";

// Colonne de gauche : les sections de la page dans l'ordre, comme les diapositives
// de Google Slides. Un clic choisit la section (et l'amène à l'écran), Monter /
// Descendre la déplacent, « Ajouter une section » ouvre la liste des sections.

import { createUsePuck } from "@puckeditor/core";
import { ChevronDown, ChevronUp, Plus } from "lucide-react";
import { useEffect, useMemo } from "react";
import { BTN_PRIMARY, FOCUS } from "@/components/dashboard/ui";
import { blockIcon } from "./block-icons";
import { listSections, ROOT_ZONE } from "./sections";

const usePuck = createUsePuck();

/** Amène une section à l'écran, dans l'aperçu (iframe). */
export function scrollToSection(id: string) {
  const frame = document.querySelector<HTMLIFrameElement>("#preview-frame");
  const element = frame?.contentDocument?.querySelector(`[data-puck-component="${CSS.escape(id)}"]`);
  element?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function SectionsColumn({ onAdd }: { onAdd: () => void }) {
  const content = usePuck((s) => s.appState.data.content);
  const selector = usePuck((s) => s.appState.ui.itemSelector);
  const dispatch = usePuck((s) => s.dispatch);
  const sections = useMemo(() => listSections(content as { type: string; props: { id: string } }[]), [content]);
  const selectedIndex = selector && (selector.zone ?? ROOT_ZONE) === ROOT_ZONE ? selector.index : null;

  // Section choisie dans la page : sa ligne reste visible dans la colonne.
  useEffect(() => {
    if (selectedIndex === null) return;
    document.querySelector(`[data-section-row="${selectedIndex}"]`)?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  const select = (index: number, id: string) => {
    dispatch({ type: "setUi", ui: { itemSelector: { index, zone: ROOT_ZONE } } });
    scrollToSection(id);
  };

  const move = (index: number, to: number) => {
    dispatch({ type: "move", sourceIndex: index, sourceZone: ROOT_ZONE, destinationIndex: to, destinationZone: ROOT_ZONE });
    dispatch({ type: "setUi", ui: { itemSelector: { index: to, zone: ROOT_ZONE } } });
  };

  return (
    <aside aria-labelledby="sections-title" className="flex w-72 shrink-0 flex-col border-e border-line bg-surface">
      <h2 id="sections-title" className="px-4 pt-4 pb-2 text-[12px] font-bold tracking-wide text-faint uppercase">
        Sections de la page
      </h2>
      <ol className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-2 pb-2">
        {sections.map((section) => {
          const Icon = blockIcon(section.type);
          const selected = section.index === selectedIndex;
          return (
            <li
              key={section.id}
              data-section-row={section.index}
              className={`group flex items-center gap-1 rounded-control border ${
                selected ? "border-brand bg-brand-soft" : "border-transparent hover:border-line hover:bg-page"
              }`}
            >
              <button
                type="button"
                aria-current={selected ? "true" : undefined}
                onClick={() => select(section.index, section.id)}
                className={`flex min-w-0 flex-1 items-center gap-2.5 rounded-control px-2 py-2 text-start ${FOCUS}`}
              >
                <span className="w-4 shrink-0 text-end text-[12px] font-semibold text-faint tabular-nums">{section.index + 1}</span>
                <Icon size={16} aria-hidden className={selected ? "shrink-0 text-brand" : "shrink-0 text-body"} />
                <span className={`truncate text-[13px] font-semibold ${selected ? "text-brand-ink" : "text-ink"}`}>{section.label}</span>
              </button>
              <span className={`flex shrink-0 pe-1 ${selected ? "" : "opacity-0 group-focus-within:opacity-100 group-hover:opacity-100"}`}>
                <button
                  type="button"
                  aria-label={`Monter la section ${section.label}`}
                  title="Monter"
                  disabled={section.index === 0}
                  onClick={() => move(section.index, section.index - 1)}
                  className={`rounded p-1 text-body hover:bg-surface hover:text-ink disabled:opacity-30 ${FOCUS}`}
                >
                  <ChevronUp size={15} aria-hidden />
                </button>
                <button
                  type="button"
                  aria-label={`Descendre la section ${section.label}`}
                  title="Descendre"
                  disabled={section.index === sections.length - 1}
                  onClick={() => move(section.index, section.index + 1)}
                  className={`rounded p-1 text-body hover:bg-surface hover:text-ink disabled:opacity-30 ${FOCUS}`}
                >
                  <ChevronDown size={15} aria-hidden />
                </button>
              </span>
            </li>
          );
        })}
        {sections.length === 0 && <li className="px-2 py-3 text-[13px] text-faint">Aucune section pour l&apos;instant.</li>}
      </ol>
      <div className="border-t border-line p-3">
        <button type="button" onClick={onAdd} className={`${BTN_PRIMARY} w-full`}>
          <Plus size={16} aria-hidden />
          Ajouter une section
        </button>
      </div>
    </aside>
  );
}
