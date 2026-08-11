// ═══════════════════════════════════════════════════════════════
//  src/js/gameclock.js  —  Fixed-Timestep Game Loop  |  BLAZEFIST
//  Accumulator pattern: decouples physics update from render.
//  Guarantees deterministic simulation regardless of frame rate.
// ═══════════════════════════════════════════════════════════════

import { Clock } from './src/js/clock.js';

export class GameClock extends Clock {
  constructor({
    targetFps   = 60,       // fixed simulation rate
    maxUpdates  = 5,        // guard against spiral-of-death
    onUpdate    = null,     // (dt, elapsed) => void  — fixed step
    onRender    = null,     // (alpha, snapshot) => void — interpolation hint
    onOverflow  = null,     // called when capped (lag spike warning)
  } = {}) {
    super('gameclock');

    this.targetFps  = targetFps;
    this.fixedMs    = 1000 / targetFps;
    this.maxUpdates = maxUpdates;
    this._acc       = 0;          // leftover accumulator (ms)
    this._rafId     = null;
    this._stepCount = 0;          // total fixed-step iterations

    // callbacks (can also use .on('update', cb))
    if (onUpdate) this.on('update', ({ dt, elapsed, step }) => onUpdate(dt, elapsed, step));
    if (onRender) this.on('render', ({ alpha, snapshot }) => onRender(alpha, snapshot));
    if (onOverflow) this.on('overflow', onOverflow);
  }

  // ── Start RAF loop ─────────────────────────────────────────
  start() {
    super.start();
    this._loop(performance.now());
    return this;
  }

  stop() {
    if (this._rafId) { cancelAnimationFrame(this._rafId); this._rafId = null; }
    super.stop();
    return this;
  }

  pause() {
    super.pause();
    if (this._rafId) { cancelAnimationFrame(this._rafId); this._rafId = null; }
    return this;
  }

  resume() {
    super.resume();
    this._loop(performance.now());
    return this;
  }

  // ── Core loop ─────────────────────────────────────────────
  _loop(ts) {
    if (!this.running || this.paused) return;
    this._rafId = requestAnimationFrame(t => this._loop(t));

    // raw frame delta, clamped
    const raw = Math.min(ts - this.lastTick, this._maxDelta);
    this.lastTick = ts;
    this.delta    = raw * this.scale;
    this.elapsed += this.delta;
    this.tickCount++;
    this._acc    += this.delta;

    // fixed-step drain
    let updates = 0;
    while (this._acc >= this.fixedMs && updates < this.maxUpdates) {
      this._stepCount++;
      this._emit('update', {
        dt:      this.fixedMs,
        elapsed: this.elapsed,
        step:    this._stepCount,
      });
      this._acc -= this.fixedMs;
      updates++;
    }

    // overflow guard warning
    if (this._acc >= this.fixedMs) {
      this._emit('overflow', { acc: this._acc, dropped: Math.floor(this._acc / this.fixedMs) });
      this._acc = 0; // discard excess to recover
    }

    // render hint: alpha = how far into next fixed step we are
    const alpha = this._acc / this.fixedMs;
    this._emit('render', { alpha, snapshot: this._snapshot() });
    this._emit('tick',   this._snapshot());
  }

  // ── Config helpers ────────────────────────────────────────
  setTargetFps(fps) {
    this.targetFps = fps;
    this.fixedMs   = 1000 / fps;
    return this;
  }

  get stepCount() { return this._stepCount; }
  get accumulator() { return this._acc; }
  get alpha() { return this._acc / this.fixedMs; }

  _snapshot() {
    return {
      ...super._snapshot(),
      fixedMs:    this.fixedMs,
      targetFps:  this.targetFps,
      accumulator: this._acc,
      alpha:       this.alpha,
      stepCount:   this._stepCount,
    };
  }
}

export default GameClock;
