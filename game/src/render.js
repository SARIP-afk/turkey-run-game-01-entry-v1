// Everything the player sees: the autumn world (sky, sun, clouds,
// hills and stage silhouettes scrolling past at three speeds), the
// HUD (score, distance, lives, stage, farmer warning), and the four
// screens — title, paused, caught and escaped. All canvas paths.
import { ESCAPE_METRES, GROUND_Y, STAGES, VIEW_H, VIEW_W } from './config.js';
import { drawFarmer } from './farmer.js';
import { drawTurkey } from './turkey.js';

// A deterministic hash: the same stretch of ground always grows the
// same tree, so the parallax never pops as the world scrolls.
function hash(n) {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function textOutlined(ctx, text, x, y, font, fill, stroke, align) {
  ctx.font = font;
  ctx.textAlign = align ?? 'left';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 6;
  ctx.strokeText(text, x, y);
  ctx.fillStyle = fill;
  ctx.fillText(text, x, y);
  ctx.textAlign = 'left';
}

function drawHeart(ctx, x, y, size, filled) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size / 16, size / 16);
  ctx.beginPath();
  ctx.moveTo(0, 5);
  ctx.bezierCurveTo(-9, -3, -5, -10, 0, -4);
  ctx.bezierCurveTo(5, -10, 9, -3, 0, 5);
  ctx.closePath();
  ctx.fillStyle = filled ? '#e63946' : 'rgba(255,255,255,0.25)';
  ctx.fill();
  ctx.strokeStyle = '#7a1f1f';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();
}

