// Boot and the one loop for Turkey Run. Input is read every frame, the
// world advances in fixed 1/60 s steps (several in a slow frame, none
// in a fast one), and the renderer paints what is there. The game
// moves between four screens: title, play, paused and over (caught or
// escaped). The best score lives in localStorage.
//
// ?seed=N fixes the obstacle pattern. ?shot=title|play|caught|escaped
// (with &seed=N) stages that scene instead of running the loop,
// paints it twice and sets window.__shotReady for a screenshot.
import { BEST_KEY, STEP, VIEW_H, VIEW_W } from './config.js';
import { createRandom } from './random.js';
import { createAudio } from './audio.js';
import { ACTION_CONFIRM, ACTION_JUMP, ACTION_MUTE, ACTION_PAUSE, ACTION_RESTART, createInput } from './input.js';
import { createWorld, currentStage, drawWorld, updateWorld } from './world.js';
import { drawBackground, drawEnd, drawHud, drawPaused, drawTitle } from './render.js';
import { stageShot } from './shots.js';

/** The longest frame the loop catches up on; a longer stall is dropped. */
const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const ctx = canvas.getContext('2d');
canvas.width = VIEW_W;
canvas.height = VIEW_H;

const audio = createAudio();
const input = createInput(canvas);
let world = createWorld(createRandom(seed));
let screen = 'title'; // 'title' | 'play' | 'paused' | 'over'

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // Storage can be off: the best score then lasts this visit only.
  }
}

world.best = readBest();

function resetRun() {
  const freshSeed = Math.floor(Math.random() * 4294967296);
  world = createWorld(createRandom(freshSeed));
  world.best = readBest();
}

function announce(text) {
  status.textContent = text;
}

function render() {
  ctx.clearRect(0, 0, VIEW_W, VIEW_H);
  if (screen === 'title') {
    drawBackground(ctx, currentStage(world), world.distance, world.time);
    drawTitle(ctx, world.best, world.time);
  } else if (screen === 'play') {
    drawWorld(ctx, world, drawBackground, (c, w) => drawHud(c, w, audio.isMuted()));
  } else if (screen === 'paused') {
    drawWorld(ctx, world, drawBackground, (c, w) => drawHud(c, w, audio.isMuted()));
    drawPaused(ctx);
  } else {
    // Over: the frozen world behind the end screen.
    drawWorld(ctx, world, drawBackground, (c, w) => drawHud(c, w, audio.isMuted()));
    drawEnd(ctx, world.over, world);
  }
}

function step(dt) {
  world.time += dt;
  if (input.justPressed(ACTION_MUTE)) {
    audio.toggleMute();
  }

  if (screen === 'title') {
    if (input.justPressed(ACTION_JUMP) || input.justPressed(ACTION_CONFIRM)) {
      audio.unlock();
      resetRun();
      screen = 'play';
      announce('Running! Jump the fences, duck the knives, reach the forest.');
    }
    return;
  }

  if (screen === 'play') {
    if (input.justPressed(ACTION_PAUSE)) {
      screen = 'paused';
      announce('Paused.');
      return;
    }
    updateWorld(world, input, dt, audio);
    if (world.over && world.overHold <= 0) {
      screen = 'over';
      if (world.score > world.best) {
        world.best = world.score;
        saveBest(world.best);
      }
      announce(
        world.over === 'escaped'
          ? `Escaped! Score ${world.score}. Press R to run again.`
          : `Caught! Score ${world.score}. Press R to run again.`,
      );
    }
    return;
  }

  if (screen === 'paused') {
    if (input.justPressed(ACTION_PAUSE) || input.justPressed(ACTION_CONFIRM)) {
      screen = 'play';
      announce('Running!');
    }
    return;
  }

  // Over: restart on R or a click.
  if (input.justPressed(ACTION_RESTART) || input.justPressed(ACTION_JUMP)) {
    audio.unlock();
    resetRun();
    screen = 'play';
    announce('Running! Jump the fences, duck the knives, reach the forest.');
  }
}

function frame(now) {
  const dt = Math.min((now - last) / 1000, MAX_FRAME);
  last = now;
  accumulator += dt;
  let steps = 0;
  while (accumulator >= STEP && steps < 5) {
    step(STEP);
    accumulator -= STEP;
    steps += 1;
  }
  render();
  input.endFrame();
  window.requestAnimationFrame(frame);
}

let last = 0;
let accumulator = 0;

// Screenshot staging: paint the scene twice, then tell the driver.
if (shot) {
  stageShot(world, shot);
  if (shot === 'play') screen = 'play';
  else if (shot === 'caught' || shot === 'escaped') screen = 'over';
  else screen = 'title';
  world.best = shot === 'title' ? readBest() : world.best;
  render();
  render();
  window.__shotReady = true;
} else {
  announce('Turkey Run: press Space or click to start.');
  window.requestAnimationFrame((now) => {
    last = now;
    window.requestAnimationFrame(frame);
  });
}
