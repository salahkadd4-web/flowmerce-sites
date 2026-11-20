# In-page editing and 5 professional templates — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The seller sets every element in the page itself, Word/PowerPoint style, with no right-hand panel. Five ready-made, elegant templates — one per category — are offered when a site is created.

**Architecture:**
- The editor moves to Puck's composition mode: our own frame (top bar, sections column, `Puck.Preview`).
- Section toolbars replace Puck's `actionBar`. Text toolbars come through the richtext fields' `renderInlineMenu`, which Puck displays inside that bar.
- Button and image toolbars are editor wrappers injected by `editor-config.ts`, the same way `renderImageBox` already is.
- Templates are Puck data validated by the existing schemas. Their photos are static files under `public/templates/`.

**Tech Stack:** Next.js 16.4, React 19, Puck 0.24 (composition, `usePuck`, `useGetPuck`, `dispatch`, `setDeep`, `registerOverlayPortal`), zod 3, Tailwind 4, vitest 4, Playwright-core + Edge, Python/Pillow (photo preparation).

**Spec:** `docs/superpowers/specs/2026-11-20-edition-dans-la-page-et-modeles-design.md`

## Global Constraints

- **No right-hand panel.** Every setting is reached from the page or from a window opened in the page.
- **`blocks/puck.config.ts` stays shared and server-safe.**
  - Editor pieces are injected by `app/(vendor)/(editor)/edit/[pageId]/editor-config.ts` only.
  - `blocks/server-graph.test.ts` stays green.
- **Stable Puck overrides.** Components are defined at module level, never as inline functions in render.
- **Updating a block** goes through `dispatch({ type: "replace", … })`, so Ctrl+Z works.
  - Root props use `dispatch({ type: "replaceRoot", root })`.
  - Nested paths use `setDeep`.
  - A missing group starts from `DEFAULT_TYPOGRAPHY` / `DEFAULT_BUTTON` / `DEFAULT_SECTION_STYLE`.
- **Toolbar buttons and windows:**
  - every toolbar button has an `aria-label` and a `title` in French;
  - every window closes on Échap and on a click outside, and gives focus back to the button that opened it.
- **Controls placed inside a block** (image and button toolbars) use `registerOverlayPortal(el, { disableDrag: true })`, with their listeners registered in capture phase before it.
- **Links** entered by the seller go through `isSafeHref` (after `withDefaultScheme`). Anything refused is not written.
- **Automatic save:**
  - 2 s after the last change; Ctrl+S saves immediately;
  - never two saves at once;
  - a publish waits for the save in progress.
- **Template photos:**
  - Unsplash License (commercial use, no attribution required);
  - no visible logo or brand name;
  - WebP, ≤ 1920 px wide, ≤ 400 KB;
  - stored in `public/templates/<slug>/`, credits in `public/templates/CREDITS.md`.
- **Accepted image URLs:** `/media/<32 hex>.<ext>` and `/templates/<slug>/<name>.<ext>`, where slug and name match `[a-z0-9-]+` and ext is jpg, png, webp or avif.
- **Interface text** is in French. Template copy is French, short and credible for the Algerian market (delivery to all 58 wilayas, payment on delivery).

## Review Focus

1. **A page saved before this branch** (no `typography` / `button` / `style`): every toolbar opens on the default values, and the first change writes a complete group without crashing.
2. **Automatic save while publishing or leaving the page:** no lost changes. The status says "Non enregistré — Réessayer" after a failure. The warning before leaving stays while anything is unsaved.
3. **Typing in the page with a toolbar open:** focus is not lost and the toolbar does not cover the caret.
4. **Keyboard:** Tab reaches every toolbar button; Échap closes the window and focus comes back.
5. **"Autre lien" set to `javascript:alert(1)`:** refused with a message, and nothing is written.

---

### Task 1: Block update helpers (pure)

**Files:**
- Create: `blocks/editor/block-patch.ts`
- Test: `blocks/editor/block-patch.test.ts`

