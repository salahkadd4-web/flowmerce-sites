# Éditeur pro — plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** des landing pages d'aspect professionnel, réglées comme dans Google Slides : fonds (couleur, image assombrie), tailles et couleurs de texte, boutons, largeur d'image par poignée, galerie 1 + 5 photos, compteur de quantité, mots en gras / italique / souligné / barré, pages en arabe, polices au choix.

**Architecture:** chaque bloc reçoit trois groupes de réglages validés par zod (`style`, `typography`, `button`) lus par des fonctions pures de `blocks/style.ts` et un cadre serveur `Section`. Les champs d'édition (curseur, couleur, image, poignée) sont des composants client injectés par `editor-config.ts` seulement, la configuration partagée n'en contient que des emplacements. Le texte mis en forme est nettoyé à l'enregistrement et relu par notre propre lecteur, sans injection de HTML. Langue et polices sont des réglages de la racine de la page.

**Tech Stack:** Next.js 16.4, React 19, Puck `@puckeditor/core` 0.24.0 (champs `richtext`, `object`, `custom`, `contentEditable`, `useGetPuck`), zod 3, Tailwind 4, `next/font/google`, vitest 4.

**Spec:** `docs/superpowers/specs/2026-11-19-editeur-pro-design.md`

## Global Constraints

- Une page publiée avant ce travail s'affiche comme avant : chaque nouveau réglage a une valeur par défaut qui reproduit le rendu actuel (zod `.default`).
- Couleurs saisies : `#rrggbb` uniquement (`/^#[0-9a-f]{6}$/i`) ou `"auto"` ; tailles et espacements dans des listes fermées ; nombres bornés et par paliers.
- `style={{…}}` ne reçoit qu'une valeur déjà validée (couleur hex, pourcentage borné). Les classes Tailwind sont écrites en entier dans le code (pas de classe construite par concaténation de morceaux).
- Aucun `dangerouslySetInnerHTML`. Texte mis en forme : balises `p`, `br`, `strong`, `em`, `u`, `s`, sans attribut.
- Pages publiques : aucun module `"use client"` nouveau à part `blocks/order-form/OrderForm.tsx`, et pas d'import de `@puckeditor/core` hors `import type` (garde `blocks/server-graph.test.ts`, inchangée).
- Champs de l'éditeur : même forme que `blocks/fields/MediaField.tsx` (`FieldLabel` de Puck, `el="div"`, icône lucide 16 px).
- Jetons de couleur existants uniquement (`app/globals.css`) ; focus visible comme dans les blocs actuels (`focus-visible:outline-2 focus-visible:outline-offset-2`).
- Libellés de l'éditeur en français, vocabulaire du vendeur (pas de « padding », « opacity »).
- Limite de quantité : `MAX_QUANTITY` (10) de `blocks/order-form/totals.ts`, seule source.
- Commits terminés par `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Commandes : `npx vitest run <fichier>` (un test), `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`, `npm run test:int`.

## Review Focus

1. Texte collé depuis Word ou une page web (`<span style>`, `<a href>`, `<div>`, `<font>`) : le texte reste, la mise en forme non permise disparaît. Test en tâche 2.
2. Anciennes pages (Hero `background: "dark"`, textes sans balises avec lignes vides) : elles s'affichent toujours, avec la même couleur et les mêmes paragraphes. Tests en tâches 4 et 5.
3. Page arabe contenant un paragraphe français ou des prix en chiffres : chaque paragraphe a `dir="auto"`, et la page entière a `dir="rtl"`. Test en tâche 3.
4. « Fond : image » choisi sans image envoyée : fond par défaut, aucune image cassée. Test en tâche 1.
5. Poignée tirée hors de la section ou section de largeur nulle : largeur bornée à 30–100 %. Test en tâche 10.

---

### Task 1: Fondations du style (schémas, résolution des couleurs, cadre de section)

**Files:**
- Create: `blocks/style.ts`, `blocks/Section.tsx`, `blocks/image-box.tsx`
- Test: `blocks/style.test.tsx`

**Interfaces:**
- Produces (`blocks/style.ts`):
  - `PALETTE: readonly { name: string; hex: string }[]`, 8 entrées : Blanc `#ffffff`, Gris clair `#f7f8fc`, Lavande `#ebeefb`, Sable `#faf6f0`, Indigo `#4f46e5`, Indigo foncé `#4338ca`, Nuit `#16265c`, Encre `#0f1a3d`.
  - `hexColorSchema`, `colorOrAutoSchema`, `type ColorOrAuto = "auto" | string`.
  - `sectionStyleSchema` : `{ background: "default"|"color"|"image" = "default", backgroundColor: hex = "#ffffff", backgroundImage: media|null = null, overlay: int 0–80 multipleOf 10 = 40, spacing: "compact"|"normal"|"airy" = "normal", width: "narrow"|"normal"|"wide" = "normal" }`, `.default({})`. Type `SectionStyle`.
  - `SIZES = ["s","m","l","xl"] as const`, `type Size`. `typographySchema` : `{ titleSize: Size = "m", titleColor: ColorOrAuto = "auto", textSize: Size = "m", textColor: ColorOrAuto = "auto" }`, `.default({})`. Type `Typography`.
  - `buttonStyleSchema` : `{ color: ColorOrAuto = "auto", textColor: ColorOrAuto = "auto", size: "s"|"m"|"l" = "m" }`, `.default({})`. Type `ButtonStyle`.
  - `imageWidthSchema` : int 30–100 multipleOf 10, défaut 100.
  - `type Tone = "light" | "dark"` (ton du **fond**).
  - `isDarkColor(hex: string): boolean` : luminance relative WCAG < 0,4.
  - `sectionTone(style: SectionStyle, defaultTone: Tone): Tone` : image avec `backgroundImage` → `overlay >= 40 ? "dark" : "light"` ; couleur → `isDarkColor` ; sinon `defaultTone`. Fond « image » sans image : traité comme « default ».
  - `colorProps(value: ColorOrAuto, autoClass: string): { className: string; style?: CSSProperties }`.
  - `buttonProps(button: ButtonStyle, tone: Tone): { className: string; style?: CSSProperties }`.
  - `TEXT_AUTO: Record<Tone, { title: string; text: string }>` = light `{ title: "text-ink", text: "text-body" }`, dark `{ title: "text-white", text: "text-white/80" }`.
  - `HERO_TITLE_SIZES`, `SECTION_TITLE_SIZES`, `TEXT_SIZES`, `HERO_TEXT_SIZES`, `BUTTON_SIZES` (valeurs ci-dessous).
