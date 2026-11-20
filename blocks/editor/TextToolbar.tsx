"use client";

// Barre de mise en forme d'un texte écrit dans la page, comme dans Word :
// gras, italique, souligné, barré, puis taille, couleur et alignement de ce texte.
// Puck l'affiche au-dessus de la section pendant l'écriture. Taille et couleur
// s'écrivent dans les réglages de la section (typography.*), l'alignement dans
// align. Tout reste dans le menu de Puck ([data-puck-rte-menu]) : le texte garde
// le focus et la barre ne disparaît pas quand on ouvre une fenêtre.

import { RichTextMenu } from "@puckeditor/core";
import { AlignCenter, AlignLeft, Baseline, CaseSensitive } from "lucide-react";
import type { ComponentType } from "react";
import { DEFAULT_TYPOGRAPHY, type Typography } from "@/blocks/style";
import { readGroup } from "./block-patch";
import { ColorSwatches } from "./ColorSwatches";
import { SIZE_CHOICES } from "./panels";
import { Popover } from "./Popover";
import { SegmentedChoice } from "./SegmentedChoice";
import { ToolbarButton } from "./ToolbarButton";
import { useSelectedBlock } from "./use-block";

export type TextStyle = { size: "titleSize" | "textSize"; color: "titleColor" | "textColor"; align?: true };

const cache = new Map<string, ComponentType>();

/** Barre d'un texte donné : créée une fois par réglage (un composant recréé ferait remonter l'aperçu). */
export function textToolbar(style: TextStyle): ComponentType {
  const key = `${style.size}|${style.color}|${style.align ? 1 : 0}`;
  const cached = cache.get(key);
  if (cached) return cached;

  const TextToolbar = () => {
    const { props, set } = useSelectedBlock();
    const typography = readGroup<Typography>(props, "typography", DEFAULT_TYPOGRAPHY);
    const align = props.align === "center" ? "center" : "left";
    return (
      <RichTextMenu>
        <RichTextMenu.Group>
          <RichTextMenu.Bold />
          <RichTextMenu.Italic />
          <RichTextMenu.Underline />
          <RichTextMenu.Strikethrough />
        </RichTextMenu.Group>
        <RichTextMenu.Group>
          <Popover label="Taille du texte" icon={CaseSensitive} text="Taille" width={300}>
            <SegmentedChoice label="Taille" value={typography[style.size]} options={SIZE_CHOICES} onChange={(v) => set(`typography.${style.size}`, v)} />
          </Popover>
          <Popover label="Couleur du texte" icon={Baseline} text="Couleur">
            <ColorSwatches label="Couleur" value={typography[style.color]} onChange={(v) => set(`typography.${style.color}`, v)} allowAuto />
          </Popover>
          {style.align && (
            <ToolbarButton
              label={align === "center" ? "Aligner au début de la ligne" : "Centrer"}
              icon={align === "center" ? AlignCenter : AlignLeft}
              onClick={() => set("align", align === "center" ? "left" : "center")}
            />
          )}
        </RichTextMenu.Group>
      </RichTextMenu>
    );
  };
  cache.set(key, TextToolbar);
  return TextToolbar;
}
