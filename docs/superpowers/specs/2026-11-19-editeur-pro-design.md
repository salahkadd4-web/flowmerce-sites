# Éditeur « pro » — landing pages professionnelles et simples à manipuler (conception)

> 19 novembre 2026 — demande de Salah après la Phase 1. Approche choisie : **sections empilées, manipulées comme dans Google Slides** (option 1).

## Intention

Que n'importe quel vendeur obtienne une landing page **d'aspect professionnel** sans effort, en manipulant la page **directement**, comme dans Google Slides : cliquer un texte pour l'écrire, glisser une section pour la déplacer, tirer une poignée pour agrandir une image — et régler couleurs, tailles et fond depuis un panneau simple.

## Ce que Salah a demandé

1. Image de fond, avec réglage du niveau d'assombrissement.
2. Ajouter et supprimer des sections.
3. Ajouter des images (5 au maximum, en plus de l'image principale du produit) et modifier leur taille.
4. Compteur de quantité `− 2 +`.
5. Couleurs et taille des textes modifiables.
6. Taille des composants de la page modifiable.
7. Tout contrôler depuis une interface simple ; modifications aussi simples que dans Google Slides.
8. Déplacer un composant en le glissant dans la page ; réduire sa taille en tirant dessus, comme dans Google Slides.

## Approches envisagées

1. **Sections empilées, manipulation façon Slides (retenue par Salah).** Les sections restent les unes sous les autres (la page s'adapte seule au mobile) ; on les réordonne en les glissant, on écrit les textes dans la page, des poignées règlent les tailles par paliers, un panneau règle couleurs et fonds.
2. Placement libre façon Slides (position et taille exactes de chaque élément) : liberté totale, mais deux mises en page à régler (ordinateur et mobile) et un autre éditeur que Puck. Écartée : contraire au trafic mobile des landing pages COD.

## Objectifs

### A. Manipulation directe dans la page
- **Textes écrits dans la page** : titres, sous-titres, paragraphes, textes de bouton se modifient en cliquant dessus (champs `contentEditable` de Puck 0.24). Le panneau garde les mêmes champs.
- **Déplacer une section** en la glissant dans la page (Puck, déjà possible) ; **dupliquer / supprimer** depuis la barre du bloc sélectionné (déjà possible, rendu plus visible : voir C).
- **Poignées de taille** sur les images (bannière, bloc Image, photo principale de la fiche produit) : on tire le coin droit, la largeur change par paliers de 10 % (de 30 % à 100 %) et s'affiche pendant le geste (« 70 % »). Le réglage est aussi dans le panneau (curseur).
- Les poignées n'existent que dans l'éditeur ; les pages publiques n'en reçoivent pas le code (garde `blocks/server-graph.test.ts`).

### B. Style de chaque section (panneau, groupe « Style »)
Commun à toutes les sections (Bannière, Fiche produit, Texte, Image, Formulaire, Pied de page) :
- **Fond** : aucun / couleur (palette de 8 couleurs + couleur personnalisée) / **image de fond**.
- **Image de fond** : envoi d'image (même composant que les photos), **assombrissement** de 0 à 80 % par paliers de 10 % (curseur), pour garder le texte lisible.
- **Espacement** (hauteur de la section) : compact / normal / aéré.
- **Largeur du contenu** : étroite / normale / large.

### C. Textes (panneau, groupe « Texte »)
- Pour le titre et pour le texte de chaque section : **taille** (S, M, L, XL) et **couleur** (automatique selon le fond, palette, ou personnalisée).
- **Bouton** (bannière, fiche produit, formulaire) : couleur du bouton, couleur du texte, taille (S, M, L).
- « Automatique » choisit un texte clair sur fond sombre et inversement : le vendeur qui ne touche à rien garde une page lisible.

### D. Images
- **Fiche produit** : image principale + **5 images au maximum** (le catalogue passe de 8 à 6 photos : 1 + 5). Dans la page : grande image principale (taille réglable par poignée) et miniatures en dessous (taille S / M / L) ; toucher une miniature l'affiche en grand, **sans JavaScript** (défilement CSS vers l'ancre de la photo).
- **Bloc Image** : taille réglable par poignée, coins arrondis (aucun / légers / prononcés).

### E. Formulaire de commande
- **Compteur de quantité** `−  2  +` à la place de la liste : gros boutons tactiles (44 px), bornes 1 à 10, `−` grisé à 1 et `+` grisé à 10, valeur annoncée aux lecteurs d'écran.

### F. Interface simple
- Réglages groupés et repliables dans le panneau : **Contenu**, **Texte**, **Style** (les groupes peu utilisés repliés par défaut).
- Colonne des blocs : chaque bloc avec une icône et une ligne d'explication (« Bannière — titre, image et bouton d'appel »).
- Page vide ou section supprimée par erreur : rappel « Glissez un bloc depuis la colonne de gauche » ; annuler (Ctrl+Z / bouton) déjà présent.
- Libellés en français, vocabulaire du vendeur (pas de « padding », « opacity »…).

