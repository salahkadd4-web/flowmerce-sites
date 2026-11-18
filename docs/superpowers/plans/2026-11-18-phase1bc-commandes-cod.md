# Phase 1B + 1C — Produit, formulaire COD et commandes : plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** un vendeur crée un produit, fixe ses frais de livraison, le met sur sa landing ; un acheteur commande en paiement à la livraison ; le vendeur traite la commande jusqu'à la livraison ou au retour.

**Architecture:** les blocs Fiche produit et Formulaire reçoivent les données fraîches (produit de la page, frais du site) par la prop `metadata` de Puck, chargées en cache côté serveur ; le formulaire (seul composant client des pages publiques) envoie à `POST /api/orders`, qui résout le site par l'hôte, recalcule tout et enregistre la commande de façon idempotente. L'espace vendeur gagne Produits, Livraison et Commandes ; les changements de statut suivent une table de transitions et gèrent le stock.

**Tech Stack:** acquis de 1A (Next 16, Prisma 7, NextAuth beta.32, Puck 0.24.0, Tailwind 4, zod 3, vitest en globales). Aucune dépendance nouvelle.

**Spec:** `docs/superpowers/specs/2026-11-18-phase1bc-commandes-cod-design.md` ; `flowmerce-sites.md` §2.2, §2.4, §5, §7.

## Global Constraints

- Aucun appel à Flowmerce, aucune modification de `../flowmerce-web-app` ni de `../Caba-Store` (lecture et copie seulement).
- Tests : globales vitest, jamais `import … from "vitest"` ; unitaires `npm test`, intégration `npm run test:int`.
- Migrations : `npx prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --script > prisma/migrations/<horodatage>_<nom>/migration.sql`, relire le SQL, puis `npx prisma migrate deploy` et `npx prisma generate`.
- Toute action vendeur : `isDashboardHost` sinon `throw`, `auth()` sinon refus, identifiants reçus vérifiés `typeof === "string"`, propriété par `tenant.ownerUserId`. Ressource d'un autre vendeur = même réponse qu'introuvable.
- Montants en dinars entiers. Le serveur recalcule tout prix, frais et total.
- Les pages publiques n'importent rien de `@puckeditor/core` côté client : garde `blocks/server-graph.test.ts` (étendue en Task 8).
- Après l'ajout d'un export à un module serveur, redémarrer `npm run dev` avant une vérification navigateur.
- UI vendeur : pièces de `components/dashboard/ui.tsx` (`PageHeader`, `Card`, `CardTitle`, `EmptyState`, `Notice`, `BTN_*`, `FIELD`, `LABEL`, `HINT`, `FIELD_ERROR`), cadre `w-full max-w-* p-5 sm:p-10`. Textes en français.
- Vérification navigateur : `playwright-core` + Edge, scripts dans le dossier temporaire de session.

## Review Focus

1. **Un total trafiqué** — un corps de requête avec `price`, `total` ou `shippingFee` inventés, ou une `quantity` de 0, 11, -1, 1.5 : ignorés ou refusés, la commande porte les montants du serveur. Test : Task 5.
2. **Le produit d'un autre vendeur** — `productId` d'un autre tenant, variante d'un autre produit, produit inactif, site en brouillon : refusé. Test : Task 5.
3. **Le double envoi** — deux requêtes simultanées avec la même `idempotencyKey` : une seule commande, deux réponses identiques. Test : Task 5.
4. **Le stock au bord** — confirmer avec un stock juste suffisant, puis une deuxième commande sur le même stock ; double clic sur « Confirmer » ; annuler après confirmation, retour après livraison : stock exact à chaque étape, jamais négatif. Test : Task 12.
5. **Une commune ou une wilaya hors liste** — commune d'une autre wilaya, wilaya 70, wilaya sans frais, `OFFICE` sans prix bureau : refusé avec un message sous le champ. Test : Task 5.

## Structure des fichiers

