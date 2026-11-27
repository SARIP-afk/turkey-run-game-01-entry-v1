// Everything the turkey meets on the run: fences to jump, hay bales
// and pumpkins to clear, the oven with its flames, carving knives
// that fly at head height (duck!), corn to eat, and haystacks to hide
// in. The spawner paces waves by stage so the farmyard is gentle and
// the kitchen is not.
import { GROUND_Y } from './config.js';

// Size of each kind, in pixels. Ground kinds sit on GROUND_Y.
const SHAPES = {
  fence: { w: 46, h: 62 },
  hay: { w: 64, h: 56 },
  pumpkin: { w: 52, h: 46 },
  oven: { w: 150, h: 118 },
  knife: { w: 72, h: 18 },
  corn: { w: 34, h: 34 },
  haystack: { w: 92, h: 112 },
};

export function createSpawner(random) {
  return {
    random,
    timer: 1.2, // seconds until the first wave
    lastKind: '',
  };
}

// One wave: one hazard (or a corn arc), placed just off the right
// edge. Returns the new obstacles, if any.
export function spawnWave(spawner, stage, distance) {
  const r = spawner.random;
  spawner.timer -= 0; // the timer is advanced by updateSpawner
  const kind = r.pick(stage.kinds);
  const x = 1280 + 40;
  const out = [];

  if (kind === 'corn') {
    // An arc of three cobs, high enough to need a jump.
    const baseY = GROUND_Y - 150;
    for (let i = 0; i < 3; i++) {
      out.push({
        kind: 'corn',
        x: x + i * 56,
        y: baseY - Math.sin((i / 2) * Math.PI) * 40,
        w: SHAPES.corn.w,
        h: SHAPES.corn.h,
        bob: r.next() * Math.PI * 2,
      });
    }
    return out;
  }

  if (kind === 'knife') {
    out.push({
      kind: 'knife',
      x,
      y: GROUND_Y - 68, // head height: duck under it
      w: SHAPES.knife.w,
      h: SHAPES.knife.h,
      extra: 170, // knives fly faster than the world scrolls
    });
    return out;
  }

  const shape = SHAPES[kind];
  out.push({
    kind,
    x,
    y: GROUND_Y - shape.h,
    w: shape.w,
    h: shape.h,
    rot: 0,
  });
  return out;
}

// Advance the spawn timer; returns fresh obstacles when a wave is due.
export function updateSpawner(spawner, stage, dt, distance) {
  spawner.timer -= dt;
  if (spawner.timer > 0) return [];
  const [lo, hi] = stage.spawnEvery;
  spawner.timer = lo + spawner.random.next() * (hi - lo);
  // Never stack two ovens: the kitchen stays fair.
  let wave = spawnWave(spawner, stage, distance);
  if (wave[0] && wave[0].kind === 'oven' && spawner.lastKind === 'oven') {
    wave = spawnWave(spawner, stage, distance);
  }
  if (wave[0]) spawner.lastKind = wave[0].kind;
  return wave;
}

export function updateObstacles(obstacles, dt, speed) {
  for (const ob of obstacles) {
    ob.x -= (speed + (ob.extra ?? 0)) * dt;
    if (ob.kind === 'pumpkin') ob.rot += dt * 6;
    if (ob.kind === 'corn') ob.bob += dt * 3;
  }
  return obstacles.filter((ob) => ob.x + ob.w > -80);
}

// The box the world tests against the turkey. Corn and haystacks are
// not hazards (corn is collected, a haystack is a hiding place).
export function hazardHitbox(ob) {
  if (ob.kind === 'corn' || ob.kind === 'haystack') return null;
  if (ob.kind === 'oven') {
    // The flames count: the whole oven box is hot.
    return { x: ob.x + 6, y: ob.y, w: ob.w - 12, h: ob.h };
  }
  if (ob.kind === 'knife') {
    return { x: ob.x + 8, y: ob.y, w: ob.w - 16, h: ob.h };
  }
  return { x: ob.x + 6, y: ob.y, w: ob.w - 12, h: ob.h };
}

export function boxesOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

