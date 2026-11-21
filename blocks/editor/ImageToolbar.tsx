"use client";

// Barre d'une image dans l'éditeur, en bas de l'image quand sa section est
// choisie : remplacer l'image, sa description (lecteurs d'écran), et pour le bloc
// Image ses coins. La largeur se règle à la poignée (ResizableImageBox).

import { createUsePuck, registerOverlayPortal } from "@puckeditor/core";
import { ImageUp, SquareRoundCorner, Text } from "lucide-react";
import { useEffect, useRef } from "react";
import type { MediaValue } from "@/blocks/shared";
import { ImageUploader } from "@/components/media/ImageUploader";
import { Popover } from "./Popover";
import { SegmentedChoice } from "./SegmentedChoice";
import { TextInput } from "./TextInput";
import { useBlockSetter, type BlockProps } from "./use-block";

const usePuck = createUsePuck();

export type ImageToolbarProps = { blockId: string; imageProp: string; altProp: string; roundedProp?: string };

export function ImageToolbar({ blockId, imageProp, altProp, roundedProp }: ImageToolbarProps) {
  const props = usePuck((s) => ((s.selectedItem?.props as BlockProps | undefined)?.id === blockId ? (s.selectedItem!.props as BlockProps) : null));
  const set = useBlockSetter(blockId);
  const bar = useRef<HTMLDivElement>(null);
  const selected = props !== null;

  useEffect(() => {
    if (!selected) return;
    return registerOverlayPortal(bar.current, { disableDrag: true });
  }, [selected]);

  if (!props) return null;
  const image = props[imageProp] as MediaValue | null | undefined;
  return (
    <div
      ref={bar}
      role="toolbar"
      aria-label="Image"
      onClick={(e) => e.stopPropagation()}
      className="absolute start-2 bottom-2 z-30 flex items-center gap-0.5 rounded-control border border-line bg-white p-1 text-ink shadow-lg"
    >
      <Popover label="Remplacer l'image" icon={ImageUp} text="Remplacer" width={300}>
        <ImageUploader id={`remplacer-${blockId}`} value={image ? [image] : []} onChange={(images) => set(imageProp, images[0] ?? null)} max={1} />
      </Popover>
      <Popover label="Description de l'image" icon={Text} text="Description" width={300}>
        <TextInput
          label="Ce que montre l'image"
          hint="Lue par les lecteurs d'écran, et affichée si l'image ne se charge pas."
          value={String(props[altProp] ?? "")}
          onCommit={(value) => set(altProp, value)}
        />
      </Popover>
      {roundedProp && (
        <Popover label="Coins de l'image" icon={SquareRoundCorner} text="Coins">
          <SegmentedChoice
            label="Coins"
            value={(props[roundedProp] as "none" | "soft" | "strong" | undefined) ?? "soft"}
            onChange={(value) => set(roundedProp, value)}
            options={[
              { value: "none", label: "Droits" },
              { value: "soft", label: "Doux" },
              { value: "strong", label: "Arrondis" },
            ]}
          />
        </Popover>
      )}
    </div>
  );
}
