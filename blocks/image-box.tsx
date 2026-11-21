// Boîte d'une image dont la largeur se règle en % de la section, et dont le cadre
// (hauteur en % de la largeur) peut être fixé : la photo le remplit, rognée,
// jamais déformée. Sur le site : simple boîte ; dans l'éditeur, editor-config.ts
// la remplace par une boîte à poignées (blocks/editor/ResizableImageBox.tsx).

import type { CSSProperties, ReactNode } from "react";

export type ImageBoxProps = { width: number; height?: number | null; children: ReactNode };
export type RenderImageBox = (box: ImageBoxProps) => ReactNode;

/** Style d'une image dans un cadre fixé ; rien pour ses proportions naturelles. */
export function frameStyle(height: number | null | undefined): CSSProperties | undefined {
  return height ? { aspectRatio: `100 / ${height}`, objectFit: "cover" } : undefined;
}

export function ImageBox({ width, children }: ImageBoxProps) {
  return (
    <div className="mx-auto w-full" style={{ maxWidth: `${width}%` }}>
      {children}
    </div>
  );
}

export const renderImageBox: RenderImageBox = (box) => <ImageBox {...box} />;
