// Texte libre : un titre facultatif et des paragraphes séparés par une ligne vide.
// Aucune mise en forme riche : le texte est rendu tel quel, échappé par React.

import type { TextProps } from "./schema";

export function Text({ title, body, align }: Omit<TextProps, "id">) {
  const paragraphs = body.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  if (!title && paragraphs.length === 0) return null;

  return (
    <section className="px-4 py-10">
      <div className={`mx-auto flex max-w-3xl flex-col gap-4 ${align === "center" ? "text-center" : "text-left"}`}>
        {title && <h2 className="text-2xl font-bold leading-snug text-ink">{title}</h2>}
        {paragraphs.map((paragraph, i) => (
          <p key={i} className="whitespace-pre-line text-base leading-relaxed text-body">
            {paragraph}
          </p>
        ))}
      </div>
    </section>
  );
}
