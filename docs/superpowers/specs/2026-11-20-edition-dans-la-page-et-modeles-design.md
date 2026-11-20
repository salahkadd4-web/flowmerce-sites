# Editing in the page (Word / PowerPoint style) and 5 professional templates — design

Date: 2026-11-20 · Branch: `feat/editeur-pro` (continued) · Previous spec: `2026-11-19-editeur-pro-design.md`

## Intent

The seller (an Algerian cash-on-delivery merchant, not a technician) found the editor at
`/edit/<pageId>` too complicated. Today's right-hand panel is overloaded: a 1,436 px scroll for 826 px
visible, mixing content and appearance, with the texts duplicated.

The seller wants **to adjust each element of the page in the page itself, as in Word and
PowerPoint**. You click an element and its toolbar appears right next to it. The seller also wants
**5 ready-made templates, professional and elegant, one per category**, with attractive photos of
real products.

Success: a seller who has never seen the editor
1. picks a template,
2. replaces the photos and texts,
3. changes a colour,
4. adds or moves a section,
5. publishes,

all without looking for a hidden setting.

## Goals

**Part A — editor**
1. **No right-hand panel.** Everything is set on the page, or in a small window opened from the page.
2. **Toolbar right next to the element**:
   - texts: **B I U S**, Taille, Couleur, Alignement;
   - images: Remplacer, Description, Coins, plus the resize handle that already exists;
   - buttons: Couleur, Texte (text colour), Taille, Mène vers;
   - sections: Fond, Espacement, ↑ ↓, Dupliquer, Supprimer, plus that section type's own settings.
3. **Left column = the page's sections**, in order, as in Google Slides. Click to select, ↑ ↓ to
   move, and **+ Ajouter une section** opens a list where each type is described.
4. **Clear top bar.** Every button has a written label:
   ← Mes sites · site name · Téléphone/Ordinateur · ↶ ↷ · save status · Réglages de la page · Aperçu ·
   Publier.
5. **Keyboard and accessibility.** Every toolbar is reachable with Tab. Échap closes a window and
   gives focus back to whatever opened it. Each button has a name (aria-label + title).

**Part B — templates**
6. **5 templates**, each with its own palette, fonts and copy. All are in French and complete:
   banner with a background photo, product sheet, benefits, lifestyle photo, reassurance (delivery /
   payment on delivery), order form, footer.
   - Vêtements (fashion)
   - Chaussures
   - Cosmétique (beauty and skincare)
   - Montres & accessoires
   - Maison & cuisine
7. **Template picker in "Créer un site"**: a card with a preview image, name and description for
   each template. The current simple template is kept.

## Non-goals

- Editing on a phone. The editor targets a computer screen of at least 1,024 px; the preview still
  shows the phone version.
- New block types. The six existing blocks are kept, and so are their data.
- Arabic versions of the templates. The seller switches the language in "Réglages de la page".
- Automatic creation of a demo product. The product sheet shows "Choisir le produit" until the seller
  creates one.

## Anti-goals (would be a failure even if it works)

- **Breaking a page that already exists.** The data schemas stay the same; only the editor's look
  changes.
- **Sending editor code to buyers.** The guard `blocks/server-graph.test.ts` must stay green, and
  the public JS must not grow.
- **Photos showing a brand's logo or trademark.** The seller would take on legal risk by selling
  under someone else's brand.
- **Losing focus while typing in the page.** This trap is known: overrides must be stable components.

## Constraints

- **Puck 0.24.** We compose its pieces (`Puck.Preview`, `Puck.Fields`, `usePuck` / `useGetPuck`,
  `dispatch`). The section bar comes from the `actionBar` override; the text toolbar from the richtext
  fields' `renderInlineMenu`.
- **Traps already met** (memory `editeur-pro-puck-pieges`):
  - `pointer-events: none` inside blocks: use `registerOverlayPortal`, with capture-phase listeners
    registered before it;
  - stable overrides only;
  - Select values are JSON-encoded.
- **Unchanged rules:**
  - `blocks/puck.config.ts` stays shared and server-safe; editor pieces are injected by
    `editor-config.ts`;
  - links checked by `isSafeHref`;
  - richtext sanitized.
- **Template photos:**
  - free for commercial use without attribution (Unsplash License or equivalent);
  - downloaded, resized (≤ 1,920 px, WebP) and served by the app from `public/templates/<slug>/`;
  - credits listed in `public/templates/CREDITS.md`.

## Approaches considered

1. **Tidy up the existing panel** (tabs Contenu / Apparence). Cheap, but Puck's frame and the panel
   stay; the seller still goes back and forth between the page and the side.
2. **Google Slides–style frame with tabs in the right panel.** Proposed, then replaced by the user.
3. **Editing in the page (chosen by the user).** The panel disappears. Toolbars sit next to the
   element, the section bar sits on the section, and the rest goes in small windows. It costs the
   most, but it matches the Word / PowerPoint habit and removes the duplication at its source.

## The design

