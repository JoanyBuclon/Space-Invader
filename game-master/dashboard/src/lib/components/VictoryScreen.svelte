<script lang="ts">
	import type { GameInfo } from '$lib/dashboardClient';

	interface Props {
		game: GameInfo;
	}

	let { game }: Props = $props();
	let timeRemaining = $state(10);

	// Countdown timer
	$effect(() => {
		const interval = setInterval(() => {
			if (timeRemaining > 0) {
				timeRemaining--;
			}
		}, 1000);

		return () => clearInterval(interval);
	});

	// Sort players by kills (winners list)
	const sortedPlayers = $derived(
		[...game.players].sort((a, b) => b.kills - a.kills)
	);

	const winners = $derived(sortedPlayers.filter((p) => p.isAlive));
	const totalKills = $derived(game.players.reduce((sum, p) => sum + p.kills, 0));
</script>

<div class="fixed inset-0 bg-slate-950/95 backdrop-blur-lg flex items-center justify-center z-50 animate-fade-in">
	<div class="max-w-4xl w-full px-8 space-y-8">
		<!-- Victory Banner -->
		<div class="text-center space-y-4">
			<div class="text-8xl animate-bounce">🎉</div>
			<h1 class="text-7xl font-bold bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-400 bg-clip-text text-transparent animate-pulse">
				VICTOIRE!
			</h1>
			<p class="text-3xl text-slate-300">Toutes les vagues ont été vaincues!</p>
		</div>

		<!-- Game Stats -->
		<div class="grid grid-cols-3 gap-6">
			<div class="bg-gradient-to-br from-yellow-900/30 to-orange-900/30 border-2 border-yellow-500/50 rounded-2xl p-6 text-center">
				<div class="text-yellow-400 text-sm font-semibold uppercase tracking-wide mb-2">Vagues</div>
				<div class="text-5xl font-bold text-white">{game.totalWaves}</div>
				<div class="text-slate-400 text-sm mt-1">Complétées</div>
			</div>
			<div class="bg-gradient-to-br from-red-900/30 to-pink-900/30 border-2 border-red-500/50 rounded-2xl p-6 text-center">
				<div class="text-red-400 text-sm font-semibold uppercase tracking-wide mb-2">Kills</div>
				<div class="text-5xl font-bold text-white">{totalKills}</div>
				<div class="text-slate-400 text-sm mt-1">Ennemis éliminés</div>
			</div>
			<div class="bg-gradient-to-br from-green-900/30 to-cyan-900/30 border-2 border-green-500/50 rounded-2xl p-6 text-center">
				<div class="text-green-400 text-sm font-semibold uppercase tracking-wide mb-2">Survivants</div>
				<div class="text-5xl font-bold text-white">{winners.length}</div>
				<div class="text-slate-400 text-sm mt-1">Joueurs en vie</div>
			</div>
		</div>

		<!-- Winners List -->
		<div class="bg-slate-800/50 border-2 border-yellow-500/50 rounded-2xl p-8">
			<h2 class="text-3xl font-bold text-center mb-6 bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
				🏆 Gagnants 🏆
			</h2>
			<div class="space-y-4">
				{#each winners as player, index}
					<div class="flex items-center gap-6 bg-gradient-to-r from-yellow-900/20 to-orange-900/20 border-2 border-yellow-500/30 rounded-xl p-6 animate-slide-in" style="animation-delay: {index * 100}ms">
						<!-- Rank -->
						<div class="text-6xl font-bold text-yellow-400">
							{#if index === 0}
								🥇
							{:else if index === 1}
								🥈
							{:else if index === 2}
								🥉
							{:else}
								{index + 1}
							{/if}
						</div>

						<!-- Player Info -->
						<div class="flex-1">
							<div class="text-3xl font-bold text-white">{player.pseudo}</div>
							<div class="flex gap-6 mt-2">
								<div class="flex items-center gap-2">
									<span class="text-xl">❤️</span>
									<span class="text-xl font-semibold text-red-400">{player.lives} vies</span>
								</div>
								<div class="flex items-center gap-2">
									<span class="text-xl">💀</span>
									<span class="text-xl font-semibold text-cyan-400">{player.kills} kills</span>
								</div>
							</div>
						</div>

						<!-- Trophy Animation -->
						{#if index === 0}
							<div class="text-5xl animate-spin-slow">🏆</div>
						{/if}
					</div>
				{/each}
			</div>
		</div>

		<!-- Restart Countdown -->
		<div class="text-center space-y-4">
			<div class="inline-flex items-center gap-3 bg-slate-800/70 border-2 border-cyan-500/50 rounded-full px-8 py-4">
				<span class="text-2xl">🔄</span>
				<span class="text-xl text-slate-300">Nouvelle partie dans</span>
				<span class="text-3xl font-bold text-cyan-400 min-w-[3ch]">{timeRemaining}s</span>
			</div>
		</div>
	</div>
</div>

<style>
	@keyframes fade-in {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	@keyframes slide-in {
		from {
			opacity: 0;
			transform: translateX(-50px);
		}
		to {
			opacity: 1;
			transform: translateX(0);
		}
	}

	@keyframes spin-slow {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}

	.animate-fade-in {
		animation: fade-in 0.5s ease-out;
	}

	.animate-slide-in {
		animation: slide-in 0.5s ease-out forwards;
		opacity: 0;
	}

	.animate-spin-slow {
		animation: spin-slow 3s linear infinite;
	}
</style>
