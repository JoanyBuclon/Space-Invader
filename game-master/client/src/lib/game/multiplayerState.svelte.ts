// Multiplayer game state with server integration

import { createGameState, type GameStateManager } from './gameState.svelte';
import { GameClient, type ServerEvent, type ConnectionStatus } from '$lib/grpc/gameClient';

export type MultiplayerStatus = 'disconnected' | 'lobby' | 'starting' | 'playing' | 'ended';

interface WaveConfig {
	waveNumber: number;
	numberOfEnemies: number;
	numberOfLines: number;
	enemyLife: number;
}

/**
 * Create multiplayer game state that integrates with server
 */
export function createMultiplayerGameState() {
	const gameState = createGameState();
	const gameClient = new GameClient();

	// Multiplayer specific state
	let multiplayerStatus = $state<MultiplayerStatus>('disconnected');
	let connectionStatus = $state<ConnectionStatus>('disconnected');
	let lobbyPlayers = $state<string[]>([]);
	let requiredPlayers = $state(2);
	let currentWaveConfig = $state<WaveConfig | null>(null);
	let totalWaves = $state(0);
	let currentWave = $state(0);
	let allPlayers = $state<string[]>([]);
	let pseudo = $state('');

	// Setup client event handlers
	gameClient.onStatusChange = (status) => {
		connectionStatus = status;
		if (status === 'disconnected') {
			multiplayerStatus = 'disconnected';
		}
	};

	gameClient.onServerEvent = (event: ServerEvent) => {
		handleServerEvent(event);
	};

	/**
	 * Connect to server with pseudo
	 */
	async function connect(playerPseudo: string): Promise<void> {
		pseudo = playerPseudo;
		try {
			await gameClient.connect(playerPseudo);
			multiplayerStatus = 'lobby';
		} catch (error) {
			console.error('Failed to connect:', error);
			throw error;
		}
	}

	/**
	 * Disconnect from server
	 */
	function disconnect() {
		gameClient.disconnect();
		multiplayerStatus = 'disconnected';
		resetState();
	}

	/**
	 * Handle server events
	 */
	function handleServerEvent(event: ServerEvent) {
		switch (event.type) {
			case 'lobby-update':
				handleLobbyUpdate(event);
				break;
			case 'game-started':
				handleGameStarted(event);
				break;
			case 'wave-started':
				handleWaveStarted(event);
				break;
			case 'game-ended':
				handleGameEnded(event);
				break;
			case 'error':
				handleError(event);
				break;
		}
	}

	/**
	 * Handle lobby update
	 */
	function handleLobbyUpdate(event: Extract<ServerEvent, { type: 'lobby-update' }>) {
		lobbyPlayers = event.waitingPlayers;
		requiredPlayers = event.requiredPlayers;
	}

	/**
	 * Handle game started
	 */
	function handleGameStarted(event: Extract<ServerEvent, { type: 'game-started' }>) {
		multiplayerStatus = 'starting';
		totalWaves = event.numberOfWaves;
		allPlayers = event.players;

		// Set player lives from server
		gameState.player.lives = event.lifePoints;

		console.log('Game started!', { totalWaves, players: allPlayers });
	}

	/**
	 * Handle wave started
	 */
	function handleWaveStarted(event: Extract<ServerEvent, { type: 'wave-started' }>) {
		currentWave = event.waveNumber;
		currentWaveConfig = {
			waveNumber: event.waveNumber,
			numberOfEnemies: event.numberOfEnemies,
			numberOfLines: event.numberOfLines,
			enemyLife: event.enemyLife
		};

		console.log('Wave started!', currentWaveConfig);

		// Initialize game with wave config
		initializeWave(currentWaveConfig);

		// Start playing
		multiplayerStatus = 'playing';
		gameState.setGameState('playing');
	}

	/**
	 * Handle game ended
	 */
	function handleGameEnded(event: Extract<ServerEvent, { type: 'game-ended' }>) {
		if (event.victory) {
			// Someone won - show victory/game over screen
			multiplayerStatus = 'ended';
			gameState.setGameState(event.playerStats.find((p) => p.pseudo === pseudo)?.survived ? 'won' : 'gameOver');
		} else {
			// All players died - return to lobby/waiting for restart
			multiplayerStatus = 'lobby';
			gameState.setGameState('menu');
			console.log('All players died - waiting for game restart...');
		}

		console.log('Game ended!', { victory: event.victory, stats: event.playerStats });
	}

	/**
	 * Handle error
	 */
	function handleError(event: Extract<ServerEvent, { type: 'error' }>) {
		console.error('Server error:', event.message, event.code);
		alert(`Server error: ${event.message}`);
	}

	/**
	 * Initialize wave with server config
	 */
	function initializeWave(config: WaveConfig) {
		// Clear existing enemies
		gameState.enemies.length = 0;
		gameState.bullets.length = 0;
		gameState.particles.length = 0;

		// Reset player position (but keep lives from server)
		gameState.player.x = 600 - 20; // CANVAS_WIDTH / 2 - PLAYER_WIDTH / 2
		gameState.player.y = 900 - 30 - 20; // CANVAS_HEIGHT - PLAYER_HEIGHT - 20
		gameState.player.shootCooldown = 0;

		// Spawn enemies based on server config
		spawnEnemiesFromConfig(config);
	}

	/**
	 * Spawn enemies from server configuration
	 */
	function spawnEnemiesFromConfig(config: WaveConfig) {
		const CANVAS_WIDTH = 1200;
		const ENEMY_WIDTH = 35;
		const ENEMY_HEIGHT = 35;
		const ENEMY_SPEED = 0.5;
		const ENEMY_SPACING = 90;
		const ENEMY_LINE_SPACING = 90;
		const ENEMY_START_Y = 50;

		const totalWidth = (config.numberOfEnemies - 1) * ENEMY_SPACING;
		const startX = (CANVAS_WIDTH - totalWidth) / 2;

		for (let lineIndex = 0; lineIndex < config.numberOfLines; lineIndex++) {
			const y = ENEMY_START_Y + lineIndex * ENEMY_LINE_SPACING;

			for (let i = 0; i < config.numberOfEnemies; i++) {
				const x = startX + i * ENEMY_SPACING;
				const waveOffset = lineIndex * 2 + i * 0.5;

				gameState.enemies.push({
					id: `enemy-${Date.now()}-${lineIndex}-${i}`,
					x,
					y,
					width: ENEMY_WIDTH,
					height: ENEMY_HEIGHT,
					health: config.enemyLife,
					maxHealth: config.enemyLife,
					speed: ENEMY_SPEED,
					initialX: x,
					waveOffset
				});
			}
		}
	}

	/**
	 * Reset state
	 */
	function resetState() {
		multiplayerStatus = 'disconnected';
		lobbyPlayers = [];
		currentWaveConfig = null;
		totalWaves = 0;
		currentWave = 0;
		allPlayers = [];
		pseudo = '';
	}

	/**
	 * Notify server of enemy kill
	 */
	function notifyEnemyKilled() {
		if (pseudo) {
			gameClient.sendEvent({ type: 'enemy-killed', pseudo });
		}
	}

	/**
	 * Notify server of player touched (lost life)
	 */
	function notifyPlayerTouched() {
		if (pseudo) {
			gameClient.sendEvent({ type: 'player-touched', pseudo });
		}
	}

	/**
	 * Notify server of wave cleared
	 */
	function notifyWaveCleared() {
		if (pseudo) {
			gameClient.sendEvent({ type: 'wave-cleared', pseudo });
			multiplayerStatus = 'starting'; // Waiting for next wave
			gameState.setGameState('menu'); // Pause gameplay
		}
	}

	/**
	 * Notify server of player killed
	 */
	function notifyPlayerKilled() {
		if (pseudo) {
			gameClient.sendEvent({ type: 'player-killed', pseudo });
			multiplayerStatus = 'ended';
		}
	}

	return {
		// Expose base game state
		...gameState,

		// Multiplayer state (read-only getters)
		get multiplayerStatus() {
			return multiplayerStatus;
		},
		get connectionStatus() {
			return connectionStatus;
		},
		get lobbyPlayers() {
			return lobbyPlayers;
		},
		get requiredPlayers() {
			return requiredPlayers;
		},
		get currentWaveConfig() {
			return currentWaveConfig;
		},
		get totalWaves() {
			return totalWaves;
		},
		get currentWave() {
			return currentWave;
		},
		get allPlayers() {
			return allPlayers;
		},
		get pseudo() {
			return pseudo;
		},

		// Multiplayer actions
		connect,
		disconnect,
		notifyEnemyKilled,
		notifyPlayerTouched,
		notifyWaveCleared,
		notifyPlayerKilled
	};
}

// Export type
export type MultiplayerGameState = ReturnType<typeof createMultiplayerGameState>;
