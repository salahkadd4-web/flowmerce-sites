# Phase 1A — Éditeur visuel et publication (conception)

> 18 novembre 2026 — premier des trois chantiers de la Phase 1 de `flowmerce-sites.md` v0.2 (§2.2, §2.3, §4.2, §7, §8).
> Chantiers suivants : **1B** produit, livraison par wilaya, formulaire COD et réception des commandes ; **1C** commandes dans le tableau de bord.

## Intention

Permettre à un vendeur de **créer son site, composer sa landing page dans un éditeur visuel et la publier** sur son sous-domaine, sans écrire de code. C'est la base sur laquelle 1B ajoutera la fiche produit et le formulaire de commande COD.

Tout reste **local** et **séparé de Flowmerce** : aucun appel à `flowmerce-web-app`, aucune modification de ce dépôt (la liaison viendra plus tard).

**Livrable :** un vendeur connecté sur `http://localhost:3100` crée un site « ma-boutique », ouvre l'éditeur, modifie le titre, ajoute une image, publie, et `http://ma-boutique.localhost:3100` affiche immédiatement la page publiée, rapide sur mobile.

## Objectifs

1. **Créer un site** depuis « Mes sites » : nom, sous-domaine, modèle (un seul : « Landing page — produit unique », en français).
2. **Éditeur Puck** (`@puckeditor/core` 0.24) sur l'hôte vendeur : glisser-déposer, réglages par bloc, aperçu mobile / desktop.
3. **Blocs 1A** : Hero, Texte, Image, Pied de page.
4. **Brouillon et publication** : « Enregistrer » garde le brouillon ; « Publier » le rend public, conserve une version (`PageVersion`) et invalide le cache tout de suite.
5. **Aperçu du brouillon** pour le vendeur, avant publication.
6. **Images** : envoi depuis l'éditeur, stockage local derrière une interface remplaçable par un stockage objet (§4.2).
7. **Rendu public** des pages par le rendu serveur de Puck : aucun JavaScript de l'éditeur envoyé à l'acheteur.
8. Les points de la relecture de la Phase 0 qui touchent ce chantier (liste en fin de document).

## Non-objectifs

Produit, variantes, frais de livraison, formulaire COD, commandes (1B, 1C). Thème global du site, multi-pages, menu, historique des versions avec restauration, pages bilingues (Phase 3). Arabe / RTL (Phase 3, sauf si le temps le permet en 1B). Domaines personnalisés (Phase 4). Liaison Flowmerce.

## Anti-objectifs (échec même si « ça marche »)

- Une page publique qui charge le code de l'éditeur, ou dépasse nettement 2,5 s en 4G (§9).
- Du HTML ou un lien `javascript:` qu'un vendeur peut injecter dans une page (§7).
- Un vendeur qui peut lire, modifier ou publier la page d'un autre vendeur.
- Un bloc mal formé qui met toute la page hors ligne.
- Une publication que le vendeur ne voit pas tout de suite sur son site.

## Contraintes

