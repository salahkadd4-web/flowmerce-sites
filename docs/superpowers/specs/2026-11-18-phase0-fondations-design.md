# Phase 0 — Fondations (conception courte)

> 18 novembre 2026 — référence : `flowmerce-sites.md` v0.2, §4, §5, §6, §8 (Phase 0)

## Intention
Poser le socle sur lequel la démo du 5 décembre (landing page COD reliée à Flowmerce) sera construite. Tout se fait **en local** pour l'instant : pas de projet Vercel, pas de DNS, pas de choix du domaine racine.

**Livrable :** `http://test.localhost:3000` affiche une page dont le contenu est lu en base.

## Objectifs
- Projet Next.js 16 (App Router) + TypeScript + Tailwind 4, mêmes versions que `flowmerce-web-app`.
- PostgreSQL local (Docker) + Prisma 7 (`@prisma/adapter-pg`), modèles `Tenant`, `Site`, `Page` (+ énumérations `SiteType`, `SiteStatus`) tels que décrits au §5.
- `proxy.ts` multi-tenant : hôte vendeur → espace vendeur ; tout autre hôte → réécriture vers `/s/[host]/[[...slug]]`, **sans requête en base**.
- `lib/tenant.ts` : résolution `host` → site (sous-domaine de `SITES_ROOT_DOMAIN`), mise en cache, avec liste de sous-domaines réservés.
- Rendu minimal de `page.published` (JSON) dans `/s/[host]/[[...slug]]` — un rendu simple en attendant Puck (Phase 1).
- Authentification provisoire : NextAuth v5, identifiants (email + mot de passe bcrypt), session JWT, calquée sur `flowmerce-web-app`. Cookie limité à l'hôte vendeur (§7).
- Espace vendeur minimal : connexion + page « mes sites » protégée.
- Seed : un utilisateur, un `Tenant`, un site `test` publié avec une page d'accueil.
- Tests vitest : extraction du sous-domaine, sous-domaines réservés, décision du proxy (vendeur / site / ignoré).

## Non-objectifs
Puck et les blocs, produits, commandes, domaines personnalisés, Flowmerce (API, outbox), SSO, déploiement Vercel. Tout cela arrive en Phase 1 et au-delà.

## Contraintes
- Variables d'environnement : `SITES_ROOT_DOMAIN` (local : `localhost`), `DASHBOARD_HOST` (local : `localhost:3000`), `DATABASE_URL`, `AUTH_SECRET`.
- Les navigateurs résolvent `*.localhost` vers 127.0.0.1 : aucun réglage DNS ni fichier `hosts` nécessaire.
- Postgres local sur le port **5434** pour ne pas entrer en conflit avec celui de `flowmerce-web-app` (5433).
- Le dossier de rendu est `s/`, jamais `_xxx` (dossier privé dans l'App Router).
- Isolation : toute requête Prisma côté vendeur filtrée par `tenantId`.

## Approches envisagées
1. **Calquer la stack de `flowmerce-web-app` (retenue).** Même Next, Prisma, NextAuth, Tailwind, zod, vitest. Le SSO (Phase 3) et le monorepo (Phase 5) en sont facilités ; le code peut être copié d'un dépôt à l'autre.
2. Partir d'un starter (next-forge, Turborepo) dès maintenant : monorepo tout de suite, mais beaucoup de mise en place inutile avant le 5 décembre.
3. Authentification déléguée tout de suite à Flowmerce (SSO) : évite un compte provisoire, mais bloque la Phase 0 sur des changements dans `flowmerce-web-app`, qui a ses propres priorités jusqu'au 5 décembre.

**Choix :** approche 1, validée par Salah (stack identique, tout en local).

## Décisions prises par Claude (à corriger si besoin)
- Postgres via `docker-compose.yml` dans le dépôt (port 5434), plutôt qu'une base Neon de développement.
- `/s/[host]` : l'hôte est passé tel quel dans le chemin (avec le port en local) puis normalisé dans `lib/tenant.ts`.
- Cache de résolution : `unstable_cache`/`"use cache"` avec un tag par hôte, invalidé à la publication et au changement de domaine.
- Le référentiel `lib/wilayas.ts` (58 wilayas) sera recopié depuis `flowmerce-web-app` en Phase 1, quand le formulaire COD en aura besoin.

## Laissé au réalisateur
Organisation fine des fichiers dans `app/(dashboard)`, style de la page de connexion (sobre, aligné sur la web-app), forme exacte du JSON de page provisoire (il sera remplacé par le format Puck).
