// Racine d'une page : langue, sens d'écriture et polices.
// Les titres prennent la police des titres par la variable --font-heading
// (règle .fm-page dans app/globals.css).

import type { CSSProperties, ReactNode } from "react";
import { fontFamily, type FontId } from "@/blocks/fonts";
import type { PageLang } from "@/blocks/i18n";

type Props = { lang?: PageLang; headingFont?: FontId; bodyFont?: FontId; children?: ReactNode };

export function PageRoot({ lang = "fr", headingFont = "system", bodyFont = "system", children }: Props) {
  const style = { fontFamily: fontFamily(bodyFont), "--font-heading": fontFamily(headingFont) } as CSSProperties;
  return (
    <div lang={lang} dir={lang === "ar" ? "rtl" : "ltr"} className="fm-page" style={style}>
      {children}
    </div>
  );
}
