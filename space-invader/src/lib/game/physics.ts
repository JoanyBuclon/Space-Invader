// Collision detection and physics utilities

import type { Enemy, Bullet } from './types';

/**
 * AABB (Axis-Aligned Bounding Box) collision detection
 */
export function checkCollision(
	a: { x: number; y: number; width: number; height: number },
	b: { x: number; y: number; width: number; height: number }
): boolean {
	return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

/**
 * Check if bullet hits an enemy
 */
export function checkBulletEnemyCollision(bullet: Bullet, enemy: Enemy): boolean {
	return checkCollision(bullet, enemy);
}

/**
 * Check if enemy crossed the defense line
 */
export function checkEnemyDefenseCollision(enemy: Enemy, defenseLineY: number): boolean {
	return enemy.y + enemy.height >= defenseLineY;
}

/**
 * Calculate distance between two points
 */
export function distance(x1: number, y1: number, x2: number, y2: number): number {
	return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

/**
 * Linear interpolation
 */
export function lerp(start: number, end: number, t: number): number {
	return start + (end - start) * t;
}

/**
 * Ease out cubic
 */
export function easeOutCubic(t: number): number {
	return 1 - Math.pow(1 - t, 3);
}

/**
 * Ease in cubic
 */
export function easeInCubic(t: number): number {
	return t * t * t;
}

/**
 * Clamp value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
	return Math.max(min, Math.min(max, value));
}

/**
 * Generate random number between min and max
 */
export function random(min: number, max: number): number {
	return Math.random() * (max - min) + min;
}

/**
 * Generate random integer between min and max (inclusive)
 */
export function randomInt(min: number, max: number): number {
	return Math.floor(random(min, max + 1));
}
