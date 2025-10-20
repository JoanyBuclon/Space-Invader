# Space Invader - Multijoueur (Étape 2)

Solution complète du mode multijoueur pour l'atelier Space Invader (Vibe Coding Session 4 - Sfeir Bordeaux).

## Architecture

Ce projet implémente une architecture client-serveur complète pour un jeu Space Invader multijoueur synchronisé:

```
game-master/
├── server/        # Serveur Node.js avec gRPC + WebSocket
├── client/        # Client Svelte pour jouer
└── dashboard/     # Dashboard de monitoring Svelte
```

### Composants

#### Server (Node.js + TypeScript)
- **GameManager**: Gestion du lobby et matchmaking
- **GameInstance**: Gestion des parties individuelles et progression des vagues
- **gRPC Server**: Communication avec clients natifs (optionnel)
- **WebSocket Server**: Communication avec clients web (navigateurs)
- **Dashboard API**: Endpoint WebSocket pour le monitoring

#### Client (Svelte + TypeScript)
- **Lobby System**: Saisie du pseudonyme et salle d'attente
- **WebSocket Client**: Communication temps réel avec le serveur
- **Game Engine**: Moteur de jeu Canvas-based
- **Multiplayer State**: Synchronisation avec le serveur

#### Dashboard (Svelte + TypeScript)
- **WebSocket Client**: Connexion au serveur pour monitoring
- **Real-time Display**: Affichage en direct des parties
- **Stats Overview**: Vue d'ensemble des statistiques serveur

## Workflow du jeu

1. **Connexion**: Le joueur entre un pseudonyme
2. **Lobby**: Attente de 2-4 joueurs (configurable)
3. **Démarrage**: Le serveur démarre automatiquement la partie
4. **Vagues**: Le serveur envoie la configuration de chaque vague
   - Nombre d'ennemis par ligne
   - Nombre de lignes
   - Points de vie des ennemis
5. **Gameplay**: Les joueurs jouent chacun de leur côté
   - Le client envoie les événements au serveur (kills, deaths)
   - Le serveur synchronise la progression
