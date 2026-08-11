// ═══════════════════════════════════════════════════════════════
//  src/js/universalclock.js  —  Master Clock Coordinator  |  BLAZEFIST
//
//  Single point of truth for all timing in the game engine.
//  Owns GameClock, RenderClock, and manages N PlayClocks.
//  Distributes delta time to all subsystems in correct order:
//    1. GameClock  → fixed-step physics / logic
//    2. PlayClocks → animation frame sequencers
//    3. RenderClock → RAF draw pass
// ═══════════════════════════════════════════════════════════════

import { Clock }       from './src/js/clock.js';
import { GameClock }   from './src/js/gameclock.js';
import { PlayClock }   from './src/js/playclock.js';
import { RenderClock, LAYER } from './src/js/renderclock.js';
import { ParserClock, PARSE_MODE } from './src/js/parserclock.js';

export { LAYER, PARSE_MODE };  // re-export for convenience

export class UniversalClock extends Clock {
  constructor({
    canvas,
    gameFps      = 60,
    showDebug    = false,
  } = {}) {
    super('universalclock');

    // ── Sub-clocks ──────────────────────────────────────────
    this.game   = new GameClock({ targetFps: gameFps });
    this.render = new RenderClock({ canvas, targetFps: gameFps, showDebug });

    this._playclocks  = new Map();  // id → PlayClock
    this._parseclocks = new Map();  // id → ParserClock
    this._globalScale = 1.0;

    // Wire game → playClocks: advance animations on each fixed step
    this.game.on('update', ({ dt }) => {
      this._playclocks.forEach(pc => pc.advance(dt));
    });

    // Wire game render alpha to render clock's pre-hook
    this.game.on('render', ({ alpha }) => {
      this._lastAlpha = alpha;
    });
  }

  // ── Master lifecycle ──────────────────────────────────────
  start() {
    super.start();
    this.game.start();
    this.render.start();
    this._emit('start', this._snapshot());
    return this;
  }

  stop() {
    this.game.stop();
    this.render.stop();
    this._playclocks.forEach(pc => pc.stop());
    this._parseclocks.forEach(pc => pc.destroy());
    super.stop();
    return this;
  }

  pause() {
    this.game.pause();
    this.render.pause();
    this._playclocks.forEach(pc => pc.pause());
    super.pause();
    return this;
  }

  resume() {
    this.game.resume();
    this.render.resume();
    this._playclocks.forEach(pc => pc.resume());
    super.resume();
    return this;
  }

  // ── Time scale (global slow-mo / speed-up) ────────────────
  setGlobalScale(s) {
    this._globalScale = s;
    this.game.setScale(s);
    this._playclocks.forEach(pc => pc.setScale(s));
    return this;
  }

  // ── PlayClock management ──────────────────────────────────
  createPlayClock(id) {
    const pc = new PlayClock();
    this._playclocks.set(id, pc);
    return pc;
  }

  getPlayClock(id) { return this._playclocks.get(id); }

  removePlayClock(id) {
    this._playclocks.get(id)?.stop();
    this._playclocks.delete(id);
    return this;
  }

  // ── ParserClock management (MP4 video) ───────────────────
  async loadVideo(id, src, opts = {}) {
    const pc = new ParserClock({ src, ...opts });
    this._parseclocks.set(id, pc);
    await pc.load(opts.onProgress);
    this._emit('video-ready', { id, parser: pc });
    return pc;
  }

  getParser(id)   { return this._parseclocks.get(id); }
  removeParser(id) {
    this._parseclocks.get(id)?.destroy();
    this._parseclocks.delete(id);
    return this;
  }

  // ── Render layer shortcuts ────────────────────────────────
  addLayer(id, layer, fn) { this.render.addLayer(id, layer, fn); return this; }
  removeLayer(id)          { this.render.removeLayer(id);         return this; }
  addPreHook(fn)           { this.render.addPreHook(fn);          return this; }
  addPostHook(fn)          { this.render.addPostHook(fn);         return this; }

  // ── Game loop hooks ───────────────────────────────────────
  onUpdate(fn) { this.game.on('update', ({ dt, elapsed, step }) => fn(dt, elapsed, step)); return this; }
  onRender(fn) { this.game.on('render', ({ alpha }) => fn(alpha, this._lastAlpha)); return this; }

  // ── Status / debug ────────────────────────────────────────
  status() {
    return {
      game: {
        running:    this.game.running,
        fps:        this.game.fps.toFixed(1),
        elapsed:    this.game.elapsedSec.toFixed(2),
        stepCount:  this.game.stepCount,
        alpha:      this.game.alpha.toFixed(4),
      },
      render: {
        running:    this.render.running,
        smoothFps:  this.render.smoothedFps.toFixed(1),
        frames:     this.render.renderCount,
        skips:      this.render.frameSkips,
        layers:     this.render._queue.length,
      },
      playclocks: [...this._playclocks.keys()],
      parsers:    [...this._parseclocks.entries()].map(([k, v]) => ({
        id:      k,
        ready:   v.ready,
        mode:    v._resolvedMode,
        frames:  v.frames.length,
      })),
      globalScale: this._globalScale,
    };
  }

  _snapshot() {
    return {
      ...super._snapshot(),
      gameFps:   this.game.fps,
      renderFps: this.render.smoothedFps,
      alpha:     this._lastAlpha ?? 0,
      scale:     this._globalScale,
    };
  }
}

// ── Factory (quick setup) ─────────────────────────────────────
export function createUniversalClock(canvas, opts = {}) {
  return new UniversalClock({ canvas, ...opts });
}

export default UniversalClock;
