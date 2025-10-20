// GameManager handles lobby, matchmaking, and multiple game instances

import { GameInstance } from './GameInstance.ts';
import { DEFAULT_GAME_CONFIG, getMinPlayers, getMaxPlayers } from '../config/gameConfig.ts';
import type { PlayerConnection, DashboardGameInfo, DashboardStats } from './types.ts';
import { logger } from '../utils/logger.ts';

export class GameManager {
	private lobby: Map<string, PlayerConnection> = new Map();
	private games: Map<string, GameInstance> = new Map();
	private gameCounter = 0;
	private startTime = Date.now();
	private minPlayers: number;
	private maxPlayers: number;
	private lobbyCheckInterval: NodeJS.Timeout | null = null;
	private cleanupInterval: NodeJS.Timeout | null = null;

	constructor() {
		this.minPlayers = getMinPlayers();
		this.maxPlayers = getMaxPlayers();

		// Check lobby every 2 seconds for enough players
		this.lobbyCheckInterval = setInterval(() => this.checkLobby(), 2000);

		// Clean up old completed games every 30 seconds
		this.cleanupInterval = setInterval(() => this.cleanupOldGames(), 30000);

		logger.info(
			`GameManager initialized (minPlayers: ${this.minPlayers}, maxPlayers: ${this.maxPlayers})`
		);
	}

	/**
	 * Add a player to the lobby
	 */
	addPlayerToLobby(pseudo: string, stream: any): boolean {
		// Check if pseudo is already in use
		if (this.lobby.has(pseudo)) {
			logger.warn(`Player ${pseudo} tried to join but name is already taken`);
			return false;
		}

		// Check if player is already in a game
		for (const game of this.games.values()) {
			if (game.isActive() && game.getState().players.has(pseudo)) {
				logger.warn(`Player ${pseudo} tried to join but is already in an active game`);
				return false;
			}
		}

		const connection: PlayerConnection = {
			pseudo,
			stream,
			joinedAt: Date.now()
		};

		this.lobby.set(pseudo, connection);
		logger.info(`Player ${pseudo} joined lobby (${this.lobby.size}/${this.minPlayers} players)`);

		// Broadcast lobby update to all waiting players
		this.broadcastLobbyUpdate();

		return true;
	}

	/**
	 * Remove player from lobby
	 */
	removePlayerFromLobby(pseudo: string) {
		if (this.lobby.delete(pseudo)) {
			logger.info(`Player ${pseudo} left lobby`);
			this.broadcastLobbyUpdate();
		}
	}

	/**
	 * Check if lobby has enough players to start a game
	 */
	private checkLobby() {
		if (this.lobby.size >= this.minPlayers) {
			this.startGameFromLobby();
		}
	}

	/**
	 * Start a game with players from the lobby
	 */
	private startGameFromLobby() {
		// Get players for the game (up to maxPlayers)
		const playerArray = Array.from(this.lobby.values()).slice(0, this.maxPlayers);

		if (playerArray.length < this.minPlayers) {
			return;
		}

		// Remove players from lobby
		for (const player of playerArray) {
			this.lobby.delete(player.pseudo);
		}

		// Create and start game
		this.startGameWithPlayers(playerArray);

		// Broadcast lobby update to remaining players
		this.broadcastLobbyUpdate();
	}

	/**
	 * Start a game with specific players
	 */
	private startGameWithPlayers(playerArray: PlayerConnection[]) {
		const gameId = `game-${++this.gameCounter}-${Date.now()}`;
		const game = new GameInstance(gameId, playerArray, DEFAULT_GAME_CONFIG);

		this.games.set(gameId, game);

		logger.info(`Starting game ${gameId} with ${playerArray.length} players`);

		// Set up callback for when game ends
		game.setOnGameEnd((allPlayersDead: boolean) => {
			this.handleGameEnd(gameId, allPlayersDead);
		});

		// Start the game
		game.start();
	}

	/**
	 * Handle game end - restart if all players died
	 */
	private handleGameEnd(gameId: string, allPlayersDead: boolean) {
		const game = this.games.get(gameId);
		if (!game) return;

		// Get all player connections from the completed game
		const players = game.getConnections();

		// Filter out any disconnected players
		const activePlayers = players.filter((p) => {
			// Check if the connection stream is still valid
			try {
				// If we can't access the stream, player is disconnected
				return p.stream && true;
			} catch {
				return false;
			}
		});

		if (allPlayersDead) {
			logger.info(`Game ${gameId}: All players died, restarting with same players`);

			if (activePlayers.length >= this.minPlayers) {
				// Notify players that a new game is starting
				const restartDelay = 5000; // 5 seconds delay before restart

				const restartMessage = {
					type: 'lobby-update',
					waitingPlayers: activePlayers.map((p) => p.pseudo),
					requiredPlayers: this.minPlayers,
					currentPlayers: activePlayers.length
				};

				for (const player of activePlayers) {
					try {
						player.stream.write(restartMessage);
					} catch (error) {
						logger.error(`Failed to notify ${player.pseudo} about restart:`, error);
					}
				}

				// Start new game after delay
				setTimeout(() => {
					this.startGameWithPlayers(activePlayers);
				}, restartDelay);
			} else {
				logger.info(
					`Game ${gameId}: Not enough players to restart (${activePlayers.length}/${this.minPlayers}), returning to lobby`
				);

				// Add remaining players back to lobby
				for (const player of activePlayers) {
					this.lobby.set(player.pseudo, player);
				}

				this.broadcastLobbyUpdate();
			}
		} else {
			// Victory! Players completed all waves
			logger.info(`Game ${gameId}: Players won! Restarting after celebration`);

			if (activePlayers.length >= this.minPlayers) {
				// Notify players that a new game is starting after victory celebration
				const restartDelay = 10000; // 10 seconds delay for victory screen

				const restartMessage = {
					type: 'lobby-update',
					waitingPlayers: activePlayers.map((p) => p.pseudo),
					requiredPlayers: this.minPlayers,
					currentPlayers: activePlayers.length
				};

				// Send restart notification after victory delay
				setTimeout(() => {
					for (const player of activePlayers) {
						try {
							player.stream.write(restartMessage);
						} catch (error) {
							logger.error(`Failed to notify ${player.pseudo} about restart:`, error);
						}
					}

					// Start new game immediately after notification
					this.startGameWithPlayers(activePlayers);
				}, restartDelay);
			} else {
				logger.info(
					`Game ${gameId}: Not enough players to restart after victory (${activePlayers.length}/${this.minPlayers}), returning to lobby`
				);

				// Add remaining players back to lobby
				for (const player of activePlayers) {
					this.lobby.set(player.pseudo, player);
				}

				this.broadcastLobbyUpdate();
			}
		}
	}

