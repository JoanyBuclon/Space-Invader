<script lang="ts">
	import type { ServerStats } from '$lib/dashboardClient';

	interface Props {
		stats: ServerStats;
	}

	let { stats }: Props = $props();

	function formatUptime(seconds: number): string {
		const hours = Math.floor(seconds / 3600);
		const minutes = Math.floor((seconds % 3600) / 60);
		const secs = seconds % 60;

		if (hours > 0) {
			return `${hours}h ${minutes}m`;
		}
		if (minutes > 0) {
			return `${minutes}m ${secs}s`;
		}
		return `${secs}s`;
	}
</script>

<div class="grid grid-cols-2 md:grid-cols-4 gap-3">
	<!-- Total Games -->
	<div
		class="bg-slate-800/50 border-2 border-purple-500/50 rounded-xl p-4 hover:bg-slate-800/70 transition-all"
	>
		<div class="flex items-center gap-2 mb-2">
			<span class="text-lg">🎮</span>
			<div class="text-xs text-purple-400 font-semibold uppercase tracking-wide">
				Parties totales
			</div>
		</div>
		<div class="text-3xl font-bold text-white">{stats.totalGames}</div>
	</div>

	<!-- Active Games -->
	<div
		class="bg-slate-800/50 border-2 border-green-500/50 rounded-xl p-4 hover:bg-slate-800/70 transition-all"
	>
		<div class="flex items-center gap-2 mb-2">
			<span class="text-lg">✨</span>
			<div class="text-xs text-green-400 font-semibold uppercase tracking-wide">Parties actives</div>
		</div>
		<div class="text-3xl font-bold text-white">
			{stats.activeGames}
			{#if stats.activeGames > 0}
				<span class="inline-block w-2 h-2 bg-green-500 rounded-full ml-2 animate-pulse"></span>
			{/if}
		</div>
	</div>

	<!-- Total Players -->
	<div
		class="bg-slate-800/50 border-2 border-cyan-500/50 rounded-xl p-4 hover:bg-slate-800/70 transition-all"
	>
		<div class="flex items-center gap-2 mb-2">
			<span class="text-lg">👥</span>
			<div class="text-xs text-cyan-400 font-semibold uppercase tracking-wide">Joueurs</div>
		</div>
		<div class="text-3xl font-bold text-white">{stats.totalPlayers}</div>
	</div>

	<!-- Uptime -->
	<div
		class="bg-slate-800/50 border-2 border-yellow-500/50 rounded-xl p-4 hover:bg-slate-800/70 transition-all"
	>
		<div class="flex items-center gap-2 mb-2">
			<span class="text-lg">⏱</span>
			<div class="text-xs text-yellow-400 font-semibold uppercase tracking-wide">Uptime</div>
		</div>
		<div class="text-2xl font-bold text-white">{formatUptime(stats.uptime)}</div>
	</div>
</div>