- Produces (`blocks/Section.tsx`) : `Section({ style, defaults, as = "section", id, bleed = false, inner = "", children })`, avec `defaults: { tone: Tone; className: string; padding: string; width: string }`. Ce cadre dessine le fond, l'image `next/image` `fill` `sizes="100vw"` `alt=""` `object-cover`, le calque noir d'opacité `overlay / 100`, puis `<div className={"relative mx-auto " + largeur + " " + inner}>`.
- Produces (`blocks/image-box.tsx`) : `type ImageBoxProps = { width: number; children: ReactNode }`, `type RenderImageBox = (box: ImageBoxProps) => ReactNode`, `ImageBox` (serveur) : `<div className="mx-auto w-full" style={{ maxWidth: width + "%" }}>`.

Tables de classes (exactes) :

| Table | s | m | l | xl |
|---|---|---|---|---|
| `HERO_TITLE_SIZES` | `text-2xl sm:text-3xl` | `text-3xl sm:text-4xl` | `text-4xl sm:text-5xl` | `text-5xl sm:text-6xl` |
| `SECTION_TITLE_SIZES` | `text-xl` | `text-2xl` | `text-3xl` | `text-4xl` |
| `TEXT_SIZES` | `text-sm` | `text-base` | `text-lg` | `text-xl` |
| `HERO_TEXT_SIZES` | `text-sm sm:text-base` | `text-base sm:text-lg` | `text-lg sm:text-xl` | `text-xl sm:text-2xl` |
| `BUTTON_SIZES` | `px-4 py-2.5 text-sm` | `px-6 py-3.5 text-base` | `px-8 py-4 text-lg` | — |

- Espacement : `compact` → `py-6 sm:py-8`, `normal` → `defaults.padding`, `airy` → `py-16 sm:py-24`.
- Largeur : `narrow` → `max-w-xl`, `normal` → `defaults.width`, `wide` → `max-w-5xl`.
- `buttonProps` :
  - base commune : `inline-flex items-center justify-center rounded-control font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current`, plus la taille.
  - couleur `auto` : ton light → `bg-brand text-on-brand hover:bg-brand-dark` ; ton dark → `bg-white text-deep hover:bg-haze`.
  - couleur hex : `style.backgroundColor` et `hover:opacity-90` ; si le texte est `auto`, `text-white` sur un bouton sombre, `text-ink` sur un bouton clair.
  - texte hex : `style.color`.

- [ ] **Step 1: Write the failing tests** (`blocks/style.test.tsx`)

```tsx
it("refuse une couleur qui n'est pas #rrggbb", () => {
  for (const bad of ["red", "#fff", "#ff00001", "url(x)", "#ff0000;x"]) expect(hexColorSchema.safeParse(bad).success).toBe(false);
  expect(colorOrAutoSchema.parse("#FF0000")).toBe("#FF0000");
});
it("borne l'assombrissement à 0–80 par paliers de 10", () => {
  expect(sectionStyleSchema.safeParse({ overlay: 85 }).success).toBe(false);
  expect(sectionStyleSchema.safeParse({ overlay: 45 }).success).toBe(false);
  expect(sectionStyleSchema.parse(undefined)).toEqual({ background: "default", backgroundColor: "#ffffff", backgroundImage: null, overlay: 40, spacing: "normal", width: "normal" });
});
it("choisit un texte clair sur fond sombre", () => {
  expect(isDarkColor("#16265c")).toBe(true);
  expect(isDarkColor("#faf6f0")).toBe(false);
  expect(sectionTone(sectionStyleSchema.parse({ background: "color", backgroundColor: "#4f46e5" }), "light")).toBe("dark");
  expect(sectionTone(sectionStyleSchema.parse({ background: "image", backgroundImage: MEDIA, overlay: 40 }), "light")).toBe("dark");
  expect(sectionTone(sectionStyleSchema.parse({ background: "image", backgroundImage: MEDIA, overlay: 30 }), "dark")).toBe("light");
});
it("fond image sans image : fond par défaut, aucune image", () => {
  const html = renderToStaticMarkup(<Section style={sectionStyleSchema.parse({ background: "image" })} defaults={DEFAULTS}>x</Section>);
  expect(html).not.toContain("<img");
  expect(sectionTone(sectionStyleSchema.parse({ background: "image" }), "dark")).toBe("dark");
});
it("dessine l'image de fond et son assombrissement", () => {
  const html = renderToStaticMarkup(<Section style={sectionStyleSchema.parse({ background: "image", backgroundImage: MEDIA, overlay: 60 })} defaults={DEFAULTS}>x</Section>);
  expect(html).toContain(MEDIA.url);
  expect(html).toContain("opacity:0.6");
});
it("couleur personnalisée : appliquée en style, auto : en classe", () => {
  expect(colorProps("#ff0000", "text-ink")).toEqual({ className: "", style: { color: "#ff0000" } });
  expect(colorProps("auto", "text-ink")).toEqual({ className: "text-ink" });
  expect(buttonProps(buttonStyleSchema.parse({}), "dark").className).toContain("bg-white");
  expect(buttonProps(buttonStyleSchema.parse({ color: "#16265c" }), "light")).toMatchObject({ style: { backgroundColor: "#16265c" } });
  expect(buttonProps(buttonStyleSchema.parse({ color: "#16265c" }), "light").className).toContain("text-white");
});
it("la largeur d'image s'écrit en pourcentage", () => {
  expect(renderToStaticMarkup(<ImageBox width={70}>i</ImageBox>)).toContain("max-width:70%");
  expect(imageWidthSchema.safeParse(25).success).toBe(false);
});
```
(`MEDIA` comme dans `blocks/blocks.test.tsx` ; `DEFAULTS = { tone: "light", className: "bg-white", padding: "py-10", width: "max-w-3xl" }`.)

- [ ] **Step 2: Run** `npx vitest run blocks/style.test.tsx`. Expected: FAIL, modules introuvables.
- [ ] **Step 3: Implement** `blocks/style.ts`, `blocks/Section.tsx`, `blocks/image-box.tsx` per Interfaces. `Section` adds `isolate` to the frame; image and overlay go at `-z-10`; `bleed` removes `px-4`; a `color` background puts `style.backgroundColor` and drops `defaults.className`'s `bg-*` (use `defaults.className` only for `default`).
- [ ] **Step 4: Run** `npx vitest run blocks/style.test.tsx`. Expected: PASS.
- [ ] **Step 5: Commit** `feat(blocks): réglages de style partagés (fond, couleurs, tailles)`.

---

### Task 2: Texte mis en forme (nettoyage et lecture sûre)