**Interfaces:**
- Produces:
  - `readGroup<T>(props: Record<string, unknown>, key: string, defaults: T): T` — the group or its defaults, merged over the defaults.
  - `withPath(props: Record<string, unknown>, path: string, value: unknown, defaults?: Record<string, unknown>): Record<string, unknown>` — `"typography.titleSize"` writes into `{...defaults.typography, ...props.typography}`.
  - `updateBlock(getPuck: () => PuckApi, id: string, change: (props) => props): void` — dispatches `replace`; does nothing if the id is missing.
  - `updateRoot(getPuck, change: (rootProps) => rootProps): void` — dispatches `replaceRoot`.
  - `GROUP_DEFAULTS = { typography: DEFAULT_TYPOGRAPHY, button: DEFAULT_BUTTON, style: DEFAULT_SECTION_STYLE }`.

- [ ] Step 1: tests
  - `withPath({}, "typography.titleSize", "l", GROUP_DEFAULTS)` gives `typography` equal to `{...DEFAULT_TYPOGRAPHY, titleSize: "l"}`.
  - `withPath({style:{background:"color",backgroundColor:"#000000"}}, "style.overlay", 40, GROUP_DEFAULTS)` keeps `backgroundColor` and sets `overlay: 40`.
  - `withPath({title:"x"}, "buttonHref", "#commande")` gives `{title:"x", buttonHref:"#commande"}`, and the input object is not mutated.
  - `readGroup({}, "button", DEFAULT_BUTTON)` gives `DEFAULT_BUTTON`.
  - `updateBlock` with a fake `getPuck`: dispatches `{type:"replace", destinationIndex, destinationZone, data:{...item, props:new}}`; dispatches nothing when the id is unknown.
- [ ] Step 2: `npx vitest run blocks/editor/block-patch.test.ts` → FAIL (module missing).
- [ ] Step 3: implement with `setDeep` from `@puckeditor/core`.
- [ ] Step 4: same command → PASS.
- [ ] Step 5: commit `feat(editor): mise à jour des blocs depuis la page`.

### Task 2: Shared window and toolbar button

**Files:**
- Create: `blocks/editor/Popover.tsx`, `blocks/editor/ToolbarButton.tsx`, `blocks/editor/ColorSwatches.tsx`, `blocks/editor/SegmentedChoice.tsx`
- Test: `blocks/editor/popover.test.tsx` (vitest + react-dom/server for the static markup; behaviour checked in the browser in Task 9)

**Interfaces:**
- `ToolbarButton({ label, icon, active?, onClick, children? })`: a `button` with `aria-label`/`title` = label, plus `aria-pressed` when `active` is given.
- `Popover({ label, icon, text?, children, width? })`:
  - a button with `aria-haspopup="dialog"` and `aria-expanded`, plus a panel with `role="dialog"` and `aria-label`;
  - closes on Échap or a pointerdown outside, then returns focus to the button.
- `ColorSwatches({ value, onChange, allowAuto? })`:
  - "Automatique" (when `allowAuto`), the 8 `PALETTE` colours and `<input type="color">`;
  - each swatch has `aria-label` = the colour name and `aria-pressed`.
- `SegmentedChoice({ label, options:{value,label}[], value, onChange })`: a radiogroup of buttons.

- [ ] Step 1: tests (static markup)
  - Popover: closed, it has `aria-expanded="false"` and no dialog.
  - ColorSwatches: with `allowAuto`, there are 10 controls; the current value carries `aria-pressed="true"`.
  - SegmentedChoice: renders `role="radiogroup"`, and the current choice has `aria-checked="true"`.
- [ ] Step 2: run → FAIL. Step 3: implement (client components, dashboard tokens `components/dashboard/ui`). Step 4: PASS. Step 5: commit `feat(editor): fenêtres et boutons des barres d'outils`.

### Task 3: Editor frame — top bar, automatic save, page settings

**Files:**
- Create: `app/(vendor)/(editor)/edit/[pageId]/shell/TopBar.tsx`, `shell/PageSettingsDialog.tsx`, `shell/autosave.ts`
- Modify: `Editor.tsx` (`<Puck>` with children: our own layout, `Puck.Preview` in the centre, no `Puck.Fields` panel)
- Test: `shell/autosave.test.ts`

