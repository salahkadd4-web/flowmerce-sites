# Phase 0 — Fondations : plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `http://test.localhost:3000` affiche une page lue en base ; `http://localhost:3000` est l'espace vendeur (connexion + « Mes sites »).

**Architecture:** Next.js 16 multi-tenant. `proxy.ts` décide, à partir de l'en-tête `host` seul (aucune requête en base), entre espace vendeur et site public ; les sites sont réécrits vers `app/s/[host]/[[...slug]]`, qui résout l'hôte en site via des fonctions Prisma mises en cache (`unstable_cache` + tags). Authentification provisoire NextAuth v5 (identifiants, JWT) limitée à l'hôte vendeur.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript 5, Tailwind 4, Prisma 7 + `@prisma/adapter-pg`, PostgreSQL 17 (Docker), NextAuth 5.0.0-beta.31, zod 3, bcryptjs, vitest 4.

**Spec:** `docs/superpowers/specs/2026-11-18-phase0-fondations-design.md` (conception courte) et `flowmerce-sites.md` v0.2 §4.3, §5, §6, §7.

## Global Constraints

- Mêmes versions que `../flowmerce-web-app/package.json` : `next ^16.2.4`, `react`/`react-dom ^19.2.5`, `next-auth 5.0.0-beta.31`, `@prisma/client`/`prisma`/`@prisma/adapter-pg ^7.8.0`, `pg ^8.20.0`, `zod ^3.24.2`, `bcryptjs ^3.0.2`, `lucide-react ^0.487.0`, `tailwindcss`/`@tailwindcss/postcss ^4`, `vitest ^4.1.10`, `dotenv ^17.4.2`, `typescript ^5`.
- Tout en local : aucun appel à Vercel, aucun DNS. Les navigateurs (et `curl` récent) résolvent `*.localhost` vers 127.0.0.1.
- Variables : `DATABASE_URL`, `AUTH_SECRET` (≥ 32 caractères), `SITES_ROOT_DOMAIN` (local `localhost`), `DASHBOARD_HOST` (local `localhost:3000`), `SITES_PROTOCOL` (`http` | `https`, local `http`), `SITES_PORT` (facultatif, local `3000`). Jamais de domaine écrit en dur dans le code.
- PostgreSQL local sur `127.0.0.1:5434` (5433 est pris par `flowmerce-web-app`).
- Le dossier de rendu public est `app/s/`, jamais un dossier commençant par `_`.
- **Le proxy ne fait aucune requête en base.**
- Toute requête Prisma côté vendeur est filtrée par le propriétaire / `tenantId`.
- Cookie de session : ne jamais définir `cookies.*.options.domain` dans NextAuth — le cookie reste limité à l'hôte vendeur (§7).
- Contenu des pages rendu en texte React, jamais via `dangerouslySetInnerHTML` (§7).
- Textes de l'interface en français. Commentaires de code en français, comme dans `flowmerce-web-app`.
- Le JSON de page suit dès maintenant la forme Puck `{ root: { props }, content: [{ type, props }] }` pour que la Phase 1 n'ait pas à migrer les données.

## Review Focus

1. **Hôte écrit autrement** — `TEST.Localhost:3000`, `test.localhost.` (point final) : même site que `test.localhost:3000`. Test : Task 3.
2. **Sous-domaine réservé ou imbriqué** — `app.localhost`, `a.b.localhost`, `localhost` sans sous-domaine côté site : 404, jamais un site. Tests : Task 3 et Task 5.
3. **Croisement des hôtes** — `test.localhost:3000/api/auth/session` et `test.localhost:3000/login` ne doivent jamais atteindre l'auth ni l'espace vendeur ; `localhost:3000/s/test.localhost` ne doit pas afficher le site. Test : Task 4.
4. **Site ou page non publiés** — site `DRAFT`/`SUSPENDED`, page avec `published: null` : 404, jamais le brouillon. Test : Task 5.
5. **JSON publié abîmé** — `content` absent, bloc de type inconnu, texte contenant `<script>` : pas de plantage, bloc inconnu ignoré, texte échappé. Tests : Task 5 et Task 6.

## Structure des fichiers

