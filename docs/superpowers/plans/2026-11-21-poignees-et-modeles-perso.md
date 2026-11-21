# Resize handles, templates in the editor, personal templates — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:**
- Resize images, buttons and sections by dragging their edges and corners, as in Google Slides.
- Choose a template from the editor.
- Save your own page as a personal template.

**Architecture:**
- New size settings, all optional and proportional:
  - `imageHeight` on the image blocks;
  - `button.width`;
  - `style.minHeight`.
- Pure functions compute the sizes from a drag (`blocks/editor/resize.ts`).
- One editor handle component (`ResizeHandles`) is used three ways:
  - by the image box;
  - by the button box;
  - by a `componentOverlay` override for sections.
- Personal templates: `CustomTemplate` table, `lib/custom-templates.ts` module, server actions.
- A "Modèles" window in the editor.

**Tech Stack:** Next.js 16.4, React 19, Puck 0.24 (`registerOverlayPortal`, `componentOverlay`, `setData`), Prisma 7 + PostgreSQL, zod 3, vitest, Playwright + Edge.

**Spec:** `docs/superpowers/specs/2026-11-21-poignees-et-modeles-perso-design.md`

## Global Constraints

- **New settings are optional, with defaults that keep the old rendering:**
  - `imageHeight: null`;
  - `button.width: "auto"`;
  - `style.minHeight: 0`.
- **Allowed ranges:**
  - image width 30–100 in steps of 5;
  - `imageHeight` 30–200 in steps of 5, or null;
  - `button.width` "auto" or 20–100 in steps of 10;
  - `style.minHeight` 0 or 20–100 in steps of 10 (unit: % of screen height, `svh`).
- **A framed photo** always uses `object-fit: cover`, never stretching.
- **Handles:**
  - `registerOverlayPortal(el, { disableDrag: true })`, with capture-phase listeners registered before it;
  - the value is written on release through `updateBlock` (one history step);
  - each handle is a focusable `button` with an `aria-label`, and the arrow keys change its value by one step.
- **Public code:** `blocks/puck.config.ts` stays server-safe (`server-graph.test.ts`), and the public page JS must not grow.
- **Personal templates:**
  - at most 20 per tenant;
  - name 1–60 characters after trim;
  - content checked by `validatePageContent` when saved and when used;
  - every action: `assertDashboardHost` + `auth()` + ownership check + `typeof id === "string"`.
- **Migration** by `prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --script`, then `migrate deploy` (memory: non-interactive).
- **French copy.** Confirmation before applying a template: « Votre page actuelle sera remplacée. Vous pourrez revenir en arrière avec Ctrl+Z. »

## Review Focus

1. **An old page with none of the new settings:** renders the same, publicly and in the editor; the first drag writes a valid value.
2. **A drag released outside the preview, or cancelled (pointercancel / Échap):** nothing is written, and the bubble disappears.
3. **A personal template from another tenant** passed as `perso:<id>` to "Créer un site", or deleted by its id: refused.
4. **Applying a template to a page with a chosen product and an Arabic language:** both are kept, and Ctrl+Z restores the previous page.
5. **Phone (390 px):** a section at 100 % height and a button at 100 % width do not overflow horizontally.

---

### Task 1: New size settings and their rendering

**Files:**
- Modify: `blocks/style.ts`
- Modify: `blocks/hero/*`, `blocks/image/*`, `blocks/product/*`
- Modify: `blocks/Section.tsx`, `blocks/image-box.tsx`
- Test: `blocks/style.test.tsx`, `blocks/blocks.test.tsx`

**Interfaces — Produces:**
- `imageHeightSchema = z.number().int().min(30).max(200).multipleOf(5).nullable().default(null)` on Hero, Image and Product.
- `imageWidthSchema` becomes `multipleOf(5)` (already 10s; still valid).
- `buttonStyleSchema.width: z.union([z.literal("auto"), z.number().int().min(20).max(100).multipleOf(10)]).default("auto")`.
- `sectionStyleSchema.minHeight: z.number().int().min(0).max(100).multipleOf(10).refine(v => v === 0 || v >= 20).default(0)`.
- `buttonProps` adds `style.width = "<n>%"` and the class `justify-center` when `width !== "auto"`.
- `ImageBox({ width, height, children })` — with a `height`, a wrapper with `aspect-ratio: 100 / height` and the image `h-full w-full object-cover`.
- `Section`: if `minHeight > 0`, `min-height: <n>svh` plus a centred vertical flex.

