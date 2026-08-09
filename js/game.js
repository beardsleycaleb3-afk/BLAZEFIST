// ┌──────────────────────────────────────────────────────┐
// │  game.js — Game loop, state machine, combat          │
// │                                                       │
// │  MELEE combo chain (380ms window per hit):           │
// │    tap 1 → JAB        (fast, +8 blaze)               │
// │    tap 2 → CROSS      (+13)                          │
// │    tap 3 → PUNCH      (+16)                          │
// │    tap 4 → UPPERCUT   (+20)                          │
// │    tap 5 → HEADBUTT   (+18)  alternating with        │
// │    tap 6 → ROUNDHOUSE (+22)                          │
// │                                                       │
// │  Fire mode (blaze=100):                               │
// │    MELEE          → cycles scene_fire1-4             │
// │    RUN + MELEE    → scene_tiger → scene_ultimate     │
// └──────────────────────────────────────────────────────┘

const W = 280, H = 280;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// Combo sequence for normal mode
const COMBO_CHAIN = ['jab','cross','punch','uppercut','headbutt','roundhouse'];
// Fire scene cycle
const FIRE_SCENES = ['scene_fire1','scene_fire2','scene_fire3','scene_fire4'];

export class Game {
  constructor(player, enemy, renderer, hud, animDefs, enemyDefs) {
    this.player    = player;
    this.enemy     = enemy;
    this.renderer  = renderer;
    this.hud       = hud;
    this.animDefs  = animDefs;
    this.enemyDefs = enemyDefs;

    this.active      = false;
    this.paused      = false;
    this.score       = 0;
    this.timerVal    = 99;
    this._timerInt   = null;
    this._rafId      = null;
    this._last       = 0;

    // Scene state
    this._sceneActive = false;
    this._sceneDmg    = 0;
    this._sceneHit    = false;
    this._queuedScene = null;
    this._queuedDmg   = 0;

    this.input = { left:false, right:false, run:false, duck:false };
  }


  // ── Round start / reset ───────────────────────────
  startRound() {
    const P = this.player, E = this.enemy;

    P.x=70; P.y=222; P.groundY=222; P.hp=100; P.blaze=0;
    P.vx=0; P.jumpVy=0; P.grounded=true; P.facing=1;
    P.state='idle'; P.frame=0; P.frameT=0;
    P.fireMode=false; P.attacking=false; P.stun=0;
    P.comboStep=0; P.comboT=0; P.fireIdx=0; P._ducking=false;

    E.x=210; E.y=222; E.hp=100; E.vx=0;
    E.state='walk'; E.frame=0; E.frameT=0;
    E.stun=0; E.atkTimer=0; E.facing=-1;

    this.score=0; this.timerVal=99;
    this.active=true; this.paused=false;
    this._sceneActive=false; this._sceneHit=false;
    this.input = { left:false, right:false, run:false, duck:false };

    this.renderer.endScene();
    this.hud.reset();
    this.hud.updateAll(P, E, this.score, this.timerVal);

    clearInterval(this._timerInt);
    this._timerInt = setInterval(() => {
      if (!this.active) return;
      this.timerVal--;
      this.hud.setTimer(this.timerVal);
      if (this.timerVal <= 0)
        this._ko(this.player.hp > this.enemy.hp ? 'player' : 'enemy');
    }, 1000);

    this._last = performance.now();
    cancelAnimationFrame(this._rafId);
    this._rafId = requestAnimationFrame(ts => this._loop(ts));
  }

  // ── Loop ──────────────────────────────────────────
  _loop(ts) {
    if (!this.active) return;
    const dt = Math.min(ts - this._last, 50);
    this._last = ts;
    this._update(dt);
    this.renderer.draw(this.player, this.enemy, this.player.fireMode);
    this._rafId = requestAnimationFrame(ts => this._loop(ts));
  }

