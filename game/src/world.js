// The world: everything that happens while the turkey runs. It holds
// the turkey, the farmer, the obstacles and the score, and it advances
// them one fixed step at a time: the world scrolls, the distance and
// score grow, stages turn over, hits cost a life and let the farmer
// close in, corn pushes him back, and a haystack can hide the turkey
// long enough for him to lose the trail. Reaching the forest is freedom.
import {
  CORN_SCORE,
  ESCAPE_METRES,
  FARMER_CLOSE_DANGER,
  FARMER_CLOSE_HIT,
  FARMER_CORN_BONUS,
  FARMER_HIDE_GAP,
  FARMER_MAX_GAP,
  FARMER_RECOVER,
  FARMER_START_GAP,
  FARMER_WARN_GAP,
  MAX_SPEED,
  PX_PER_METRE,
  SPEED_PER_METRE,
  STAGES,
  STAGE_BONUS,
  START_LIVES,
} from './config.js';
import { createTurkey, drawTurkey, turkeyHitbox, turkeyHide, turkeyUnhide, turkeyUpdate } from './turkey.js';
import { createFarmer, drawFarmer, farmerGrab, farmerLoseTrail, farmerUpdate } from './farmer.js';
import {
  boxesOverlap,
  createSpawner,
  drawObstacle,
  hazardHitbox,
  updateObstacles,
  updateSpawner,
} from './obstacles.js';

// The farmer is relentless: he drains the gap a little every second,
// faster in later stages. Clean running recovers it; corn and dashes
// buy bigger chunks back.
function farmerDrain(stageIndex) {
  return 8 + stageIndex * 6;
}

export function createWorld(random) {
  return {
    random,
    time: 0,
    distance: 0, // metres run
    score: 0,
    corn: 0,
    lives: START_LIVES,
    best: 0, // best score, filled in by main.js from localStorage
    stageIndex: 0,
    stageBonus: 0,
    speed: STAGES[0].speed,
    obstacles: [],
    spawner: createSpawner(random),
    turkey: createTurkey(),
    farmer: createFarmer(),
    over: null, // 'caught' | 'escaped' once the run ends
    overHold: 0, // seconds the end moment holds before the screen
  };
}

export function currentStage(world) {
  return STAGES[world.stageIndex];
}

export function worldSpeed(world) {
  const stage = currentStage(world);
  const byDistance = stage.speed + world.distance * SPEED_PER_METRE;
  let speed = Math.min(byDistance, MAX_SPEED);
  if (world.turkey.dashing > 0) speed += 240;
  return speed;
}

export function updateWorld(world, input, dt, audio) {
  world.time += dt;
  const turkey = world.turkey;
  const farmer = world.farmer;

  if (world.over) {
    world.overHold -= dt;
    return;
  }

  turkeyUpdate(turkey, input, dt, audio);
  farmerUpdate(farmer, dt, turkey.hidden, audio);

  const stage = currentStage(world);
  const speed = worldSpeed(world);
  world.speed = speed;

  // The world scrolls and the obstacles with it, hidden or not.
  world.obstacles = updateObstacles(world.obstacles, dt, speed);
  const fresh = updateSpawner(world.spawner, stage, dt, world.distance);
  world.obstacles.push(...fresh);

  // Hiding: the turkey rides inside the haystack as it scrolls past.
  // Once the haystack has passed, the turkey is out in the open again.
  if (turkey.hidden) {
    const hay = turkey.hiddenHay;
    if (!hay || hay.x + hay.w < turkey.x + 10) {
      turkeyUnhide(turkey);
    }
    return; // no distance, no farmer pressure, while hidden
  }

  // Distance and score: one point a metre, plus corn and stage bonuses.
  world.distance += (speed * dt) / PX_PER_METRE;
  world.score = Math.floor(world.distance) + world.corn * CORN_SCORE + world.stageBonus;

  // Stage turns: a bonus, a jingle, and a harder world ahead.
  while (
    world.stageIndex < STAGES.length - 1 &&
    world.distance >= STAGES[world.stageIndex + 1].from
  ) {
    world.stageIndex += 1;
    world.stageBonus += STAGE_BONUS;
    audio.jingle();
  }

  // Freedom: the forest at 1800 metres.
  if (world.distance >= ESCAPE_METRES) {
    world.over = 'escaped';
    world.overHold = 1.2;
    audio.fanfare();
    return;
  }

  // The farmer: clean running recovers the gap, his relentlessness
  // drains it, and a dash buys a burst of distance from him.
  farmer.gap += (FARMER_RECOVER - farmerDrain(world.stageIndex)) * dt;
  if (turkey.dashing > 0) farmer.gap += 30 * dt;
  if (farmer.gap > FARMER_MAX_GAP) farmer.gap = FARMER_MAX_GAP;
  if (farmer.gap <= 0) {
    farmer.gap = 0;
    farmerGrab(farmer);
    world.over = 'caught';
    world.overHold = 1.1;
    audio.caught();
    return;
  }

  // Collisions: hazards cost a life, corn pays, haystacks hide.
  const hitbox = turkeyHitbox(turkey);
  if (hitbox) {
    for (const ob of world.obstacles) {
      if (ob.kind === 'corn') {
        if (boxesOverlap(hitbox, { x: ob.x, y: ob.y, w: ob.w, h: ob.h })) {
          ob.eaten = true;
          world.corn += 1;
          farmer.gap = Math.min(FARMER_MAX_GAP, farmer.gap + FARMER_CORN_BONUS);
          audio.jingle();
        }
        continue;
      }
      if (ob.kind === 'haystack') {
        // Ducking into a haystack hides the turkey from the farmer.
        if (input.isHeld('duck') && boxesOverlap(hitbox, { x: ob.x, y: ob.y, w: ob.w, h: ob.h })) {
          turkeyHide(turkey, ob);
          farmerLoseTrail(farmer);
          farmer.gap = FARMER_HIDE_GAP;
          audio.cluck();
        }
        continue;
      }
      const hb = hazardHitbox(ob);
      if (!hb || ob.hit) continue;
      if (turkey.invulnerable > 0) continue;
      if (boxesOverlap(hitbox, hb)) {
        ob.hit = true;
        world.lives -= 1;
        turkey.invulnerable = 1.5;
        turkey.vy = -320; // a stumble-hop off the hit
        turkey.grounded = false;
        const danger = ob.kind === 'oven' || ob.kind === 'knife';
        farmer.gap = Math.max(0, farmer.gap - (danger ? FARMER_CLOSE_DANGER : FARMER_CLOSE_HIT));
        if (ob.kind === 'oven') audio.sizzle();
        else if (ob.kind === 'knife') audio.whoosh();
        else audio.thud();
        if (world.lives <= 0) {
          farmerGrab(farmer);
          world.over = 'caught';
          world.overHold = 1.1;
          audio.caught();
          return;
        }
      }
    }
    world.obstacles = world.obstacles.filter((ob) => !ob.eaten && !ob.hit);
  }
}

// The farmer is close enough to warn about.
export function farmerWarning(world) {
  return world.farmer.gap < FARMER_WARN_GAP && !world.turkey.hidden;
}

// Draw the whole playing world: background, obstacles, farmer, turkey.
export function drawWorld(ctx, world, drawBackground, drawHud) {
  drawBackground(ctx, currentStage(world), world.distance, world.time);
  for (const ob of world.obstacles) drawObstacle(ctx, ob, world.time);
  // The farmer is drawn before the turkey so the turkey stays in front.
  drawFarmer(ctx, world.farmer, world.time);
  drawTurkey(ctx, world.turkey, world.time, farmerWarning(world));
  drawHud(ctx, world);
}
