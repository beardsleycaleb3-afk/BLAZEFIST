// ┌──────────────────────────────────────────────────┐
// │  fighter.js — Fighter entity                     │
// │  Holds position, HP, anim state, physics         │
// └──────────────────────────────────────────────────┘

import { ACTIONS } from './sprites.js';

export class Fighter {
  constructor(role, x, y) {
    this.role     = role;
    this.x        = x;
    this.y        = y;
    this.groundY  = y;

    this.hp       = 100;
    this.maxHp    = 100;

    this.vx       = 0;
    this.facing   = role === 'player' ? 1 : -1;
    this.jumpVy   = 0;
    this.grounded = true;

    this.state    = role === 'player' ? 'idle' : 'walk';
    this.frame    = 0;
    this.frameT   = 0;

    this.attacking  = false;
    this.stun       = 0;
    this._ducking   = false;

    // Player-only
    this.blaze      = 0;
    this.maxBlaze   = 100;
    this.fireMode   = false;
    this.comboStep  = 0;
    this.comboT     = 0;
    this.fireIdx    = 0;

    // Enemy-only
    this.atkTimer   = 0;
    this.atkCooldown = 2700;
  }

  // Advance frame counter
  tickAnim(dt, defs) {
    const def    = defs[this.state] || defs['idle'] || defs['walk'];
    if (!def) return;
    this.frameT += dt;
    const ft     = 1000 / def.fps;
    if (this.frameT >= ft) {
      this.frameT = 0;
      this.frame++;
      // Frame count from ACTIONS map via def.action lookup
      let total = ACTIONS[def.action] ?? 8;
      if (this.frame >= total) {
        this.frame = def.loop ? 0 : total - 1;
      }
    }
  }

  setState(s) {
    if (this.state === s) return;
    this.state  = s;
    this.frame  = 0;
    this.frameT = 0;
  }

  hit(dmg, stunMs) {
    this.hp   = Math.max(0, this.hp - dmg);
    this.stun = stunMs;
    return this.hp <= 0;
  }

  jump() {
    if (!this.grounded || this._ducking) return;
    this.jumpVy  = -13;
    this.grounded = false;
    this.setState('jump');
  }

  tickGravity(dt) {
    if (this.grounded) return;
    this.jumpVy += 0.52 * (dt / 16);
    this.y      += this.jumpVy;
    if (this.y >= this.groundY) {
      this.y        = this.groundY;
      this.jumpVy   = 0;
      this.grounded = true;
      if (this.state === 'jump') this.setState('idle');
    }
  }
}