**Steps:**
- [ ] Tests:
  - the schemas accept the bounds and refuse 25 / 205 / 15 / 10;
  - the defaults equal the old rendering (`renderToStaticMarkup` of Hero/Image unchanged without the new settings);
  - Image with `imageHeight: 50` → `aspect-ratio:100 / 50` and `object-cover`;
  - `buttonProps` with `width: 60` → `width:60%`;
  - Section `minHeight: 80` → `min-height:80svh`.
- [ ] RED → implement → GREEN; `npx vitest run blocks`.
- [ ] Commit `feat(blocks): tailles proportionnelles (cadre d'image, largeur de bouton, hauteur de section)`.

### Task 2: Pure size calculations

**Files:** Create `blocks/editor/resize.ts`; Test `blocks/editor/resize.test.ts`

**Interfaces — Produces:**
- `type Handle = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw"`
- `resizeImage(start: { width: number; height: number | null; naturalRatio: number }, handle: Handle, dx: number, dy: number, box: { parentWidth: number; frameWidth: number }) → { width: number; height: number | null }`
  - **e/w:** width = (frameWidth ± 2·dx) / parentWidth, snapped to 5, between 30 and 100; height unchanged.
  - **n/s:** height = (frameHeight ± dy) / frameWidth, snapped to 5, between 30 and 200. The frame height starts from `height ?? naturalRatio·100`.
  - **Corners:** width as for e/w; height unchanged (proportions kept).
- `resizeButton(start: { width: "auto" | number; size: "s"|"m"|"l" }, handle, dx, dy, box: { contentWidth: number; buttonWidth: number; buttonHeight: number }) → { width; size }`
  - **e/w:** width % snapped to 10 (20–100). Below 20 %, back to "auto".
  - **n/s:** each 16 px of drag moves one size step.
- `resizeSection(start: { minHeight: number; width: "narrow"|"normal"|"wide" }, handle, dx, dy, box: { viewportHeight: number; sectionHeight: number }) → { minHeight; width }`
  - **s:** (sectionHeight + dy) / viewportHeight, snapped to 10 (0 below 20).
  - **e/w:** each 80 px moves one width step.
- `stepValue(kind, value, +1 | -1)` for the arrow keys.

**Steps:**
- [ ] Tests on each branch (exact values, bounds, snapping, back to "auto" / 0) → RED → implement → GREEN.
- [ ] Commit `feat(editor): calcul des tailles au glissé`.

### Task 3: Handles component, applied to images

**Files:**
- Create `blocks/editor/ResizeHandles.tsx`
- Modify `blocks/editor/ResizableImageBox.tsx` (replaces the single handle)
- Modify `blocks/editor/ImageToolbar.tsx` ("Retour aux proportions")
- Modify `editor-config.ts`

**Interfaces — Produces:** `ResizeHandles({ handles: Handle[], label: string, onDrag(handle, dx, dy): string /* bubble text */, onCommit(handle, dx, dy): void, onKey(handle, delta: 1 | -1): void })`
- absolutely positioned squares and bars;
- each handle is a `button` with `aria-label`;
- pointer capture; `pointercancel` / Échap → cancel;
- bubble shown during the drag.

**Steps:**
- [ ] Browser check `pw/resize-image.mjs`, Image block:
  - right edge −100 px → width shrinks by one step or more;
  - bottom edge +80 px → frame taller, photo cropped (`object-fit` = cover);
  - corner → width changes, `imageHeight` unchanged;
  - Ctrl+Z ×2 back to the start;
  - Échap during a drag → nothing written.
- [ ] Unit tests stay green.
- [ ] Commit `feat(editor): poignées de l'image (bords et coins)`.

### Task 4: Button and section handles

**Files:**
- Modify `blocks/editor/EditableButton.tsx` (handles around the button)
- Create `app/(vendor)/(editor)/edit/[pageId]/shell/SectionOverlay.tsx` (`componentOverlay` override: bottom and side handles when `isSelected`)
- Modify `Editor.tsx`

