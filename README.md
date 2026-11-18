# Flowmerce Sites

Créateur de boutiques et de landing pages sans code, relié à Flowmerce.
Conception : [flowmerce-sites.md](flowmerce-sites.md).

## Démarrage local

Prérequis : Node 24, Docker.

```bash
npm install
cp .env.example .env.local      # puis remplacer AUTH_SECRET (32 caractères min.)
npm run db:up                   # PostgreSQL local sur 127.0.0.1:5434
npm run db:migrate
npm run db:seed
npm run dev                     # http://localhost:3100
```

Pour générer `AUTH_SECRET` :

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

| Adresse | Contenu |
|---|---|
| http://localhost:3100 | Espace vendeur — `vendeur@test.local` / `motdepasse-test` |
| http://test.localhost:3100 | Site public du vendeur de test |

Les navigateurs envoient `*.localhost` vers la machine locale : aucun réglage DNS
ni fichier `hosts` n'est nécessaire. Le port 3100 laisse le 3000 à
`flowmerce-web-app`, pour faire tourner les deux en même temps.

## Tests

```bash
npm test            # tests unitaires
npm run test:int    # tests d'intégration, sur la base flowmerce_sites_test
npm run typecheck
npm run lint
```

Les tests n'importent pas `vitest` : ils utilisent ses globales (`it`, `expect`…).
Sous Windows, un terminal ouvert avec une lettre de lecteur en minuscule (`c:\`)
charge vitest deux fois, et l'import direct échoue.

## Organisation

- `proxy.ts` décide, à partir du seul nom d'hôte et sans requête en base, entre
  l'espace vendeur (`DASHBOARD_HOST`) et un site (réécrit vers `app/s/[host]/…`).
- `lib/tenant.ts` résout l'hôte en site publié, avec cache et tags d'invalidation.
- `app/(dashboard)` : espace vendeur, protégé par la session.
- `app/(auth)/login` : connexion provisoire (remplacée par le SSO Flowmerce en Phase 3).
