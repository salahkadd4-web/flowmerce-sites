// Bannière d'ouverture : titre, sous-titre, image, bouton d'appel à l'action.
// Composant serveur (sans hook) : rendu dans l'éditeur comme sur le site public.
// Dans l'éditeur, titre, sous-titre et bouton arrivent en éléments d'édition de
// Puck (écriture dans la page) : d'où les ReactNode.

import Image from "next/image";
import type { ReactNode } from "react";
import { renderImageBox as defaultImageBox, type RenderImageBox } from "@/blocks/image-box";
import { hasText, RichText } from "@/blocks/rich-text";
import { Section } from "@/blocks/Section";
import { isSafeHref } from "@/blocks/shared";
import {
  buttonProps,
  colorProps,
  HERO_TEXT_SIZES,
  HERO_TITLE_SIZES,
  sectionTone,
  TEXT_AUTO,
} from "@/blocks/style";
import type { HeroProps } from "./schema";

type Props = Omit<HeroProps, "id" | "title" | "subtitle" | "buttonLabel" | "imageAlt"> & {
  title: ReactNode;
  subtitle: ReactNode;
  buttonLabel: ReactNode;
  imageAlt?: string;
  renderImageBox?: RenderImageBox;
};

const DEFAULTS = { tone: "light" as const, className: "bg-white text-ink", padding: "py-12 sm:py-16", width: "max-w-3xl" };

export function Hero({
  title,
  subtitle,
  image,
  imageAlt = "",
  imageWidth,
  buttonLabel,
  buttonHref,
  align,
  typography,
  button,
  style,
  renderImageBox = defaultImageBox,
}: Props) {
  const tone = sectionTone(style, DEFAULTS.tone);
  const centered = align === "center";
  const showButton = hasText(buttonLabel) && buttonHref !== "" && isSafeHref(buttonHref);
  const titleColor = colorProps(typography.titleColor, TEXT_AUTO[tone].title);
  const textColor = colorProps(typography.textColor, TEXT_AUTO[tone].text);
  const action = buttonProps(button, tone);

  return (
    <Section style={style} defaults={DEFAULTS} inner={`flex flex-col gap-6 ${centered ? "items-center text-center" : "items-start text-start"}`}>
      {hasText(title) && (
        <h1
          dir="auto"
          className={`font-extrabold leading-tight tracking-tight ${HERO_TITLE_SIZES[typography.titleSize]} ${titleColor.className}`}
          style={titleColor.style}
        >
          <RichText value={title} inline />
        </h1>
      )}
      {hasText(subtitle) && (
        <div className={`flex max-w-2xl flex-col gap-3 leading-relaxed ${HERO_TEXT_SIZES[typography.textSize]} ${textColor.className}`} style={textColor.style}>
          <RichText value={subtitle} />
        </div>
      )}
      {image &&
        renderImageBox({
          width: imageWidth,
          children: (
            <Image
              src={image.url}
              alt={imageAlt}
              width={image.width}
              height={image.height}
              sizes="(max-width: 768px) 100vw, 768px"
              // Image du haut de page : préchargée (Next 16 : `preload` remplace `priority`).
              preload
              className="h-auto w-full rounded-card"
            />
          ),
        })}
      {showButton && (
        <a href={buttonHref} className={action.className} style={action.style}>
          {buttonLabel}
        </a>
      )}
    </Section>
  );
}