  _update(dt) {
    const P = this.player, E = this.enemy;

    // Scene is playing — video plays itself, check for end
    if (this._sceneActive) {
      if (!this._sceneHit) {
        // Deal damage at ~60% through the video duration
        const v = this.renderer._cutscene?.videoEl;
        if (v && v.duration && v.currentTime >= v.duration * 0.6) {
          this._sceneHit = true;
          this._dealSceneDamage(this._sceneDmg);
        }
      }
      // Scene ends when video ends
      const v = this.renderer._cutscene?.videoEl;
      if (v && v.ended) this._endScene();
      return;
    }

    if (this.paused) return;

    if (P.fireMode) {
      P.blaze = Math.max(0, P.blaze - dt * 0.0012 * 100);
      if (P.blaze <= 0) this._deactivateFire();
    }

    this._movePlayer(dt);
    P.tickAnim(dt, this.animDefs);
    P.tickGravity(dt);
    this._updateEnemy(dt);
    E.tickAnim(dt, this.enemyDefs);
    this.hud.updateAll(P, E, this.score, this.timerVal);
  }

  // ── Movement ──────────────────────────────────────
  _movePlayer(dt) {
    const P = this.player, inp = this.input;
    if (P.stun > 0) { P.stun -= dt; return; }
    if (P.attacking) return;

    P._ducking = inp.duck;
    P.groundY  = inp.duck ? 236 : 222;

    if (inp.left || inp.right) {
      const spd  = inp.run ? 2.5 : 1.4;
      P.vx       = inp.left ? -spd : spd;
      P.facing   = inp.left ? -1 : 1;
      P.state    = inp.run ? 'run' : 'walk';
    } else {
      P.vx    = 0;
      P.state = 'idle';
    }
    P.x = clamp(P.x + P.vx, 22, W - 22);
  }

  // ── Enemy AI ─────────────────────────────────────
  _updateEnemy(dt) {
    const E = this.enemy, P = this.player;
    if (E.stun > 0) { E.stun -= dt; E.state = 'stun'; return; }

    const dx = P.x - E.x, dist = Math.abs(dx);
    E.facing = dx < 0 ? 1 : -1;
    E.state  = 'walk';
    if (dist > 82) E.x += Math.sign(dx) * (0.95 * dt / 16);
    E.x = clamp(E.x, 22, W - 22);

    E.atkTimer += dt;
    if (dist < 92 && E.atkTimer >= E.atkCooldown) {
      E.atkTimer = 0;
      this._enemySwing();
    }
  }

  _enemySwing() {
    const P = this.player, E = this.enemy;
    if (Math.abs(P.x - E.x) > 96 || P.attacking) return;
    E.state = 'atk';
    const dmg  = Math.round((7 + Math.floor(Math.random() * 8)) * (P._ducking ? 0.35 : 1));
    const dead = P.hit(dmg, P._ducking ? 140 : 270);
    this.hud.spawnDamage(P.x, P.y - 88, dmg, false);
    if (dead) this._ko('enemy');
  }

  // ── Input handlers ────────────────────────────────
  onLeft(on)  { this.input.left  = on; }
  onRight(on) { this.input.right = on; }
  onRun(on)   { this.input.run   = on; }
  onDuck(on)  { this.input.duck  = on; }
  onJump()    {
    if (this.active && !this._sceneActive) this.player.jump();
  }

  // ── MELEE — core action ───────────────────────────
  onMelee() {
    const P = this.player;
    if (!this.active || P.stun > 0 || this._sceneActive) return;

    if (P.fireMode) {
      if (this.input.run && P.blaze >= 68) {
        // ── ULTIMATE ──
        this.hud.showCombo('🔥 TIGER ULTIMATE! 🔥', '#FFD600');
        this._startScene('scene_tiger', 55);
        P.blaze = 12;
        // Chain ultimate after tiger ends (handled via video end + queue)
        this._queuedScene = 'scene_ultimate';
        this._queuedDmg   = 78;
      } else {
        // ── Fire combo cycle ──
        P.fireIdx = (P.fireIdx + 1) % FIRE_SCENES.length;
        const sk  = FIRE_SCENES[P.fireIdx];
        const def = this.animDefs[sk];
        this.hud.showCombo(['FIRE STORM!','INFERNO!','BLAZE SLAM!','INFERNO BARRAGE!'][P.fireIdx], '#FF6B00');
        this._startScene(sk, def.dmg);
      }
    } else {
      // ── Normal combo chain ──
      const now = Date.now();
      if (now - P.comboT > 400) P.comboStep = 0;
      P.comboT = now;

      const step   = P.comboStep % COMBO_CHAIN.length;
      const action = COMBO_CHAIN[step];
      P.comboStep++;

      const def    = this.animDefs[action];
      const labels = ['JAB!','CROSS!','PUNCH!','UPPERCUT!','HEADBUTT!','ROUNDHOUSE!'];
      const colors = ['#FFD600','#FF9900','#FF6600','#FF3300','#FF1A00','#CC0000'];
      this.hud.showCombo(labels[step], colors[step]);

      this._meleeAttack(action, def.dmg, this.input.run ? 1.3 : 1.0);
    }
  }

