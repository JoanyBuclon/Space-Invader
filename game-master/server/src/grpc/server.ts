// gRPC server setup

import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { GameManager } from '../game/GameManager.ts';
import { createHandlers } from './handlers.ts';
import { logger } from '../utils/logger.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export function createGrpcServer(gameManager: GameManager): grpc.Server {
	// Load proto file
	const PROTO_PATH = join(__dirname, '../../proto/game.proto');

	const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
		keepCase: true,
		longs: String,
		enums: String,
		defaults: true,
		oneofs: true
	});

	const protoDescriptor = grpc.loadPackageDefinition(packageDefinition) as any;
	const gameService = protoDescriptor.spaceinvader;

	// Create server
	const server = new grpc.Server();

	// Get handlers
	const handlers = createHandlers(gameManager);

	// Add service
	server.addService(gameService.GameService.service, {
		playGame: handlers.playGame,
		monitorGames: handlers.monitorGames
	});

	return server;
}

export function startGrpcServer(server: grpc.Server, port: number): Promise<void> {
	return new Promise((resolve, reject) => {
		server.bindAsync(
			`0.0.0.0:${port}`,
			grpc.ServerCredentials.createInsecure(),
			(error, port) => {
				if (error) {
					reject(error);
					return;
				}

				logger.info(`gRPC server listening on port ${port}`);
				resolve();
			}
		);
	});
}
