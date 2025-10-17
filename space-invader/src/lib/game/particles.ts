// Particle system for visual effects

import type { Particle } from './types';
import {
	PARTICLE_COUNT,
	PARTICLE_MIN_SPEED,
	PARTICLE_MAX_SPEED,
	PARTICLE_LIFE,
	PARTICLE_MIN_SIZE,
	PARTICLE_MAX_SIZE
} from './constants';
import { random } from './physics';

/**
 * Create explosion particles at a specific position
 */
export function createExplosion(x: number, y: number, color: string = '#ff3366'): Particle[] {
	const particles: Particle[] = [];
	const particleCount = PARTICLE_COUNT;

	for (let i = 0; i < particleCount; i++) {
		const angle = (Math.PI * 2 * i) / particleCount + random(-0.2, 0.2);
		const speed = random(PARTICLE_MIN_SPEED, PARTICLE_MAX_SPEED);
		const size = random(PARTICLE_MIN_SIZE, PARTICLE_MAX_SIZE);

		particles.push({
			id: `particle-${Date.now()}-${i}`,
			x,
			y,
			vx: Math.cos(angle) * speed,
			vy: Math.sin(angle) * speed,
			size,
			life: PARTICLE_LIFE,
			maxLife: PARTICLE_LIFE,
			color
		});
	}

	return particles;
}

/**
 * Update particle positions and life
 */
export function updateParticle(particle: Particle): Particle {
	return {
		...particle,
		x: particle.x + particle.vx,
		y: particle.y + particle.vy,
		vy: particle.vy + 0.2, // Gravity effect
		life: particle.life - 1
	};
}

/**
 * Check if particle is still alive
 */
export function isParticleAlive(particle: Particle): boolean {
	return particle.life > 0;
}

/**
 * Get particle opacity based on remaining life
 */
export function getParticleOpacity(particle: Particle): number {
	return particle.life / particle.maxLife;
}

/**
 * Create star field for background
 */
export function createStars(count: number, width: number, height: number) {
	const stars: Array<{ x: number; y: number; size: number; brightness: number }> = [];

	for (let i = 0; i < count; i++) {
		stars.push({
			x: random(0, width),
			y: random(0, height),
			size: random(1, 3),
			brightness: random(0.3, 1)
		});
	}

	return stars;
}
