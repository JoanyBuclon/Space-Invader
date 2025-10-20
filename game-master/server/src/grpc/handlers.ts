// gRPC service handlers

import type * as grpc from '@grpc/grpc-js';
import { GameManager } from '../game/GameManager.ts';
import { logger } from '../utils/logger.ts';

export function createHandlers(gameManager: GameManager) {
	/**
	 * PlayGame - Bidirectional streaming RPC
	 */
	function playGame(call: grpc.ServerDuplexStream<any, any>) {
		let playerPseudo: string | null = null;
		let isInLobby = true;

		logger.info('New player connection established');

		// Handle client events
		call.on('data', (clientEvent: any) => {
			try {
				// Handle player_joined event
				if (clientEvent.player_joined) {
					const pseudo = clientEvent.player_joined.pseudo;

					if (!pseudo || pseudo.trim() === '') {
						call.write({
							error: {
								message: 'Pseudo cannot be empty',
								code: 'INVALID_PSEUDO'
							}
						});
						call.end();
						return;
					}

					playerPseudo = pseudo;

					// Try to add player to lobby
					const added = gameManager.addPlayerToLobby(pseudo, call);

					if (!added) {
						call.write({
							error: {
								message: 'Pseudo already in use or you are already in a game',
								code: 'PSEUDO_IN_USE'
							}
						});
						call.end();
						return;
					}

					logger.info(`Player ${pseudo} joined lobby`);
					return;
				}

				// For other events, player must be in a game
				if (!playerPseudo) {
					logger.warn('Received event from unauthenticated connection');
					return;
				}

				// Check if player is still in lobby or in a game
				const game = gameManager.findGameForPlayer(playerPseudo);

				if (!game) {
					// Player might still be in lobby, ignore game events
					return;
				}

				// Player is in a game, no longer in lobby
				if (isInLobby) {
					isInLobby = false;
				}

				// Handle game events
				if (clientEvent.player_touched) {
					game.handlePlayerTouched(playerPseudo);
				} else if (clientEvent.wave_cleared) {
					game.handleWaveCleared(playerPseudo);
				} else if (clientEvent.enemy_killed) {
					game.handleEnemyKilled(playerPseudo);
				} else if (clientEvent.player_killed) {
					game.handlePlayerKilled(playerPseudo);
				} else if (clientEvent.player_disconnected) {
					game.handlePlayerDisconnected(playerPseudo);
					call.end();
				}
			} catch (error) {
				logger.error('Error handling client event:', error);
				call.write({
					error: {
						message: 'Internal server error',
						code: 'INTERNAL_ERROR'
					}
				});
			}
		});

		// Handle client disconnect
		call.on('end', () => {
			if (playerPseudo) {
				logger.info(`Player ${playerPseudo} ended connection`);
				gameManager.handlePlayerDisconnection(playerPseudo);
			}
			call.end();
		});

		call.on('error', (error) => {
			if (playerPseudo) {
				logger.error(`Error from ${playerPseudo}:`, error);
				gameManager.handlePlayerDisconnection(playerPseudo);
			}
		});
	}

	/**
	 * MonitorGames - Server streaming RPC for dashboard
	 */
	function monitorGames(call: grpc.ServerWritableStream<any, any>) {
		logger.info('Dashboard connection established');

		// Send initial state
		sendDashboardUpdate();

		// Send updates every 2 seconds
		const interval = setInterval(() => {
			sendDashboardUpdate();
		}, 2000);

		function sendDashboardUpdate() {
			try {
				const games = gameManager.getDashboardGamesInfo();
				const stats = gameManager.getDashboardStats();

				call.write({
					active_games: games.map((g) => ({
						game_id: g.gameId,
						players: g.players.map((p) => ({
							pseudo: p.pseudo,
							lives: p.lives,
							kills: p.kills,
							is_alive: p.isAlive,
							has_cleared_wave: p.hasClearedWave
						})),
						current_wave: g.currentWave,
						total_waves: g.totalWaves,
						status: g.status,
						started_at: g.startedAt
					})),
					stats: {
						total_games: stats.totalGames,
						active_games: stats.activeGames,
						total_players: stats.totalPlayers,
						uptime: stats.uptime
					}
				});
			} catch (error) {
				logger.error('Error sending dashboard update:', error);
			}
		}

		// Handle client disconnect
		call.on('finish', () => {
			clearInterval(interval);
			logger.info('Dashboard disconnected');
		});

		call.on('error', (error) => {
			clearInterval(interval);
			logger.error('Dashboard error:', error);
		});
	}

	return {
		playGame,
		monitorGames
	};
}
