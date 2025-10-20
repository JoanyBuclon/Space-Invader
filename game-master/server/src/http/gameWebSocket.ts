// WebSocket game endpoint for browser clients

import { WebSocketServer, WebSocket } from 'ws';
import type { Server } from 'http';
import { GameManager } from '../game/GameManager.ts';
import { logger } from '../utils/logger.ts';

export function createGameWebSocketServer(httpServer: Server, gameManager: GameManager) {
	const wss = new WebSocketServer({ noServer: true });

	// Handle upgrade requests
	httpServer.on('upgrade', (request, socket, head) => {
		if (request.url === '/game') {
			wss.handleUpgrade(request, socket, head, (ws) => {
				wss.emit('connection', ws, request);
			});
		}
	});

	wss.on('connection', (ws: WebSocket) => {
		logger.info('Game WebSocket connection established');

		let playerPseudo: string | null = null;
		let isInLobby = true;

		// Send function wrapper to match stream API
		const stream = {
			write: (data: any) => {
				if (ws.readyState === WebSocket.OPEN) {
					ws.send(JSON.stringify(data));
				}
			},
			end: () => {
				ws.close();
			}
		};

		ws.on('message', (data: Buffer) => {
			try {
				const clientEvent = JSON.parse(data.toString());

				// Handle player-joined event
				if (clientEvent.type === 'player-joined') {
					const pseudo = clientEvent.pseudo;

					if (!pseudo || pseudo.trim() === '') {
						stream.write({
							type: 'error',
							message: 'Pseudo cannot be empty',
							code: 'INVALID_PSEUDO'
						});
						ws.close();
						return;
					}

					playerPseudo = pseudo;

					// Try to add player to lobby
					const added = gameManager.addPlayerToLobby(pseudo, stream);

					if (!added) {
						stream.write({
							type: 'error',
							message: 'Pseudo already in use or you are already in a game',
							code: 'PSEUDO_IN_USE'
						});
						ws.close();
						return;
					}

					logger.info(`Player ${pseudo} joined lobby via WebSocket`);
					return;
				}

				// For other events, player must be authenticated
				if (!playerPseudo) {
					logger.warn('Received event from unauthenticated WebSocket connection');
					return;
				}

				// Check if player is in a game
				const game = gameManager.findGameForPlayer(playerPseudo);

				if (!game) {
					// Player might still be in lobby, ignore game events
					return;
				}

				// Player is in a game
				if (isInLobby) {
					isInLobby = false;
				}

				// Handle game events
				switch (clientEvent.type) {
					case 'player-touched':
						game.handlePlayerTouched(playerPseudo);
						break;
					case 'wave-cleared':
						game.handleWaveCleared(playerPseudo);
						break;
					case 'enemy-killed':
						game.handleEnemyKilled(playerPseudo);
						break;
					case 'player-killed':
						game.handlePlayerKilled(playerPseudo);
						break;
					case 'player-disconnected':
						game.handlePlayerDisconnected(playerPseudo);
						ws.close();
						break;
				}
			} catch (error) {
				logger.error('Error handling WebSocket message:', error);
				stream.write({
					type: 'error',
					message: 'Internal server error',
					code: 'INTERNAL_ERROR'
				});
			}
		});

		ws.on('close', () => {
			if (playerPseudo) {
				logger.info(`Player ${playerPseudo} WebSocket closed`);
				gameManager.handlePlayerDisconnection(playerPseudo);
			}
		});

		ws.on('error', (error) => {
			logger.error('WebSocket error:', error);
			if (playerPseudo) {
				gameManager.handlePlayerDisconnection(playerPseudo);
			}
		});
	});

	logger.info('Game WebSocket server created');

	return wss;
}