6. **Progression**: Quand tous les joueurs ont terminé la vague
   - Le serveur lance la vague suivante
   - Difficulté progressive (plus d'ennemis, plus de HP)
7. **Fin**: Deux scénarios possibles
   - **Victoire**: Au moins un joueur survit toutes les vagues
     - Affichage des statistiques finales
     - Écran victoire/défaite selon le joueur
   - **Défaite totale**: Tous les joueurs meurent
     - Retour automatique au lobby après 5 secondes
     - Redémarrage automatique d'une nouvelle partie avec les mêmes joueurs
     - Continue tant qu'il y a assez de joueurs connectés

## Installation

Installer les dépendances pour les 3 projets:

```bash
# Server
cd server
pnpm install

# Client
cd ../client
pnpm install

# Dashboard
cd ../dashboard
pnpm install
```

## Développement

### Démarrer tous les services

**Terminal 1 - Server:**
```bash
cd server
pnpm dev
```
- gRPC: `localhost:50051`
- WebSocket: `localhost:3001`

**Terminal 2 - Client:**
```bash
cd client
pnpm dev
```
- Client: `http://localhost:5173`

**Terminal 3 - Dashboard:**
```bash
cd dashboard
pnpm dev
```
- Dashboard: `http://localhost:5174`

### Tester le multijoueur

1. Ouvrir plusieurs onglets de `http://localhost:5173`
2. Entrer un pseudonyme différent dans chaque onglet
3. Une fois 2 joueurs connectés, la partie démarre automatiquement
4. Ouvrir `http://localhost:5174` pour monitorer la partie

## Configuration

### Server

Variables d'environnement (optionnelles):

```bash
GRPC_PORT=50051        # Port gRPC
HTTP_PORT=3001         # Port HTTP/WebSocket
MIN_PLAYERS=2          # Joueurs minimum
MAX_PLAYERS=4          # Joueurs maximum
LOG_LEVEL=INFO         # Niveau de log
```

Modifier la configuration des vagues dans `server/src/config/gameConfig.ts`.

### Client

Créer `client/.env` (optionnel):

```bash
PUBLIC_WS_SERVER_URL=ws://localhost:3001/game
```

### Dashboard

URL du serveur configurée dans `dashboard/src/lib/dashboardClient.ts`.

## Protocole de communication

### Client → Server

- `player-joined(pseudo)`: Connexion au lobby
- `player-disconnected(pseudo)`: Déconnexion
- `player-touched(pseudo)`: Perte d'une vie
- `enemy-killed(pseudo)`: Ennemi éliminé
- `wave-cleared(pseudo)`: Vague complétée
- `player-killed(pseudo)`: Joueur mort (0 vies)

### Server → Client

- `lobby-update`: Mise à jour du lobby (joueurs en attente)
- `game-started(numberOfWaves, lifePoints, players)`: Début de partie
- `wave-started(waveNumber, numberOfEnemies, numberOfLines, enemyLife)`: Nouvelle vague
- `game-ended(victory, playerStats)`: Fin de partie
- `error(message, code)`: Erreur

## Technologies

### Backend
- Node.js + TypeScript (ESM)
- @grpc/grpc-js (gRPC server)
- ws (WebSocket server)
- Protocol Buffers (définition des messages)

### Frontend
- SvelteKit (framework)
- Svelte 5 (runes)
- TypeScript (strict mode)
- TailwindCSS 4.x (styling)
- Canvas API (rendu du jeu)

### Communication
- gRPC (optionnel, pour clients natifs)
- WebSocket (clients web navigateur)
- Protocol Buffers (sérialisation)

## Structure détaillée

```
game-master/
├── server/
│   ├── proto/              # Définitions Protocol Buffers
│   ├── src/
│   │   ├── config/         # Configuration du jeu
│   │   ├── game/           # Logique de jeu
│   │   ├── grpc/           # Serveur gRPC
│   │   ├── http/           # Serveurs HTTP/WebSocket
│   │   ├── utils/          # Utilitaires
│   │   └── server.ts       # Point d'entrée
│   └── package.json
├── client/
│   ├── src/
│   │   ├── lib/
│   │   │   ├── components/ # Composants Svelte
│   │   │   ├── game/       # Logique de jeu
│   │   │   └── grpc/       # Client WebSocket
│   │   └── routes/
│   └── package.json
└── dashboard/
    ├── src/
    │   ├── lib/
    │   │   ├── components/ # Composants dashboard
    │   │   └── dashboardClient.ts
    │   └── routes/
    └── package.json
```

## Production

Build tous les projets:

```bash
# Server
cd server && pnpm build

# Client
cd ../client && pnpm build

# Dashboard
cd ../dashboard && pnpm build
```

## Notes importantes

- Le serveur doit TOUJOURS être lancé en premier
- Le client vérifie la connexion avant de permettre de jouer
- Le dashboard se reconnecte automatiquement en cas de déconnexion
- Les parties sont nettoyées automatiquement après 30 minutes
- Le lobby expire après 5 minutes d'inactivité
- Maximum 10 tentatives de reconnexion pour les clients
- **Auto-restart**: Quand tous les joueurs meurent, une nouvelle partie démarre automatiquement après 5 secondes
- Si pas assez de joueurs restent connectés, ils retournent au lobby classique
- **Inactivity timeout**: Les joueurs inactifs (pas d'événement) pendant 40 secondes sont automatiquement marqués comme morts

## Troubleshooting

**Le client ne se connecte pas:**
- Vérifier que le serveur est lancé
- Vérifier l'URL WebSocket dans la console
- Vérifier les logs du serveur

**Les vagues ne démarrent pas:**
- Vérifier que MIN_PLAYERS est atteint
- Vérifier les logs du serveur
- Vérifier que tous les clients sont bien connectés

**Le dashboard est vide:**
- Vérifier la connexion WebSocket
- Vérifier que des parties sont en cours
- Rafraîchir la page

## Licence

MIT - Sfeir Bordeaux - Vibe Coding Session 4
