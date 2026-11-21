"use client";

// Boîte d'un bouton dans l'éditeur : quand sa section est choisie, une barre
// apparaît juste au-dessus du bouton — couleur, couleur du texte, taille, et pour
// la bannière « Mène vers ». Le texte du bouton s'écrit sur le bouton même.
// Injectée par editor-config.ts : jamais envoyée aux acheteurs.

import { createUsePuck, registerOverlayPortal } from "@puckeditor/core";
import { Baseline, Link2, PaintBucket, Ruler } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";
import { ButtonColorPanel, ButtonSizePanel, ButtonTextPanel, LinkPanel } from "./panels";
import { Popover } from "./Popover";
import { useBlockSetter, type BlockProps } from "./use-block";

const usePuck = createUsePuck();

type Props = { blockId: string; linkable?: boolean; children?: ReactNode };

export function EditableButton({ blockId, linkable = false, children }: Props) {
  const selected = usePuck((s) => (s.selectedItem?.props as BlockProps | undefined)?.id === blockId);
  const props = usePuck((s) => (s.selectedItem?.props as BlockProps | undefined)?.id === blockId ? (s.selectedItem!.props as BlockProps) : null);
  const set = useBlockSetter(blockId);
  const bar = useRef<HTMLDivElement>(null);

  // Puck rend inertes les éléments d'un bloc (pointer-events: none) : la barre
  // est déclarée « portail » de Puck, qui lui rend le pointeur sans lancer le
  // déplacement du bloc.
  useEffect(() => {
    if (!selected) return;
    return registerOverlayPortal(bar.current, { disableDrag: true });
  }, [selected]);

  return (
    <div className="relative flex flex-col">
      {children}
      {selected && props && (
        <div
          ref={bar}
          role="toolbar"
          aria-label="Bouton"
          onClick={(e) => e.stopPropagation()}
          className="absolute start-1/2 bottom-full z-40 mb-2 flex -translate-x-1/2 items-center gap-0.5 rounded-control border border-line bg-white p-1 text-ink shadow-lg rtl:translate-x-1/2"
        >
          <Popover label="Couleur du bouton" icon={PaintBucket} text="Couleur">
            <ButtonColorPanel props={props} set={set} />
          </Popover>
          <Popover label="Couleur du texte du bouton" icon={Baseline} text="Texte">
            <ButtonTextPanel props={props} set={set} />
          </Popover>
          <Popover label="Taille du bouton" icon={Ruler} text="Taille">
            <ButtonSizePanel props={props} set={set} />
          </Popover>
          {linkable && (
            <Popover label="Où mène le bouton" icon={Link2} text="Mène vers" align="end" width={288}>
              <LinkPanel props={props} set={set} />
            </Popover>
          )}
        </div>
      )}
    </div>
  );
}