**Interfaces:**
- `autosave.ts`:
  - `createAutosave({ save: (data) => Promise<boolean>, delayMs = 2000, onStatus })` returns `{ change(data), flush(): Promise<boolean>, dispose() }`;
  - statuses: `"clean" | "pending" | "saving" | "saved" | "error"`;
  - only one save at a time; a change made during a save triggers another save afterwards; `flush` saves immediately and resolves once everything is saved.
- `TopBar({ site, status, onRetry, onPublish, onPreview, onOpenSettings })`:
  - "← Mes sites" (confirms if `pending` or `error`), the site name;
  - Téléphone / Ordinateur (`setUi` viewports: 360 / available width);
  - ↶ ↷ (`history.back/forward`, disabled when `!hasPast` / `!hasFuture`);
  - status (`role=status`): "Enregistrement…" / "Enregistré" / "Non enregistré — Réessayer" (a button);
  - "Réglages de la page", "Aperçu", "Publier".
  - Publier and Aperçu call `flush()` first.
- `PageSettingsDialog({ open, onClose })`: modal (`role=dialog`, `aria-modal`); deselects the block (`setUi({itemSelector:null})`) and shows `<Puck.Fields />`, i.e. the root fields.

- [ ] Step 1: autosave tests with fake timers
  - (a) 3 changes within 2 s lead to 1 save holding the last data;
  - (b) a change during a save leads to a second save once the first is done, never two at once;
  - (c) a failed save sets status "error", and the next `change` retries;
  - (d) `flush()` during the delay saves immediately and resolves `true`.
- [ ] Step 2: run → FAIL. Step 3: implement `autosave.ts`, then the frame. Ctrl+S calls `flush`; `beforeunload` is active while `pending|saving|error`. Step 4: PASS + `npx tsc --noEmit`.
- [ ] Step 5: browser check (Playwright script `pw/shell.mjs`):
  - no right-hand panel;
  - the change "Téléphone → Ordinateur" widens the preview;
  - an edit leads to "Enregistré" within 4 s;
  - the page settings window shows "Langue de la page".
- [ ] Step 6: commit `feat(editor): cadre sans panneau, enregistrement automatique, réglages de la page`.

### Task 4: Sections column and adding a section

**Files:**
- Create: `shell/SectionsColumn.tsx`, `shell/AddSectionDialog.tsx`, `shell/sections.ts`
- Test: `shell/sections.test.ts`

**Interfaces:**
- `listSections(content: {type:string, props:{id:string}}[]): {id, type, label, index}[]` — the label comes from `BLOCK_LABELS`; an unknown type gets its own name.
- `insertionIndex(selectedIndex: number | null, count: number): number` — after the selected section, otherwise at the end.
- `SectionsColumn`:
  - rows `<button>` with a number, icon and name; the selected one has `aria-current="true"`; a click calls `setUi({itemSelector:{index, zone:"root:default-zone"}})` and scrolls the preview to it;
  - "Monter" / "Descendre" call `dispatch({type:"move", …})`;
  - "+ Ajouter une section" at the bottom.
- `AddSectionDialog`: 6 types (icon, name, `BLOCK_DESCRIPTIONS`). A click calls `dispatch({type:"insert", componentType, destinationIndex: insertionIndex(...), destinationZone:"root:default-zone"})`, then selects the new section.
- Empty page in the preview: "Votre page est vide" plus a button "Ajouter une section" that opens the same window. This replaces `PreviewWithHint`.

- [ ] Step 1: tests
  - `insertionIndex(null, 3) === 3`
  - `insertionIndex(0, 3) === 1`
  - `listSections` keeps the order and maps `Hero` → "Bannière"
- [ ] Step 2: FAIL → Step 3: implement → Step 4: PASS.
- [ ] Step 5: browser check:
  - adding "Texte" after the banner puts it in 2nd position, selected;
  - "Descendre" swaps two sections;
  - Ctrl+Z undoes.
- [ ] Step 6: commit `feat(editor): colonne des sections, ajout d'une section`.

### Task 5: Section bar (actionBar override)

**Files:**
- Create: `shell/SectionBar.tsx`, `shell/section-actions.tsx` (windows per block type)
- Modify: `Editor.tsx` (`overrides.actionBar: SectionBar`)

