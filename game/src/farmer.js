// The farmer: the threat that never stops. He runs in from the left,
// closing the gap whenever the turkey stumbles and falling back when
// it runs clean. Lose the turkey in a haystack and he stops, searches
// the spot with a "?" over his head, then gives up and the gap opens
// again. Catch the turkey and he grabs it: game over.
import { GROUND_Y, TURKEY_X } from './config.js';

export function createFarmer() {
  return {
    gap: 340, // pixels between the farmer and the turkey
    state: 'chase', // 'chase' | 'search' | 'grab'
    searchTime: 0,
    runPhase: 0,
    shoutCooldown: 0,
  };
}

// The farmer's screen x, from the gap. Off-screen left while the gap
// is wide; right on the turkey's tail when it is narrow.
export function farmerX(f) {
  return TURKEY_X - f.gap - 70;
}

export function farmerUpdate(f, dt, turkeyHidden, audio) {
  f.runPhase += dt * 14;
  if (f.shoutCooldown > 0) f.shoutCooldown -= dt;

  if (f.state === 'search') {
    f.searchTime -= dt;
    if (f.searchTime <= 0) f.state = 'chase';
    return;
  }
  if (f.state === 'grab') return;

  // He shouts when he gets close enough to smell the turkey.
  if (f.gap < 170 && f.shoutCooldown <= 0 && !turkeyHidden) {
    f.shoutCooldown = 2.2;
    audio.farmerShout();
  }
}

// The turkey vanished into a haystack: the farmer stops at the spot
// and searches it, then gives up.
export function farmerLoseTrail(f) {
  f.state = 'search';
  f.searchTime = 1.6;
}

// He has the turkey: the grab.
export function farmerGrab(f) {
  f.state = 'grab';
}

// Draw the farmer: big, in blue overalls and a straw hat, pitchfork
// in hand, legs pumping. `searching` puts a "?" over his head.
export function drawFarmer(ctx, f, time) {
  const x = farmerX(f);
  if (x < -140) return; // still off-screen: nothing to draw
  const y = GROUND_Y;
  const legSwing = Math.sin(f.runPhase) * 12;
  const bob = Math.abs(Math.sin(f.runPhase)) * 3;

  ctx.save();
  ctx.translate(x, y - bob);

  // Legs: blue overalls, mid-stride.
  ctx.strokeStyle = '#2c4a7c';
  ctx.lineWidth = 9;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(30, -52);
  ctx.lineTo(30 + legSwing, 0);
  ctx.moveTo(48, -52);
  ctx.lineTo(48 - legSwing, 0);
  ctx.stroke();

  // Body: red shirt under blue overalls.
  ctx.beginPath();
  ctx.ellipse(40, -78, 26, 30, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#b03a2e';
  ctx.fill();
  ctx.beginPath();
  ctx.rect(22, -96, 36, 34);
  ctx.fillStyle = '#2c4a7c';
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(26, -96);
  ctx.lineTo(26, -108);
  ctx.moveTo(54, -96);
  ctx.lineTo(54, -108);
  ctx.strokeStyle = '#2c4a7c';
  ctx.lineWidth = 5;
  ctx.stroke();

  // Arms: one pumping, one holding the pitchfork.
  ctx.strokeStyle = '#e8b88a';
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(20, -88);
  ctx.lineTo(6, -66 + legSwing * 0.4);
  ctx.moveTo(60, -88);
  ctx.lineTo(74, -70);
  ctx.stroke();

  // Pitchfork, held high.
  ctx.strokeStyle = '#8a6d3b';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(74, -70);
  ctx.lineTo(92, -128);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(86, -128);
  ctx.lineTo(80, -142);
  ctx.moveTo(92, -128);
  ctx.lineTo(92, -144);
  ctx.moveTo(98, -128);
  ctx.lineTo(104, -142);
  ctx.stroke();

  // Head: skin, big mustache, angry brows, straw hat.
  ctx.beginPath();
  ctx.arc(42, -118, 15, 0, Math.PI * 2);
  ctx.fillStyle = '#e8b88a';
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(42, -110, 12, 4, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#6b4226';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(38, -122, 2.4, 0, Math.PI * 2);
  ctx.arc(48, -122, 2.4, 0, Math.PI * 2);
  ctx.fillStyle = '#1d130b';
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(32, -128);
  ctx.lineTo(42, -125);
  ctx.moveTo(52, -125);
  ctx.lineTo(44, -128);
  ctx.strokeStyle = '#1d130b';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Straw hat.
  ctx.beginPath();
  ctx.ellipse(42, -130, 24, 6, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#d9a441';
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(42, -134, 13, 8, 0, Math.PI, 0);
  ctx.fillStyle = '#e8b64c';
  ctx.fill();

  // Searching: a "?" floats over his head.
  if (f.state === 'search') {
    ctx.font = 'bold 34px Georgia, serif';
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#7a3b12';
    ctx.lineWidth = 5;
    ctx.strokeText('?', 34, -158);
    ctx.fillText('?', 34, -158);
  }

  ctx.restore();
}
