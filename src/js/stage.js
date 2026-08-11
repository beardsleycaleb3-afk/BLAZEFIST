// src/js/stage.js
// ════════════════════════════════════════════════════════════
//  tapout — Stage background renderer
//  Manages which of the 9 stage backgrounds is active.
//  Falls back to a gradient if the PNG hasn't loaded.
// ════════════════════════════════════════════════════════════

import { DESIGN, STAGE_NAMES } from './src/js/config.js';

export class Stage {
  constructor() {
    /** @type {string} */
    this.name = STAGE_NAMES[0];
    /** @type {HTMLImageElement|null} */
    this._img = null;
  }

  /**
   * Set the active stage.
   * @param {number} idx          0-based index (wraps via modulo)
   * @param {import('./loader.js').GameAssets} assets
   */
  load(idx, assets) {
    const name  = STAGE_NAMES[idx % STAGE_NAMES.length];
    this.name   = name;
    this._img   = assets[name] ?? null;
  }

  /**
   * Draw stage background to fill the design canvas.
   * @param {CanvasRenderingContext2D} ctx
   */
  draw(ctx) {
    if (this._img) {
      ctx.drawImage(this._img, 0, 0, DESIGN.w, DESIGN.h);
      return;
    }

    // Fallback gradient (visible while assets load or if stage PNG missing)
    const g = ctx.createLinearGradient(0, 0, 0, DESIGN.h);
    g.addColorStop(0, '#0f1730');
    g.addColorStop(1, '#070b16');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, DESIGN.w, DESIGN.h);
  }
}