**Steps:**
- [ ] Browser check `pw/resize-blocks.mjs`:
  - banner button: right edge → width in %, bottom edge → size L;
  - section: bottom edge +300 px → `min-height` in svh;
  - side edge → narrow/wide;
  - at 390 px, no horizontal scroll;
  - Ctrl+Z.
- [ ] Commit `feat(editor): poignées du bouton et de la section`.

### Task 5: Personal templates — data and server

**Files:**
- Modify `prisma/schema.prisma` (`CustomTemplate { id, tenantId → Tenant onDelete Cascade, name, category (≤ 40, default "Autre"), data Json, createdAt }`, index on tenantId)
- Create the migration `prisma/migrations/<date>_custom_templates/migration.sql`
- Create `lib/custom-templates.ts`
- Test `lib/custom-templates.int.test.ts`

**Interfaces — Produces:**
- `listCustomTemplates(userId) → { id, name, createdAt, cover: { image: string | null; color: string | null; title: string } }[]`
- `saveCustomTemplate(userId, name: unknown, category: unknown, data: unknown) → { ok: true; id } | { ok: false; error }`
  - errors: « Donnez un nom au modèle », « 60 caractères maximum », « 20 modèles au plus : supprimez-en un », « Contenu de page invalide »;
  - creates the tenant if absent? No — refused if the user has no site: « Créez d'abord un site ».
- `deleteCustomTemplate(userId, id: unknown) → boolean`
- `customTemplateForUser(userId, id) → data | null` (validated by `validatePageContent`).

**Steps:**
- [ ] Integration tests:
  - save, then list;
  - name empty / too long;
  - the 21st refused;
  - invalid content;
  - another tenant's template neither visible, nor deletable, nor readable.
- [ ] RED → migration + implementation → GREEN (`npm run test:int`).
- [ ] Commit `feat(templates): modèles personnels du vendeur`.

### Task 6: "Modèles" window in the editor, and creation from a personal template

**Files:**
- Create `shell/TemplatesDialog.tsx`, `shell/apply-template.ts` (+ test)
- Modify `TopBar.tsx`, `Editor.tsx`, `edit/[pageId]/actions.ts`, `edit/[pageId]/page.tsx`
- Modify `lib/site-create.ts` (`perso:<id>`), `sites/new/page.tsx`, `NewSiteForm.tsx`
- Test: `shell/apply-template.test.ts`, `lib/site-create.int.test.ts`

**Interfaces — Produces:**
- `applyTemplate(current: Data, template: Data) → Data`:
  - `root.props` = template's, with `productId`, `lang` and `title` from the current page;
  - Footer `shopName` taken from the current page's footer when it exists;
  - new block ids (`<type>-<uuid>`) to avoid any collision.
- Server actions:
  - `saveAsTemplate(pageId, name, data)`;
  - `deleteTemplate(id)`;
  - `listTemplates()`.
- Dialog: two groups of cards; click → confirmation (spec copy) → `dispatch({ type: "setData", data })`; "Enregistrer comme modèle" (name field + button); "Supprimer" on a personal template (confirmation).

**Steps:**
- [ ] Unit tests on `applyTemplate`:
  - product, language and title kept;
  - footer shop name kept;
  - ids replaced, all unique;
  - the result passes `validatePageContent`.
- [ ] Integration test: `createSiteForUser` with `perso:<id>` of your own → ok; another tenant's → « Choisissez un modèle ».
- [ ] Browser check:
  - apply "Heure d'or" on the test page → sections replaced, product kept, Ctrl+Z restores;
  - save as template → visible in "Mes modèles" and in "Créer un site";
  - delete it.
- [ ] Commit `feat(editor): changer de modèle et enregistrer le sien`.

### Task 7: Walkthrough and suites

- [ ] Full Edge walkthrough (handles, templates) and the walkthroughs from the previous plan (`bar`, `button`, `text`, `image`).
- [ ] Full suites: `npm test`, `npm run test:int`, `tsc`, `lint`, `build`.
- [ ] Public JS measurement (3 chunks, about 50 KB).
