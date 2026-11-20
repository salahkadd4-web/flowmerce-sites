// Texte : un titre facultatif et des paragraphes, avec mots en gras, italique,
// souligné ou barré. Le HTML est relu par RichText, jamais injecté.

import type { ReactNode } from "react";
import { hasText, RichText } from "@/blocks/rich-text";
import { Section } from "@/blocks/Section";
import { colorProps, SECTION_TITLE_SIZES, sectionTone, TEXT_AUTO, TEXT_SIZES } from "@/blocks/style";
import type { TextProps } from "./schema";

type Props = Omit<TextProps, "id" | "title" | "body"> & { title: ReactNode; body: ReactNode };

const DEFAULTS = { tone: "light" as const, className: "", padding: "py-10", width: "max-w-3xl" };

export function Text({ title, body, align, typography, style }: Props) {
  if (!hasText(title) && !hasText(body)) return null;
  const tone = sectionTone(style, DEFAULTS.tone);
  const titleColor = colorProps(typography.titleColor, TEXT_AUTO[tone].title);
  const textColor = colorProps(typography.textColor, TEXT_AUTO[tone].text);

  return (
    <Section style={style} defaults={DEFAULTS} inner={`flex flex-col gap-4 ${align === "center" ? "text-center" : "text-start"}`}>
      {hasText(title) && (
        <h2
          dir="auto"
          className={`font-bold leading-snug ${SECTION_TITLE_SIZES[typography.titleSize]} ${titleColor.className}`}
          style={titleColor.style}
        >
          <RichText value={title} inline />
        </h2>
      )}
      <RichText
        value={body}
        className={`leading-relaxed ${TEXT_SIZES[typography.textSize]} ${textColor.className}`.trim()}
        style={textColor.style}
      />
    </Section>
  );
}