```
flowmerce-sites/
├─ package.json, tsconfig.json, next.config.ts, postcss.config.mjs, eslint.config.mjs
├─ vitest.config.ts              # tests unitaires (*.test.ts, hors *.int.test.ts)
├─ vitest.int.config.ts          # tests d'intégration (*.int.test.ts, base de test)
├─ docker-compose.yml            # Postgres 17, port 5434
├─ docker/init-test-db.sql       # crée la base flowmerce_sites_test
├─ .env.example, .env.test
├─ proxy.ts                      # routage par hôte → routeRequest()
├─ prisma.config.ts
├─ prisma/schema.prisma, prisma/seed.ts, prisma/migrations/
├─ app/
│  ├─ layout.tsx, globals.css
│  ├─ (auth)/login/page.tsx, (auth)/login/actions.ts
│  ├─ (dashboard)/layout.tsx, (dashboard)/page.tsx      # « Mes sites »
│  ├─ api/auth/[...nextauth]/route.ts
│  └─ s/[host]/[[...slug]]/page.tsx
├─ components/auth/AuthShell.tsx                        # repris de la web-app
├─ components/site/RenderPage.tsx
└─ lib/
   ├─ env.ts                     # variables validées (zod)
   ├─ prisma.ts                  # client Prisma (adapter-pg)
   ├─ host.ts                    # fonctions pures sur les hôtes
   ├─ routing.ts                 # routeRequest() pure, utilisée par proxy.ts
   ├─ page-content.ts            # schéma zod du JSON de page
   ├─ tenant-queries.ts          # requêtes Prisma brutes host → site / page
   ├─ tenant.ts                  # mêmes requêtes, mises en cache + tags
   ├─ auth.ts                    # NextAuth
   ├─ auth-credentials.ts        # vérification email / mot de passe
   └─ sites.ts                   # listSitesForOwner()
```

Branche de travail : `phase-0-fondations`. Le premier commit (sur `main`, dépôt vide) contient uniquement les documents existants.

---

### Task 1: Socle du projet

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`, `eslint.config.mjs`, `vitest.config.ts`, `.gitignore`, `.env.example`, `docker-compose.yml`, `docker/init-test-db.sql`, `app/layout.tsx`, `app/globals.css`, `app/(dashboard)/page.tsx` (provisoire)
- Test: `lib/smoke.test.ts` (supprimé à la Task 3)

**Interfaces:**
- Produces: scripts npm `dev`, `build`, `typecheck`, `lint`, `test` (= `vitest run`), `db:up` (`docker compose up -d db`), `db:migrate` (`prisma migrate dev`), `db:seed` (`prisma db seed`), `test:int` (défini Task 2). Alias d'import `@/*` → racine.

- [ ] **Step 1: Commit initial des documents puis branche**

```bash
git add flowmerce-sites.md docs/
git commit -m "docs: conception Flowmerce Sites v0.2 et plan de la Phase 0"
git checkout -b phase-0-fondations
```

- [ ] **Step 2: Écrire `package.json` et installer**

Dépendances = Global Constraints + `@types/bcryptjs`, `@types/node ^20`, `@types/pg`, `@types/react ^19`, `@types/react-dom ^19`, `eslint ^9`, `eslint-config-next ^16`, `tsx`, `dotenv-cli`, `clsx`, `tailwind-merge`. `"postinstall": "prisma generate"` est ajouté à la Task 2 (pas de schéma avant). Run: `npm install` — Expected: aucune erreur.

- [ ] **Step 3: Fichiers de configuration**

`tsconfig.json` et `vitest.config.ts` : copies de `../flowmerce-web-app` ; dans `vitest.config.ts`, `exclude` ajoute `'**/*.int.test.ts'`. `postcss.config.mjs` : copie. `next.config.ts` : `poweredByHeader: false` seulement. `.gitignore` : standard Next (`node_modules`, `.next`, `.env*.local`, `.env`, `generated/`) — `.env.example` et `.env.test` restent versionnés.

- [ ] **Step 4: Postgres local**

`docker-compose.yml` : projet `flowmerce-sites-dev`, service `db`, image `postgres:17-alpine`, `POSTGRES_USER/PASSWORD/DB = flowmerce_sites`, port `127.0.0.1:5434:5432`, volume nommé, healthcheck `pg_isready`, monte `./docker/init-test-db.sql` dans `/docker-entrypoint-initdb.d/`. `init-test-db.sql` : `CREATE DATABASE flowmerce_sites_test;`.
`.env.example` :

```
DATABASE_URL=postgresql://flowmerce_sites:flowmerce_sites@localhost:5434/flowmerce_sites
AUTH_SECRET=remplacer-par-une-valeur-aleatoire-de-32-caracteres-min
SITES_ROOT_DOMAIN=localhost
DASHBOARD_HOST=localhost:3000
SITES_PROTOCOL=http
SITES_PORT=3000
```

