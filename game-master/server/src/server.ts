// Main server entry point

import { GameManager } from './game/GameManager.ts';
import { createGrpcServer, startGrpcServer } from './grpc/server.ts';
import { createDashboardServer } from './http/dashboardServer.ts';
import { getServerPort, getHttpPort } from './config/gameConfig.ts';
import { logger, LogLevel } from './utils/logger.ts';

// Set log level from environment
const logLevel = process.env.LOG_LEVEL || 'INFO';
logger.setLevel(LogLevel[logLevel as keyof typeof LogLevel] || LogLevel.INFO);

async function main() {
	logger.info('Starting Space Invader Multiplayer Server...');

	// Create game manager
	const gameManager = new GameManager();

	// Create and start gRPC server
	const grpcPort = getServerPort();
	const grpcServer = createGrpcServer(gameManager);

	try {
		await startGrpcServer(grpcServer, grpcPort);
		logger.info(`✓ gRPC server started on port ${grpcPort}`);
	} catch (error) {
		logger.error('Failed to start gRPC server:', error);
		process.exit(1);
	}

	// Create and start dashboard HTTP/WebSocket server
	const httpPort = getHttpPort();
	const dashboardServer = createDashboardServer(gameManager, httpPort);
	logger.info(`✓ Dashboard server started on port ${httpPort}`);

	// Cleanup old games every 5 minutes
	const cleanupInterval = setInterval(
		() => {
			gameManager.cleanupOldGames();
		},
		5 * 60 * 1000
	);

	// Graceful shutdown
	const shutdown = () => {
		logger.info('Shutting down server...');

		clearInterval(cleanupInterval);

		gameManager.shutdown();

		grpcServer.tryShutdown((error) => {
			if (error) {
				logger.error('Error shutting down gRPC server:', error);
				process.exit(1);
			}
			logger.info('gRPC server shut down');
		});

		dashboardServer.close(() => {
			logger.info('Dashboard server shut down');
			process.exit(0);
		});

		// Force shutdown after 10 seconds
		setTimeout(() => {
			logger.error('Forced shutdown after timeout');
			process.exit(1);
		}, 10000);
	};

	process.on('SIGINT', shutdown);
	process.on('SIGTERM', shutdown);

	logger.info('');
	logger.info('🚀 Server is ready!');
	logger.info(`   gRPC:      localhost:${grpcPort}`);
	logger.info(`   Dashboard: http://localhost:${httpPort}`);
	logger.info('');
}

main().catch((error) => {
	logger.error('Fatal error:', error);
	process.exit(1);
});
