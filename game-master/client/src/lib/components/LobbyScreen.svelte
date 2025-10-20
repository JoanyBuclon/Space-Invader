<script lang="ts">
	import { CANVAS_WIDTH, CANVAS_HEIGHT } from '$lib/game/constants';
	import type { MultiplayerGameState } from '$lib/game/multiplayerState.svelte';

	interface Props {
		gameState: MultiplayerGameState;
	}

	let { gameState }: Props = $props();

	let pseudoInput = $state('');
	let isConnecting = $state(false);
	let errorMessage = $state('');

	async function handleJoin() {
		if (!pseudoInput || pseudoInput.trim() === '') {
			errorMessage = 'Veuillez entrer un pseudonyme';
			return;
		}

		if (pseudoInput.length > 20) {
			errorMessage = 'Le pseudonyme est trop long (max 20 caractères)';
			return;
		}

		errorMessage = '';
		isConnecting = true;

		try {
			await gameState.connect(pseudoInput.trim());
		} catch (error) {
			errorMessage = 'Impossible de se connecter au serveur';
			isConnecting = false;
		}
	}

	function handleKeyDown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			handleJoin();
		}
	}
</script>

{#if gameState.multiplayerStatus === 'disconnected'}
	<!-- Join Screen -->
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
				<div class="text-cyan-400 text-sm tracking-widest">MULTIJOUEUR</div>
				<div class="text-slate-400 text-xs">VIBE CODING - SFEIR BORDEAUX</div>
			</div>

			<!-- Join Form -->
			<div
				class="bg-slate-800/50 backdrop-blur-sm border-2 border-cyan-500 rounded-lg p-8 max-w-md mx-auto shadow-2xl shadow-cyan-500/20"
			>
				<h2 class="text-2xl font-bold text-cyan-400 mb-6">Rejoindre la partie</h2>

				<div class="space-y-4">
					<div>
						<label for="pseudo" class="block text-slate-300 text-sm font-semibold mb-2">
							Pseudonyme
						</label>
						<input
							id="pseudo"
							type="text"
							bind:value={pseudoInput}
							onkeydown={handleKeyDown}
							disabled={isConnecting}
							placeholder="Entrez votre pseudo..."
							maxlength="20"
							class="w-full px-4 py-3 bg-slate-900/50 border-2 border-slate-600 rounded-lg text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none transition-colors disabled:opacity-50"
						/>
					</div>

					{#if errorMessage}
						<div class="text-red-400 text-sm bg-red-900/20 border border-red-500/50 rounded p-2">
							{errorMessage}
						</div>
					{/if}

					<button
						onclick={handleJoin}
						disabled={isConnecting || !pseudoInput.trim()}
						class="w-full group relative px-6 py-3 text-lg font-bold text-white bg-gradient-to-r from-cyan-500 to-purple-500 rounded-lg shadow-lg hover:shadow-cyan-500/50 transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
					>
						{#if isConnecting}
							<span>Connexion...</span>
						{:else}
							<span>REJOINDRE</span>
						{/if}
					</button>
				</div>

				<div class="mt-6 text-xs text-slate-400 space-y-1">
					<p>• Partie multijoueur synchronisée</p>
					<p>• {gameState.requiredPlayers} joueurs minimum pour démarrer</p>
					<p>• Affrontez les vagues ensemble!</p>
				</div>
			</div>
		</div>
	</div>
{:else if gameState.multiplayerStatus === 'lobby'}
	<!-- Waiting Room -->
	<div
		class="absolute inset-0 flex items-center justify-center bg-slate-900/95 backdrop-blur-sm"
		style="width: {CANVAS_WIDTH}px; height: {CANVAS_HEIGHT}px;"
	>
		<div class="text-center space-y-8 animate-fade-in">
			<!-- Title -->
			<div class="space-y-2">
				<h1 class="text-5xl font-bold text-cyan-400">Salle d'attente</h1>
				<div class="text-slate-400">En attente de joueurs...</div>
			</div>

			<!-- Player List -->
			<div
				class="bg-slate-800/50 backdrop-blur-sm border-2 border-purple-500 rounded-lg p-6 min-w-[400px] shadow-2xl shadow-purple-500/20"
			>
				<h2 class="text-xl font-bold text-purple-400 mb-4">Joueurs connectés</h2>

				<div class="space-y-2 mb-6">
					{#each gameState.lobbyPlayers as player (player)}
						<div
							class="flex items-center gap-3 bg-slate-700/50 rounded-lg p-3 border border-slate-600"
						>
							<div class="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
							<span class="text-white font-semibold">
								{player}
								{#if player === gameState.pseudo}
									<span class="text-cyan-400 text-sm">(vous)</span>
								{/if}
							</span>
						</div>
					{/each}
				</div>

				<!-- Progress -->
				<div class="space-y-2">
					<div class="flex justify-between text-sm">
						<span class="text-slate-300">Progression</span>
						<span class="text-white font-bold">
							{gameState.lobbyPlayers.length} / {gameState.requiredPlayers}
						</span>
					</div>
					<div class="w-full h-3 bg-slate-700 rounded-full overflow-hidden">
						<div
							class="h-full bg-gradient-to-r from-cyan-500 to-purple-500 transition-all duration-500"
							style="width: {(gameState.lobbyPlayers.length / gameState.requiredPlayers) *
								100}%"
						></div>
					</div>
				</div>

				{#if gameState.lobbyPlayers.length >= gameState.requiredPlayers}
					<div class="mt-6 text-green-400 font-semibold animate-pulse">
						🎮 La partie va bientôt commencer!
					</div>
				{:else}
					<div class="mt-6 text-slate-400 text-sm">
						Encore {gameState.requiredPlayers - gameState.lobbyPlayers.length} joueur(s) requis
					</div>
				{/if}
			</div>

			<!-- Disconnect Button -->
			<button
				onclick={() => gameState.disconnect()}
				class="px-6 py-2 text-sm text-slate-400 hover:text-white border border-slate-600 hover:border-slate-400 rounded-lg transition-colors"
			>
				Quitter la salle
			</button>
		</div>
	</div>
{:else if gameState.multiplayerStatus === 'starting'}
	<!-- Starting Screen -->
	<div
		class="absolute inset-0 flex items-center justify-center bg-slate-900/95 backdrop-blur-sm"
		style="width: {CANVAS_WIDTH}px; height: {CANVAS_HEIGHT}px;"
	>
		<div class="text-center space-y-6 animate-fade-in">
			<h1 class="text-6xl font-bold text-cyan-400 animate-pulse">Vague {gameState.currentWave}</h1>

			{#if gameState.currentWaveConfig}
				<div class="bg-slate-800/50 backdrop-blur-sm border-2 border-cyan-500 rounded-lg p-6">
					<div class="text-slate-300 space-y-2">
						<div>
							<span class="text-slate-400">Ennemis:</span>
							<span class="text-white font-bold ml-2">
								{gameState.currentWaveConfig.numberOfEnemies} × {gameState.currentWaveConfig.numberOfLines}
								lignes
							</span>
						</div>
						<div>
							<span class="text-slate-400">Vie des ennemis:</span>
							<span class="text-white font-bold ml-2">
								{gameState.currentWaveConfig.enemyLife} HP
							</span>
						</div>
					</div>
				</div>
			{/if}

			<div class="text-2xl font-bold text-green-400 animate-pulse">Préparez-vous!</div>
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
