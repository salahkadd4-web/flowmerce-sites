# Flowmerce Sites — Créateur de boutiques et de landing pages sans code

> Document de conception et plan de réalisation — v0.2 (14 novembre 2026)
> Dépôt prévu : `flowmerce-sites` (séparé de `flowmerce-web-app`, relié par API)
>
> **Changements v0.2 :** modèle économique (§3), corrections d'architecture (§4), modèle de données renforcé sur les commandes et la facturation (§5), démo du 5 décembre resserrée (§8), décisions et risques restructurés (§11). Les choix marqués **(proposé)** restent à confirmer.

---

## 1. L'idée

**Flowmerce Sites** permet à n'importe quel e-commerçant algérien de créer sa boutique en ligne ou sa landing page de vente **sans écrire une ligne de code**, avec :

- un **éditeur visuel** par blocs (textes, images, boutons, produits, formulaire de commande) ;
- une **adresse immédiate** en sous-domaine (`maboutique.flowmerce.dz`), que le vendeur peut garder indéfiniment ;
- la possibilité **d'acheter un nom de domaine** depuis la plateforme ou de **connecter un domaine existant** ;
- **toutes les fonctionnalités Flowmerce déjà branchées** et activables en un clic : score de fraude sur les commandes COD, suivi des commandes, notifications client, gestion des réclamations et retours, analyse produit et Flowmerce Brain.

### 1.1 Le problème
- Beaucoup de vendeurs algériens vendent via Facebook/Instagram et gèrent leurs commandes dans Google Sheets ou sur un WordPress mal maintenu.
- Les outils existants de création de boutiques ne traitent pas le vrai problème du marché : **le paiement à la livraison, les commandes fictives et les retours**.
- Intégrer Flowmerce dans une plateforme tierce demande une intégration technique (clé API, webhook, formulaire embarqué) que beaucoup de vendeurs ne savent pas faire.

### 1.2 La proposition
Une boutique créée sur Flowmerce Sites est **déjà reliée à Flowmerce** dès sa création. Le vendeur n'a rien à brancher : il active depuis son tableau de bord les fonctionnalités Flowmerce dont il a besoin (options payantes, §3). Une fois l'option active, chaque commande passe par le score de fraude, chaque changement d'état peut notifier le client, chaque réclamation arrive dans son espace Flowmerce.

### 1.3 Cibles
| Profil | Besoin principal |
|---|---|
| Vendeur réseaux sociaux | Une landing page produit avec formulaire COD, rapidement |
| Petit e-commerçant | Une vraie boutique avec catalogue, sans développeur |
| Vendeur sous WordPress/Sheets | Migrer vers un outil qui réduit les retours et la fraude |
| Boutiques existantes (ia-store, Caba Store) | Continuer avec l'intégration API actuelle de Flowmerce |

### 1.4 Ce que le projet n'est pas (pour l'instant)
- **Pas une marketplace multi-vendeurs** avec catalogue central où l'acheteur parcourt toutes les boutiques. Cette couche pourra être ajoutée plus tard (voir §10).
- Pas de paiement en ligne obligatoire côté acheteur : le COD reste le mode principal.

### 1.5 Positionnement face aux outils existants
Le vendeur comparera Flowmerce Sites à YouCan, Lightfunnels, Shopify, WooCommerce et aux constructeurs de boutiques locaux. Une grille de comparaison reste à établir avant de fixer les prix (§3), sur quatre critères : prix mensuel, formulaire COD et livraison par wilaya, intégration des transporteurs, traitement de la fraude et des retours. Le quatrième critère est celui sur lequel Flowmerce Sites doit être nettement devant.

---

## 2. Fonctionnalités

### 2.1 Espace vendeur
- Inscription / connexion (compte unique, partagé avec Flowmerce).
- Assistant de création : nom de la boutique → choix d'un modèle → sous-domaine → première page publiée en moins de 10 minutes.
- Tableau de bord : sites, pages, produits, commandes, domaines, statistiques de visite.
- Abonnement et options : état de l'abonnement, activation des options Flowmerce (§3).
- Lien direct vers l'espace Flowmerce (réclamations, fraude, Brain).

### 2.2 Éditeur visuel (sans code)
- Glisser-déposer de **blocs** ; chaque bloc a des réglages simples (texte, image, couleur, alignement).
- Aperçu mobile / desktop (la majorité du trafic est mobile).
- Brouillon et publication ; historique des versions publiées (retour arrière possible).
- Thème global du site : couleurs, police, logo, favicon.
- Langues : français ou arabe (RTL), **une langue par site en première version (proposé)** ; les pages bilingues viennent ensuite (§8, Phase 3).