**Interfaces:**
- `SectionBar({ label, children, dragHandle })`:
  - reads `selectedItem` (usePuck);
  - when `children` contains Puck's text menu (text being edited), shows that menu only;
  - otherwise shows: name · actions of the type · "Fond" · "Espacement" · ↑ · ↓ · "Dupliquer" · "Supprimer" (red; `remove` action);
  - Ctrl+Z restores what was deleted.
- `FondPanel`: `SegmentedChoice` (Par défaut / Couleur / Image) + `ColorSwatches` + `MediaField` + darkness (`RangeField` 0–80 by 10) → `style.*`.
- `EspacementPanel`: spacing (Compact / Normal / Aéré) + width (Étroite / Normale / Large).
- Actions per type:
  - Hero: "Image" (choice + description, while the banner has no image);
  - Product: "Produit" (list of products → root `productId`) and "Photos" (`thumbSize`);
  - OrderForm: "Texte" (title size and colour);
  - Footer: "Contacts" (phone, email), "Réseaux" (Facebook, Instagram, TikTok, each `withDefaultScheme` + `isSafeHref`; message "Lien non valable" if refused) and "Texte" (text size and colour).

- [ ] Step 1: unit test `section-actions.test.ts` on the pure function `socialLinkError(value): string | null`:
  - `""` → null;
  - `"facebook.com/x"` → null;
  - `"javascript:alert(1)"` → "Lien non valable".
- [ ] Step 2: FAIL → Step 3: implement → Step 4: PASS.
- [ ] Step 5: browser check:
  - Fond = Image + darkness 60 on the banner;
  - spacing "Aéré";
  - duplicating, then deleting the copy;
  - "Réseaux" with `javascript:` refused.
- [ ] Step 6: commit `feat(editor): barre de la section`.

### Task 6: Text toolbar

**Files:**
- Create: `blocks/editor/TextToolbar.tsx`
- Modify: `editor-config.ts` (`renderInlineMenu` per field, `renderMenu` unchanged), delete `blocks/fields/RichTextMenus.tsx` if no longer used
- Test: `editor-config.test.ts` (extended)

**Interfaces:**
- `TEXT_STYLES: Record<string, Record<string, { size: "titleSize" | "textSize"; color: "titleColor" | "textColor"; align?: true }>>` = the spec's table:

  | Block | Field | Settings |
  |---|---|---|
  | Hero | title | titleSize, titleColor, align |
  | Hero | subtitle | textSize, textColor, align |
  | Text | title | titleSize, titleColor, align |
  | Text | body | textSize, textColor, align |
  | Footer | returnPolicy | textSize, textColor |

- `textToolbar(style)` returns a **stable** component created once per field when the config is built. It renders:
  - B I U S (`RichTextMenu.*`);
  - "Taille" (Petite / Moyenne / Grande / Très grande over `SIZES`);
  - "Couleur" (`ColorSwatches allowAuto`);
  - "Alignement" (Début / Centré) when `align`.

  Each change goes through `updateBlock(getPuck, selectedItem.props.id, …)`.

- [ ] Step 1: test — in `buildEditorConfig([])`, `Hero.fields.title.renderInlineMenu` and `Text.fields.body.renderInlineMenu` are functions, and the same function is returned when the config is built twice (`TEXT_STYLES` is memoised per field).
- [ ] Step 2: FAIL → Step 3: implement → Step 4: PASS.
- [ ] Step 5: browser check:
  - click the banner title → B I U S + Taille + Couleur appear;
  - "Grande" enlarges the title;
  - colour "Sable" applies;
  - typing continues without losing focus.
- [ ] Step 6: commit `feat(editor): barre d'outils du texte`.

### Task 7: Button toolbar

**Files:**
- Create: `blocks/editor/EditableButton.tsx`, `blocks/button-box.tsx` (server-safe type + default render)
- Modify: `blocks/hero/Hero.tsx`, `blocks/product/Product*.tsx`, `blocks/order-form/OrderFormBlock.tsx` + `OrderForm.tsx` (optional `renderButton` prop, ignored by default), `editor-config.ts` (injection for Hero, Product, OrderForm)
- Test: `blocks/blocks.test.tsx` (public render unchanged without `renderButton`), `blocks/editor/link-target.test.ts`

