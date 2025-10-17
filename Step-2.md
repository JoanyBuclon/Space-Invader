# Etape 2

## On va maintenant rendre le jeu Multijoueur!

Votre version du Space Invader va devoir venir se connecter à un server qui va gérer des parties synchronisées.

Les échanges clients / server auront lieu en gRPC.

## Les évènements à implémenter

### Evènements envoyés par le serveur

- game-started (int numberOfWaves, int lifePoints)
- game-ended
- wave-started (int numberOfEnemies, int enemyLife)

### Evènements envoyés par les clients

- player-joined (string pseudo)
- player-disconnected (string pseudo)
- player-touched (string pseudo)
- wave-cleared (string pseudo)
- ennemi-killed (string pseudo)
- player-killed (string pseudo)

### Les valeurs attendues

- numberOfWaves: le nombre de vagues que les joueurs vont affronter
- lifePoints: le nombre de pv que les joueurs ont en démarrant la partie
- numberOfEnemies: le nombre d'ennemis présents dans la vague
- enemyLife: le nombre de points de vie des ennemis (on rappelle que l'arme du joueur enlève 1 point de vie à la fois)
- pseudo: la chaine de caractères correspondant au nom du joueur

## Exemple de Workflow du jeu à plusieurs

- Votre jeu va devoir demander au joueur un pseudonyme afin de pouvoir l'identifier par rapport aux autres joueurs

- En cas de déconnexion, le client tente de prévenir le server

- Une fois des joueurs connectés, le server va démarrer une partie pour eux en leur indiquant le nombre de vagues qu'ils vont devoir affronter et le nombre de points de vie des joueurs.

- Le server lancera une première vague en indiquant le nombre d'ennemis et leurs points de vie.

- A chaque fois qu'un joueur élimine un ennemi ou qu'il perd un point de vie, le client prévient le server.

- Si le joueur n'a plus de points de vie, le client prévient le server.

- Si le joueur a éliminé tous les ennemis, le client prévient le server.

- Une fois que tous les joueurs ont vaincu la vague d'ennemis ou qu'ils sont morts, le server démarre une nouvelle vague.

- Une fois toutes les vagues éliminées, le server prévient les joueurs.

## Solution

Vous trouverez dans le dossier [game-master](game-master):

- /server: un exemple de code server réalisé en Go.
- /client: un exemple de Space Invader pouvant se connecter au server et réalisé avec Svelte.
- /dashboard: Une interface graphique pour le server, réalisée en Svelte et permettant de suivre toutes les parties en cours.
