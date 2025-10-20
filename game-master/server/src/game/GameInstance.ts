// GameInstance manages a single multiplayer game session

import type { GameConfig, WaveConfig } from '../config/gameConfig.ts';
import type { GameState, PlayerState, PlayerConnection } from './types.ts';
import { logger } from '../utils/logger.ts';

export class GameInstance {
	private gameId: string;
	private config: GameConfig;
	private state: GameState;
	private connections: Map<string, PlayerConnection>;
	private currentWaveConfig: WaveConfig | null = null;

	constructor(gameId: string, players: PlayerConnection[], config: GameConfig) {
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

		player.lives--;
		logger.info(`Game ${this.gameId}: ${pseudo} touched, ${player.lives} lives remaining`);

		if (player.lives <= 0) {
			player.isAlive = false;
			player.hasClearedWave = true; // Mark as done (dead)
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

		player.kills++;
		player.totalKills++;
	}

	/**
	 * Handle wave cleared by a player
	 */
	handleWaveCleared(pseudo: string) {
		const player = this.state.players.get(pseudo);
		if (!player || !player.isAlive) return;

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
}
