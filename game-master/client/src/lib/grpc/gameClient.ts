// WebSocket-based game client for browser

export type ServerEvent =
	| {
			type: 'game-started';
			numberOfWaves: number;
			lifePoints: number;
			players: string[];
	  }
	| {
			type: 'wave-started';
			waveNumber: number;
			numberOfEnemies: number;
			numberOfLines: number;
			enemyLife: number;
	  }
	| {
			type: 'game-ended';
			victory: boolean;
			playerStats: Array<{
				pseudo: string;
				totalKills: number;
				wavesCleared: number;
				survived: boolean;
			}>;
	  }
	| {
			type: 'lobby-update';
			waitingPlayers: string[];
			requiredPlayers: number;
			currentPlayers: number;
	  }
	| {
			type: 'error';
			message: string;
			code: string;
	  };

export type ClientEvent =
	| { type: 'player-joined'; pseudo: string }
	| { type: 'player-disconnected'; pseudo: string }
	| { type: 'player-touched'; pseudo: string }
	| { type: 'wave-cleared'; pseudo: string }
	| { type: 'enemy-killed'; pseudo: string }
	| { type: 'player-killed'; pseudo: string };

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export class GameClient {
	private ws: WebSocket | null = null;
	private serverUrl: string;
	private pseudo: string | null = null;
	private reconnectAttempts = 0;
	private maxReconnectAttempts = 5;
	private reconnectDelay = 2000;
	private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;

	// Event handlers
	public onStatusChange: ((status: ConnectionStatus) => void) | null = null;
	public onServerEvent: ((event: ServerEvent) => void) | null = null;

	constructor(serverUrl?: string) {
		this.serverUrl =
			serverUrl ||
			(typeof window !== 'undefined' && (window as any).PUBLIC_WS_SERVER_URL) ||
			'ws://localhost:3001/game';
	}

	/**
	 * Connect to the server and join with a pseudo
	 */
	connect(pseudo: string): Promise<void> {
		if (this.ws?.readyState === WebSocket.OPEN) {
			return Promise.reject(new Error('Already connected'));
		}

		this.pseudo = pseudo;
		this.reconnectAttempts = 0;

		return new Promise((resolve, reject) => {
			this.updateStatus('connecting');

			try {
				this.ws = new WebSocket(this.serverUrl);

				this.ws.onopen = () => {
					this.updateStatus('connected');
					this.reconnectAttempts = 0;

					// Send player-joined event
					this.sendEvent({ type: 'player-joined', pseudo });

					resolve();
				};

				this.ws.onmessage = (event) => {
					try {
						const serverEvent = JSON.parse(event.data) as ServerEvent;
						this.handleServerEvent(serverEvent);
					} catch (error) {
						console.error('Failed to parse server message:', error);
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
	 * Send an event to the server
	 */
	sendEvent(event: ClientEvent) {
		if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
			console.warn('Cannot send event: not connected');
			return;
		}

		try {
			this.ws.send(JSON.stringify(event));
		} catch (error) {
			console.error('Failed to send event:', error);
		}
	}

	/**
	 * Disconnect from the server
	 */
	disconnect() {
		if (this.reconnectTimeout) {
			clearTimeout(this.reconnectTimeout);
			this.reconnectTimeout = null;
		}

		if (this.pseudo) {
			this.sendEvent({ type: 'player-disconnected', pseudo: this.pseudo });
		}

		if (this.ws) {
			this.ws.close();
			this.ws = null;
		}

		this.pseudo = null;
		this.updateStatus('disconnected');
	}

	/**
	 * Handle server event
	 */
	private handleServerEvent(event: ServerEvent) {
		if (this.onServerEvent) {
			this.onServerEvent(event);
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
		if (!this.pseudo) return;
		if (this.reconnectAttempts >= this.maxReconnectAttempts) {
			console.error('Max reconnection attempts reached');
			return;
		}

		this.reconnectAttempts++;
		console.log(
			`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`
		);

		this.reconnectTimeout = setTimeout(() => {
			if (this.pseudo) {
				this.connect(this.pseudo).catch((error) => {
					console.error('Reconnection failed:', error);
				});
			}
		}, this.reconnectDelay * this.reconnectAttempts);
	}

	/**
	 * Check if connected
	 */
	isConnected(): boolean {
		return this.ws?.readyState === WebSocket.OPEN;
	}

	/**
	 * Get current pseudo
	 */
	getPseudo(): string | null {
		return this.pseudo;
	}
}
