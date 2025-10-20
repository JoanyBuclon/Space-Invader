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

<div class="grid grid-cols-2 md:grid-cols-4 gap-4">
	<!-- Total Games -->
	<div class="bg-slate-800/50 border-2 border-purple-500/50 rounded-lg p-4">
		<div class="text-sm text-purple-400 font-semibold mb-1">Parties totales</div>
		<div class="text-3xl font-bold text-white">{stats.totalGames}</div>
	</div>

	<!-- Active Games -->
	<div class="bg-slate-800/50 border-2 border-green-500/50 rounded-lg p-4">
		<div class="text-sm text-green-400 font-semibold mb-1">Parties actives</div>
		<div class="text-3xl font-bold text-white">{stats.activeGames}</div>
	</div>

	<!-- Total Players -->
	<div class="bg-slate-800/50 border-2 border-cyan-500/50 rounded-lg p-4">
		<div class="text-sm text-cyan-400 font-semibold mb-1">Joueurs connectés</div>
		<div class="text-3xl font-bold text-white">{stats.totalPlayers}</div>
	</div>

	<!-- Uptime -->
	<div class="bg-slate-800/50 border-2 border-yellow-500/50 rounded-lg p-4">
		<div class="text-sm text-yellow-400 font-semibold mb-1">Uptime</div>
		<div class="text-2xl font-bold text-white">{formatUptime(stats.uptime)}</div>
	</div>
</div>
