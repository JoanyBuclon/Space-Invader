# Space Invader - Solution Étape 1

Ce dossier contient un exemple d'implémentation du jeu Space Invader pour l'Étape 1 de l'atelier Vibe Coding.

## Contenu

Cette solution implémente les fonctionnalités de base du Space Invader :

- **Le joueur** : placé en bas de l'écran, tire vers le haut (1 point de dégât par tir)
- **Les ennemis** : arrivent par vagues depuis le haut et descendent progressivement. Chaque vague est constituée de lignes d'ennemis, chacune d'elle constituée d'un certain nombre d'ennemis
- **Ligne de défense** : protège le joueur, si les ennemis l'atteignent, le joueur perd une vie
- **Conditions de victoire** : éliminer tous les ennemis de la vague (tous les ennemis de toutes les lignes)
- **Conditions de défaite** : perdre 3 vies

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

## Développement

Démarrer le serveur de développement :

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
