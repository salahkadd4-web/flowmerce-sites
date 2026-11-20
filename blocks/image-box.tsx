// Boîte d'une image dont la largeur se règle en % de la section.
// Sur le site : simple boîte ; dans l'éditeur, editor-config.ts la remplace par
// une boîte à poignée (blocks/editor/ResizableImageBox.tsx).

import type { ReactNode } from "react";

export type ImageBoxProps = { width: number; children: ReactNode };
export type RenderImageBox = (box: ImageBoxProps) => ReactNode;

export function ImageBox({ width, children }: ImageBoxProps) {
  return (
    <div className="mx-auto w-full" style={{ maxWidth: `${width}%` }}>
      {children}
    </div>
  );
}

export const renderImageBox: RenderImageBox = (box) => <ImageBox {...box} />;
