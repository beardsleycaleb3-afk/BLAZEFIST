// ═══════════════════════════════════════════════════════════════
//  src/js/playclock.js  —  Sprite Animation Frame Sequencer  |  BLAZEFIST
//  Drives per-animation FPS, loop/once mode, callbacks on events.
//  Decoupled from render — just tracks which frame should show.
// ═══════════════════════════════════════════════════════════════

import { Clock } from './src/js/clock.js';

// ── Animation Definition ──────────────────────────────────────
export class AnimDef {
  constructor({
    key,                // string ID
    frames,             // array of Image | ImageBitmap | HTMLImageElement
    fps      = 12,
    loop     = true,
    pingpong = false,   // loop alternates direction
    onEnd    = null,    // called when non-loop anim finishes
    onFrame  = null,    // called every frame: (frameIndex, def)
  }) {
    this.key      = key;
    this.frames   = frames;
    this.fps      = fps;
    this.loop     = loop;
    this.pingpong = pingpong;
    this.onEnd    = onEnd;
    this.onFrame  = onFrame;
    this.frameCount = frames.length;
  }
}

// ── PlayClock ─────────────────────────────────────────────────
export class PlayClock extends Clock {
  constructor() {
    super('playclock');
    this._registry = new Map();   // key → AnimDef
    this._current  = null;        // current AnimDef
    this._frame    = 0;           // current frame index
    this._acc      = 0;           // ms accumulator within frame duration
    this._dir      = 1;           // pingpong direction (+1 / -1)
    this._done     = false;       // non-loop anim completed
    this._queue    = [];          // queued animation keys
  }

  // ── Registry ──────────────────────────────────────────────
  register(def) {
    if (!(def instanceof AnimDef)) def = new AnimDef(def);
    this._registry.set(def.key, def);
    return this;
  }

  registerMany(defs) {
    defs.forEach(d => this.register(d));
    return this;
  }

  // ── Playback control ──────────────────────────────────────
  play(key, { restart = false } = {}) {
    const def = this._registry.get(key);
    if (!def) { console.warn(`PlayClock: unknown anim "${key}"`); return this; }
    if (this._current?.key === key && !restart) return this;
    this._current = def;
    this._frame   = 0;
    this._acc     = 0;
    this._dir     = 1;
    this._done    = false;
    if (!this.running) this.start();
    this._emit('play', { key, def });
    return this;
  }

  queue(key) {
    this._queue.push(key);
    return this;
  }

  stop() {
    this._queue = [];
    super.stop();
    return this;
  }

  // ── Advance (called by UniversalClock with delta ms) ──────
  advance(dt) {
    if (!this._current || this._done) return;
    const def    = this._current;
    const frameDur = 1000 / (def.fps * this.scale || 1);
    this._acc += dt;

    while (this._acc >= frameDur) {
      this._acc -= frameDur;
      this._stepFrame(def);
      if (this._done) break;
    }
  }

  _stepFrame(def) {
    def.onFrame?.(this._frame, def);
    this._emit('frame', { key: def.key, frame: this._frame, image: this.currentImage });

    if (def.pingpong) {
      this._frame += this._dir;
      if (this._frame >= def.frameCount - 1) this._dir = -1;
      if (this._frame <= 0)                  this._dir =  1;
    } else {
      this._frame++;
      if (this._frame >= def.frameCount) {
        if (def.loop) {
          this._frame = 0;
        } else {
          this._frame = def.frameCount - 1;
          this._done  = true;
          def.onEnd?.(def);
          this._emit('end', { key: def.key });
          // Play next queued anim if any
          if (this._queue.length) this.play(this._queue.shift());
        }
      }
    }
  }

  // ── Accessors ─────────────────────────────────────────────
  get currentImage() {
    if (!this._current || !this._current.frames.length) return null;
    return this._current.frames[this._frame] ?? null;
  }

  get currentFrame() { return this._frame; }
  get currentKey()   { return this._current?.key ?? null; }
  get isDone()       { return this._done; }
  get frameCount()   { return this._current?.frameCount ?? 0; }

  isPlaying(key) { return this._current?.key === key && !this._done; }

  // ── Transition helpers ────────────────────────────────────
  transitionTo(key) {
    if (this._current?.key !== key) this.play(key);
    return this;
  }

  setFrame(n) {
    if (!this._current) return this;
    this._frame = Math.max(0, Math.min(n, this._current.frameCount - 1));
    return this;
  }
}

export default PlayClock;
