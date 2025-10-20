<script lang="ts">
	import { onMount } from 'svelte';
	import { DashboardClient, type DashboardData, type ConnectionStatus } from '$lib/dashboardClient';
	import GameCard from '$lib/components/GameCard.svelte';
	import StatsCard from '$lib/components/StatsCard.svelte';
	import VictoryScreen from '$lib/components/VictoryScreen.svelte';

	let dashboardData = $state<DashboardData>({
		currentGame: null,
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

	// Check if game is completed with winners (victory scenario)
	const showVictory = $derived(
		dashboardData.currentGame?.status === 'completed' &&
		dashboardData.currentGame.players.some((p) => p.isAlive)
	);
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
	<div class="max-w-7xl mx-auto space-y-8">
		<!-- Stats Overview -->
		<StatsCard stats={dashboardData.stats} />

		<!-- Current Game Display -->
		<div class="flex items-center justify-center min-h-[500px]">
			{#if dashboardData.currentGame}
				<div class="w-full max-w-4xl">
					<h2 class="text-3xl font-bold text-white mb-6 text-center">
						<span
							class="bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent"
						>
							Partie en cours
						</span>
					</h2>
					<GameCard game={dashboardData.currentGame} />
				</div>
			{:else}
				<div class="text-center space-y-6 animate-pulse-slow">
					<div class="text-8xl">🎮</div>
					<div>
						<div class="text-3xl font-bold text-slate-400 mb-2">Aucune partie active</div>
						<div class="text-slate-500">
							En attente de joueurs pour démarrer une nouvelle partie...
						</div>
					</div>
					<div class="flex items-center justify-center gap-2 text-slate-600">
						<div class="w-2 h-2 bg-cyan-500 rounded-full animate-ping"></div>
						<div class="text-sm">Connexions surveillées en temps réel</div>
					</div>
				</div>
			{/if}
		</div>
	</div>

	<!-- Footer -->
	<div class="max-w-7xl mx-auto mt-12 text-center text-slate-600 text-sm">
		<div>Vibe Coding - Session 4</div>
		<div>Sfeir Bordeaux</div>
	</div>

	<!-- Victory Screen Overlay -->
	{#if showVictory && dashboardData.currentGame}
		<VictoryScreen game={dashboardData.currentGame} />
	{/if}
</div>
