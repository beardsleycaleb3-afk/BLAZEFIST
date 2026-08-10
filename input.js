// src/input.js
// ════════════════════════════════════════════════════════════
//  tapout — Touch-only input subsystem
//
//  • No mouse events. No keyboard events. No Apple-specific paths.
//  • D-pad is a single 120×120 touch zone — direction computed
//    from touch position relative to center.  Visual cells get
//    .active class for feedback but carry no individual listeners.
//  • Melee / Run are separate button elements (touchstart/end).
//  • InputState is a live object — read it each update tick.
//  • consumeJustPressed() clears one-shot flags after Fighter reads them.
//  • destroyInput() tears down all listeners for hot-reload / cleanup.
// ════════════════════════════════════════════════════════════

// ── Live input state (exported, mutated internally) ──────────
export const InputState = {
  up:    false,
  down:  false,
  left:  false,
  right: false,
  melee: false,
  run:   false,
  meleeJP: false,  // just-pressed — consumed by Fighter.update()
  runJP:   false,  // just-pressed — consumed if needed
};

// ── Module-private refs ───────────────────────────────────────
let _dpad   = null;
let _melee  = null;
let _run    = null;

/** @type {{ up: Element|null, down: Element|null, left: Element|null, right: Element|null }} */
let _cells  = { up: null, down: null, left: null, right: null };

// Dead-zone: fraction of half-width where input is ignored
const DEAD_RATIO = 0.20;

// ── D-pad direction resolver ──────────────────────────────────
/**
 * Returns 'up'|'down'|'left'|'right'|null for a touch within rect.
 * @param {Touch} touch
 * @param {DOMRect} rect
 * @returns {string|null}
 */
function _resolve(touch, rect) {
  const cx = rect.left + rect.width  * 0.5;
  const cy = rect.top  + rect.height * 0.5;
  const dx = touch.clientX - cx;
  const dy = touch.clientY - cy;
  const dead = Math.min(rect.width, rect.height) * 0.5 * DEAD_RATIO;
  if (Math.abs(dx) < dead && Math.abs(dy) < dead) return null;
  return Math.abs(dx) >= Math.abs(dy)
    ? (dx > 0 ? 'right' : 'left')
    : (dy > 0 ? 'down'  : 'up');
}

// ── D-pad handlers ────────────────────────────────────────────
function _clearDpad() {
  InputState.up = InputState.down = InputState.left = InputState.right = false;
  _cells.up?.classList.remove('active');
  _cells.down?.classList.remove('active');
  _cells.left?.classList.remove('active');
  _cells.right?.classList.remove('active');
}

function _onDpadContact(e) {
  e.preventDefault();
  _clearDpad();
  if (!_dpad) return;
  const rect = _dpad.getBoundingClientRect();
  for (const t of e.touches) {
    // Only handle touches that land inside the dpad rect
    if (t.clientX < rect.left  || t.clientX > rect.right)  continue;
    if (t.clientY < rect.top   || t.clientY > rect.bottom) continue;
    const dir = _resolve(t, rect);
    if (dir) {
      InputState[dir] = true;
      _cells[dir]?.classList.add('active');
    }
  }
}

function _onDpadEnd(e) {
  e.preventDefault();
  _clearDpad();
}

// ── Action button handlers ────────────────────────────────────
function _onMeleeStart(e) {
  e.preventDefault();
  InputState.melee   = true;
  InputState.meleeJP = true;
  _melee?.classList.add('active');
}
function _onMeleeEnd(e) {
  e.preventDefault();
  InputState.melee = false;
  _melee?.classList.remove('active');
}

function _onRunStart(e) {
  e.preventDefault();
  InputState.run   = true;
  InputState.runJP = true;
  _run?.classList.add('active');
}
function _onRunEnd(e) {
  e.preventDefault();
  InputState.run = false;
  _run?.classList.remove('active');
}

// ── Public API ────────────────────────────────────────────────

/**
 * Bind input to DOM elements. Must be called after DOMContentLoaded.
 * @param {{ dpad: HTMLElement, melee: HTMLElement, run: HTMLElement }} els
 */
export function initInput({ dpad, melee, run }) {
  _dpad  = dpad;
  _melee = melee;
  _run   = run;

  // Cache directional cell elements for visual feedback
  _cells.up    = dpad.querySelector('.dp-n');
  _cells.down  = dpad.querySelector('.dp-s');
  _cells.left  = dpad.querySelector('.dp-w');
  _cells.right = dpad.querySelector('.dp-e');

  // D-pad — single zone, no passive
  dpad.addEventListener('touchstart',  _onDpadContact, { passive: false });
  dpad.addEventListener('touchmove',   _onDpadContact, { passive: false });
  dpad.addEventListener('touchend',    _onDpadEnd,     { passive: false });
  dpad.addEventListener('touchcancel', _onDpadEnd,     { passive: false });

  // Melee
  melee.addEventListener('touchstart',  _onMeleeStart, { passive: false });
  melee.addEventListener('touchend',    _onMeleeEnd,   { passive: false });
  melee.addEventListener('touchcancel', _onMeleeEnd,   { passive: false });

  // Run
  run.addEventListener('touchstart',  _onRunStart, { passive: false });
  run.addEventListener('touchend',    _onRunEnd,   { passive: false });
  run.addEventListener('touchcancel', _onRunEnd,   { passive: false });
}

/**
 * Consume one-shot just-pressed flags.
 * Must be called once per update tick, AFTER all systems have read InputState.
 */
export function consumeJustPressed() {
  InputState.meleeJP = false;
  InputState.runJP   = false;
}

/**
 * Remove all event listeners. Safe to call multiple times.
 */
export function destroyInput() {
  if (_dpad) {
    _dpad.removeEventListener('touchstart',  _onDpadContact);
    _dpad.removeEventListener('touchmove',   _onDpadContact);
    _dpad.removeEventListener('touchend',    _onDpadEnd);
    _dpad.removeEventListener('touchcancel', _onDpadEnd);
  }
  if (_melee) {
    _melee.removeEventListener('touchstart',  _onMeleeStart);
    _melee.removeEventListener('touchend',    _onMeleeEnd);
    _melee.removeEventListener('touchcancel', _onMeleeEnd);
  }
  if (_run) {
    _run.removeEventListener('touchstart',  _onRunStart);
    _run.removeEventListener('touchend',    _onRunEnd);
    _run.removeEventListener('touchcancel', _onRunEnd);
  }
  _dpad = _melee = _run = null;
  _cells = { up: null, down: null, left: null, right: null };
}
