// src/js/state.js
// ════════════════════════════════════════════════════════════
//  tapout — Game state machine
//
//  Scenes:  LOADING → FIGHT → WIN | LOSE → FIGHT (next round)
//
//  Owns: score, combo, round counter, stage index.
//  main.js drives scene transitions; state.js tracks the numbers.
// ════════════════════════════════════════════════════════════

// ── Scene enum ────────────────────────────────────────────────
/** @enum {string} */
export const Scene = Object.freeze({
  LOADING: 'loading',
  FIGHT:   'fight',
  WIN:     'win',
  LOSE:    'lose',
  PAUSE:   'pause',
});

// ── Game state class ─────────────────────────────────────────
export class GameState {
  constructor() {
    /** @type {string} current scene key */
    this.scene    = Scene.LOADING;

    this.score    = 0;
    this.combo    = 0;
    this._comboMs = 0;   // ms until combo resets

    this.round    = 1;
    this.stageIdx = 0;   // 0-based, wraps mod 9
  }

  // ── Tick ───────────────────────────────────────────────

  /**
   * @param {number} dt fixed-step ms
   */
  update(dt) {
    if (this._comboMs > 0) {
      this._comboMs -= dt;
      if (this._comboMs <= 0) {
        this._comboMs = 0;
        this.combo    = 0;
      }
    }
  }

  // ── Events ─────────────────────────────────────────────

  /**
   * Register a successful player hit.
   * Scales score reward with current combo depth.
   * @param {number} dmg  damage dealt
   */
  registerHit(dmg) {
    this.combo++;
    this._comboMs = 1800;
    // Exponential combo bonus capped at 8×
    const mult = Math.min(8, 1 + Math.floor(this.combo / 3) * 0.5);
    this.score += Math.round(dmg * 10 * mult);
  }

  /**
   * Advance to next round, rotate stage index.
   * Resets combo. Scene set back to FIGHT by caller after delay.
   */
  nextRound() {
    this.round++;
    this.stageIdx = (this.stageIdx + 1) % 9;
    this.combo    = 0;
    this._comboMs = 0;
    this.scene    = Scene.FIGHT;
  }

  /**
   * Full reset for game-over restart.
   */
  reset() {
    this.score    = 0;
    this.combo    = 0;
    this._comboMs = 0;
    this.round    = 1;
    this.stageIdx = 0;
    this.scene    = Scene.FIGHT;
  }
}
