# Space Invader - Dashboard (Étape 2)

Dashboard de monitoring en temps réel pour les parties multijoueurs Space Invader.

## Fonctionnalités

- **Monitoring en temps réel** des parties actives via WebSocket
- **Vue d'ensemble** des statistiques serveur (parties, joueurs, uptime)
- **Détails des parties** avec progression des vagues et état des joueurs
- **Mise à jour automatique** toutes les 2 secondes
- **Reconnexion automatique** en cas de perte de connexion

## Stack Technique

- **Framework**: SvelteKit avec Vite
- **Langage**: TypeScript
- **Styling**: TailwindCSS 4.x
- **Version Svelte**: 5.x
- **Communication**: WebSocket

## Installation

```bash
pnpm install
# ou npm install, yarn
```

## Développement

**Important**: Le serveur doit être lancé avant le dashboard!

1. Dans un terminal, lancer le serveur:
```bash
cd ../server
pnpm dev
```

2. Dans un autre terminal, lancer le dashboard:
```bash
pnpm dev
```

Le dashboard sera accessible sur `http://localhost:5174`

## Build

Créer une version de production:

```bash
pnpm build
```

Prévisualiser la version de production:

```bash
pnpm preview
```

## Configuration

Par défaut, le dashboard se connecte à `ws://localhost:3001`.

Pour modifier l'URL du serveur, éditer `src/lib/dashboardClient.ts`:

```typescript
constructor(serverUrl: string = 'ws://localhost:3001') {
```

## Interface

### Vue principale

- **Statistiques globales**: Parties totales, parties actives, joueurs connectés, uptime
- **Liste des parties**: Toutes les parties en cours avec détails

### Carte de partie

Pour chaque partie, affiche:
- ID de la partie
- Temps écoulé depuis le début
- Statut (En attente / En cours / Terminée)
- Vague actuelle / total
- Liste des joueurs avec:
  - Statut (vivant/mort)
  - Vies restantes
  - Nombre de kills
  - Progression (vague complétée ou non)

## Structure du projet

```
dashboard/
├── src/
│   ├── lib/
│   │   ├── components/
│   │   │   ├── GameCard.svelte    # Carte de partie individuelle
│   │   │   └── StatsCard.svelte   # Statistiques serveur
│   │   └── dashboardClient.ts     # Client WebSocket
│   ├── routes/
│   │   ├── +layout.svelte
│   │   └── +page.svelte           # Page principale
│   ├── app.css
│   ├── app.d.ts
│   └── app.html
├── package.json
├── tsconfig.json
├── svelte.config.js
├── vite.config.ts
└── README.md
```

## Qualité du Code

Vérifier les types et le code:

```bash
pnpm check
```

Linter et vérifier le formatage:

```bash
pnpm lint
```

Formater le code:

```bash
pnpm format
```

## Notes de développement

- Mise à jour automatique toutes les 2 secondes
- Reconnexion automatique avec backoff (max 10 tentatives)
- Affichage temps réel de la durée des parties
- Interface responsive (mobile, tablet, desktop)

## Troubleshooting

**Le dashboard ne se connecte pas:**
- Vérifier que le serveur est lancé
- Vérifier l'URL du serveur dans `dashboardClient.ts`
- Vérifier les logs du serveur pour les erreurs WebSocket

**Les données ne se mettent pas à jour:**
- Vérifier la connexion WebSocket dans la console du navigateur
- Vérifier que le serveur envoie bien les mises à jour

**Erreur au build:**
- Supprimer `node_modules` et `.svelte-kit`
- Relancer `pnpm install`
