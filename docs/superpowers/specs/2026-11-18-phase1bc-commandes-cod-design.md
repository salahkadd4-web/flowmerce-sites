# Phase 1B + 1C — Produit, formulaire COD et commandes (conception)

> 18 novembre 2026 — fin de la Phase 1 de `flowmerce-sites.md` v0.2 (§2.2, §2.4, §2.6, §3.2, §4.3, §5, §7, §8).
> 1A (éditeur, publication, images) est sur `main`. Tout reste local et séparé de Flowmerce.

## Intention

Livrable de la Phase 1 (§8) : **« un vendeur crée une landing page et reçoit des commandes »**. Un acheteur arrive de la publicité, voit le produit, remplit le formulaire de paiement à la livraison et reçoit une référence ; le vendeur voit la commande, la confirme par téléphone, la fait avancer jusqu'à la livraison ou au retour, avec l'historique de chaque changement.

## Objectifs

**1B — côté vendeur**
1. Page **Produits** : catalogue du vendeur (rattaché au tenant, utilisable sur tous ses sites — §2.4) : nom, description, prix, prix barré, photos, variantes (jusqu'à deux axes, ex. Taille × Couleur) avec stock par variante, actif / inactif.
2. Page **Livraison** d'un site : prix domicile et prix bureau (facultatif) pour chacune des 69 wilayas ; une wilaya sans prix n'est pas proposée à l'acheteur.
3. Dans l'éditeur, réglage de page **« Produit de la page »** : le produit vendu par la landing.

**1B — côté acheteur**
4. Bloc **Fiche produit** : photos, nom, prix, prix barré et économie, description, choix disponibles, rupture de stock, bouton vers le formulaire.
5. Bloc **Formulaire de commande** (ancre `#commande`) : nom, téléphone, wilaya, commune, adresse, domicile / bureau, variante(s), quantité, récapitulatif (sous-total, livraison, total), bouton « Confirmer la commande ».
6. Page **Merci** du site, avec la référence de la commande.

**1C — côté vendeur**
7. Page **Commandes** : liste de toutes les commandes du vendeur, la plus récente d'abord ; filtres par statut et par site ; export CSV de la liste filtrée.
8. **Détail d'une commande** : client (téléphone cliquable pour la confirmation par appel), adresse, lignes, totaux, provenance ; **changement de statut** avec note facultative ; **historique** (qui, quand, ancien → nouveau statut).

## Non-objectifs

Tout ce qui touche Flowmerce : score de fraude, suivi, notifications, réclamations, outbox (Phase 2). Pixels publicitaires (Phase 2). Panier et commande multi-produits, catalogue public, guide des tailles, avis (Phase 3). Captcha invisible (service extérieur, à la mise en ligne). Intégration transporteurs (Phase 5). Paiement en ligne (§1.4).

## Anti-objectifs

- Un prix, un frais de livraison ou un total calculé par le navigateur et cru par le serveur.
- Une commande enregistrée deux fois pour un double clic ou un nouvel essai.
- Un acheteur qui attend un service extérieur pour voir « merci » (§4.5).
- Un vendeur qui voit ou modifie les commandes, produits ou frais d'un autre.
- Des commandes fictives qui bloquent le stock (§2.4 : stock décrémenté à la confirmation).
- Le formulaire qui remet du code d'éditeur dans les pages publiques (garde `blocks/server-graph.test.ts`).

## Contraintes

- Conventions de 1A : `isDashboardHost` + `auth()` + propriété dans toute action vendeur ; pièces de `components/dashboard/ui.tsx` ; tests en globales vitest ; migrations par `prisma migrate diff` ; garde clavier de l'éditeur ; port 3100.
- Les server actions sont refusées sur les hôtes de site (Phase 0) : le formulaire appelle **`POST /api/orders`**, ajouté à `SITE_API_ALLOWLIST`.
- Montants en dinars entiers (`Int`), comme §5.

## Approches envisagées (données produit dans les pages)

1. **Données produit fraîches injectées au rendu (retenue).** Les blocs ne stockent que l'identifiant du produit (réglage de page). La page publique charge les produits référencés (en cache, tag par tenant) et les passe à `Render` par la prop `metadata` de Puck ; l'éditeur passe de même les produits du vendeur à `<Puck metadata>`. Prix et stock toujours à jour ; une modification de produit invalide le tag.
2. Copie du produit dans le JSON de la page à l'édition (`resolveData`). Pages autonomes, mais prix et stock périmés jusqu'à la republication — contraire à §4.3 (« revalidation de la page quand le produit change »).
3. Composants serveur asynchrones qui lisent la base. Impossible à afficher dans l'éditeur (composant client) : pas d'aperçu fidèle.

**Choix :** approche 1 (choix délégué : Salah parle de résultat, la technique est laissée à Claude).

## Conception

### Référentiel wilayas / communes

- Copie de `../Caba-Store/public/Wilaya_Commune_FR.json` et `…_AR.json` (69 wilayas, 1 577 communes, données de Salah) dans `lib/algeria/`, avec `wilayas.ts` (code, nom FR/AR) dérivé comme dans Caba-Store.
- `wilayaCode` stocké en entier (1 à 69, §5). La commune choisie doit appartenir à la liste de sa wilaya (vérifié au serveur).
- Le formulaire public ne télécharge que la liste des wilayas desservies ; les communes de la wilaya choisie sont chargées à la demande (`GET /api/orders/communes?wilaya=16`, servi depuis le JSON, en cache long) pour ne pas alourdir la page (~38 ko).

### Modèle de données (§5, adapté)

- `Product`, `Variant`, `ShippingRate`, `Order`, `OrderItem`, `OrderStatusEvent` comme §5, plus :
  - `Product.optionAxes Json` : jusqu'à deux axes `[{ name: "Taille", values: ["39","40"] }, …]` ; les `Variant` sont les combinaisons (une variante unique `{}` sans axe). Stock par variante.
  - `Order.reference String @unique` : référence courte lisible donnée à l'acheteur (ex. `K7Q4-M2XP`, alphabet sans 0/O/1/I).
  - `RateLimit { key String @id, count Int, resetAt DateTime }` : compteur local de la limitation de débit (Redis / Upstash au déploiement, même interface).
- **Écart avec §5 :** pas de relation explicite `Site.products` — le produit d'une page est l'identifiant choisi dans l'éditeur, et la commande vérifie qu'il appartient au tenant du site.

### Réception d'une commande — `POST /api/orders` (hôte de site)

1. Le site est résolu par l'en-tête `Host` (jamais par le corps) ; site `PUBLISHED` seulement.
2. Corps JSON validé (zod) : `idempotencyKey` (UUID créé à l'ouverture du formulaire), `productId`, `variantId`, `quantity` (1 à 10), `customerName` (2–80), `phone`, `wilayaCode`, `commune`, `address` (5–200), `deliveryType`, champ piège `website` (doit rester vide), `startedAt` (envoi refusé moins de 3 s après l'ouverture : robot).
3. Requête `Content-Type: application/json` exigée et `Origin` égal à l'hôte (pas de formulaire posté depuis un autre site).
4. **Idempotence :** une clé déjà vue renvoie la même commande (réponse identique, rien de créé).
5. **Limitation de débit :** 5 commandes / 10 min par IP, 3 / heure par téléphone (constantes nommées) → « Trop de commandes en peu de temps. Réessayez plus tard. »
6. Téléphone algérien : mobile `0[5-7]` + 8 chiffres ou fixe `0[2-4]` + 7 chiffres, avec `+213` / `00213` acceptés, espaces / points / tirets ignorés ; stocké normalisé `+213…`.
7. Produit actif du tenant du site, variante de ce produit, stock de la variante ≥ quantité (sinon « Ce choix est en rupture de stock ») ; wilaya desservie, `OFFICE` seulement si le prix bureau existe.
8. **Le serveur calcule tout** : prix unitaire, sous-total, frais, total. Copie du nom, des options et du prix dans `OrderItem` (§5).
9. Transaction : `Order` (`NEW`, IP, user agent, UTM lus de la page envoyés en `source`), `OrderItem`, `OrderStatusEvent` (`null → NEW`, acteur `client`). Réponse `{ reference }` ; le navigateur va sur `/merci?ref=<référence>`.
10. Aucun appel extérieur : l'acheteur ne dépend que de la base (§4.5).

### Page Merci

`app/s/[host]/merci/page.tsx` (segment statique, prioritaire sur `[[...slug]]`) : « Merci ! Votre commande est enregistrée », référence (lue dans l'URL, sans lecture en base : rien d'autre n'est exposé à qui devinerait une référence), « Le vendeur va vous appeler pour confirmer », lien retour à l'accueil du site. `merci` rejoint les slugs réservés des pages.

### Données passées aux blocs (`metadata` de Puck)

- `metadata = { products: Record<id, PublicProduct>, shipping: ShippingOption[] }` — la même forme dans l'éditeur (produits actifs du vendeur, frais du site) et sur le site public (seulement le produit de la page, frais du site).
- `PublicProduct` : `id, name, description, price, comparePrice, images[], optionAxes, variants[{ id, options, inStock }]` — **jamais** le stock exact ni rien d'interne : c'est envoyé au navigateur avec le formulaire.
- `ShippingOption` : `{ wilayaCode, name, home, office | null }`, wilayas desservies seulement.
- Chargement public mis en cache avec les tags `tenant-products:<tenantId>` et `site-shipping:<siteId>`, invalidés par `updateTag` à l'enregistrement d'un produit ou des frais.

### Blocs (1B)

- **Réglage de page « Produit de la page »** : `root.props.productId` (chaîne, facultatif), ajouté au schéma de la racine dans `lib/page-content.ts`. Champ `select` dont les options viennent de `metadata.products` par `resolveFields` ; si Puck 0.24 ne fournit pas `metadata` à `resolveFields` de la racine, champ `custom` client qui lit `metadata` via `useGetPuck` (branché dans `editor-config.ts`, comme `MediaField`).
- **Fiche produit** (`ProductBlock`, composant serveur) : lit le produit dans `puck.metadata` ; photos en défilement horizontal (CSS `scroll-snap`, sans JavaScript), prix et prix barré (« Économisez 1 500 DA »), description en paragraphes, axes et valeurs disponibles, « Rupture de stock » si toutes les variantes sont à 0 ; bouton « Commander » vers `#commande`. Sans produit choisi : rien sur le site, un emplacement dans l'éditeur.
- **Formulaire de commande** (`OrderFormBlock`) : enveloppe serveur `<section id="commande">` + composant client `OrderForm` (seul JavaScript de la page). Champs dans l'ordre de §2.2, `autocomplete` adaptés (`name`, `tel`, `street-address`), clavier numérique pour le téléphone, erreurs sous chaque champ, état d'envoi, récapitulatif recalculé à chaque choix (indicatif ; le serveur fait foi). Le client `OrderForm` n'importe rien de Puck.
- Modèle `landing-fr.json` : Bannière, Fiche produit, Texte, Formulaire, Pied de page. Les sites existants ne changent pas.

### Espace vendeur

- Navigation : **Mes sites**, **Produits**, **Commandes**.
- **Produits** (`/produits`, `/produits/new`, `/produits/[id]`) : liste (photo, nom, prix, stock total, actif) ; formulaire avec photos (composant d'envoi partagé `components/media/ImageUploader.tsx`, que `MediaField` réutilise), axes de variantes saisis comme « Taille : 38, 39, 40 », tableau de stock par combinaison. Modifier un produit invalide le tag des pages du tenant.
- **Livraison** (`/sites/[id]/livraison`) : tableau des 69 wilayas, deux prix par ligne, action « Appliquer le même prix à toutes les wilayas », enregistrement en une fois.
- **Commandes** (`/commandes`, `/commandes/[id]`, export `GET /commandes/export`) — pièces `PageHeader`, `Card`, `StatusBadge`-like, `EmptyState`, pagination simple (50 par page).

### Statuts (1C)

| De | Vers possibles |
|---|---|
| NEW | CONFIRMED, CANCELLED |
| CONFIRMED | SHIPPED, CANCELLED |
| SHIPPED | DELIVERED, RETURNED |
| DELIVERED | RETURNED |
| RETURNED, CANCELLED | — |

- **Stock :** décrémenté à `CONFIRMED` (refusé si insuffisant : « Stock insuffisant pour confirmer »), restitué à `CANCELLED` depuis `CONFIRMED` et à `RETURNED`. Le tout dans la transaction du changement de statut, conditionnée au statut courant (deux clics simultanés ne passent pas deux fois).
- Chaque changement écrit un `OrderStatusEvent` (acteur = email du vendeur, note facultative ≤ 300).

### Sécurité et isolation

Toute requête vendeur filtrée par `tenant.ownerUserId` ; ressource d'un autre vendeur = « introuvable ». `/api/orders` : seul point d'écriture public, protégé par les points 1 à 8 ci-dessus. Export CSV : cellules commençant par `= + - @` préfixées d'une apostrophe (injection de formules dans Excel).

### Reports de la relecture de 1A traités ici

`/api/orders` dans la liste blanche ; `typeof pageId === "string"` (et tout identifiant reçu) vérifié dans les actions ; `priority` → `preload` ; plafond de 10 000 px par côté sur les images ; tests des refus hors hôte vendeur et de `GET /media` ; message adapté aux sites suspendus sur « Mes sites » ; texte alternatif de l'image de la Bannière.

## Décisions prises par Claude

1. Approche 1 (données produit injectées par `metadata`).
2. Référentiel 69 wilayas / 1 577 communes de Caba-Store (choix de Salah), communes chargées à la demande.
3. Un produit par landing, choisi au niveau de la page ; pas de relation `Site.products`.
4. Variantes : deux axes au plus, stock par combinaison.
5. Anti-spam local : champ piège, délai minimal de 3 s, limites IP / téléphone en base ; captcha à la mise en ligne.
6. Référence de commande courte et lisible, page Merci sans lecture en base.
7. Transitions de statut et règles de stock du tableau ci-dessus (restitution au retour et à l'annulation après confirmation).
8. Export CSV protégé contre l'injection de formules.
9. Quantité 1 à 10 par commande.

## Laissé au réalisateur

Mise en page fine des blocs et des pages vendeur (dans les jetons et pièces existants), textes d'aide, format exact du CSV (colonnes de la liste + lignes), découpage des composants du formulaire de produit.
