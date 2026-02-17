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

// Colors — COD military palette
export const COLORS = {
  // Environment
  floor: '#3a3a38',
  ceiling: '#2a2a28',
  wallSide: '#4a4a46',
  wallBack: '#3e3e3a',
  concrete: '#555550',
  metal: '#6a6a68',
  ambient: '#f5e8d0',

  // Targets
  targetBody: '#1a1a1a',
  targetEdge: '#ff6600',
  targetHitFlash: '#ff2200',

  // Particles
  hitParticle: '#ff6600',
  wallSpark: '#ffcc00',
  shellCasing: '#c8a830',
  muzzleSmoke: '#888888',

  // HUD
  hudWhite: '#ffffff',
  hudRed: '#ff3333',
  hudGold: '#ffcc00',

  // Sandbags
  sandbag: '#b09060',

  // Jersey barrier
  barrier: '#808078',
};

// Gun constants
export const GUN_POSITION = { x: 0.35, y: -0.3, z: -0.6 };
export const GUN_RECOIL_KICK = 0.08;
export const GUN_RECOIL_ROTATE = 0.06;
export const GUN_RECOIL_RETURN_SPEED = 8;
export const GUN_SWAY_SPEED = 1.2;
export const GUN_SWAY_AMOUNT = 0.003;
export const MUZZLE_FLASH_DURATION = 80;

// Camera shake
export const SHAKE_BODYSHOT = 0.02;
export const SHAKE_HEADSHOT = 0.04;
export const SHAKE_DECAY = 8;

// Scoring
export const HEADSHOT_SCORE = 10;
export const BODYSHOT_SCORE = 1;

// Game tuning
export const WAVE_MIN = 5;
export const WAVE_MAX = 8;
export const WAVE_DELAY = 350;
export const TARGET_SPEED_MIN = 1.5;
export const TARGET_SPEED_MAX = 4.0;
export const HIT_EFFECT_DURATION = 600;
export const HIT_MARKER_DURATION = 200;
export const PARTICLE_COUNT = 10;
export const SHELL_CASING_LIFETIME = 2000;
export const WALL_SPARK_LIFETIME = 200;
export const SMOKE_LIFETIME = 1500;

// Material presets
export const GUNMETAL = { color: '#2a2a2e', metalness: 0.9, roughness: 0.2 };
