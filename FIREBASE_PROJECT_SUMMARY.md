# CDL Survival Game - Resume projet et preparation Firebase

## 1. Resume du projet

CDL Survival Game est une application web Next.js / React / TypeScript autour des joueurs de Call of Duty League.

Le projet contient deja plusieurs modes jouables en local :

- Deviner le joueur
- Plus jeune / plus vieux
- Plus de titres / same
- Meilleure note BP / same
- Trier AR / SMG

La logique actuelle repose sur :

- `src/lib/data/cdl-data.json` pour les donnees joueurs/equipes
- `LocalPlayerRepository` pour exposer les donnees au jeu
- `LocalScoreRepository` pour stocker les records par mode dans `localStorage`

## 2. Objectif Firebase

Firebase doit servir a passer d'un MVP local a une version avec :

- source de donnees distante pour les joueurs/equipes
- authentification uniquement via Google
- sauvegarde des records et statistiques par utilisateur
- classements globaux par mode de jeu
- source de verite cloud pour les metadonnees

### Contrainte actuelle importante

Pour le moment, les images **ne seront probablement pas stockees dans Firebase Storage**.
On garde donc les portraits joueurs et logos equipes dans le dossier `ressource/` du projet, et Firestore conserve seulement des chemins `imageUrl` / `logoUrl` de type `/ressource/...`.

## 3. Firebase Auth

### Regle produit

La connexion doit se faire **uniquement via Google**.

### Donnees utilisateur a conserver

Firebase Auth gere l'identite, et Firestore conserve un profil applicatif minimal.

Collection proposee : `users`

```ts
export interface UserProfileDocument {
  uid: string;
  displayName: string;
  email: string;
  photoUrl: string | null;
  provider: "google";
  createdAt: string;
  lastLoginAt: string;
}
```

## 4. Firestore - donnees CDL

L'objectif est de migrer le contenu de `cdl-data.json` vers Firestore sans casser l'UI.

### Collection `teams`

```ts
export interface TeamDocument {
  id: string;
  name: string;
  slug: string;
  tag: string;
  logoUrl: string;
}
```

### Collection `players`

```ts
export interface PlayerDocument {
  id: string;
  name: string;
  slug: string;
  role: "AR" | "SMG" | null;
  birthDate: string | null;
  country: string | null;
  worldTitleCount: number | null;
  majorTitleCount: number | null;
  rating: number | null;
  teamTag: string;
  imageUrl: string;
  isActive: boolean;
}
```

### Pourquoi separer `teams` et `players`

- evite de dupliquer les infos d'equipe dans chaque joueur
- facilite les futures pages par equipe
- garde `PlayerRepository` compatible avec une implementation Firebase

## 5. Firestore - scores et statistiques

## 5.1 Records par utilisateur

Collection proposee : `userBestScores`

Un document par couple `(uid, modeId)`.

```ts
export type GameModeId =
  | "guess-player"
  | "age-duel"
  | "title-duel"
  | "rating-duel"
  | "role-sort";

export interface UserBestScoreDocument {
  uid: string;
  modeId: GameModeId;
  bestScore: number;
  updatedAt: string;
}
```

Regle d'ecriture :

- si le nouveau score est inferieur ou egal au record existant, ne rien ecraser
- si le nouveau score est superieur, mettre a jour le record

## 5.2 Historique de parties

Optionnel mais utile pour les stats.

Collection proposee : `gameSessions`

```ts
export interface GameSessionDocument {
  id: string;
  uid: string;
  modeId: GameModeId;
  score: number;
  status: "lost" | "completed";
  playedAt: string;
  durationMs?: number;
}
```

## 5.3 Stats agregrees par utilisateur

Collection proposee : `userGameStats`

Un document par couple `(uid, modeId)`.

```ts
export interface UserGameStatsDocument {
  uid: string;
  modeId: GameModeId;
  gamesPlayed: number;
  bestScore: number;
  totalScore: number;
  averageScore: number;
  lastPlayedAt: string;
}
```

## 5.4 Ranking global

Collection proposee : `leaderboards`

Un document par mode, contenant le top global.

```ts
export interface LeaderboardEntry {
  uid: string;
  displayName: string;
  photoUrl: string | null;
  bestScore: number;
  updatedAt: string;
}

export interface LeaderboardDocument {
  modeId: GameModeId;
  topPlayers: LeaderboardEntry[];
  updatedAt: string;
}
```

Alternative plus scalable :

- stocker un document par score dans `leaderboardEntries`
- faire une requete triee par `bestScore desc`
- utiliser une Cloud Function pour maintenir un top N si besoin

## 6. Images et Firebase Storage

Version cible plus tard, si le plan Firebase evolue :

- les portraits des joueurs
- les logos des equipes

Structure proposee :

```text
cdl-assets/
  teams/
    BOS/logo.png
    CAR/logo.png
    ...
  players/
    BOS/nastie.png
    BOS/purj.png
    ...
```

Version retenue pour l'instant :

- les images restent dans le projet Next.js
- les champs `logoUrl` et `imageUrl` dans Firestore pointent vers `/ressource/...`
- `app/ressource/[...assetPath]/route.ts` continue de servir ces fichiers localement

## 7. Architecture applicative cible

Le code doit continuer a dependre d'interfaces, pas directement de Firebase.

### Donnees joueurs

- `PlayerRepository`
- `LocalPlayerRepository` pour le dev local
- `FirebasePlayerRepository` pour Firestore + Storage

### Scores et rankings

- `ScoreRepository`
- `LocalScoreRepository` pour les records locaux
- `FirebaseScoreRepository` pour Firestore

Objectif :

- migrer la source de donnees sans reecrire les composants UI
- pouvoir continuer a developper offline si necessaire

## 8. Ordre d'implementation recommande

### Phase 1 - Firebase data read

- creer le projet Firebase
- activer Firestore
- definir les collections `teams` et `players`
- importer `cdl-data.json` dans Firestore
- creer `FirebasePlayerRepository`
- ajouter un switch de source via variable d'environnement

### Phase 2 - Images locales conservees

- garder `ressource/` dans le repo
- stocker seulement les metadonnees joueurs/equipes dans Firestore
- laisser `imageUrl` et `logoUrl` pointer vers `/ressource/...`
- migrer vers Firebase Storage uniquement si l'abonnement/plan le permet plus tard

### Phase 3 - Auth Google

- activer Google provider dans Firebase Auth
- ajouter un bouton "Se connecter avec Google"
- creer / mettre a jour `users/{uid}` a la premiere connexion
- conserver un mode invite si on veut encore jouer sans compte, mais sans ranking cloud

### Phase 4 - Scores et leaderboard

- creer `FirebaseScoreRepository`
- sauvegarder le meilleur score par mode pour l'utilisateur connecte
- afficher les records utilisateur par mode
- creer un leaderboard global par mode
- proteger les ecritures avec des Security Rules

## 9. Points d'attention

- ne jamais exposer de secret Firebase prive cote client
- valider les donnees importees depuis `cdl-data.json`
- gerer les joueurs sans `birthDate`, `role`, `rating` ou image valide
- proteger Firestore pour empecher qu'un client ecrive le score d'un autre utilisateur
- definir si les joueurs non connectes gardent uniquement le score local ou peuvent aussi apparaitre dans un ranking
- nettoyer plus tard le warning Turbopack lie a `app/ressource/[...assetPath]/route.ts`

## 10. Etat Git actuel a connaitre

- `main` contient une version stable du MVP multi-modes
- `dev` est la branche de travail active
- `frontend-dev-guidelines/` ne doit pas etre commit