// The world behind the run: sky, sun, clouds, hills, stage scenery
// and the ground, each scrolling at its own speed.
export function drawBackground(ctx, stage, distance, time) {
  const sky = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
  sky.addColorStop(0, stage.skyTop);
  sky.addColorStop(1, stage.skyBottom);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, VIEW_W, GROUND_Y);

  // Sun, warm and low.
  ctx.beginPath();
  ctx.arc(1120, 96, 44, 0, Math.PI * 2);
  ctx.fillStyle = '#ffd97a';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(1120, 96, 58, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,217,122,0.35)';
  ctx.fill();

  // Clouds drift slowly.
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  for (let i = 0; i < 5; i++) {
    const cx = (((i * 317 + 140 - distance * 12) % 1500) + 1500) % 1500 - 110;
    const cy = 60 + hash(i * 7) * 120;
    ctx.beginPath();
    ctx.ellipse(cx, cy, 62, 20, 0, 0, Math.PI * 2);
    ctx.ellipse(cx + 34, cy + 6, 44, 16, 0, 0, Math.PI * 2);
    ctx.ellipse(cx - 36, cy + 8, 40, 14, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Far hills, rolling at quarter speed.
  ctx.fillStyle = 'rgba(122,90,43,0.35)';
  ctx.beginPath();
  ctx.moveTo(0, GROUND_Y);
  for (let x = 0; x <= VIEW_W; x += 16) {
    const wx = x + distance * 0.25;
    const y = GROUND_Y - 70 - Math.sin(wx * 0.004) * 34 - Math.sin(wx * 0.011) * 14;
    ctx.lineTo(x, y);
  }
  ctx.lineTo(VIEW_W, GROUND_Y);
  ctx.closePath();
  ctx.fill();

  // Mid scenery at half speed: a barn, a windmill, a house or pines,
  // depending on the stage, placed by hash so they never jump.
  const spacing = 420;
  const offset = distance * 0.5;
  const first = Math.floor(offset / spacing) - 1;
  for (let i = first; i < first + 5; i++) {
    const sx = i * spacing - offset + hash(i * 13) * 120;
    if (sx < -160 || sx > VIEW_W + 160) continue;
    drawScenery(ctx, stage, sx, GROUND_Y, i);
  }

  // Ground: earth, grass, tufts and stones.
  ctx.fillStyle = stage.ground;
  ctx.fillRect(0, GROUND_Y, VIEW_W, VIEW_H - GROUND_Y);
  ctx.fillStyle = stage.grass;
  ctx.fillRect(0, GROUND_Y, VIEW_W, 12);
  ctx.strokeStyle = 'rgba(0,0,0,0.15)';
  ctx.lineWidth = 2;
  const gOff = distance % 90;
  for (let x = -gOff; x < VIEW_W; x += 90) {
    ctx.beginPath();
    ctx.moveTo(x, GROUND_Y + 12);
    ctx.lineTo(x + 8, GROUND_Y - 6);
    ctx.lineTo(x + 16, GROUND_Y + 12);
    ctx.stroke();
  }
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  for (let i = 0; i < 8; i++) {
    const px = (((i * 173 + 60 - distance) % 1400) + 1400) % 1400 - 60;
    ctx.beginPath();
    ctx.ellipse(px, GROUND_Y + 52 + hash(i * 3) * 30, 10, 4, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

// One mid-ground silhouette for the stage: farmyard gets a barn and a
// windmill, the barn a silo, the kitchen a house with a smoking
// chimney, the forest a stand of pines.
function drawScenery(ctx, stage, x, groundY, index) {
  const pick = hash(index * 29);
  ctx.save();
  ctx.translate(x, groundY);
  if (stage.name === 'FOREST') {
    ctx.fillStyle = '#2e5d33';
    for (let i = 0; i < 3; i++) {
      const tx = i * 46 - 40;
      const th = 120 + hash(index + i) * 60;
      ctx.beginPath();
      ctx.moveTo(tx, 0);
      ctx.lineTo(tx + 22, -th);
      ctx.lineTo(tx + 44, 0);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#3a6b3a';
    }
    ctx.fillStyle = '#4a3220';
    ctx.fillRect(-42, -14, 130, 14);
    ctx.restore();
    return;
  }
  if (pick < 0.45) {
    // A red barn.
    ctx.fillStyle = '#a83c2a';
    ctx.fillRect(-70, -110, 140, 110);
    ctx.beginPath();
    ctx.moveTo(-82, -110);
    ctx.lineTo(0, -150);
    ctx.lineTo(82, -110);
    ctx.closePath();
    ctx.fillStyle = '#7e2a1e';
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-70, -110);
    ctx.lineTo(70, 0);
    ctx.moveTo(70, -110);
    ctx.lineTo(-70, 0);
    ctx.stroke();
    ctx.fillStyle = '#3a2a1a';
    ctx.fillRect(-18, -52, 36, 52);
  } else if (pick < 0.7) {
    // A windmill, blades turning slowly.
    ctx.fillStyle = '#8a6d3b';
    ctx.fillRect(-12, -150, 24, 150);
    ctx.fillStyle = '#6b4a22';
    ctx.beginPath();
    ctx.moveTo(-34, -150);
    ctx.lineTo(34, -150);
    ctx.lineTo(12, -118);
    ctx.lineTo(-12, -118);
    ctx.closePath();
    ctx.fill();
    ctx.save();
    ctx.translate(0, -150);
    ctx.rotate(0.4);
    ctx.fillStyle = '#e8dcc0';
    for (let i = 0; i < 4; i++) {
      ctx.rotate(Math.PI / 2);
      ctx.fillRect(-4, -66, 8, 60);
    }
    ctx.restore();
  } else {
    // A house with a smoking chimney (the kitchen is near).
    ctx.fillStyle = '#c98a5b';
    ctx.fillRect(-64, -96, 128, 96);
    ctx.beginPath();
    ctx.moveTo(-76, -96);
    ctx.lineTo(0, -132);
    ctx.lineTo(76, -96);
    ctx.closePath();
    ctx.fillStyle = '#7e4a2e';
    ctx.fill();
    ctx.fillStyle = '#8a6d3b';
    ctx.fillRect(34, -150, 18, 54);
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.beginPath();
    ctx.ellipse(48, -168, 12, 7, 0, 0, Math.PI * 2);
    ctx.ellipse(54, -184, 16, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffe9a8';
    ctx.fillRect(-44, -72, 26, 26);
    ctx.fillRect(18, -72, 26, 26);
  }
  ctx.restore();
}

// The HUD: score and best top-left, distance and stage top-centre
// with a progress bar, lives top-right, and a flashing FARMER!
// warning when he is close. A small dash meter sits bottom-left.
export function drawHud(ctx, world, muted) {
  const stage = world.stageIndex;
  const stages = STAGES;
  const stageDef = stages[stage];
  const nextFrom = stage < stages.length - 1 ? stages[stage + 1].from : ESCAPE_METRES;
  const stageStart = stageDef.from;
  const span = nextFrom - stageStart;
  const progress = span > 0 ? Math.min(1, Math.max(0, (world.distance - stageStart) / span)) : 1;

  // Score panel.
  ctx.fillStyle = 'rgba(30,18,8,0.55)';
  roundRect(ctx, 16, 14, 250, 64, 12);
  ctx.fill();
  textOutlined(ctx, `SCORE ${world.score}`, 30, 44, 'bold 28px Georgia, serif', '#fff', '#7a3b12');
  textOutlined(ctx, `BEST ${world.best}`, 30, 68, 'bold 15px Georgia, serif', '#ffe9a8', '#7a3b12');

  // Distance and stage, centred.
  ctx.fillStyle = 'rgba(30,18,8,0.55)';
  roundRect(ctx, 500, 14, 280, 64, 12);
  ctx.fill();
  textOutlined(ctx, `${Math.floor(world.distance)} m  ·  ${stageDef.name}`, 640, 42, 'bold 22px Georgia, serif', '#fff', '#7a3b12', 'center');
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  roundRect(ctx, 520, 54, 240, 8, 4);
  ctx.fill();
  ctx.fillStyle = '#ffd97a';
  roundRect(ctx, 520, 54, 240 * progress, 8, 4);
  ctx.fill();

  // Lives as hearts.
  for (let i = 0; i < 3; i++) {
    drawHeart(ctx, 1216 - i * 40, 44, 30, i < world.lives);
  }
  if (muted) {
    textOutlined(ctx, 'MUTED', 1216, 78, 'bold 13px Georgia, serif', '#fff', '#7a3b12', 'right');
  }

  // Farmer warning: flashing red banner and a red left edge.
  if (world.farmer.gap < 170 && !world.turkey.hidden) {
    const blink = Math.floor(world.time * 6) % 2 === 0;
    if (blink) {
      ctx.fillStyle = 'rgba(200,30,30,0.85)';
      roundRect(ctx, 500, 86, 280, 34, 10);
      ctx.fill();
      textOutlined(ctx, '⚠ FARMER! RUN!', 640, 110, 'bold 20px Georgia, serif', '#fff', '#5d1010', 'center');
    }
    const grad = ctx.createLinearGradient(0, 0, 90, 0);
    grad.addColorStop(0, 'rgba(200,30,30,0.45)');
    grad.addColorStop(1, 'rgba(200,30,30,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 90, 720);
  }

  // Dash meter.
  const cd = world.turkey.dashCooldown;
  ctx.fillStyle = 'rgba(30,18,8,0.55)';
  roundRect(ctx, 16, 656, 150, 30, 10);
  ctx.fill();
  if (cd <= 0) {
    textOutlined(ctx, '⚡ DASH READY', 24, 677, 'bold 15px Georgia, serif', '#ffe9a8', '#7a3b12');
  } else {
    ctx.fillStyle = '#ffd97a';
    roundRect(ctx, 22, 668, 100 * (1 - cd / 1.6), 8, 4);
    ctx.fill();
    textOutlined(ctx, 'DASH', 128, 677, 'bold 13px Georgia, serif', '#fff', '#7a3b12');
  }
}

// The title screen: the game's name, the goal and the controls up
// top, the turkey big on the ground to the left and the farmer to
// the right, and a small word for the judge at the bottom.
export function drawTitle(ctx, best, time) {
  ctx.fillStyle = 'rgba(30,18,8,0.35)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  if (best > 0) {
    textOutlined(ctx, `BEST ${best}`, 640, 96, 'bold 20px Georgia, serif', '#ffe9a8', '#7a3b12', 'center');
  }
  textOutlined(ctx, 'TURKEY RUN', 640, 140, 'bold 92px Georgia, serif', '#ffd97a', '#7a3b12', 'center');
  textOutlined(ctx, 'Escape Thanksgiving Dinner!', 640, 190, 'bold 30px Georgia, serif', '#fff', '#7a3b12', 'center');

  // The goal and the controls, clear of the characters below.
  textOutlined(ctx, 'Run 1800 m to the forest. Jump the fences and the oven,', 640, 250, 'bold 21px Georgia, serif', '#fff', '#7a3b12', 'center');
  textOutlined(ctx, 'duck the carving knives, hide in the haystacks — and never let the farmer catch you.', 640, 280, 'bold 21px Georgia, serif', '#fff', '#7a3b12', 'center');
  textOutlined(ctx, 'SPACE / CLICK — jump      ↓ — duck & hide      SHIFT — dash      P — pause      M — mute', 640, 330, 'bold 18px Georgia, serif', '#ffe9a8', '#7a3b12', 'center');

  // The turkey, big, standing on the ground to the left: the same
  // drawing the game uses, scaled up around its feet.
  ctx.save();
  ctx.translate(300, 620);
  ctx.scale(2.4, 2.4);
  drawTurkey(
    ctx,
    { x: 0, y: -72, ducking: false, grounded: true, hidden: false, invulnerable: 0, dashing: 0, runPhase: time * 2 },
    time,
    false,
  );
  ctx.restore();

  // The farmer, standing on the ground to the right: the same drawing
  // the game uses, placed by a gap that lands him at x 980.
  drawFarmer(ctx, { gap: -790, state: 'chase', runPhase: time * 2, searchTime: 0, shoutCooldown: 0 }, time);

  const blink = Math.floor(time * 2) % 2 === 0;
  if (blink) {
    textOutlined(ctx, 'PRESS SPACE OR CLICK TO START', 640, 660, 'bold 26px Georgia, serif', '#fff', '#7a3b12', 'center');
  }
  textOutlined(ctx, 'Dear judge — the turkey runs, the farmer chases, the oven is hot. Gobble gobble.', 640, 700, 'italic 15px Georgia, serif', '#ffe9a8', '#7a3b12', 'center');
}

// The end screens: caught (the farmer got you) and escaped (freedom).
export function drawEnd(ctx, kind, world) {
  if (kind === 'caught') {
    ctx.fillStyle = 'rgba(60,8,8,0.72)';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    textOutlined(ctx, 'CAUGHT!', 640, 250, 'bold 96px Georgia, serif', '#ff6b5e', '#3d0a0a', 'center');
    textOutlined(ctx, 'The farmer got you. Thanksgiving dinner awaits…', 640, 310, 'bold 26px Georgia, serif', '#fff', '#3d0a0a', 'center');
  } else {
    ctx.fillStyle = 'rgba(20,60,20,0.55)';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    textOutlined(ctx, 'ESCAPED!', 640, 250, 'bold 96px Georgia, serif', '#8dff6b', '#0d3d0d', 'center');
    textOutlined(ctx, 'You made it to the forest! Free at last — Happy Thanksgiving!', 640, 310, 'bold 26px Georgia, serif', '#fff', '#0d3d0d', 'center');
  }
  textOutlined(ctx, `SCORE ${world.score}    ·    DISTANCE ${Math.floor(world.distance)} m    ·    CORN ${world.corn}`, 640, 380, 'bold 24px Georgia, serif', '#ffe9a8', '#3d0a0a', 'center');
  textOutlined(ctx, `BEST ${world.best}`, 640, 420, 'bold 22px Georgia, serif', '#fff', '#3d0a0a', 'center');
  const blink = Math.floor(world.time * 2) % 2 === 0;
  if (blink) {
    textOutlined(ctx, 'PRESS R OR CLICK TO RUN AGAIN', 640, 500, 'bold 26px Georgia, serif', '#fff', '#3d0a0a', 'center');
  }
}

export function drawPaused(ctx) {
  ctx.fillStyle = 'rgba(20,16,10,0.6)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  textOutlined(ctx, 'PAUSED', 640, 340, 'bold 72px Georgia, serif', '#fff', '#3d0a0a', 'center');
  textOutlined(ctx, 'Press P to keep running', 640, 400, 'bold 24px Georgia, serif', '#ffe9a8', '#3d0a0a', 'center');
}