// Draw one obstacle. All art is canvas paths in the autumn palette.
export function drawObstacle(ctx, ob, time) {
  const { x, y, w, h } = ob;
  ctx.save();
  if (ob.kind === 'fence') {
    ctx.fillStyle = '#7a5230';
    ctx.fillRect(x, y + 8, w, 8);
    ctx.fillRect(x, y + 32, w, 8);
    ctx.fillStyle = '#8a6238';
    ctx.fillRect(x + 4, y, 8, h);
    ctx.fillRect(x + w - 12, y, 8, h);
  } else if (ob.kind === 'hay') {
    ctx.beginPath();
    ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#d9a441';
    ctx.fill();
    ctx.strokeStyle = '#b8862e';
    ctx.lineWidth = 2;
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.moveTo(x + w / 2 + i * 10, y + 8);
      ctx.lineTo(x + w / 2 + i * 10, y + h - 8);
      ctx.stroke();
    }
  } else if (ob.kind === 'pumpkin') {
    ctx.save();
    ctx.translate(x + w / 2, y + h / 2);
    ctx.rotate(ob.rot);
    ctx.beginPath();
    ctx.ellipse(0, 0, w / 2, h / 2, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#e07b2a';
    ctx.fill();
    ctx.strokeStyle = '#b85c14';
    ctx.lineWidth = 2;
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.ellipse(i * 9, 0, 7, h / 2 - 2, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.rect(-3, -h / 2 - 6, 6, 10);
    ctx.fillStyle = '#4f7d33';
    ctx.fill();
    ctx.restore();
  } else if (ob.kind === 'oven') {
    // The oven: a big dark box, a glowing door, flames on top.
    ctx.fillStyle = '#3a3a3f';
    ctx.fillRect(x, y + 18, w, h - 18);
    ctx.fillStyle = '#222226';
    ctx.fillRect(x, y + 18, w, 10);
    ctx.beginPath();
    ctx.roundRect(x + 18, y + 42, w - 36, h - 60, 8);
    ctx.fillStyle = '#ff7b24';
    ctx.fill();
    ctx.beginPath();
    ctx.roundRect(x + 28, y + 52, w - 56, h - 80, 6);
    ctx.fillStyle = '#ffb347';
    ctx.fill();
    // Flames licking out of the top.
    const flick = Math.sin(time * 9 + x) * 4;
    for (let i = 0; i < 4; i++) {
      const fx = x + 22 + i * 34;
      const fh = 26 + Math.sin(time * 11 + i * 2) * 7 + flick;
      ctx.beginPath();
      ctx.moveTo(fx, y + 20);
      ctx.quadraticCurveTo(fx + 8, y - fh, fx + 16, y + 20);
      ctx.quadraticCurveTo(fx + 8, y - fh * 0.4, fx, y + 20);
      ctx.fillStyle = i % 2 ? '#ff9d00' : '#ff5e00';
      ctx.fill();
    }
    // A little "HOT" sign so the danger reads at a glance.
    ctx.font = 'bold 15px Georgia, serif';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.fillText('HOT!', x + w / 2, y + 34);
    ctx.textAlign = 'left';
  } else if (ob.kind === 'knife') {
    // A carving knife, flying point-first, with motion lines.
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(x + w + 8 + i * 12, y + 4 + i * 5);
      ctx.lineTo(x + w + 34 + i * 12, y + 4 + i * 5);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(x, y + h / 2);
    ctx.lineTo(x + 46, y);
    ctx.lineTo(x + 46, y + h);
    ctx.closePath();
    ctx.fillStyle = '#dfe6ea';
    ctx.fill();
    ctx.strokeStyle = '#9aa5ab';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = '#5d3a1a';
    ctx.fillRect(x + 46, y + 2, 22, h - 4);
  } else if (ob.kind === 'corn') {
    const bobY = Math.sin(ob.bob) * 4;
    ctx.save();
    ctx.translate(x + w / 2, y + h / 2 + bobY);
    ctx.beginPath();
    ctx.ellipse(0, 0, 11, 15, 0.35, 0, Math.PI * 2);
    ctx.fillStyle = '#f7c948';
    ctx.fill();
    ctx.strokeStyle = '#d9a441';
    ctx.lineWidth = 1.5;
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.moveTo(i * 5 - 4, -12);
      ctx.lineTo(i * 5 + 4, 12);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.ellipse(-8, 8, 6, 10, -0.6, 0, Math.PI * 2);
    ctx.ellipse(8, 8, 6, 10, 0.6, 0, Math.PI * 2);
    ctx.fillStyle = '#5f8f36';
    ctx.fill();
    ctx.restore();
  } else if (ob.kind === 'haystack') {
    // A tall golden haystack: a hiding place, not a hazard.
    ctx.beginPath();
    ctx.moveTo(x + w / 2, y);
    ctx.quadraticCurveTo(x + w, y + h * 0.55, x + w - 8, y + h);
    ctx.lineTo(x + 8, y + h);
    ctx.quadraticCurveTo(x, y + h * 0.55, x + w / 2, y);
    ctx.fillStyle = '#e8b64c';
    ctx.fill();
    ctx.strokeStyle = '#c08a2d';
    ctx.lineWidth = 2;
    for (let i = 0; i < 5; i++) {
      const yy = y + 18 + i * 18;
      ctx.beginPath();
      ctx.moveTo(x + 14 + i * 4, yy);
      ctx.lineTo(x + w - 14 - i * 4, yy);
      ctx.stroke();
    }
    // A little arrow hinting "hide here" when the turkey is near.
    ctx.font = 'bold 13px Georgia, serif';
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#7a3b12';
    ctx.lineWidth = 4;
    ctx.textAlign = 'center';
    ctx.strokeText('HIDE ↓', x + w / 2, y - 8);
    ctx.fillText('HIDE ↓', x + w / 2, y - 8);
    ctx.textAlign = 'left';
  }
  ctx.restore();
}
