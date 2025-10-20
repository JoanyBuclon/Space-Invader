<script lang="ts">
	import { onMount } from 'svelte';
	import type { MultiplayerGameState } from '$lib/game/multiplayerState.svelte';
	import {
		CANVAS_WIDTH,
		CANVAS_HEIGHT,
		BACKGROUND_COLOR,
		PLAYER_COLOR,
		PLAYER_GLOW_COLOR,
		ENEMY_COLOR,
		ENEMY_GLOW_COLOR,
		BULLET_COLOR,
		BULLET_GLOW_COLOR,
		DEFENSE_LINE_COLOR,
		DEFENSE_LINE_HEIGHT,
		ENEMY_WAVE_AMPLITUDE,
		ENEMY_WAVE_FREQUENCY,
		SHOOT_COOLDOWN,
		SHAKE_INTENSITY,
		STAR_COUNT
	} from '$lib/game/constants';
	import {
		checkBulletEnemyCollision,
		checkEnemyDefenseCollision,
		clamp,
		random
	} from '$lib/game/physics';
	import {
		createExplosion,
		updateParticle,
		isParticleAlive,
		getParticleOpacity,
		createStars
	} from '$lib/game/particles';

	interface Props {
		gameState: MultiplayerGameState;
	}

	let { gameState }: Props = $props();

	let canvas: HTMLCanvasElement;
	let ctx: CanvasRenderingContext2D;
	let animationId: number;
	let frameCount = 0;
	let stars: Array<{ x: number; y: number; size: number; brightness: number }> = [];

	onMount(() => {
		ctx = canvas.getContext('2d')!;
		stars = createStars(STAR_COUNT, CANVAS_WIDTH, CANVAS_HEIGHT);
		startGameLoop();

		return () => {
			if (animationId) {
				cancelAnimationFrame(animationId);
			}
		};
	});

	function startGameLoop() {
		gameLoop();
	}

	function gameLoop() {
		update();
		render();
		animationId = requestAnimationFrame(gameLoop);
	}

	function update() {
		if (gameState.multiplayerStatus !== 'playing') return;

		frameCount++;

		// Update player
		updatePlayer();

		// Update shooting cooldown
		if (gameState.player.shootCooldown > 0) {
			gameState.player.shootCooldown--;
		}

		// Handle shooting
		if (gameState.keys.shoot && gameState.player.shootCooldown === 0) {
			shoot();
		}

		// Update enemies
		updateEnemies();

		// Update bullets
		updateBullets();

		// Update particles
		updateParticles();

		// Update screen shake
		updateShake();

		// Check win/lose conditions
		checkGameConditions();
	}

	function updatePlayer() {
		const player = gameState.player;

		if (gameState.keys.left) {
			player.x = clamp(player.x - player.speed, 0, CANVAS_WIDTH - player.width);
		}
		if (gameState.keys.right) {
			player.x = clamp(player.x + player.speed, 0, CANVAS_WIDTH - player.width);
		}
	}

	function shoot() {
		const player = gameState.player;
		gameState.addBullet(player.x + player.width / 2 - 2, player.y);
		gameState.player.shootCooldown = SHOOT_COOLDOWN;
	}

	function updateEnemies() {
		for (const enemy of gameState.enemies) {
			// Move down
			enemy.y += enemy.speed;

			// Wave motion
			const waveX = Math.sin((frameCount + enemy.waveOffset * 30) * ENEMY_WAVE_FREQUENCY);
			enemy.x = enemy.initialX + waveX * ENEMY_WAVE_AMPLITUDE;

			// Check if crossed defense line
			if (checkEnemyDefenseCollision(enemy, gameState.defenseLineY)) {
				gameState.loseLife();
				gameState.removeEnemy(enemy.id);

				// Notify server of player touched
				gameState.notifyPlayerTouched();

				// Create explosion
				const particles = createExplosion(
					enemy.x + enemy.width / 2,
					enemy.y + enemy.height / 2,
					ENEMY_COLOR
				);
				gameState.addParticles(particles);
			}
		}
	}

	function updateBullets() {
		for (const bullet of gameState.bullets) {
			bullet.y -= bullet.speed;

			// Remove if off screen
			if (bullet.y + bullet.height < 0) {
				gameState.removeBullet(bullet.id);
				continue;
			}

			// Check collision with enemies
			for (const enemy of gameState.enemies) {
				if (checkBulletEnemyCollision(bullet, enemy)) {
					gameState.damageEnemy(enemy.id, bullet.damage);
					gameState.removeBullet(bullet.id);

					// Check if enemy is destroyed
					if (enemy.health <= 0) {
						gameState.removeEnemy(enemy.id);
						gameState.addScore(100);
						gameState.triggerShake();

						// Notify server of enemy kill
						gameState.notifyEnemyKilled();

						// Create explosion
						const particles = createExplosion(
							enemy.x + enemy.width / 2,
							enemy.y + enemy.height / 2,
							ENEMY_COLOR
						);
						gameState.addParticles(particles);
					}
					break;
				}
			}
		}
	}

	function updateParticles() {
		for (let i = gameState.particles.length - 1; i >= 0; i--) {
			const particle = gameState.particles[i];
			const updated = updateParticle(particle);
			gameState.particles[i] = updated;

			if (!isParticleAlive(updated)) {
				gameState.particles.splice(i, 1);
			}
		}
	}

	function updateShake() {
		if (gameState.shake.duration > 0) {
			gameState.shake.x = random(-SHAKE_INTENSITY, SHAKE_INTENSITY);
			gameState.shake.y = random(-SHAKE_INTENSITY, SHAKE_INTENSITY);
			gameState.shake.duration--;
		} else {
			gameState.shake.x = 0;
			gameState.shake.y = 0;
		}
	}

	function checkGameConditions() {
		// Check win (wave cleared)
		if (gameState.enemies.length === 0 && gameState.multiplayerStatus === 'playing') {
			gameState.notifyWaveCleared();
		}

		// Check lose (player killed)
		if (gameState.player.lives <= 0 && gameState.multiplayerStatus === 'playing') {
			gameState.notifyPlayerKilled();
		}
	}

	function render() {
		if (!ctx) return;

		// Save context
		ctx.save();

		// Apply screen shake
		ctx.translate(gameState.shake.x, gameState.shake.y);

		// Clear canvas
		ctx.fillStyle = BACKGROUND_COLOR;
		ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

		// Render stars
		renderStars();

		// Render defense line
		renderDefenseLine();

		// Render player
		renderPlayer();

		// Render enemies
		renderEnemies();

		// Render bullets
		renderBullets();

		// Render particles
		renderParticles();

		// Restore context
		ctx.restore();
	}

	function renderStars() {
		for (const star of stars) {
			const twinkle = Math.sin(frameCount * 0.02 + star.x) * 0.3 + 0.7;
			ctx.fillStyle = `rgba(255, 255, 255, ${star.brightness * twinkle})`;
			ctx.fillRect(star.x, star.y, star.size, star.size);
		}
	}

	function renderPlayer() {
		const player = gameState.player;

		// Glow effect
		ctx.shadowBlur = 20;
		ctx.shadowColor = PLAYER_GLOW_COLOR;

		// Draw player
		ctx.fillStyle = PLAYER_COLOR;
		ctx.beginPath();
		ctx.moveTo(player.x + player.width / 2, player.y);
		ctx.lineTo(player.x + player.width, player.y + player.height);
		ctx.lineTo(player.x, player.y + player.height);
		ctx.closePath();
		ctx.fill();

		// Reset shadow
		ctx.shadowBlur = 0;
	}

	function renderEnemies() {
		for (const enemy of gameState.enemies) {
			// Glow effect
			ctx.shadowBlur = 15;
			ctx.shadowColor = ENEMY_GLOW_COLOR;

			// Draw enemy
			ctx.fillStyle = ENEMY_COLOR;
			ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);

			// Health bar
			if (enemy.health < enemy.maxHealth) {
				const healthRatio = enemy.health / enemy.maxHealth;
				ctx.fillStyle = '#00ff00';
				ctx.fillRect(enemy.x, enemy.y - 8, enemy.width * healthRatio, 4);
			}

			// Reset shadow
			ctx.shadowBlur = 0;
		}
	}

	function renderBullets() {
		for (const bullet of gameState.bullets) {
			// Glow effect
			ctx.shadowBlur = 15;
			ctx.shadowColor = BULLET_GLOW_COLOR;

			// Draw bullet
			ctx.fillStyle = BULLET_COLOR;
			ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);

			// Reset shadow
			ctx.shadowBlur = 0;
		}
	}

	function renderParticles() {
		for (const particle of gameState.particles) {
			const opacity = getParticleOpacity(particle);
			ctx.fillStyle = particle.color.replace(')', `, ${opacity})`).replace('rgb', 'rgba');
			ctx.fillRect(particle.x, particle.y, particle.size, particle.size);
		}
	}

	function renderDefenseLine() {
		const warningThreshold = 100;
		const nearestEnemy = Math.min(
			...gameState.enemies.map((e) => gameState.defenseLineY - e.y - e.height)
		);

		// Pulse when enemies are close
		const pulse = nearestEnemy < warningThreshold ? Math.sin(frameCount * 0.2) * 0.5 + 0.5 : 1;

		ctx.fillStyle = DEFENSE_LINE_COLOR;
		ctx.globalAlpha = pulse;
		ctx.fillRect(0, gameState.defenseLineY, CANVAS_WIDTH, DEFENSE_LINE_HEIGHT);
		ctx.globalAlpha = 1;
	}
</script>

<canvas
	bind:this={canvas}
	width={CANVAS_WIDTH}
	height={CANVAS_HEIGHT}
	class="border-2 border-cyan-500 rounded-lg shadow-2xl shadow-cyan-500/50"
></canvas>
