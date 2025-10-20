// Dashboard WebSocket client

export interface PlayerInfo {
	pseudo: string;
	lives: number;
	kills: number;
	isAlive: boolean;
	hasClearedWave: boolean;
}

export interface GameInfo {
	gameId: string;
	players: PlayerInfo[];
	currentWave: number;
	totalWaves: number;
	status: 'waiting' | 'active' | 'completed';
	startedAt: number;
}

export interface ServerStats {
	totalGames: number;
	activeGames: number;
	totalPlayers: number;
	uptime: number;
}

export interface DashboardData {
	games: GameInfo[];
	stats: ServerStats;
}

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export class DashboardClient {
	private ws: WebSocket | null = null;
	private serverUrl: string;
	private reconnectAttempts = 0;
	private maxReconnectAttempts = 10;
	private reconnectDelay = 2000;
	private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;

	// Event handlers
	public onStatusChange: ((status: ConnectionStatus) => void) | null = null;
	public onDataUpdate: ((data: DashboardData) => void) | null = null;

	constructor(serverUrl: string = 'ws://localhost:3001') {
		this.serverUrl = serverUrl;
	}

	/**
	 * Connect to the dashboard server
	 */
	connect(): Promise<void> {
		if (this.ws?.readyState === WebSocket.OPEN) {
			return Promise.resolve();
		}

		return new Promise((resolve, reject) => {
			this.updateStatus('connecting');

			try {
				this.ws = new WebSocket(this.serverUrl);

				this.ws.onopen = () => {
					this.updateStatus('connected');
					this.reconnectAttempts = 0;
					resolve();
				};

				this.ws.onmessage = (event) => {
					try {
						const data = JSON.parse(event.data) as DashboardData;
						this.handleData(data);
					} catch (error) {
						console.error('Failed to parse dashboard data:', error);
					}
				};

				this.ws.onerror = (error) => {
					console.error('WebSocket error:', error);
					this.updateStatus('error');
					reject(error);
				};

				this.ws.onclose = () => {
					this.updateStatus('disconnected');
					this.attemptReconnect();
				};
			} catch (error) {
				this.updateStatus('error');
				reject(error);
			}
		});
	}

	/**
	 * Disconnect from the server
	 */
	disconnect() {
		if (this.reconnectTimeout) {
			clearTimeout(this.reconnectTimeout);
			this.reconnectTimeout = null;
		}

		if (this.ws) {
			this.ws.close();
			this.ws = null;
		}

		this.updateStatus('disconnected');
	}

	/**
	 * Handle dashboard data
	 */
	private handleData(data: DashboardData) {
		if (this.onDataUpdate) {
			this.onDataUpdate(data);
		}
	}

	/**
	 * Update connection status
	 */
	private updateStatus(status: ConnectionStatus) {
		if (this.onStatusChange) {
			this.onStatusChange(status);
		}
	}

	/**
	 * Attempt to reconnect
	 */
	private attemptReconnect() {
		if (this.reconnectAttempts >= this.maxReconnectAttempts) {
			console.error('Max reconnection attempts reached');
			return;
		}

		this.reconnectAttempts++;
		console.log(
			`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`
		);

		this.reconnectTimeout = setTimeout(() => {
			this.connect().catch((error) => {
				console.error('Reconnection failed:', error);
			});
		}, this.reconnectDelay * this.reconnectAttempts);
	}

	/**
	 * Check if connected
	 */
	isConnected(): boolean {
		return this.ws?.readyState === WebSocket.OPEN;
	}
}
