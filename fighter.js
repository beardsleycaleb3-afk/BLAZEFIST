// src/fighter.js
// ════════════════════════════════════════════════════════════
//  tapout — Player-controlled Fighter
//  Sprite set: assets/sprites/fighter/flaming/east/
//
//  Combat:
//   • Melee button fires a 3-hit combo chain: jab → cross → kick
//   • Each swing has a COMBO_WINDOW to land the next link
//   • swingActive / swingHit flags expose hitbox state to main.js
//   • Run button doubles movement speed
//  Physics:
//   • Up (dpad north) triggers jump with gravity arc
//   • Floor clamp at PHYSICS.FLOOR_Y
//   • Horizontal clamp to stage bounds
// ════════════════════════════════════════════════════════════

import { DESIGN, PHYSICS, COMBAT } from './config.js';
import { Animator }                from './animator.js';
import { InputState, consumeJustPressed } from './input.js';

export class Fighter {
  /**
   * @param {number} startX  Initial X in design coords
   */
  constructor(startX) {
    // ── Transform ───────────────────────────────────────
    this.x           = startX;
    this.y           = PHYSICS.FLOOR_Y;
    this.w           = 48;
    this.h           = 80;
    this.vy          = 0;
    this.onGround    = true;
    this.facingRight = true;

    // ── Stats ────────────────────────────────────────────
    this.hp    = 100;
    this.maxHp = 100;
    this.alive = true;

    // ── Combat state ─────────────────────────────────────
    this.comboIdx    = 0;
    this.comboTimer  = 0;     // ms until combo chain resets
    this.attackLock  = 0;     // ms remaining in attack animation
    this.swingActive = false; // hitbox is open (read by main.js)
    this.swingHit    = false; // already connected this swing

    // ── Animation ────────────────────────────────────────
    this.animator = new Animator('player');
    this.animator.play('idle');
  }

  // ── Update ─────────────────────────────────────────────

  /**
   * @param {number} dt  Fixed timestep in ms
   */
  update(dt) {
    if (!this.alive) {
      this.animator.update(dt);
      return;
    }

    // Tick cooldowns
    this.attackLock = Math.max(0, this.attackLock - dt);
    this.comboTimer = Math.max(0, this.comboTimer - dt);
    if (this.comboTimer === 0) this.comboIdx = 0;

    // Snapshot input — read before consuming just-pressed
    const meleeJP  = InputState.meleeJP;
    const isRun    = InputState.run;
    const goLeft   = InputState.left;
    const goRight  = InputState.right;
    const goUp     = InputState.up;
    consumeJustPressed();  // clear one-shot flags

    // ── Attack ────────────────────────────────────────────
    if (meleeJP && this.attackLock === 0) {
      const move = COMBAT.COMBO_SEQ[this.comboIdx % COMBAT.COMBO_SEQ.length];
      this.comboIdx++;
      this.comboTimer   = COMBAT.COMBO_WINDOW;
      this.attackLock   = COMBAT.ATTACK_DUR;
      this.swingActive  = true;
      this.swingHit     = false;

      this.animator.play(move, {
        loop:     false,
        force:    true,
        onFinish: () => {
          this.swingActive = false;
          this.animator.play('idle');
        },
      });
      this.animator.update(dt);
      return; // skip movement frame during attack trigger
    }

    // ── Jump ──────────────────────────────────────────────
    if (goUp && this.onGround && this.attackLock === 0) {
      this.vy       = PHYSICS.JUMP_VEL;
      this.onGround = false;
      this.animator.play('jump', {
        loop:     false,
        onFinish: () => this.animator.play('idle'),
      });
    }

    // ── Horizontal movement ───────────────────────────────
    if (this.attackLock === 0) {
      const spd = isRun ? PHYSICS.RUN_SPD : PHYSICS.WALK_SPD;
      if (goRight) { this.x += spd; this.facingRight = true;  }
      if (goLeft)  { this.x -= spd; this.facingRight = false; }
    }

    // ── Gravity + floor ───────────────────────────────────
    if (!this.onGround) {
      this.vy += PHYSICS.GRAVITY;
      this.y  += this.vy;
      if (this.y >= PHYSICS.FLOOR_Y) {
        this.y        = PHYSICS.FLOOR_Y;
        this.vy       = 0;
        this.onGround = true;
      }
    }

    // Clamp to stage
    this.x = Math.max(this.w * 0.5, Math.min(DESIGN.w - this.w * 0.5, this.x));

    // ── Animation selection ───────────────────────────────
    if (this.attackLock === 0) {
      if (!this.onGround) {
        this.animator.play('jump');
      } else if (goLeft || goRight) {
        this.animator.play(isRun ? 'run' : 'walk');
      } else {
        this.animator.play('idle');
      }
    }

    this.animator.update(dt);
  }

  // ── Combat ─────────────────────────────────────────────

  /**
   * @param {number} amount
   */
  takeDamage(amount) {
    if (!this.alive) return;
    this.hp = Math.max(0, this.hp - amount);
    if (this.hp === 0) this.alive = false;
  }

  // ── Draw ───────────────────────────────────────────────

  /**
   * @param {CanvasRenderingContext2D} ctx
   * @param {import('./loader.js').GameAssets} assets
   */
  draw(ctx, assets) {
    const img  = this.animator.getFrame(assets);
    const drawX = this.x - this.w * 0.5;
    const drawY = this.y - this.h;

    if (!img) {
      // Placeholder rect when frames haven't loaded
      ctx.fillStyle = '#5ad1ff';
      ctx.fillRect(drawX, drawY, this.w, this.h);
      return;
    }

    ctx.save();
    if (!this.facingRight) {
      // Flip horizontally around sprite centre
      ctx.translate(this.x, drawY + this.h * 0.5);
      ctx.scale(-1, 1);
      ctx.drawImage(img, -this.w * 0.5, -this.h * 0.5, this.w, this.h);
    } else {
      ctx.drawImage(img, drawX, drawY, this.w, this.h);
    }
    ctx.restore();
  }
}
