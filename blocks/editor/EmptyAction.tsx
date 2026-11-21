"use client";

// Emplacement vide d'une section, dans l'éditeur : le message et le bouton qui
// règle le manque, sur place — « Choisir une image », « Choisir le produit ».
// Injecté par editor-config.ts : jamais envoyé aux acheteurs.

import { registerOverlayPortal } from "@puckeditor/core";
import { ImagePlus, Package } from "lucide-react";
import { useEffect, useRef } from "react";
import type { EmptyKind } from "@/blocks/empty-box";
import { ImageUploader } from "@/components/media/ImageUploader";
import { ProductChoicePanel } from "./panels";
import { Popover } from "./Popover";
import { useBlockSetter } from "./use-block";

type Props = { blockId: string; kind: EmptyKind; message: string; imageProp?: string };

export function EmptyAction({ blockId, kind, message, imageProp = "image" }: Props) {
  const box = useRef<HTMLDivElement>(null);
  const set = useBlockSetter(blockId);

  // Bouton placé dans le bloc : rendu au pointeur, sans lancer le déplacement du bloc.
  useEffect(() => registerOverlayPortal(box.current, { disableDrag: true }), []);

  return (
    <>
      <span>{message}</span>
      {/* Le clic ne remonte pas à l'aperçu, qui le prendrait pour un clic hors de la section. */}
      <div ref={box} onClick={(e) => e.stopPropagation()} className="rounded-control bg-white text-ink shadow-sm ring-1 ring-line">
        {kind === "image" ? (
          <Popover label="Choisir une image" icon={ImagePlus} text="Choisir une image" width={300}>
            <ImageUploader id={`vide-${blockId}`} value={[]} onChange={(images) => images[0] && set(imageProp, images[0])} max={1} />
          </Popover>
        ) : (
          <Popover label="Choisir le produit" icon={Package} text="Choisir le produit" width={300}>
            <ProductChoicePanel />
          </Popover>
        )}
      </div>
    </>
  );
}