Run: `npm run db:up` puis `docker compose exec db psql -U flowmerce_sites -l` — Expected: `flowmerce_sites` et `flowmerce_sites_test` listées.

- [ ] **Step 5: Mise en page racine + page provisoire**

`app/globals.css` : `@import "tailwindcss";` + bloc `@theme` des jetons de `../flowmerce-web-app/app/globals.css` (surfaces, texte, traits, accent, rayons). `app/layout.tsx` : `<html lang="fr">`, même police que la web-app (voir son `app/layout.tsx`), métadonnées `title: "Flowmerce Sites"`. `app/(dashboard)/page.tsx` : titre « Flowmerce Sites » (remplacé Task 8).

- [ ] **Step 6: Test de fumée**

`lib/smoke.test.ts` : `it("exécute vitest", () => expect(1 + 1).toBe(2))`.
Run: `npm test` — Expected: 1 passed. Run: `npm run typecheck` — Expected: aucune erreur. Run: `npm run dev`, ouvrir `http://localhost:3000` — Expected: « Flowmerce Sites ».

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore: socle Next.js 16, Tailwind 4, vitest et Postgres local"
```

---

### Task 2: Base de données et données de départ

**Files:**
- Create: `prisma.config.ts`, `prisma/schema.prisma`, `prisma/seed.ts`, `lib/env.ts`, `lib/prisma.ts`, `vitest.int.config.ts`, `.env.test`, `lib/test/db.ts`
- Modify: `package.json` (scripts `postinstall`, `test:int`, config `prisma.seed`)
- Test: `prisma/schema.int.test.ts`

**Interfaces:**
- Produces:
  - `prisma` (instance unique `PrismaClient`) exporté par `lib/prisma.ts`.
  - `env` exporté par `lib/env.ts` : `{ NODE_ENV; DATABASE_URL: string; AUTH_SECRET: string; SITES_ROOT_DOMAIN: string; DASHBOARD_HOST: string; SITES_PROTOCOL: "http" | "https"; SITES_PORT?: string }`.
  - Modèles Prisma `User`, `Tenant`, `Site`, `Page`, énumérations `SiteType { LANDING STORE }`, `SiteStatus { DRAFT PUBLISHED SUSPENDED }`.
  - `resetDb(): Promise<void>` dans `lib/test/db.ts` (vide `Page`, `Site`, `Tenant`, `User`, dans cet ordre).
  - Données de départ : utilisateur `vendeur@test.local` / `motdepasse-test`, tenant « Boutique Test », site `test` (LANDING, PUBLISHED, `theme: {}`, `locale: "fr"`), page d'accueil `slug: ""`, `title: "Accueil"`, `draft` = `published` = `{ root: { props: { title: "Accueil" } }, content: [{ type: "Heading", props: { id: "h1", text: "Bienvenue sur la boutique test" } }, { type: "Text", props: { id: "t1", text: "Cette page est lue en base." } }] }`.

- [ ] **Step 1: `prisma.config.ts`, `lib/env.ts`, `lib/prisma.ts`**

`prisma.config.ts` : comme `../flowmerce-web-app/prisma.config.ts`, avec `DATABASE_URL` seul (pas de `DIRECT_URL`) et `seed: "tsx prisma/seed.ts"`. `lib/env.ts` : schéma zod des variables de l'Interface ci-dessus, `SITES_PROTOCOL` par défaut `"https"`, chaînes vides traitées comme absentes (motif `optionalNonEmpty` de la web-app). `lib/prisma.ts` : copie de `../flowmerce-web-app/lib/prisma.ts`.

- [ ] **Step 2: Schéma**

`prisma/schema.prisma` : générateur `prisma-client-js`, datasource `postgresql` sans `url`. `Tenant`, `Site`, `Page` exactement comme §5 de `flowmerce-sites.md`, **en retirant les relations vers les modèles qui n'existent pas encore** (`subscription`, `features`, `usage`, `products`, `media`, `orders`, `outbox`, `domains`, `shipping`, `versions`). Ajouter le modèle provisoire :

```prisma
// Compte provisoire (Phase 0) — remplacé par le SSO Flowmerce en Phase 3.
// Tenant.ownerUserId pointe vers User.id sans clé étrangère, pour que le SSO
// puisse fournir des identifiants externes sans migration de Tenant.
model User {
  id           String   @id @default(cuid())
  email        String   @unique
  name         String?
  passwordHash String
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}
```

Run: `cp .env.example .env.local` (puis `AUTH_SECRET` réel), `npm run db:migrate -- --name init` — Expected: migration `…_init` créée et appliquée.

- [ ] **Step 3: Configuration des tests d'intégration**

`.env.test` : `DATABASE_URL=postgresql://flowmerce_sites:flowmerce_sites@localhost:5434/flowmerce_sites_test` + mêmes valeurs locales que `.env.example` (`AUTH_SECRET` de test fixe). `vitest.int.config.ts` : `include: ['**/*.int.test.ts']`, `fileParallelism: false`, alias `@`. Script `"test:int": "dotenv -e .env.test -- prisma migrate deploy && dotenv -e .env.test -- vitest run --config vitest.int.config.ts"`.

