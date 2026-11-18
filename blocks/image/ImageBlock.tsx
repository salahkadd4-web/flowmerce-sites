// Image seule, avec texte alternatif obligatoire et légende facultative.
// Sans image choisie : rien sur le site public, un emplacement dans l'éditeur.

import Image from "next/image";
import type { ImageProps } from "./schema";

export function ImageBlock({
  image,
  alt,
  caption,
  width,
  editing = false,
}: Omit<ImageProps, "id"> & { editing?: boolean }) {
  const frame = width === "full" ? "max-w-none" : "mx-auto max-w-3xl";

  if (!image) {
    if (!editing) return null;
    return (
      <section className="px-4 py-8">
        <div className={`${frame} flex aspect-[4/3] items-center justify-center rounded-card border-2 border-dashed border-line bg-page text-[14px] text-faint`}>
          Choisissez une image dans les réglages du bloc
        </div>
      </section>
    );
  }

  return (
    <section className={width === "full" ? "py-8" : "px-4 py-8"}>
      <figure className={frame}>
        <Image
          src={image.url}
          alt={alt}
          width={image.width}
          height={image.height}
          sizes={width === "full" ? "100vw" : "(max-width: 768px) 100vw, 768px"}
          className={`h-auto w-full ${width === "full" ? "" : "rounded-card"}`}
        />
        {caption && <figcaption className="mt-2 px-4 text-center text-[14px] text-body">{caption}</figcaption>}
      </figure>
    </section>
  );
}
