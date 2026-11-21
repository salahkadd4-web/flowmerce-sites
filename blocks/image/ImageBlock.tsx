// Image seule, avec texte alternatif obligatoire et légende facultative.
// Sans image choisie : rien sur le site public, un emplacement dans l'éditeur.

import Image from "next/image";
import type { ReactNode } from "react";
import { EMPTY_MESSAGES, renderEmpty as defaultEmpty, type RenderEmpty } from "@/blocks/empty-box";
import { frameStyle, renderImageBox as defaultImageBox, type RenderImageBox } from "@/blocks/image-box";
import { Section } from "@/blocks/Section";
import { hasText } from "@/blocks/rich-text";
import { DEFAULT_SECTION_STYLE, sectionTone, TEXT_AUTO } from "@/blocks/style";
import type { ImageProps } from "./schema";

const ROUNDED: Record<ImageProps["rounded"], string> = {
  none: "",
  soft: "rounded-card",
  strong: "rounded-3xl",
};

// La légende s'écrit dans la page : dans l'éditeur, elle arrive en élément d'édition de Puck.
type Props = Omit<ImageProps, "id" | "imageWidth" | "imageHeight" | "rounded" | "style" | "caption"> & { caption: ReactNode } &
  Partial<Pick<ImageProps, "imageWidth" | "imageHeight" | "rounded" | "style">> & { editing?: boolean; renderImageBox?: RenderImageBox; renderEmpty?: RenderEmpty };

export function ImageBlock({
  image,
  alt,
  caption,
  width,
  imageWidth = 100,
  imageHeight = null,
  rounded = "soft",
  style = DEFAULT_SECTION_STYLE,
  editing = false,
  renderImageBox = defaultImageBox,
  renderEmpty = defaultEmpty,
}: Props) {
  const full = width === "full";
  const defaults = { tone: "light" as const, className: "", padding: "py-8", width: full ? "max-w-none" : "max-w-3xl" };

  if (!image) {
    if (!editing) return null;
    return (
      <Section style={style} defaults={defaults}>
        <div className="flex aspect-[4/3] flex-col items-center justify-center gap-3 rounded-card border-2 border-dashed border-line bg-page p-6 text-center text-[14px] text-faint">
          {renderEmpty({ kind: "image", message: EMPTY_MESSAGES.image })}
        </div>
      </Section>
    );
  }

  const tone = sectionTone(style, defaults.tone);
  return (
    <Section style={style} defaults={defaults} bleed={full}>
      <figure>
        {renderImageBox({
          width: imageWidth,
          height: imageHeight,
          children: (
            <Image
              src={image.url}
              alt={alt}
              width={image.width}
              height={image.height}
              sizes={full ? "100vw" : "(max-width: 768px) 100vw, 768px"}
              className={`h-auto w-full ${full ? "" : ROUNDED[rounded]}`.trim()}
              style={frameStyle(imageHeight)}
            />
          ),
        })}
        {hasText(caption) && (
          <figcaption dir="auto" className={`mt-2 px-4 text-center text-[14px] ${TEXT_AUTO[tone].text}`}>
            {caption}
          </figcaption>
        )}
      </figure>
    </Section>
  );
}