- [ ] **Step 4: Écrire le test d'intégration (échoue)**

`prisma/schema.int.test.ts`, `beforeEach(resetDb)` :
- `it("refuse deux sites avec le même sous-domaine")` : crée un tenant, deux `site.create` avec `subdomain: "dup"` → le second rejette avec `code === "P2002"`.
- `it("supprime les sites et pages avec le tenant")` : tenant → site → page ; `tenant.delete` ; `site.count()` et `page.count()` valent `0`.
- `it("refuse deux pages avec le même slug sur un site")` : `P2002` sur `[siteId, slug]`.

Run: `npm run test:int` — Expected: FAIL (`resetDb` absent).

- [ ] **Step 5: Implémenter `resetDb()`**

Run: `npm run test:int` — Expected: 3 passed.

- [ ] **Step 6: Données de départ**

`prisma/seed.ts` : `upsert` idempotents (relancer le seed ne crée pas de doublons) avec les valeurs de l'Interface ; mot de passe haché `bcrypt.hash(…, 10)`.
Run: `npm run db:seed` deux fois — Expected: succès les deux fois ; `docker compose exec db psql -U flowmerce_sites -c 'select subdomain, status from "Site";'` → une ligne `test | PUBLISHED`.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat(db): modèles Tenant, Site, Page, User provisoire et données de départ"
```

---

### Task 3: Fonctions pures sur les hôtes

**Files:**
- Create: `lib/host.ts`
- Test: `lib/host.test.ts`
- Delete: `lib/smoke.test.ts`

**Interfaces:**
- Produces (toutes pures, sans `env`) :
  - `normalizeHost(host: string): string` — minuscules, sans port, sans point final, espaces retirés.
  - `RESERVED_SUBDOMAINS: ReadonlySet<string>` = `app, api, www, admin, mail, sites, dashboard, static, cdn, assets, help, support, status, blog, docs, s`.
  - `getSubdomain(host: string, rootDomain: string): string | null` — l'étiquette unique devant `rootDomain` ; `null` si hôte = racine, si plusieurs étiquettes, ou si autre domaine.
  - `isReservedSubdomain(label: string): boolean`.
  - `siteUrl(subdomain: string, cfg: { rootDomain: string; protocol: "http" | "https"; port?: string }): string`.

- [ ] **Step 1: Écrire les tests (échouent)**

```ts
expect(normalizeHost("TEST.Localhost:3000")).toBe("test.localhost");
expect(normalizeHost("test.localhost.")).toBe("test.localhost");
expect(getSubdomain("test.localhost", "localhost")).toBe("test");
expect(getSubdomain("TEST.localhost:3000", "localhost")).toBe("test");
expect(getSubdomain("localhost", "localhost")).toBeNull();
expect(getSubdomain("a.b.localhost", "localhost")).toBeNull();
expect(getSubdomain("test.exemple.com", "localhost")).toBeNull();
expect(getSubdomain("evillocalhost", "localhost")).toBeNull();
expect(getSubdomain("boutique.flowmerce.dz", "flowmerce.dz")).toBe("boutique");
expect(isReservedSubdomain("app")).toBe(true);
expect(isReservedSubdomain("APP")).toBe(true);
expect(isReservedSubdomain("test")).toBe(false);
expect(siteUrl("test", { rootDomain: "localhost", protocol: "http", port: "3000" })).toBe("http://test.localhost:3000");
expect(siteUrl("boutique", { rootDomain: "flowmerce.dz", protocol: "https" })).toBe("https://boutique.flowmerce.dz");
```

Run: `npx vitest run lib/host.test.ts` — Expected: FAIL (module absent).

- [ ] **Step 2: Implémenter `lib/host.ts`, supprimer `lib/smoke.test.ts`**

Run: `npm test` — Expected: tous les tests de `host.test.ts` passent.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat(host): normalisation d'hôte, sous-domaines et noms réservés"
```