**Interfaces:**
- `blocks/button-box.tsx`: `type RenderButton = (box: { children: ReactNode }) => ReactNode`; `renderButton` default = the children unchanged.
- `EditableButton({ blockId, linkable, children })`: toolbar above the button (portal registered):
  - "Couleur" (`button.color`), "Texte" (`button.textColor`), "Taille" (`button.size`);
  - when `linkable` (Hero): "Mène vers" — Formulaire de commande `#commande` / Fiche produit `#produit-<id of the first Product block>` / Autre lien.
- `linkTargetOf(href, productAnchor): "order" | "product" | "other"`; `linkError(value): string | null` (`withDefaultScheme` + `isSafeHref`; `""` allowed).

- [ ] Step 1: tests
  - `linkTargetOf("#commande", …)` → "order"
  - `linkError("javascript:alert(1)")` → "Lien non valable"
  - `linkError("wa.me/213555")` → null
  - Hero rendered without `renderButton` → same markup as before (existing test kept)
- [ ] Step 2: FAIL → Step 3: implement → Step 4: PASS + `blocks/server-graph.test.ts` green.
- [ ] Step 5: browser check:
  - click the banner button → toolbar;
  - colour "Encre" applied;
  - "Mène vers: Autre lien" + `javascript:` → message, nothing written.
- [ ] Step 6: commit `feat(editor): barre d'outils du bouton`.

### Task 8: Image toolbar and empty states

**Files:**
- Modify: `blocks/editor/ResizableImageBox.tsx` (toolbar), `blocks/image/ImageBlock.tsx` and `blocks/product/ProductBlock.tsx` (editor texts for empty states via `renderEmpty` injected; public render unchanged), `editor-config.ts`
- Create: `blocks/editor/ImageToolbar.tsx`, `blocks/editor/MediaPicker.tsx` (upload logic taken out of `MediaField`, which reuses it)

**Interfaces:**
- `ImageToolbar({ blockId, imageProp, altProp, roundedProp? })`: "Remplacer l'image" (MediaPicker), "Description" (window with a text field), "Coins" (Aucun / Doux / Marqué) when `roundedProp`.
- Image block with no image (editor only): a "Choisir une image" button that opens `MediaPicker`.
- Fiche produit with no product (editor only): a "Choisir le produit" button that opens the product list → root `productId`.

- [ ] Step 1: tests — the public render of ImageBlock and ProductBlock without an image/product contains neither "panneau" nor "réglages" (the editor wording no longer refers to the panel).
- [ ] Step 2: FAIL → Step 3: implement → Step 4: PASS.
- [ ] Step 5: browser check:
  - replace an image;
  - description saved;
  - "Choisir le produit" shows the product sheet.
- [ ] Step 6: commit `feat(editor): barre d'outils de l'image, états vides`.

### Task 9: Elegant fonts

**Files:** Modify `blocks/fonts.ts`, `test/next-font-stub.ts`, `blocks/root/root.test.tsx`

- [ ] Step 1: test — `FONT_IDS` includes `"playfair"`, `"cormorant"`, `"montserrat"`; `fontFamily("playfair")` starts with the family name.
- [ ] Step 2: FAIL → Step 3:
  - `Playfair_Display({subsets:["latin"], display:"swap", preload:false})`;
  - `Cormorant_Garamond` weights 400/600/700;
  - `Montserrat`;
  - labels "Playfair Display (élégante)", "Cormorant (raffinée)", "Montserrat (moderne)".
  - Step 4: PASS.
- [ ] Step 5: commit `feat(fonts): trois polices latines élégantes`.

### Task 10: Template registry and the "Créer un site" picker

**Files:**
- Create: `templates/index.ts`, `templates/templates.test.ts`
- Modify:
  - `blocks/shared.ts` (`mediaSchema`);
  - `lib/site-create.ts` (`templateId`);
  - `app/(vendor)/(dashboard)/sites/new/actions.ts` + `NewSiteForm.tsx` (cards with preview image);
  - `lib/site-create.int.test.ts`.

