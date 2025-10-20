// GameInstance manages a single multiplayer game session

import type { GameConfig, WaveConfig } from '../config/gameConfig.ts';
import { getInactivityTimeout } from '../config/gameConfig.ts';
import type { GameState, PlayerState, PlayerConnection } from './types.ts';
import { logger } from '../utils/logger.ts';

export class GameInstance {
	private gameId: string;
	private config: GameConfig;
	private state: GameState;
	private connections: Map<string, PlayerConnection>;
	private currentWaveConfig: WaveConfig | null = null;
	private onGameEnd: ((allPlayersDead: boolean) => void) | null = null;
	private playerActivityTimers: Map<string, NodeJS.Timeout> = new Map();
	private readonly INACTIVITY_TIMEOUT: number;

	constructor(gameId: string, players: PlayerConnection[], config: GameConfig) {
		this.INACTIVITY_TIMEOUT = getInactivityTimeout();
		this.gameId = gameId;
		this.config = config;
		this.connections = new Map(players.map((p) => [p.pseudo, p]));

		// Initialize game state
		this.state = {
			gameId,
			status: 'active',
			players: new Map(),
			currentWave: 0,
			totalWaves: config.waves.length,
			startedAt: Date.now()
		};

		// Initialize player states
		for (const player of players) {
			this.state.players.set(player.pseudo, {
				pseudo: player.pseudo,
				lives: config.startingLives,
				kills: 0,
				isAlive: true,
				hasClearedWave: false,
				totalKills: 0,
				wavesCleared: 0
			});
		}

		logger.info(`Game ${gameId} created with ${players.length} players`);
	}

	/**
	 * Start the game and send game-started event to all players
	 */
	async start() {
		logger.info(`Starting game ${this.gameId}`);

		const gameStartedEvent = {
			type: 'game-started',
			numberOfWaves: this.config.waves.length,
			lifePoints: this.config.startingLives,
			players: Array.from(this.state.players.keys())
		};

		this.broadcastToAll(gameStartedEvent);

		// Start first wave after a short delay
		setTimeout(() => this.startNextWave(), 2000);
	}

	/**
	 * Start the next wave
	 */
	private startNextWave() {
		this.state.currentWave++;

		if (this.state.currentWave > this.config.waves.length) {
			this.endGame();
			return;
		}

		const waveConfig = this.config.waves[this.state.currentWave - 1];
		this.currentWaveConfig = waveConfig;

		// Reset wave-specific state
		for (const player of this.state.players.values()) {
			player.hasClearedWave = false;
			player.kills = 0;
		}

		// Start inactivity timers for all alive players
		this.startInactivityTimers();

		logger.info(`Game ${this.gameId}: Starting wave ${this.state.currentWave}`);

		const waveStartedEvent = {
			type: 'wave-started',
			waveNumber: this.state.currentWave,
			numberOfEnemies: waveConfig.numberOfEnemies,
			numberOfLines: waveConfig.numberOfLines,
			enemyLife: waveConfig.enemyLife
		};

		this.broadcastToAll(waveStartedEvent);
	}

	/**
	 * Handle player touched (lost a life)
	 */
	handlePlayerTouched(pseudo: string) {
		const player = this.state.players.get(pseudo);
		if (!player || !player.isAlive) return;

		// Reset inactivity timer - player is active
		this.resetInactivityTimer(pseudo);

		player.lives--;
		logger.info(`Game ${this.gameId}: ${pseudo} touched, ${player.lives} lives remaining`);

		if (player.lives <= 0) {
			player.isAlive = false;
			player.hasClearedWave = true; // Mark as done (dead)
			this.clearInactivityTimer(pseudo);
			logger.info(`Game ${this.gameId}: ${pseudo} died`);
		}

		this.checkWaveCompletion();
	}

	/**
	 * Handle enemy killed
	 */
	handleEnemyKilled(pseudo: string) {
		const player = this.state.players.get(pseudo);
		if (!player || !player.isAlive) return;

		// Reset inactivity timer - player is active
		this.resetInactivityTimer(pseudo);

		player.kills++;
		player.totalKills++;
	}

	/**
	 * Handle wave cleared by a player
	 */
	handleWaveCleared(pseudo: string) {
		const player = this.state.players.get(pseudo);
		if (!player || !player.isAlive) return;

		// Clear inactivity timer - wave completed
		this.clearInactivityTimer(pseudo);

		player.hasClearedWave = true;
		player.wavesCleared++;
		logger.info(`Game ${this.gameId}: ${pseudo} cleared wave ${this.state.currentWave}`);

		this.checkWaveCompletion();
	}

	/**
	 * Handle player killed (no lives left)
	 */
	handlePlayerKilled(pseudo: string) {
		const player = this.state.players.get(pseudo);
		if (!player) return;

		// Clear inactivity timer - player is dead
		this.clearInactivityTimer(pseudo);

		player.isAlive = false;
		player.hasClearedWave = true; // Mark as done (dead)
		logger.info(`Game ${this.gameId}: ${pseudo} confirmed killed`);

		this.checkWaveCompletion();
	}

	/**
	 * Handle player disconnection
	 */
	handlePlayerDisconnected(pseudo: string) {
		const player = this.state.players.get(pseudo);
		if (!player) return;

		// Clear inactivity timer - player disconnected
		this.clearInactivityTimer(pseudo);

		player.isAlive = false;
		player.hasClearedWave = true; // Mark as done (disconnected)
		this.connections.delete(pseudo);

		logger.info(`Game ${this.gameId}: ${pseudo} disconnected`);

		this.checkWaveCompletion();
	}

