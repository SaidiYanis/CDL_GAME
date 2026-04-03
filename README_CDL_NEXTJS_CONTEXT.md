# 🎮 CDL Survival Game — Contexte projet Next.js

## 1. Résumé du projet

Ce projet est un **jeu de survie autour des joueurs de la CDL** (Call of Duty League).

Le principe est simple :

- le joueur voit l'image d'un joueur professionnel ;
- il doit deviner son nom ;
- chaque bonne réponse augmente son score ;
- à la première erreur, la partie se termine ;
- une nouvelle partie repart de zéro.

Le jeu doit être **rapide à comprendre, fun, rejouable et frustrant juste ce qu'il faut** pour donner envie de recommencer.

---

## 2. Objectif produit

L'objectif est de créer une application web moderne en **Next.js + React + TypeScript** qui permet :

- de jouer immédiatement sans onboarding complexe ;
- de tester et améliorer sa connaissance des joueurs CDL ;
- d'avoir une boucle de gameplay courte, claire et addictive ;
- de commencer avec une source de données locale ;
- de préparer une migration propre vers **Firebase** pour la production.

---

## 3. Public cible

Le projet cible principalement :

- les fans de la CDL ;
- les joueurs qui suivent un peu la scène compétitive ;
- les curieux qui veulent découvrir les équipes et les joueurs.

---

## 4. Boucle de jeu attendue

### Mode principal : Survie

- l'utilisateur lance une partie ;
- un joueur est affiché ;
- l'utilisateur répond ;
- si la réponse est correcte, la partie continue ;
- si la réponse est fausse, la partie s'arrête ;
- le score final est affiché ;
- l'utilisateur peut rejouer immédiatement.

### Règles principales

- `score = nombre de bonnes réponses consécutives` ;
- `1 erreur = fin immédiate` ;
- `1 nouvelle partie = score remis à zéro` ;
- éviter si possible de proposer deux fois le même joueur dans une même partie ;
- la difficulté peut évoluer selon le score.

---

## 5. Difficulté progressive

Le jeu doit pouvoir évoluer automatiquement selon la performance du joueur.

### Règles de difficulté

- score faible : QCM avec **4 choix** ;
- score intermédiaire : QCM avec **3 choix** ;
- score élevé : **réponse libre**.

### Proposition initiale

- score `< 5` → 4 choix ;
- score `5 à 10` → 3 choix ;
- score `> 10` → réponse texte.

Cette règle peut être ajustée plus tard, mais le code doit rester simple à modifier.

---

## 6. Données disponibles au départ

Pour le moment, les données existent **localement**.

Le dossier `Ressource` contient :

- un dossier par équipe ;
- dans chaque dossier :
  - le **logo de l'équipe** ;
  - les **4 images des joueurs**.

### Exemple de structure actuelle

```text
Ressource/
  BREACH/
    logo.png
    player-1.png
    player-2.png
    player-3.png
    player-4.png
  CLOUD9/
    logo.png
    player-1.png
    player-2.png
    player-3.png
    player-4.png
  ...
```

### Important

En production, les metadonnees joueurs/equipes doivent venir de **Firestore**.

Les assets images/sons restent dans `public/ressource/`, et Firestore stocke seulement les chemins `imageUrl` / `logoUrl`.

---

## 7. Vision technique

### Stack cible

- **Next.js**
- **React**
- **TypeScript**
- **App Router**
- CSS moderne (par exemple Tailwind si besoin)
- Firebase plus tard pour la persistance et l'hébergement des données

### Ce qu'on veut éviter

- une architecture improvisée ;
- des composants trop gros ;
- de la logique métier dispersée dans toute l'application ;
- du code difficile à migrer quand Firebase sera branché.

---

## 8. Architecture recommandée

Le projet doit être structuré comme un vrai projet sérieux dès le départ.

### Arborescence recommandée

