# Phase 1A — Éditeur visuel et publication : plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** un vendeur crée un site, compose sa landing page dans l'éditeur Puck, la publie, et `http://<sous-domaine>.localhost:3100` l'affiche immédiatement.

**Architecture:** une seule configuration Puck (`blocks/puck.config.ts`) sert à l'éditeur (`<Puck>`, client, hôte vendeur) et au rendu public (`Render` de `@puckeditor/core/rsc`, composant serveur). Chaque bloc a un schéma zod unique, utilisé strictement à l'enregistrement et bloc par bloc à l'affichage. Images stockées localement derrière `lib/storage.ts`, servies en chemin relatif `/media/…` sur tous les hôtes.

**Tech Stack:** acquis de la Phase 0 (Next 16, Prisma 7, NextAuth 5.0.0-beta.32, Tailwind 4, zod 3, vitest) + `@puckeditor/core` **0.24.0** (exact) + `image-size` **^2.1.0**.

**Spec:** `docs/superpowers/specs/2026-11-18-phase1a-editeur-publication-design.md` (conception validée) ; `flowmerce-sites.md` v0.2 §2.2, §2.3, §4.2, §5, §7.

## Global Constraints

- Aucune modification de `../flowmerce-web-app`, aucun appel à Flowmerce.
- Tests : globales vitest, **jamais** `import … from "vitest"` ; unitaires `*.test.ts(x)` (`npm test`), intégration `*.int.test.ts` (`npm run test:int`, base `flowmerce_sites_test`).
- Port 3100, hôtes `*.localhost`. Lire `node_modules/next/dist/docs/` avant toute API Next (`AGENTS.md`).
- Toute server action de l'espace vendeur : `isDashboardHost((await headers()).get("host"), env.DASHBOARD_HOST)` sinon `throw`, puis `auth()` sinon `throw`, puis contrôle de propriété par `site.tenant.ownerUserId === session.user.id`.
- Liens dans les blocs : seulement `#ancre`, `https://`, `http://`, `tel:`, `mailto:`.
- Aucun HTML dans le contenu ; jamais `dangerouslySetInnerHTML`.
- Images : JPEG, PNG, WebP, AVIF, ≤ 5 Mo (5 242 880 octets), type établi par le contenu ; SVG refusé.
- Clé de média : `^[a-f0-9]{32}\.(jpg|png|webp|avif)$` ; URL publique `/media/<clé>`.
- Sous-domaine : `^[a-z0-9](?:[a-z0-9-]{1,61}[a-z0-9])$`, hors `RESERVED_SUBDOMAINS`.
- UI vendeur : pièces de `components/dashboard/ui.tsx`, `components/auth/AuthShell.tsx`, jetons `@theme` ; textes en français.
- Commentaires de code en français.

## Review Focus

