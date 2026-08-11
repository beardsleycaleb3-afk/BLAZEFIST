// src/js/config.js
// ════════════════════════════════════════════════════════════
//  tapout — Central configuration
//  Single source of truth for canvas dimensions, asset paths,
//  animation frame counts, and physics constants.
//  All other modules import from here — never hardcode values.
// ════════════════════════════════════════════════════════════

// ── Canvas / design space ────────────────────────────────────
// CSS display: 320×300.  Internal drawing coordinate space: 350×300.
// The renderer scales to fill the CSS box via DPR transform.
export const DESIGN = Object.freeze({ w: 350, h: 300 });

// ── Physics ──────────────────────────────────────────────────
export const PHYSICS = Object.freeze({
  GRAVITY:    0.48,
  JUMP_VEL:  -9.2,
  WALK_SPD:   2.4,
  RUN_SPD:    5.0,
  FLOOR_Y:    248,   // feet Y in design coords
});

// ── Asset base path (relative to index.html) ─────────────────
export const ASSET_BASE = './assets/sprites';

// ── Fighter asset paths ───────────────────────────────────────
export const PATHS = Object.freeze({
  PLAYER:  'fighter/flaming/east',   // flaming variant
  ENEMY:   'fighter/east',           // base tiger variant
  STAGES:  'stages/backgrounds',
  SHEETS:  'animations/east',
});

// ── Player animation registry ─────────────────────────────────
// frames: total frame count (frame_000 … frame_NNN)
// fps:    playback speed
export const PLAYER_ANIMS = Object.freeze({
  idle:       { frames: 8,  fps: 8  },
  walk:       { frames: 8,  fps: 10 },
  run:        { frames: 8,  fps: 14 },
  jab:        { frames: 3,  fps: 20 },
  punch:      { frames: 6,  fps: 16 },
  kick:       { frames: 6,  fps: 14 },
  cross:      { frames: 6,  fps: 16 },
  uppercut:   { frames: 7,  fps: 14 },
  roundhouse: { frames: 7,  fps: 12 },
  headbutt:   { frames: 11, fps: 12 },
  jump:       { frames: 8,  fps: 14 },
  victory:    { frames: 13, fps: 8  },
});

// ── Enemy animation registry ──────────────────────────────────
export const ENEMY_ANIMS = Object.freeze({
  idle:      { frames: 8,  fps: 8  },
  walk:      { frames: 8,  fps: 10 },
  run:       { frames: 8,  fps: 14 },
  jab:       { frames: 3,  fps: 20 },
  kick:      { frames: 7,  fps: 14 },
  cross:     { frames: 6,  fps: 16 },
  uppercut:  { frames: 7,  fps: 14 },
  throw:     { frames: 7,  fps: 12 },
  fireball:  { frames: 6,  fps: 14 },
  takehit:   { frames: 6,  fps: 20 },
  crouch:    { frames: 5,  fps: 10 },
  die:       { frames: 7,  fps: 10 },
  getup:     { frames: 5,  fps: 10 },
  transform: { frames: 13, fps: 8  },
});

// ── Stage names (matches filenames in stages/backgrounds/) ────
export const STAGE_NAMES = Object.freeze([
  'stage1','stage2','stage3','stage4','stage5',
  'stage6','stage7','stage8','stage9',
]);

// ── Enemy sprite sheet names (animations/east/) ───────────────
export const SHEET_NAMES = Object.freeze([
  'shadowratsheet2',    'rhinosheet',        'elementalratsheet',
  'rhinohumansheet',    'ratshadow2sheet',   'dragonhumansheet',
  'electrichumansheet', 'elementalowlsheet', 'ratsheet',
  'electrichumansheet2','electricrhinosheet','rathumansheet',
  'rhinohumansheet2',
]);

// ── Combat constants ──────────────────────────────────────────
export const COMBAT = Object.freeze({
  PLAYER_REACH:  88,    // px – player hit range
  ENEMY_REACH:   72,    // px – enemy hit range
  PLAYER_DMG:    12,
  ENEMY_DMG:      8,
  COMBO_SEQ:     ['jab','cross','kick'],   // 3-hit chain
  COMBO_WINDOW:  420,   // ms to land next combo link
  ATTACK_DUR:    260,   // ms attack animation lock
  WIN_PAUSE:    2200,   // ms KO screen hold before next round
  HEAL_ON_WIN:    20,   // HP restored per round win
});