```text
src/
  app/
    page.tsx
    layout.tsx
    globals.css
    game/
      page.tsx

  components/
    game/
      game-screen.tsx
      player-card.tsx
      answer-options.tsx
      answer-input.tsx
      score-display.tsx
      game-over-card.tsx
    ui/
      button.tsx
      card.tsx
      loader.tsx

  features/
    game/
      components/
      hooks/
      utils/
      types/
      constants/
      services/
    players/
      services/
      types/
      utils/

  lib/
    firebase/
      client.ts
      config.ts
    data/
      firebase-player-repository.ts
    utils/
      random.ts
      shuffle.ts
      normalize-answer.ts

  types/
    player.ts
    team.ts
    game.ts

  config/
    env.ts
```

### Intention de cette structure

- `app/` : routing Next.js ;
- `components/` : composants réutilisables ;
- `features/` : logique orientée métier ;
- `lib/data/` : accès aux sources de données ;
- `types/` : types globaux ;
- `config/` : configuration centralisée.

---

## 9. Source de données : local d'abord, Firebase ensuite

Le projet doit suivre cette logique :

### Étape 1 — version locale

On utilise le dossier `Ressource/` comme source principale pour :

- les images des joueurs ;
- les logos des équipes ;
- les informations dérivées du nom des dossiers et des fichiers.

### Étape 2 — version Firebase

Quand le MVP local fonctionne, on migre vers Firebase :

- **Firebase Storage** pour les images ;
- **Cloud Firestore** pour les joueurs, équipes, records, statistiques ou sessions si nécessaire.

### Règle d'architecture obligatoire

La couche de jeu **ne doit jamais dépendre directement du système de fichiers**.

Il faut passer par une abstraction du type :

- `PlayerRepository` ou équivalent ;
- une implémentation locale ;
- une implémentation Firebase.

Le reste du code ne doit pas avoir à savoir si les données viennent d'un dossier local ou de Firebase.

---

## 10. Fonctionnalités MVP

### MVP obligatoire

- afficher un joueur ;
- proposer une réponse ;
- vérifier la réponse ;
- gérer le score ;
- gérer la défaite ;
- relancer une partie ;
- afficher le record local ;
- charger les images locales.

### MVP+ possible ensuite

- difficulté progressive ;
- mode équipe ;
- statistiques ;
- classement ;
- authentification ;
- sauvegarde cloud.

---

## 11. User stories fines

### Jeu

- démarrer une partie ;
- voir un joueur à deviner ;
- choisir une réponse ;
- valider une bonne réponse ;
- perdre sur une mauvaise réponse ;
- rejouer immédiatement.

### Score

- voir son score courant ;
- voir son record.

### Feedback

- voir si la réponse est correcte ;
- voir la bonne réponse après une erreur.

### Interface

- comprendre l'écran immédiatement ;
- voir clairement l'image, les choix et le score.

### Données

- charger les images locales ;
- préparer la migration Firebase.

---

## 12. Contraintes fonctionnelles

- l'interface doit être simple ;
- le score doit être lisible en permanence ;
- la défaite doit être instantanément compréhensible ;
- le bouton rejouer doit être visible ;
- les réponses doivent être rapides à sélectionner ;
- le jeu doit rester fluide ;
- le chargement local ne doit pas faire clignoter l'UI inutilement.

---

## 13. Standards de développement obligatoires

Cette section est écrite pour l'IA de génération de code.

### Règles générales

- utiliser **TypeScript strict** ;
- écrire un code lisible, maintenable et modulaire ;
- éviter `any` ;
- ne pas mélanger logique de rendu, logique métier et accès aux données ;
- préférer des fonctions courtes et explicites ;
- préférer des composants petits et composables ;
- centraliser les types et constantes métier.

### Règles React / Next.js

- utiliser **App Router** ;
- utiliser les **Server Components par défaut** ;
- n'utiliser `"use client"` que lorsque c'est réellement nécessaire ;
- garder les composants interactifs côté client les plus petits possible ;
- ne pas mettre toute la page en composant client si seule une petite zone est interactive ;
- utiliser `next/image` pour l'affichage d'images ;
- utiliser le dossier `public/` pour servir les fichiers statiques locaux pendant la phase locale ;
- éviter les accès disque ou calculs lourds dans les composants clients.

### Règles d'architecture

