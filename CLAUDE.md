# Cartouche

Site pour organiser ses voyages et road trips :
1. **Ma carte** : une carte du monde où l'on colorie les pays (j'y vis, visité, envie, prévu), façon app « Been ».
2. **Voyages** : un carnet de voyages et road trips, avec leurs étapes jour par jour, tracées sur une carte.
3. **Planificateur IA** : un assistant qui construit un itinéraire illustré (photos, vidéos YouTube, trajets) et propose des alternatives moins fréquentées aux lieux connus (les « pépites »).

Toute l'interface est en français. Objectif : un produit fini en une journée, avec une UX irréprochable et une direction artistique épurée.

## Méthode de travail (à respecter)

- On avance **étape par étape** (voir « Plan »). Ne fais que l'étape demandée, sans anticiper les suivantes.
- À la fin de chaque étape : `npm run lint` et `npm run build` doivent passer sans erreur. Résume ensuite en quelques lignes ce qui a été fait et comment le tester, puis **attends ma validation**.
- Une fois l'étape validée, fais un commit git dont le message décrit l'étape.
- Explique les choix en termes simples : je ne suis pas développeur expérimenté.
- En cas de doute sur un choix visible par l'utilisateur, demande-moi plutôt que de deviner.
- L'agent IA (routes API, prompt système, outils, appels aux modèles et aux API de lieux, vidéos ou trajets) est construit par moi, en mode guidé, en dehors de cette session. Ne crée ni ne modifie jamais ces fichiers sans demande explicite. Pour l'interface du planificateur, prépare seulement les composants visuels avec des données d'exemple.

## Priorité de la direction artistique

La direction artistique ci-dessous est **validée et prioritaire**. Les skills de design installés dans `.claude/skills` (ui-ux-pro-max, design-taste-frontend) servent à la **qualité d'exécution** : accessibilité, états (survol, focus, chargement, vide, erreur), micro-interactions, finitions. Ils ne doivent **jamais** remplacer la palette, la typographie ou le concept définis ici.

Pour tout travail d'interface, utilise les skills design-taste-frontend et ui-ux-pro-max pour la qualité d'exécution, sans jamais modifier la palette, la typographie ni le concept définis ici.

## Direction artistique : bento cartographique

