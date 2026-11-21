"use client";

// Barre de la section choisie (remplace la barre d'actions de Puck) :
// nom · réglages propres au type · Fond · Espacement · Monter · Descendre ·
// Dupliquer · Supprimer. Pendant l'écriture d'un texte, Puck y place la barre de
// mise en forme (gras, taille, couleur…) : elle s'affiche alors seule, au-dessus
// de la section, comme dans Word.

import { createUsePuck } from "@puckeditor/core";
import { ArrowDown, ArrowUp, Contact, Copy, Image as ImageIcon, Package, PaintBucket, Share2, StretchVertical, Trash2, Type, Images } from "lucide-react";
import { Children, Fragment, isValidElement, useEffect, useRef, useState, type ReactElement, type ReactNode } from "react";
import { Popover } from "@/blocks/editor/Popover";
import { ToolbarButton } from "@/blocks/editor/ToolbarButton";
import {
  ContactsPanel,
  EspacementPanel,
  FondPanel,
  ImagePanel,
  PhotosPanel,
  ProductChoicePanel,
  ReseauxPanel,
  TextStylePanel,
} from "@/blocks/editor/panels";
import { useSelectedBlock } from "@/blocks/editor/use-block";
import { ROOT_ZONE } from "./sections";

const usePuck = createUsePuck();

type Props = { label?: string; children: ReactNode; dragHandle?: ReactNode };

/** Barre de mise en forme que Puck ajoute quand un texte est en cours d'écriture. */
function textMenuOf(children: ReactNode): ReactNode | null {
  const [first] = Children.toArray(children);
  if (!isValidElement(first) || first.type !== Fragment) return null;
  const [menu] = Children.toArray((first as ReactElement<{ children?: ReactNode }>).props.children);
  return menu ?? null;
}

// Jamais plus large que la page : sur l'aperçu téléphone, elle passe sur deux lignes.
/**
 * Un texte est en cours d'écriture si le focus est dans un texte modifiable de la
 * page, ou dans sa barre et ses fenêtres. Puck garde le texte « actif » après un clic
 * hors de l'aperçu (colonne des sections) : sans ce contrôle, la barre de mise en
 * forme resterait à la place de celle de la section.
 */
function useTyping(anchor: React.RefObject<HTMLElement | null>): boolean {
  const [typing, setTyping] = useState(true);
  useEffect(() => {
    const doc = anchor.current?.ownerDocument;
    const win = doc?.defaultView;
    if (!doc || !win) return;
    let frame = 0;
    const check = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const active = doc.activeElement;
        setTyping(doc.hasFocus() && !!active?.closest('[contenteditable="true"], [data-puck-rte-menu]'));
      });
    };
    check();
    doc.addEventListener("focusin", check);
    doc.addEventListener("focusout", check);
    win.addEventListener("blur", check);
    win.addEventListener("focus", check);
    return () => {
      cancelAnimationFrame(frame);
      doc.removeEventListener("focusin", check);
      doc.removeEventListener("focusout", check);
      win.removeEventListener("blur", check);
      win.removeEventListener("focus", check);
    };
  }, [anchor]);
  return typing;
}

const RTE_COLORS = {
  "--puck-color-text-inverse": "#0f1a3d",
  "--puck-actionbar-color-text": "#0f1a3d",
  "--puck-actionbar-opacity-text": "1",
  "--puck-actionbar-color-action-hover": "#4338ca",
  "--puck-actionbar-color-action-active": "#4338ca",
  "--puck-color-interactive-inverse-hover": "#4338ca",
  "--puck-color-interactive-inverse-active": "#4338ca",
  "--puck-color-border-inverse": "#e5e8f3",
} as React.CSSProperties;

const BAR = "flex max-w-[calc(100vw-16px)] flex-wrap items-center justify-end gap-0.5 rounded-control border border-line bg-white p-1 text-ink shadow-lg";
const SEP = <span aria-hidden className="mx-1 h-5 w-px bg-line" />;

