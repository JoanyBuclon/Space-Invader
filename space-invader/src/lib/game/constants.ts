// Game configuration constants

// Canvas
export const CANVAS_WIDTH = 1200;
export const CANVAS_HEIGHT = 900;
export const BACKGROUND_COLOR = '#0a0e27';

// Player
export const PLAYER_WIDTH = 40;
export const PLAYER_HEIGHT = 30;
export const PLAYER_SPEED = 5;
export const PLAYER_COLOR = '#00ffff';
export const PLAYER_GLOW_COLOR = '#00ccff';
export const PLAYER_START_LIVES = 3;

// Enemies
export const ENEMY_LINES = 3;
export const ENEMY_PER_LINE = 7;
export const ENEMY_WIDTH = 35;
export const ENEMY_HEIGHT = 35;
export const ENEMY_SPEED = 0.8;
export const ENEMY_HEALTH = 1;
export const ENEMY_SPACING = 90;
export const ENEMY_LINE_SPACING = 70;
export const ENEMY_START_Y = 50;
export const ENEMY_WAVE_AMPLITUDE = 30;
export const ENEMY_WAVE_FREQUENCY = 0.02;
export const ENEMY_COLOR = '#ff3366';
export const ENEMY_GLOW_COLOR = '#ff6699';

// Bullets
export const BULLET_WIDTH = 4;
export const BULLET_HEIGHT = 15;
export const BULLET_SPEED = 7;
export const BULLET_DAMAGE = 1;
export const BULLET_COLOR = '#ffff00';
export const BULLET_GLOW_COLOR = '#ffcc00';
export const SHOOT_COOLDOWN = 15; // frames

// Defense Line
export const DEFENSE_LINE_Y_RATIO = 0.75;
export const DEFENSE_LINE_HEIGHT = 3;
export const DEFENSE_LINE_COLOR = '#00ff00';
export const DEFENSE_LINE_WARNING_COLOR = '#ff0000';

// Particles
export const PARTICLE_COUNT = 12;
export const PARTICLE_MIN_SPEED = 1;
export const PARTICLE_MAX_SPEED = 4;
export const PARTICLE_LIFE = 40;
export const PARTICLE_MIN_SIZE = 2;
export const PARTICLE_MAX_SIZE = 5;

// Game
export const TARGET_FPS = 60;
export const FRAME_TIME = 1000 / TARGET_FPS;

// Stars background
export const STAR_COUNT = 100;
export const STAR_MIN_SIZE = 1;
export const STAR_MAX_SIZE = 3;
export const STAR_TWINKLE_SPEED = 0.02;

// Score
export const POINTS_PER_ENEMY = 100;

// Screen shake
export const SHAKE_DURATION = 10; // frames
export const SHAKE_INTENSITY = 5;
