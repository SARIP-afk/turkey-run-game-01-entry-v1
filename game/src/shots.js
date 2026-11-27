// Staging for screenshots: ?shot=title|play|caught|escaped (with
// &seed=N) sets up one deterministic, good-looking scene of the game
// and paints it, instead of running the loop. The screenshot driver
// waits for window.__shotReady, which main.js sets after two paints.
// Every staged scene is a real state of the game's own code, never a
// mock: the play shot is a live mid-run frame, the end shots are the
// run's real end states.
import { ESCAPE_METRES, GROUND_Y } from './config.js';
import { farmerGrab } from './farmer.js';

// A mid-run frame in the barn: the turkey is airborne over an oven,
// a carving knife is flying in, corn arcs ahead, a haystack waits,
// and the farmer is close enough to warn about. The HUD is full.
export function stagePlay(world) {
  world.distance = 742;
  world.score = 1180;
  world.corn = 12;
  world.lives = 2;
  world.best = 1240;
  world.stageIndex = 1;
  world.stageBonus = 100;
  world.time = 3.2;
  world.farmer.gap = 150;
  world.farmer.state = 'chase';

  const t = world.turkey;
  t.y = GROUND_Y - 72 - 62; // mid-jump
  t.vy = -240;
  t.grounded = false;
  t.runPhase = 2.4;

  world.obstacles = [
    { kind: 'fence', x: 420, y: GROUND_Y - 62, w: 46, h: 62, rot: 0 },
    { kind: 'oven', x: 560, y: GROUND_Y - 118, w: 150, h: 118, rot: 0 },
    { kind: 'knife', x: 900, y: GROUND_Y - 68, w: 72, h: 18, extra: 170 },
    { kind: 'corn', x: 1010, y: GROUND_Y - 150, w: 34, h: 34, bob: 0.6 },
    { kind: 'corn', x: 1066, y: GROUND_Y - 190, w: 34, h: 34, bob: 1.2 },
    { kind: 'corn', x: 1122, y: GROUND_Y - 150, w: 34, h: 34, bob: 1.8 },
    { kind: 'haystack', x: 1180, y: GROUND_Y - 112, w: 92, h: 112, rot: 0 },
  ];
}

// The caught end: the farmer has the turkey at 1104 m, lives spent,
// the grab in progress behind the end screen.
export function stageCaught(world) {
  world.distance = 1104;
  world.score = 1530;
  world.corn = 9;
  world.lives = 0;
  world.best = 1530;
  world.stageIndex = 1;
  world.stageBonus = 100;
  world.time = 5.0;
  world.farmer.gap = 0;
  farmerGrab(world.farmer);
  world.over = 'caught';
  world.overHold = 0;
  world.obstacles = [
    { kind: 'fence', x: 520, y: GROUND_Y - 62, w: 46, h: 62, rot: 0 },
    { kind: 'haystack', x: 980, y: GROUND_Y - 112, w: 92, h: 112, rot: 0 },
  ];
}

// The escaped end: the forest at 1800 m, the farmer far behind, the
// turkey running free behind the end screen.
export function stageEscaped(world) {
  world.distance = ESCAPE_METRES;
  world.score = 2410;
  world.corn = 21;
  world.lives = 2;
  world.best = 2410;
  world.stageIndex = 3;
  world.stageBonus = 300;
  world.time = 8.0;
  world.farmer.gap = 400;
  world.farmer.state = 'chase';
  world.over = 'escaped';
  world.overHold = 0;
  const t = world.turkey;
  t.y = GROUND_Y - 72;
  t.grounded = true;
  t.runPhase = 4.1;
  world.obstacles = [
    { kind: 'corn', x: 700, y: GROUND_Y - 150, w: 34, h: 34, bob: 0.3 },
    { kind: 'corn', x: 756, y: GROUND_Y - 190, w: 34, h: 34, bob: 0.9 },
    { kind: 'corn', x: 812, y: GROUND_Y - 150, w: 34, h: 34, bob: 1.5 },
  ];
}

export function stageShot(world, shot) {
  if (shot === 'play') stagePlay(world);
  else if (shot === 'caught') stageCaught(world);
  else if (shot === 'escaped') stageEscaped(world);
  // 'title' needs no world staging: the title screen paints itself.
}
