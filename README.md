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

## Créer et publier une landing page

1. Sur http://localhost:3100, **Créer un site** : un nom, un sous-domaine (proposé à
   partir du nom), le modèle « Landing page — produit unique ».
2. L'éditeur s'ouvre (vue Mobile par défaut) : cliquez un bloc pour le régler à droite,
   glissez les blocs de la colonne de gauche pour en ajouter.
3. **Enregistrer** garde le brouillon ; **Aperçu** l'affiche tel que les acheteurs le
   verront ; **Publier** le met en ligne immédiatement sur `http://<sous-domaine>.localhost:3100`.

Les images envoyées sont stockées dans `storage/uploads/` (ignoré par git) et servies
sous `/media/…`. Au déploiement, `lib/storage.ts` recevra un pilote de stockage objet.

## Recevoir des commandes (paiement à la livraison)

1. **Produits** → **Nouveau produit** : nom, prix, prix barré, photos, options (jusqu'à
   deux, ex. Taille : 38, 39, 40) et stock par combinaison.
2. **Mes sites** → **Livraison** : prix domicile et bureau par wilaya (69 wilayas) ; une
   wilaya sans prix domicile n'est pas proposée.
3. Dans l'éditeur, réglages de la page → **Produit de la page**, puis **Publier**. La fiche
   produit et le formulaire de commande affichent ce produit, toujours à jour (prix, stock).
4. L'acheteur remplit le formulaire et reçoit une référence (page Merci). Le serveur
   recalcule tous les montants, ignore les doubles envois et freine les robots.
5. **Commandes** : liste (filtres par statut et par site, export CSV), détail avec bouton
   **Appeler**, changement de statut et historique. Le stock baisse à la **confirmation**
   et revient à l'annulation après confirmation ou au retour.

| Statut | Suites possibles |
|---|---|
| Nouvelle | Confirmée, Annulée |
| Confirmée | Expédiée, Annulée |
| Expédiée | Livrée, Retournée |
| Livrée | Retournée |

Wilayas et communes : `lib/algeria/` (69 wilayas, 1 577 communes, mêmes données que Caba-Store).

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
- `app/(vendor)` : espace vendeur (layout racine avec la police de la marque) —
  `(dashboard)` protégé par la session, `(auth)/login` (connexion provisoire, remplacée
  par le SSO Flowmerce en Phase 3), `(editor)/edit` et `preview`.
- `app/s/[host]` : sites publics, avec leur propre layout racine (langue du site,
  polices système) ; rendu serveur de Puck, sans code de l'éditeur.
- `blocks/` : un dossier par bloc (schéma zod, composant, réglages Puck) ;
  `blocks/puck.config.ts` sert à l'éditeur comme au rendu public.