- séparer `UI`, `game logic`, `data access` et `config` ;
- aucune logique de parsing de dossier dans les composants React ;
- toute lecture de la source locale doit passer par un service dédié ;
- la logique de scoring doit être pure et testable ;
- la logique de génération des questions doit être pure et testable ;
- prévoir une interface commune pour la source des joueurs.

### Règles de qualité

- nommage clair ;
- fichiers en `kebab-case` ;
- types en `PascalCase` ;
- variables et fonctions en `camelCase` ;
- pas de duplication inutile ;
- pas de valeurs magiques dispersées dans le code ;
- constantes regroupées dans des fichiers dédiés.

### Gestion des erreurs

- toujours gérer les cas de données absentes ;
- toujours gérer les images manquantes ;
- toujours prévoir un fallback UI ;
- ne jamais faire planter l'app pour un fichier absent ;
- journaliser proprement les erreurs utiles en développement.

### Performance

- éviter de recalculer les listes aléatoires inutilement ;
- mémoriser ce qui doit l'être ;
- ne pas recharger toutes les ressources à chaque interaction si ce n'est pas nécessaire ;
- limiter les re-renders ;
- garder un état minimal et cohérent.

### Tests

- privilégier la testabilité de la logique métier ;
- écrire du code qui permet de tester séparément :
  - la sélection aléatoire ;
  - la validation des réponses ;
  - la progression de difficulté ;
  - la fin de partie.

---

## 14. Bonnes pratiques Next.js à respecter

### Rendering

- rendre côté serveur ce qui n'a pas besoin d'interactivité ;
- isoler l'interactivité dans des composants clients ciblés ;
- garder la logique sensible côté serveur si un jour elle doit être protégée.

### Images

- utiliser `next/image` ;
- renseigner `alt` correctement ;
- éviter les tailles implicites si elles provoquent des décalages de layout ;
- préparer un chemin clair pour migrer ensuite vers Firebase Storage.

### Variables d'environnement

- stocker la configuration dans des fichiers `.env*` ;
- ne jamais exposer un secret au client ;
- ne mettre en `NEXT_PUBLIC_` que ce qui doit réellement être lisible côté navigateur.

### Données locales

- pour la phase locale, exposer les images via `public/ressource/...` ou une stratégie équivalente propre à Next.js ;
- normaliser les noms de dossiers et fichiers pour éviter les bugs ;
- ne pas coder en dur les équipes dans plusieurs endroits.

---

## 15. Bonnes pratiques Firebase à respecter plus tard

Quand Firebase sera branché, l'implémentation devra respecter ces règles.

### Firestore

- utiliser Firestore pour les métadonnées et données applicatives ;
- garder un schéma simple ;
- éviter les documents inutilement gros ;
- structurer les collections pour les lectures fréquentes ;
- ne pas faire dépendre la logique métier de la structure brute de Firestore.

### Storage

- utiliser Firebase Storage pour les images ;
- garder une convention de nommage stable ;
- prévoir une correspondance claire entre une équipe, un joueur et son image.

### Sécurité

- ne jamais laisser une base ou un storage ouverts sans règles ;
- écrire des **Security Rules** explicites ;
- tester les règles avec l'**Emulator Suite** avant mise en production ;
- prévoir les cas lecture publique / écriture privée selon les besoins réels du projet.

### Migration

- la migration local → Firebase doit se faire sans réécrire les composants UI ;
- seuls les services ou repositories de données doivent changer ;
- aucune logique métier ne doit dépendre directement de Firebase.

---

## 16. Proposition de modèle de données métier

### Team

```ts
export interface Team {
  id: string;
  name: string;
  slug: string;
  logoUrl: string;
}
```

### Player

```ts
export interface Player {
  id: string;
  name: string;
  slug: string;
  teamId: string;
  imageUrl: string;
}
```

### GameQuestion

```ts
export interface GameQuestion {
  playerId: string;
  imageUrl: string;
  options: string[];
  mode: 'multiple-choice-4' | 'multiple-choice-3' | 'free-input';
}
```

### GameState

```ts
export interface GameState {
  score: number;
  bestScore: number;
  status: 'idle' | 'playing' | 'lost';
  currentQuestion: GameQuestion | null;
  usedPlayerIds: string[];
}
```

---

