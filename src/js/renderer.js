// src/js/renderer.js
// ════════════════════════════════════════════════════════════
//  tapout — Canvas Renderer
//
//  Manages the HTMLCanvasElement backing store:
//   • Resizes canvas pixels to device pixel ratio (max 2.5×)
//   • Applies a DPR scale transform so all drawing uses
//     DESIGN coordinates (350×300) regardless of screen density
//   • Disables image smoothing for pixel-perfect sprite rendering
//   • Exposes .ctx (CanvasRenderingContext2D) to callers
//
//  Usage:
//    const r = new Renderer(canvas);
//    r.resize();                    // call once, then on resize
//    drawStuff(r.ctx);              // draw in DESIGN coords
// ════════════════════════════════════════════════════════════

import { DESIGN } from './config.js';

export class Renderer {
  /**
   * @param {HTMLCanvasElement} canvas
   */
  constructor(canvas) {
    this.canvas = canvas;
    /** @type {CanvasRenderingContext2D} */
    this.ctx = canvas.getContext('2d', { alpha: false });
  }

  /**
   * Sync canvas backing-store to current device pixel ratio.
   * Must be called:
   *   • Once after construction
   *   • On window 'resize' and visualViewport 'resize'
   */
  resize() {
    // Cap DPR at 2.5 — above that is indistinguishable on phone screens
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5);

    // Physical pixel dimensions
    this.canvas.width  = Math.round(DESIGN.w * dpr);
    this.canvas.height = Math.round(DESIGN.h * dpr);

    // Scale all subsequent draws so DESIGN coords map to physical pixels
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Pixel-perfect sprite rendering
    this.ctx.imageSmoothingEnabled = false;

    this._dpr = dpr;
  }

  /** @returns {CanvasRenderingContext2D} */
  get context() { return this.ctx; }
}
