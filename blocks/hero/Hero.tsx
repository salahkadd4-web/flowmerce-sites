// Bannière d'ouverture : titre, sous-titre, image, bouton d'appel à l'action.
// Composant serveur (sans hook) : rendu dans l'éditeur comme sur le site public.

import Image from "next/image";
import { isSafeHref } from "@/blocks/shared";
import type { HeroProps } from "./schema";

const BACKGROUNDS: Record<HeroProps["background"], { section: string; button: string; subtitle: string }> = {
  light: { section: "bg-white text-ink", button: "bg-brand text-on-brand hover:bg-brand-dark", subtitle: "text-body" },
  dark: { section: "bg-deep text-white", button: "bg-white text-deep hover:bg-haze", subtitle: "text-white/80" },
  indigo: { section: "bg-brand text-on-brand", button: "bg-white text-brand-ink hover:bg-brand-soft", subtitle: "text-white/85" },
  sand: { section: "bg-warm text-ink", button: "bg-deep text-white hover:bg-ink", subtitle: "text-body" },
};

export function Hero({ title, subtitle, image, buttonLabel, buttonHref, align, background }: Omit<HeroProps, "id">) {
  const tone = BACKGROUNDS[background] ?? BACKGROUNDS.light;
  const centered = align === "center";
  const showButton = buttonLabel.trim() !== "" && buttonHref !== "" && isSafeHref(buttonHref);

  return (
    <section className={`px-4 py-12 sm:py-16 ${tone.section}`}>
      <div className={`mx-auto flex max-w-3xl flex-col gap-6 ${centered ? "items-center text-center" : "items-start text-left"}`}>
        {title && <h1 className="text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">{title}</h1>}
        {subtitle && <p className={`max-w-2xl text-base leading-relaxed sm:text-lg ${tone.subtitle}`}>{subtitle}</p>}
        {image && (
          <Image
            src={image.url}
            alt=""
            width={image.width}
            height={image.height}
            sizes="(max-width: 768px) 100vw, 768px"
            priority
            className="h-auto w-full rounded-card"
          />
        )}
        {showButton && (
          <a
            href={buttonHref}
            className={`inline-flex items-center justify-center rounded-control px-6 py-3.5 text-base font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current ${tone.button}`}
          >
            {buttonLabel}
          </a>
        )}
      </div>
    </section>
  );
}