Le concept : une app de collection de pays, dans l'esprit de l'app « Been » (sans copier ses éléments), en **grille bento néo-brutaliste propre**.
- La carte et les pays coloriés sont les héros. Tout le reste est rangé dans des **tuiles** nettes, séparées par des traits de **1 px**.
- Fond crème en clair, presque noir en sombre. Encre franche, traits fins, coins peu arrondis.
- Trois **accents vifs**, réservés aux zones actives ou sélectionnées (lien actif, segment choisi, statut, focus d'une action) : jaune #FFDE4D, orange #FF7A1A, bleu #2F6BFF. Jamais en décoration.
- Statuts de la carte : **J'y vis** = encre pleine ; **Visité** = jaune ; **Envie** = hachures bleues ; **Prévu** = hachures orange.
- Les stats sont de **gros chiffres** en Inter Tight, comme dans Been : le pourcentage du monde est le chiffre-roi.
- Le logo : un petit carré jaune bordé d'encre, suivi du mot « TravelMap » en Inter Tight 800, interlettrage serré.

### Couleurs (variables CSS, clair et sombre)

Toutes les couleurs passent par ces variables. Aucune couleur n'est codée en dur dans les composants.

| Variable | Clair | Sombre | Usage |
|---|---|---|---|
| `--bg` | #FDFBF7 | #0E0E0E | fond de page (crème / presque noir) |
| `--surface` | #FFFFFF | #161616 | tuiles, en-tête, panneaux |
| `--surface-raised` | #FFFFFF | #1C1C1C | champs, menus, éléments flottants |
| `--surface-2` | #F4F0E7 | #1F1F1F | survol, zones calmes dans une tuile |
| `--ink` | #111111 | #F5F3EE | texte principal, boutons principaux |
| `--ink-2` | #3A3A3A | #C8C5BD | texte secondaire |
| `--muted` | #6A665D | #9A968D | légendes, libellés de tuile |
| `--border` | #111111 | #2A2A2A | traits de structure : bento, contrôles |
| `--line` | #E5E0D5 | #262626 | séparateurs discrets à l'intérieur d'une tuile |
| `--line-strong` | #111111 | #3A3A3A | bordures de champs |
| `--accent-yellow` | #FFDE4D | #FFDE4D | actif, sélection, « Visité » |
| `--accent-orange` | #FF7A1A | #FF7A1A | « Prévu », alertes |
| `--accent-blue` | #2F6BFF | #5B8CFF | « Envie », pépites |
| `--on-accent` | #111111 | #111111 | texte posé sur un accent (toujours foncé) |
| `--ocean` | #F1EDE4 | #121212 | mers |
| `--land` | #DCD6C9 | #2B2B2B | pays sans statut |
| `--map-border` | #FDFBF7 | #0E0E0E | frontières : fines, couleur du fond |
| `--graticule` | #E8E3D8 | #1A1A1A | méridiens et parallèles |
| `--ocean-label` | #6A665D | #8F8B82 | noms des océans |
| `--visited` | #FFDE4D | #FFDE4D | pays visités |
| `--visited-edge` | #C9A800 | #C9A800 | contour des pastilles « visité » |
| `--home` | #111111 | #F5F3EE | pays où l'on vit |
| `--wish-hatch` | #2F6BFF | #5B8CFF | hachures « envie » |
| `--planned-hatch` | #FF7A1A | #FF7A1A | hachures « prévu » |
| `--pepite` | #1F4FD8 | #8AAEFF | texte des lieux peu fréquentés |
| `--pepite-bg` | #E8EEFF | #16213D | fond des badges pépite |
| `--warn-bg` | #FFE8D6 | #2B1A0D | rappels, statut « prévu », erreurs |
| `--warn-ink` | #8A3A00 | #FFB27A | texte sur `--warn-bg` |

**Mode sombre**
- Trois choix : clair, sombre ou automatique (suit le système). C'est le choix automatique par défaut.
- Aucun flash au chargement.
- Le pays « j'y vis » s'inverse et devient clair en sombre, pour rester l'élément le plus contrasté de la carte.
- Un texte posé sur un accent (jaune, orange) reste toujours `--on-accent` (foncé), même en sombre.

### Typographie

- Deux familles, via `next/font` :
  - **Inter Tight** pour les titres et les chiffres : très gras (700 à 800), interlettrage serré ;
  - **Inter** pour le texte : aéré, graisses 400, 500 et 600.
- Échelle :

| Style | Famille, taille / graisse | Particularités |
|---|---|---|
| Chiffre-roi (stats) | Inter Tight, 64 à 112 / 800 | interlettrage -0,05em, `tabular-nums` |
| Titre de page | Inter Tight, 40 à 56 / 800 | interlettrage -0,04em, interligne 1 |
| Titre de tuile ou de section | Inter Tight, 20 à 24 / 700 | interlettrage -0,02em |
| Texte | Inter, 16 / 400 | interligne 1,55 |
| Légende, libellé de tuile | Inter, 14 / 500 | couleur `--muted` |
| Petit | Inter, 13 | |

- Les chiffres utilisent `tabular-nums`.
- Majuscule en début de phrase uniquement. Jamais de libellés tout en majuscules.

### Règles d'interface

- **Grille bento** : un conteneur au fond `--border`, avec un espacement de 1 px entre des tuiles `--surface`. Les séparations font donc toujours exactement 1 px. Coins extérieurs de 10 px, aucun arrondi à l'intérieur.
- **Rayons** : 6 px pour les contrôles, 10 px pour les conteneurs et panneaux, 4 px pour les badges.
- **Bordures et ombres** : bordures de 1 px. Aucune ombre au repos. Les éléments flottants (menus, panneaux) ont une ombre dure néo-brutaliste, décalée sans flou.
- **Boutons** :
  - principal : fond `--ink`, texte `--bg` ; au survol et au clic, il s'inverse en jaune avec texte foncé ;
  - secondaire : bordure `--border`, fond transparent ; au survol, fond encre ;
  - effet ressort léger (translation ou agrandissement) au survol et au clic.
- **Navigation** : le lien actif est une pastille jaune, texte foncé.
- **Accessibilité** :
  - cibles tactiles d'au moins 44 px ;
  - focus visible : contour de 2 px `--ink`, décalé de 2 px ;
  - contraste du texte d'au moins 4,5:1 ;
  - vrais `<button>`, `<a>`, `<label>` ;
  - `aria-label` sur les boutons qui n'ont qu'une icône.
- **Icônes** : `lucide-react`, trait de 1,75. Jamais d'emoji.
- **Interdits** : dégradés décoratifs, flou de verre, ombres floues au repos, accents utilisés en décoration, cartes à bordure gauche colorée, libellés en majuscules au-dessus des titres.
- **Ton** : écrire comme on parle, avec des verbes simples. Les boutons disent ce qu'ils font (« Ajouter au voyage », pas « Valider »).
- **États vides** : un écran vide invite à agir, par exemple « Clique sur un pays pour le colorier ».

### Mouvement

Avec le paquet `motion` (Framer Motion) et du CSS. On anime **uniquement `transform` et `opacity`**, à 60 images par seconde.
- **Préchargement** : à la première page de la session, une animation d'entrée dévoile la grille en cascade. Elle dure au maximum 1,2 s, ne joue qu'une fois par session (`sessionStorage`) et se passe d'un clic.
- **Défilement** : léger parallaxe et apparition des modules au défilement, seulement sur les pages longues (Voyages, détail d'un voyage). Jamais sur la carte ni dans le chat, qui restent directs.
- **Micro-interactions** :
  - boutons et icônes avec effet ressort ;
  - tuiles qui changent d'état ou révèlent du contenu ;
  - quand un pays reçoit un statut, la couleur se diffuse dans sa forme, et les compteurs s'animent.
- **Transitions** entre Ma carte, Voyages et Planifier.
- **`prefers-reduced-motion`** : toutes les animations deviennent des fondus courts ou disparaissent.

## Écrans de référence (maquettes validées)

**En-tête**, commun à toutes les pages :
- À gauche : logo et navigation (Ma carte, Voyages, Planifier).
- À droite : recherche de pays (⌘K), sélecteur de thème, compte.

**Ma carte** (bento)
- Une grande tuile carte, et des tuiles de stats façon Been :
  - le gros pourcentage du monde ;
  - le nombre de pays « sur 193 » ;
  - les continents « X sur 6 », avec ceux qui manquent ;
  - le dernier voyage terminé ;
  - les prochaines envies.
- Une tuile de légende : quatre pastilles (J'y vis, Visité, Prévu, Envie) avec leur compteur, qui servent aussi de filtres, et le bouton « Partager ma carte ».
- Un clic sur un pays ouvre un panneau flottant :
  - nom du pays et continent ;
  - sélecteur à trois segments : J'y vis / Visité / Envie ;
  - bouton pour retirer le statut ;
  - bouton « Planifier un voyage au [pays] ».
- Déplacement et zoom : molette, pincement, boutons + / − et recentrer.

**Voyages**
- Titre « Voyages » avec un résumé (« 4 voyages terminés, 44 jours sur la route »).
- Boutons « Planifier avec l'assistant » et « Nouveau voyage ».
- Filtres : Tous / Prévus / Terminés / Idées.
- Section « À venir » : une grande carte avec mini-carte du tracé, badge « Prévu », dates, durée, étapes, ferries, et une barre de préparation.
- Les idées sont présentées en bordure pointillée.
- Section « Souvenirs » : une grille de cartes (mini-carte du tracé, mois et année, titre, jours et km).

**Détail d'un voyage**
- À gauche :
  - titre, dates et statut ;
  - chiffres clés : durée, étapes, ferries, préparation ;
  - onglets : Itinéraire / Préparation / Budget / Notes ;
  - une frise des jours avec des pastilles numérotées pour les étapes.
- À droite : la carte du tracé, avec des marqueurs numérotés.
- Le jour sélectionné est mis en avant des deux côtés.
- Légende des tracés : route en trait plein, ferry en tirets, vol en pointillés.

**Planificateur IA**
- À gauche, la conversation :
  - les jours de l'itinéraire s'affichent en accordéon ;
  - chaque lieu montre une jauge d'affluence estimée à 5 barres ;
  - une carte « Pépite » (vert) propose une alternative moins fréquentée, avec photo, description, « Ajouter au jour N » et « Une autre alternative » ;
  - une vidéo YouTube suggérée apparaît sous forme de vignette ;
  - des suggestions rapides : « Moins de route », « Plus de pépites », « Refaire le jour N ».
- À droite, la carte suit le jour affiché :
  - sélecteur « Jour N sur M » ;
  - légende ;
  - mini-carte du parcours complet en bas à droite.

**Mobile**
- Barre d'onglets en bas : Ma carte / Voyages / Planifier.
- Sur « Ma carte », un globe et un panneau de stats qui glisse.

## Choix techniques

- **Framework** : Next.js (App Router) + TypeScript + Tailwind CSS. Les couleurs sont les variables CSS ci-dessus, exposées à Tailwind.
- **Thème** : `next-themes`, avec une classe sur `<html>`. Le choix automatique est le défaut.
- **Polices** : Inter Tight (titres, chiffres) et Inter (texte), via `next/font`.
- **Animations** : `motion` (Framer Motion, `import { motion } from "motion/react"`) et CSS, avec `MotionConfig reducedMotion="user"`.
- **Cartes** : SVG dessiné avec `d3-geo` + `topojson-client` + `world-atlas`.
  - Monde : projection **Equal Earth** (`geoEqualEarth`), données 110m, sans l'Antarctique, graticule de 10°.
  - Hachures : `<pattern>` SVG qui utilisent les variables CSS.
  - Cartes régionales des voyages : données 50m chargées à la demande.
  - On n'utilise pas MapLibre : il ne propose pas la projection Equal Earth.
- **Données** : stockées dans le navigateur avec `zustand` + `persist` (localStorage). Pas de compte ni de backend pour l'instant : Supabase pourra venir plus tard.
- **Pays** : un fichier `countries` avec, pour chaque pays :
  - le code ISO numérique utilisé par world-atlas ;
  - le code ISO alpha-2 ;
  - le nom en français ;
  - le continent ;
  - s'il est membre de l'ONU.
  Le décompte se fait sur les **193 membres de l'ONU**. Un territoire dépendant, comme le Groenland, compte pour son État de rattachement.
- **Plus tard** (étapes 4 et 5) :
  - Vercel AI SDK, avec un modèle Mistral (plan gratuit), branché côté serveur ;
  - outils : Google Places (lieux, photos, notes, nombre d'avis), YouTube Data API, OpenRouteService (trajets), Open-Meteo (saisons) ;
  - les clés d'API vont dans `.env.local` et ne sont jamais exposées au navigateur.

### Modèle de données (côté client)

- `countryStatuses: Record<codeIsoNumérique, 'home' | 'visited' | 'wish'>`, enregistré sous la clé `travelmap-carte`. Un seul pays peut être « j'y vis » : en choisir un autre fait passer l'ancien en « visité ». Le statut « prévu » n'est pas stocké : il se déduit d'un voyage `planned` non terminé qui passe par le pays, s'il n'est pas déjà « j'y vis » ou « visité ».
- `trips: Trip[]`, enregistré sous la clé `travelmap-voyages`, où un `Trip` contient :
  - `id` : identifiant court de 8 caractères, utilisé dans l'adresse `/voyages/[id]` ;
  - `title` ;
  - `countries: string[]` : codes ISO numériques des pays traversés, déduits des étapes dans l'ordre du voyage (jamais saisis à la main) ;
  - `startDate?`, `endDate?` : dates au format `AAAA-MM-JJ` ;
  - `status: 'idea' | 'planned' | 'done'` ;
  - `stops: Stop[]` ;
  - `notes` ;
  - `checklist: { id, label, done }[]` ;
  - `budget: { id, label, amount }[]` : lignes de budget, montants en euros.
- `Stop` contient :
  - `id`, `day`, `order`, `name` ;
  - `lat`, `lon` ;
  - `note` ;
  - `transport: 'road' | 'ferry' | 'flight' | 'train' | 'walk'`, qui indique comment on arrive depuis l'étape précédente ;
  - `country: string | null` : code ISO numérique du pays de l'étape, calculé localement avec `d3.geoContains` sur les frontières de world-atlas.

## Plan

1. **Socle** :
   - projet Next.js ;
   - variables de couleur claires et sombres ;
   - Overpass ;
   - sélecteur de thème ;
   - en-tête et navigation (version mobile comprise) ;
   - pages vides `/`, `/voyages`, `/planifier`, avec de beaux états vides.
2. **Carte coloriable** :
   - carte Equal Earth ;
   - clic sur un pays et panneau flottant ;
   - statuts et hachures ;
   - stats, légende et filtres ;
   - recherche de pays ;
   - zoom ;
   - sauvegarde locale.
3. **Voyages** : liste, création et édition, étapes jour par jour, carte du tracé, page de détail. Le statut « prévu » se reporte sur la carte du monde.
4. **Assistant IA** :
   - chat en streaming ;
   - itinéraire structuré en JSON, affiché en composants ;
   - lieux et photos vérifiés via les outils ;
   - ajout au voyage.
5. **Pépites, YouTube, mise en ligne** :
   - score « pépite » (très bonne note, peu d'avis) et jauge d'affluence ;
   - vidéos ;
   - finitions ;
   - déploiement sur Vercel.