### Screen frame (Puck composition mode)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ ← Mes sites  Ma boutique   [Téléphone|Ordinateur]  ↶ ↷  ✓ Enregistré   ⚙ Réglages de la page  Aperçu  [Publier] │
├───────────────────┬──────────────────────────────────────────────────────────┤
│ SECTIONS          │                                                          │
│ 1 Bannière      ● │             page (Puck.Preview)                          │
│ 2 Fiche produit   │    click = select · type in the page                     │
│ …                 │    toolbars next to the element                          │
│ [+ Ajouter une    │                                                          │
│    section]       │                                                          │
└───────────────────┴──────────────────────────────────────────────────────────┘
```

**Left column.** One row per section: number, icon, name (`BLOCK_LABELS`).
- **Click** selects the section and scrolls the preview to it.
- **↑ / ↓** move it (Puck `move` action).
- **+ Ajouter une section** opens a window with the 6 types (icon, name, description). One click
  inserts the section after the selected one, or at the end, and selects it.

**Top bar:**
- **Viewport:** two labelled buttons, Téléphone (360) and Ordinateur (1,280).
- **↶ / ↷:** Puck history, labelled "Annuler (Ctrl+Z)" and "Rétablir (Ctrl+Y)".
- **Saving is automatic.** The draft is saved 2 s after the last change. The status shows
  "Enregistrement…", then "Enregistré", or "Non enregistré — Réessayer" on failure. The "Enregistrer"
  button disappears. Ctrl+S saves straight away.
- **Réglages de la page** opens a window with the tab title, language, fonts and the page's product
  (Puck's root fields).
- **Aperçu** and **Publier**: unchanged.

### Section bar (actionBar override)

Shown on the selected section:

`Name │ [section-type actions] │ Fond ▾ │ Espacement ▾ │ ↑ │ ↓ │ Dupliquer │ Supprimer`

| Section | Its own actions (small windows) |
|---|---|
| Bannière | Image ▾ (choose, description: used while the banner has no image) |
| Fiche produit | Produit ▾ (product choice = page product) · Photos ▾ (thumbnail size) |
| Texte | — |
| Image | — (everything is on the image) |
| Commande | Texte ▾ (title size and colour) |
| Pied de page | Contacts ▾ (phone, email) · Réseaux ▾ (Facebook, Instagram, TikTok) · Texte ▾ |

- **Fond ▾:** Couleur / Image (choice + darkness) / Par défaut.
- **Espacement ▾:** spacing (Compact / Normal / Aéré) and width (Étroite / Normale / Large).
- Every window closes with Échap or a click outside, and gives focus back to the button that opened
  it.

### Text toolbar (richtext `renderInlineMenu`)

`B I U S │ Taille ▾ │ Couleur ▾ │ Alignement ▾` (alignment only for Bannière and Texte)

- **Taille** and **Couleur** change the field's style:
  - title → `typography.titleSize` / `titleColor`;
  - text → `textSize` / `textColor`.
- **Couleur:** "Automatique" + the palette + any colour.
- **Field ↔ setting map** (built by `editor-config.ts`):

| Field | Size | Colour |
|---|---|---|
| Hero.title | titleSize | titleColor |
| Hero.subtitle | textSize | textColor |
| Text.title | titleSize | titleColor |
| Text.body | textSize | textColor |
| Footer.returnPolicy | textSize | textColor |

### Button toolbar (editor wrapper injected like `renderImageBox`)

Shown above the button when its section is selected:

`Couleur ▾ │ Texte ▾ │ Taille ▾ │ Mène vers ▾` ("Mène vers" for the Bannière only)

- **What it changes:** `button.color` / `button.textColor` / `button.size`; for the banner, also
  `buttonHref`.
- **"Mène vers" offers:**
  - Formulaire de commande (`#commande`);
  - Fiche produit (anchor of the product block);
  - Autre lien (address field, checked by `isSafeHref`).
- **The button's label** is still typed on the button itself.
- **Blocks concerned:** Bannière, Fiche produit and Commande. The Commande block receives the wrapper
  as a prop (`renderButton`); the public site never receives one.

### Image toolbar (ResizableImageBox)

Shown at the top of the image when its section is selected:

`Remplacer l'image │ Description │ Coins ▾ (Image block only)`

The width handle is unchanged.

**Empty states in the editor:**
- **Image** block with no image: a "Choisir une image" box.
- **Fiche produit** with no product: a "Choisir le produit" button (opens the product list).
- **Empty page:** "Votre page est vide" + an "Ajouter une section" button.

### Templates

- **Registry:** `templates/index.ts` holds `TEMPLATES`. Each entry has id, name, category,
  description, preview image and Puck data. Each template is checked by `parsePageContent` in tests.
- **Site creation:** `createSiteForUser` receives `templateId`, validated against the registry; an
  unknown id is refused.
- **Template images:** `mediaSchema` also accepts `/templates/<slug>/<name>.(webp|jpg)`. The files
  are static, public and unchanged by the seller.
- **Fonts:** three Latin fonts are added for elegance:
  - Playfair Display and Cormorant Garamond (serif, titles);
  - Montserrat (text).

  They are loaded by `next/font` with `preload: false`, like the others.
- **Preview image:** each template's card in the picker shows a capture of the rendered template,
  stored in `public/templates/<slug>/apercu.webp`.

## Left to the builder

- Exact sizes and spacing of the toolbars. They follow the dashboard's tokens (`components/dashboard/ui`).
- Exact copy of the templates: elegant, short and credible for the Algerian market, in French.
- Exact choice of photos, within the rules above.
