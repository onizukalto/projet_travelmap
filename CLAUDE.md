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

## Direction artistique : l'atlas routier

Le concept : les cartes routières et les atlas papier.
- Les pays visités sont **surlignés au marqueur jaune**, comme sur un vieil atlas.
- Le pays où l'on vit est un **aplat d'encre**.
- Les envies sont **hachurées à l'encre**. C'est la convention cartographique des zones en projet.
- Un voyage prévu donne des **hachures jaunes**.
- La typographie s'inspire de la signalétique routière.
- Les stats prennent la forme d'une **barre d'échelle** de carte.

Le logo est le mot « Cartouche » en Overpass 800, dans un cadre `border: 3px double` couleur encre, comme le cartouche d'une carte.

### Couleurs (variables CSS, clair et sombre)

Toutes les couleurs passent par ces variables. Aucune couleur n'est codée en dur dans les composants.

| Variable | Clair | Sombre | Usage |
|---|---|---|---|
| `--bg` | #F3F5F4 | #0F161D | fond de page |
| `--surface` | #FCFCFA | #161F28 | panneaux, en-tête, cartes |
| `--surface-raised` | #FFFFFF | #1C2731 | champs, boutons secondaires |
| `--ink` | #172433 | #E6ECEF | texte principal, boutons principaux |
| `--ink-2` | #4A5868 | #A9B6C0 | texte secondaire |
| `--muted` | #5B6875 | #93A1AC | légendes |
| `--line` | #D5DDE0 | #2A3743 | bordures fines |
| `--line-strong` | #C9D3D7 | #364553 | bordures de champs |
| `--ocean` | #D7E3E7 | #0B1218 | mers |
| `--land` | #FCFCFA | #1E2A35 | pays sans statut |
| `--map-border` | #A9B8BF | #3A4A57 | frontières |
| `--graticule` | #C8D6DB | #17222B | méridiens et parallèles |
| `--ocean-label` | #4E6470 | #7F95A3 | noms des océans (italique) |
| `--visited` | #F2C14E | #E3B341 | pays visités (surligneur) |
| `--visited-edge` | #D9A21B | #B8891E | contour des pastilles « visité » |
| `--home` | #172433 | #E6ECEF | pays où l'on vit |
| `--wish-hatch` | #172433 | #C9D3D9 | hachures « envie » |
| `--planned-hatch` | #D9A21B | #E3B341 | hachures « prévu » |
| `--pepite` | #2D6A4F | #6CC398 | lieux peu fréquentés |
| `--pepite-bg` | #E2EFE7 | #17352A | fond des badges pépite |
| `--warn-bg` | #FBEFCB | #3A2F12 | rappels, statut « prévu » |
| `--warn-ink` | #7A5300 | #F2D27A | texte sur `--warn-bg` |

**Mode sombre**
- Trois choix : clair, sombre ou automatique (suit le système). C'est le choix automatique par défaut.
- Aucun flash au chargement.
- Le pays « j'y vis » s'inverse et devient clair en sombre, pour rester l'élément le plus contrasté de la carte.

**Surligneur de navigation**
- Le lien actif est surligné : `box-shadow: inset 0 -8px 0 var(--visited)` en clair.
- En sombre, il devient un trait de 3 px sous le texte. Le texte clair sur fond jaune ne serait pas lisible.

**Boutons**
- Bouton principal : fond `--ink`, texte `--surface`. Il s'inverse donc tout seul en sombre.
- Bouton secondaire : bordure `--ink`, fond transparent.

### Typographie

- Une seule famille : **Overpass** (Google Fonts, via `next/font`), en graisses 400, 600, 700 et 800, plus l'italique 400.
- Échelle :

| Style | Taille / graisse | Particularités |
|---|---|---|
| Titre de page | 40 / 800 | interlettrage -0,02em |
| Section | 22 à 24 / 800 | |
| Texte | 16 / 400 | interligne 1,55 |
| Légende | 14 / 400 | |
| Petit | 13 | |

- Les chiffres utilisent `tabular-nums`.
- Les noms d'océans et de mers sont en italique, avec un interlettrage de 0,08em (convention cartographique).
- Majuscule en début de phrase uniquement. Jamais de libellés tout en majuscules.

### Règles d'interface

- **Rayons** : 8 px pour les contrôles, 10 à 12 px pour les panneaux, 6 px pour les badges.
- **Bordures et ombres** : bordures de 1 px `--line`. Ombre uniquement sur les éléments flottants (popovers, menus).
- **Accessibilité** :
  - Cibles tactiles d'au moins 44 px.
  - Focus visible : contour de 2 px `--ink`, décalé de 2 px.
  - Contraste du texte d'au moins 4,5:1.
  - Vrais `<button>`, `<a>`, `<label>`.
  - `aria-label` sur les boutons qui n'ont qu'une icône.
- **Icônes** : `lucide-react`, trait de 1,8. Jamais d'emoji.
- **Mouvement** : seulement en réponse à une action (le pays qui se remplit, le panneau qui s'ouvre). Respecter `prefers-reduced-motion`.
- **Interdits** : dégradés décoratifs, cartes à bordure gauche colorée, libellés en majuscules au-dessus des titres.
- **Ton** : écrire comme on parle, avec des verbes simples. Les boutons disent ce qu'ils font (« Ajouter au voyage », pas « Valider »).
- **États vides** : un écran vide invite à agir, par exemple « Clique sur un pays pour le colorier ».

## Écrans de référence (maquettes validées)

**En-tête**, commun à toutes les pages :
- À gauche : logo et navigation (Ma carte, Voyages, Planifier).
- À droite : recherche de pays (⌘K), sélecteur de thème, compte.

**Ma carte**
- La carte occupe toute la largeur.
- Les océans sont nommés en italique.
- Un clic sur un pays ouvre un panneau flottant :
  - nom du pays et continent ;
  - sélecteur à trois segments : J'y vis / Visité / Envie ;
  - meilleure saison ;
  - voyages liés ;
  - bouton « Planifier un voyage au [pays] ».
- Boutons zoom + / − en bas à droite.
- Sous la carte, une bande de légende contient :
  - le nombre de pays, avec « sur 193 » ;
  - une barre d'échelle à 10 segments pour le % du monde ;
  - les continents « X sur 6 », avec ceux qui manquent ;
  - quatre pastilles de légende qui servent aussi de filtres, avec leur compteur ;
  - le bouton « Partager ma carte ».

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

- `countryStatuses: Record<codeIsoNumérique, 'home' | 'visited' | 'wish'>`. Le statut « prévu » n'est pas stocké : il se déduit d'un voyage à venir qui passe par le pays.
- `trips: Trip[]`, où un `Trip` contient :
  - `id`, `title` ;
  - `countries: string[]` ;
  - `startDate?`, `endDate?` ;
  - `status: 'idea' | 'planned' | 'done'` ;
  - `stops: Stop[]` ;
  - `notes` ;
  - `checklist: { id, label, done }[]`.
- `Stop` contient :
  - `id`, `day`, `order`, `name` ;
  - `lat`, `lon` ;
  - `note` ;
  - `transport: 'road' | 'ferry' | 'flight' | 'train' | 'walk'`, qui indique comment on arrive depuis l'étape précédente.

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