1. **Un lien piégé dans un bloc** — `javascript:alert(1)`, ` JavaScript:…` (espace, casse), `data:text/html,…` dans le bouton du Hero ou un réseau social du pied de page : refusé à l'enregistrement, et jamais rendu en `href` si la base en contient déjà. Tests : Task 4 et Task 5.
2. **Un fichier déguisé** — un SVG ou un texte renommé en `.png`, un PNG annoncé `image/jpeg`, un fichier de 5 Mo + 1 octet : seul le contenu décide, la taille est bornée. Test : Task 6.
3. **La page d'un autre vendeur** — ouvrir l'éditeur, l'aperçu, enregistrer ou publier avec le `pageId` d'un autre vendeur : refusé comme une page inexistante (aucune fuite d'existence). Tests : Task 8.
4. **Publier un site suspendu** — la publication est refusée et le statut reste `SUSPENDED`. Test : Task 8.
5. **Un ancien contenu en base** — une page publiée avec les blocs `Heading` de la Phase 0, ou un bloc dont une prop est devenue invalide : la page s'affiche sans ce bloc. Tests : Task 4 (filtrage) et Task 5 (seed migré).

## Structure des fichiers

```
app/
  (vendor)/layout.tsx                 # ex-app/layout.tsx (police Jakarta, lang fr)
  (vendor)/(auth)/login/…             # déplacé
  (vendor)/(dashboard)/…              # déplacé ; + sites/new/
  (vendor)/(editor)/edit/[pageId]/page.tsx, Editor.tsx, actions.ts
  (vendor)/preview/[pageId]/page.tsx
  api/media/route.ts                  # POST, hôte vendeur
  media/[key]/route.ts                # GET, tous les hôtes
  s/[host]/layout.tsx                 # layout racine des sites (lang/dir, polices système)
  s/[host]/[[...slug]]/page.tsx       # Render RSC
  s/[host]/[[...slug]]/not-found.tsx
blocks/
  shared.ts                           # isSafeHref, champs zod communs
  hero/ text/ image/ footer/          # schema.ts, <Bloc>.tsx, config.ts
  fields/MediaField.tsx               # "use client"
  schemas.ts                          # BLOCK_SCHEMAS
  puck.config.ts                      # Config Puck assemblée
  dictionary.fr.ts                    # traduction de l'interface Puck
lib/
  page-content.ts                     # parsePageContent (filtrage par bloc) + validatePageContent (strict)
  page-title.ts
  pages.ts                            # findOwnedPage, saveDraftForUser, publishPageForUser
  site-create.ts                      # createSiteForUser
  subdomain.ts                        # slugifySubdomain, validateSubdomain
  storage.ts, media.ts                # stockage local, inspectImage, storeMedia
templates/landing-fr.json
```

Avant la Task 7 (première tâche d'interface) : lancer `ui-consistency:finding-patterns` avec `app/(vendor)/(dashboard)/page.tsx` et `app/(vendor)/(auth)/login/page.tsx` comme références, et garder la checklist dans l'espace de travail du plan.

---

### Task 1: Proxy — liste blanche et `/media`

**Files:**
- Modify: `lib/routing.ts`, `proxy.ts`, `lib/host.ts:12` (docstring)
- Test: `lib/routing.test.ts`, `lib/host.test.ts`

**Interfaces:**
- Produces: `routeRequest(input, cfg: { dashboardHost: string; siteApiAllowlist: readonly string[] })` ; `SITE_API_ALLOWLIST: readonly string[] = []` exporté par `lib/routing.ts` (1B y ajoutera `"/api/orders"`).

Règles sur un hôte de site, dans cet ordre (après `isServerAction`) : `/media` ou `/media/…` en GET/HEAD → `pass` ; `/api` ou `/api/…` → `pass` seulement si le chemin est sous un préfixe de `siteApiAllowlist`, sinon `not-found` (couvre `/api/auth`, `/api/media`) ; méthode d'écriture → `not-found` ; sinon `site`. Un POST vers une API autorisée reste `pass`.

- [ ] **Step 1: Tests (échouent)** — dans `lib/routing.test.ts`, `cfg = { dashboardHost: "localhost:3000", siteApiAllowlist: ["/api/orders"] }` :
  - `GET test.localhost:3000/media/abc.png` → `pass` ; `POST …/media/abc.png` → `not-found` ;
  - `GET …/api/media` → `not-found` ; `GET …/api/autre` → `not-found` ;
  - `POST …/api/orders` → `pass` (test existant conservé) ; `GET …/api/orders/123` → `pass` ;
  - `GET …/mediatheque` → `site` (préfixe par segment).
  - Dans `lib/host.test.ts` : `normalizeHost("test.localhost.:3000")` → `"test.localhost"`.
  Run: `npm test` — Expected: les nouveaux cas `/media` et `/api/autre` échouent.
- [ ] **Step 2: Implémenter** ; `proxy.ts` passe `siteApiAllowlist: SITE_API_ALLOWLIST`. Corriger la docstring de `normalizeHost` (exemple `"TEST.Localhost.:3000"`). Run: `npm test` — Expected: PASS.
- [ ] **Step 3: Commit** — `feat(proxy): liste blanche des API et /media sur les hôtes de site`

---

### Task 2: Modèle de données — Media, PageVersion, un tenant par utilisateur

**Files:**
- Modify: `prisma/schema.prisma`, `lib/test/db.ts`
- Create: migration `…_phase1a`
- Test: `prisma/schema.int.test.ts`

**Interfaces:**
- Produces: `Media { id, tenantId, key @unique, url, mimeType, width, height, sizeBytes, createdAt }` (relation `Tenant.media`, `onDelete: Cascade`, `@@index([tenantId])`) ; `PageVersion` exactement comme §5 (relation `Page.versions`) ; `Tenant.ownerUserId String @unique` (l'`@@index` disparaît). `resetDb()` vide aussi `PageVersion` et `Media` (avant `Page` / `Tenant`).

- [ ] **Step 1: Tests (échouent)** : `refuse deux tenants pour le même utilisateur` (`P2002`) ; `supprime versions et médias avec le tenant` (tenant → site → page → version + media ; `tenant.delete` ; `pageVersion.count()` et `media.count()` valent 0). Run: `npm run test:int` — Expected: FAIL (modèles absents).
- [ ] **Step 2: Schéma + migration** : `npx prisma migrate dev --name phase1a` ; mettre à jour `resetDb`. Run: `npm run test:int` — Expected: PASS ; `npm run db:seed` — Expected: succès.
- [ ] **Step 3: Commit** — `feat(db): Media, PageVersion et un tenant par utilisateur`

---

### Task 3: Layouts séparés, 404 des sites, titre

**Files:**
- Move: `app/layout.tsx` → `app/(vendor)/layout.tsx` ; `app/(dashboard)/` → `app/(vendor)/(dashboard)/` ; `app/(auth)/` → `app/(vendor)/(auth)/` (avec `git mv`)
- Create: `app/s/[host]/layout.tsx`, `app/s/[host]/[[...slug]]/not-found.tsx`, `lib/page-title.ts`
- Modify: `app/s/[host]/[[...slug]]/page.tsx`
- Test: `lib/page-title.test.ts`

**Interfaces:**
- Produces: `pageTitle(rootTitle: unknown, title: string, siteName: string): string` — première chaîne non vide (après `trim`) parmi les trois.

- [ ] **Step 1: Tests de `pageTitle` (échouent)** : `("Promo", "Accueil", "Boutique")` → `"Promo"` ; `("", "Accueil", "Boutique")` → `"Accueil"` ; `("  ", "", "Boutique")` → `"Boutique"` ; `(42, "Accueil", "B")` → `"Accueil"`. Run: `npm test` — Expected: FAIL.
- [ ] **Step 2: Implémenter `pageTitle`** et l'utiliser dans `generateMetadata`. Run: `npm test` — Expected: PASS.
- [ ] **Step 3: Layouts.** Lire `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/layout.md` (layouts racines multiples). `app/s/[host]/layout.tsx` est un layout racine : `<html lang dir>` depuis `getSiteByHost(host)` (site absent → `lang="fr"`, `dir="ltr"`), `<body>` avec la pile de polices système (`font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`), importe `app/globals.css`. Si la doc interdit un layout racine sous un segment dynamique : `app/s/layout.tsx` racine avec `lang="fr"` fixe et `lang`/`dir` sur `<main>` — ledger. Supprimer `decodeURIComponent` (Next décode déjà `params`). `not-found.tsx` : « Page introuvable » + « Cette page n'existe pas ou n'est plus en ligne. », sans marque Flowmerce.
- [ ] **Step 4: Vérifier** — `npm run typecheck`, `npm run build` (aucune erreur) ; `npm run dev` puis : `curl -s http://test.localhost:3100/` contient `<html lang="fr" dir="ltr"` et pas `--font-jakarta` ; `curl -s http://test.localhost:3100/absente` → 404 et contient « Page introuvable » ; `curl -s -o /dev/null -w "%{http_code}" -H "Host: te%st.localhost:3100" http://localhost:3100/` → 404 sans `URIError` dans le journal ; `http://localhost:3100/login` s'affiche toujours avec la police Jakarta.
- [ ] **Step 5: Commit** — `refactor(app): layout racine propre aux sites, 404 neutre et titre de page`

---

### Task 4: Schémas des blocs et validation du contenu

**Files:**
- Create: `blocks/shared.ts`, `blocks/hero/schema.ts`, `blocks/text/schema.ts`, `blocks/image/schema.ts`, `blocks/footer/schema.ts`, `blocks/schemas.ts`
- Modify: `lib/page-content.ts`
- Test: `blocks/shared.test.ts`, `blocks/schemas.test.ts`, `lib/page-content.test.ts`

**Interfaces:**
- Produces:
  - `isSafeHref(href: string): boolean` — après `trim()`, accepte `#…` (1 à 100 car. `[A-Za-z0-9_-]`), `https://…`, `http://…` (URL valide par `new URL`), `tel:` suivi de `[+0-9 ]{3,20}`, `mailto:` suivi d'un email ; tout le reste `false`.
  - `hrefSchema` (zod, ≤ 500, `isSafeHref`), `mediaSchema = z.object({ url: z.string().regex(/^\/media\/[a-f0-9]{32}\.(jpg|png|webp|avif)$/), width: z.number().int().positive(), height: z.number().int().positive() })`.
  - Types de blocs `BlockType = "Hero" | "Text" | "Image" | "Footer"` et `BLOCK_SCHEMAS: Record<BlockType, z.ZodTypeAny>` ; chaque schéma inclut `id: z.string()` et les props de la conception (longueurs maximales de la conception) :
    - Hero `{ title, subtitle, image: mediaSchema.nullable(), buttonLabel, buttonHref: hrefSchema, align: "left"|"center", background: "light"|"dark"|"indigo"|"sand" }`
    - Text `{ title, body, align }` ; Image `{ image: mediaSchema.nullable(), alt (1–150), caption, width: "full"|"contained" }` ; Footer `{ shopName, phone, email, facebook, instagram, tiktok (hrefSchema ou ""), returnPolicy }`.
  - `validatePageContent(json: unknown): { ok: true; content: PageContent } | { ok: false; error: string }` — strict : forme de page + chaque bloc d'un type connu et valide ; `error` en français nomme le bloc fautif (« Bloc Hero : lien du bouton invalide »).
  - `parsePageContent(json: unknown): PageContent | null` — `null` seulement si la forme de page est invalide ; les blocs invalides ou de type inconnu sont retirés (`console.warn` avec le type) ; `zones` absent ou `{}` accepté.

- [ ] **Step 1: Tests (échouent)** :
  - `isSafeHref` : vrai pour `#commande`, `https://wa.me/213555000000`, `tel:+213 555 00 00 00`, `mailto:a@b.dz` ; faux pour `javascript:alert(1)`, `  JavaScript:alert(1)`, `data:text/html,x`, `vbscript:x`, `//evil.com`, `#`, `https://`.
  - `BLOCK_SCHEMAS.Hero` refuse `buttonHref: "javascript:x"` et un titre de 121 caractères ; accepte les `defaultProps` de la Task 5 (importés en Task 5 ; ici, un objet Hero complet écrit dans le test).
  - `validatePageContent` : un bloc `Heading` → `ok: false` avec « Heading » dans `error` ; une page valide → `ok: true`.
  - `parsePageContent` : page avec un Hero valide + un `Heading` + un Hero au lien `javascript:` → contenu avec le seul Hero valide ; `{ content: "x" }` → `null` ; `{ content: [], zones: {} }` → contenu vide.
  - Supprimer les tests de `parsePageContent` de la Phase 0 qui supposent les blocs `Heading`/`Text` anciens.
  Run: `npm test` — Expected: FAIL.
- [ ] **Step 2: Implémenter.** Run: `npm test` — Expected: PASS.
- [ ] **Step 3: Commit** — `feat(blocks): schémas des blocs, liens sûrs et validation du contenu`

---

### Task 5: Composants des blocs, configuration Puck, rendu public

**Files:**
- Create: `blocks/hero/Hero.tsx`, `blocks/hero/config.ts` (idem `text`, `image`, `footer`), `blocks/puck.config.ts`, `templates/landing-fr.json`
- Modify: `app/s/[host]/[[...slug]]/page.tsx`, `prisma/seed.ts`, `package.json` (`@puckeditor/core` 0.24.0 exact)
- Delete: `components/site/RenderPage.tsx`, `components/site/RenderPage.test.tsx`
- Test: `blocks/blocks.test.tsx`, `templates/landing-fr.test.ts`

**Interfaces:**
- Consumes: `BLOCK_SCHEMAS`, `isSafeHref`, `parsePageContent` (Task 4).
- Produces: `puckConfig: Config` (`blocks/puck.config.ts`) avec `components: { Hero, Text, Image, Footer }` (libellés « Bannière », « Texte », « Image », « Pied de page ») et `root.fields.title` (« Titre de la page »). `fields.image` des blocs Hero/Image : `{ type: "custom", render: MediaField }` — `MediaField` est créé en Task 9 ; ici, un champ `text` provisoire en lecture seule, ledger. Chaque `config.ts` exporte `defaultProps` valides pour son schéma.

Règles de rendu : composants sans hook ni API navigateur ; images avec `next/image` (`sizes="(max-width: 768px) 100vw, 768px"`) ; tout `href` passe par `isSafeHref` au rendu (sinon le bouton ou le lien n'est pas rendu) ; `Text.body` découpé sur `/\n\s*\n/` en `<p>` ; Hero `id="…"` aucun, le bouton pointe vers `#commande` par défaut ; Footer : liens réseaux avec `rel="noopener noreferrer" target="_blank"`, `tel:` / `mailto:` construits depuis téléphone / email.

- [ ] **Step 1: Installer** `npm install @puckeditor/core@0.24.0 --save-exact`. Run: `npm ls @puckeditor/core` — Expected: `0.24.0`.
- [ ] **Step 2: Tests (échouent)** — `blocks/blocks.test.tsx` avec `renderToStaticMarkup` :
  - chaque bloc rendu avec ses `defaultProps` ne lève pas d'erreur et contient son texte par défaut ;
  - `defaultProps` de chaque bloc passent `BLOCK_SCHEMAS[type]` ;
  - Hero avec `buttonHref: "javascript:alert(1)"` → aucun `href="javascript` dans la sortie ;
  - Text avec `body: "<script>x</script>\n\nDeux"` → `&lt;script&gt;` et deux `<p>` ;
  - Footer avec `facebook: "javascript:x"` → pas de lien Facebook.
  - `templates/landing-fr.test.ts` : `validatePageContent(template).ok === true` ; types des blocs `["Hero", "Text", "Image", "Footer"]`.
  Run: `npm test` — Expected: FAIL.
- [ ] **Step 3: Implémenter** blocs, configs, `puckConfig`, modèle `landing-fr.json` (textes français de la conception, Image avec `image: null` et `alt` « Photo du produit »).
- [ ] **Step 4: Rendu public** — `page.tsx` rend `<Render config={puckConfig} data={content} />` importé de `@puckeditor/core/rsc`. Le seed écrit le contenu du modèle (titre Hero « Bienvenue sur la boutique test ») en `draft` et `published`, et un site supplémentaire n'est pas créé. Supprimer `RenderPage`.
  Run: `npm test`, `npm run typecheck`, `npm run db:seed` — Expected: PASS / aucune erreur / succès. `curl -s http://test.localhost:3100/` — Expected: contient « Bienvenue sur la boutique test » ; aucun script de la page ne contient le code de l'éditeur : pour chaque `<script src="…">` de la page, `curl -s http://test.localhost:3100<src> | grep -c "puckeditor"` → `0`.
- [ ] **Step 5: Commit** — `feat(blocks): blocs Hero, Texte, Image, Pied de page et rendu public Puck`

---

### Task 6: Images — stockage local, envoi, service

**Files:**
- Create: `lib/storage.ts`, `lib/media.ts`, `app/api/media/route.ts`, `app/media/[key]/route.ts`, `test/fixtures/` (petits fichiers générés en base64 dans les tests, pas de binaires versionnés)
- Modify: `next.config.ts` (`images.localPatterns: [{ pathname: "/media/**" }]`), `.gitignore` (`storage/`), `package.json` (`image-size`)
- Test: `lib/media.test.ts`, `lib/media.int.test.ts`

**Interfaces:**
- Produces:
  - `MAX_MEDIA_BYTES = 5_242_880` ; `inspectImage(bytes: Uint8Array): { ok: true; ext: "jpg"|"png"|"webp"|"avif"; mimeType: string; width: number; height: number } | { ok: false; error: string }` — via `image-size` ; type refusé (svg, gif, inconnu…) → « Format non pris en charge : JPEG, PNG, WebP ou AVIF » ; trop gros → « Image trop lourde (5 Mo maximum) ».
  - `isMediaKey(key: string): boolean` (regex des Global Constraints).
  - `storage: { put(key: string, bytes: Uint8Array): Promise<void>; get(key: string): Promise<Uint8Array | null> }` — pilote local dans `storage/uploads/` (chemin résolu depuis `process.cwd()`, refuse toute clé non conforme).
  - `storeMedia(tenantId: string, bytes: Uint8Array): Promise<{ ok: true; media: { id: string; url: string; width: number; height: number } } | { ok: false; error: string }>` — clé `randomBytes(16).toString("hex") + "." + ext`, écrit le fichier puis la ligne `Media`.
  - `POST /api/media` : `isDashboardHost` sinon 404 ; `auth()` sinon 401 ; tenant de l'utilisateur sinon 403 ; champ multipart `file` ; réponse `{ id, url, width, height }` ou `{ error }` 400.
  - `GET /media/[key]` : clé non conforme ou absente → 404 ; sinon octets, `Content-Type` depuis la ligne `Media`, `X-Content-Type-Options: nosniff`, `Cache-Control: public, max-age=31536000, immutable`.

- [ ] **Step 1: Tests unitaires (échouent)** — `lib/media.test.ts` : PNG 1×1 (base64 dans le test) → `ok`, `png`, 1×1 ; le même PNG passé tel quel quelle que soit l'extension voulue ; SVG `<svg xmlns=…>` → refus ; texte `"bonjour"` → refus ; tableau de `MAX_MEDIA_BYTES + 1` octets → « trop lourde » ; `isMediaKey("../../etc/passwd")` → faux, `isMediaKey("a".repeat(32) + ".png")` → vrai, `.svg` → faux. JPEG et WebP minimaux en base64 → `jpg` / `webp`.
  Run: `npm test` — Expected: FAIL.
- [ ] **Step 2: Implémenter** `lib/media.ts` (`inspectImage`, `isMediaKey`) puis `lib/storage.ts`. Run: `npm test` — Expected: PASS.
- [ ] **Step 3: Test d'intégration (échoue)** — `lib/media.int.test.ts` : `storeMedia(tenant.id, png)` crée une ligne `Media` avec `url` = `/media/<clé>` et `storage.get(clé)` renvoie les mêmes octets ; `storeMedia` avec un SVG ne crée ni fichier ni ligne. Nettoyer `storage/uploads` des clés créées en `afterAll`.
  Run: `npm run test:int` — Expected: FAIL → implémenter `storeMedia` → PASS.
- [ ] **Step 4: Routes** `app/api/media/route.ts` et `app/media/[key]/route.ts` (lire la doc des route handlers Next 16 ; `params` est une `Promise`).
- [ ] **Step 5: Vérifier** — serveur lancé, session vendeur obtenue comme en Phase 0 (`/api/auth/csrf` puis `/api/auth/callback/credentials`) :
  - `curl -b cookies -F file=@<png> http://localhost:3100/api/media` → 200 et `url` ;
  - même requête sans cookie → 401 ; avec `-H "Host: test.localhost:3100"` → 404 ;
  - `curl -I http://test.localhost:3100<url>` → 200, `content-type: image/png`, `x-content-type-options: nosniff` ;
  - `curl -s -o /dev/null -w "%{http_code}" "http://test.localhost:3100/_next/image?url=<url encodée>&w=640&q=75"` → 200 ;
  - `/media/../../package.json` et `/media/xyz.svg` → 404.
- [ ] **Step 6: Commit** — `feat(media): envoi et service des images, stockage local`

---

### Task 7: Création de site

**Files:**
- Create: `lib/subdomain.ts`, `lib/site-create.ts`, `app/(vendor)/(dashboard)/sites/new/page.tsx`, `app/(vendor)/(dashboard)/sites/new/actions.ts`, `app/(vendor)/(dashboard)/sites/new/NewSiteForm.tsx`
- Test: `lib/subdomain.test.ts`, `lib/site-create.int.test.ts`

**Interfaces:**
- Consumes: `RESERVED_SUBDOMAINS` (Phase 0), modèle `templates/landing-fr.json` (Task 5). Aucune invalidation de cache ici : un site créé est en brouillon, rien n'est public avant la première publication (Task 9).
- Produces:
  - `slugifySubdomain(name: string): string` ; `validateSubdomain(value: string): string | null` (message d'erreur ou `null`).
  - `createSiteForUser(user: { id: string; name: string | null; email: string }, input: { name: string; subdomain: string }): Promise<{ ok: true; siteId: string; pageId: string } | { ok: false; field: "name" | "subdomain"; error: string }>` — crée le tenant s'il n'existe pas (nom = `user.name ?? user.email`), le site (`LANDING`, `DRAFT`, `theme: {}`, `locale: "fr"`) et la page `slug ""`, `title` = nom du site, `draft` = modèle, `published` = null ; `P2002` sur le sous-domaine → `{ field: "subdomain", error: "Ce sous-domaine est déjà pris" }`.
  - Server action `createSite(formData)` → `isDashboardHost`, `auth()`, `createSiteForUser`, puis `redirect("/edit/" + pageId)`.

- [ ] **Step 1: Tests (échouent)** — `slugifySubdomain("Élégance Shop")` → `"elegance-shop"`, `("  Ma -- Boutique !! ")` → `"ma-boutique"` ; `validateSubdomain` : `"ab"`, `"-abc"`, `"abc-"`, `"ABC"`, `"a_b"`, `"app"`, 64 caractères → message ; `"ma-boutique"` → `null`. Intégration : premier site → un tenant créé ; second site → même tenant ; sous-domaine pris → erreur `subdomain` ; nom vide → erreur `name` ; la page créée a `published === null` et son `draft` passe `validatePageContent`.
  Run: `npm test`, `npm run test:int` — Expected: FAIL.
- [ ] **Step 2: Implémenter** `lib/subdomain.ts` et `lib/site-create.ts`. Run — Expected: PASS.
- [ ] **Step 3: `ui-consistency:finding-patterns`** (voir en tête du plan) ; recopier dans `components/dashboard/ui.tsx` `BTN_PRIMARY`, `BTN_GHOST`, `FIELD` et `Notice` depuis `../flowmerce-web-app/components/dashboard/ui.tsx` (lecture seule de la web-app) ; puis page `/sites/new` : `PageHeader` « Créer un site », formulaire (Nom, Sous-domaine pré-rempli à la saisie du nom tant que le vendeur ne l'a pas modifié, adresse complète affichée sous le champ via `siteUrl`, carte de modèle unique sélectionnée), erreurs sous le champ concerné, bouton principal « Créer le site » avec état d'envoi.
- [ ] **Step 4: Vérifier** — `npm run typecheck` ; navigateur : créer « Ma Boutique » → arrivée sur `/edit/<pageId>` (404 tant que la Task 9 n'existe pas : vérifier en base que site et page existent) ; recréer avec le même sous-domaine → « Ce sous-domaine est déjà pris ».
- [ ] **Step 5: Commit** — `feat(sites): création d'un site à partir du modèle landing`

---

### Task 8: Accès aux pages, enregistrement, publication

**Files:**
- Create: `lib/pages.ts`
- Modify: `lib/tenant.ts` (tag `site:<id>`), `lib/tenant-queries.ts` (statut du site dans `findPublishedPage`)
- Test: `lib/pages.int.test.ts`

**Interfaces:**
- Consumes: `validatePageContent` (Task 4).
- Produces:
  - `siteTag(siteId: string): string` = `"site:" + siteId`, ajouté aux tags de `getPage` (avec `sitePagesTag`). `findPublishedPage` (`lib/tenant-queries.ts`) exige en plus `site.status === "PUBLISHED"` : invalider `siteTag` suffit donc à retirer toutes les pages d'un site suspendu, même si la résolution de l'hôte est encore en cache. Test d'intégration ajouté dans `lib/tenant-queries.int.test.ts` : page publiée d'un site `SUSPENDED` → `null`.
  - `findOwnedPage(userId: string, pageId: string): Promise<{ id; title; draft; published; site: { id; name; subdomain; status } } | null>` — `null` si la page n'existe pas **ou** n'appartient pas à l'utilisateur.
  - `saveDraftForUser(userId, pageId, data: unknown): Promise<{ ok: true } | { ok: false; error: string }>`.
  - `publishPageForUser(userId, pageId, data: unknown): Promise<{ ok: true; siteId: string; subdomain: string } | { ok: false; error: string }>` — transaction : `draft` = `published` = contenu validé, `PageVersion` créée, site `DRAFT` → `PUBLISHED` ; site `SUSPENDED` → `{ ok: false, error: "Ce site est suspendu" }` sans écriture.
  - Page inconnue ou d'un autre vendeur → `{ ok: false, error: "Page introuvable" }` (même message).

- [ ] **Step 1: Tests d'intégration (échouent)** — vendeurs A et B, chacun un site et une page :
  - `findOwnedPage(B, pageDeA)` → `null` ; `findOwnedPage(A, pageDeA)` → la page ;
  - `saveDraftForUser(B, pageDeA, valide)` → « Page introuvable », brouillon de A inchangé ;
  - `saveDraftForUser(A, pageDeA, contenu avec bloc Heading)` → `ok: false`, brouillon inchangé ;
  - `publishPageForUser(A, …, valide)` → `published` = contenu, une `PageVersion`, site `PUBLISHED` ; deuxième publication → deux versions ;
  - `publishPageForUser(B, pageDeA, valide)` → « Page introuvable », aucune version ;
  - site de A `SUSPENDED` → « Ce site est suspendu », statut inchangé, aucune version.
  Run: `npm run test:int` — Expected: FAIL.
- [ ] **Step 2: Implémenter** `lib/pages.ts` et `siteTag`. Run: `npm run test:int` — Expected: PASS.
- [ ] **Step 3: Commit** — `feat(pages): accès propriétaire, brouillon et publication versionnée`

---

### Task 9: Éditeur et aperçu

**Files:**
- Create: `app/(vendor)/(editor)/edit/[pageId]/page.tsx`, `…/Editor.tsx` (client), `…/actions.ts`, `app/(vendor)/preview/[pageId]/page.tsx`, `blocks/fields/MediaField.tsx`, `blocks/dictionary.fr.ts`
- Modify: `blocks/hero/config.ts`, `blocks/image/config.ts` (champ image → `MediaField`)

**Interfaces:**
- Consumes: `findOwnedPage`, `saveDraftForUser`, `publishPageForUser`, `siteTag`, `sitePagesTag`, `siteHostTag` (Task 8 / Phase 0), `puckConfig` (Task 5), `POST /api/media` (Task 6).
- Produces: server actions `saveDraft(pageId: string, data: unknown)` et `publishPage(pageId: string, data: unknown)` → `{ ok: true } | { ok: false; error: string }` ; après publication réussie : `updateTag(sitePagesTag(siteId))`, `updateTag(siteTag(siteId))`, `updateTag(siteHostTag(subdomain + "." + env.SITES_ROOT_DOMAIN))`.

- [ ] **Step 1: Actions** — garde commune (Global Constraints) puis appel de `lib/pages.ts`. Lire la doc `updateTag` (Next 16).
- [ ] **Step 2: Page d'édition** — serveur : session (sinon `/login`), `findOwnedPage` (sinon `notFound()`), rend `<Editor pageId site={{ name, url }} initialData={draft} />`. Client : `<Puck config={puckConfig} data={initialData} dictionary={fr} viewports={[{ width: 360, label: "Mobile" }, { width: 1280, label: "Bureau" }]} … />`, `import "@puckeditor/core/puck.css"` ici seulement. Override `headerActions` : « Aperçu » (ouvre `/preview/<pageId>` dans un onglet), « Enregistrer », « Publier » (`BTN_GHOST` / `BTN_PRIMARY`, recopiés en Task 7) ; état : « Modifications non enregistrées » dès `onChange`, « Enregistré », « Publié — voir le site » (lien) ; erreur de l'action affichée dans une `Notice` (Task 7). `beforeunload` tant que des modifications ne sont pas enregistrées. Lien retour « Mes sites ».
- [ ] **Step 3: Dictionnaire** — `blocks/dictionary.fr.ts` traduit toutes les clés de `defaultDictionary` de Puck 0.24 (lire `node_modules/@puckeditor/core/dist/index-*.d.ts`) ; une clé non traduite → ledger.
- [ ] **Step 4: `MediaField`** (`"use client"`) — affiche la miniature et « Choisir une image » / « Remplacer » / « Retirer » ; envoie à `/api/media` ; erreur du serveur affichée sous le champ ; état d'envoi. Valeur = `{ url, width, height }` ou `null`.
- [ ] **Step 5: Aperçu** — `app/(vendor)/preview/[pageId]/page.tsx` : session + `findOwnedPage` (sinon 404), bandeau « Aperçu — non publié » au-dessus de `<Render>` du **brouillon** passé par `parsePageContent`.
- [ ] **Step 6: Vérifier** — `npm run typecheck`, `npm run lint`, `npm run build` ; navigateur sur le site créé en Task 7 : modifier le titre du Hero → « Modifications non enregistrées » ; Enregistrer → l'aperçu montre le nouveau titre, `http://<sous-domaine>.localhost:3100` → 404 (site en brouillon) ; ajouter une image, Publier → le site affiche titre et image **immédiatement** ; republier une modification → visible au rechargement suivant ; vue Mobile de l'éditeur. Avec le `pageId` du site du seed et un second compte vendeur créé à la main en base : `/edit/<pageId>` et `/preview/<pageId>` → 404.
- [ ] **Step 7: Commit** — `feat(editor): éditeur Puck, aperçu du brouillon et publication`

---

### Task 10: Tableau de bord, connexion et vérification finale

**Files:**
- Modify: `app/(vendor)/(dashboard)/page.tsx`, `app/(vendor)/(auth)/login/page.tsx` (ou un layout serveur du groupe `(auth)`), `README.md`

**Interfaces:**
- Consumes: `listSitesForOwner` (Phase 0) étendu avec l'`id` de la page d'accueil : `homePageId: string | null`.

- [ ] **Step 1: Test d'intégration (échoue)** — `lib/sites.int.test.ts` : `listSitesForOwner` renvoie `homePageId` de la page `slug ""`, `null` si elle n'existe pas. Run: `npm run test:int` — Expected: FAIL → implémenter → PASS.
- [ ] **Step 2: « Mes sites »** — action d'en-tête « Créer un site » (`BTN_PRIMARY`, lien `/sites/new`) ; sur chaque carte : « Modifier la page » (`/edit/<homePageId>`), « Aperçu », et le lien du site seulement si `PUBLISHED` ; l'état vide reçoit l'action « Créer mon premier site ».
- [ ] **Step 3: `/login`** — un vendeur déjà connecté est redirigé vers `/` (composant serveur qui lit `auth()` autour du formulaire client).
- [ ] **Step 4: README** — section « Créer et publier une landing page » (parcours du livrable) ; mention du dossier `storage/uploads`.
- [ ] **Step 5: Vérification finale** — `npm test`, `npm run test:int`, `npm run typecheck`, `npm run lint`, `npm run build` sans erreur ; parcours complet du livrable dans le navigateur, en vue mobile ; curls de la Task 6 (Step 5) et de la Phase 0 (hôtes croisés, `/api/auth` sur un site) toujours conformes.
- [ ] **Step 6: Commit** — `feat(dashboard): créer, modifier et prévisualiser ses sites`