---

### Task 4: Proxy multi-tenant

**Files:**
- Create: `lib/routing.ts`, `proxy.ts`
- Test: `lib/routing.test.ts`

**Interfaces:**
- Consumes: `normalizeHost` (Task 3), `env` (Task 2).
- Produces:
  - `type RouteDecision = { kind: "pass" } | { kind: "site"; rewritePath: string } | { kind: "not-found" }`.
  - `routeRequest(input: { host: string | null; pathname: string; search: string }, cfg: { dashboardHost: string }): RouteDecision`.
  - `proxy(request: NextRequest): NextResponse` dans `proxy.ts` : `pass` → `NextResponse.next()` ; `site` → `NextResponse.rewrite(new URL(rewritePath, request.url))` ; `not-found` → `new NextResponse(null, { status: 404 })`. `config.matcher = ["/((?!_next/static|_next/image|favicon.ico).*)"]`.

Règles de `routeRequest` (dans cet ordre) :
1. `host` absent ou vide → `not-found`.
2. Hôte vendeur (comparaison `host.toLowerCase()` avec `dashboardHost`, port compris) : `pathname` qui commence par `/s/` ou vaut `/s` → `not-found` ; sinon `pass`.
3. Tout autre hôte : `pathname` qui commence par `/api/auth` → `not-found` ; autre `/api/…` → `pass` (sans réécriture ; servira à `/api/orders` en Phase 1) ; sinon `site` avec `rewritePath = "/s/" + encodeURIComponent(normalizeHost(host)) + pathname + search` (pour `pathname === "/"`, pas de `/` final).

- [ ] **Step 1: Écrire les tests (échouent)**

Avec `cfg = { dashboardHost: "localhost:3000" }` :

```ts
expect(routeRequest({ host: "localhost:3000", pathname: "/", search: "" }, cfg)).toEqual({ kind: "pass" });
expect(routeRequest({ host: "localhost:3000", pathname: "/login", search: "" }, cfg)).toEqual({ kind: "pass" });
expect(routeRequest({ host: "localhost:3000", pathname: "/s/test.localhost", search: "" }, cfg)).toEqual({ kind: "not-found" });
expect(routeRequest({ host: "test.localhost:3000", pathname: "/", search: "" }, cfg)).toEqual({ kind: "site", rewritePath: "/s/test.localhost" });
expect(routeRequest({ host: "TEST.localhost:3000", pathname: "/produit/a", search: "?utm_source=fb" }, cfg)).toEqual({ kind: "site", rewritePath: "/s/test.localhost/produit/a?utm_source=fb" });
expect(routeRequest({ host: "test.localhost:3000", pathname: "/login", search: "" }, cfg)).toEqual({ kind: "site", rewritePath: "/s/test.localhost/login" });
expect(routeRequest({ host: "test.localhost:3000", pathname: "/api/auth/session", search: "" }, cfg)).toEqual({ kind: "not-found" });
expect(routeRequest({ host: "test.localhost:3000", pathname: "/api/orders", search: "" }, cfg)).toEqual({ kind: "pass" });
expect(routeRequest({ host: null, pathname: "/", search: "" }, cfg)).toEqual({ kind: "not-found" });
```

Run: `npx vitest run lib/routing.test.ts` — Expected: FAIL.

- [ ] **Step 2: Implémenter `lib/routing.ts` puis `proxy.ts`**

