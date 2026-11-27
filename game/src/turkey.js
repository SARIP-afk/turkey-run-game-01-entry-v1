// The turkey: the player. It runs on the spot while the world scrolls
// past, jumps with gravity, ducks low under flying knives, dashes in a
// burst, and hides inside a haystack when the farmer is close. Drawn
// entirely from canvas paths: a brown body, a fan of tail feathers, a
// red wattle and two legs that actually run.
import {
  GRAVITY,
  GROUND_Y,
  JUMP_VELOCITY,
  TURKEY_DUCK_H,
  TURKEY_H,
  TURKEY_W,
  TURKEY_X,
} from './config.js';

export function createTurkey() {
  return {
    x: TURKEY_X,
    y: GROUND_Y - TURKEY_H, // top edge of the body
    vy: 0,
    grounded: true,
    ducking: false,
    hidden: false,
    hiddenHay: null, // the haystack it is hiding inside, if any
    dashing: 0, // seconds of dash left
    dashCooldown: 0,
    invulnerable: 0, // seconds of flashing after a hit
    runPhase: 0, // drives the legs and the bob
    w: TURKEY_W,
    h: TURKEY_H,
  };
}

// The hitbox the world tests obstacles against. Ducking halves the
// height; hiding removes the turkey from the world entirely.
export function turkeyHitbox(t) {
  if (t.hidden) return null;
  const h = t.ducking && t.grounded ? TURKEY_DUCK_H : TURKEY_H;
  return { x: t.x + 6, y: t.y + (TURKEY_H - h), w: TURKEY_W - 12, h };
}

export function turkeyUpdate(t, input, dt, audio) {
  if (t.hidden) {
    // Hiding: jump climbs out of the haystack, anything else waits.
    if (input.justPressed('jump')) {
      t.hidden = false;
      t.hiddenHay = null;
      t.vy = -JUMP_VELOCITY;
      t.grounded = false;
      audio.gobble();
    }
    return;
  }

  if (t.invulnerable > 0) t.invulnerable -= dt;
  if (t.dashCooldown > 0) t.dashCooldown -= dt;
  if (t.dashing > 0) t.dashing -= dt;

  t.ducking = input.isHeld('duck') && t.grounded;

  if (input.justPressed('jump') && t.grounded && !t.ducking) {
    t.vy = -JUMP_VELOCITY;
    t.grounded = false;
    audio.gobble();
  }
  if (input.justPressed('dash') && t.dashCooldown <= 0 && t.grounded) {
    t.dashing = 0.55;
    t.dashCooldown = 1.6;
    audio.dash();
  }

  if (!t.grounded) {
    t.vy += GRAVITY * dt;
    t.y += t.vy * dt;
    if (t.y >= GROUND_Y - TURKEY_H) {
      t.y = GROUND_Y - TURKEY_H;
      t.vy = 0;
      t.grounded = true;
      audio.cluck();
    }
  }

  t.runPhase += dt * (t.dashing > 0 ? 22 : 13);
}

export function turkeyHide(t, haystack) {
  t.hidden = true;
  t.hiddenHay = haystack;
  t.vy = 0;
  t.grounded = true;
}

export function turkeyUnhide(t) {
  t.hidden = false;
  t.hiddenHay = null;
}

// Draw the turkey at its place. `scared` (farmer close) widens the
// eyes; `flash` (invulnerable) blinks the body on and off.
export function drawTurkey(ctx, t, time, scared) {
  if (t.hidden) return;
  const flash = t.invulnerable > 0 && Math.floor(time * 12) % 2 === 0;
  if (flash) return;

  const x = t.x;
  const y = t.y;
  const duck = t.ducking && t.grounded;
  const squash = duck ? 0.62 : 1;
  const legSwing = Math.sin(t.runPhase) * (t.grounded ? 10 : 4);
  const bob = t.grounded ? Math.abs(Math.sin(t.runPhase)) * 3 : 0;

  ctx.save();
  ctx.translate(x, y + TURKEY_H - bob);
  ctx.scale(1, squash);

  // Tail fan: five feathers fanning out behind.
  for (let i = -2; i <= 2; i++) {
    const a = (-90 + i * 22) * (Math.PI / 180);
    const fx = Math.cos(a) * 26 - 14;
    const fy = Math.sin(a) * 26 - 26;
    ctx.beginPath();
    ctx.ellipse(fx, fy, 7, 17, a + Math.PI / 2, 0, Math.PI * 2);
    ctx.fillStyle = i % 2 === 0 ? '#8a5a2b' : '#a06a35';
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(fx, fy - 6, 3.5, 8, a + Math.PI / 2, 0, Math.PI * 2);
    ctx.fillStyle = '#d9a05b';
    ctx.fill();
  }

  // Legs: two thin legs mid-stride.
  ctx.strokeStyle = '#e8a33d';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(28, -6);
  ctx.lineTo(28 + legSwing, 0);
  ctx.moveTo(40, -6);
  ctx.lineTo(40 - legSwing, 0);
  ctx.stroke();

  // Body: a warm brown oval, chest forward.
  ctx.beginPath();
  ctx.ellipse(34, -34, 30, 26, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#7a4a22';
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(34, -30, 20, 16, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#96602f';
  ctx.fill();

  // Wing, tucked and flapping a little.
  const flap = Math.sin(t.runPhase * 0.5) * 4;
  ctx.beginPath();
  ctx.ellipse(28, -32 + flap, 16, 10, -0.4, 0, Math.PI * 2);
  ctx.fillStyle = '#5d3a1a';
  ctx.fill();

  // Neck and head.
  ctx.beginPath();
  ctx.ellipse(56, -58, 10, 16, 0.25, 0, Math.PI * 2);
  ctx.fillStyle = '#8a5a2b';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(60, -72, 11, 0, Math.PI * 2);
  ctx.fillStyle = '#a06a35';
  ctx.fill();

  // Beak and red wattle.
  ctx.beginPath();
  ctx.moveTo(69, -74);
  ctx.lineTo(80, -70);
  ctx.lineTo(69, -66);
  ctx.closePath();
  ctx.fillStyle = '#e8912d';
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(62, -62, 4, 7, 0.2, 0, Math.PI * 2);
  ctx.fillStyle = '#c0392b';
  ctx.fill();

  // Eye: round and calm, wide and white-rimmed when scared.
  ctx.beginPath();
  ctx.arc(62, -75, scared ? 5 : 3.5, 0, Math.PI * 2);
  ctx.fillStyle = scared ? '#ffffff' : '#1d130b';
  ctx.fill();
  if (scared) {
    ctx.beginPath();
    ctx.arc(63, -75, 2.2, 0, Math.PI * 2);
    ctx.fillStyle = '#1d130b';
    ctx.fill();
  }

  ctx.restore();
}
