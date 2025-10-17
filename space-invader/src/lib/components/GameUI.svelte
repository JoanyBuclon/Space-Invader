<script lang="ts">
	import type { GameStateManager } from '$lib/game/gameState.svelte';

	interface Props {
		gameState: GameStateManager;
	}

	let { gameState }: Props = $props();
</script>

<div class="absolute top-4 left-4 right-4 flex justify-between items-start pointer-events-none">
	<!-- Lives -->
	<div
		class="bg-slate-900/80 backdrop-blur-sm px-6 py-3 rounded-lg border-2 border-cyan-500 shadow-lg shadow-cyan-500/50"
	>
		<div class="text-cyan-400 text-sm font-semibold mb-1">VIES</div>
		<div class="flex gap-2">
			<!-- eslint-disable-next-line @typescript-eslint/no-unused-vars -->
			{#each Array(3) as _, i (i)}
				<div class="w-8 h-8 flex items-center justify-center">
					{#if i < gameState.player.lives}
						<div
							class="w-6 h-6 bg-cyan-500 shadow-lg shadow-cyan-500/50"
							style="clip-path: polygon(50% 0%, 100% 100%, 0% 100%);"
						></div>
					{:else}
						<div
							class="w-6 h-6 bg-slate-700/50 border border-slate-600"
							style="clip-path: polygon(50% 0%, 100% 100%, 0% 100%);"
						></div>
					{/if}
				</div>
			{/each}
		</div>
	</div>

	<!-- Score -->
	<div
		class="bg-slate-900/80 backdrop-blur-sm px-6 py-3 rounded-lg border-2 border-purple-500 shadow-lg shadow-purple-500/50"
	>
		<div class="text-purple-400 text-sm font-semibold mb-1">SCORE</div>
		<div class="text-white text-2xl font-bold font-mono">
			{gameState.stats.score.toString().padStart(6, '0')}
		</div>
	</div>
</div>

<!-- Shooting Cooldown Indicator -->
{#if gameState.player.shootCooldown > 0}
	<div class="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-none">
		<div class="bg-slate-900/80 backdrop-blur-sm px-4 py-2 rounded-full border-2 border-yellow-500">
			<div class="w-32 h-2 bg-slate-700 rounded-full overflow-hidden">
				<div
					class="h-full bg-gradient-to-r from-yellow-500 to-yellow-300 transition-all duration-75"
					style="width: {((15 - gameState.player.shootCooldown) / 15) * 100}%"
				></div>
			</div>
		</div>
	</div>
{/if}

<!-- Enemy Counter -->
<div class="absolute top-4 left-1/2 -translate-x-1/2 pointer-events-none">
	<div
		class="bg-slate-900/80 backdrop-blur-sm px-6 py-2 rounded-lg border-2 border-red-500 shadow-lg shadow-red-500/50"
	>
		<div class="text-center">
			<span class="text-red-400 text-sm font-semibold">ENNEMIS:</span>
			<span class="text-white text-xl font-bold ml-2">{gameState.enemies.length}</span>
		</div>
	</div>
</div>

<!-- Controls Help -->
<div
	class="absolute bottom-4 right-4 bg-slate-900/60 backdrop-blur-sm px-4 py-2 rounded-lg border border-slate-700 text-xs text-slate-400 pointer-events-none"
>
	<div class="font-semibold mb-1">Contrôles:</div>
	<div>← → Déplacer</div>
	<div>ESPACE Tirer</div>
</div>
