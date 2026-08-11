// src/js/animator.js
// ════════════════════════════════════════════════════════════
//  BLAZEFIST — Animation state machine
//
//  Drives frame index from config fps values.
//  • play(name, opts) — switch animation; no-op if already active
//    unless force:true.
//  • update(dt) — advances elapsed time and frame counter.
//  • getFrame(assets) — returns current HTMLImageElement or null.
//  • Non-looping anims: freezes on last frame, fires onFinish callback.
// ════════════════════════════════════════════════════════════

import { PLAYER_ANIMS, ENEMY_ANIMS } from './src/js/config.js';

export class Animator {
  /**
   * @param {'player'|'enemy'} role
   */
  constructor(role) {
    this._role     = role;
    this._table    = role === 'player' ? PLAYER_ANIMS : ENEMY_ANIMS;

    // Public state
    this.current   = 'idle';
    this.frame     = 0;
    this.finished  = false;

    // Private
    this._elapsed  = 0;
    this._loop     = true;
    this._onFinish = null;
  }

  // ── Public methods ──────────────────────────────────────

  /**
   * Switch to a named animation.
   * @param {string} name
   * @param {{ loop?: boolean, force?: boolean, onFinish?: (() => void)|null }} [opts]
   */
  play(name, { loop = true, force = false, onFinish = null } = {}) {
    if (!this._table[name]) {
      console.warn(`[Animator:${this._role}] unknown animation "${name}"`);
      return;
    }
    // Skip if already playing same animation and not finished (unless forced)
    if (this.current === name && !this.finished && !force) return;

    this.current   = name;
    this.frame     = 0;
    this._elapsed  = 0;
    this._loop     = loop;
    this.finished  = false;
    this._onFinish = onFinish;
  }

  /**
   * Advance the animation clock.
   * @param {number} dt  milliseconds (fixed step from GameLoop)
   */
  update(dt) {
    if (this.finished) return;

    const cfg = this._table[this.current];
    if (!cfg) return;

    this._elapsed += dt;
    const msPerFrame = 1000 / cfg.fps;

    // Step frame(s) — handles dt > one frame
    while (this._elapsed >= msPerFrame) {
      this._elapsed -= msPerFrame;
      this.frame++;

      if (this.frame >= cfg.frames) {
        if (this._loop) {
          this.frame = 0;
        } else {
          this.frame    = cfg.frames - 1;  // freeze on last frame
          this.finished = true;
          this._onFinish?.();
          return;
        }
      }
    }
  }

  /**
   * Get the HTMLImageElement for the current frame.
   * Returns null if assets haven't loaded yet (draw method shows placeholder).
   * @param {import('./loader.js').GameAssets} assets
   * @returns {HTMLImageElement|null}
   */
  getFrame(assets) {
    const arr = assets[`${this._role}_${this.current}`];
    if (!arr || arr.length === 0) return null;
    const idx = Math.min(this.frame, arr.length - 1);
    return arr[idx] ?? null;
  }
}
