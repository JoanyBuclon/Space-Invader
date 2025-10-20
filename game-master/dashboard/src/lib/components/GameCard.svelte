<script lang="ts">
	import type { GameInfo } from '$lib/dashboardClient';

	interface Props {
		game: GameInfo;
	}

	let { game }: Props = $props();

	function formatTime(timestamp: number): string {
		const seconds = Math.floor((Date.now() - timestamp) / 1000);
		const minutes = Math.floor(seconds / 60);
		const hours = Math.floor(minutes / 60);

		if (hours > 0) {
			return `${hours}h ${minutes % 60}m`;
		}
		if (minutes > 0) {
			return `${minutes}m ${seconds % 60}s`;
		}
		return `${seconds}s`;
	}

	$effect(() => {
		// Trigger reactivity for time updates
		const interval = setInterval(() => {
			// Force re-render
		}, 1000);
		return () => clearInterval(interval);
	});

	const statusColors = {
		waiting: 'border-yellow-500 bg-yellow-900/20',
		active: 'border-green-500 bg-green-900/20',
		completed: 'border-slate-500 bg-slate-900/20'
	};

	const statusLabels = {
		waiting: 'En attente',
		active: 'En cours',
		completed: 'Terminée'
	};
</script>

<div class="border-2 rounded-lg p-4 {statusColors[game.status]} transition-all">
	<!-- Header -->
	<div class="flex justify-between items-start mb-3">
		<div>
			<h3 class="text-lg font-bold text-white truncate max-w-[200px]" title={game.gameId}>
				{game.gameId.split('-')[1]}
			</h3>
			<div class="text-xs text-slate-400 mt-1">{formatTime(game.startedAt)}</div>
		</div>
		<div class="flex flex-col items-end gap-1">
			<span class="text-xs font-semibold px-2 py-1 rounded bg-slate-800 text-slate-300">
				{statusLabels[game.status]}
			</span>
			{#if game.status === 'active'}
				<span class="text-sm font-bold text-cyan-400">
					Vague {game.currentWave}/{game.totalWaves}
				</span>
			{/if}
		</div>
	</div>

	<!-- Players -->
	<div class="space-y-2">
		{#each game.players as player (player.pseudo)}
			<div
				class="flex items-center justify-between bg-slate-800/50 rounded p-2 text-sm border border-slate-700"
			>
				<div class="flex items-center gap-2">
					<div
						class="w-2 h-2 rounded-full {player.isAlive ? 'bg-green-500' : 'bg-red-500'} {player.isAlive
							? 'animate-pulse'
							: ''}"
					></div>
					<span class="text-white font-semibold">{player.pseudo}</span>
				</div>
				<div class="flex items-center gap-3 text-xs">
					<div class="flex items-center gap-1">
						<span class="text-slate-400">❤️</span>
						<span class="text-white font-bold">{player.lives}</span>
					</div>
					<div class="flex items-center gap-1">
						<span class="text-slate-400">💀</span>
						<span class="text-white font-bold">{player.kills}</span>
					</div>
					{#if player.hasClearedWave && game.status === 'active'}
						<span class="text-green-400 text-xs">✓</span>
					{/if}
				</div>
			</div>
		{/each}
	</div>

	<!-- Progress Bar -->
	{#if game.status === 'active'}
		<div class="mt-3 space-y-1">
			<div class="flex justify-between text-xs text-slate-400">
				<span>Progression</span>
				<span>{game.currentWave} / {game.totalWaves}</span>
			</div>
			<div class="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
				<div
					class="h-full bg-gradient-to-r from-cyan-500 to-purple-500 transition-all duration-500"
					style="width: {(game.currentWave / game.totalWaves) * 100}%"
				></div>
			</div>
		</div>
	{/if}
</div>
