<script lang="ts">
	import { onMount } from 'svelte';
	import { DashboardClient, type DashboardData, type ConnectionStatus } from '$lib/dashboardClient';
	import GameCard from '$lib/components/GameCard.svelte';
	import StatsCard from '$lib/components/StatsCard.svelte';

	let dashboardData = $state<DashboardData>({
		games: [],
		stats: {
			totalGames: 0,
			activeGames: 0,
			totalPlayers: 0,
			uptime: 0
		}
	});

	let connectionStatus = $state<ConnectionStatus>('disconnected');
	let client: DashboardClient;

	onMount(() => {
		client = new DashboardClient();

		client.onStatusChange = (status) => {
			connectionStatus = status;
		};

		client.onDataUpdate = (data) => {
			dashboardData = data;
		};

		// Connect to server
		client.connect().catch((error) => {
			console.error('Failed to connect:', error);
		});

		return () => {
			client.disconnect();
		};
	});

	const statusColors = {
		disconnected: 'bg-red-500',
		connecting: 'bg-yellow-500',
		connected: 'bg-green-500',
		error: 'bg-red-500'
	};

	const statusLabels = {
		disconnected: 'Déconnecté',
		connecting: 'Connexion...',
		connected: 'Connecté',
		error: 'Erreur'
	};
</script>

<svelte:head>
	<title>Space Invader - Dashboard</title>
	<meta name="description" content="Space Invader multiplayer game dashboard" />
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
	<!-- Header -->
	<div class="max-w-7xl mx-auto mb-8">
		<div class="flex items-center justify-between">
			<div>
				<h1
					class="text-4xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent"
				>
					Space Invader Dashboard
				</h1>
				<p class="text-slate-400 mt-1">Monitoring en temps réel des parties multijoueurs</p>
			</div>

			<!-- Connection Status -->
			<div class="flex items-center gap-3">
				<div class="flex items-center gap-2">
					<div class="w-3 h-3 rounded-full {statusColors[connectionStatus]} {connectionStatus ===
					'connected'
						? 'animate-pulse'
						: ''}"></div>
					<span class="text-slate-300 text-sm">{statusLabels[connectionStatus]}</span>
				</div>
			</div>
		</div>
	</div>

	<!-- Main Content -->
	<div class="max-w-7xl mx-auto space-y-6">
		<!-- Stats Overview -->
		<StatsCard stats={dashboardData.stats} />

		<!-- Games Section -->
		<div>
			<h2 class="text-2xl font-bold text-white mb-4">
				Parties en cours ({dashboardData.games.length})
			</h2>

			{#if dashboardData.games.length === 0}
				<div
					class="bg-slate-800/30 border-2 border-dashed border-slate-700 rounded-lg p-12 text-center"
				>
					<div class="text-slate-400 text-lg">Aucune partie en cours</div>
					<div class="text-slate-500 text-sm mt-2">
						Les parties apparaîtront ici quand des joueurs se connecteront
					</div>
				</div>
			{:else}
				<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{#each dashboardData.games as game (game.gameId)}
						<GameCard {game} />
					{/each}
				</div>
			{/if}
		</div>
	</div>

	<!-- Footer -->
	<div class="max-w-7xl mx-auto mt-12 text-center text-slate-600 text-sm">
		<div>Vibe Coding - Session 4</div>
		<div>Sfeir Bordeaux</div>
	</div>
</div>
