<script lang="ts">
	import { onMount } from 'svelte';
	import { createGameState } from '$lib/game/gameState.svelte';
	import GameCanvas from '$lib/components/GameCanvas.svelte';
	import GameUI from '$lib/components/GameUI.svelte';
	import GameScreens from '$lib/components/GameScreens.svelte';

	const gameState = createGameState();

	onMount(() => {
		// Keyboard event handlers
		const handleKeyDown = (e: KeyboardEvent) => {
			if (gameState.gameState !== 'playing') return;

			switch (e.key) {
				case 'ArrowLeft':
				case 'a':
				case 'A':
					gameState.setKey('left', true);
					e.preventDefault();
					break;
				case 'ArrowRight':
				case 'd':
				case 'D':
					gameState.setKey('right', true);
					e.preventDefault();
					break;
				case ' ':
					gameState.setKey('shoot', true);
					e.preventDefault();
					break;
			}
		};

		const handleKeyUp = (e: KeyboardEvent) => {
			switch (e.key) {
				case 'ArrowLeft':
				case 'a':
				case 'A':
					gameState.setKey('left', false);
					break;
				case 'ArrowRight':
				case 'd':
				case 'D':
					gameState.setKey('right', false);
					break;
				case ' ':
					gameState.setKey('shoot', false);
					break;
			}
		};

		window.addEventListener('keydown', handleKeyDown);
		window.addEventListener('keyup', handleKeyUp);

		return () => {
			window.removeEventListener('keydown', handleKeyDown);
			window.removeEventListener('keyup', handleKeyUp);
		};
	});
</script>

<svelte:head>
	<title>Space Invader - Vibe Coding</title>
	<meta name="description" content="Space Invader game built with Svelte 5" />
</svelte:head>

<div
	class="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-8"
>
	<div class="relative">
		<!-- Canvas -->
		<GameCanvas {gameState} />

		<!-- UI Overlays -->
		{#if gameState.gameState === 'playing'}
			<GameUI {gameState} />
		{/if}

		<!-- Screens (Menu, Victory, Game Over) -->
		<GameScreens {gameState} />
	</div>
</div>

<!-- Footer -->
<div class="fixed bottom-4 left-4 text-slate-600 text-xs">
	<div>Vibe Coding - Session 4</div>
	<div>Sfeir Bordeaux</div>
</div>
