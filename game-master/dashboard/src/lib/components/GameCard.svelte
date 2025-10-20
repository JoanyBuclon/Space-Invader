<script lang="ts">
	import type { GameInfo } from '$lib/dashboardClient';

	interface Props {
		game: GameInfo;
	}

	let { game }: Props = $props();
	let currentTime = $state(Date.now());

	function formatTime(timestamp: number): string {
		const seconds = Math.floor((currentTime - timestamp) / 1000);
		const minutes = Math.floor(seconds / 60);
		const hours = Math.floor(minutes / 60);

		if (hours > 0) {
			return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
		}
		if (minutes > 0) {
			return `${minutes}m ${seconds % 60}s`;
		}
		return `${seconds}s`;
	}

	$effect(() => {
		// Update time every second for live timer
		const interval = setInterval(() => {
			currentTime = Date.now();
		}, 1000);
		return () => clearInterval(interval);
	});

	const statusConfig = {
		waiting: {
			color: 'border-yellow-500 bg-yellow-900/20',
			label: 'En attente',
			gradient: 'from-yellow-500 to-orange-500',
			icon: '⏳'
		},
		active: {
			color: 'border-green-500 bg-green-900/20',
			label: 'En cours',
			gradient: 'from-green-500 to-cyan-500',
			icon: '🎮'
		},
		completed: {
			color: 'border-purple-500 bg-purple-900/20',
			label: 'Terminée',
			gradient: 'from-purple-500 to-pink-500',
			icon: '✅'
		}
	};

	const config = $derived(statusConfig[game.status]);
	const alivePlayers = $derived(game.players.filter((p) => p.isAlive).length);
	const totalKills = $derived(game.players.reduce((sum, p) => sum + p.kills, 0));
</script>

<div
	class="border-4 rounded-2xl p-8 {config.color} backdrop-blur-sm transition-all shadow-2xl shadow-{config.gradient.split(
		'-'
	)[1]}-500/30"
>
	<!-- Header -->
	<div class="flex justify-between items-start mb-8">
		<div class="space-y-2">
			<div class="flex items-center gap-3">
				<span class="text-4xl">{config.icon}</span>
				<div>
					<h3 class="text-3xl font-bold text-white" title={game.gameId}>
						Partie #{game.gameId.split('-')[1]}
					</h3>
					<div class="flex items-center gap-3 mt-1">
						<span class="text-lg text-slate-400">⏱ {formatTime(game.startedAt)}</span>
						<span
							class="text-sm font-semibold px-3 py-1 rounded-full bg-gradient-to-r {config.gradient} text-white"
						>
							{config.label}
						</span>
					</div>
				</div>
			</div>
		</div>

		{#if game.status === 'active'}
			<div class="text-right">
				<div class="text-5xl font-bold bg-gradient-to-r {config.gradient} bg-clip-text text-transparent">
					{game.currentWave}/{game.totalWaves}
				</div>
				<div class="text-slate-400 text-sm mt-1">Vague actuelle</div>
			</div>
		{/if}
	</div>

	<!-- Game Stats -->
	<div class="grid grid-cols-3 gap-4 mb-8">
		<div class="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
			<div class="text-slate-400 text-sm mb-1">Joueurs</div>
			<div class="text-3xl font-bold text-white">
				{alivePlayers}<span class="text-slate-500">/{game.players.length}</span>
			</div>
			<div class="text-xs text-slate-500 mt-1">En vie</div>
		</div>
		<div class="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
			<div class="text-slate-400 text-sm mb-1">Kills totaux</div>
			<div class="text-3xl font-bold text-cyan-400">{totalKills}</div>
			<div class="text-xs text-slate-500 mt-1">Ennemis éliminés</div>
		</div>
		<div class="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
			<div class="text-slate-400 text-sm mb-1">Progression</div>
			<div class="text-3xl font-bold text-purple-400">
				{Math.round((game.currentWave / game.totalWaves) * 100)}%
			</div>
			<div class="text-xs text-slate-500 mt-1">Des vagues</div>
		</div>
	</div>

	<!-- Players List -->
	<div class="space-y-3">
		<h4 class="text-xl font-bold text-white mb-4 flex items-center gap-2">
			<span>👥</span> Joueurs connectés
		</h4>
		{#each game.players as player (player.pseudo)}
			<div
				class="flex items-center justify-between bg-slate-800/70 rounded-xl p-4 border-2 {player.isAlive
					? 'border-green-500/30'
					: 'border-red-500/30'} transition-all hover:scale-[1.02]"
			>
				<div class="flex items-center gap-4">
					<div class="relative">
						<div
							class="w-4 h-4 rounded-full {player.isAlive ? 'bg-green-500' : 'bg-red-500'} {player.isAlive
								? 'animate-pulse'
								: ''}"
						></div>
						{#if player.isAlive && player.hasClearedWave && game.status === 'active'}
							<div
								class="absolute -top-1 -right-1 w-3 h-3 bg-cyan-500 rounded-full border-2 border-slate-800"
							></div>
						{/if}
					</div>
					<span class="text-xl font-bold text-white">{player.pseudo}</span>
					{#if player.hasClearedWave && game.status === 'active'}
						<span class="text-sm px-2 py-1 rounded-full bg-cyan-500/20 text-cyan-400 font-semibold">
							Vague terminée ✓
						</span>
					{/if}
				</div>
				<div class="flex items-center gap-6">
					<div class="flex flex-col items-center">
						<div class="flex items-center gap-2">
							<span class="text-2xl">❤️</span>
							<span class="text-2xl font-bold text-white">{player.lives}</span>
						</div>
						<span class="text-xs text-slate-400 mt-1">Vies</span>
					</div>
					<div class="flex flex-col items-center">
						<div class="flex items-center gap-2">
							<span class="text-2xl">💀</span>
							<span class="text-2xl font-bold text-cyan-400">{player.kills}</span>
						</div>
						<span class="text-xs text-slate-400 mt-1">Kills</span>
					</div>
				</div>
			</div>
		{/each}
	</div>

	<!-- Wave Progress Bar -->
	{#if game.status === 'active'}
		<div class="mt-8 space-y-3">
			<div class="flex justify-between items-center">
				<span class="text-lg font-semibold text-slate-300">Progression des vagues</span>
				<span class="text-lg font-bold text-white">
					Vague {game.currentWave} sur {game.totalWaves}
				</span>
			</div>
			<div class="w-full h-6 bg-slate-700 rounded-full overflow-hidden shadow-inner">
				<div
					class="h-full bg-gradient-to-r {config.gradient} transition-all duration-500 flex items-center justify-end pr-3"
					style="width: {(game.currentWave / game.totalWaves) * 100}%"
				>
					<span class="text-white text-xs font-bold">
						{Math.round((game.currentWave / game.totalWaves) * 100)}%
					</span>
				</div>
			</div>
		</div>
	{/if}
</div>