```
lib/algeria/Wilaya_Commune_FR.json, Wilaya_Commune_AR.json   # copiés de Caba-Store
lib/algeria/wilayas.ts         # WILAYAS (code, fr, ar), wilayaName, communesOf, isCommuneOf
lib/phone.ts                   # normalizeAlgerianPhone
lib/products.ts                # schémas produit, buildVariants, CRUD propriétaire, toPublicProduct
lib/shipping.ts                # frais par wilaya : lecture, enregistrement, options publiques
lib/ratelimit.ts               # limiteur local (table RateLimit)
lib/orders/reference.ts        # référence courte lisible
lib/orders/intake.ts           # réception d'une commande (logique pure + base)
lib/orders/manage.ts           # liste, détail, transitions, stock, CSV
lib/storefront.ts              # metadata publique (produit + frais) en cache
app/api/orders/route.ts, app/api/orders/communes/route.ts
app/s/[host]/merci/page.tsx
blocks/product/{schema,ProductBlock,config}.ts(x)
blocks/order-form/{schema,OrderFormBlock,config}.ts(x), blocks/order-form/OrderForm.tsx ("use client")
blocks/order-form/totals.ts    # calcul indicatif partagé client/serveur
components/media/ImageUploader.tsx
app/(vendor)/(dashboard)/produits/…, sites/[id]/livraison/…, commandes/…
```