**Interfaces:**
- `type TemplateInfo = { id: string; name: string; category: string; description: string; preview: string | null; data: unknown }`
- `TEMPLATES: readonly TemplateInfo[]`, with `"landing-fr"` (Modèle simple) first; `templateById(id: string): TemplateInfo | undefined`
- `createSiteForUser(user, { name, subdomain, templateId })`: an unknown template gives `{ ok:false, field:"template", error:"Choisissez un modèle" }`.

- [ ] Step 1: tests
  - `mediaSchema` accepts `/templates/mode/banniere.webp`, and refuses `/templates/../x.webp` and `/templates/Mode/x.webp`;
  - `templateById("inconnu")` is undefined;
  - int test: creating with `"landing-fr"` works, and `"inconnu"` is refused.
- [ ] Step 2: FAIL → Step 3: implement → Step 4: PASS (unit + int).
- [ ] Step 5: commit `feat(sites): choix du modèle à la création`.

### Task 11: Photos and the 5 templates

**Files:**
- Create:
  - `public/templates/{mode,chaussures,beaute,montres,maison}/*.webp`;
  - `public/templates/CREDITS.md`;
  - `templates/{mode,chaussures,beaute,montres,maison}.json`;
  - preview images `public/templates/<slug>/apercu.webp`.
- Modify: `templates/index.ts`
- Test: `templates/templates.test.ts`

**Contents of each template:**
1. Hero with a background photo, `overlay` 40–60, titles in Playfair or Cormorant, button in the accent colour;
2. Product;
3. Text "Pourquoi nous choisir" (3 benefits);
4. Image (lifestyle photo, `rounded: "soft"`);
5. Text "Livraison et paiement" (58 wilayas, payment on delivery, exchange);
6. OrderForm;
7. Footer.

**Palettes:**

| Template | Background | Accent | Fonts |
|---|---|---|---|
| Mode | ivory `#f7f3ee` | black `#111111` | Playfair / Montserrat |
| Chaussures | charcoal `#1c1c1e` | camel `#b08d57` | Montserrat / Montserrat |
| Beauté | blush `#f6ece8` | rose gold `#b76e79` | Cormorant / Montserrat |
| Montres | night `#0e1420` | gold `#c9a227` | Playfair / Montserrat |
| Maison | linen `#f4efe6` | olive `#5b6b3a` | Cormorant / Montserrat |

- [ ] Step 1: tests, for each `TEMPLATES` entry:
  - `parsePageContent(data)` is not null;
  - every `/templates/...` URL exists on disk, with the declared width and height (`image-size`) and ≤ 400 KB;
  - the Hero has `style.background === "image"`;
  - `preview` exists on disk (except "landing-fr", whose preview is null).
- [ ] Step 2: FAIL.
- [ ] Step 3: find the photos:
  - through Edge (Playwright) on unsplash.com, 2 photos per category: a wide one for the banner and one for the lifestyle image, each without a visible logo;
  - download them from `images.unsplash.com/<id>?w=1920&q=80`, convert to WebP with Pillow (≤ 400 KB);
  - write CREDITS (photographer, page link, license);
  - write the 5 JSON files;
  - generate the preview images (Playwright capture of the rendered template at 1280 px, cut at 1280×1600 then reduced to 640 px wide).
- [ ] Step 4: PASS.
- [ ] Step 5: commit `feat(templates): cinq modèles pro — mode, chaussures, beauté, montres, maison`.

### Task 12: Full browser walkthrough

- [ ] Run `pw/edition-dans-la-page.mjs`:
  1. create a site with the "Beauté" template;
  2. editor: replace the banner photo, change the title (Grande, Sable), change the button colour;
  3. add a Texte section, move it down, delete it, then Ctrl+Z;
  4. open the page settings and switch the language to Arabic, then back to French;
  5. publish;
  6. public page at 390 px: photos, fonts, order form;
  7. an old page still renders and still opens in the editor.
- [ ] Review the screenshots, then run the full suites: `npm test`, `npm run test:int`, `npx tsc --noEmit`, `npm run lint`, `npm run build`.
- [ ] Commit any fixes, each with its test.