export function SectionBar({ label, children, dragHandle }: Props) {
  const { id, type, props, set } = useSelectedBlock();
  const dispatch = usePuck((s) => s.dispatch);
  const selector = usePuck((s) => s.appState.ui.itemSelector);
  const count = usePuck((s) => s.appState.data.content.length);
  const anchor = useRef<HTMLDivElement>(null);
  const typing = useTyping(anchor);
  const textMenu = textMenuOf(children);

  if (textMenu && typing) {
    return (
      // Puck dessine ses boutons (gras…) en blanc pour sa barre sombre : sur notre barre
      // claire, ses variables de couleur prennent l'encre et l'indigo du thème.
      <div ref={anchor} className={BAR} style={RTE_COLORS} onClick={(e) => e.stopPropagation()} role="toolbar" aria-label="Mise en forme du texte">
        {textMenu}
      </div>
    );
  }
  if (!id || !selector) return <span ref={anchor} hidden />;

  const index = selector.index;
  const zone = selector.zone ?? ROOT_ZONE;
  const move = (to: number) => {
    dispatch({ type: "move", sourceIndex: index, sourceZone: zone, destinationIndex: to, destinationZone: zone });
    dispatch({ type: "setUi", ui: { itemSelector: { index: to, zone } } });
  };
  const panel = { props, set };

  return (
    <div ref={anchor} className={BAR} onClick={(e) => e.stopPropagation()} role="toolbar" aria-label={`Section ${label ?? ""}`}>
      {dragHandle}
      <span className="px-1.5 text-[12px] font-bold text-ink max-sm:hidden">{label}</span>
      <span className="max-sm:hidden">{SEP}</span>
      {type === "Hero" && (
        <Popover label="Image de la bannière" icon={ImageIcon} text="Image">
          <ImagePanel {...panel} />
        </Popover>
      )}
      {type === "Product" && (
        <>
          <Popover label="Produit de la page" icon={Package} text="Produit">
            <ProductChoicePanel />
          </Popover>
          <Popover label="Photos du produit" icon={Images} text="Photos">
            <PhotosPanel {...panel} />
          </Popover>
          <Popover label="Texte de la fiche produit" icon={Type} text="Texte">
            <TextStylePanel {...panel} />
          </Popover>
        </>
      )}
      {type === "OrderForm" && (
        <Popover label="Titre du formulaire" icon={Type} text="Texte">
          <TextStylePanel {...panel} text={false} />
        </Popover>
      )}
      {type === "Footer" && (
        <>
          <Popover label="Contacts" icon={Contact} text="Contacts">
            <ContactsPanel {...panel} />
          </Popover>
          <Popover label="Réseaux sociaux" icon={Share2} text="Réseaux">
            <ReseauxPanel {...panel} />
          </Popover>
          <Popover label="Texte du pied de page" icon={Type} text="Texte">
            <TextStylePanel {...panel} />
          </Popover>
        </>
      )}
      <Popover label="Fond de la section" icon={PaintBucket} text="Fond">
        <FondPanel {...panel} />
      </Popover>
      <Popover label="Espacement de la section" icon={StretchVertical} text="Espacement" align="end">
        <EspacementPanel {...panel} />
      </Popover>
      {SEP}
      <ToolbarButton label="Monter la section" icon={ArrowUp} disabled={index === 0} onClick={() => move(index - 1)} />
      <ToolbarButton label="Descendre la section" icon={ArrowDown} disabled={index >= count - 1} onClick={() => move(index + 1)} />
      <ToolbarButton label="Dupliquer la section" icon={Copy} onClick={() => dispatch({ type: "duplicate", sourceIndex: index, sourceZone: zone })} />
      <ToolbarButton
        label="Supprimer la section (Ctrl+Z pour annuler)"
        icon={Trash2}
        tone="danger"
        onClick={() => {
          dispatch({ type: "remove", index, zone });
          dispatch({ type: "setUi", ui: { itemSelector: null } });
        }}
      />
    </div>
  );
}
