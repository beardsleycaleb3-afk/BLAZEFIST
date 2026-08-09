// ┌──────────────────────────────────────────────────┐
// │  main.js — entry point                           │
// │  Loads sprites, stages, videos, starts game      │
// └──────────────────────────────────────────────────┘

import { ANIM_DEFS, ENEMY_ANIM_DEFS,
         loadFighterSprites, loadStageBackground,
         preloadVideos }                from './sprites.js';
import { initInput }                    from './input.js';
import { Fighter }                      from './fighter.js';
import { Game }                         from './game.js';
import { Renderer }                     from './renderer.js';
import { HUD }                          from './ui.js';

const canvas = document.getElementById('game-canvas');
const ctx    = canvas.getContext('2d');
ctx.imageSmoothingEnabled = true;
ctx.imageSmoothingQuality = 'high';

// Canvas is always 280×280 logical pixels,
// CSS scales it to fill the monitor content area.
function fitCanvas() {
  const mon  = document.getElementById('monitor-content');
  const rect = mon.getBoundingClientRect();
  canvas.style.width  = rect.width  + 'px';
  canvas.style.height = rect.height + 'px';
}
fitCanvas();
window.addEventListener('resize', fitCanvas);

// ── Boot ──────────────────────────────────────────
(async () => {
  const hud = new HUD();
  hud.showLoading();

  // Load fighter PNG frames + stage 1 BG + video elements in parallel
  const [sprites, stageBg, videos] = await Promise.all([
    loadFighterSprites(),
    loadStageBackground(1),
    Promise.resolve(preloadVideos()),
  ]);

  const player   = new Fighter('player', 70, 222);
  const enemy    = new Fighter('enemy', 210, 222);
  const renderer = new Renderer(ctx, sprites, ANIM_DEFS, ENEMY_ANIM_DEFS, videos);
  const game     = new Game(player, enemy, renderer, hud, ANIM_DEFS, ENEMY_ANIM_DEFS);

  renderer.setStage(stageBg, 1);
  initInput(game);

  hud.showTitle(() => game.startRound());
})();
