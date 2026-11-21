// Bannière d'ouverture : titre, sous-titre, image, bouton d'appel à l'action.
// Composant serveur (sans hook) : rendu dans l'éditeur comme sur le site public.
// Dans l'éditeur, titre, sous-titre et bouton arrivent en éléments d'édition de
// Puck (écriture dans la page) : d'où les ReactNode.

import Image from "next/image";
import type { ReactNode } from "react";
import { renderButton as defaultButton, type RenderButton } from "@/blocks/button-box";
import { renderImageBox as defaultImageBox, type RenderImageBox } from "@/blocks/image-box";
import { hasText, RichText } from "@/blocks/rich-text";
import { Section } from "@/blocks/Section";
import { isSafeHref } from "@/blocks/shared";
import {
  buttonProps,
  colorProps,
  DEFAULT_BUTTON,
  DEFAULT_SECTION_STYLE,
  DEFAULT_TYPOGRAPHY,
  HERO_TEXT_SIZES,
  HERO_TITLE_SIZES,
  sectionTone,
  TEXT_AUTO,
} from "@/blocks/style";
import type { HeroProps } from "./schema";

type Props = Omit<HeroProps, "id" | "title" | "subtitle" | "buttonLabel" | "imageAlt" | "imageWidth" | "typography" | "button" | "style"> &
  Partial<Pick<HeroProps, "imageWidth" | "typography" | "button" | "style">> & {
  title: ReactNode;
  subtitle: ReactNode;
  buttonLabel: ReactNode;
  imageAlt?: string;
  renderImageBox?: RenderImageBox;
  renderButton?: RenderButton;
  /** Éditeur : le bouton reste visible sans lien, pour qu'on puisse le régler. */
  editing?: boolean;
};

const DEFAULTS = { tone: "light" as const, className: "bg-white text-ink", padding: "py-12 sm:py-16", width: "max-w-3xl" };

export function Hero({
  title,
  subtitle,
  image,
  imageAlt = "",
  imageWidth = 100,
  buttonLabel,
  buttonHref,
  align,
  typography = DEFAULT_TYPOGRAPHY,
  button = DEFAULT_BUTTON,
  style = DEFAULT_SECTION_STYLE,
  renderImageBox = defaultImageBox,
  renderButton = defaultButton,
  editing = false,
}: Props) {
  const tone = sectionTone(style, DEFAULTS.tone);
  const centered = align === "center";
  const linked = buttonHref !== "" && isSafeHref(buttonHref);
  const showButton = hasText(buttonLabel) && (linked || editing);
  const titleColor = colorProps(typography.titleColor, TEXT_AUTO[tone].title);
  const textColor = colorProps(typography.textColor, TEXT_AUTO[tone].text);
  const action = buttonProps(button, tone);

  return (
    <Section style={style} defaults={DEFAULTS} preload inner={`flex flex-col gap-6 ${centered ? "items-center text-center" : "items-start text-start"}`}>
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
      {showButton &&
        renderButton({
          children: (
            <a href={linked ? buttonHref : undefined} className={action.className} style={action.style}>
              {buttonLabel}
            </a>
          ),
        })}
    </Section>
  );
}
