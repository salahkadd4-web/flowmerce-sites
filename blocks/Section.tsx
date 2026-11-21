// Cadre commun d'une section : fond (par défaut, couleur ou image assombrie),
// hauteur et largeur du contenu. Composant serveur, sans hook.

import Image from "next/image";
import type { CSSProperties, ReactNode } from "react";
import { SPACING, WIDTHS, type SectionStyle, type Tone } from "@/blocks/style";

export type SectionDefaults = {
  /** Ton du fond par défaut du bloc. */
  tone: Tone;
  /** Classes du fond par défaut (couleur, texte). */
  className: string;
  /** Marges verticales « normales » du bloc. */
  padding: string;
  /** Largeur « normale » du contenu. */
  width: string;
};

type Props = {
  style: SectionStyle;
  defaults: SectionDefaults;
  as?: "section" | "footer";
  id?: string;
  /** Sans marges latérales : contenu bord à bord (image pleine largeur). */
  bleed?: boolean;
  /** Classes du conteneur du contenu. */
  inner?: string;
  /** Image de fond préchargée : section du haut de page (bannière). */
  preload?: boolean;
  children: ReactNode;
};

export function Section({ style, defaults, as: Tag = "section", id, bleed = false, inner = "", preload = false, children }: Props) {
  const image = style.background === "image" ? style.backgroundImage : null;
  const colored = style.background === "color";
  const padding = style.spacing === "normal" ? defaults.padding : SPACING[style.spacing];
  const width = style.width === "normal" ? defaults.width : WIDTHS[style.width];
  // Section haute (poignée du bas) : hauteur en % de l'écran, contenu centré verticalement.
  const tall = (style.minHeight ?? 0) > 0;
  const frameStyle: CSSProperties | undefined =
    colored || tall
      ? { ...(colored ? { backgroundColor: style.backgroundColor } : {}), ...(tall ? { minHeight: `${style.minHeight}svh` } : {}) }
      : undefined;
  const background = colored || image ? "" : defaults.className;

  return (
    <Tag
      id={id}
      style={frameStyle}
      className={`relative isolate ${tall ? "flex flex-col justify-center" : ""} ${bleed ? "" : "px-4"} ${padding} ${background} ${id ? "scroll-mt-4" : ""}`.replace(/\s+/g, " ").trim()}
    >
      {image && (
        <>
          <Image src={image.url} alt="" fill sizes="100vw" preload={preload} className="-z-10 object-cover" />
          {style.overlay > 0 && (
            <div aria-hidden="true" className="absolute inset-0 -z-10 bg-black" style={{ opacity: style.overlay / 100 }} />
          )}
        </>
      )}
      <div className={`relative mx-auto ${tall ? "w-full" : ""} ${width} ${inner}`.replace(/\s+/g, " ").trim()}>{children}</div>
    </Tag>
  );
}
