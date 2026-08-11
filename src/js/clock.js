// ═══════════════════════════════════════════════════════════════
//  src/js/clock.js  —  Base Clock  |  BLAZEFIST Engine
//  Foundation for all timing modules. Event-driven, composable.
// ═══════════════════════════════════════════════════════════════

export class Clock {
  constructor(name = 'clock') {
    this.name      = name;
    this.running   = false;
    this.paused    = false;
    this.startTime = 0;
    this.elapsed   = 0;       // ms since start (pause-adjusted)
    this.delta     = 0;       // ms since last tick
    this.lastTick  = 0;       // raw performance.now() of last tick
    this.tickCount = 0;
    this.scale     = 1.0;     // time-scale multiplier (slow-mo / fast-forward)
    this._listeners = new Map();
    this._maxDelta  = 100;    // clamp runaway deltas (ms)
  }

  // ── Lifecycle ──────────────────────────────────────────────
  start() {
    if (this.running) return this;
    this.startTime = performance.now();
    this.lastTick  = this.startTime;
    this.elapsed   = 0;
    this.tickCount = 0;
    this.running   = true;
    this.paused    = false;
    this._emit('start', this._snapshot());
    return this;
  }

  stop() {
    if (!this.running) return this;
    this.running = false;
    this.paused  = false;
    this._emit('stop', this._snapshot());
    return this;
  }

  pause() {
    if (!this.running || this.paused) return this;
    this.paused = true;
    this._emit('pause', this._snapshot());
    return this;
  }

  resume() {
    if (!this.paused) return this;
    this.lastTick = performance.now(); // reset so delta doesn't spike
    this.paused   = false;
    this._emit('resume', this._snapshot());
    return this;
  }

  reset() {
    const wasRunning = this.running;
    this.stop();
    this.elapsed   = 0;
    this.delta     = 0;
    this.tickCount = 0;
    this._emit('reset', this._snapshot());
    if (wasRunning) this.start();
    return this;
  }

  // ── Tick ───────────────────────────────────────────────────
  tick(ts = performance.now()) {
    if (!this.running || this.paused) return this;
    const raw = Math.min(ts - this.lastTick, this._maxDelta);
    this.delta     = raw * this.scale;
    this.elapsed  += this.delta;
    this.lastTick  = ts;
    this.tickCount++;
    this._emit('tick', this._snapshot());
    return this;
  }

  // ── Getters ────────────────────────────────────────────────
  get fps()          { return this.delta > 0 ? 1000 / this.delta : 0; }
  get elapsedSec()   { return this.elapsed / 1000; }
  get deltaSec()     { return this.delta   / 1000; }

  // ── Events ─────────────────────────────────────────────────
  on(event, cb) {
    if (!this._listeners.has(event)) this._listeners.set(event, new Set());
    this._listeners.get(event).add(cb);
    return () => this.off(event, cb);  // returns unsubscribe fn
  }

  off(event, cb) {
    this._listeners.get(event)?.delete(cb);
    return this;
  }

  once(event, cb) {
    const wrap = (data) => { cb(data); this.off(event, wrap); };
    return this.on(event, wrap);
  }

  _emit(event, data) {
    this._listeners.get(event)?.forEach(cb => cb(data));
    this._listeners.get('*')?.forEach(cb => cb({ event, ...data }));
  }

  _snapshot() {
    return {
      name:      this.name,
      elapsed:   this.elapsed,
      delta:     this.delta,
      tickCount: this.tickCount,
      fps:       this.fps,
      scale:     this.scale,
      running:   this.running,
      paused:    this.paused,
    };
  }

  // ── Utility ────────────────────────────────────────────────
  setScale(s)    { this.scale = Math.max(0, s); return this; }
  setMaxDelta(d) { this._maxDelta = d;           return this; }

  toString() {
    return `[${this.name}] t=${this.elapsedSec.toFixed(2)}s dt=${this.delta.toFixed(2)}ms fps=${this.fps.toFixed(1)}`;
  }
}

export default Clock;