**Files:**
- Create: `blocks/rich-text.tsx`
- Test: `blocks/rich-text.test.tsx`

**Interfaces:**
- Produces:
  - `sanitizeRichText(input: string): string`. Le texte sans balise est converti : une ligne vide sépare deux `<p>`, un retour simple devient `<br>`, et `&`, `<`, `>` sont échappés. Pour le reste : `b` devient `strong`, `i` devient `em`, `strike` et `del` deviennent `s`. Les balises permises sont réécrites sans attribut. `script`, `style`, `template`, `iframe`, `object` et `noscript` sont retirées avec leur contenu ; toute autre balise est retirée en gardant son texte, et les commentaires sont retirés.
  - `richTextSchema(maxVisible: number)` : `z.preprocess` (`sanitizeRichText` si la valeur est une chaîne), puis une chaîne de `maxVisible * 6` caractères au plus. Un `refine` impose que le texte visible (sans balises, entités décodées) tienne en `maxVisible` caractères.
  - `RichText({ value, inline = false, className, style }: { value: ReactNode; inline?: boolean; className?: string; style?: CSSProperties })` :
    - chaîne : lue en éléments React. Chaque paragraphe devient `<p dir="auto" className style>` ; en mode `inline`, les paragraphes sont joints par `<br>` dans un fragment.
    - autre valeur (élément d'édition de Puck) : rendue telle quelle.
  - `hasText(value: ReactNode): boolean` : une chaîne n'est « vide » que sans texte visible ; une valeur non textuelle compte comme présente.
  - `RICH_TEXT_OPTIONS` : options Puck `richtext` qui désactivent toutes les extensions sauf `bold`, `italic`, `underline`, `strike`, `paragraph`, `text` et `hardBreak` (`heading`, `bulletList`, `orderedList`, `listItem`, `blockquote`, `code`, `codeBlock`, `horizontalRule`, `link`, `textAlign` à `false`).

- [ ] **Step 1: Write the failing tests**

```tsx
it("garde gras, italique, souligné, barré", () => {
  expect(sanitizeRichText("<p><strong>a</strong> <em>b</em> <u>c</u> <s>d</s></p>")).toBe("<p><strong>a</strong> <em>b</em> <u>c</u> <s>d</s></p>");
  expect(sanitizeRichText("<p><b>a</b><i>b</i><del>c</del></p>")).toBe("<p><strong>a</strong><em>b</em><s>c</s></p>");
});
it("retire scripts, attributs et liens en gardant le texte collé", () => {
  const out = sanitizeRichText('<div><p onclick="x()" style="color:red">Promo <a href="javascript:alert(1)">ici</a><script>alert(1)</script><span style="font-weight:700">!</span></p></div>');
  expect(out).toBe("<p>Promo ici!</p>");
});
it("lit un ancien texte simple comme des paragraphes", () => {
  expect(sanitizeRichText("Un\nDeux\n\nTrois <3")).toBe("<p>Un<br>Deux</p><p>Trois &lt;3</p>");
});
it("affiche sans injecter de HTML", () => {
  const html = renderToStaticMarkup(<RichText value={"<p>a <strong>b</strong></p><p><img src=x onerror=alert(1)>c</p>"} />);
  expect(html).toBe('<p dir="auto">a <strong>b</strong></p><p dir="auto">c</p>');
});
it("en ligne : paragraphes joints par un retour", () => {
  expect(renderToStaticMarkup(<h1><RichText value="<p>a</p><p>b</p>" inline /></h1>)).toBe("<h1>a<br/>b</h1>");
});
it("compte la longueur visible, pas les balises", () => {
  expect(richTextSchema(5).safeParse("<p><strong>abcde</strong></p>").success).toBe(true);
  expect(richTextSchema(5).safeParse("<p>abcdef</p>").success).toBe(false);
  expect(hasText("<p> </p>")).toBe(false);
});
```

- [ ] **Step 2: Run** `npx vitest run blocks/rich-text.test.tsx`. Expected: FAIL.
- [ ] **Step 3: Implement** `blocks/rich-text.tsx`. Lecture : découper sur `/<(\/?)(p|br|strong|em|u|s)>/g`, décoder les entités (`&amp; &lt; &gt; &quot; &#39; &nbsp; &#NNN;`), et construire l'arbre avec une pile tolérante (une balise non fermée se ferme en fin de paragraphe). Le texte hors `<p>` va dans un paragraphe implicite.
- [ ] **Step 4: Run** `npx vitest run blocks/rich-text.test.tsx`. Expected: PASS.
- [ ] **Step 5: Commit** `feat(blocks): texte mis en forme nettoyé et lu sans HTML injecté`.

---

### Task 3: Langue de la page et polices

**Files:**
- Create: `blocks/i18n.ts`, `blocks/fonts.ts`, `blocks/root/config.ts`, `blocks/root/PageRoot.tsx`, `test/next-font-stub.ts`
- Modify:
  - `blocks/puck.config.ts` : `root: rootConfig`.
  - `lib/page-content.ts` : root props `lang`, `headingFont`, `bodyFont`.
  - `lib/storefront.ts` : `StorefrontMetadata.lang?: PageLang`.
  - `app/s/[host]/[[...slug]]/page.tsx` : metadata `lang`.
  - `app/(vendor)/(editor)/edit/[pageId]/Editor.tsx` : la `lang` est suivie depuis `onChange`, comme `pageProductId`.
  - `app/globals.css` : `.fm-page :is(h1,h2,h3) { font-family: var(--font-heading, inherit); }`.
  - `vitest.config.mts` : alias `next/font/google` vers le stub.
- Test: `blocks/root/root.test.tsx`, `lib/page-content.test.ts` (ajouts)

**Interfaces:**
- Produces:
  - `PAGE_LANGS = ["fr", "ar"] as const`, `type PageLang`, `isPageLang(v: unknown): v is PageLang`.
  - `BUYER_TEXT: Record<PageLang, BuyerText>`. Clés : `quantity, decrease, increase, fullName, phone, wilaya, chooseWilaya, commune, chooseCommune, loadingCommunes, communesError, address, deliveryType, home, office, shipping, total, cod, sending, soldOutForm, save (« Économisez {amount} »), soldOut, unavailable (« épuisé »), photos, photoAlt (« {name} — photo {n} »), returnPolicy, thanksTitle, thanksBody, reference, errors: { generic, network, customerName, phone, wilayaCode, commune, address, quantity, variantId, deliveryType }`. Le français reprend mot pour mot les textes actuels de `OrderForm.tsx`, `ProductBlock.tsx`, `Footer.tsx` et `merci/page.tsx`. Claude rédige l'arabe.
  - `FONT_IDS = ["system","cairo","tajawal","almarai","plex-arabic","noto-kufi","amiri"] as const`, `type FontId`, `FONT_LABELS: Record<FontId,string>` (« Système (par défaut) », « Cairo », …, « Amiri (élégante) »), `fontFamily(id: FontId): string`. `system` renvoie la pile système de `app/s/[host]/layout.tsx` ; les autres renvoient `font.style.fontFamily`. Réglages de `next/font/google` : `subsets: ["arabic", "latin"]`, `display: "swap"`, `preload: false`. Graisses : Almarai `400/700/800`, Tajawal `400/500/700/800`, IBM Plex Sans Arabic `400/500/600/700`, Amiri `400/700` ; Cairo et Noto Kufi Arabic sont variables.
  - `PageRoot({ lang, headingFont, bodyFont, children })` : `<div lang={lang} dir={lang === "ar" ? "rtl" : "ltr"} className="fm-page" style={{ fontFamily, "--font-heading": … }}>`.
  - `rootConfig` : champs `title`, `lang` (radio « Langue de la page » : Français / العربية), `headingFont` et `bodyFont` (select « Police des titres » / « Police du texte »). Valeurs par défaut `fr`, `system`, `system`.
  - `PageContent.root.props` gagne `lang?: PageLang; headingFont?: FontId; bodyFont?: FontId`. `validatePageContent` refuse une valeur inconnue (« « Langue de la page » invalide », « « Police » invalide ») ; `parsePageContent` l'ignore.

- [ ] **Step 1: Write the failing tests**

```tsx
it("une page arabe s'écrit de droite à gauche", () => {
  const html = renderToStaticMarkup(<PageRoot lang="ar" headingFont="system" bodyFont="system">x</PageRoot>);
  expect(html).toContain('dir="rtl"');
  expect(html).toContain('lang="ar"');
});
it("applique les polices choisies", () => {
  const html = renderToStaticMarkup(<PageRoot lang="fr" headingFont="amiri" bodyFont="cairo">x</PageRoot>);
  expect(html).toContain(fontFamily("cairo"));
  expect(html).toContain("--font-heading");
});
it("chaque langue a tous les textes de l'acheteur", () => {
  expect(Object.keys(BUYER_TEXT.ar).sort()).toEqual(Object.keys(BUYER_TEXT.fr).sort());
});
// lib/page-content.test.ts
it("garde langue et polices valides, refuse les inconnues", () => {
  expect(validatePageContent({ root: { props: { lang: "ar", bodyFont: "cairo" } }, content: [] })).toMatchObject({ ok: true, content: { root: { props: { lang: "ar", bodyFont: "cairo" } } } });
  expect(validatePageContent({ root: { props: { lang: "en" } }, content: [] }).ok).toBe(false);
  expect(validatePageContent({ root: { props: { headingFont: "Comic" } }, content: [] }).ok).toBe(false);
  expect(parsePageContent({ root: { props: { lang: "en" } }, content: [] })?.root.props.lang).toBeUndefined();
});
```

- [ ] **Step 2: Run** `npx vitest run blocks/root lib/page-content.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement.** The stub exports `Cairo`, `Tajawal`, `Almarai`, `IBM_Plex_Sans_Arabic`, `Noto_Kufi_Arabic`, `Amiri`, each returning `{ className: "", variable: "", style: { fontFamily: "'<Nom>'" } }`.
- [ ] **Step 4: Run** `npx vitest run blocks lib/page-content.test.ts` then `npm run typecheck`. Expected: PASS, aucune erreur (`blocks/server-graph.test.ts` toujours vert).
- [ ] **Step 5: Commit** `feat(pages): langue de la page (arabe, droite à gauche) et polices`.

---

### Task 4: Bannière (Hero)

**Files:**
- Create: `blocks/fields/groups.ts`, `blocks/fields/editor-fields.ts` (remplace `blocks/fields/image-field.ts`, qu'on supprime ; mettre à jour ses imports)
- Modify: `blocks/hero/schema.ts`, `blocks/hero/config.ts`, `blocks/hero/Hero.tsx`
- Test: `blocks/blocks.test.tsx`

**Interfaces:**
- Produces (`editor-fields.ts`, sans composant client) :
  - `type EditorFieldKind = "media" | "range" | "color"`.
  - `imageField(label)`, `rangeField(label, { min, max, step, unit })` et `colorField(label, { auto: boolean })`. Chacune renvoie `{ type: "custom", label, editorKind, editorOptions, render: () => createElement(Fragment) }`.
- Produces (`groups.ts`) :
  - `styleField()` : objet « Style », `collapsible: true`, `defaultExpanded: false`. Champs :
    - `background` : radio « Fond », Par défaut / Couleur / Image.
    - `backgroundColor` : `colorField("Couleur du fond", { auto: false })`.
    - `backgroundImage` : `imageField("Image de fond")`.
    - `overlay` : `rangeField("Assombrissement de l'image", { min: 0, max: 80, step: 10, unit: "%" })`.
    - `spacing` : radio « Hauteur de la section », Compacte / Normale / Aérée.
    - `width` : radio « Largeur du contenu », Étroite / Normale / Large.
  - `typographyField({ title?: boolean; text?: boolean })` : objet « Texte », même repli. Champs « Taille du titre » (select Petite / Moyenne / Grande / Très grande), « Couleur du titre » (`colorField`, `auto: true`), « Taille du texte », « Couleur du texte ».
  - `buttonField()` : objet « Bouton », même repli. Champs « Couleur du bouton », « Couleur du texte du bouton » (`auto: true`), « Taille du bouton » (Petit / Moyen / Grand).
  - `ALIGN_OPTIONS` : « Au début de la ligne » (`left`), « Centré » (`center`).
- Produces (Hero) :
  - `heroSchema = z.preprocess(legacyHeroStyle, z.object({ id, title: richTextSchema(120), subtitle: richTextSchema(300), image, imageAlt, imageWidth: imageWidthSchema, buttonLabel: text(40), buttonHref, align, typography: typographySchema, button: buttonStyleSchema, style: sectionStyleSchema }))`.
  - `legacyHeroStyle` : sans `style` mais avec un ancien `background`, `dark` → `{ background: "color", backgroundColor: "#16265c" }`, `indigo` → `#4f46e5`, `sand` → `#faf6f0`, `light` → rien.
  - `Hero` reçoit `title`, `subtitle` et `buttonLabel` en `ReactNode`, plus `renderImageBox?: RenderImageBox` (par défaut `ImageBox`).
  - `Section` defaults : `{ tone: "light", className: "bg-white text-ink", padding: "py-12 sm:py-16", width: "max-w-3xl" }`.
- Config :
  - `title` et `subtitle` : `{ type: "richtext", contentEditable: true, options: RICH_TEXT_OPTIONS }`.
  - `buttonLabel` : `{ type: "text", contentEditable: true }`.
  - `imageWidth` : `rangeField("Largeur de l'image", { min: 30, max: 100, step: 10, unit: "%" })`.
  - le select `background` disparaît ; ordre des champs : contenu, puis `typography`, `button`, `style`.
  - `HERO_FIELD_LABELS` : libellés français de chaque clé.

- [ ] **Step 1: Write the failing tests** (in `blocks/blocks.test.tsx`, describe « Hero »)

```tsx
it("une ancienne bannière « Sombre » garde son fond nuit et un texte clair", () => {
  const props = BLOCK_SCHEMAS.Hero.parse({ id: "h", title: "T", subtitle: "", image: null, buttonLabel: "", buttonHref: "", align: "center", background: "dark" });
  expect(props.style).toMatchObject({ background: "color", backgroundColor: "#16265c" });
  expect(renderToStaticMarkup(<Hero {...props} />)).toContain("text-white");
});
it("met en forme des mots du titre", () => {
  const html = renderToStaticMarkup(<Hero {...defaults} title="<p>Prix <s>3900</s> <strong>2900</strong></p>" />);
  expect(html).toContain("<s>3900</s>");
  expect(html).toContain("<strong>2900</strong>");
});
it("applique taille et couleur du titre et la largeur d'image", () => {
  const html = renderToStaticMarkup(<Hero {...defaults} image={MEDIA} imageWidth={60} typography={{ ...defaults.typography, titleSize: "xl", titleColor: "#ff0000" }} />);
  expect(html).toContain("text-5xl");
  expect(html).toContain("color:#ff0000");
  expect(html).toContain("max-width:60%");
});
it("les réglages par défaut reproduisent l'ancienne bannière claire", () => {
  const html = renderToStaticMarkup(<Hero {...defaults} />);
  expect(html).toContain("bg-white");
  expect(html).toContain("bg-brand");
});
```
(`defaults = BLOCK_SCHEMAS.Hero.parse({ id: "h", ...heroConfig.defaultProps })` ; keep the existing Hero tests, adapted to the new props.)

- [ ] **Step 2: Run** `npx vitest run blocks/blocks.test.tsx`. Expected: new tests FAIL.
- [ ] **Step 3: Implement** groups, editor-field placeholders, Hero schema / config / component. The `<h1>` uses `RichText inline` + `HERO_TITLE_SIZES` + `colorProps(titleColor, TEXT_AUTO[tone].title)`; the subtitle uses `RichText` with `HERO_TEXT_SIZES`; the button shows only if `hasText(buttonLabel)` and the href is safe.
- [ ] **Step 4: Run** `npx vitest run blocks` then `npm run typecheck`. Expected: PASS.
- [ ] **Step 5: Commit** `feat(blocks): bannière réglable (fond, textes, bouton, largeur d'image)`.

---

### Task 5: Blocs Texte et Image

**Files:**
- Modify: `blocks/text/{schema.ts,config.ts,Text.tsx}`, `blocks/image/{schema.ts,config.ts,ImageBlock.tsx}`
- Test: `blocks/blocks.test.tsx`

**Interfaces:**
- Consumes: Task 1 (style), Task 2 (`RichText`, `richTextSchema`), Task 4 (`groups.ts`, `editor-fields.ts`).
- Produces :
  - `textSchema` : `{ id, title: richTextSchema(120), body: richTextSchema(3000), align, typography, style }`. Section defaults `{ tone: "light", className: "", padding: "py-10", width: "max-w-3xl" }`. Titre `<h2>` avec `SECTION_TITLE_SIZES`, corps avec `TEXT_SIZES`. Champs `title` et `body` en `richtext`, `contentEditable`.
  - `imageSchema` : `{ id, image, alt, caption, width: "full"|"contained", imageWidth: imageWidthSchema, rounded: "none"|"soft"|"strong" = "soft", style }`. Arrondi : `none` → aucun, `soft` → `rounded-card`, `strong` → `rounded-3xl`, ignoré si `width === "full"`. Pleine largeur : `bleed`. `ImageBlock` accepte `renderImageBox?`. Libellés « Coins arrondis » (Aucun / Légers / Prononcés) et « Taille de l'image ».

- [ ] **Step 1: Write the failing tests**

```tsx
it("un ancien texte sans balises garde ses paragraphes", () => {
  const props = BLOCK_SCHEMAS.Text.parse({ id: "t", title: "Titre", body: "Un\n\nDeux", align: "left" });
  expect(renderToStaticMarkup(<Text {...props} />).match(/<p /g)).toHaveLength(2);
});
it("n'exécute pas de HTML collé dans le texte", () => {
  const props = BLOCK_SCHEMAS.Text.parse({ id: "t", title: "", body: "<script>x</script><p>ok</p>", align: "left" });
  const html = renderToStaticMarkup(<Text {...props} />);
  expect(html).not.toContain("<script");
  expect(html).toContain("ok");
});
it("fond coloré sombre : texte clair", () => {
  const props = BLOCK_SCHEMAS.Text.parse({ id: "t", title: "T", body: "b", align: "left", style: { background: "color", backgroundColor: "#0f1a3d" } });
  expect(renderToStaticMarkup(<Text {...props} />)).toContain("text-white");
});
it("image : largeur en pourcentage et coins prononcés", () => {
  const props = BLOCK_SCHEMAS.Image.parse({ id: "i", image: MEDIA, alt: "x", caption: "", width: "contained", imageWidth: 50, rounded: "strong" });
  const html = renderToStaticMarkup(<ImageBlock {...props} />);
  expect(html).toContain("max-width:50%");
  expect(html).toContain("rounded-3xl");
});
```
Remplace le test actuel « échappe le HTML et découpe les paragraphes » : il attend désormais que le script soit retiré, et non plus échappé.

- [ ] **Step 2: Run** `npx vitest run blocks/blocks.test.tsx`. Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** `npx vitest run blocks`. Expected: PASS.
- [ ] **Step 5: Commit** `feat(blocks): textes et images réglables`.

---

### Task 6: Fiche produit (galerie 1 + 5, réglages) et catalogue à 6 photos

**Files:**
- Modify: `blocks/product/{schema.ts,config.ts,ProductBlock.tsx}`, `lib/product-input.ts`, `app/(vendor)/(dashboard)/produits/ProductForm.tsx`
- Test: `blocks/commerce.test.tsx`, `lib/product-input.test.ts`

**Interfaces:**
- Consumes: Tasks 1, 3 (`BUYER_TEXT`, `StorefrontMetadata.lang`), 4.
- Produces :
  - `productSchema` : `{ id, buttonLabel, imageWidth, thumbSize: "s"|"m"|"l" = "m", typography, button, style }`.
  - `ProductBlock` reçoit en plus `blockId: string`, `lang: PageLang` et `renderImageBox?`.
  - `photoAnchor(blockId: string, index: number): string` = `` `photo-${blockId.replace(/[^A-Za-z0-9_-]/g, "")}-${index + 1}` ``.
  - `MAX_PRODUCT_IMAGES = 6` dans `lib/product-input.ts`. Message zod : « 6 photos au plus : la première est l'image principale ». `toPublicProduct` ne garde que les 6 premières photos.
- Galerie :
  - Bande `scroll-snap` : chaque photo en `w-full shrink-0 snap-center`, avec `id={photoAnchor(...)}` et `scroll-mt-4`, dans la boîte `renderImageBox({ width: imageWidth })`.
  - Sous la bande, s'il y a plus d'une photo, une rangée de miniatures `<a href="#…" aria-label={photoAlt}>`. Tailles : `s` `size-14`, `m` `size-20`, `l` `size-28`. Chaque miniature est un `next/image` en `object-cover`.
  - Les textes viennent de `BUYER_TEXT[lang]`.
- `config.render` passe `blockId: id`, `lang: metadata.lang ?? "fr"` et `...props`. `ProductForm` : `max={6}`, avec la phrase d'aide « La première photo est l'image principale ; 5 autres au plus. »

- [ ] **Step 1: Write the failing tests**

```tsx
it("affiche au plus 6 photos et des miniatures vers chacune", () => {
  const images = Array.from({ length: 8 }, (_, i) => ({ ...MEDIA, url: `/media/${String(i).repeat(32).slice(0, 32)}.png` }));
  const html = renderToStaticMarkup(<ProductBlock {...productDefaults} blockId="Product-1" lang="fr" product={{ ...PRODUCT, images }} />);
  expect(html.match(/id="photo-Product-1-/g)).toHaveLength(6);
  expect(html).toContain('href="#photo-Product-1-2"');
});
it("en arabe : textes de l'acheteur traduits", () => {
  const html = renderToStaticMarkup(<ProductBlock {...productDefaults} blockId="p" lang="ar" product={PRODUCT_ON_SALE} />);
  expect(html).toContain(BUYER_TEXT.ar.save.split("{amount}")[0].trim());
});
// lib/product-input.test.ts
it("refuse une 7e photo", () => {
  expect(productInputSchema.safeParse({ ...VALID, images: Array(7).fill(MEDIA) }).success).toBe(false);
});
```
(`productDefaults = BLOCK_SCHEMAS.Product.parse({ id: "p", ...productConfig.defaultProps })` minus `id` ; `PRODUCT`, `PRODUCT_ON_SALE` and `VALID` reuse the fixtures already in those files.)

- [ ] **Step 2: Run** `npx vitest run blocks/commerce.test.tsx lib/product-input.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** `npx vitest run blocks lib` then `npm run typecheck`. Expected: PASS.
- [ ] **Step 5: Commit** `feat(products): galerie 1 + 5 photos et fiche produit réglable`.

---

### Task 7: Formulaire de commande (compteur, arabe, réglages)

**Files:**
- Modify: `blocks/order-form/{totals.ts,schema.ts,config.ts,OrderFormBlock.tsx,OrderForm.tsx}`, `app/api/orders/communes/route.ts`, `lib/algeria/wilayas.ts`, `app/s/[host]/merci/page.tsx`
- Test: `blocks/order-form/totals.test.ts`, `blocks/commerce.test.tsx`, `lib/algeria/wilayas.test.ts`

**Interfaces:**
- Consumes: Tasks 1, 3, 4.
- Produces :
  - `stepQuantity(quantity: number, delta: 1 | -1): number`, bornée de 1 à `MAX_QUANTITY`.
  - `orderFormSchema` : `{ id, title, submitLabel, typography, button: buttonStyleSchema (défaut size "l"), style }`. `title` et `submitLabel` sont en `contentEditable`. Section defaults `{ tone: "light", className: "bg-page", padding: "py-10", width: "max-w-xl" }`, avec `id="commande"` et `scroll-mt-4`.
  - Nouvelles props de `OrderForm` :
    - `lang: PageLang` ;
    - `titleClass: { className: string; style?: CSSProperties }` (le titre reste sur la carte blanche : sa couleur automatique est toujours `text-ink`) ;
    - `buttonClass: { className: string; style?: CSSProperties }`.
  - `title` et `submitLabel` en `ReactNode` ; pour l'éditeur, le bouton de commande affiche l'élément tel quel.
  - Compteur :
    - un groupe `role="group" aria-labelledby="commande-quantity-label"` ;
    - un bouton `−` (`aria-label` = `decrease`, désactivé à 1 ou pendant l'envoi) ;
    - `<output id="commande-quantity" aria-live="polite">` ;
    - un bouton `+` (`aria-label` = `increase`, désactivé à `MAX_QUANTITY`) ;
    - boutons de 44 px (`size-11`).
  - Langue :
    - tous les textes de l'acheteur viennent de `BUYER_TEXT[lang]` ;
    - en arabe, les options de wilaya affichent `w.ar` et le message d'erreur affiché est `errors[field] ?? errors.generic` (en français, on garde le message du serveur) ;
    - les communes sont demandées avec `&lang=ar`, et la redirection va vers `/merci?ref=…&lang=ar`.
  - `communesOf(code: number, lang: PageLang = "fr")` : la liste arabe pour `ar`. `isCommuneOf` ne change pas (FR ou AR).
  - Page de remerciement : `searchParams.lang`, validée par `isPageLang` (défaut `fr`), avec `<main lang dir>` et les textes de `BUYER_TEXT`.

- [ ] **Step 1: Write the failing tests**

```ts
// totals.test.ts
it("le compteur reste entre 1 et 10", () => {
  expect(stepQuantity(1, -1)).toBe(1);
  expect(stepQuantity(1, 1)).toBe(2);
  expect(stepQuantity(MAX_QUANTITY, 1)).toBe(MAX_QUANTITY);
});
// commerce.test.tsx
it("compteur − 1 + : moins grisé au départ", () => {
  const html = renderToStaticMarkup(<OrderForm {...FORM_PROPS} />);
  expect(html).toMatch(/<button[^>]*aria-label="Diminuer la quantité"[^>]*disabled/);
  expect(html).toContain('<output id="commande-quantity" aria-live="polite">1</output>');
  expect(html).not.toContain('<select id="commande-quantity"');
});
it("en arabe : libellés et wilayas en arabe", () => {
  const html = renderToStaticMarkup(<OrderForm {...FORM_PROPS} lang="ar" />);
  expect(html).toContain(BUYER_TEXT.ar.fullName);
  expect(html).toContain("الجزائر");
});
// wilayas.test.ts
it("donne les communes en arabe sur demande", () => {
  expect(communesOf(1, "ar")).toContain("أدرار");
});
```
(`FORM_PROPS = { product: PRODUCT, shipping: SHIPPING, title: "Commander", submitLabel: "Confirmer", lang: "fr", titleClass: { className: "text-ink" }, buttonClass: { className: "bg-brand" } }`, with `SHIPPING` including wilaya 16. Adapt the existing `OrderForm`/`OrderFormBlock` tests to the new props.)

- [ ] **Step 2: Run** `npx vitest run blocks/order-form blocks/commerce.test.tsx lib/algeria`. Expected: FAIL.
- [ ] **Step 3: Implement.** The communes route reads `lang` with `isPageLang`, default `fr`.
- [ ] **Step 4: Run** `npm test` then `npm run typecheck`. Expected: PASS.
- [ ] **Step 5: Commit** `feat(orders): compteur de quantité, formulaire en arabe et réglable`.

---

### Task 8: Pied de page réglable

**Files:**
- Modify: `blocks/footer/{schema.ts,config.ts,Footer.tsx}`
- Test: `blocks/blocks.test.tsx`

**Interfaces:**
- Consumes: Tasks 1, 2, 3, 4.
- Produces :
  - `footerSchema` gagne `returnPolicy: richTextSchema(1000)`, `typography` et `style`.
  - `shopName` en `contentEditable`, `returnPolicy` en `richtext`.
  - Section avec `as="footer"` ; defaults `{ tone: "dark", className: "bg-deep", padding: "py-10", width: "max-w-3xl" }`.
  - Liens selon le ton : dark → `text-white` avec `focus-visible:outline-white` ; light → `text-ink` avec `focus-visible:outline-ink`.
  - « Politique de retour » vient de `BUYER_TEXT[lang]` (`lang` lu dans la metadata).

- [ ] **Step 1: Write the failing tests**

```tsx
it("pied de page sur fond clair : liens foncés lisibles", () => {
  const props = BLOCK_SCHEMAS.Footer.parse({ ...footerDefaults, phone: "0555 12 34 56", style: { background: "color", backgroundColor: "#ffffff" } });
  const html = renderToStaticMarkup(<Footer {...props} lang="fr" />);
  expect(html).toContain("text-ink");
  expect(html).not.toContain("bg-deep");
});
it("politique de retour mise en forme et traduite en arabe", () => {
  const props = BLOCK_SCHEMAS.Footer.parse({ ...footerDefaults, returnPolicy: "<p><strong>7 jours</strong></p>" });
  const html = renderToStaticMarkup(<Footer {...props} lang="ar" />);
  expect(html).toContain("<strong>7 jours</strong>");
  expect(html).toContain(BUYER_TEXT.ar.returnPolicy);
});
```

- [ ] **Step 2: Run** `npx vitest run blocks/blocks.test.tsx`. Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** `npx vitest run blocks`. Expected: PASS.
- [ ] **Step 5: Commit** `feat(blocks): pied de page réglable`.

---

### Task 9: Champs de l'éditeur (curseur, couleur) et contenu normalisé à l'ouverture

**Files:**
- Create: `blocks/fields/RangeField.tsx`, `blocks/fields/ColorField.tsx`
- Modify: `app/(vendor)/(editor)/edit/[pageId]/editor-config.ts`, `app/(vendor)/(editor)/edit/[pageId]/page.tsx`
- Test: `app/(vendor)/(editor)/edit/[pageId]/editor-config.test.ts`

**Interfaces:**
- Consumes: Task 4 (`editorKind`, `editorOptions`).
- Produces :
  - `RangeField` (`"use client"`) : `FieldLabel`, un `<input type="range">` avec les bornes de `field.editorOptions`, la valeur affichée (« 70 % ») et `aria-valuetext`.
  - `ColorField` (`"use client"`) : `FieldLabel`, puis :
    - si `auto`, un bouton « Automatique » ;
    - 8 pastilles `PALETTE`, des `<button type="button" aria-pressed aria-label={name}>` ;
    - un `<input type="color">` « Personnalisée » ;
    - la valeur hex affichée.
  - `withEditorFields(config: Config): Config` : parcourt les `fields` de chaque bloc et de la racine, `objectFields` compris, de façon récursive. Elle remplace chaque champ `custom` portant un `editorKind` par `MediaField`, `RangeField` ou `ColorField`, et garde `label` et `editorOptions`. Elle remplace `withMediaField`.
  - `page.tsx` donne à l'éditeur `parsePageContent(page.draft) ?? page.draft` : les anciens textes simples arrivent en paragraphes et les nouveaux réglages ont leurs valeurs par défaut.

- [ ] **Step 1: Write the failing tests**

```ts
it("branche les champs d'édition jusque dans les groupes", () => {
  const config = buildEditorConfig([]);
  const style = config.components.Hero?.fields?.style as { objectFields: Record<string, { render?: { name: string } }> };
  expect(style.objectFields.backgroundImage.render?.name).toBe("MediaField");
  expect(style.objectFields.overlay.render?.name).toBe("RangeField");
  expect(style.objectFields.backgroundColor.render?.name).toBe("ColorField");
  const width = config.components.Image?.fields?.imageWidth;
  expect(width && "render" in width ? width.render.name : "").toBe("RangeField");
});
it("propose la langue et les polices de la page", () => {
  const root = buildEditorConfig([]).root?.fields;
  expect(root?.lang).toMatchObject({ label: "Langue de la page" });
  expect(root?.bodyFont).toMatchObject({ label: "Police du texte" });
});
```

- [ ] **Step 2: Run** `npx vitest run "app/(vendor)/(editor)"`. Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** `npm test` then `npm run typecheck`. Expected: PASS (`server-graph.test.ts` included).
- [ ] **Step 5: Commit** `feat(editor): curseurs et couleurs dans le panneau des réglages`.

---

### Task 10: Poignée de taille des images (glisser comme dans Slides)

**Files:**
- Create: `blocks/editor/snap.ts`, `blocks/editor/ResizableImageBox.tsx`
- Modify: `app/(vendor)/(editor)/edit/[pageId]/editor-config.ts`
- Test: `blocks/editor/snap.test.ts`, `app/(vendor)/(editor)/edit/[pageId]/editor-config.test.ts`

**Interfaces:**
- Consumes: Task 1 (`RenderImageBox`, `ImageBoxProps`), blocs Hero / Image / Product (prop `renderImageBox`).
- Produces :
  - `snapWidth(boxPx: number, parentPx: number): number` = `clamp(round(boxPx / parentPx * 10) * 10, 30, 100)` ; `parentPx <= 0` → 100.
  - `ResizableImageBox({ blockId, prop, width, children })` (`"use client"`) :
    - même boîte que `ImageBox`, avec une poignée `<button type="button" aria-label="Redimensionner l'image">` au bord de fin de ligne, au milieu ;
    - au glisser, `pointerdown` fait `stopPropagation`, `preventDefault` et `setPointerCapture` ; la largeur suit `snapWidth(|clientX − centre du parent| × 2, largeur du parent)`, une bulle « 70 % » s'affiche, et le relâchement enregistre la valeur ;
    - au clavier, ← → retirent ou ajoutent 10 et enregistrent ;
    - l'enregistrement passe par `useGetPuck()` : `getItemById`, `getSelectorForId`, puis `dispatch({ type: "replace", destinationIndex, destinationZone, data: { ...item, props: { ...item.props, [prop]: value } } })`.
  - `withResizableImages(config)` : pour `Hero`, `Image` et `Product`, `render: (props) => original.render({ ...props, renderImageBox: (box) => createElement(ResizableImageBox, { blockId: props.id, prop: "imageWidth", ...box }) })`.

- [ ] **Step 1: Write the failing tests**

```ts
it("arrondit au palier de 10 % entre 30 et 100", () => {
  expect(snapWidth(700, 1000)).toBe(70);
  expect(snapWidth(651, 1000)).toBe(70);
  expect(snapWidth(100, 1000)).toBe(30);
  expect(snapWidth(1500, 1000)).toBe(100);
  expect(snapWidth(500, 0)).toBe(100);
});
it("l'éditeur donne une poignée aux blocs à image", () => {
  const hero = buildEditorConfig([]).components.Hero!;
  const element = hero.render({ ...hero.defaultProps, id: "h1", puck: { isEditing: true, metadata: {} } } as never) as ReactElement<{ renderImageBox?: unknown }>;
  expect(typeof element.props.renderImageBox).toBe("function");
});
```

- [ ] **Step 2: Run** `npx vitest run blocks/editor "app/(vendor)/(editor)"`. Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** `npm test`, `npm run typecheck`, `npm run lint`. Expected: PASS.
- [ ] **Step 5: Browser check.** Run `npm run dev` and use Playwright with Edge. Open the editor, put an image in the Bannière, and drag the handle from 100 % to about 60 %. Expected: the bubble shows `60 %`, the image shrinks, the panel slider shows 60, Ctrl+Z goes back to 100, and the block is not moved. If Puck intercepts the pointer (block dragged, or no change), apply the spec fallback (decision 10): keep the slider only, remove the handle, ledger the ruling, and tell Salah.
- [ ] **Step 6: Commit** `feat(editor): poignée de taille des images`.

---

### Task 11: Interface simple, modèle soigné, vérification de bout en bout

**Files:**
- Modify: `blocks/schemas.ts` (`BLOCK_DESCRIPTIONS`), `app/(vendor)/(editor)/edit/[pageId]/Editor.tsx`, `templates/landing-fr.json`
- Test: `templates/landing-fr.test.ts`, `blocks/schemas.test.ts`

**Interfaces:**
- Produces :
  - `BLOCK_DESCRIPTIONS: Record<BlockType, string>` :
    - Hero : « titre, image et bouton d'appel » ;
    - Product : « photos, prix et choix du produit » ;
    - Text : « titre et paragraphes » ;
    - OrderForm : « commande payée à la livraison » ;
    - Image : « une photo, sa taille et sa légende » ;
    - Footer : « contacts, réseaux et politique de retour ».
  - `Editor.tsx` :
    - override `drawerItem` : icône lucide 16 px (Hero `PanelTop`, Product `ShoppingBag`, Text `Type`, OrderForm `ClipboardList`, Image `Image`, Footer `PanelBottom`), nom du bloc, puis description en `text-[12px] text-faint` ;
    - override `preview` : si `data.content.length === 0`, un `Notice` « Glissez un bloc depuis la colonne de gauche pour commencer. » au-dessus de l'aperçu.
  - Modèle :
    - Bannière : `style: { background: "color", backgroundColor: "#16265c" }`, bouton par défaut.
    - Texte : `style: { background: "color", backgroundColor: "#faf6f0" }`.
    - Racine : `lang: "fr"`, `headingFont: "system"`, `bodyFont: "system"`.
    - Le reste garde ses valeurs actuelles.

- [ ] **Step 1: Write the failing tests**

```ts
it("chaque bloc a une description pour la colonne des blocs", () => {
  for (const type of BLOCK_TYPES) expect(BLOCK_DESCRIPTIONS[type].length).toBeGreaterThan(5);
});
// templates/landing-fr.test.ts
it("le modèle ouvre sur une bannière sombre", () => {
  const result = validatePageContent(template);
  expect(result.ok && result.content.content[0].props.style).toMatchObject({ background: "color", backgroundColor: "#16265c" });
});
```

- [ ] **Step 2: Run** `npx vitest run blocks/schemas.test.ts templates`. Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** `npm test`, `npm run test:int`, `npm run typecheck`, `npm run lint`, `npm run build`. Expected: all green ; the build output lists no editor code in `/s/[host]` (server-graph guard green).
- [ ] **Step 5: Browser walk-through** (Playwright + Edge, `npm run dev`), in this order :
  1. Créer un site, puis ouvrir l'éditeur.
  2. Écrire un titre dans la bannière, puis sélectionner un mot et le mettre en gras et barré.
  3. Mettre une image de fond assombrie à 60 % ; changer la couleur et la taille du titre.
  4. Ajouter un bloc Image ; le supprimer puis annuler.
  5. Passer la page en العربية et choisir la police Cairo ; publier.
  6. Sur le site public en 390 px : vérifier `dir="rtl"`, le fond assombri, le mot en gras et barré et la police Cairo ; régler le compteur `− 2 +` ; envoyer une commande (formulaire en arabe), puis vérifier la page de remerciement en arabe.
  7. Rouvrir une page créée avant ce travail : elle s'affiche comme avant.
- [ ] **Step 6: Commit** `feat(editor): colonne des blocs décrite, modèle soigné`.
