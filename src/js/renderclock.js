// ═══════════════════════════════════════════════════════════════
//  src/js/renderclock.js  —  Render Scheduler  |  BLAZEFIST
//
//  Wraps requestAnimationFrame with:
//  - Priority-ordered draw queue (background → sprites → HUD → debug)
//  - FPS smoothing over rolling window
//  - Frame-skip detection and reporting
//  - Pre/post render hooks
//  - Visibility API integration (pause when tab hidden)
// ═══════════════════════════════════════════════════════════════

import { Clock } from './src/js/clock.js';

export const LAYER = {
  BACKGROUND : 0,
  STAGE_FX   : 1,
  SHADOW     : 2,
  SPRITE     : 3,
  PROJECTILE : 4,
  PARTICLE   : 5,
  HUD        : 6,
  OVERLAY    : 7,
  DEBUG      : 8,
};

export class RenderClock extends Clock {
  constructor({
    canvas,
    targetFps      = 60,
    smoothWindow   = 20,    // samples for smoothed FPS
    showDebug      = false,
    autoPauseHidden = true, // pause when browser tab hidden
  } = {}) {
    super('renderclock');
    this.canvas         = canvas;
    this.ctx            = canvas?.getContext('2d');
    this.targetFps      = targetFps;
    this.showDebug      = showDebug;
    this._rafId         = null;
    this._queue         = [];     // { layer, fn, id }
    this._preHooks      = [];
    this._postHooks     = [];
    this._fpsSamples    = new Float32Array(smoothWindow);
    this._sampleIdx     = 0;
    this._smoothedFps   = 0;
    this._frameSkips    = 0;
    this._renderCount   = 0;
    this._lastRender    = 0;

    if (autoPauseHidden && typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) this.pause();
        else                 this.resume();
      });
    }
  }

  // ── Lifecycle ──────────────────────────────────────────────
  start() {
    super.start();
    this._lastRender = performance.now();
    this._rafId = requestAnimationFrame(ts => this._frame(ts));
    return this;
  }

  stop() {
    if (this._rafId) { cancelAnimationFrame(this._rafId); this._rafId = null; }
    super.stop();
    return this;
  }

  pause() {
    if (this._rafId) { cancelAnimationFrame(this._rafId); this._rafId = null; }
    super.pause();
    return this;
  }

  resume() {
    super.resume();
    this._lastRender = performance.now();
    this._rafId = requestAnimationFrame(ts => this._frame(ts));
    return this;
  }

  // ── Draw queue ────────────────────────────────────────────
  addLayer(id, layer = LAYER.SPRITE, fn) {
    // Remove existing entry with same id
    this._queue = this._queue.filter(e => e.id !== id);
    this._queue.push({ id, layer, fn });
    this._queue.sort((a, b) => a.layer - b.layer);
    return this;
  }

  removeLayer(id) {
    this._queue = this._queue.filter(e => e.id !== id);
    return this;
  }

  addPreHook(fn)  { this._preHooks.push(fn);  return this; }
  addPostHook(fn) { this._postHooks.push(fn); return this; }

  // ── Core frame ────────────────────────────────────────────
  _frame(ts) {
    if (!this.running || this.paused) return;
    this._rafId = requestAnimationFrame(t => this._frame(t));

    // Delta & clock tick
    this.delta    = Math.min(ts - this.lastTick, this._maxDelta);
    this.elapsed += this.delta;
    this.lastTick = ts;
    this.tickCount++;
    this._renderCount++;

    // FPS smoothing
    this._fpsSamples[this._sampleIdx++ % this._fpsSamples.length] =
      this.delta > 0 ? 1000 / this.delta : 0;
    this._smoothedFps =
      this._fpsSamples.reduce((s, v) => s + v, 0) / this._fpsSamples.length;

    // Frame skip detection
    const expected = 1000 / this.targetFps;
    if (this.delta > expected * 1.5) {
      this._frameSkips++;
      this._emit('frameskip', { delta: this.delta, expected, skips: this._frameSkips });
    }

    // Pre-render hooks (input read, state snapshot, etc.)
    const snapshot = this._snapshot();
    this._preHooks.forEach(fn => fn(snapshot));

    // Clear canvas
    if (this.ctx) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    // Draw all registered layers in order
    for (const entry of this._queue) {
      try { entry.fn(this.ctx, snapshot); }
      catch(e) { console.error(`[RenderClock] layer "${entry.id}" error:`, e); }
    }

    // Debug overlay
    if (this.showDebug && this.ctx) this._drawDebug();

    // Post-render hooks
    this._postHooks.forEach(fn => fn(snapshot));
    this._emit('tick', snapshot);
    this._emit('render', snapshot);
  }

  // ── Debug overlay ─────────────────────────────────────────
  _drawDebug() {
    const ctx = this.ctx;
    const lines = [
      `FPS: ${this._smoothedFps.toFixed(1)} (raw: ${this.fps.toFixed(1)})`,
      `delta: ${this.delta.toFixed(2)}ms`,
      `frames: ${this._renderCount}`,
      `skips: ${this._frameSkips}`,
      `layers: ${this._queue.length}`,
    ];
    ctx.save();
    ctx.font         = '10px monospace';
    ctx.fillStyle    = 'rgba(0,0,0,0.55)';
    ctx.fillRect(4, 4, 160, lines.length * 14 + 6);
    ctx.fillStyle    = '#0f0';
    lines.forEach((l, i) => ctx.fillText(l, 8, 16 + i * 14));
    ctx.restore();
  }

  // ── Accessors ─────────────────────────────────────────────
  get smoothedFps()  { return this._smoothedFps; }
  get renderCount()  { return this._renderCount; }
  get frameSkips()   { return this._frameSkips; }

  _snapshot() {
    return {
      ...super._snapshot(),
      smoothedFps: this._smoothedFps,
      renderCount: this._renderCount,
      frameSkips:  this._frameSkips,
    };
  }
}

export default RenderClock;