Avant la Task 10 (première tâche d'interface vendeur) : `ui-consistency:finding-patterns` avec `app/(vendor)/(dashboard)/sites/new` (formulaire) et `app/(vendor)/(dashboard)/page.tsx` (liste) comme références.

---

### Task 1: Référentiel algérien et téléphone

**Files:** Create `lib/algeria/Wilaya_Commune_FR.json`, `lib/algeria/Wilaya_Commune_AR.json` (copies exactes de `../Caba-Store/public/`), `lib/algeria/wilayas.ts`, `lib/phone.ts` ; Test `lib/algeria/wilayas.test.ts`, `lib/phone.test.ts`.

**Interfaces — Produces:**
- `type Wilaya = { code: number; fr: string; ar: string }` ; `WILAYAS: readonly Wilaya[]` (69, codes 1 à 69, noms FR du JSON FR, AR du JSON AR, même ordre).
- `wilayaName(code: number): string | null` ; `communesOf(code: number): readonly string[]` (FR) ; `isCommuneOf(code: number, commune: string): boolean` (comparaison exacte après `trim`, sur les listes FR **et** AR).
- `normalizeAlgerianPhone(input: string): string | null` → `+213XXXXXXXXX` ; mobile `0[5-7]` + 8 chiffres, fixe `0[2-4]` + 7 chiffres ; préfixes `+213` / `00213` / `213` acceptés ; espaces, points, tirets, parenthèses ignorés.

- [ ] **Step 1: Tests (échouent)** — `WILAYAS.length === 69`, `wilayaName(16) === "Alger"`, `wilayaName(69) === "El Abiodh Sidi Cheikh"`, `wilayaName(70) === null` ; `communesOf(1)` contient `"Adrar"` et `"Reggane"` ; total des communes FR = 1577 ; `isCommuneOf(16, "Reggane") === false`, `isCommuneOf(1, " Reggane ") === true`, `isCommuneOf(1, "أدرار") === true`. Téléphone : `"0555 12 34 56"` → `"+213555123456"` ; `"+213 6 61 22 33 44"` → `"+213661223344"` ; `"00213770112233"` → `"+213770112233"` ; `"021 23 45 67"` → `"+21321234567"` ; `"0812345678"`, `"055512345"`, `"abc"`, `""` → `null`.
- [ ] **Step 2: Implémenter** (JSON importés avec `resolveJsonModule`). Run `npm test` — PASS.
- [ ] **Step 3: Commit** `feat(algeria): 69 wilayas, communes et téléphone algérien`

---

### Task 2: Modèle de données

**Files:** Modify `prisma/schema.prisma`, `lib/test/db.ts` ; migration `…_phase1bc` ; Test `prisma/schema.int.test.ts`.

**Interfaces — Produces:** modèles `Product`, `Variant`, `ShippingRate`, `Order`, `OrderItem`, `OrderStatusEvent` comme §5 de `flowmerce-sites.md`, **sans** `Site.products` ni `Product.sites`, avec `Product.optionAxes Json @default("[]")`, `Product.images Json @default("[]")` (tableau de `{ url, width, height }` — écart à §5 : `String[]` ne porte pas les dimensions dont `next/image` a besoin), `Variant.options Json`, `Order.reference String @unique`, `Order.source Json?` ; enums `DeliveryType { HOME OFFICE }`, `OrderStatus { NEW CONFIRMED SHIPPED DELIVERED RETURNED CANCELLED }` ; `RateLimit { key String @id; count Int; resetAt DateTime }`. Relations inverses sur `Tenant` (`products`, `orders`) et `Site` (`orders`, `shipping`). `resetDb()` vide, dans l'ordre : `OrderStatusEvent`, `OrderItem`, `Order`, `Variant`, `Product`, `ShippingRate`, `RateLimit`, puis l'existant.

- [ ] **Step 1: Tests (échouent)** : `idempotencyKey` et `reference` uniques (`P2002`) ; `ShippingRate` unique par `[siteId, wilayaCode]` ; suppression d'un tenant supprime produits et variantes ; supprimer un produit met `OrderItem.productId` à `null` sans supprimer la ligne. Run `npm run test:int` — FAIL.
- [ ] **Step 2: Schéma + migration (relue) + `resetDb`.** Run `npm run test:int` — PASS ; `npm run db:seed` — succès.
- [ ] **Step 3: Commit** `feat(db): produits, variantes, livraison, commandes et limitation de débit`

---

### Task 3: Produits

**Files:** Create `lib/products.ts` ; Test `lib/products.test.ts`, `lib/products.int.test.ts`.

**Interfaces — Produces:**
- `productInputSchema` (zod) : `name` 1–120, `description` ≤ 3000, `price` entier 1–10 000 000, `comparePrice` entier > `price` ou `null`, `images` 0–8 `mediaSchema`, `optionAxes` 0–2 `{ name 1–30, values 1–20 chaînes uniques 1–30 }`, `stocks: Record<variantKey, entier 0–100 000>`, `active` booléen. Message en français par champ.
- `variantKey(options: Record<string, string>): string` (axes triés, `"Couleur=noir|Taille=39"` ; `""` sans axe) ; `buildVariants(axes): Record<string, string>[]` (produit cartésien ; `[{}]` sans axe).
- `createProductForUser(userId, input: unknown)`, `updateProductForUser(userId, productId, input: unknown)` → `{ ok: true; productId: string } | { ok: false; field?: string; error: string }` — tenant requis (« Créez d'abord un site ») ; à la mise à jour, variantes synchronisées par `variantKey` : conservées (stock mis à jour), créées, supprimées (les `OrderItem` gardent leur copie).
- `listProductsForOwner(userId)` → `[{ id, name, price, image: MediaValue | null, totalStock, active }]` ; `findOwnedProduct(userId, productId)` → produit + variantes ou `null`.
- `type PublicProduct` (spec, sans stock exact) et `toPublicProduct(product): PublicProduct` ; `productsTag(tenantId) = "tenant-products:" + tenantId`.

- [ ] **Step 1: Tests (échouent)** — unitaires : `buildVariants([])` → `[{}]` ; deux axes 2×3 → 6 combinaisons ; `variantKey` indépendant de l'ordre des clés ; `comparePrice` ≤ `price` refusé ; trois axes refusés ; valeurs d'axe en double refusées. Intégration : création → une variante par combinaison avec son stock ; mise à jour qui retire une valeur → variante supprimée, autres stocks conservés ; vendeur B ne lit ni ne modifie le produit de A (« Produit introuvable ») ; `toPublicProduct` donne `inStock` mais aucune clé `stock`.
- [ ] **Step 2: Implémenter.** Run `npm test` et `npm run test:int` — PASS.
- [ ] **Step 3: Commit** `feat(products): catalogue du vendeur et variantes`

---

### Task 4: Frais de livraison

**Files:** Create `lib/shipping.ts` ; Test `lib/shipping.int.test.ts`.

**Interfaces — Produces:**
- `shippingInputSchema` : tableau de `{ wilayaCode 1–69, home entier 0–100 000 | null, office entier 0–100 000 | null }` ; `office` sans `home` refusé.
- `findOwnedSite(userId, siteId)` → `{ id, name, subdomain, status, tenantId } | null`.
- `getShippingTable(userId, siteId)` → 69 lignes `{ wilayaCode, name, home, office }` (null si non desservie) ou `null` si le site n'est pas au vendeur.
- `saveShippingForUser(userId, siteId, input: unknown)` → `{ ok: true } | { ok: false; error }` — remplace toutes les lignes du site en une transaction ; `home === null` = wilaya non desservie (ligne supprimée).
- `shippingOptions(siteId)` → `ShippingOption[]` (desservies, triées par code) ; `shippingTag(siteId) = "site-shipping:" + siteId`.

- [ ] **Step 1: Tests (échouent)** : enregistrement puis lecture (69 lignes, valeurs) ; réenregistrement sans une wilaya → elle disparaît de `shippingOptions` ; `office` sans `home` refusé ; vendeur B → `null` / refus.
- [ ] **Step 2: Implémenter.** Run `npm run test:int` — PASS.
- [ ] **Step 3: Commit** `feat(shipping): frais de livraison par wilaya`

---

### Task 5: Réception d'une commande

**Files:** Create `lib/ratelimit.ts`, `lib/orders/reference.ts`, `lib/orders/intake.ts`, `blocks/order-form/totals.ts` ; Test `lib/orders/reference.test.ts`, `blocks/order-form/totals.test.ts`, `lib/orders/intake.int.test.ts`, `lib/ratelimit.int.test.ts`.

**Interfaces — Produces:**
- `hitRateLimit(key: string, limit: number, windowSeconds: number): Promise<boolean>` (vrai = autorisé ; fenêtre fixe par `key`, upsert atomique).
- `newOrderReference(): string` — 8 caractères de `ABCDEFGHJKLMNPQRSTUVWXYZ23456789` au format `XXXX-XXXX`.
- `computeTotals({ unitPrice, quantity, shippingFee }) → { subtotal, total }` (partagé par le formulaire et le serveur).
- `orderInputSchema` (corps du formulaire, champs de la spec) et `createOrder(ctx: { host: string; ip: string | null; userAgent: string | null }, body: unknown)` →
  `{ ok: true; reference: string; replayed: boolean } | { ok: false; status: 400 | 404 | 409 | 429; field?: OrderField; error: string }`.
- Constantes `IP_LIMIT = { count: 5, windowSeconds: 600 }`, `PHONE_LIMIT = { count: 3, windowSeconds: 3600 }`, `MIN_FILL_MS = 3000`, `MAX_QUANTITY = 10`.

Ordre des contrôles : forme (400, `field`) → piège `website` non vide (400, sans `field`, message générique) → `startedAt` < 3 s (400) → site par hôte publié sinon 404 → idempotence (clé connue → `ok`, `replayed: true`, même référence) → limites IP puis téléphone (429) → produit actif du tenant, variante du produit (404 « Produit introuvable ») → stock (409, `field: "variant"`) → wilaya desservie / bureau disponible / commune de la wilaya (400, `field`) → transaction (`Order` NEW + `OrderItem` + `OrderStatusEvent` acteur `"client"`). Une `P2002` sur `idempotencyKey` pendant la transaction (course) → relire et renvoyer `replayed: true`.

- [ ] **Step 1: Tests (échouent)** — unitaires : référence au format, 1000 tirages sans caractère ambigu ; `computeTotals`. Intégration (site publié, produit 2 500 DA avec deux tailles, frais Alger 400 / bureau 250) :
  - commande valide → `Order` avec `subtotal 5000` (quantité 2), `shippingFee 400`, `total 5400`, téléphone normalisé, `OrderItem` avec copie du nom, des options et du prix, événement `null → NEW` ;
  - corps avec `price: 1`, `total: 1`, `shippingFee: 0` ajoutés → montants du serveur ;
  - `quantity` 0, 11, -1, 1.5 → 400 `field: "quantity"` ;
  - même `idempotencyKey` deux fois, puis deux fois en parallèle (`Promise.all`) → une seule commande, même référence ;
  - produit d'un autre tenant, variante d'un autre produit, produit inactif → 404 ; site `DRAFT` → 404 ;
  - variante à stock 0, ou quantité > stock → 409 `field: "variant"` ;
  - commune d'une autre wilaya → 400 `field: "commune"` ; wilaya 70 ou sans frais → `field: "wilayaCode"` ; `OFFICE` sans prix bureau → `field: "deliveryType"` ;
  - piège rempli → 400 sans commande ; `startedAt` il y a 1 s → 400 ;
  - 6e commande depuis la même IP en 10 min → 429 ; 4e avec le même téléphone en 1 h → 429.
  - `hitRateLimit` : `limit` autorisés puis refus ; nouvelle fenêtre après `resetAt`.
- [ ] **Step 2: Implémenter.** Run `npm test` et `npm run test:int` — PASS.
- [ ] **Step 3: Commit** `feat(orders): réception des commandes COD, idempotence et anti-spam`

---

### Task 6: Routes publiques des commandes

**Files:** Create `app/api/orders/route.ts`, `app/api/orders/communes/route.ts` ; Modify `lib/routing.ts` (`SITE_API_ALLOWLIST = ["/api/orders"]`) ; Test `lib/routing.test.ts`, `lib/orders/http.test.ts`.

**Interfaces — Produces:** `checkOrderRequest(headers: { host: string | null; origin: string | null; contentType: string | null }): string | null` (`lib/orders/http.ts`, message d'erreur ou `null`) — `Content-Type` `application/json`, `Origin` présent et d'hôte égal à `host`. `POST /api/orders` : 404 sur l'hôte vendeur ; sinon `checkOrderRequest` (403), corps ≤ 10 ko (413), `createOrder` avec l'IP (`x-forwarded-for` premier élément, sinon `null`) → JSON `{ reference }` 200 ou `{ error, field? }` avec le statut. `GET /api/orders/communes?wilaya=16` → `{ communes: string[] }` (`communesOf`), 400 si code invalide, `Cache-Control: public, max-age=86400`.

- [ ] **Step 1: Tests (échouent)** : routage — `POST test.localhost/api/orders` → `pass`, `GET …/api/orders/communes` → `pass`, `POST …/api/media` → `not-found` ; `checkOrderRequest` — origine d'un autre site, origine absente, `text/plain` → message ; même hôte + JSON → `null`.
- [ ] **Step 2: Implémenter.** Run `npm test` — PASS.
- [ ] **Step 3: Vérifier** (serveur redémarré, données de test créées par `curl`/SQL) : `curl -X POST -H "Host: test.localhost:3100" -H "Origin: http://test.localhost:3100" -H "Content-Type: application/json" --data '<corps valide>' http://localhost:3100/api/orders` → 200 `{ reference }` ; même requête → même référence ; `Origin: http://evil.localhost:3100` → 403 ; sur `localhost:3100` → 404 ; `GET http://test.localhost:3100/api/orders/communes?wilaya=16` → communes d'Alger.
- [ ] **Step 4: Commit** `feat(orders): routes publiques de commande et des communes`

---

### Task 7: Données publiques, page Merci

**Files:** Create `lib/storefront.ts`, `app/s/[host]/merci/page.tsx` ; Modify `lib/page-content.ts` (racine : `productId` ; `RESERVED_PAGE_SLUGS = ["merci"]`), `app/s/[host]/[[...slug]]/page.tsx`, `app/(vendor)/preview/[pageId]/page.tsx` ; Test `lib/page-content.test.ts`, `lib/storefront.int.test.ts`.

**Interfaces — Produces:**
- `PageContent.root.props.productId?: string` (chaîne ≤ 40, sinon ignorée à l'affichage, refusée à l'enregistrement).
- `type StorefrontMetadata = { products: Record<string, PublicProduct>; shipping: ShippingOption[] }` ; `loadStorefront(site: { id; tenantId }, productId: string | undefined): Promise<StorefrontMetadata>` (`lib/storefront.ts`, brut, testable) et `getStorefront(...)` (`unstable_cache`, tags `productsTag(tenantId)`, `shippingTag(siteId)`, `siteTag(siteId)`) — produit inactif ou d'un autre tenant → absent.
- Page publique et aperçu : `<Render config={puckConfig} data={…} metadata={storefront} />`.
- Page Merci : lit `searchParams.ref` (format de `newOrderReference`, sinon pas de référence affichée), textes de la spec, lien vers `/`.

- [ ] **Step 1: Tests (échouent)** : `validatePageContent` accepte `root.props.productId`, refuse une valeur non chaîne ; `parsePageContent` l'ignore si invalide ; `loadStorefront` → produit du tenant présent, produit d'un autre tenant ou inactif absent, frais du site présents.
- [ ] **Step 2: Implémenter.** Run `npm test`, `npm run test:int` — PASS.
- [ ] **Step 3: Vérifier** : `http://test.localhost:3100/merci?ref=K7Q4-M2XP` → 200, la référence affichée ; `?ref=<script>` → page sans référence ; le site s'affiche toujours.
- [ ] **Step 4: Commit** `feat(storefront): données produit fraîches et page Merci`

---

### Task 8: Blocs Fiche produit et Formulaire de commande

**Files:** Create `blocks/product/{schema.ts,ProductBlock.tsx,config.ts}`, `blocks/order-form/{schema.ts,OrderFormBlock.tsx,OrderForm.tsx,config.ts}` ; Modify `blocks/schemas.ts`, `blocks/puck.config.ts`, `templates/landing-fr.json`, `blocks/server-graph.test.ts` ; Test `blocks/blocks.test.tsx`, `templates/landing-fr.test.ts`, `blocks/server-graph.test.ts`.

**Interfaces:**
- Consumes: `StorefrontMetadata` (Task 7), `computeTotals` (Task 5), `PublicProduct` (Task 3).
- Produces: types de blocs `Product` (« Fiche produit » : props `{ id, buttonLabel ≤ 40 }`) et `OrderForm` (« Formulaire de commande » : `{ id, title ≤ 80, submitLabel ≤ 40 }`). Les deux lisent `metadata.products[root.props.productId]` — `root.props` arrive aux blocs via `puck.metadata.pageProductId`, ajouté par la page (et l'éditeur) au `metadata`.
- `OrderForm` (`"use client"`) : props `{ product: PublicProduct; shipping: ShippingOption[]; title; submitLabel }` ; poste vers `/api/orders` ; redirige vers `/merci?ref=…`.
- Garde du graphe serveur : aucun module atteint depuis `blocks/puck.config.ts` n'importe `@puckeditor/core` hors types ; seuls modules `"use client"` permis : `blocks/order-form/OrderForm.tsx`.

- [ ] **Step 1: Tests (échouent)** — `ProductBlock` avec un produit : nom, prix `2 500 DA`, prix barré, « Économisez 500 DA », lien `#commande` ; toutes variantes en rupture → « Rupture de stock » ; sans produit hors édition → rendu vide, en édition → « Choisissez le produit de la page dans les réglages de la page » ; `OrderFormBlock` sans frais de livraison → message au vendeur en édition, rien en public ; le modèle contient `["Hero","Product","Text","OrderForm","Footer"]` et passe `validatePageContent` ; garde du graphe : PASS seulement si `OrderForm.tsx` n'importe pas Puck.
- [ ] **Step 2: Implémenter** les blocs (serveur) puis `OrderForm` : champs et `autocomplete` de la spec, `inputMode="tel"`, wilayas de `shipping`, communes chargées à la demande, choix domicile / bureau (bureau masqué sans prix), un `select` par axe, quantité 1 à `MAX_QUANTITY`, récapitulatif via `computeTotals`, champ piège masqué (`aria-hidden`, `tabIndex={-1}`, hors écran), `startedAt` et `idempotencyKey` (`crypto.randomUUID()`) fixés à l'ouverture, UTM lus de `location.search`, erreurs serveur affichées sous `field`, bouton désactivé pendant l'envoi.
- [ ] **Step 3: Vérifier** `npm test`, `npm run typecheck`, `npm run lint`.
- [ ] **Step 4: Commit** `feat(blocks): fiche produit et formulaire de commande COD`

---

### Task 9: Éditeur — produit de la page

**Files:** Modify `app/(vendor)/(editor)/edit/[pageId]/{page.tsx,Editor.tsx,editor-config.ts}`, `app/(vendor)/(editor)/edit/[pageId]/actions.ts` (garde `typeof`), `blocks/puck.config.ts` (champ racine) ; Test `app/(vendor)/(editor)/edit/[pageId]/editor-config.test.ts`.

**Interfaces — Produces:** la page d'édition charge `listProductsForOwner` + `toPublicProduct` des produits actifs et `shippingOptions(siteId)`, passe `metadata={{ products, shipping, pageProductId }}` à `<Puck>` (`pageProductId` suivi depuis `onChange`) ; champ racine `productId` (« Produit de la page ») : `select` construit depuis `metadata.products` — par `resolveFields` si Puck le permet, sinon champ `custom` client branché dans `editor-config.ts` (ledger). Options : « Aucun produit » + un produit par nom.

- [ ] **Step 1: Test (échoue)** : `editorConfig.root.fields.productId` existe ; avec deux produits en metadata, les options listent « Aucun produit » puis les deux noms.
- [ ] **Step 2: Implémenter.** Run `npm test` — PASS.
- [ ] **Step 3: Vérifier** (Playwright) : ouvrir l'éditeur, choisir le produit de la page → la Fiche produit et le Formulaire l'affichent dans l'aperçu ; enregistrer → `root.props.productId` en base.
- [ ] **Step 4: Commit** `feat(editor): choisir le produit de la page`

---

### Task 10: Produits dans l'espace vendeur

**Files:** Create `components/media/ImageUploader.tsx`, `app/(vendor)/(dashboard)/produits/{page.tsx,new/page.tsx,[id]/page.tsx,ProductForm.tsx,actions.ts}` ; Modify `blocks/fields/MediaField.tsx` (réutilise `ImageUploader`), `components/layout/DashboardNav.tsx` (Produits, Commandes).

**Interfaces — Consumes:** Task 3. **Produces:** actions `saveProduct(productId: string | null, formData)` → état `{ field?, error? }` puis `redirect("/produits")` ; `updateTag(productsTag(tenantId))` après succès.

- [ ] **Step 1: `ui-consistency:finding-patterns`** (voir en tête du plan).
- [ ] **Step 2: `ImageUploader`** : envoi, aperçu, retirer, réordonner (gauche / droite), jusqu'à 8 images ; `MediaField` devient une enveloppe `FieldLabel` + `ImageUploader` à une image. Run `npm test` — PASS (garde du graphe incluse).
- [ ] **Step 3: Pages** : liste (`PageHeader` + action « Nouveau produit », `Card` + `ul divide-y`, miniature, nom, prix, stock total, badge Actif / Inactif, `EmptyState`) ; formulaire (nom, description, prix, prix barré, photos, axes « Nom de l'option » + « Valeurs séparées par des virgules », tableau de stock par combinaison recalculé à la saisie, case Actif), erreurs sous les champs.
- [ ] **Step 4: Vérifier** (Playwright) : créer « Chaussure cuir » 2 500 DA, prix barré 3 000, axes Taille 39/40/41, stock 5 chacun, deux photos → liste à jour ; modifier le prix → la landing qui l'utilise affiche le nouveau prix au rechargement ; vendeur B : `/produits/<id de A>` → 404.
- [ ] **Step 5: Commit** `feat(products): pages Produits de l'espace vendeur`

---

### Task 11: Livraison d'un site

**Files:** Create `app/(vendor)/(dashboard)/sites/[id]/livraison/{page.tsx,ShippingForm.tsx,actions.ts}` ; Modify `app/(vendor)/(dashboard)/page.tsx` (lien « Livraison » sur chaque carte ; message pour un site suspendu).

- [ ] **Step 1: Page** : tableau des 69 wilayas (code, nom, domicile, bureau), action « Appliquer à toutes les wilayas » (deux champs + bouton), « Enregistrer » ; `updateTag(shippingTag(siteId))`. Site d'un autre vendeur → 404.
- [ ] **Step 2: Vérifier** (Playwright) : appliquer 600 / 400 partout, retirer Tamanrasset, enregistrer → recharger : valeurs conservées, Tamanrasset vide ; le formulaire de la landing ne propose plus Tamanrasset ; carte « Mes sites » d'un site suspendu : « Site suspendu : il n'est plus visible et ne peut pas être publié. »
- [ ] **Step 3: Commit** `feat(shipping): page Livraison d'un site`

---

### Task 12: Gestion des commandes (logique)

**Files:** Create `lib/orders/manage.ts` ; Test `lib/orders/manage.test.ts`, `lib/orders/manage.int.test.ts`.

**Interfaces — Produces:**
- `ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]>` (table de la spec) ; `canTransition(from, to): boolean`.
- `listOrdersForOwner(userId, { status?: OrderStatus; siteId?: string; page?: number })` → `{ orders: OrderRow[]; total: number; pageSize: 50 }` (plus récentes d'abord).
- `findOwnedOrder(userId, orderId)` → commande + lignes + événements (ordre chronologique) + site, ou `null`.
- `changeOrderStatus(user: { id; email }, orderId, to: OrderStatus, note?: string)` → `{ ok: true } | { ok: false; error }` — transaction : statut courant relu et mise à jour **conditionnée** à ce statut (`updateMany where status = from`) ; vers `CONFIRMED` : décrément de chaque variante avec `stock >= quantité` (sinon « Stock insuffisant pour confirmer ») ; vers `CANCELLED` depuis `CONFIRMED`, ou vers `RETURNED` : restitution ; `OrderStatusEvent` (acteur = email, note ≤ 300).
- `ordersToCsv(rows): string` — en-tête français, `;` séparateur, guillemets doublés, cellule commençant par `= + - @` préfixée de `'`, BOM UTF-8.

- [ ] **Step 1: Tests (échouent)** — unitaires : chaque transition de la table, et `NEW → SHIPPED`, `DELIVERED → CONFIRMED`, `CANCELLED → NEW` refusées ; CSV : `=HYPERLINK(…)` devient `'=HYPERLINK(…)`, `;` et `"` échappés. Intégration (stock initial 2, deux commandes de 1 et 2) : confirmer la première → stock 1 ; confirmer la seconde → « Stock insuffisant », statut `NEW` inchangé ; deux `changeOrderStatus(→ CONFIRMED)` en parallèle sur la même commande → une seule réussit, stock décrémenté une fois ; annuler après confirmation → stock rendu ; `DELIVERED → RETURNED` → stock rendu ; événements dans l'ordre avec acteur et note ; vendeur B : liste vide, détail `null`, changement refusé (« Commande introuvable »).
- [ ] **Step 2: Implémenter.** Run `npm test`, `npm run test:int` — PASS.
- [ ] **Step 3: Commit** `feat(orders): statuts, stock et historique des commandes`

---

### Task 13: Commandes dans l'espace vendeur

**Files:** Create `app/(vendor)/(dashboard)/commandes/{page.tsx,[id]/page.tsx,[id]/StatusActions.tsx,[id]/actions.ts,export/route.ts}`, `components/dashboard/OrderStatusBadge.tsx` (dans `components/dashboard/ui.tsx` si l'on garde un seul fichier — même forme que `SiteStatusBadge`).

- [ ] **Step 1: Liste** : `PageHeader` « Commandes » + action « Exporter (CSV) » vers `/commandes/export?<filtres>` ; filtres statut et site (liens avec `aria-current`) ; lignes : date, référence, client, téléphone, wilaya, total, statut ; pagination « Précédent / Suivant » ; `EmptyState` « Aucune commande pour l'instant. ».
- [ ] **Step 2: Détail** : client (téléphone en lien `tel:` « Appeler »), adresse (wilaya, commune, domicile / bureau), lignes avec options, sous-total / livraison / total, provenance (UTM), boutons des seules transitions permises (`changeOrderStatus`, note facultative), historique ; erreurs en `Notice`.
- [ ] **Step 3: Export** : route `GET` hôte vendeur + session, mêmes filtres, `Content-Type: text/csv; charset=utf-8`, `Content-Disposition: attachment; filename="commandes-AAAA-MM-JJ.csv"`.
- [ ] **Step 4: Vérifier** (Playwright) : commande passée sur la landing → visible en tête de liste ; Confirmer → stock décrémenté dans Produits ; Expédier, Livrer ; historique de 4 lignes ; export téléchargé et ouvert : en-tête + ligne ; vendeur B : `/commandes/<id de A>` → 404, export vide.
- [ ] **Step 5: Commit** `feat(orders): pages Commandes de l'espace vendeur`

---

### Task 14: Reports de 1A, parcours complet, README

**Files:** Modify `blocks/hero/{schema.ts,config.ts,Hero.tsx}` (alt ; `priority` → `preload`), `lib/media.ts` (≤ 10 000 px par côté), `lib/dashboard-host.ts`, les fichiers `actions.ts` de l'espace vendeur, `README.md` ; Test `lib/media.test.ts`, `blocks/schemas.test.ts`, `lib/dashboard-host.test.ts`, `app/media/[key]/route.int.test.ts`.

**Interfaces — Produces:** `assertDashboardHost(host: string | null): void` (`lib/dashboard-host.ts`, lit `env.DASHBOARD_HOST`, lève « Action appelée hors de l'hôte vendeur ») — appelée par **toutes** les server actions vendeur à la place de leur copie de la vérification (`next/headers` n'est pas utilisable dans un test : c'est la garde extraite qui est testée).

- [ ] **Step 1: Tests (échouent)** : image de 10 001 px de large (en-tête PNG construit dans le test) → refus « Image trop grande (10 000 px maximum par côté) » ; Hero accepte `imageAlt` ≤ 150 et le rend en `alt` ; `assertDashboardHost("test.localhost:3100")` et `(null)` lèvent, `("localhost:3100")` non ; `grep` dans le test : chaque `actions.ts` sous `app/(vendor)` contient `assertDashboardHost(` ; route `GET /media/[key]` appelée directement : clé invalide → 404, clé inconnue → 404, clé connue → `nosniff` et `immutable`.
- [ ] **Step 2: Implémenter.** Run `npm test`, `npm run test:int` — PASS.
- [ ] **Step 3: Parcours complet** (Playwright, vue mobile 390 px pour l'acheteur) : créer un site → produit → livraison → choisir le produit de la page → publier → sur le site : fiche, « Commander » fait défiler jusqu'au formulaire, commande Alger domicile taille 40 quantité 2 → page Merci avec référence → dashboard : la commande, Confirmer, stock 4 → 2 ; aucun script de la page publique ne contient `puckeditor` ni `dnd-kit` ; `npm test`, `npm run test:int`, `npm run typecheck`, `npm run lint`, `npm run build` sans erreur.
- [ ] **Step 4: README** : section « Recevoir des commandes » (produit, livraison, produit de la page, commandes et statuts).
- [ ] **Step 5: Commit** `chore: reports de 1A et parcours de commande complet`
