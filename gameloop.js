// src/gameloop.js
// ════════════════════════════════════════════════════════════
//  tapout — Fixed-Timestep Game Loop
//
//  Pattern: semi-fixed timestep accumulator
//   • update(STEP_MS) is called N times per frame to catch up
//   • render() is called once per animation frame
//   • MAX_DEBT prevents spiral-of-death on slow devices
//
//  Public API:
//    new GameLoop(update, render)
//    loop.start()   — begin RAF loop
//    loop.stop()    — cancel RAF
//    loop.fps       — read current FPS (sampled every second)
// ════════════════════════════════════════════════════════════

const STEP_MS  = 1000 / 60;  // ~16.67 ms — one physics tick at 60fps
const MAX_DEBT = 100;         // ms cap — prevents > 6 ticks per frame

export class GameLoop {
  /**
   * @param {(dt: number) => void} update  fixed-step physics tick
   * @param {() => void}           render  called once per RAF
   */
  constructor(update, render) {
    this._update = update;
    this._render = render;

    this._raf    = null;
    this._last   = 0;
    this._debt   = 0;

    // FPS sampling
    this._fpsAccum  = 0;
    this._fpsFrames = 0;

    /** @type {number} Sampled FPS — update once per second */
    this.fps = 60;
  }

  // ── Internal RAF callback ─────────────────────────────

  _tick = (now) => {
    const elapsed = Math.min(now - this._last, MAX_DEBT);
    this._last  = now;
    this._debt += elapsed;

    // Fixed-step physics — may run 0, 1, or rarely 2+ steps
    while (this._debt >= STEP_MS) {
      this._update(STEP_MS);
      this._debt -= STEP_MS;
    }

    // FPS sample
    this._fpsAccum  += elapsed;
    this._fpsFrames++;
    if (this._fpsAccum >= 1000) {
      this.fps        = Math.round((this._fpsFrames * 1000) / this._fpsAccum);
      this._fpsAccum  = 0;
      this._fpsFrames = 0;
    }

    // Render once per frame (no interpolation yet — future: alpha = debt/STEP_MS)
    this._render();

    this._raf = requestAnimationFrame(this._tick);
  };

  // ── Public API ────────────────────────────────────────

  /** Begin the RAF loop. */
  start() {
    if (this._raf !== null) return; // already running
    this._last = performance.now();
    this._debt = 0;
    this._raf  = requestAnimationFrame(this._tick);
  }

  /** Cancel the RAF loop. Safe to call if not running. */
  stop() {
    if (this._raf !== null) {
      cancelAnimationFrame(this._raf);
      this._raf = null;
    }
  }
}
