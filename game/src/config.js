// Tuning for Turkey Run: Escape Thanksgiving (turkey-run-game-01).
// One place for every number the game balances on, so a tweak never
// means hunting through the world, the turkey or the farmer.
export const VIEW_W = 1280;
export const VIEW_H = 720;
export const GROUND_Y = 620; // top edge of the ground strip
export const STEP = 1 / 60; // fixed simulation step, seconds

// The turkey's body. Ducking shrinks the hitbox; hiding removes it.
export const TURKEY_X = 260;
export const TURKEY_W = 64;
export const TURKEY_H = 72;
export const TURKEY_DUCK_H = 44;
export const GRAVITY = 3000;
export const JUMP_VELOCITY = 900;
export const DASH_VELOCITY = 520; // burst of world speed while dashing
export const DASH_TIME = 0.55; // seconds a dash lasts
export const DASH_COOLDOWN = 1.6; // seconds before the next dash

// The run: how fast the world scrolls, how far freedom is.
export const BASE_SPEED = 280; // px/s at the farmyard gate
export const MAX_SPEED = 520; // px/s in the kitchen
export const SPEED_PER_METRE = 0.16; // px/s gained per metre run
export const PX_PER_METRE = 50; // 50 scrolled pixels make one metre
export const ESCAPE_METRES = 1800; // reach the forest and you are free
export const START_LIVES = 3;

// The farmer: a gap in pixels between him and the turkey. A hit lets
// him close in; clean running and corn push him back. Gap 0 = caught.
export const FARMER_START_GAP = 340;
export const FARMER_MAX_GAP = 420;
export const FARMER_CLOSE_HIT = 75; // gap lost on a fence / pumpkin hit
export const FARMER_CLOSE_DANGER = 95; // gap lost on an oven / knife hit
export const FARMER_RECOVER = 26; // gap regained per second of clean running
export const FARMER_CORN_BONUS = 6; // gap regained per corn cob eaten
export const FARMER_WARN_GAP = 170; // below this the screen warns "FARMER!"
export const FARMER_HIDE_GAP = 320; // gap reset to this when he loses you

// Scoring: distance is the backbone, corn is the bonus, stages pay out.
export const CORN_SCORE = 10;
export const STAGE_BONUS = 100;
export const BEST_KEY = 'turkey-run-best';

// The stages: farmyard, barn, kitchen, then the forest (freedom).
// Each stage names its palette, its speed and what it throws at you.
export const STAGES = [
  {
    name: 'FARMYARD',
    from: 0,
    to: 600,
    skyTop: '#f7b267',
    skyBottom: '#ffe8b3',
    ground: '#8a5a2b',
    grass: '#7fae4c',
    speed: 280,
    spawnEvery: [0.95, 1.5], // seconds between obstacle waves
    kinds: ['fence', 'hay', 'pumpkin', 'corn', 'haystack'],
  },
  {
    name: 'BARN',
    from: 600,
    to: 1200,
    skyTop: '#e07a4f',
    skyBottom: '#ffd9a0',
    ground: '#7a4a22',
    grass: '#6f9e3e',
    speed: 360,
    spawnEvery: [0.8, 1.3],
    kinds: ['fence', 'hay', 'pumpkin', 'knife', 'corn', 'haystack'],
  },
  {
    name: 'KITCHEN',
    from: 1200,
    to: 1800,
    skyTop: '#c65b3c',
    skyBottom: '#ffc27a',
    ground: '#6b3d1c',
    grass: '#5f8f36',
    speed: 440,
    spawnEvery: [0.65, 1.1],
    kinds: ['fence', 'oven', 'knife', 'pumpkin', 'corn', 'haystack'],
  },
  {
    name: 'FOREST',
    from: 1800,
    to: Infinity,
    skyTop: '#5d8a4a',
    skyBottom: '#cfe8a8',
    ground: '#4c6b2f',
    grass: '#4f7d33',
    speed: 440,
    spawnEvery: [1.0, 1.6],
    kinds: ['corn'],
  },
];

// How long the turkey is untouchable after a hit, and how long the
// "caught" and "escaped" moments hold before the end screen.
export const INVULNERABLE_TIME = 1.5;
export const CAUGHT_HOLD = 1.1;
export const ESCAPED_HOLD = 1.2;
