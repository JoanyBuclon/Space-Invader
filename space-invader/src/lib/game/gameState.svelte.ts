// Game state management using Svelte 5 runes

import type { Player, Enemy, Bullet, Particle, GameState, GameStats, Keys } from './types';
import {
	CANVAS_WIDTH,
	CANVAS_HEIGHT,
	PLAYER_WIDTH,
	PLAYER_HEIGHT,
	PLAYER_SPEED,
	PLAYER_START_LIVES,
	ENEMY_COUNT,
	ENEMY_WIDTH,
	ENEMY_HEIGHT,
	ENEMY_SPEED,
	ENEMY_HEALTH,
	ENEMY_SPACING,
	ENEMY_START_Y,
	BULLET_WIDTH,
	BULLET_HEIGHT,
	BULLET_SPEED,
	BULLET_DAMAGE,
	DEFENSE_LINE_Y_RATIO
} from './constants';

/**
 * Create and manage game state with Svelte 5 runes
 */
export function createGameState() {
	// Game state
	let gameState = $state<GameState>('menu');

	// Player state
	let player = $state<Player>({
		x: CANVAS_WIDTH / 2 - PLAYER_WIDTH / 2,
		y: CANVAS_HEIGHT - PLAYER_HEIGHT - 20,
		width: PLAYER_WIDTH,
		height: PLAYER_HEIGHT,
		speed: PLAYER_SPEED,
		lives: PLAYER_START_LIVES,
		shootCooldown: 0
	});

	// Enemies
	let enemies = $state<Enemy[]>([]);

	// Bullets
	let bullets = $state<Bullet[]>([]);

	// Particles
	let particles = $state<Particle[]>([]);

	// Defense line
	const defenseLineY = CANVAS_HEIGHT * DEFENSE_LINE_Y_RATIO;

	// Input keys
	let keys = $state<Keys>({
		left: false,
		right: false,
		shoot: false
	});

	// Stats
	let stats = $state<GameStats>({
		score: 0,
		enemiesKilled: 0,
		shotsFired: 0
	});

	// Screen shake
	let shake = $state({ x: 0, y: 0, duration: 0 });

	/**
	 * Initialize/reset game
	 */
	function initGame() {
		// Reset player
		player.x = CANVAS_WIDTH / 2 - PLAYER_WIDTH / 2;
		player.y = CANVAS_HEIGHT - PLAYER_HEIGHT - 20;
		player.lives = PLAYER_START_LIVES;
		player.shootCooldown = 0;

		// Reset collections
		enemies = [];
		bullets = [];
		particles = [];

		// Reset stats
		stats.score = 0;
		stats.enemiesKilled = 0;
		stats.shotsFired = 0;

		// Spawn enemies
		spawnEnemies();

		// Start game
		gameState = 'playing';
	}

	/**
	 * Spawn enemies in a horizontal line
	 */
	function spawnEnemies() {
		const totalWidth = (ENEMY_COUNT - 1) * ENEMY_SPACING;
		const startX = (CANVAS_WIDTH - totalWidth) / 2;

		for (let i = 0; i < ENEMY_COUNT; i++) {
			const x = startX + i * ENEMY_SPACING;
			enemies.push({
				id: `enemy-${Date.now()}-${i}`,
				x,
				y: ENEMY_START_Y,
				width: ENEMY_WIDTH,
				height: ENEMY_HEIGHT,
				health: ENEMY_HEALTH,
				maxHealth: ENEMY_HEALTH,
				speed: ENEMY_SPEED,
				initialX: x,
				waveOffset: i * 0.5
			});
		}
	}

	/**
	 * Add bullet
	 */
	function addBullet(x: number, y: number) {
		bullets.push({
			id: `bullet-${Date.now()}`,
			x,
			y,
			width: BULLET_WIDTH,
			height: BULLET_HEIGHT,
			speed: BULLET_SPEED,
			damage: BULLET_DAMAGE
		});
		stats.shotsFired++;
	}

	/**
	 * Add particles
	 */
	function addParticles(newParticles: Particle[]) {
		particles.push(...newParticles);
	}

	/**
	 * Remove enemy
	 */
	function removeEnemy(id: string) {
		const index = enemies.findIndex((e) => e.id === id);
		if (index !== -1) {
			enemies.splice(index, 1);
		}
	}

	/**
	 * Remove bullet
	 */
	function removeBullet(id: string) {
		const index = bullets.findIndex((b) => b.id === id);
		if (index !== -1) {
			bullets.splice(index, 1);
		}
	}

	/**
	 * Damage enemy
	 */
	function damageEnemy(id: string, damage: number) {
		const enemy = enemies.find((e) => e.id === id);
		if (enemy) {
			enemy.health -= damage;
		}
	}

	/**
	 * Player loses life
	 */
	function loseLife() {
		player.lives--;
		triggerShake();
	}

	/**
	 * Add to score
	 */
	function addScore(points: number) {
		stats.score += points;
		stats.enemiesKilled++;
	}

	/**
	 * Trigger screen shake
	 */
	function triggerShake() {
		shake.duration = 10;
	}

	/**
	 * Set game state
	 */
	function setGameState(state: GameState) {
		gameState = state;
	}

	/**
	 * Set key state
	 */
	function setKey(key: keyof Keys, value: boolean) {
		keys[key] = value;
	}

	return {
		// State (read-only getters)
		get gameState() {
			return gameState;
		},
		get player() {
			return player;
		},
		get enemies() {
			return enemies;
		},
		get bullets() {
			return bullets;
		},
		get particles() {
			return particles;
		},
		get defenseLineY() {
			return defenseLineY;
		},
		get keys() {
			return keys;
		},
		get stats() {
			return stats;
		},
		get shake() {
			return shake;
		},

		// Actions
		initGame,
		addBullet,
		addParticles,
		removeEnemy,
		removeBullet,
		damageEnemy,
		loseLife,
		addScore,
		triggerShake,
		setGameState,
		setKey
	};
}

// Export type
export type GameStateManager = ReturnType<typeof createGameState>;
