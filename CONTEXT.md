# CDL Survival Game - README contexte projet

## 1. Resume

CDL Survival Game est une app **Next.js + React + TypeScript** autour de la
Call of Duty League.

Le joueur peut lancer plusieurs modes de jeu, se connecter avec Google,
sauvegarder ses records dans Firestore, consulter son profil, voir les
leaderboards par mode, et explorer les rosters CDL.

Le runtime est maintenant **Firestore-only pour les metadonnees joueurs/equipes**.
Les images/logos/sons restent dans `public/ressource/`.

---

## 2. Fonctionnalites disponibles

### Routes principales

- `/` : landing page
- `/modes` : selection des modes
- `/game` : Deviner le joueur
- `/game/age-duel` : Plus jeune / plus vieux
- `/game/title-duel` : Qui a le plus de titres
- `/game/rating-duel` : Meilleure note BP
- `/game/role-sort` : Trier AR / SMG
- `/game/title-rank` : Title Radar
- `/roster` : roster CDL par equipe
- `/profile` : profil joueur connecte
- `/leaderboard` : classement global par mode

### Modes de jeu

- **Deviner le joueur**
  - photo d'un joueur
  - 4 choix jusqu'a la manche 9
  - saisie libre a partir de la manche 10
  - la saisie accepte la casse differente et 1 lettre fausse
  - le nom d'equipe est masque avant la manche 10

- **Plus jeune / plus vieux**
  - duel entre 2 joueurs
  - bouton gauche / same / droite

- **Qui a le plus de titres**
  - rounds classiques : comparaison sur les **Major**
  - rounds 3, 6, 9... : comparaison sur **Major + World cumules**
  - bouton gauche / same / droite

- **Meilleure note BP**
  - duel entre 2 joueurs
  - compare le rating BP

- **Trier AR / SMG**
  - 10 joueurs affiches
  - classer chaque joueur en AR ou SMG

- **Title Radar**
  - 5 joueurs affiches
  - une cible de titres est affichee en gros
  - pour chaque joueur, choisir `+`, `=` ou `-` par rapport a la cible
  - 90% des rounds tentent d'avoir au moins un `+`, un `=` et un `-`
  - 10% des rounds restent full random
  - la cible est ponderee pour favoriser 0 a 3 titres, avec 9/10 rares
  - rounds 3, 6, 9... : comparaison sur **Major + World cumules**

### UX / feedback

- score courant + record visibles
- sons win / lose
- son special rare 1/10 sur win et lose
- feedback vert/rouge sur les modes a choix
- Game Over avec gros boutons **Rejouer** et **Retour au menu**
- si l'utilisateur quitte une run active, une confirmation est affichee et la
  run est comptee comme une defaite

---

## 3. Stack technique

- Next.js App Router
- React
- TypeScript
- Tailwind via `app/globals.css`
- Firebase Auth Google
- Cloud Firestore
- `next/image`
- tests Node via `tsx --test`

---

## 4. Architecture actuelle

```text
app/
  game/
  leaderboard/
  modes/
  profile/
  roster/
src/
  config/
  features/
    auth/
    common/
    game/
    home/
    leaderboard/
    modes/
    players/
    profile/
    roster/
    scores/
  lib/
    audio/
    data/
    firebase/
    utils/
  types/
public/
  ressource/
scripts/
  import-firestore.ts
mermaid/
```

### Regles d'organisation

- `app/` contient les routes Next.js
- `src/features/*` contient l'UI et la logique par domaine
- `src/lib/data/*` contient les repositories Firestore / storage local score
- `src/lib/firebase/*` centralise le client/config Firebase
- `src/lib/utils/*` centralise les utilitaires purs
- `src/types/*` centralise les types metier

---

## 5. Donnees runtime

### Firestore = source de verite

Le jeu lit les joueurs/equipes depuis :

- `src/lib/data/player-repository-provider.ts`
- `src/lib/data/firebase-player-repository.ts`

Si Firestore est indisponible, le provider retourne un fallback vide pour eviter
un crash et afficher l'UI de fallback.

### Assets locaux

Les chemins `imageUrl` / `logoUrl` stockes en Firestore pointent vers
`/ressource/...`, servi par `public/ressource/...`.

Les sons sont dans `public/ressource/SOUND/...`.

### Scores

- records locaux de secours : `src/lib/data/local-score-repository.ts`
- sync Firestore user stats/scores/sessions :
  - `src/features/scores/hooks/use-game-score-sync.ts`
  - `src/lib/data/firebase-score-repository.ts`

---

## 6. Schema Firestore attendu

### `teams/{teamId}`

```ts
export interface Team {
  id: string;
  name: string;
  slug: string;
  tag: string;
  logoUrl: string | null;
  players: Player[];
}
```

