// Aperçu d'un modèle sur sa carte : la capture du modèle (modèles Flowmerce) ou,
// pour un modèle du vendeur, une miniature dessinée de sa première section
// (photo ou couleur de fond, et son titre).

import Image from "next/image";

export type TemplateCover = { image: string | null; color: string | null; title: string };

type Props = { preview: string | null; cover?: TemplateCover };

export function TemplatePreview({ preview, cover }: Props) {
  if (preview) {
    return (
      <Image
        src={preview}
        alt=""
        fill
        sizes="(max-width: 640px) 100vw, 240px"
        className="object-cover object-top transition-transform duration-300 group-hover:scale-[1.02]"
      />
    );
  }
  if (cover) {
    return (
      <span aria-hidden className="absolute inset-0 flex flex-col">
        <span className="relative flex h-1/2 items-center justify-center overflow-hidden px-4 text-center" style={{ backgroundColor: cover.color ?? "#16265c" }}>
          {cover.image && <Image src={cover.image} alt="" fill sizes="240px" className="object-cover" />}
          {cover.image && <span className="absolute inset-0 bg-black/40" />}
          <span className="relative line-clamp-3 text-[15px] font-bold text-white">{cover.title || "Votre modèle"}</span>
        </span>
        <span className="flex flex-1 flex-col gap-2 p-4">
          <span className="h-3 w-2/3 rounded bg-line" />
          <span className="h-3 w-1/2 rounded bg-line" />
          <span className="mt-auto h-8 rounded-md bg-brand/60" />
        </span>
      </span>
    );
  }
  return (
    <span aria-hidden className="flex h-full flex-col gap-2 p-4">
      <span className="h-1/3 rounded-md bg-deep" />
      <span className="h-3 w-2/3 rounded bg-line" />
      <span className="h-3 w-1/2 rounded bg-line" />
      <span className="mt-auto h-8 rounded-md bg-brand/70" />
    </span>
  );
}