## 17. Règles produit à ne pas casser

- le jeu doit rester simple ;
- l'écran principal doit être lisible sans explication ;
- le jeu doit démarrer vite ;
- le cœur du plaisir vient de la tension du mode survie ;
- le design doit servir la lisibilité avant tout ;
- le système doit rester compatible avec une montée en gamme future.

---

## 18. Ce que l'IA doit faire

Quand l'IA génère du code pour ce projet, elle doit :

- respecter l'architecture décrite ici ;
- générer du code TypeScript strict ;
- isoler la logique métier ;
- utiliser les bonnes pratiques modernes Next.js ;
- préparer explicitement la migration vers Firebase ;
- proposer du code petit, propre, testable et facile à relire ;
- éviter toute sur-ingénierie inutile au début.

---

## 19. Ce que l'IA ne doit pas faire

- ne pas mélanger toutes les responsabilités dans une seule page ;
- ne pas coder l'application entière dans `page.tsx` ;
- ne pas parser les dossiers directement depuis les composants UI ;
- ne pas utiliser Firebase dès le premier commit si la version locale n'est pas prête ;
- ne pas introduire Redux, Zustand ou une grosse architecture state management sans besoin réel ;
- ne pas utiliser `any` par facilité ;
- ne pas dupliquer les types métier à plusieurs endroits.

---

## 20. Résumé exécutable

Le projet doit être pensé comme un **MVP propre** :

1. démarrage rapide en local ;
2. lecture des images depuis `Ressource/` ;
3. UI Next.js propre et moderne ;
4. logique de jeu testable ;
5. séparation claire entre UI et data ;
6. migration future vers Firebase sans refonte globale.

Le but n'est pas juste de faire « quelque chose qui marche », mais de poser une base sérieuse pour un vrai projet évolutif.
---

## 21. Etat actuel du projet

### Ce qui est deja en place

- une branche `main` stable ;
- une branche `dev` pour continuer les US une par une ;
- un ecran d'accueil ;
- une page `/game` jouable ;
- le mode principal "deviner le joueur" en survie ;
- le score, le record local, le game over et le replay ;
- une difficulte progressive ;
- une couche `PlayerRepository` ;
- une implementation Firestore `FirebasePlayerRepository`.

### Donnees locales enrichies

La collection Firestore `players` contient maintenant :

- le nom et le tag de chaque equipe ;
- l'image/logo de chaque equipe via `team.img` ;
- pour chaque joueur :
  - `name`
  - `role`
  - `birthDate`
  - `country`
  - `world_title`
  - `major_title`
  - `note`
  - `team`
  - `img`

### Points techniques a corriger / surveiller

- mapper `team.img` vers `Team.logoUrl` dans le repository local ;
- exploiter `role`, `country`, `birthDate`, `world_title`, `major_title`, `note` dans l'UI et les futurs modes ;
- commiter proprement les nouveaux assets `ressource/*` si on veut que le projet soit rejouable apres clone ;
- traiter plus tard le warning Turbopack lie au route handler `/ressource/[...assetPath]` ;
- corriger l'encodage de ce README si necessaire.

---

## 22. Nouveaux modes de jeu a ajouter

### Mode 1 - Deviner le joueur

- un joueur est affiche ;
- il faut trouver son pseudo ;
- une erreur termine la partie.

### Mode 2 - Plus jeune ou plus vieux

- deux joueurs sont affiches ;
- le jeu demande "Qui est le plus jeune ?" ou "Qui est le plus vieux ?" ;
- si la reponse est bonne, le score augmente ;
- a la premiere erreur, la partie s'arrete ;
- il faut gerer les `birthDate` inconnues et le cas ou les deux joueurs ont la meme date.

### Mode 3 - Plus de titres ou egalite

- deux joueurs sont affiches ;
- le joueur choisit qui a le plus de titres, ou "same" en cas d'egalite ;
- une erreur termine la partie ;
- il faut definir si la comparaison porte sur `world_title`, `major_title`, ou un total.

### Mode 4 - Meilleure note BP