`proxy.ts` lit `request.headers.get("host")`, `request.nextUrl.pathname`, `request.nextUrl.search`, et `env.DASHBOARD_HOST`. Aucun import de `lib/prisma.ts` ni de `lib/tenant*.ts`.
Run: `npm test` — Expected: PASS. Run: `npm run typecheck` — Expected: aucune erreur.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat(proxy): routage par hôte sans requête en base"
```

---

### Task 5: Résolution hôte → site et contenu de page

**Files:**
- Create: `lib/page-content.ts`, `lib/tenant-queries.ts`, `lib/tenant.ts`
- Test: `lib/page-content.test.ts`, `lib/tenant-queries.int.test.ts`

**Interfaces:**
- Consumes: `getSubdomain`, `isReservedSubdomain`, `normalizeHost` (Task 3), `prisma`, `env`, `resetDb` (Task 2).
- Produces:
  - `type PageBlock = { type: string; props: Record<string, unknown> }`, `type PageContent = { root: { props: { title?: string } }; content: PageBlock[] }`.
  - `parsePageContent(json: unknown): PageContent | null` — zod `safeParse` ; `root` absent → `{ props: {} }` ; `content` absent ou non tableau → `null`.
  - `type PublicSite = { id: string; tenantId: string; name: string; subdomain: string; locale: string; theme: unknown }`.
  - `findPublishedSiteByHost(host: string, rootDomain: string): Promise<PublicSite | null>` (`lib/tenant-queries.ts`) — `null` si pas de sous-domaine, sous-domaine réservé, site absent ou `status !== "PUBLISHED"`. Les domaines personnalisés (table `Domain`) arrivent en Phase 4.
  - `findPublishedPage(siteId: string, slug: string): Promise<{ title: string; content: PageContent } | null>` — `null` si page absente, `published` nul ou `parsePageContent` renvoie `null`.
  - `lib/tenant.ts` : `getSiteByHost(host: string)` et `getPage(siteId: string, slug: string)`, mêmes signatures sans `rootDomain` (lu dans `env`), enveloppées par `unstable_cache` avec clés `["site-by-host", normalizedHost]` / `["page", siteId, slug]` et tags `siteHostTag(host) = "site-host:" + normalizedHost`, `sitePagesTag(siteId) = "site-pages:" + siteId` (tous deux exportés, pour la revalidation de la Phase 1).

- [ ] **Step 1: Tests unitaires de `parsePageContent` (échouent)**

- contenu valide de la Task 2 → objet avec `content.length === 2` ;
- `{ content: [] }` → `{ root: { props: {} }, content: [] }` ;
- `{ root: { props: {} } }` (sans `content`) → `null` ;
- `"texte"`, `null`, `42` → `null` ;
- bloc `{ type: "Inconnu", props: {} }` conservé tel quel (le rendu l'ignore, Task 6).

Run: `npx vitest run lib/page-content.test.ts` — Expected: FAIL.

- [ ] **Step 2: Implémenter `lib/page-content.ts`**

Run: `npm test` — Expected: PASS.

- [ ] **Step 3: Tests d'intégration des requêtes (échouent)**

`lib/tenant-queries.int.test.ts`, `beforeEach(resetDb)`, données créées dans le test (rootDomain `"localhost"`) :
- site `test` PUBLISHED → `findPublishedSiteByHost("test.localhost:3000", "localhost")` renvoie `subdomain: "test"` ;
- même site, hôte `"TEST.localhost."` → trouvé ;
- site `brouillon` DRAFT et site `suspendu` SUSPENDED → `null` ;
- site PUBLISHED de sous-domaine `app` (créé en base malgré la règle) → `null` pour `app.localhost` ;
- `"inconnu.localhost"`, `"localhost"`, `"a.test.localhost"` → `null` ;
- page `slug: ""` avec `published` valide → `findPublishedPage(site.id, "")` renvoie `title` et `content.content.length === 2` ;
- page `slug: "promo"` avec `published: null` (Prisma `Prisma.DbNull`) et `draft` rempli → `null` ;
- page `slug: "casse"` avec `published: { foo: 1 }` → `null` ;
- page d'un **autre** site avec `slug: "autre"` → `findPublishedPage(site.id, "autre")` renvoie `null` (isolation).

Run: `npm run test:int` — Expected: FAIL.

- [ ] **Step 4: Implémenter `lib/tenant-queries.ts` puis `lib/tenant.ts`**

Run: `npm run test:int` — Expected: PASS. Run: `npm run typecheck` — Expected: aucune erreur.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(tenant): résolution hôte → site publié et lecture du contenu de page"
```

---

### Task 6: Rendu public des sites (livrable Phase 0)

**Files:**
- Create: `app/s/[host]/[[...slug]]/page.tsx`, `components/site/RenderPage.tsx`
- Test: `components/site/RenderPage.test.tsx`

**Interfaces:**
- Consumes: `getSiteByHost`, `getPage` (Task 5), `PageContent` (Task 5).
- Produces: `RenderPage({ content }: { content: PageContent }): JSX.Element` — rend `Heading` (`props.text` → `<h1>`) et `Text` (`props.text` → `<p>`) ; tout autre `type`, ou un `text` qui n'est pas une chaîne, est ignoré ; clé React = `props.id` si chaîne, sinon index.

- [ ] **Step 1: Tests de `RenderPage` (échouent)**

