// Room dimensions
export const ROOM_WIDTH = 20;
export const ROOM_HEIGHT = 8;
export const ROOM_DEPTH = 30;

// Player position
export const PLAYER_Y = 1.7;

// Target zone boundaries
export const TARGET_ZONE = {
  minX: -8,
  maxX: 8,
  minY: 0.5,
  maxY: 6,
  minZ: -22,
  maxZ: -28,
};

// Colors
export const COLORS = {
  floor: '#1a1a1a',
  ceiling: '#0a0a0a',
  wallSide: '#141418',
  wallBack: '#0e0e12',
  neonBlue: '#3c82ff',
  neonOrange: '#ff8020',
  ambient: '#1a2040',
  targetOrange: '#ff6030',
  targetCyan: '#30ddff',
  hitParticle: '#ffa040',
};

// Game tuning
export const WAVE_MIN = 5;
export const WAVE_MAX = 8;
export const WAVE_DELAY = 350;
export const TARGET_SPEED_MIN = 1.5;
export const TARGET_SPEED_MAX = 4.0;
export const HIT_EFFECT_DURATION = 600;
export const HIT_MARKER_DURATION = 200;
export const MUZZLE_FLASH_DURATION = 100;
export const PARTICLE_COUNT = 10;
