// HTTP server with WebSocket for dashboard and game

import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { GameManager } from '../game/GameManager.ts';
import { logger } from '../utils/logger.ts';
import { createGameWebSocketServer } from './gameWebSocket.ts';

export function createDashboardServer(gameManager: GameManager, port: number) {
	// Create HTTP server
	const server = http.createServer((req, res) => {
		// CORS headers
		res.setHeader('Access-Control-Allow-Origin', '*');
		res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
		res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

		if (req.method === 'OPTIONS') {
			res.writeHead(200);
			res.end();
			return;
		}

		// Health check endpoint
		if (req.url === '/health') {
			res.writeHead(200, { 'Content-Type': 'application/json' });
			res.end(
				JSON.stringify({
					status: 'ok',
					lobby: gameManager.getLobbySize(),
					activeGames: gameManager.getActiveGamesCount()
				})
			);
			return;
		}

		// Stats endpoint
		if (req.url === '/stats') {
			res.writeHead(200, { 'Content-Type': 'application/json' });
			res.end(JSON.stringify(gameManager.getDashboardStats()));
			return;
		}

		// Games endpoint
		if (req.url === '/games') {
			res.writeHead(200, { 'Content-Type': 'application/json' });
			res.end(JSON.stringify(gameManager.getDashboardGamesInfo()));
			return;
		}

		res.writeHead(404);
		res.end('Not found');
	});

	// Create game WebSocket server (handles /game endpoint)
	createGameWebSocketServer(server, gameManager);

	// Create dashboard WebSocket server (handles default endpoint)
	const wss = new WebSocketServer({ noServer: true });

	// Handle upgrade requests for dashboard
	server.on('upgrade', (request, socket, head) => {
		if (!request.url || request.url === '/' || request.url === '/dashboard') {
			wss.handleUpgrade(request, socket, head, (ws) => {
				wss.emit('connection', ws, request);
			});
		}
	});

	wss.on('connection', (ws: WebSocket) => {
		logger.info('Dashboard WebSocket connection established');

		// Send initial data
		sendDashboardData(ws);

		// Send updates every 2 seconds
		const interval = setInterval(() => {
			if (ws.readyState === WebSocket.OPEN) {
				sendDashboardData(ws);
			}
		}, 2000);

		ws.on('close', () => {
			clearInterval(interval);
			logger.info('Dashboard WebSocket disconnected');
		});

		ws.on('error', (error) => {
			clearInterval(interval);
			logger.error('Dashboard WebSocket error:', error);
		});
	});

	function sendDashboardData(ws: WebSocket) {
		try {
			const data = {
				games: gameManager.getDashboardGamesInfo(),
				stats: gameManager.getDashboardStats()
			};
			ws.send(JSON.stringify(data));
		} catch (error) {
			logger.error('Error sending dashboard data:', error);
		}
	}

	// Start server
	server.listen(port, () => {
		logger.info(`Dashboard HTTP/WebSocket server listening on port ${port}`);
	});

	return server;
}
