# 🎮 CDL Survival Game API (NestJS)

## 📌 Description du projet

Ce projet consiste à développer une API en **NestJS** pour un jeu de type **survie** basé sur les joueurs de la Call of Duty League.

Le principe du jeu est simple :

- le joueur voit l’image d’un joueur professionnel
- il doit deviner son nom
- chaque bonne réponse augmente son score
- à la première erreur, la partie se termine et le score est perdu

L’objectif est de proposer une expérience **fun, rapide et addictive**, tout en permettant aux joueurs d’améliorer leur connaissance de la scène compétitive.

## 🎯 Objectifs

- créer une API simple, performante et évolutive
- gérer des parties en mode survie
- servir des données de joueurs avec images et informations
- implémenter une logique de score basée sur l’enchaînement de bonnes réponses

## 📊 Métriques de succès

- temps moyen de session supérieur à 5 minutes
- minimum 3 parties par utilisateur
- augmentation du score moyen
- taux de rejouabilité supérieur à 40 %

## 👥 Utilisateurs cibles

- fans de la Call of Duty League
- nouveaux joueurs souhaitant découvrir les joueurs

## 🧠 Fonctionnalités principales

### 🎮 Mode survie

- la partie continue tant que le joueur répond correctement
- le score est basé sur le nombre de bonnes réponses consécutives
- la partie se termine immédiatement à la première erreur
- le score repart de zéro à chaque nouvelle partie

### 🎯 Difficulté progressive

- début : QCM avec 4 choix
- progression : QCM avec 3 choix
- niveau avancé : réponse libre

### 🧩 Feedback immédiat

- bonne réponse : validation et passage à la question suivante
- mauvaise réponse : affichage de la bonne réponse et fin de partie

### 🔁 Rejouabilité rapide

- possibilité de relancer une partie immédiatement
- nouvelle partie sans latence inutile

## 🗂️ Source des données

Les données sont actuellement stockées localement dans un dossier de ressources contenant les images des joueurs.

Exemple d’organisation :

    Ressource/
      Img/
        player1.png
        player2.png

La base de données n’existe pas encore. Le projet doit donc être pensé pour fonctionner d’abord avec des données locales, tout en préparant une migration propre vers une base plus tard.

## 🧱 Architecture technique (NestJS)

### Modules principaux

- GameModule
- PlayerModule
- SessionModule

### Structure recommandée

Organisation recommandée du projet :

    src/
      game/
        game.controller.ts
        game.service.ts
        game.module.ts
        dto/
          answer.dto.ts
          start-game.dto.ts
        interfaces/
          game-session.interface.ts
          game-question.interface.ts

      player/
        player.controller.ts
        player.service.ts
        player.module.ts
        interfaces/
          player.interface.ts

      session/
        session.service.ts
        session.module.ts
        interfaces/
          session.interface.ts

      common/
        types/
        utils/
        constants/

      app.module.ts
      main.ts

## 🔌 API Endpoints prévisionnels

### 🎮 Game

**POST /game/start**

Démarre une nouvelle partie.

Réponse attendue :

- identifiant de session
- première question
- score initial à 0

**POST /game/answer**

Envoie une réponse utilisateur.

Réponse attendue :

- `correct` : indique si la réponse est correcte
- `score` : score courant
- `gameOver` : indique si la partie est terminée
- `nextQuestion` : question suivante si la réponse est correcte
- `expectedAnswer` : bonne réponse si la partie est perdue

### 👤 Player

**GET /players**

Retourne la liste des joueurs disponibles.

**GET /players/random**

Retourne un joueur aléatoire.

## ⚙️ Logique métier

### Règles du jeu

- une bonne réponse augmente le score de 1
- une erreur met immédiatement fin à la partie
- le score repose uniquement sur les réponses consécutives
- une nouvelle partie repart toujours de zéro
- l’utilisateur ne conserve pas son avancement de manche après une défaite

### Règles de sélection des questions

- éviter de proposer deux fois le même joueur dans une même partie si possible
- mélanger l’ordre des joueurs aléatoirement
- adapter la difficulté selon le score atteint

### Règles de difficulté

- score faible : QCM avec 4 propositions
- score intermédiaire : QCM avec 3 propositions
- score élevé : réponse libre

## 🧠 Règles pour l’IA et pour le développement

### Principes généraux

Le code doit être pensé pour être lisible, maintenable et sérieux dès le début du projet, même si l’application est encore petite.

Il faut respecter strictement la séparation des responsabilités :

- les controllers gèrent uniquement la couche HTTP
- les services contiennent la logique métier
- les interfaces et DTO structurent les données
- les utilitaires communs sont isolés dans un dossier partagé

### Qualité de code attendue

- code clair et explicite
- pas de logique métier dans les controllers
- pas de duplication inutile
- fonctions courtes avec une seule responsabilité
- noms de variables et de méthodes compréhensibles
- typage strict partout

### Conventions de nommage

- PascalCase pour les classes, DTO et interfaces principales
- camelCase pour les variables, fonctions et méthodes
- kebab-case pour les noms de fichiers

### Validation et typage

- utiliser des DTO pour toutes les entrées
- utiliser `class-validator` pour valider les requêtes
- typer tous les retours de services et de controllers
- ne jamais utiliser `any` sans justification claire

### Gestion des erreurs

- utiliser les exceptions NestJS appropriées
- retourner des messages d’erreur explicites
- ne pas masquer les erreurs métier
- distinguer les erreurs utilisateur, les erreurs de validation et les erreurs internes

### Performance et structure

- éviter les lectures disque répétées inutiles
- charger les données des joueurs au démarrage si pertinent
- centraliser l’accès aux ressources dans un service dédié
- préparer une abstraction permettant de remplacer facilement la source locale par une base de données plus tard

### Maintenabilité

- chaque module doit rester autonome
- chaque fonctionnalité doit être testable indépendamment
- prévoir une structure qui supporte l’ajout futur de classement, statistiques et authentification
- écrire du code qui peut être repris facilement par un autre développeur

## 📁 Gestion des données locales

Pour l’instant, les joueurs et leurs images sont stockés localement.

Le projet devra prévoir une couche d’abstraction permettant de :

- lire les images depuis `Ressource/Img`
- associer chaque image à un joueur
- exposer ces données au reste de l’application sans dépendre directement du système de fichiers

Cela permettra plus tard de migrer simplement vers une base de données sans devoir réécrire toute la logique métier.

## 🚀 Évolutions futures

- ajout d’une base de données
- classement global des meilleurs scores
- statistiques par utilisateur
- mode multijoueur
- ajout d’indices
- mode équipe
- interface d’administration
- API publique

## ✅ Conclusion

Ce projet a pour but de créer une API NestJS propre et évolutive pour un jeu de survie autour des joueurs de la CDL.

Le jeu doit être rapide à comprendre, simple à jouer, frustrant juste ce qu’il faut pour donner envie de recommencer, et suffisamment bien structuré techniquement pour évoluer facilement par la suite.

Même sans base de données au départ, l’architecture doit déjà suivre les standards d’un projet sérieux.