	/**
	 * Check if all players have completed the wave (cleared or died)
	 */
	private checkWaveCompletion() {
		const allPlayersReady = Array.from(this.state.players.values()).every(
			(p) => p.hasClearedWave
		);

		if (allPlayersReady) {
			logger.info(`Game ${this.gameId}: All players completed wave ${this.state.currentWave}`);

			// Check if any players are still alive
			const anyAlive = Array.from(this.state.players.values()).some((p) => p.isAlive);

			if (!anyAlive) {
				// All players dead - game over
				logger.info(`Game ${this.gameId}: All players dead, ending game`);
				this.endGame();
			} else {
				// Start next wave after a delay
				setTimeout(() => this.startNextWave(), 3000);
			}
		}
	}

	/**
	 * End the game
	 */
	private endGame() {
		this.state.status = 'completed';
		this.state.completedAt = Date.now();

		// Clear all inactivity timers
		this.clearAllInactivityTimers();

		const anyWon = Array.from(this.state.players.values()).some((p) => p.isAlive);

		const playerStats = Array.from(this.state.players.values()).map((p) => ({
			pseudo: p.pseudo,
			totalKills: p.totalKills,
			wavesCleared: p.wavesCleared,
			survived: p.isAlive
		}));

		const gameEndedEvent = {
			type: 'game-ended',
			victory: anyWon,
			playerStats: playerStats
		};

		this.broadcastToAll(gameEndedEvent);

		logger.info(`Game ${this.gameId} ended. Victory: ${anyWon}`);

		// Notify GameManager that game has ended
		if (this.onGameEnd) {
			this.onGameEnd(!anyWon); // true if all players dead
		}
	}

	/**
	 * Broadcast event to all connected players
	 */
	private broadcastToAll(event: any) {
		for (const connection of this.connections.values()) {
			try {
				connection.stream.write(event);
			} catch (error) {
				logger.error(`Failed to send to ${connection.pseudo}:`, error);
			}
		}
	}

	/**
	 * Get current game state (for dashboard)
	 */
	getState(): GameState {
		return this.state;
	}

	/**
	 * Get game ID
	 */
	getGameId(): string {
		return this.gameId;
	}

	/**
	 * Check if game is still active
	 */
	isActive(): boolean {
		return this.state.status === 'active';
	}

	/**
	 * Get connected player count
	 */
	getPlayerCount(): number {
		return this.connections.size;
	}

	/**
	 * Set callback for when game ends
	 */
	setOnGameEnd(callback: (allPlayersDead: boolean) => void) {
		this.onGameEnd = callback;
	}

	/**
	 * Get player connections
	 */
	getConnections(): PlayerConnection[] {
		return Array.from(this.connections.values());
	}

	/**
	 * Start inactivity timers for all alive players
	 */
	private startInactivityTimers() {
		// Clear any existing timers first
		this.clearAllInactivityTimers();

		for (const [pseudo, player] of this.state.players.entries()) {
			if (player.isAlive && !player.hasClearedWave) {
				this.startInactivityTimer(pseudo);
			}
		}
	}

	/**
	 * Start inactivity timer for a specific player
	 */
	private startInactivityTimer(pseudo: string) {
		const timer = setTimeout(() => {
			this.handlePlayerInactivity(pseudo);
		}, this.INACTIVITY_TIMEOUT);

		this.playerActivityTimers.set(pseudo, timer);
		logger.debug(`Started inactivity timer for ${pseudo}`);
	}

	/**
	 * Reset inactivity timer for a player (they're active)
	 */
	private resetInactivityTimer(pseudo: string) {
		this.clearInactivityTimer(pseudo);

		const player = this.state.players.get(pseudo);
		if (player && player.isAlive && !player.hasClearedWave) {
			this.startInactivityTimer(pseudo);
		}
	}

	/**
	 * Clear inactivity timer for a specific player
	 */
	private clearInactivityTimer(pseudo: string) {
		const timer = this.playerActivityTimers.get(pseudo);
		if (timer) {
			clearTimeout(timer);
			this.playerActivityTimers.delete(pseudo);
			logger.debug(`Cleared inactivity timer for ${pseudo}`);
		}
	}

	/**
	 * Clear all inactivity timers
	 */
	private clearAllInactivityTimers() {
		for (const timer of this.playerActivityTimers.values()) {
			clearTimeout(timer);
		}
		this.playerActivityTimers.clear();
	}

	/**
	 * Handle player inactivity (no events for INACTIVITY_TIMEOUT)
	 */
	private handlePlayerInactivity(pseudo: string) {
		const player = this.state.players.get(pseudo);
		if (!player || !player.isAlive || player.hasClearedWave) {
			// Player already dead or cleared wave, ignore
			return;
		}

		logger.warn(
			`Game ${this.gameId}: ${pseudo} inactive for ${this.INACTIVITY_TIMEOUT / 1000}s, marking as dead`
		);

		// Mark player as dead due to inactivity
		player.isAlive = false;
		player.hasClearedWave = true;
		player.lives = 0;

		// Clear the timer
		this.clearInactivityTimer(pseudo);

		// Check if wave is now complete
		this.checkWaveCompletion();
	}
}