### `players/{playerId}`

```ts
export interface Player {
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
}
```

### `users/{uid}`

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

### `userBestScores/{uid_modeId}`

```ts
export interface UserBestScoreDocument {
  bestScore: number;
  displayName: string;
  modeId: GameModeId;
  photoUrl: string | null;
  uid: string;
  updatedAt: string;
}
```

### `userGameStats/{uid_modeId}`

```ts
export interface UserGameStatsDocument {
  averageScore: number;
  bestScore: number;
  gamesPlayed: number;
  lastPlayedAt: string;
  modeId: GameModeId;
  totalScore: number;
  uid: string;
}
```

### `gameSessions/{sessionId}`

```ts
export interface GameSessionDocument {
  durationMs: number;
  modeId: GameModeId;
  playedAt: string;
  score: number;
  status: "completed" | "lost";
  uid: string;
}
```

---

## 7. Security Rules Firestore actuellement a respecter

Le fichier `firestore.rules` a ete retire du repo parce que la source active est
Firebase Console.

Resume des droits attendus :

- lecture publique autorisee sur `teams`
- lecture publique autorisee sur `players`
- lecture publique autorisee sur `userBestScores` pour le ranking
- `users/{uid}` lisible et modifiable seulement par son owner connecte Google
- `userBestScores/{uid_modeId}` creatable/updatable seulement par son owner
- `userGameStats/{uid_modeId}` get/create/update seulement par son owner
- `gameSessions` creatable seulement par le user connecte pour lui-meme
- aucune ecriture client sur `teams`, `players`, `leaderboards`
- delete client interdit sur profils/scores/stats/sessions
- tout document non explicitement autorise doit rester refuse

Index Firestore attendu pour le ranking :

- collection `userBestScores`
- champ `modeId` asc
- champ `bestScore` desc

---

## 8. Variables d'environnement

### `.env.example`

Gabarit commit.

### `.env.local`

Fichier local **non commit**.

Variables attendues :

```env
NEXT_PUBLIC_FIREBASE_API_KEY="..."
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="..."
NEXT_PUBLIC_FIREBASE_PROJECT_ID="..."
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="..."
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="..."
NEXT_PUBLIC_FIREBASE_APP_ID="..."
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID="..."
```

Les `NEXT_PUBLIC_FIREBASE_*` ne sont pas des secrets admin. La vraie securite
vient de Firebase Auth + Security Rules.

---

## 9. Admin Firebase / import data

### Script

```powershell
npm.cmd run import:firestore
```

Le script lit `scripts/import-firestore.ts`.

Il attend :

- une auth admin Firebase locale via `GOOGLE_APPLICATION_CREDENTIALS` ou
  `FIREBASE_SERVICE_ACCOUNT_JSON`
- un JSON de data local ignore par Git :
  `scripts/firestore-import-data.local.json`

Exemple :

```powershell
$env:GOOGLE_APPLICATION_CREDENTIALS="C:\chemin\vers\service-account.json"
$env:FIRESTORE_IMPORT_SOURCE_PATH="C:\chemin\vers\firestore-import-data.local.json"
npm.cmd run import:firestore
```

Le fichier service account `*-firebase-adminsdk-*.json` doit rester hors Git.

---

## 10. Commandes projet

```powershell
npm.cmd install
npm.cmd run dev
npm.cmd run lint
npm.cmd run build
npm.cmd run test
```

URL locale :

```text
http://localhost:3000
```

---

## 11. `.gitignore` - ce qui doit rester ignore

- `.env.local` et tous les `.env*` sauf `.env.example`
- `*-firebase-adminsdk-*.json`
- `scripts/*.local.json`
- `scripts/*.admin.json`
- `frontend-dev-guidelines/`
- `.next/`, `node_modules/`, `out/`, `build/`

---

## 12. Etat Git / workflow

- branche stable : `main`
- branche de travail : `dev`
- chaque US ou refactor propre doit etre commit sur `dev`
- merge/fast-forward vers `main` seulement quand l'etat est valide
- ne jamais commit `frontend-dev-guidelines/`

---

## 13. Notes architecture / qualite

### Points bons

- separation claire `app/`, `features/`, `lib/`, `types/`
- logique metier de jeu testee en fonctions pures
- repositories Firestore isoles de l'UI
- gestion auth/scores centralisee

### Points encore ameliorables

- factoriser davantage certains ecrans de modes qui dupliquent des patterns UI
- corriger si besoin les noms de fichiers assets encore incoherents ou avec
  casse differente
- si tu veux deployer proprement les rules via CLI plus tard, il faudra
  reintroduire `firestore.rules` / `firestore.indexes.json` ou garder une copie
  source ailleurs