	/**
	 * Broadcast lobby update to all waiting players
	 */
	private broadcastLobbyUpdate() {
		const lobbyUpdateEvent = {
			type: 'lobby-update',
			waitingPlayers: Array.from(this.lobby.keys()),
			requiredPlayers: this.minPlayers,
			currentPlayers: this.lobby.size
		};

		for (const connection of this.lobby.values()) {
			try {
				connection.stream.write(lobbyUpdateEvent);
			} catch (error) {
				logger.error(`Failed to send lobby update to ${connection.pseudo}:`, error);
			}
		}
	}

	/**
	 * Find game instance for a player
	 */
	findGameForPlayer(pseudo: string): GameInstance | null {
		for (const game of this.games.values()) {
			if (game.isActive() && game.getState().players.has(pseudo)) {
				return game;
			}
		}
		return null;
	}

	/**
	 * Handle player disconnection from game
	 */
	handlePlayerDisconnection(pseudo: string) {
		// Remove from lobby if present
		this.removePlayerFromLobby(pseudo);

		// Remove from game if present
		const game = this.findGameForPlayer(pseudo);
		if (game) {
			game.handlePlayerDisconnected(pseudo);
		}

		logger.info(`Player ${pseudo} disconnected`);
	}

	/**
	 * Get all games info for dashboard
	 */
	getDashboardGamesInfo(): DashboardGameInfo[] {
		const gamesInfo: DashboardGameInfo[] = [];

		for (const game of this.games.values()) {
			const state = game.getState();

			gamesInfo.push({
				gameId: state.gameId,
				players: Array.from(state.players.values()).map((p) => ({
					pseudo: p.pseudo,
					lives: p.lives,
					kills: p.kills,
					isAlive: p.isAlive,
					hasClearedWave: p.hasClearedWave
				})),
				currentWave: state.currentWave,
				totalWaves: state.totalWaves,
				status: state.status,
				startedAt: state.startedAt
			});
		}

		// Sort by startedAt descending (newest first)
		// This ensures the dashboard always shows the most recent/current game
		gamesInfo.sort((a, b) => b.startedAt - a.startedAt);

		return gamesInfo;
	}

	/**
	 * Get server statistics for dashboard
	 */
	getDashboardStats(): DashboardStats {
		const activeGames = Array.from(this.games.values()).filter((g) => g.isActive()).length;

		return {
			totalGames: this.games.size,
			activeGames,
			totalPlayers: this.lobby.size + this.getActivePlayers(),
			uptime: Math.floor((Date.now() - this.startTime) / 1000)
		};
	}

	/**
	 * Get count of players in active games
	 */
	private getActivePlayers(): number {
		let count = 0;
		for (const game of this.games.values()) {
			if (game.isActive()) {
				count += game.getPlayerCount();
			}
		}
		return count;
	}

	/**
	 * Cleanup old completed games
	 */
	cleanupOldGames() {
		const now = Date.now();
		const maxAge = 1000 * 60 * 2; // 2 minutes (enough for victory screen + buffer)

		for (const [gameId, game] of this.games.entries()) {
			const state = game.getState();
			if (state.status === 'completed' && state.completedAt) {
				if (now - state.completedAt > maxAge) {
					this.games.delete(gameId);
					logger.info(`Cleaned up old completed game ${gameId}`);
				}
			}
		}
	}

	/**
	 * Shutdown manager
	 */
	shutdown() {
		if (this.lobbyCheckInterval) {
			clearInterval(this.lobbyCheckInterval);
		}
		if (this.cleanupInterval) {
			clearInterval(this.cleanupInterval);
		}

		// Send error to all lobby players
		const errorEvent = {
			error: {
				message: 'Server is shutting down',
				code: 'SERVER_SHUTDOWN'
			}
		};

		for (const connection of this.lobby.values()) {
			try {
				connection.stream.write(errorEvent);
				connection.stream.end();
			} catch (error) {
				// Ignore errors during shutdown
			}
		}

		logger.info('GameManager shut down');
	}

	/**
	 * Get lobby size
	 */
	getLobbySize(): number {
		return this.lobby.size;
	}

	/**
	 * Get active games count
	 */
	getActiveGamesCount(): number {
		return Array.from(this.games.values()).filter((g) => g.isActive()).length;
	}
}
