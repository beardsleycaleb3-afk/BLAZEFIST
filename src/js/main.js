// src/js/main.js
// ════════════════════════════════════════════════════════════
//  tapout — Entry point
//
//  Imports every module, initialises subsystems in order, and
//  owns the round/scene lifecycle.
//
//  Lifecycle:
//    DOMContentLoaded → boot()
//      → loadAll()           (loader.js)
//      → initInput()         (input.js)
//      → GameLoop.start()    (gameloop.js)
//        → update(dt) every fixed tick
//        → render()   every RAF frame
//      → round win → nextRound() → new Enemy, heal player, new Stage
//      → game over  → reset()   → new Fighter + Enemy
// ════════════════════════════════════════════════════════════

import { loadAll }                   from './src/js/loader.js';
import { initInput, destroyInput }   from './src/js/input.js';
import { Fighter }                   from './src/js/fighter.js';
import { Enemy }                     from './src/js/enemy.js';
import { Stage }                     from './src/js/stage.js';
import { Renderer }                  from './src/js/renderer.js';
import { GameLoop }                  from './src/js/gameloop.js';
import { GameState, Scene }          from './src/js/state.js';
import { drawHUD }                   from './src/js/hud.js';
import { DESIGN, COMBAT }            from './src/js/config.js';

// ════════════════════════════════════════════════════════════
async function boot() {
  // ── DOM refs ─────────────────────────────────────────────
  const canvas   = document.getElementById('gameCanvas');
  const loadBar  = document.getElementById('loadBar');
  const loadText = document.getElementById('loadText');
  const loadScr  = document.getElementById('loadScreen');
  const uiRound  = document.getElementById('uiRound');
  const uiScore  = document.getElementById('uiScore');
  const uiFps    = document.getElementById('uiFps');
  const dpadEl   = document.getElementById('dpad');
  const meleeEl  = document.getElementById('btnMelee');
  const runEl    = document.getElementById('btnRun');

  // ── Renderer ─────────────────────────────────────────────
  const renderer = new Renderer(canvas);
  renderer.resize();
  window.addEventListener('resize', () => renderer.resize(), { passive: true });
  window.visualViewport?.addEventListener('resize', () => renderer.resize(), { passive: true });

  const ctx = renderer.context;

  // ── Load assets ──────────────────────────────────────────
  const assets = await loadAll((p) => {
    if (loadBar)  loadBar.style.width   = `${Math.round(p * 100)}%`;
    if (loadText) loadText.textContent  = `Loading… ${Math.round(p * 100)}%`;
  });

  // Hide loading screen
  if (loadScr) loadScr.style.display = 'none';

  // ── Game objects ─────────────────────────────────────────
  const gstate = new GameState();
  const stage  = new Stage();
  let   player = new Fighter(DESIGN.w * 0.25);
  let   enemy  = new Enemy(DESIGN.w * 0.75);
  let   transitioning = false;

  gstate.scene = Scene.FIGHT;
  stage.load(gstate.stageIdx, assets);

  // ── Input ────────────────────────────────────────────────
  initInput({ dpad: dpadEl, melee: meleeEl, run: runEl });

  // ═══════════════════════════════════════════════════════
  //  UPDATE  (fixed timestep — called N times per frame)
  // ═══════════════════════════════════════════════════════
  function update(dt) {
    gstate.update(dt);

    if (gstate.scene === Scene.PAUSE) return;
    if (gstate.scene !== Scene.FIGHT) {
      // Still animate during WIN/LOSE hold
      if (!transitioning) return;
      player.animator.update(dt);
      enemy.update(dt, player.x);
      return;
    }

    // ── Tick entities ───────────────────────────────────
    player.update(dt);
    enemy.update(dt, player.x);

    // ── Player → Enemy collision ────────────────────────
    if (player.swingActive && !player.swingHit && enemy.alive) {
      const dist = Math.abs(player.x - enemy.x);
      if (dist < COMBAT.PLAYER_REACH) {
        player.swingHit = true;                  // one hit per swing
        enemy.takeDamage(COMBAT.PLAYER_DMG);
        gstate.registerHit(COMBAT.PLAYER_DMG);
      }
    }

    // ── Enemy → Player collision ────────────────────────
    if (enemy.isAttacking && player.alive) {
      const dist = Math.abs(enemy.x - player.x);
      if (dist < COMBAT.ENEMY_REACH) {
        player.takeDamage(COMBAT.ENEMY_DMG);
        enemy.suppressAttack(1000); // prevent rapid spam
      }
    }

    // ── Win condition ───────────────────────────────────
    if (!enemy.alive && !transitioning) {
      transitioning = true;
      gstate.scene  = Scene.WIN;
      player.animator.play('victory', { loop: false });

      setTimeout(() => {
        gstate.nextRound();
        enemy  = new Enemy(DESIGN.w * 0.75);
        player.hp = Math.min(player.maxHp, player.hp + COMBAT.HEAL_ON_WIN);
        stage.load(gstate.stageIdx, assets);
        transitioning = false;
      }, COMBAT.WIN_PAUSE);
    }

    // ── Lose condition ──────────────────────────────────
    if (!player.alive && gstate.scene === Scene.FIGHT) {
      gstate.scene = Scene.LOSE;
    }
  }

  // ═══════════════════════════════════════════════════════
  //  RENDER  (once per animation frame)
  // ═══════════════════════════════════════════════════════
  function render() {
    // Clear to transparent (canvas has alpha:false so black)
    ctx.clearRect(0, 0, DESIGN.w, DESIGN.h);

    // Stage → enemies → player → HUD (painter's order)
    stage.draw(ctx);
    enemy.draw(ctx, assets);
    player.draw(ctx, assets);
    drawHUD(ctx, player, enemy, gstate.score, gstate.combo, gstate.round);

    // ── Scene overlays ──────────────────────────────────
    if (gstate.scene === Scene.WIN) {
      ctx.fillStyle = 'rgba(0,0,0,0.38)';
      ctx.fillRect(0, 0, DESIGN.w, DESIGN.h);

      ctx.save();
      ctx.textAlign    = 'center';
      ctx.font         = 'bold 36px monospace';
      ctx.fillStyle    = '#7ef0a7';
      ctx.shadowColor  = '#00ff88';
      ctx.shadowBlur   = 14;
      ctx.fillText('K.O.!', DESIGN.w * 0.5, DESIGN.h * 0.5);
      ctx.restore();
    }

    if (gstate.scene === Scene.LOSE) {
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.fillRect(0, 0, DESIGN.w, DESIGN.h);

      ctx.save();
      ctx.textAlign = 'center';
      ctx.font      = 'bold 28px monospace';
      ctx.fillStyle = '#ff5d73';
      ctx.fillText('YOU LOSE', DESIGN.w * 0.5, DESIGN.h * 0.5 - 12);
      ctx.font      = '12px monospace';
      ctx.fillStyle = '#9aa4c7';
      ctx.fillText(`SCORE  ${gstate.score}`, DESIGN.w * 0.5, DESIGN.h * 0.5 + 12);
      ctx.font      = '10px monospace';
      ctx.fillStyle = '#6272a4';
      ctx.fillText('touch to restart', DESIGN.w * 0.5, DESIGN.h * 0.5 + 30);
      ctx.restore();
    }

    // ── DOM HUD chips ───────────────────────────────────
    if (uiRound) uiRound.textContent = gstate.round;
    if (uiScore) uiScore.textContent = gstate.score;
    if (uiFps)   uiFps.textContent   = loop.fps;
  }

  // ── Game-over restart (tap canvas on LOSE screen) ────
  canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (gstate.scene !== Scene.LOSE) return;

    // Full reset
    destroyInput();
    gstate.reset();
    player = new Fighter(DESIGN.w * 0.25);
    enemy  = new Enemy(DESIGN.w * 0.75);
    stage.load(gstate.stageIdx, assets);
    transitioning = false;
    initInput({ dpad: dpadEl, melee: meleeEl, run: runEl });
  }, { passive: false });

  // ── Start game loop ──────────────────────────────────
  const loop = new GameLoop(update, render);
  loop.start();
}

// ════════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  boot().catch((err) => {
    console.error('[fight] boot failed:', err);
    const lt = document.getElementById('loadText');
    if (lt) lt.textContent = `Boot error: ${err.message}`;
  });
});
