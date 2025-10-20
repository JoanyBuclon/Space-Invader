// Game configuration

export interface WaveConfig {
	waveNumber: number;
	numberOfEnemies: number; // enemies per line
	numberOfLines: number;
	enemyLife: number;
}

export interface GameConfig {
	startingLives: number;
	waves: WaveConfig[];
}

// Server configuration
export const SERVER_CONFIG = {
	grpcPort: 50051,
	httpPort: 3001,
	minPlayers: 2,
	maxPlayers: 10,
	lobbyTimeout: 300000, // 5 minutes
	gameTimeout: 600000, // 10 minutes
	inactivityTimeout: 40000 // 40 seconds - auto-kill inactive players
};

// Default game configuration with 5 waves of increasing difficulty
export const DEFAULT_GAME_CONFIG: GameConfig = {
	startingLives: 3,
	waves: [
		{
			waveNumber: 1,
			numberOfEnemies: 5,
			numberOfLines: 2,
			enemyLife: 1
		},
		{
			waveNumber: 2,
			numberOfEnemies: 6,
			numberOfLines: 2,
			enemyLife: 1
		},
		{
			waveNumber: 3,
			numberOfEnemies: 7,
			numberOfLines: 3,
			enemyLife: 1
		},
		{
			waveNumber: 4,
			numberOfEnemies: 4,
			numberOfLines: 2,
			enemyLife: 2
		},
		{
			waveNumber: 5,
			numberOfEnemies: 5,
			numberOfLines: 3,
			enemyLife: 2
		}
	]
};

// Environment variable overrides
export function getServerPort(): number {
	return parseInt(process.env.GRPC_PORT || String(SERVER_CONFIG.grpcPort), 10);
}

export function getHttpPort(): number {
	return parseInt(process.env.HTTP_PORT || String(SERVER_CONFIG.httpPort), 10);
}

export function getMinPlayers(): number {
	return parseInt(process.env.MIN_PLAYERS || String(SERVER_CONFIG.minPlayers), 10);
}

export function getMaxPlayers(): number {
	return parseInt(process.env.MAX_PLAYERS || String(SERVER_CONFIG.maxPlayers), 10);
}

export function getInactivityTimeout(): number {
	return parseInt(
		process.env.INACTIVITY_TIMEOUT || String(SERVER_CONFIG.inactivityTimeout),
		10
	);
}
