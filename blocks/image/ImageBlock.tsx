// Image seule, avec texte alternatif obligatoire et légende facultative.
// Sans image choisie : rien sur le site public, un emplacement dans l'éditeur.

import Image from "next/image";
import { renderImageBox as defaultImageBox, type RenderImageBox } from "@/blocks/image-box";
import { Section } from "@/blocks/Section";
import { sectionTone, TEXT_AUTO } from "@/blocks/style";
import type { ImageProps } from "./schema";

const ROUNDED: Record<ImageProps["rounded"], string> = {
  none: "",
  soft: "rounded-card",
  strong: "rounded-3xl",
};

type Props = Omit<ImageProps, "id"> & { editing?: boolean; renderImageBox?: RenderImageBox };

export function ImageBlock({
  image,
  alt,
  caption,
  width,
  imageWidth,
  rounded,
  style,
  editing = false,
  renderImageBox = defaultImageBox,
}: Props) {
  const full = width === "full";
  const defaults = { tone: "light" as const, className: "", padding: "py-8", width: full ? "max-w-none" : "max-w-3xl" };

  if (!image) {
    if (!editing) return null;
    return (
      <Section style={style} defaults={defaults}>
        <div className="flex aspect-[4/3] items-center justify-center rounded-card border-2 border-dashed border-line bg-page text-[14px] text-faint">
          Choisissez une image dans les réglages du bloc
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
          children: (
            <Image
              src={image.url}
              alt={alt}
              width={image.width}
              height={image.height}
              sizes={full ? "100vw" : "(max-width: 768px) 100vw, 768px"}
              className={`h-auto w-full ${full ? "" : ROUNDED[rounded]}`.trim()}
            />
          ),
        })}
        {caption && (
          <figcaption dir="auto" className={`mt-2 px-4 text-center text-[14px] ${TEXT_AUTO[tone].text}`}>
            {caption}
          </figcaption>
        )}
      </figure>
    </Section>
  );
}
