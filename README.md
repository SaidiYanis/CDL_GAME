# CDL Survival Game

Jeu web autour de la **Call of Duty League**, avec plusieurs modes de survie,
un roster interactif, un profil joueur, et un leaderboard global par mode.

## Fonctionnalités

- 6 modes de jeu
- connexion Google
- sauvegarde des records et stats par mode
- leaderboards Firestore
- page roster CDL par équipes
- feedback visuel et sonore en partie

## Modes de jeu

- **Deviner le joueur** : retrouver le pseudo à partir de la photo
- **Plus jeune / plus vieux** : comparer l'âge entre 2 joueurs
- **Qui a le plus de titres** : comparer les Major, puis Major + World tous les 3 rounds
- **Meilleure note BP** : comparer la meilleure note entre 2 joueurs
- **Trier AR / SMG** : classer 10 joueurs par rôle
- **Title Radar** : placer 5 joueurs en `+`, `=` ou `-` par rapport à une cible de titres

## Stack

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- Firebase Auth
- Cloud Firestore

## Lancer le projet en local

```powershell
npm.cmd install
npm.cmd run dev
```

Puis ouvrir :

```text
http://localhost:3000
```

## Configuration Firebase

Créer un fichier `.env.local` à la racine du projet :

```env
NEXT_PUBLIC_FIREBASE_API_KEY="..."
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="..."
NEXT_PUBLIC_FIREBASE_PROJECT_ID="..."
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="..."
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="..."
NEXT_PUBLIC_FIREBASE_APP_ID="..."
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID="..."
```

Les données `players`, `teams`, `userBestScores`, `userGameStats` et
`gameSessions` sont lues/écrites via **Firestore**.

Les images et sons restent servis depuis `public/ressource/`.

## Important

- **Aucune clé Firebase admin n'est nécessaire pour jouer**
- la clé admin/service-account sert seulement aux scripts d'import privés
- les API routes serveur `app/api/game-sessions/*` peuvent utiliser une clé
  admin **côté serveur uniquement** pour finaliser les scores et réduire la
  triche par écriture directe Firestore
- les règles de sécurité Firestore doivent autoriser :
  - la lecture publique de `players`, `teams`, `userBestScores`
  - l'écriture par l'utilisateur connecté uniquement sur ses propres documents

## Scripts

```powershell
npm.cmd run dev
npm.cmd run build
npm.cmd run lint
npm.cmd run test
```

Script admin mainteneur uniquement :

```powershell
npm.cmd run import:firestore
```

## Structure

```text
app/          routes Next.js
src/features/ UI + logique métier par domaine
src/lib/      Firebase, data repositories, utils, audio
src/types/    types métier
public/       assets images et sons
scripts/      scripts admin locaux
```

## Notes

- `main` = branche stable
- `dev` = branche de développement
- `frontend-dev-guidelines/` reste local et ne doit pas être commit
