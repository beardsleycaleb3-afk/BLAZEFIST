// src/enemy.js
// ════════════════════════════════════════════════════════════
//  tapout — CPU-controlled Enemy
//  Sprite set: assets/sprites/fighter/east/
//
//  Full animation lifecycle:
//    idle → walk → [attack] → takehit → die → getup
//    Special: fireball (ranged), transform (power-up tier 2)
//
//  AI logic:
//   • Approaches player until within APPROACH_DIST
//   • Fires random move from MOVE_SET on attack timer
//   • Uses ranged moves (fireball/throw) at distance
//   • Hit reaction interrupts current action
//   • isAttacking getter exposes hitbox state to main.js
// ════════════════════════════════════════════════════════════

import { DESIGN, PHYSICS } from './config.js';
import { Animator }        from './animator.js';

// ── AI constants ──────────────────────────────────────────────
const WALK_SPD      = 1.3;
const APPROACH_DIST = 85;   // px  — stop approaching inside this
const ATTACK_RATE   = 2000; // ms  — base interval between attacks
const ATTACK_VAR    = 800;  // ms  — random variance on top
const HIT_FLASH_MS  = 200;  // ms  — blink duration on takehit

// Attack pools
const MELEE_SET  = ['jab', 'cross', 'kick', 'uppercut'];
const RANGED_SET = ['fireball', 'throw'];
const RANGED_PROB = 0.28;   // chance of ranged move when far

export class Enemy {
  /**
   * @param {number} startX  Initial X in design coords
   */
  constructor(startX) {
    // ── Transform ───────────────────────────────────────
    this.x           = startX;
    this.y           = PHYSICS.FLOOR_Y;
    this.w           = 52;
    this.h           = 84;
    this.vy          = 0;
    this.onGround    = true;
    this.facingRight = false;

    // ── Stats ────────────────────────────────────────────
    this.hp    = 100;
    this.maxHp = 100;
    this.alive = true;

    // ── AI state ─────────────────────────────────────────
    this._atkTimer  = 1400;  // stagger first attack slightly
    this._attacking = false;
    this._hitFlash  = 0;

    // ── Animation ────────────────────────────────────────
    this.animator = new Animator('enemy');
    this.animator.play('idle');
  }

  // ── Getters ────────────────────────────────────────────

  /** True when the enemy's hitbox is open (read by main.js) */
  get isAttacking() { return this._attacking; }

  // ── Update ─────────────────────────────────────────────

  /**
   * @param {number} dt       Fixed timestep ms
   * @param {number} playerX  Player X for AI targeting
   */
  update(dt, playerX) {
    this._hitFlash = Math.max(0, this._hitFlash - dt);

    if (!this.alive) {
      this.animator.update(dt);
      return;
    }

    const dx   = playerX - this.x;
    const dist = Math.abs(dx);
    this.facingRight = dx > 0;

    // ── Attack timer ──────────────────────────────────────
    if (!this._attacking) {
      this._atkTimer = Math.max(0, this._atkTimer - dt);

      if (this._atkTimer === 0) {
        // Reset timer before playing so next tick doesn't re-fire
        this._atkTimer = ATTACK_RATE + Math.random() * ATTACK_VAR;

        const useRanged = dist > APPROACH_DIST * 1.5 && Math.random() < RANGED_PROB;
        const pool = useRanged ? RANGED_SET : MELEE_SET;
        const move = pool[Math.floor(Math.random() * pool.length)];

        this._attacking = true;
        this.animator.play(move, {
          loop:     false,
          force:    true,
          onFinish: () => {
            this._attacking = false;
            this.animator.play('idle');
          },
        });
      }
    }

    // ── Movement — only when idle ─────────────────────────
    if (!this._attacking) {
      if (dist > APPROACH_DIST) {
        this.x += Math.sign(dx) * WALK_SPD;
        this.animator.play('walk');
      } else {
        this.animator.play('idle');
      }
    }

    // Clamp to stage bounds
    this.x = Math.max(this.w * 0.5, Math.min(DESIGN.w - this.w * 0.5, this.x));

    this.animator.update(dt);
  }

  // ── Combat ─────────────────────────────────────────────

  /**
   * @param {number} amount
   */
  takeDamage(amount) {
    if (!this.alive) return;

    this.hp        = Math.max(0, this.hp - amount);
    this._hitFlash = HIT_FLASH_MS;

    if (this.hp === 0) {
      this.alive      = false;
      this._attacking = false;
      this.animator.play('die', { loop: false });
    } else {
      // Interrupt current action with takehit
      this._attacking = true;
      this.animator.play('takehit', {
        loop:     false,
        force:    true,
        onFinish: () => {
          this._attacking = false;
          this.animator.play('idle');
        },
      });
    }
  }

  /**
   * Suppress enemy attacks briefly (used by main.js to prevent spam damage).
   * @param {number} minMs  minimum ms to extend timer to
   */
  suppressAttack(minMs) {
    this._atkTimer = Math.max(this._atkTimer, minMs);
  }

  // ── Draw ───────────────────────────────────────────────

  /**
   * @param {CanvasRenderingContext2D} ctx
   * @param {import('./loader.js').GameAssets} assets
   */
  draw(ctx, assets) {
    // Hit flash — skip draw on odd 40ms slices
    if (this._hitFlash > 0 && Math.floor(this._hitFlash / 40) % 2 === 1) return;

    const img   = this.animator.getFrame(assets);
    const drawX = this.x - this.w * 0.5;
    const drawY = this.y - this.h;

    if (!img) {
      // Placeholder rect when frames haven't loaded
      ctx.fillStyle = this.alive ? '#ff9f43' : '#555566';
      ctx.fillRect(drawX, drawY, this.w, this.h);
      return;
    }

    ctx.save();
    if (!this.facingRight) {
      ctx.translate(this.x, drawY + this.h * 0.5);
      ctx.scale(-1, 1);
      ctx.drawImage(img, -this.w * 0.5, -this.h * 0.5, this.w, this.h);
    } else {
      ctx.drawImage(img, drawX, drawY, this.w, this.h);
    }
    ctx.restore();
  }
}