### G. Pages en arabe (ajout de Salah, 19 nov.)
- Réglage de la page **« Langue de la page » : Français / العربية**. En arabe, la page s'écrit de droite à gauche (`dir="rtl"`, `lang="ar"`).
- Chaque texte porte `dir="auto"` : un paragraphe arabe dans une page française (ou l'inverse) s'aligne seul du bon côté. « À gauche » devient « Au début de la ligne » (à droite en arabe).
- Les textes fixes vus par l'acheteur sont traduits : formulaire (libellés, choix, erreurs, total), fiche produit (« Économisez », « Rupture de stock », « épuisé »), page de remerciement. Wilayas et communes en arabe.

### H. Polices (ajout de Salah)
- Réglages de la page : **police des titres** et **police du texte**, dans une liste de polices lisibles en français **et** en arabe : Système (actuelle, par défaut), Cairo, Tajawal, Almarai, IBM Plex Sans Arabic, Noto Kufi Arabic, Amiri (avec empattements).
- Polices servies par le site lui-même (aucune requête vers Google chez l'acheteur) ; une police non choisie n'est pas téléchargée.

### I. Mise en forme de mots sélectionnés (ajout de Salah)
- Dans les titres et paragraphes (bannière, texte, politique de retour), le vendeur sélectionne des mots et applique **gras, italique, souligné, barré** depuis une petite barre, comme dans Slides.
- Rien d'autre : ni liens, ni couleurs, ni titres, ni listes dans le texte.

## Non-objectifs

Placement libre (option 2), colonnes côte à côte, liens ou couleurs à l'intérieur d'un texte, thème global du site (Phase 3), animations, modèles supplémentaires, traduction de l'espace vendeur en arabe, une page bilingue (deux langues côte à côte).

## Anti-objectifs

- Une page qui casse sur mobile après réglages (texte illisible, image qui déborde).
- Du CSS, du HTML ou une URL arbitraire injectable par un réglage : couleurs `#rrggbb` validées, tailles et espacements dans des listes fermées ou des nombres bornés.
- Du code d'éditeur (poignées, sélecteurs de couleur) envoyé aux acheteurs.
- Une page publiée avant ces changements qui ne s'affiche plus : tous les nouveaux réglages ont une valeur par défaut qui reproduit le rendu actuel.

## Conception

### Modèle des réglages
- Chaque bloc reçoit un objet `style` (zod, valeurs par défaut) : `background: "none" | "palette:<nom>" | "custom"`, `backgroundColor: "#rrggbb"`, `backgroundImage: media | null`, `overlay: 0–80` (pas de 10), `spacing: "compact" | "normal" | "airy"`, `width: "narrow" | "normal" | "wide"`.
- Textes : `titleSize`, `titleColor`, `textSize`, `textColor` (`"auto"` ou `#rrggbb`).
- Images : `imageWidth: 30–100` (pas de 10), `rounded: "none" | "soft" | "strong"`.
- Rendu : classes Tailwind fixes pour les listes fermées ; `style={{ color, backgroundColor }}` uniquement avec une valeur qui a passé la regex `#rrggbb`. Couleurs « auto » calculées depuis la luminance du fond.

### Poignées et manipulation directe
- `editor-config.ts` enveloppe le rendu des blocs à image d'un composant client `ResizableImage` (éditeur seulement) : poignée sur le coin droit, glisser = largeur en % de la section, arrondie au palier de 10 %, appliquée par l'action Puck `replace` sur le bloc (annulable par Ctrl+Z).
- Champs `contentEditable: true` pour titres, sous-titres, textes et libellés de bouton ; les composants acceptent alors une valeur React à la place d'une chaîne dans l'éditeur (aucun `.trim()` sur ces valeurs au rendu).

### Fonds
- Image de fond : `next/image` en `fill` + `object-cover`, `sizes` adaptés au mobile, calque d'assombrissement noir à `overlay %` ; texte « auto » en clair dès que l'assombrissement ≥ 40 % ou que la couleur de fond est sombre.

### Texte mis en forme
- Champs `richtext` de Puck 0.24, avec seulement les extensions gras, italique, souligné, barré (et paragraphe / retour à la ligne). Valeur enregistrée : HTML produit par l'éditeur.
- **Nettoyé à l'enregistrement** : seules les balises `p`, `br`, `strong`, `em`, `u`, `s` survivent, sans aucun attribut ; le reste est retiré en gardant son texte.
- **Jamais injecté tel quel** : le rendu public transforme ce HTML en éléments React par notre propre lecture (même liste fermée), sans `dangerouslySetInnerHTML`. Un contenu altéré en base ne peut donc rien exécuter.
- Anciens textes sans balises : lus comme du texte simple (une ligne vide = un nouveau paragraphe), comme aujourd'hui.

### Langue et polices
- Racine de la page : `lang: "fr" | "ar"` (défaut `fr`), `headingFont`, `bodyFont` (liste fermée, défaut `system`). Le rendu de la racine enveloppe la page avec `lang`, `dir`, et les polices.
- Polices chargées par `next/font/google` (auto-hébergées, `preload: false`).
- Textes de l'acheteur dans un dictionnaire `fr` / `ar` ; la page de remerciement reçoit la langue de la page.

### Compatibilité
- Les schémas acceptent les anciens contenus (valeurs par défaut = rendu actuel) ; l'ancien `background` du Hero (`light | dark | indigo | sand`) est lu comme la couleur de palette correspondante.
- Le modèle `landing-fr.json` est mis à jour avec un rendu plus soigné (bannière sur image de fond assombrie, sections alternées).

## Tests attendus

Schémas (couleur invalide refusée, `#ff0000` accepté, `overlay` 85 refusé, anciens contenus valides) ; rendu (assombrissement appliqué, couleur personnalisée présente, texte auto clair sur fond sombre, largeur d'image en %) ; compteur de quantité (bornes, grisage, valeur envoyée) ; galerie (6 photos max, ancres) ; garde du graphe serveur ; texte mis en forme (`<script>`, `onclick=`, `<a href>` retirés ; gras/italique/souligné/barré gardés ; ancien texte simple → paragraphes) ; page arabe (`dir="rtl"`, libellés du formulaire en arabe) ; police choisie appliquée ; parcours navigateur (écrire un titre dans la page, tirer une poignée → largeur changée et publiée, fond image + assombrissement visibles sur le site public en 390 px).

## Décisions prises par Claude (à corriger si besoin)

1. Paliers plutôt que valeurs libres : largeur d'image par 10 % (30–100 %), tailles de texte S/M/L/XL, espacements en 3 crans — rendu toujours propre, impossible de « casser » la page.
2. Palette de 8 couleurs + couleur personnalisée (pas seulement la palette).
3. Couleur de texte « automatique » par défaut, selon le fond.
4. Assombrissement de 0 à 80 % (au-delà l'image ne se voit plus).
5. Produit : 1 image principale + 5 (catalogue limité à 6 photos au lieu de 8).
6. Miniatures cliquables sans JavaScript (ancres CSS).
7. Texte mis en forme limité à 4 styles, nettoyé à l'enregistrement et relu sans injection de HTML (§7 respecté).
11. La langue est un réglage **de la page** (et non du site) : elle suit le brouillon et la publication comme le reste de la page.
12. Traductions arabes des textes de l'acheteur rédigées par Claude : à relire par Salah.
13. Le titre du produit et sa description viennent du catalogue : texte simple, sans mise en forme.
8. Produit déjà enregistré avec 7 ou 8 photos : la page n'en affiche que 6 ; le formulaire produit demande d'en retirer avant d'enregistrer (message « 6 photos au plus : la première est l'image principale »).
9. Compteur borné par `MAX_QUANTITY` (10) déjà utilisé par le serveur : une seule source pour la limite.
10. La poignée modifie le bloc par l'API de Puck (`usePuck` / `dispatch`), depuis un composant de l'éditeur ; si l'aperçu en iframe empêche d'y accéder, repli : poignée dans le panneau seulement (curseur), signalé avant de continuer.

## Laissé au réalisateur

Les 8 couleurs exactes de la palette (dans les jetons existants), les icônes des blocs, la mise en page fine des groupes du panneau, l'apparence de la poignée.