- deux joueurs sont affiches ;
- l'utilisateur choisit lequel a la meilleure `note`, ou "same" si egalite ;
- une erreur termine la partie ;
- il faut definir si la comparaison accepte seulement les notes strictement superieures ou une egalite explicite.

### Mode 5 - Trier 10 joueurs par role AR / SMG

- 10 joueurs aleatoires sont affiches ;
- l'utilisateur doit les classer en `AR` ou `SMG` ;
- le round est gagne si le tri est correct ;
- une mauvaise validation termine la partie ;
- il faut definir si la validation est joueur par joueur ou par lot de 10.

---

## 23. Meilleure demarche pour la suite

### Phase A - Consolider le MVP local

- afficher le logo d'equipe et quelques infos joueur utiles dans le mode actuel ;
- mapper `team.img` dans `Team.logoUrl` ;
- ajouter une validation/coherence des donnees Firestore ;
- commiter les nouveaux assets `ressource/*` necessaires au jeu ;
- ajouter un ecran de selection de mode.

### Phase B - Ajouter les nouveaux modes un par un

Ordre conseille :

1. mode "plus jeune / plus vieux" ;
2. mode "plus de titres / same" ;
3. mode "meilleure note BP / same" ;
4. mode "tri AR / SMG".

Pourquoi :

- le mode age est le plus simple apres le mode principal ;
- le mode titres est proche mais demande une regle de comparaison claire ;
- le mode note BP reutilise le meme pattern de duel avec un critere plus simple que les titres ;
- le mode tri AR/SMG demande une UI plus complexe.

### Phase C - Brancher Firebase

- definir un schema Firestore pour `teams` et `players` ;
- creer `FirebasePlayerRepository` en gardant la meme interface que `PlayerRepository` ;
- garder `FirebasePlayerRepository` comme source runtime principale ;
- ajouter une config d'environnement pour choisir la source de donnees ;
- migrer les images vers Firebase Storage une fois les conventions de noms stabilisees.

### Phase D - Ajouter Google Auth, sauvegarde des scores et ranking global

- definir un `ScoreRepository` / `LeaderboardRepository` ;
- garder les meilleurs scores en local tant que l'utilisateur n'est pas connecte ;
- ajouter la connexion Google via Firebase Auth ;
- sauvegarder les records par joueur et par mode dans Firestore ;
- afficher un ranking global par mode ;
- n'enregistrer en base que si le nouveau score est meilleur que l'ancien record du joueur sur ce mode.

---

## 24. Backlog d'US recommande apres le MVP

### US deja realisees

- US1 - creer l'ecran d'accueil et la base UI ;
- US2 - creer les types metier et integrer le JSON local ;
- US3 - creer le repository local ;
- US4 - creer la logique de survie ;
- US5 - brancher une UI jouable pour le mode "deviner le joueur".

### US a faire maintenant

- US6 - afficher les infos joueur/equipe dans le mode actuel et mapper `team.img` vers `Team.logoUrl` ;
- US7 - ajouter un ecran de selection de mode ;
- US8 - ajouter le mode "plus jeune / plus vieux" ;
- US9 - ajouter le mode "plus de titres / same" ;
- US10 - ajouter le mode "meilleure note BP / same" ;
- US11 - ajouter le mode "tri AR / SMG" ;
- US12 - ajouter une validation des donnees locales et une UI de fallback si une image/stat est invalide ;
- US13 - ajouter un systeme de scores/records par mode cote local ;
- US14 - creer le schema Firebase `teams`, `players`, `scores`, `leaderboards` ;
- US15 - creer `FirebasePlayerRepository` ;
- US16 - creer `ScoreRepository` et une implementation Firestore ;
- US17 - ajouter la connexion Google ;
- US18 - sauvegarder les records utilisateurs par mode ;
- US19 - afficher un ranking global par mode ;
- US20 - ajouter des tests sur la logique de tous les modes ;
- US21 - nettoyer les assets, les chemins d'images, et le warning Turbopack.

### Regle de travail Git

- developper sur `dev` ;
- une US terminee = un commit clair ;
- `lint` et `build` doivent passer avant push ;
- push sur `origin/dev` a chaque US terminee ;
- remonter `dev` vers `main` uniquement quand un ensemble stable est valide.
