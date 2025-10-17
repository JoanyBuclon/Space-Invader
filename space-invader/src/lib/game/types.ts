// Game entity types and interfaces

export interface Position {
	x: number;
	y: number;
}

export interface Size {
	width: number;
	height: number;
}

export interface Player {
	x: number;
	y: number;
	width: number;
	height: number;
	speed: number;
	lives: number;
	shootCooldown: number;
}

export interface Enemy {
	id: string;
	x: number;
	y: number;
	width: number;
	height: number;
	health: number;
	maxHealth: number;
	speed: number;
	initialX: number;
	waveOffset: number;
}

export interface Bullet {
	id: string;
	x: number;
	y: number;
	width: number;
	height: number;
	speed: number;
	damage: number;
}

export interface Particle {
	id: string;
	x: number;
	y: number;
	vx: number;
	vy: number;
	size: number;
	life: number;
	maxLife: number;
	color: string;
}

export interface DefenseLine {
	y: number;
	height: number;
}

export type GameState = 'menu' | 'playing' | 'won' | 'gameOver';

export interface GameStats {
	score: number;
	enemiesKilled: number;
	shotsFired: number;
}

export interface Keys {
	left: boolean;
	right: boolean;
	shoot: boolean;
}