Avec `renderToStaticMarkup` de `react-dom/server` (pas de dépendance de test supplémentaire), `vitest.config.ts` inclut déjà `*.test.tsx` :
- contenu de la Task 2 → contient `<h1>Bienvenue sur la boutique test</h1>` et `<p>Cette page est lue en base.</p>` ;
- bloc `{ type: "Inconnu", props: { text: "x" } }` → la sortie ne contient pas `x` ;
- bloc `Text` avec `text: "<script>alert(1)</script>"` → la sortie contient `&lt;script&gt;` et pas `<script>` ;
- bloc `Heading` avec `text: 42` → ignoré.

Run: `npx vitest run components/site/RenderPage.test.tsx` — Expected: FAIL.

- [ ] **Step 2: Implémenter `RenderPage`**

Run: `npm test` — Expected: PASS.

- [ ] **Step 3: Implémenter la route `app/s/[host]/[[...slug]]/page.tsx`**

`params: Promise<{ host: string; slug?: string[] }>` ; `host = decodeURIComponent(params.host)` ; `slug = (params.slug ?? []).join("/")` ; `getSiteByHost` puis `getPage` ; l'un des deux `null` → `notFound()`. `<main lang={site.locale} dir={site.locale === "ar" ? "rtl" : "ltr"}>`. `generateMetadata` : `title` = titre de la page, sinon nom du site.

- [ ] **Step 4: Vérifier le livrable de bout en bout**

