// src/js/loader.js
// ════════════════════════════════════════════════════════════
//  tapout — Asset loader
//
//  Loads all game assets in parallel and returns a typed
//  manifest object keyed by: `player_<anim>`, `enemy_<anim>`,
//  stage names, and sprite sheet names.
//
//  Frame arrays are pre-sized and indexed — order is guaranteed.
//  Missing files resolve to null (non-fatal, falls back to
//  placeholder rect in draw methods).
// ════════════════════════════════════════════════════════════

import {
  ASSET_BASE,
  PATHS,
  PLAYER_ANIMS,
  ENEMY_ANIMS,
  STAGE_NAMES,
  SHEET_NAMES,
} from './src/js/config.js';

// ── Image cache — avoids duplicate fetches ────────────────────
/** @type {Map<string, HTMLImageElement|null>} */
const _cache = new Map();

/**
 * Load a single image. Returns null on 404 (non-fatal).
 * @param {string} src
 * @returns {Promise<HTMLImageElement|null>}
 */
function _loadImg(src) {
  if (_cache.has(src)) return Promise.resolve(_cache.get(src));
  return new Promise((resolve) => {
    const img = new Image();
    img.onload  = () => { _cache.set(src, img); resolve(img); };
    img.onerror = () => {
      _cache.set(src, null);
      console.warn(`[loader] missing → ${src}`);
      resolve(null);
    };
    img.src = src;
  });
}

/**
 * Zero-padded frame filename.
 * @param {number} n
 * @returns {string}  e.g. "frame_003.png"
 */
function _fname(n) {
  return `frame_${String(n).padStart(3, '0')}.png`;
}

// ── Job builder helpers ───────────────────────────────────────
/**
 * Build load jobs for one animation set.
 * @param {string} keyPrefix   e.g. 'player'
 * @param {string} basePath    e.g. 'fighter/flaming/east'
 * @param {Record<string, {frames:number}>} animTable
 * @returns {Array<{key:string, src:string, idx:number}>}
 */
function _animJobs(keyPrefix, basePath, animTable) {
  const jobs = [];
  for (const [anim, { frames }] of Object.entries(animTable)) {
    for (let i = 0; i < frames; i++) {
      jobs.push({
        key: `${keyPrefix}_${anim}`,
        src: `${ASSET_BASE}/${basePath}/${anim}/${_fname(i)}`,
        idx: i,
      });
    }
  }
  return jobs;
}

// ── Public API ────────────────────────────────────────────────

/**
 * Load all game assets.
 * @param {((progress: number) => void)} [onProgress]  0..1
 * @returns {Promise<GameAssets>}
 */
export async function loadAll(onProgress) {
  // ── Build job list ──────────────────────────────────────
  const jobs = [
    ..._animJobs('player', PATHS.PLAYER, PLAYER_ANIMS),
    ..._animJobs('enemy',  PATHS.ENEMY,  ENEMY_ANIMS),
    // Stages
    ...STAGE_NAMES.map(name => ({
      key: name,
      src: `${ASSET_BASE}/${PATHS.STAGES}/${name}.png`,
      idx: 0,
    })),
    // Sprite sheets
    ...SHEET_NAMES.map(name => ({
      key: name,
      src: `${ASSET_BASE}/${PATHS.SHEETS}/${name}.png`,
      idx: 0,
    })),
  ];

  // ── Pre-allocate manifest ───────────────────────────────
  /** @type {GameAssets} */
  const manifest = /** @type {any} */ ({});

  for (const [anim, { frames }] of Object.entries(PLAYER_ANIMS)) {
    manifest[`player_${anim}`] = new Array(frames).fill(null);
  }
  for (const [anim, { frames }] of Object.entries(ENEMY_ANIMS)) {
    manifest[`enemy_${anim}`] = new Array(frames).fill(null);
  }
  for (const name of STAGE_NAMES)  manifest[name] = null;
  for (const name of SHEET_NAMES)  manifest[name] = null;

  // ── Parallel load ───────────────────────────────────────
  let done  = 0;
  const total = jobs.length;

  await Promise.all(
    jobs.map(async ({ key, src, idx }) => {
      const img = await _loadImg(src);
      if (Array.isArray(manifest[key])) {
        manifest[key][idx] = img;
      } else {
        manifest[key] = img;
      }
      onProgress?.(++done / total);
    })
  );

  return manifest;
}

/**
 * @typedef {Object} GameAssets
 * Frame arrays — index-ordered (frame_000 at [0], etc.)
 * @property {(HTMLImageElement|null)[]} player_idle
 * @property {(HTMLImageElement|null)[]} player_walk
 * @property {(HTMLImageElement|null)[]} player_run
 * @property {(HTMLImageElement|null)[]} player_jab
 * @property {(HTMLImageElement|null)[]} player_punch
 * @property {(HTMLImageElement|null)[]} player_kick
 * @property {(HTMLImageElement|null)[]} player_cross
 * @property {(HTMLImageElement|null)[]} player_uppercut
 * @property {(HTMLImageElement|null)[]} player_roundhouse
 * @property {(HTMLImageElement|null)[]} player_headbutt
 * @property {(HTMLImageElement|null)[]} player_jump
 * @property {(HTMLImageElement|null)[]} player_victory
 * @property {(HTMLImageElement|null)[]} enemy_idle
 * @property {(HTMLImageElement|null)[]} enemy_walk
 * @property {(HTMLImageElement|null)[]} enemy_run
 * @property {(HTMLImageElement|null)[]} enemy_jab
 * @property {(HTMLImageElement|null)[]} enemy_kick
 * @property {(HTMLImageElement|null)[]} enemy_cross
 * @property {(HTMLImageElement|null)[]} enemy_uppercut
 * @property {(HTMLImageElement|null)[]} enemy_throw
 * @property {(HTMLImageElement|null)[]} enemy_fireball
 * @property {(HTMLImageElement|null)[]} enemy_takehit
 * @property {(HTMLImageElement|null)[]} enemy_crouch
 * @property {(HTMLImageElement|null)[]} enemy_die
 * @property {(HTMLImageElement|null)[]} enemy_getup
 * @property {(HTMLImageElement|null)[]} enemy_transform
 * Single images
 * @property {HTMLImageElement|null} stage1
 * @property {HTMLImageElement|null} stage2
 * @property {HTMLImageElement|null} stage3
 * @property {HTMLImageElement|null} stage4
 * @property {HTMLImageElement|null} stage5
 * @property {HTMLImageElement|null} stage6
 * @property {HTMLImageElement|null} stage7
 * @property {HTMLImageElement|null} stage8
 * @property {HTMLImageElement|null} stage9
 * @property {HTMLImageElement|null} ratsheet
 * @property {HTMLImageElement|null} rhinosheet
 * @property {HTMLImageElement|null} dragonhumansheet
 */
