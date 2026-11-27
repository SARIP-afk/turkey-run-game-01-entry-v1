// Keyboard and mouse input for Turkey Run. The game reads actions, not
// raw keys: jump, duck, dash, pause, mute, restart, confirm. A press
// is an edge (justPressed) so holding Space does not bunny-hop, and a
// click or tap counts as a jump — and as "start" on the title screen
// and "again" on an end screen.
export const ACTION_JUMP = 'jump';
export const ACTION_DUCK = 'duck';
export const ACTION_DASH = 'dash';
export const ACTION_PAUSE = 'pause';
export const ACTION_MUTE = 'mute';
export const ACTION_RESTART = 'restart';
export const ACTION_CONFIRM = 'confirm';

const KEY_ACTIONS = {
  Space: ACTION_JUMP,
  ArrowUp: ACTION_JUMP,
  KeyW: ACTION_JUMP,
  ArrowDown: ACTION_DUCK,
  KeyS: ACTION_DUCK,
  ShiftLeft: ACTION_DASH,
  ShiftRight: ACTION_DASH,
  ArrowRight: ACTION_DASH,
  KeyD: ACTION_DASH,
  KeyP: ACTION_PAUSE,
  Escape: ACTION_PAUSE,
  KeyM: ACTION_MUTE,
  KeyR: ACTION_RESTART,
  Enter: ACTION_CONFIRM,
};

export function createInput(canvas) {
  const held = new Set();
  const pressed = new Set();
  let pointerPressed = false;
  let pointerDown = false;

  function onKeyDown(event) {
    const action = KEY_ACTIONS[event.code];
    if (!action) return;
    event.preventDefault();
    if (!event.repeat) {
      held.add(action);
      pressed.add(action);
    }
  }

  function onKeyUp(event) {
    const action = KEY_ACTIONS[event.code];
    if (action) held.delete(action);
  }

  function onPointerDown(event) {
    event.preventDefault();
    pointerDown = true;
    pointerPressed = true;
    pressed.add(ACTION_JUMP);
    held.add(ACTION_JUMP);
  }

  function onPointerUp() {
    pointerDown = false;
    held.delete(ACTION_JUMP);
  }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  canvas.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('pointerup', onPointerUp);
  canvas.addEventListener('contextmenu', (event) => event.preventDefault());

  return {
    // True while the action's key or button is held down.
    isHeld(action) {
      return held.has(action) || (action === ACTION_JUMP && pointerDown);
    },
    // True only on the frame the action was first pressed.
    justPressed(action) {
      return pressed.has(action) || (action === ACTION_JUMP && pointerPressed);
    },
    // Call once per frame, after the game has read the input.
    endFrame() {
      pressed.clear();
      pointerPressed = false;
    },
    detach() {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      canvas.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointerup', onPointerUp);
    },
  };
}
