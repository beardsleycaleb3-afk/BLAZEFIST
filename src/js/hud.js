// src/js/hud.js
// ════════════════════════════════════════════════════════════
//  tapout — In-canvas HUD
//
//  Drawn directly onto the game canvas after stage + fighters.
//  Renders: player HP bar (left), enemy HP bar (right),
//  combo flash (centre), round/score strip.
//  DOM chips (round, score, fps) are updated separately in main.js.
// ════════════════════════════════════════════════════════════

import { DESIGN } from './src/js/config.js';

// ── Layout constants ─────────────────────────────────────────
const BAR_W  = 108;
const BAR_H  = 11;
const BAR_Y  = 10;
const MARGIN = 8;

// ── Combo sizing ─────────────────────────────────────────────
const COMBO_BASE_SIZE = 13;
const COMBO_MAX_SIZE  = 22;

/**
 * Draw the full HUD layer.
 * @param {CanvasRenderingContext2D} ctx
 * @param {import('./fighter.js').Fighter} player
 * @param {import('./enemy.js').Enemy}    enemy
 * @param {number} score
 * @param {number} combo
 * @param {number} round
 */
export function drawHUD(ctx, player, enemy, score, combo, round) {
  const W = DESIGN.w;
  ctx.save();

  // ── Player HP (left) ──────────────────────────────────
  const playerRatio = player.hp / player.maxHp;
  const playerColor = player.hp > 25 ? '#7ef0a7' : '#ff5d73';
  _drawBar(ctx, MARGIN, BAR_Y, BAR_W, BAR_H, playerRatio, playerColor, 'P');

  // ── Enemy HP (right) ──────────────────────────────────
  const enemyRatio  = enemy.alive ? enemy.hp / enemy.maxHp : 0;
  _drawBar(ctx, W - MARGIN - BAR_W, BAR_Y, BAR_W, BAR_H, enemyRatio, '#ff9f43', 'E');

  // ── Combo flash (centre) ──────────────────────────────
  if (combo > 1) {
    const size = Math.min(COMBO_MAX_SIZE, COMBO_BASE_SIZE + combo);
    ctx.font      = `bold ${size}px monospace`;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffdd57';
    ctx.shadowColor  = '#ffaa00';
    ctx.shadowBlur   = 6;
    ctx.fillText(`${combo} HIT!`, W * 0.5, BAR_Y + BAR_H + size + 2);
    ctx.shadowBlur   = 0;
  }

  ctx.restore();
}

// ── Internal helpers ──────────────────────────────────────────

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x
 * @param {number} y
 * @param {number} w
 * @param {number} h
 * @param {number} ratio      0..1
 * @param {string} fillColor
 * @param {'P'|'E'} label
 */
function _drawBar(ctx, x, y, w, h, ratio, fillColor, label) {
  // Track
  ctx.fillStyle = 'rgba(0,0,0,0.58)';
  ctx.fillRect(x, y, w, h);

  // Fill
  const filled = Math.max(0, Math.min(1, ratio)) * w;
  if (filled > 0) {
    ctx.fillStyle = fillColor;
    ctx.fillRect(x, y, filled, h);
  }

  // Border
  ctx.strokeStyle = 'rgba(255,255,255,0.16)';
  ctx.lineWidth   = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);

  // Label + HP number
  ctx.fillStyle   = 'rgba(255,255,255,0.85)';
  ctx.font        = `bold 8px monospace`;
  ctx.textAlign   = label === 'P' ? 'left' : 'right';
  const hp        = Math.ceil(ratio * 100);
  const labelStr  = `${label} ${hp}`;
  const lx        = label === 'P' ? x + 3 : x + w - 3;
  ctx.fillText(labelStr, lx, y + h - 1);
}