Run: `npm run dev`, puis :
- `curl -s -H "Host: test.localhost:3000" http://localhost:3000/` — Expected: HTML contenant `Bienvenue sur la boutique test`.
- `curl -s -o /dev/null -w "%{http_code}" -H "Host: inconnu.localhost:3000" http://localhost:3000/` — Expected: `404`.
- `curl -s -o /dev/null -w "%{http_code}" -H "Host: app.localhost:3000" http://localhost:3000/` — Expected: `404`.
- `curl -s -o /dev/null -w "%{http_code}" -H "Host: test.localhost:3000" http://localhost:3000/api/auth/session` — Expected: `404`.
- `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/s/test.localhost` — Expected: `404`.
- Ouvrir `http://test.localhost:3000` dans le navigateur — Expected: titre et texte de la page de départ.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(sites): rendu public des pages publiées sur le sous-domaine"
```

---

### Task 7: Authentification provisoire

Avant cette tâche : lancer `ui-consistency:finding-patterns` avec `../flowmerce-web-app/app/auth/login/` comme page de référence, pour reprendre ses composants et jetons (pas de nouveau style).

**Files:**
- Create: `lib/auth-credentials.ts`, `lib/auth.ts`, `app/api/auth/[...nextauth]/route.ts`, `app/(auth)/login/page.tsx`, `app/(auth)/login/actions.ts`, `components/auth/AuthShell.tsx`, `types/next-auth.d.ts`
- Test: `lib/auth-credentials.int.test.ts`

**Interfaces:**
- Consumes: `prisma`, `env`, `resetDb` (Task 2).
- Produces:
  - `authorizeCredentials(email: string, password: string): Promise<{ id: string; email: string; name: string | null } | null>` — email `trim().toLowerCase()` ; `null` si champ vide, utilisateur absent ou mot de passe faux.
  - `auth`, `signIn`, `signOut`, `handlers` exportés par `lib/auth.ts` (NextAuth v5, provider `Credentials` qui appelle `authorizeCredentials`, `session: { strategy: "jwt" }`, `secret: env.AUTH_SECRET`, `trustHost: true`, `pages: { signIn: "/login" }`, **aucune option `cookies`**). `session.user.id` = `token.sub`.
  - `loginAction(formData: FormData): Promise<{ error?: string; redirectTo?: string }>` — `redirectTo: "/"` en cas de succès ; erreurs : `"Email et mot de passe requis"`, `"Email ou mot de passe incorrect"` (mêmes textes que la web-app).

- [ ] **Step 1: Tests d'intégration (échouent)**

`beforeEach(resetDb)`, utilisateur créé avec `bcrypt.hash("bon-mot-de-passe", 10)` et email `vendeur@test.local` :
- bons identifiants → `{ id, email: "vendeur@test.local", name }` ;
- email `"  Vendeur@Test.local "` → trouvé ;
- mauvais mot de passe → `null` ;
- email inconnu → `null` ;
- mot de passe vide → `null` ;
- le résultat ne contient pas de clé `passwordHash`.

Run: `npm run test:int` — Expected: FAIL.

- [ ] **Step 2: Implémenter `authorizeCredentials`, puis `lib/auth.ts` et la route `[...nextauth]`**

Run: `npm run test:int` — Expected: PASS.

- [ ] **Step 3: Page de connexion**

`components/auth/AuthShell.tsx` : copie de `../flowmerce-web-app/components/auth/AuthShell.tsx` (et des jetons dont il dépend, s'ils manquent dans `globals.css`). `app/(auth)/login/page.tsx` : même structure que la page de connexion de la web-app, sans lien d'inscription ni bloc « inscription réussie » ; aside : « Espace vendeur — Créez et publiez vos landing pages ». `actions.ts` : `loginAction` ci-dessus.

- [ ] **Step 4: Vérifier**

Run: `npm run typecheck` — Expected: aucune erreur. `npm run dev`, `http://localhost:3000/login` : `vendeur@test.local` / `motdepasse-test` → redirection vers `/` ; mauvais mot de passe → « Email ou mot de passe incorrect ». Dans les outils du navigateur, le cookie `authjs.session-token` est posé sur `localhost` **sans** attribut `Domain` ; `http://test.localhost:3000` ne le reçoit pas.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(auth): connexion provisoire par identifiants sur l'hôte vendeur"
```

---

### Task 8: Espace vendeur « Mes sites » + README

**Files:**
- Create: `lib/sites.ts`, `app/(dashboard)/layout.tsx`, `README.md`
- Modify: `app/(dashboard)/page.tsx`
- Test: `lib/sites.int.test.ts`

**Interfaces:**
- Consumes: `auth`, `signOut` (Task 7), `siteUrl` (Task 3), `prisma`, `env`, `resetDb` (Task 2).
- Produces: `listSitesForOwner(ownerUserId: string): Promise<Array<{ id: string; name: string; subdomain: string; type: "LANDING" | "STORE"; status: "DRAFT" | "PUBLISHED" | "SUSPENDED" }>>` — sites dont `tenant.ownerUserId === ownerUserId`, triés par `createdAt` décroissant.

- [ ] **Step 1: Tests d'intégration (échouent)**

`beforeEach(resetDb)` : utilisateurs A et B, un tenant chacun, A a 2 sites (`a1` créé avant `a2`), B a 1 site (`b1`) :
- `listSitesForOwner(A.id)` → sous-domaines `["a2", "a1"]` ;
- `listSitesForOwner(B.id)` → `["b1"]` ;
- `listSitesForOwner("inconnu")` → `[]`.

Run: `npm run test:int` — Expected: FAIL.

- [ ] **Step 2: Implémenter `listSitesForOwner`**

Run: `npm run test:int` — Expected: PASS.

- [ ] **Step 3: Pages**

`app/(dashboard)/layout.tsx` : `const session = await auth()` ; pas de session → `redirect("/login")` ; en-tête avec le nom/email et un bouton « Se déconnecter » (server action `signOut({ redirectTo: "/login" })`). `app/(dashboard)/page.tsx` : titre « Mes sites » ; une carte par site (nom, type « Landing page » / « Boutique », statut « Brouillon » / « Publié » / « Suspendu », lien `siteUrl(subdomain, { rootDomain: env.SITES_ROOT_DOMAIN, protocol: env.SITES_PROTOCOL, port: env.SITES_PORT })` ouvert dans un nouvel onglet) ; liste vide → « Aucun site pour l'instant. ». Composants et jetons repérés par `finding-patterns` à la Task 7.

- [ ] **Step 4: README**

`README.md` — section « Démarrage local » : `npm install`, `cp .env.example .env.local` (+ `AUTH_SECRET`), `npm run db:up`, `npm run db:migrate`, `npm run db:seed`, `npm run dev` ; adresses `http://localhost:3000` (vendeur, `vendeur@test.local` / `motdepasse-test`) et `http://test.localhost:3000` (site) ; `npm test` et `npm run test:int`.

- [ ] **Step 5: Vérification finale**

Run: `npm test`, `npm run test:int`, `npm run typecheck`, `npm run lint`, `npm run build` — Expected: tous sans erreur. `npm run dev` : `http://localhost:3000` sans session → `/login` ; après connexion → « Mes sites » avec la carte « Boutique Test », dont le lien ouvre `http://test.localhost:3000` et affiche la page de départ.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(dashboard): liste des sites du vendeur et README de démarrage local"
```