- Stack et conventions de la Phase 0 : Next 16, Prisma 7, NextAuth 5.0.0-beta.32, Tailwind 4, zod 3, vitest (globales, pas d'import de `vitest`), port 3100, `*.localhost`.
- Toute server action de l'espace vendeur appelle `isDashboardHost` (`lib/dashboard-host.ts`) et vérifie que la ressource appartient à l'utilisateur connecté (`Tenant.ownerUserId`).
- Lire la doc embarquée de Next (`node_modules/next/dist/docs/`) avant d'utiliser une API Next (consigne `AGENTS.md`).
- UI de l'espace vendeur : pièces copiées de `flowmerce-web-app` en Phase 0 (`components/dashboard/ui.tsx`, `AuthShell`, jetons `@theme`) — on les réutilise, on ne restyle pas.
- Le JSON de page reste au format Puck `{ root: { props }, content: [{ type, props }] }` (déjà le cas en Phase 0).

## Approches envisagées

1. **Une seule configuration Puck pour l'éditeur et le rendu public (retenue).** Chaque bloc est un composant React écrit une fois. L'éditeur (`<Puck>`, composant client) et la page publique (`Render` de `@puckeditor/core/rsc`, composant serveur) partagent la même configuration. Seuls les blocs interactifs (formulaire COD en 1B, compte à rebours plus tard) sont des composants client. *Pour :* une seule source par bloc, rendu serveur léger. *Contre :* le rendu public dépend de Puck.
2. **Puck dans l'éditeur, rendu public maison** (extension du `RenderPage` de la Phase 0). *Pour :* contrôle total du HTML public. *Contre :* deux correspondances bloc → composant à tenir à jour ; chaque bloc coûte deux fois.
3. **GrapesJS** (alternative citée en §11.4). Écartée : produit du HTML libre, contraire à §4.2 (pages en JSON, blocs en composants React) et §7 (pas de HTML arbitraire).

**Choix :** approche 1. Salah a délégué le choix (« le plus professionnel ») ; c'est l'approche qui tient le mieux la vitesse mobile et le coût de maintenance.

## Conception

### Un bloc = un dossier

```
blocks/
  hero/        Hero.tsx      schema.ts   config.ts
  text/        Text.tsx      schema.ts   config.ts
  image/       Image.tsx     schema.ts   config.ts
  footer/      Footer.tsx    schema.ts   config.ts
  fields/      MediaField.tsx            # champ Puck « image » (client)
  puck.config.ts                          # assemble les configs → Config Puck
  schemas.ts                              # type de bloc → schéma zod
```

- `schema.ts` : schéma **zod** des props du bloc (longueurs maximales, URL autorisées, valeurs d'énumération). C'est la seule définition de ce qui est valide ; elle sert à la fois à l'enregistrement (server actions) et au rendu (filtrage).
- `config.ts` : la config Puck du bloc (libellé français, `fields`, `defaultProps`, `render`).
- `X.tsx` : le composant, sans hook ni API navigateur pour les quatre blocs de 1A (compatibles serveur).

### Blocs de 1A

| Bloc | Réglages (libellés vus par le vendeur) |
|---|---|
| **Hero** | Titre (≤ 120), Sous-titre (≤ 300), Image (facultative), Texte du bouton (≤ 40), Lien du bouton (défaut `#commande`), Alignement (gauche / centre), Fond (palette fixe : Clair, Sombre, Indigo, Sable) |
| **Texte** | Titre (facultatif, ≤ 120), Texte (≤ 3 000 ; les paragraphes sont séparés par une ligne vide), Alignement |
| **Image** | Image, Texte alternatif (obligatoire, ≤ 150), Légende (facultative, ≤ 200), Largeur (pleine / contenue) |
| **Pied de page** | Nom de la boutique, Téléphone, Email, Facebook, Instagram, TikTok (URL), Politique de retour (≤ 1 000) |

- **Aucun HTML** : tout texte est rendu comme texte React ; les sauts de paragraphe sont la seule mise en forme.
- **Liens** : accepter seulement `#ancre`, `https://`, `http://`, `tel:`, `mailto:`. Refuser `javascript:`, `data:` et tout le reste (validation zod, testée).
- **Couleurs** : palette fixe de jetons, pas de sélecteur libre — garde un rendu propre et évite toute injection de style. Le thème global (couleur de marque du site) arrive en Phase 3.
- **Images publiques** : rendues par `next/image` avec `sizes` adaptés au mobile.

### Validation : stricte à l'enregistrement, tolérante à l'affichage

- Chaque schéma de bloc accepte l'`id` que Puck donne à chaque bloc ; la page accepte `zones` vide ou absent (pas de zones ni de slots en 1A).
- **Enregistrement** (`saveDraft`, `publishPage`) : le JSON entier est validé ; un bloc invalide ou de type inconnu → refus avec un message clair (le vendeur corrige dans l'éditeur). Rien d'invalide n'entre en base.
- **Affichage** (`parsePageContent`) : la forme de la page est vérifiée, puis **chaque bloc séparément** ; un bloc invalide est écarté (et journalisé), les autres s'affichent. Règle le point « un bloc mal formé met la page en 404 » de la relecture.

### Rendu public

- `app/s/[host]/[[...slug]]/page.tsx` rend `Render` (`@puckeditor/core/rsc`) avec la config partagée et le contenu filtré.
- **Layout racine propre aux sites** : les sites n'héritent plus du layout de l'espace vendeur. Deux layouts racines (Next les permet par groupes de routes) : `app/(vendor)/layout.tsx` pour l'espace vendeur, l'auth et l'éditeur (police Jakarta, `lang="fr"`) ; un layout racine pour `app/s/…` avec `lang` et `dir` venant du site, pile de polices système (aucune police à télécharger pour l'acheteur). Le réalisateur vérifie dans la doc Next que `app/s/layout.tsx` peut être racine ; sinon `app/(sites)/s/…`.
- `not-found.tsx` neutre pour les sites (« Page introuvable », sans marque Flowmerce).
- Titre de la page : `root.props.title`, sinon titre de la page, sinon nom du site — les chaînes vides comptent comme absentes.

### Éditeur

- Route `app/(vendor)/(editor)/edit/[pageId]/page.tsx` (hôte vendeur) : composant serveur qui vérifie la session et la propriété, charge le **brouillon**, puis rend un composant client `<Editor>` (`<Puck>` + `@puckeditor/core/puck.css`, importés uniquement ici).
- En-tête de l'éditeur (override Puck) : retour « Mes sites », nom du site, boutons **Aperçu**, **Enregistrer**, **Publier** ; état visible (« Modifications non enregistrées », « Enregistré », « Publié »). Avertissement si on quitte avec des modifications non enregistrées.
- Aperçus Puck : **Mobile 360 px** (par défaut, la majorité du trafic) et **Bureau 1280 px**.
- Libellés des blocs et des champs en français. L'interface propre à Puck reste en anglais si Puck 0.24 ne permet pas de la traduire — le réalisateur vérifie et le signale.

### Brouillon, publication, versions

- `saveDraft(pageId, data)` : valide, écrit `Page.draft`.
- `publishPage(pageId, data)` : dans une transaction — écrit `draft` et `published`, crée une `PageVersion`, passe le site de `DRAFT` à `PUBLISHED` s'il l'était ; puis `updateTag` sur les tags de la page et du site (lecture immédiate, doc Next 16 `updateTag`).
- Site `SUSPENDED` : l'enregistrement reste possible, la publication est refusée (« Ce site est suspendu ») — publier ne doit jamais lever une suspension.
- `PageVersion` (§5) est **écrite** dès maintenant ; l'interface d'historique et de restauration reste en Phase 3.
- **Aperçu** : `app/(vendor)/preview/[pageId]` sur l'hôte vendeur rend le **brouillon** avec le même `Render`, propriétaire seulement, avec un bandeau « Aperçu — non publié ».

### Création de site

- Bouton « Créer un site » sur « Mes sites » → `/sites/new` : Nom (≤ 60), Sous-domaine (pré-rempli à partir du nom, modifiable, affiché avec l'adresse complète), Modèle (une carte « Landing page — produit unique »).
- Pré-remplissage : minuscules, accents retirés (« Élégance Shop » → `elegance-shop`), espaces et caractères non autorisés → `-`, tirets répétés fusionnés.
- Sous-domaine : `^[a-z0-9](?:[a-z0-9-]{1,61}[a-z0-9])$` (3 à 63 caractères), pas dans `RESERVED_SUBDOMAINS`, unique (erreur `P2002` → « Ce sous-domaine est déjà pris »). Validation partagée avec un test.
- `createSite` : crée le `Tenant` de l'utilisateur s'il n'en a pas (§4.5 : le tenant naît avec le premier site), le `Site` (`LANDING`, `DRAFT`, `theme: {}`, `locale: "fr"`) et sa page d'accueil (`slug ""`) à partir du modèle `templates/landing-fr.json` (brouillon seulement, rien de publié). Puis redirection vers l'éditeur.
- Le modèle contient : Hero (« Le nom de votre produit », bouton « Commander maintenant » → `#commande`), Texte (trois avantages à remplacer), Image (vide, à choisir), Pied de page. En 1B, la fiche produit et le formulaire COD (ancre `commande`) s'y ajoutent.

### Images (Media)

- Modèle `Media` (§5) : `tenantId`, `key`, `url`, `mimeType`, `width`, `height`, `sizeBytes`.
- `lib/storage.ts` : interface `{ put(key, bytes, mimeType), get(key) }` ; pilote **local** (dossier `storage/uploads/`, ignoré par git) ; un pilote S3 / Vercel Blob la remplacera au déploiement sans toucher au reste.
- Envoi : route `POST /api/media` (hôte vendeur seulement, session obligatoire). Formats : JPEG, PNG, WebP, AVIF — **vérifiés par leur signature d'octets**, pas par l'extension ni le type annoncé ; **pas de SVG** (risque de script). Taille ≤ 5 Mo. Dimensions lues à l'envoi.
- Service : `GET /media/<key>` — chemin relatif, servi sur **tous les hôtes** (le proxy le laisse passer aussi sur les sites), avec le bon `Content-Type`, `X-Content-Type-Options: nosniff`, cache long immuable. Clé = identifiant aléatoire + extension ; tout chemin hors de ce format → 404 (pas de traversée de dossier).
- Chemin relatif plutôt qu'URL absolue : `next/image` l'optimise via `images.localPatterns` (`/media/**`) sur n'importe quel hôte, et contourne le blocage des IP locales de Next 16.

### Proxy

- Sur les hôtes de site, remplacer la liste noire `/api/*` par une **liste blanche** : `/media/…` en lecture ; `/api/orders` sera ajouté en 1B. Toute autre route `/api` → 404.
- Le reste des règles de la Phase 0 est inchangé (server actions et écritures refusées sur les sites).

### Cache et tags

- Ajouter le tag `site:<id>` aux résolutions hôte → site, pour suspendre ou republier un site d'un coup.
- `publishPage` et `createSite` invalident les tags concernés par `updateTag`.
- Supprimer le double `decodeURIComponent` du paramètre `host` (Next le décode déjà).

### Points de la relecture Phase 0 traités ici

Liste blanche `/api` (Proxy) ; bloc mal formé (Validation) ; tag `site:<id>` ; `not-found` des sites ; double décodage ; titre vide ; `/login` redirige un vendeur déjà connecté vers « Mes sites » ; docstring de `normalizeHost` + cas `hôte.:port`. **Reste pour la mise en ligne :** cache illimité pour les hôtes inconnus.

## Tests attendus (le plan les détaillera)

- Schémas de blocs : valeurs limites, liens refusés (`javascript:`, `data:`), texte avec `<script>` rendu échappé.
- `parsePageContent` : bloc invalide écarté, les autres conservés.
- Server actions (intégration) : un vendeur ne peut ni lire, ni enregistrer, ni publier, ni prévisualiser la page d'un autre ; publication → `published`, `PageVersion`, statut du site ; refus hors hôte vendeur.
- Création de site : sous-domaine invalide, réservé, déjà pris ; tenant créé au premier site.
- Media : signature d'octets (un PNG renommé en `.jpg` passe, un SVG ou un texte renommé en `.png` est refusé), taille, clé invalide → 404, isolation (seul un vendeur connecté envoie).
- Proxy : `/media/…` servi sur un site, `/api/autre` refusé sur un site.
- Bout en bout (manuel) : le livrable ci-dessus, dans le navigateur, en vue mobile.

## Décisions prises par Claude (à corriger si besoin)

1. Approche 1, rendu public par `@puckeditor/core/rsc` (choix délégué).
2. Blocs de 1A : Hero, Texte, Image, Pied de page. Fiche produit et formulaire COD en 1B (ils ont besoin du produit). Galerie, FAQ, vidéo, séparateur plus tard.
3. Palette de fonds fixe au lieu d'un sélecteur de couleur libre.
4. Enregistrement explicite (« Enregistrer » / « Publier ») avec avertissement à la sortie, pas d'enregistrement automatique.
5. `PageVersion` écrite à chaque publication, sans interface (Phase 3).
6. Aperçu du brouillon sur l'hôte vendeur.
7. Stockage d'images local derrière une interface ; SVG refusé ; 5 Mo maximum.
8. Images servies en chemin relatif `/media/…` sur tous les hôtes.
9. Layout racine séparé pour les sites, polices système.
10. Création de site minimale (nom, sous-domaine, modèle) ; l'assistant complet de §2.1 viendra plus tard.
11. Un seul `Tenant` par utilisateur : `Tenant.ownerUserId` devient **unique** (migration), ce qui évite deux tenants créés en double lors d'un premier site (§4.5 : un vendeur = un tenant).
12. La publication est refusée sur un site suspendu.
13. Lecture des dimensions d'image : une petite bibliothèque dédiée (par ex. `image-size`) plutôt qu'un traitement d'image complet ; pas de redimensionnement à l'envoi, `next/image` s'en charge à l'affichage.

## Limites connues

- L'interface propre à Puck (barres, menus) est en anglais si Puck 0.24 ne se traduit pas ; les libellés des blocs et des champs sont en français.
- Les images restent sur le disque local tant que le stockage objet n'est pas branché (déploiement).

## Laissé au réalisateur

Le déplacement de `app/layout.tsx`, `app/(dashboard)` et `app/(auth)` sous `app/(vendor)/` ; la vérification de bout en bout que `next/image` optimise bien `/media/…` sur un hôte de site (requête interne à travers le proxy). Mise en page fine des blocs (dans les jetons existants), textes d'exemple du modèle, organisation interne de l'éditeur, nom exact des fichiers sous `app/(vendor)`, forme de l'en-tête d'éditeur dans le style de `PageHeader`.