**Blocs de départ**
| Bloc | Rôle |
|---|---|
| Hero | Titre, sous-titre, image/vidéo, bouton d'appel à l'action |
| Galerie produit | Photos du produit avec zoom |
| Grille produits | Liste de produits du catalogue |
| Fiche produit | Prix, variantes (taille, couleur), stock |
| **Formulaire de commande COD** | Nom, téléphone, wilaya, commune, adresse, quantité, variante |
| Guide des tailles | Tableau de tailles (alimente l'analyse produit Flowmerce) |
| Avis clients | Avis réels collectés après livraison |
| FAQ | Questions / réponses |
| Compte à rebours / offre | Promotion limitée |
| Texte libre, image, vidéo, séparateur | Mise en page |
| Pied de page | Contacts, réseaux sociaux, politique de retour |

### 2.3 Types de sites
- **Landing page** : une page, un produit, un formulaire COD. Cas d'usage principal pour les publicités Facebook/TikTok.
- **Boutique** : accueil, catalogue, fiche produit, panier simple, page de commande, pages légales.
- **Pages système générées automatiquement** : suivi de commande, réclamation/retour (hébergée par Flowmerce), merci, 404.

### 2.4 Catalogue et commandes
- Produits avec variantes, prix, prix barré, stock, photos. Le catalogue appartient au vendeur et peut être utilisé sur plusieurs de ses sites **(proposé)**.
- Frais de livraison par wilaya (domicile / bureau).
- Commandes : statut (nouvelle, confirmée, expédiée, livrée, retournée, annulée), confirmation téléphonique, export.
- **Historique des statuts** : chaque changement est enregistré (qui, quand, ancien et nouveau statut).
- **Stock** : décrémenté à la confirmation de la commande par le vendeur, pas à la saisie du formulaire, pour que les commandes fictives ne bloquent pas le stock **(proposé)**.
- Plus tard : intégration avec les sociétés de livraison (création d'envoi, récupération des états). Tant qu'elle n'existe pas, les statuts sont mis à jour à la main par le vendeur ; la fiabilité du suivi et des notifications en dépend.

### 2.5 Domaines
Le vendeur a trois possibilités ; il peut rester sur son sous-domaine sans jamais acheter de domaine.

| Option | Fonctionnement |
|---|---|
| Sous-domaine | `boutique.flowmerce.dz`, inclus dans l'abonnement, instantané, SSL automatique |
| Domaine existant | Le vendeur ajoute un enregistrement DNS (CNAME / A) ; vérification automatique ; SSL automatique |
| Achat de domaine | Recherche de disponibilité, achat, configuration DNS automatique, renouvellement ; facturé en plus de l'abonnement |

- Quand un domaine personnalisé est actif, il devient l'adresse principale et le sous-domaine redirige vers lui.
- Extensions internationales (.com, .shop, .store…) : via l'API d'un registrar revendeur.
- Extension **.dz** : l'enregistrement passe par le CERIST (NIC.dz) avec pièces justificatives. Prévoir un **parcours semi-manuel** au départ (demande guidée + dépôt des pièces + suivi), à confirmer avec le registre.
- Paiement des domaines : moyen de paiement local (CIB / Edahabia via une passerelle algérienne).
- Le domaine racine des sous-domaines reste à décider (§11.3). `flowmerce.dz` sert d'exemple dans ce document ; le code le lit dans une variable `SITES_ROOT_DOMAIN`.

### 2.6 Fonctionnalités Flowmerce intégrées
| Fonctionnalité | Comment elle se branche sur un site | Option payante (§3) |
|---|---|---|
| **Score de fraude à la commande** | Chaque commande COD est envoyée à Flowmerce ; le vendeur voit un score et peut demander une confirmation renforcée (OTP, appel) ou refuser | Score de fraude |
| **Suivi des commandes** | Les changements d'état sont envoyés à Flowmerce par webhook ; le vendeur choisit les états qui déclenchent une notification | Suivi |
| **Notifications** | Email, puis WhatsApp et OTP SMS selon le canal choisi par le vendeur | Suivi |
| **Analyse produit** | Le guide des tailles et les variantes du site alimentent l'analyse : alertes de type « la pointure 39 taille trop petit » | Service ML |
| **Flowmerce Brain** | Mémoire des cas, système juste vendeur/client, décisions Repair / Exchange / Reject ; le remboursement reste une décision manuelle du vendeur | Service ML |
| **Réclamations / retours** | Lien « Faire une réclamation » sur la page de suivi → formulaire Flowmerce (pipeline photo commande → vendeur → client → retour) | À décider (§11.3) |

### 2.7 Marketing
- **Pixels publicitaires** : le vendeur saisit son identifiant de pixel Facebook et TikTok dans les réglages du site ; les événements « page vue » et « commande » sont envoyés. Indispensable pour la cible principale, qui vend par la publicité.
- Suivi des conversions côté serveur (Conversions API) : plus tard (§8, Phase 5).

---

## 3. Modèle économique

### 3.1 Principe
| Élément | Facturation |
|---|---|
| **Abonnement Basic** | Payant, récurrent. Donne accès à la création de landing pages et de sites : éditeur, modèles, sous-domaine, catalogue, commandes |
| **Option Score de fraude** | Coût supplémentaire |
| **Option Service ML** | Coût supplémentaire (analyse produit, Flowmerce Brain) |
| **Option Suivi** | Coût supplémentaire (suivi des commandes, notifications client) |
| **Nom de domaine acheté** | Facturé à part, à l'achat puis à chaque renouvellement |

Les prix ne sont pas encore fixés (§11.3).

### 3.2 Conséquences sur le produit
- Chaque option s'active et se désactive séparément depuis le tableau de bord, sans réglage technique.
- Une option inactive reste visible dans l'interface, avec un bouton d'activation : le vendeur voit ce qu'il gagnerait.
- Les appels à Flowmerce ne partent que pour les options actives. Sans l'option Score de fraude, la commande est enregistrée et affichée sans score.
- L'usage de chaque option est compté dès le départ (commandes scorées, notifications envoyées, analyses ML), même si la facturation démarre au forfait. Cela laisse ouvert le choix entre forfait mensuel et facturation à l'usage.
- En cas d'abonnement impayé : rappel, puis délai de grâce, puis site suspendu (`SiteStatus.SUSPENDED`). Les données du vendeur sont conservées.
- Pendant la démo et les premiers pilotes, les options sont activées à la main par l'équipe Flowmerce ; le paiement en ligne de l'abonnement arrive en Phase 4, avec la même passerelle que les domaines.

---

## 4. Architecture

### 4.1 Vue d'ensemble

```
                    ┌──────────────────────────────┐
  Acheteur ───────▶ │  flowmerce-sites (Next.js)   │
  *.flowmerce.dz    │  ─ proxy.ts multi-tenant     │
  domaines perso    │  ─ rendu des pages (ISR)     │
                    │  ─ éditeur + dashboard       │
  Vendeur ────────▶ │  hôte de l'espace vendeur    │
                    └──────┬───────────────┬───────┘
                           │ Prisma         │ API REST + webhooks
                    ┌──────▼──────┐  ┌──────▼──────────────────┐
                    │ PostgreSQL  │  │ flowmerce-web-app        │
                    │ (sites)     │  │ fraude, suivi, retours,  │
                    └─────────────┘  │ notifications, Brain     │
                                     └──────┬──────────────────┘
                                            │
                                     ┌──────▼──────┐
                                     │ API ML      │
                                     │ (FastAPI)   │
                                     └─────────────┘
```

### 4.2 Choix techniques
| Élément | Choix | Raison |
|---|---|---|
| Framework | Next.js (App Router) + TypeScript | Même stack que Flowmerce |
| Base de données | PostgreSQL + Prisma | Même stack ; schéma propre au projet |
| Éditeur | Puck (éditeur visuel React open source) | Pages stockées en JSON, blocs = composants React, évite de coder le glisser-déposer |
| Style | Tailwind CSS | Thèmes par variables CSS |
| Hébergement | Projet Vercel dédié | Wildcard DNS + domaines personnalisés gérés par API |
| Médias | Stockage objet (S3 compatible ou Vercel Blob) + optimisation d'images | Photos produits légères sur mobile |
| Cache | Rendu statique incrémental (ISR) + revalidation à la publication | Pages rapides, peu de charge serveur |
| Auth | Compte unique partagé avec Flowmerce (SSO / JWT signé) | Le vendeur ne gère qu'un compte |
| Envois vers Flowmerce | Table `OutboxEvent` + tâche planifiée (cron) | Réessais sans infrastructure de file supplémentaire |
| Limitation de débit | Magasin clé-valeur type Redis (Upstash) | Compteurs par IP et par téléphone pour le formulaire COD |

### 4.3 Multi-tenant par nom de domaine
1. `proxy.ts` (le nom de `middleware.ts` à partir de Next.js 16) lit l'en-tête `host` de chaque requête.
2. Si `host` est l'hôte de l'espace vendeur → dashboard / éditeur.
3. Sinon → réécriture interne vers `/s/[host]/[...slug]`, **sans requête en base dans le proxy**.
4. La page `/s/[host]/...` résout `host` → site par une fonction mise en cache (sous-domaine ou table `Domain`), charge le JSON publié et le rend.
5. Le cache de résolution est invalidé quand un domaine est ajouté, vérifié ou retiré.

Points d'attention :
- Le dossier de rendu ne doit pas commencer par `_` : dans l'App Router, un dossier `_xxx` est privé et exclu du routage.
- Liste de sous-domaines réservés (`app`, `api`, `www`, `admin`, `mail`…).
- Isolation stricte : toutes les requêtes Prisma filtrées par `siteId` / `tenantId`.
- Stock et prix sur des pages statiques : revalidation de la page quand le produit change ; le stock est revérifié côté serveur à la commande.
- Le SSL wildcard sur Vercel exige que le domaine racine soit délégué aux serveurs de noms Vercel.

### 4.4 Domaines personnalisés
1. Le vendeur saisit son domaine.
2. Le système l'ajoute au projet Vercel via l'API et affiche les enregistrements DNS à créer.
3. Une tâche planifiée vérifie la configuration ; statut `PENDING` → `VERIFIED` → `ACTIVE`.
4. Le certificat SSL est émis automatiquement.
5. Le domaine devient l'adresse principale du site ; le sous-domaine redirige vers lui.

### 4.5 Lien avec Flowmerce

**Qui fait autorité (proposé)**
| Donnée | Système de référence |
|---|---|
| Commande, lignes, statut | Flowmerce Sites |
| Score de fraude, recommandation | Flowmerce |
| Réclamations, retours, décisions Brain | Flowmerce |
| Abonnement et options actives | Flowmerce Sites |

**Échanges**
- **À la création du compte vendeur** (premier site) : appel `POST /api/integrations/sites` → Flowmerce crée le vendeur (ou le rattache au compte existant) et renvoie une **clé API** stockée chiffrée. Un vendeur Flowmerce correspond à un `Tenant`, quel que soit son nombre de sites **(proposé)**.
- **À chaque commande** (option Score de fraude active) :
  1. La commande est enregistrée en base et l'acheteur voit la page « merci » tout de suite.
  2. Un événement est écrit dans `OutboxEvent` dans la même transaction, puis envoyé à `POST /api/orders` côté Flowmerce.
  3. Flowmerce renvoie le score et la recommandation, affichés au vendeur dans la liste des commandes.
  4. La confirmation renforcée (OTP, appel) se déclenche après coup, à l'initiative du vendeur.

  Le score est donc **asynchrone (proposé)** : l'acheteur n'attend jamais Flowmerce. Un score synchrone ne devient nécessaire que si l'OTP doit être demandé pendant la saisie du formulaire.
- **À chaque changement d'état** (option Suivi active) : événement outbox → webhook vers Flowmerce → notifications selon les états cochés par le vendeur.
- **Retours de Flowmerce** : `POST /api/webhooks/flowmerce` met à jour le score, la recommandation et l'état des réclamations.
- **Page de suivi** : lien vers le formulaire de réclamation hébergé par Flowmerce (méthode 1 déjà existante).
- Toutes les requêtes signées (HMAC) + idempotence (clé par commande).
- Réessais : la tâche planifiée relit les événements `PENDING` de l'outbox, avec un délai croissant entre deux tentatives ; après un nombre maximal d'échecs, l'événement passe en `FAILED` et une alerte est levée.

---

## 5. Modèle de données (première version)

```prisma
// ───────── Compte vendeur et facturation ─────────

model Tenant {
  id                String              @id @default(cuid())
  name              String
  ownerUserId       String                        // utilisateur du compte unique
  flowmerceSellerId String?             @unique   // vendeur côté Flowmerce
  flowmerceApiKey   String?                       // chiffrée
  subscription      Subscription?
  features          FeatureActivation[]
  usage             UsageRecord[]
  sites             Site[]
  products          Product[]
  media             Media[]
  orders            Order[]
  outbox            OutboxEvent[]
  createdAt         DateTime            @default(now())
  updatedAt         DateTime            @updatedAt

  @@index([ownerUserId])
}

model Subscription {
  id               String             @id @default(cuid())
  tenantId         String             @unique
  tenant           Tenant             @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  plan             Plan               @default(BASIC)
  status           SubscriptionStatus
  currentPeriodEnd DateTime?
  createdAt        DateTime           @default(now())
  updatedAt        DateTime           @updatedAt
}

model FeatureActivation {
  id          String           @id @default(cuid())
  tenantId    String
  tenant      Tenant           @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  feature     FlowmerceFeature
  active      Boolean          @default(false)
  activatedAt DateTime?
  updatedAt   DateTime         @updatedAt

  @@unique([tenantId, feature])
}

model UsageRecord {
  id       String           @id @default(cuid())
  tenantId String
  tenant   Tenant           @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  feature  FlowmerceFeature
  period   String                              // "2026-12"
  count    Int              @default(0)        // commandes scorées, notifications, analyses

  @@unique([tenantId, feature, period])
}

// ───────── Sites et pages ─────────

model Site {
  id        String         @id @default(cuid())
  tenantId  String
  tenant    Tenant         @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  type      SiteType                           // LANDING | STORE
  name      String
  subdomain String         @unique
  theme     Json                               // couleurs, police, logo
  locale    String         @default("fr")      // fr | ar — une langue par site en v1
  pixels    Json?                              // { facebook: "...", tiktok: "..." }
  status    SiteStatus     @default(DRAFT)
  pages     Page[]
  domains   Domain[]
  products  Product[]                          // produits affichés sur ce site
  orders    Order[]
  shipping  ShippingRate[]
  createdAt DateTime       @default(now())
  updatedAt DateTime       @updatedAt

  @@index([tenantId])
}

model Page {
  id        String        @id @default(cuid())
  siteId    String
  site      Site          @relation(fields: [siteId], references: [id], onDelete: Cascade)
  slug      String                             // "" pour l'accueil
  title     String
  draft     Json                               // JSON Puck en cours d'édition
  published Json?                              // dernière version publiée
  seo       Json?
  versions  PageVersion[]
  createdAt DateTime      @default(now())
  updatedAt DateTime      @updatedAt

  @@unique([siteId, slug])
}

model PageVersion {
  id          String   @id @default(cuid())
  pageId      String
  page        Page     @relation(fields: [pageId], references: [id], onDelete: Cascade)
  content     Json
  publishedAt DateTime @default(now())

  @@index([pageId, publishedAt])
}

model Domain {
  id           String       @id @default(cuid())
  siteId       String
  site         Site         @relation(fields: [siteId], references: [id], onDelete: Cascade)
  hostname     String       @unique
  source       DomainSource                    // CONNECTED | PURCHASED
  status       DomainStatus @default(PENDING)
  isPrimary    Boolean      @default(false)    // adresse principale du site
  verification Json?                           // enregistrements DNS attendus
  registrarRef String?                         // référence chez le registrar (achat)
  expiresAt    DateTime?
  autoRenew    Boolean      @default(true)
  createdAt    DateTime     @default(now())
  updatedAt    DateTime     @updatedAt

  @@index([siteId])
}

model Media {
  id        String   @id @default(cuid())
  tenantId  String
  tenant    Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  url       String
  width     Int?
  height    Int?
  sizeBytes Int?
  createdAt DateTime @default(now())

  @@index([tenantId])
}

// ───────── Catalogue ─────────

model Product {
  id           String      @id @default(cuid())
  tenantId     String
  tenant       Tenant      @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  sites        Site[]                          // un produit peut servir sur plusieurs sites
  name         String
  description  String?
  price        Int                             // en DA
  comparePrice Int?
  images       String[]
  sizeGuide    Json?                           // alimente l'analyse produit Flowmerce
  variants     Variant[]
  orderItems   OrderItem[]
  active       Boolean     @default(true)
  createdAt    DateTime    @default(now())
  updatedAt    DateTime    @updatedAt

  @@index([tenantId])
}

model Variant {
  id         String      @id @default(cuid())
  productId  String
  product    Product     @relation(fields: [productId], references: [id], onDelete: Cascade)
  options    Json                              // { taille: "39", couleur: "noir" }
  stock      Int         @default(0)
  sku        String?
  orderItems OrderItem[]

  @@index([productId])
}

model ShippingRate {
  id         String @id @default(cuid())
  siteId     String
  site       Site   @relation(fields: [siteId], references: [id], onDelete: Cascade)
  wilayaCode Int
  home       Int
  office     Int?

  @@unique([siteId, wilayaCode])
}

// ───────── Commandes ─────────

model Order {
  id             String             @id @default(cuid())
  tenantId       String
  tenant         Tenant             @relation(fields: [tenantId], references: [id])
  siteId         String
  site           Site               @relation(fields: [siteId], references: [id])
  idempotencyKey String             @unique    // évite les doublons (double clic, réessai)
  customerName   String
  phone          String                        // normalisé (+213…)
  wilayaCode     Int
  commune        String
  address        String
  deliveryType   DeliveryType                  // HOME | OFFICE
  items          OrderItem[]
  subtotal       Int
  shippingFee    Int
  total          Int
  status         OrderStatus        @default(NEW)
  events         OrderStatusEvent[]
  ip             String?
  userAgent      String?
  source         Json?                         // utm_source, utm_campaign…
  fraudScore     Float?                        // renvoyé par Flowmerce
  fraudAdvice    String?                       // recommandation Flowmerce
  flowmerceId    String?            @unique    // identifiant côté Flowmerce
  createdAt      DateTime           @default(now())
  updatedAt      DateTime           @updatedAt

  @@index([siteId, status, createdAt])
  @@index([tenantId, createdAt])
  @@index([phone])
}

model OrderItem {
  id          String   @id @default(cuid())
  orderId     String
  order       Order    @relation(fields: [orderId], references: [id], onDelete: Cascade)
  productId   String?
  product     Product? @relation(fields: [productId], references: [id], onDelete: SetNull)
  variantId   String?
  variant     Variant? @relation(fields: [variantId], references: [id], onDelete: SetNull)
  productName String                           // copie au moment de la commande
  options     Json?                            // copie des options de la variante
  unitPrice   Int                              // copie du prix
  quantity    Int

  @@index([orderId])
  @@index([productId])
  @@index([variantId])
}

model OrderStatusEvent {
  id        String       @id @default(cuid())
  orderId   String
  order     Order        @relation(fields: [orderId], references: [id], onDelete: Cascade)
  from      OrderStatus?
  to        OrderStatus
  actor     String?                            // utilisateur, "system" ou "flowmerce"
  note      String?
  createdAt DateTime     @default(now())

  @@index([orderId, createdAt])
}

// ───────── Envois vers Flowmerce ─────────

model OutboxEvent {
  id            String       @id @default(cuid())
  tenantId      String
  tenant        Tenant       @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  type          String                         // "order.created", "order.status_changed"
  payload       Json
  status        OutboxStatus @default(PENDING)
  attempts      Int          @default(0)
  nextAttemptAt DateTime     @default(now())
  lastError     String?
  createdAt     DateTime     @default(now())

  @@index([status, nextAttemptAt])
}

// ───────── Énumérations ─────────

enum Plan {
  BASIC
}

enum SubscriptionStatus {
  ACTIVE
  PAST_DUE
  CANCELLED
}

enum FlowmerceFeature {
  FRAUD_SCORE
  ML
  TRACKING
}

enum SiteType {
  LANDING
  STORE
}

enum SiteStatus {
  DRAFT
  PUBLISHED
  SUSPENDED
}

enum DomainSource {
  CONNECTED
  PURCHASED
}

enum DomainStatus {
  PENDING
  VERIFIED
  ACTIVE
  ERROR
  EXPIRED
}

enum DeliveryType {
  HOME
  OFFICE
}

enum OrderStatus {
  NEW
  CONFIRMED
  SHIPPED
  DELIVERED
  RETURNED
  CANCELLED
}

enum OutboxStatus {
  PENDING
  SENT
  FAILED
}
```

Ce qui a changé depuis la v0.1 :
- **Commandes** : lignes dans `OrderItem` (reliées aux variantes, avec copie du nom et du prix), historique dans `OrderStatusEvent`, clé d'idempotence, frais de livraison, provenance (IP, UTM).
- **Facturation** : `Subscription`, `FeatureActivation` (une ligne par option) et `UsageRecord` (compteur mensuel par option).
- **Catalogue** : `Product` rattaché au `Tenant`, partagé entre ses sites.
- **Fiabilité** : `OutboxEvent` pour les envois vers Flowmerce.
- **Divers** : `Media`, `Domain.isPrimary`, wilaya stockée par code, index sur les clés étrangères, `updatedAt`.

---

## 6. Structure du dépôt

```
flowmerce-sites/
├─ proxy.ts                      # routage par nom de domaine (ex-middleware.ts)
├─ app/
│  ├─ (dashboard)/               # espace vendeur : sites, produits, commandes, domaines, abonnement
│  ├─ (editor)/edit/[pageId]/    # éditeur Puck
│  ├─ s/[host]/[[...slug]]/      # rendu public des sites
│  └─ api/
│     ├─ orders/                 # réception des commandes COD
│     ├─ domains/                # ajout, vérification, achat
│     ├─ publish/                # publication + revalidation
│     ├─ cron/outbox/            # envoi et réessai des événements vers Flowmerce
│     └─ webhooks/flowmerce/     # retours de Flowmerce
├─ blocks/                       # un composant React par bloc + sa config Puck
├─ lib/
│  ├─ tenant.ts                  # résolution host → site (avec cache)
│  ├─ flowmerce.ts               # client API Flowmerce signé
│  ├─ outbox.ts                  # écriture et traitement des événements
│  ├─ features.ts                # options actives du vendeur + comptage d'usage
│  ├─ ratelimit.ts               # limitation par IP / téléphone
│  ├─ domains.ts                 # API Vercel + registrar
│  └─ wilayas.ts                 # référentiel wilayas + communes
├─ prisma/schema.prisma
└─ templates/                    # modèles de sites (JSON)
```

Le référentiel des wilayas est à valider : 58 wilayas dans la v0.1, 69 depuis la réforme de fin 2025 (à vérifier). Il doit suivre le découpage utilisé par les sociétés de livraison.

---

## 7. Sécurité et fiabilité
- Isolation des données par `tenantId` dans toutes les requêtes ; tests dédiés.
- Nettoyage du contenu des blocs (pas de HTML/JS arbitraire au départ ; bloc « code personnalisé » seulement plus tard et isolé).
- Les pixels publicitaires ne sont injectés qu'à partir d'un identifiant validé, jamais d'un script collé par le vendeur.
- **Séparation des cookies** : le cookie de session du vendeur est limité à l'hôte de l'espace vendeur et n'est jamais posé sur le domaine parent, pour qu'aucun site vendeur ne le reçoive.
- Protection anti-spam du formulaire COD : limitation par IP/téléphone, captcha invisible, validation du numéro algérien.
- Clés API Flowmerce chiffrées au repos ; signature HMAC des échanges.
- Réservation des sous-domaines sensibles ; détection des noms trompeurs (imitation de marques).
- Signalement et suspension rapide d'un site frauduleux, pour protéger la réputation du domaine partagé.
- Sauvegarde des versions publiées ; restauration en un clic.
- Si Flowmerce est indisponible : la commande est enregistrée quand même, puis envoyée par l'outbox.

---

## 8. Plan de réalisation

> Priorité absolue jusqu'au **5 décembre 2026** : les développements Flowmerce déjà prévus (historisation, analyse produit, système juste, fraude, Brain, notifications WhatsApp).
> Flowmerce Sites avance en parallèle avec un objectif réaliste : **une démo fonctionnelle de landing page COD reliée à Flowmerce** pour le 5 décembre. Tout ce qui ne sert pas ce parcours est repoussé.

### Phase 0 — Fondations (15 → 20 novembre)
- [ ] Créer le dépôt `flowmerce-sites` et le projet Vercel dédié
- [ ] Next.js + TypeScript + Tailwind + Prisma + PostgreSQL
- [ ] `proxy.ts` multi-tenant (sous-domaines) + DNS wildcard
- [ ] Modèles `Tenant`, `Site`, `Page`
- [ ] Authentification provisoire (le SSO avec Flowmerce vient en Phase 3)
- [ ] Trancher le domaine racine des sites et l'hôte de l'espace vendeur (§11.3)

**Livrable :** `test.flowmerce.dz` affiche une page lue en base.

### Phase 1 — Landing page COD (21 → 30 novembre)
- [ ] Intégrer Puck ; blocs Hero, Fiche produit, Formulaire COD, Pied de page
- [ ] Un produit + variantes + frais de livraison par wilaya
- [ ] Publication (brouillon → publié) + revalidation ISR
- [ ] Réception des commandes (`Order`, `OrderItem`, clé d'idempotence, anti-spam de base)
- [ ] Liste des commandes dans le dashboard + changement de statut avec historique
- [ ] 1 modèle de landing page en français
- [ ] Si le temps le permet : blocs Galerie et FAQ, modèle en arabe (RTL)

**Livrable :** un vendeur crée une landing page et reçoit des commandes.

### Phase 2 — Branchement Flowmerce (1er → 5 décembre)
- [ ] Création automatique du vendeur Flowmerce + clé API
- [ ] `FeatureActivation` : options activées à la main pour la démo ; appels à Flowmerce conditionnés aux options actives
- [ ] Outbox + cron : envoi des commandes à Flowmerce, affichage du score de fraude
- [ ] Webhooks de changement d'état → notifications
- [ ] Page de suivi de commande + lien de réclamation Flowmerce
- [ ] Champ « identifiant de pixel » Facebook / TikTok dans les réglages du site

**Livrable (démo 5 décembre) :** landing page → commande → score de fraude → suivi → réclamation, de bout en bout.

### Phase 3 — Boutique complète (décembre)
- [ ] Type de site « Boutique » : accueil, catalogue, fiche produit, panier, commande
- [ ] Blocs Grille produits, Guide des tailles, Avis clients, Offre limitée (+ Galerie et FAQ s'ils n'ont pas été faits)
- [ ] Thème global, multi-pages, menu de navigation
- [ ] Modèles en arabe (RTL) ; pages bilingues
- [ ] SSO avec le compte Flowmerce
- [ ] Historique des versions et restauration
- [ ] Statistiques de visite simples
- [ ] Comptage d'usage par option (`UsageRecord`)

### Phase 4 — Abonnement et domaines (janvier 2027)
- [ ] Passerelle de paiement locale (CIB / Edahabia)
- [ ] Abonnement Basic : souscription, renouvellement, impayés, suspension
- [ ] Activation et désactivation des options Flowmerce par le vendeur, avec leur facturation
- [ ] Connexion d'un domaine existant (API Vercel, vérification DNS, SSL)
- [ ] Achat de domaines internationaux via API registrar
- [ ] Parcours guidé de demande de domaine .dz
- [ ] Renouvellements et alertes d'expiration

### Phase 5 — Croissance (T1 2027)
- [ ] Intégration avec les sociétés de livraison
- [ ] Suivi des conversions côté serveur (Conversions API Facebook / TikTok)
- [ ] Bibliothèque de modèles par secteur (mode, chaussures, cosmétique, électronique)
- [ ] Éditeur assisté par IA : générer une landing page à partir d'une photo et d'une description produit
- [ ] Migration en monorepo (Turborepo : `apps/dashboard`, `apps/sites`, `packages/db`, `packages/ui`)

---

## 9. Indicateurs de réussite
| Indicateur | Cible initiale |
|---|---|
| Temps pour publier une première landing page | < 10 minutes |
| Temps de chargement mobile (3G/4G) | < 2,5 s |
| Commandes scorées, pour les vendeurs ayant l'option Score de fraude | 100 % |
| Part des vendeurs abonnés ayant activé au moins une option Flowmerce | À suivre dès les premiers pilotes |
| Taux de retour des boutiques avec options actives vs sans | En baisse mesurable |
| Vendeurs actifs après 30 jours | À suivre dès les premiers pilotes |

---

## 10. Évolutions possibles
- **Marketplace** : catalogue central où l'acheteur découvre les produits de toutes les boutiques, avec un indice de confiance vendeur issu de Flowmerce (taux de retours justifiés, respect des délais).
- **Application mobile vendeur** (Capacitor) : gestion des commandes et confirmation téléphonique.
- **Score de confiance acheteur partagé** entre toutes les boutiques du réseau, en respectant les principes du système juste (droit de réponse, attribution au produit avant le client).

---

## 11. Décisions et risques

### 11.1 Décisions prises
| Sujet | Décision |
|---|---|
| Dépôt | `flowmerce-sites` séparé de `flowmerce-web-app`, relié par API |
| Adresse du site | Le vendeur garde son sous-domaine ou achète / connecte un domaine |
| Modèle économique | Abonnement Basic payant ; Score de fraude, Service ML et Suivi en options payantes |
| Périmètre de la démo | Landing page COD reliée à Flowmerce, rien d'autre avant le 5 décembre |

### 11.2 Propositions à confirmer
| Sujet | Proposition | Où |
|---|---|---|
| Référence de la commande | Flowmerce Sites fait autorité sur la commande et son statut ; Flowmerce sur le score, les réclamations et le Brain | §4.5 |
| Score de fraude | Asynchrone : l'acheteur n'attend pas Flowmerce | §4.5 |
| Vendeur Flowmerce | Un vendeur Flowmerce = un `Tenant`, une seule clé API pour tous ses sites | §4.5 |
| Catalogue | Produits rattachés au vendeur, partagés entre ses sites | §2.4, §5 |
| Stock | Décrémenté à la confirmation de la commande | §2.4 |
| Langues | Une langue par site en v1, bilingue en Phase 3 | §2.2 |
| Contenu de « Service ML » | Analyse produit + Flowmerce Brain | §2.6, §3.1 |

### 11.3 Décisions ouvertes
| Sujet | Question | Piste |
|---|---|---|
| Prix | Montant de l'abonnement Basic et de chaque option | Après la grille de comparaison (§1.5) |
| Unité de facturation des options | Forfait mensuel ou à l'usage (par commande scorée, par notification) | Compter l'usage dès le départ pour garder le choix |
| Essai | Période d'essai ou quota gratuit avant paiement | À décider avec les prix |
| Réclamations / retours | Inclus dans l'abonnement ou dans une option | À décider avec les prix |
| Domaine racine des sites | Sous-domaines sur `flowmerce.dz` ou sur un domaine dédié aux sites | Un domaine dédié isole les cookies de l'application et protège sa réputation si un site vendeur est signalé |
| Hôte de l'espace vendeur | `app.flowmerce.dz` est-il déjà occupé par l'application Flowmerce ? | Si oui : hôte distinct (ex. `sites.flowmerce.dz`) |
| Référentiel des wilayas | 58 ou 69 wilayas | S'aligner sur les sociétés de livraison |

### 11.4 Risques
| Sujet | Risque | Piste |
|---|---|---|
| Charge avant le 5 décembre | Trop de chantiers en parallèle | Démo limitée à 4 blocs, 1 modèle, 1 produit ; le reste en Phase 3 |
| Suivi sans transporteur | Statuts saisis à la main, donc suivi et notifications peu fiables | Avancer l'intégration d'un premier transporteur si les pilotes le demandent |
| Domaines .dz | Procédure CERIST non automatisable | Parcours semi-manuel, à confirmer |
| Wildcard DNS | SSL wildcard Vercel conditionné à la délégation des serveurs de noms | À valider avant la Phase 0, avec le choix du domaine racine |
| SSO avec Flowmerce | Complexité si l'auth actuelle n'est pas prévue pour | Auth provisoire en Phase 0, SSO en Phase 3 |
| Éditeur | Puck ne couvre pas un besoin précis | Blocs personnalisés ; GrapesJS en alternative |
| Duplication de code | Auth / UI copiées entre deux dépôts | Monorepo en Phase 5 |
| Cadre légal e-commerce | Loi 18-05 : obligations d'hébergement, d'extension et de registre du commerce pour les sites marchands | Avis d'un juriste avant l'ouverture au public |
| Données personnelles | Loi 18-07 : données des acheteurs hébergées à l'étranger ; score acheteur partagé (§10) | Avis d'un juriste ; déclaration auprès de l'ANPDP si nécessaire |
| Revente de domaines | Achat en devises auprès du registrar, revente en dinars | À valider avec un comptable avant la Phase 4 |
