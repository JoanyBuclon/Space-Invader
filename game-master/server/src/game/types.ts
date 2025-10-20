// Game types and interfaces

export type GameStatus = 'waiting' | 'active' | 'completed';

export interface PlayerState {
	pseudo: string;
	lives: number;
	kills: number;
	isAlive: boolean;
	hasClearedWave: boolean;
	totalKills: number;
	wavesCleared: number;
}

export interface GameState {
	gameId: string;
	status: GameStatus;
	players: Map<string, PlayerState>;
	currentWave: number;
	totalWaves: number;
	startedAt: number;
	completedAt?: number;
}

export interface PlayerConnection {
	pseudo: string;
	stream: any; // ServerWritableStream type from gRPC
	joinedAt: number;
}

// Event types for internal handling
export type GameEventType =
	| 'player_joined'
	| 'player_disconnected'
	| 'player_touched'
	| 'wave_cleared'
	| 'enemy_killed'
	| 'player_killed';

export interface GameEvent {
	type: GameEventType;
	pseudo: string;
	timestamp: number;
}

// Dashboard types
export interface DashboardGameInfo {
	gameId: string;
	players: Array<{
		pseudo: string;
		lives: number;
		kills: number;
		isAlive: boolean;
		hasClearedWave: boolean;
	}>;
	currentWave: number;
	totalWaves: number;
	status: GameStatus;
	startedAt: number;
}

export interface DashboardStats {
	totalGames: number;
	activeGames: number;
	totalPlayers: number;
	uptime: number;
}
