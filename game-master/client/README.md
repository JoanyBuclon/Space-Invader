# Space Invader - Client Multijoueur (Étape 2)

Ce dossier contient le client du jeu Space Invader pour l'Étape 2 de l'atelier Vibe Coding.

## Contenu

Ce client implémente le mode multijoueur synchronisé via WebSocket :

- **Lobby system** : les joueurs entrent un pseudonyme et attendent dans un lobby
- **Synchronisation** : le serveur gère les parties et envoie les paramètres de chaque vague
- **Communication WebSocket** : échange bidirectionnel d'événements entre client et serveur
- **Gameplay partagé** : tous les joueurs affrontent les mêmes vagues simultanément
- **Progression collective** : la vague suivante démarre quand tous les joueurs l'ont vaincue ou sont morts
- **Configuration dynamique** : le nombre d'ennemis, lignes et HP sont définis par le serveur

### Événements envoyés au serveur

- `player-joined(string pseudo)` : connexion du joueur
- `player-disconnected(string pseudo)` : déconnexion du joueur
- `player-touched(string pseudo)` : le joueur perd une vie
- `enemy-killed(string pseudo)` : le joueur élimine un ennemi
- `wave-cleared(string pseudo)` : le joueur termine la vague
- `player-killed(string pseudo)` : le joueur n'a plus de vies

### Événements reçus du serveur

- `game-started(int numberOfWaves, int lifePoints)` : début de partie
- `wave-started(int numberOfEnemies, int numberOfLines, int enemyLife)` : nouvelle vague
- `game-ended` : fin de partie

## Stack Technique

- **Framework** : SvelteKit avec Vite
- **Langage** : TypeScript
- **Styling** : TailwindCSS 4.x
- **Version Svelte** : 5.x

## Installation

```sh
pnpm install
# ou npm install, yarn
```

## Configuration

Créer un fichier `.env` (optionnel) :

```bash
# WebSocket Server URL
PUBLIC_WS_SERVER_URL=ws://localhost:3001/game
```

Par défaut, le client se connecte à `ws://localhost:3001/game`.

## Développement

**Important** : Le serveur doit être lancé avant le client!

1. Dans un terminal, lancer le serveur :
```sh
cd ../server
pnpm dev
```

2. Dans un autre terminal, lancer le client :
```sh
pnpm dev

# ou ouvrir automatiquement dans le navigateur
pnpm dev -- --open
```

## Build

Créer une version de production :

```sh
pnpm build
```

Prévisualiser la version de production :

```sh
pnpm preview
```

## Qualité du Code

Vérifier les types et le code :

```sh
pnpm check
```

Linter et vérifier le formatage :

```sh
pnpm lint
```

Formater le code :

```sh
pnpm format
```
