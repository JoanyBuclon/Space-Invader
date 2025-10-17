# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This repository contains a Space Invader coding workshop (Vibe Coding Session 4 by Sfeir Bordeaux) with progressive implementation steps. Participants build a Space Invader game using AI tools and their choice of technology stack.

The repository contains:
- **space-invader/**: Step 1 solution - basic single-player Space Invader game (Svelte + SvelteKit)
- **game-master/**: Step 2 solution structure - multiplayer implementation with:
  - `server/`: Go server managing synchronized multiplayer games via gRPC
  - `client/`: Svelte client that connects to the multiplayer server
  - `dashboard/`: Svelte dashboard for monitoring ongoing games

## Workshop Steps

### Step 1: Basic Space Invader (Etape 1)
Implement core game mechanics:
- Player at bottom of screen shoots upward, each hit deals 1 damage
- Player protected by a defense line
- Enemies arrive in waves from top, descending toward player
- When enemies reach defense line, player loses 1 life
- Win condition: eliminate all enemies in the wave
- Lose condition: lose 3 lives

### Step 2: Multiplayer with gRPC (Etape 2)
Add multiplayer functionality with server-client architecture using gRPC.

**Server-to-client events:**
- `game-started(int numberOfWaves, int lifePoints)`
- `game-ended`
- `wave-started(int numberOfEnemies, int enemyLife)`

**Client-to-server events:**
- `player-joined(string pseudo)`
- `player-disconnected(string pseudo)`
- `player-touched(string pseudo)`
- `wave-cleared(string pseudo)`
- `enemy-killed(string pseudo)`
- `player-killed(string pseudo)`

## Development Commands

### space-invader/ (Svelte + SvelteKit)

```bash
cd space-invader
npm install       # or pnpm install, yarn
npm run dev       # Start development server
npm run build     # Production build
npm run preview   # Preview production build
npm run check     # Type check with svelte-check
npm run lint      # Run ESLint and Prettier checks
npm run format    # Format code with Prettier
```

## Architecture Notes

### space-invader/
- **Framework**: SvelteKit with Vite, Svelte 5, TypeScript
- **Styling**: TailwindCSS 4.x
- **Structure**: Standard SvelteKit structure with routes in `src/routes/`
- The implementation is currently a boilerplate SvelteKit app

### game-master/
The multiplayer implementation directories (server/, client/, dashboard/) are currently empty placeholders. They are intended to contain:
- Go-based gRPC server for game state management
- Svelte client with gRPC integration for multiplayer
- Monitoring dashboard built with Svelte

## Code Quality Standards

All development must adhere to:
- **ESLint**: Follow all ESLint rules configured in the project
- **Prettier**: Code must be formatted according to Prettier configuration
- **Best Practices**: Follow established best practices for the respective technology stack (Svelte, TypeScript, Go)

Always run `npm run lint` and `npm run format` before committing changes in the space-invader/ directory.

## Package Manager

The project uses pnpm (indicated by `pnpm-lock.yaml` and `.npmrc` in space-invader/).
