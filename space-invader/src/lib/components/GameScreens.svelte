<script lang="ts">
	import type { GameStateManager } from '$lib/game/gameState.svelte';
	import { CANVAS_WIDTH, CANVAS_HEIGHT } from '$lib/game/constants';

	interface Props {
		gameState: GameStateManager;
	}

	let { gameState }: Props = $props();

	function handleStart() {
		gameState.initGame();
	}

	function handleRestart() {
		gameState.initGame();
	}
</script>

<!-- Start Screen -->
{#if gameState.gameState === 'menu'}
	<div
		class="absolute inset-0 flex items-center justify-center bg-slate-900/95 backdrop-blur-sm"
		style="width: {CANVAS_WIDTH}px; height: {CANVAS_HEIGHT}px;"
	>
		<div class="text-center space-y-8 animate-fade-in">
			<!-- Title -->
			<div class="space-y-2">
				<h1
					class="text-6xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent drop-shadow-2xl"
				>
					SPACE INVADER
				</h1>
				<div class="text-cyan-400 text-sm tracking-widest">VIBE CODING - SFEIR BORDEAUX</div>
			</div>

			<!-- Instructions -->
			<div
				class="bg-slate-800/50 backdrop-blur-sm border-2 border-cyan-500 rounded-lg p-6 max-w-md mx-auto shadow-2xl shadow-cyan-500/20"
			>
				<h2 class="text-xl font-bold text-cyan-400 mb-4">Mission</h2>
				<div class="text-left text-slate-300 space-y-2 text-sm">
					<p>✦ Éliminez tous les ennemis avant qu'ils n'atteignent la ligne de défense</p>
					<p>✦ Chaque ennemi qui franchit la ligne vous coûte une vie</p>
					<p>✦ Vous avez 3 vies pour réussir</p>
				</div>
			</div>

			<!-- Controls -->
			<div
				class="bg-slate-800/50 backdrop-blur-sm border-2 border-purple-500 rounded-lg p-4 max-w-md mx-auto shadow-2xl shadow-purple-500/20"
			>
				<h3 class="text-lg font-bold text-purple-400 mb-3">Contrôles</h3>
				<div class="flex justify-center gap-6 text-sm">
					<div class="text-center">
						<div class="text-slate-400">Déplacer</div>
						<div class="text-white font-mono font-bold">← →</div>
					</div>
					<div class="text-center">
						<div class="text-slate-400">Tirer</div>
						<div class="text-white font-mono font-bold">ESPACE</div>
					</div>
				</div>
			</div>

			<!-- Start Button -->
			<button
				onclick={handleStart}
				class="group relative px-8 py-4 text-xl font-bold text-white bg-gradient-to-r from-cyan-500 to-purple-500 rounded-lg shadow-2xl hover:shadow-cyan-500/50 transition-all duration-300 hover:scale-105 active:scale-95"
			>
				<span class="relative z-10">COMMENCER</span>
				<div
					class="absolute inset-0 rounded-lg bg-gradient-to-r from-cyan-400 to-purple-400 opacity-0 group-hover:opacity-100 blur transition-opacity duration-300"
				></div>
			</button>
		</div>
	</div>
{/if}

<!-- Victory Screen -->
{#if gameState.gameState === 'won'}
	<div
		class="absolute inset-0 flex items-center justify-center bg-slate-900/95 backdrop-blur-sm"
		style="width: {CANVAS_WIDTH}px; height: {CANVAS_HEIGHT}px;"
	>
		<div class="text-center space-y-8 animate-fade-in">
			<!-- Title -->
			<div class="space-y-4">
				<h1
					class="text-7xl font-bold bg-gradient-to-r from-green-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent drop-shadow-2xl animate-pulse"
				>
					VICTOIRE!
				</h1>
				<div class="text-3xl text-green-400">🎉 Mission accomplie! 🎉</div>
			</div>

			<!-- Stats -->
			<div
				class="bg-slate-800/50 backdrop-blur-sm border-2 border-green-500 rounded-lg p-6 max-w-md mx-auto shadow-2xl shadow-green-500/20"
			>
				<h2 class="text-2xl font-bold text-green-400 mb-4">Statistiques</h2>
				<div class="space-y-3 text-left">
					<div class="flex justify-between items-center">
						<span class="text-slate-300">Score final:</span>
						<span class="text-2xl font-bold text-white font-mono">{gameState.stats.score}</span>
					</div>
					<div class="flex justify-between items-center">
						<span class="text-slate-300">Ennemis éliminés:</span>
						<span class="text-xl font-bold text-green-400">{gameState.stats.enemiesKilled}</span>
					</div>
					<div class="flex justify-between items-center">
						<span class="text-slate-300">Tirs effectués:</span>
						<span class="text-xl font-bold text-cyan-400">{gameState.stats.shotsFired}</span>
					</div>
					<div class="flex justify-between items-center">
						<span class="text-slate-300">Précision:</span>
						<span class="text-xl font-bold text-purple-400">
							{Math.round((gameState.stats.enemiesKilled / gameState.stats.shotsFired) * 100)}%
						</span>
					</div>
				</div>
			</div>

			<!-- Restart Button -->
			<button
				onclick={handleRestart}
				class="group relative px-8 py-4 text-xl font-bold text-white bg-gradient-to-r from-green-500 to-cyan-500 rounded-lg shadow-2xl hover:shadow-green-500/50 transition-all duration-300 hover:scale-105 active:scale-95"
			>
				<span class="relative z-10">REJOUER</span>
				<div
					class="absolute inset-0 rounded-lg bg-gradient-to-r from-green-400 to-cyan-400 opacity-0 group-hover:opacity-100 blur transition-opacity duration-300"
				></div>
			</button>
		</div>
	</div>
{/if}

<!-- Game Over Screen -->
{#if gameState.gameState === 'gameOver'}
	<div
		class="absolute inset-0 flex items-center justify-center bg-slate-900/95 backdrop-blur-sm"
		style="width: {CANVAS_WIDTH}px; height: {CANVAS_HEIGHT}px;"
	>
		<div class="text-center space-y-8 animate-fade-in">
			<!-- Title -->
			<div class="space-y-4">
				<h1
					class="text-7xl font-bold bg-gradient-to-r from-red-500 via-orange-500 to-red-500 bg-clip-text text-transparent drop-shadow-2xl"
				>
					GAME OVER
				</h1>
				<div class="text-2xl text-red-400">Mission échouée...</div>
			</div>

			<!-- Stats -->
			<div
				class="bg-slate-800/50 backdrop-blur-sm border-2 border-red-500 rounded-lg p-6 max-w-md mx-auto shadow-2xl shadow-red-500/20"
			>
				<h2 class="text-2xl font-bold text-red-400 mb-4">Statistiques</h2>
				<div class="space-y-3 text-left">
					<div class="flex justify-between items-center">
						<span class="text-slate-300">Score final:</span>
						<span class="text-2xl font-bold text-white font-mono">{gameState.stats.score}</span>
					</div>
					<div class="flex justify-between items-center">
						<span class="text-slate-300">Ennemis éliminés:</span>
						<span class="text-xl font-bold text-orange-400">{gameState.stats.enemiesKilled}</span>
					</div>
					<div class="flex justify-between items-center">
						<span class="text-slate-300">Tirs effectués:</span>
						<span class="text-xl font-bold text-cyan-400">{gameState.stats.shotsFired}</span>
					</div>
				</div>
			</div>

			<!-- Restart Button -->
			<button
				onclick={handleRestart}
				class="group relative px-8 py-4 text-xl font-bold text-white bg-gradient-to-r from-red-500 to-orange-500 rounded-lg shadow-2xl hover:shadow-red-500/50 transition-all duration-300 hover:scale-105 active:scale-95"
			>
				<span class="relative z-10">RÉESSAYER</span>
				<div
					class="absolute inset-0 rounded-lg bg-gradient-to-r from-red-400 to-orange-400 opacity-0 group-hover:opacity-100 blur transition-opacity duration-300"
				></div>
			</button>
		</div>
	</div>
{/if}

<style>
	@keyframes fade-in {
		from {
			opacity: 0;
			transform: translateY(20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.animate-fade-in {
		animation: fade-in 0.6s ease-out;
	}
</style>
