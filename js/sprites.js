// ┌─────────────────────────────────────────────────────┐
// │  sprites.js                                          │
// │  Loads fighter PNG frames from canonical repo paths  │
// │  Creates video elements for scene-mode MP4 specials  │
// └─────────────────────────────────────────────────────┘

const FIGHTER_BASE = './assets/sprites/fighter/flaming/east/';
const VIDEO_BASE   = './assets/sprites/fighter/flaming/';
const STAGE_BASE   = './assets/sprites/stages/backgrounds/';

// ── Action → frame count (matches actual repo PNGs) ───
export const ACTIONS = {
  idle:       8,
  walk:       8,
  run:        8,
  jump:       8,
  jab:        3,
  cross:      6,
  punch:      6,
  kick:       6,
  uppercut:   7,
  headbutt:  11,
  roundhouse: 7,
  victory:   13,
};

// ── ANIM_DEFS ─────────────────────────────────────────
// mode:'fighter'  → draw sprite at fighter position
// mode:'scene'    → play fullscreen video overlay
export const ANIM_DEFS = {
  // ── Idle / locomotion ─────────────────────────────
  idle:       { action:'idle',       fps:8,  loop:true,  mode:'fighter' },
  walk:       { action:'walk',       fps:8,  loop:true,  mode:'fighter' },
  run:        { action:'run',        fps:12, loop:true,  mode:'fighter' },
  jump:       { action:'jump',       fps:10, loop:false, mode:'fighter' },

  // ── Normal attacks — combo chain ──────────────────
  // Melee tap 1:  JAB   (3 frames, blazeGain:8)
  // Melee tap 2:  CROSS (6 frames, blazeGain:13)
  // Melee tap 3:  PUNCH (6 frames, blazeGain:16)
  // Melee tap 4:  UPPERCUT (7 frames, blazeGain:20)
  // Melee tap 5+: HEADBUTT or ROUNDHOUSE alternating
  jab:        { action:'jab',        fps:16, loop:false, mode:'fighter', dmg:8,  blaze:8  },
  cross:      { action:'cross',      fps:14, loop:false, mode:'fighter', dmg:12, blaze:13 },
  punch:      { action:'punch',      fps:13, loop:false, mode:'fighter', dmg:15, blaze:16 },
  uppercut:   { action:'uppercut',   fps:14, loop:false, mode:'fighter', dmg:20, blaze:20 },
  headbutt:   { action:'headbutt',   fps:12, loop:false, mode:'fighter', dmg:18, blaze:18 },
  kick:       { action:'kick',       fps:12, loop:false, mode:'fighter', dmg:14, blaze:14 },
  roundhouse: { action:'roundhouse', fps:12, loop:false, mode:'fighter', dmg:22, blaze:22 },

  // ── Victory ───────────────────────────────────────
  victory:    { action:'victory',    fps:8,  loop:true,  mode:'fighter' },

  // ── Scene-mode specials (MP4 video) ───────────────
  // fire mode + single MELEE tap → cycles 1-4
  // fire mode + RUN + MELEE → tiger → ultimate
  scene_fire1:    { video:'fireset1',     fps:24, loop:false, mode:'scene', dmg:30 },
  scene_fire2:    { video:'fireset2',     fps:24, loop:false, mode:'scene', dmg:35 },
  scene_fire3:    { video:'fireset3',     fps:24, loop:false, mode:'scene', dmg:32 },
  scene_fire4:    { video:'fireset4',     fps:24, loop:false, mode:'scene', dmg:38 },
  scene_normal32: { video:'32hitnormal',  fps:24, loop:false, mode:'scene', dmg:45 },
  scene_tiger:    { video:'tigerset1',    fps:24, loop:false, mode:'scene', dmg:55 },
  scene_ultimate: { video:'ultimatetiger',fps:24, loop:false, mode:'scene', dmg:75 },
};

// ── Enemy anim defs (uses same player PNGs, hue-tinted) ──
export const ENEMY_ANIM_DEFS = {
  idle:  { action:'idle',  fps:6,  loop:true,  mode:'fighter' },
  walk:  { action:'walk',  fps:7,  loop:true,  mode:'fighter' },
  atk:   { action:'punch', fps:13, loop:false, mode:'fighter' },
  hurt:  { action:'jab',   fps:8,  loop:false, mode:'fighter' },
  stun:  { action:'idle',  fps:4,  loop:true,  mode:'fighter' },
};

// ── loadFighterSprites() ──────────────────────────────
// Returns { [action]: HTMLImageElement[] }
export async function loadFighterSprites() {
  const result = {};
  const jobs   = Object.entries(ACTIONS).map(async ([action, count]) => {
    const frames = await Promise.all(
      Array.from({ length: count }, (_, i) => {
        const n   = String(i).padStart(3, '0');
        const src = `${FIGHTER_BASE}${action}/frame_${n}.png`;
        return loadImage(src);
      })
    );
    result[action] = frames;
  });
  await Promise.all(jobs);
  return result;
}

// ── loadStageBackground(n) → HTMLImageElement ─────────
export function loadStageBackground(n) {
  return loadImage(`${STAGE_BASE}stage${n}.png`);
}

// ── preloadVideos() → { [key]: HTMLVideoElement } ─────
// Creates muted, hidden video elements for each scene MP4
export function preloadVideos() {
  const videos = {};
  const videoKeys = {
    fireset1:     'scene_fire1',
    fireset2:     'scene_fire2',
    fireset3:     'scene_fire3',
    fireset4:     'scene_fire4',
    '32hitnormal':'scene_normal32',
    tigerset1:    'scene_tiger',
    ultimatetiger:'scene_ultimate',
  };
  Object.entries(videoKeys).forEach(([file, key]) => {
    const v       = document.createElement('video');
    v.src         = `${VIDEO_BASE}${file}.mp4`;
    v.muted       = true;
    v.playsInline = true;
    v.preload     = 'metadata';
    v.style.display = 'none';
    document.body.appendChild(v);
    videos[key] = v;
  });
  return videos;
}

// ── Util ──────────────────────────────────────────────
function loadImage(src) {
  return new Promise(resolve => {
    const img   = new Image();
    img.onload  = () => resolve(img);
    img.onerror = () => { console.warn('Missing:', src); resolve(null); };
    img.src     = src;
  });
}