  // ── Fighter-mode attack ───────────────────────────
  _meleeAttack(action, baseDmg, mult = 1) {
    const P   = this.player;
    P.state   = action; P.frame = 0; P.frameT = 0;
    P.attacking = true;
    const def = this.animDefs[action];
    const dur = (def.frameCount || 6) / def.fps * 1000;

    setTimeout(() => {
      if (!P.attacking) return;
      const ax = P.facing > 0 ? P.x + 18 : P.x - 66;
      const E  = this.enemy;
      if (ax < E.x+42 && ax+64 > E.x-42 && E.y-120 < P.y && E.y > P.y-120) {
        const d    = Math.round(baseDmg * mult * (0.88 + Math.random() * 0.28));
        const dead = E.hit(d, 340);
        this.score += d * 10;
        const blazeGain = this.animDefs[action].blaze || baseDmg;
        this._addBlaze(blazeGain);
        this.hud.spawnDamage(E.x, E.y - 100, d, false);
        if (!P.fireMode && P.blaze >= 100) this._activateFire();
        if (dead) this._ko('player');
      }
    }, dur * 0.48);

    setTimeout(() => {
      P.attacking = false;
      P.state     = 'idle';
    }, dur);
  }

  // ── Scene-mode (video) special ────────────────────
  _startScene(sceneKey, dmg) {
    if (this._sceneActive) return;
    const ok = this.renderer.startScene(sceneKey);
    if (!ok) {
      // Fallback to fighter attack if video unavailable
      this._meleeAttack('headbutt', dmg, 1);
      return;
    }
    this._sceneActive  = true;
    this._sceneDmg     = dmg;
    this._sceneHit     = false;
    this.paused        = true;
    this.hud.setCutscene(true);
  }

  _dealSceneDamage(dmg) {
    const d    = Math.round(dmg * (0.84 + Math.random() * 0.32));
    const dead = this.enemy.hit(d, 900);
    this.score += d * 16;
    this.hud.spawnDamage(this.enemy.x, this.enemy.y - 100, d, true);
    this.hud.flash();
    this.hud.shake();
    this.hud.updateAll(this.player, this.enemy, this.score, this.timerVal);
    if (dead) setTimeout(() => this._ko('player'), 600);
  }

  _endScene() {
    this._sceneActive = false;
    this.paused       = false;
    this.renderer.endScene();
    this.hud.setCutscene(false);
    this.player.attacking = false;
    this.player.state     = 'idle';

    // Chain queued scene (ultimate after tiger)
    if (this._queuedScene && this.enemy.hp > 0) {
      const qs = this._queuedScene, qd = this._queuedDmg;
      this._queuedScene = null; this._queuedDmg = 0;
      setTimeout(() => this._startScene(qs, qd), 300);
    }
  }

  // ── Fire mode ─────────────────────────────────────
  _addBlaze(v) { this.player.blaze = Math.min(100, this.player.blaze + v); }

  _activateFire() {
    const P = this.player;
    P.fireMode = true; P.blaze = 100; P.state = 'idle';
    this.hud.flash(); this.hud.shake();
    this.hud.showCombo('🔥 FIRE MODE! 🔥', '#FF6B00');
    this.hud.setFireMode(true);
  }

  _deactivateFire() {
    this.player.fireMode = false; this.player.blaze = 0;
    this.hud.showCombo('FIRE FADED…', '#888');
    this.hud.setFireMode(false);
  }

  // ── KO ────────────────────────────────────────────
  _ko(winner) {
    this.active = false;
    clearInterval(this._timerInt);
    if (winner === 'player') {
      this.player.state = 'victory'; this.player.frame = 0;
    }
    const [title, sub] = winner === 'player'
      ? ['K·O!', '🏆  YOU WIN!']
      : ['K·O!', 'YOU LOST…  RETRY?'];
    setTimeout(() => this.hud.showKO(title, sub, () => this.startRound()), 800);
  }
}
