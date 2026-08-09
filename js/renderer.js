// ┌────────────────────────────────────────────────────┐
// │  renderer.js  — Canvas draw engine                 │
// │  fighter mode: draw PNG frame at entity position   │
// │  scene mode:   draw live video frame fullscreen    │
// └────────────────────────────────────────────────────┘

const W = 280, H = 280;

export class Renderer {
  constructor(ctx, sprites, animDefs, enemyDefs, videos) {
    this.ctx       = ctx;
    this.sprites   = sprites;   // { action: Image[] }
    this.animDefs  = animDefs;
    this.enemyDefs = enemyDefs;
    this.videos    = videos;    // { sceneKey: HTMLVideoElement }

    this.stageBg     = null;    // current stage HTMLImageElement
    this.stageIdx    = 1;

    this._particles  = this._mkParticles(32);
    this._cutscene   = null;    // { videoEl, startTime }
    this._sceneKey   = null;
  }

  setStage(img, idx) { this.stageBg = img; this.stageIdx = idx; }

  // ── Main draw call ────────────────────────────────
  draw(player, enemy, fireMode) {
    const c = this.ctx;
    c.clearRect(0, 0, W, H);

    if (this._cutscene) {
      this._drawScene();
    } else {
      this._drawBG(fireMode);
      this._drawGround(player, enemy);
      // Draw furthest-back entity first
      if (enemy.x > player.x) { this._drawEnemy(enemy, player); this._drawPlayer(player); }
      else                     { this._drawPlayer(player); this._drawEnemy(enemy, player); }
      if (fireMode) this._drawFireAura(player);
    }
    this._tickParticles(16, fireMode);
    if (!this._cutscene) this._drawParticles();
  }

  // ── Background ────────────────────────────────────
  _drawBG(fire) {
    const c = this.ctx;
    if (this.stageBg) {
      c.drawImage(this.stageBg, 0, 0, W, H);
      // Fire mode: warm overlay tint
      if (fire) {
        c.fillStyle = 'rgba(180,40,0,0.22)';
        c.fillRect(0, 0, W, H);
      }
    } else {
      const g = c.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, fire ? '#1a0200' : '#060010');
      g.addColorStop(1, '#000');
      c.fillStyle = g; c.fillRect(0, 0, W, H);
    }
    // CRT scanlines
    c.fillStyle = 'rgba(0,0,0,0.045)';
    for (let y = 0; y < H; y += 3) c.fillRect(0, y, W, 1);
  }

  _drawGround(player, enemy) {
    const c = this.ctx;
    // Ground line
    c.strokeStyle = 'rgba(255,107,0,0.2)';
    c.lineWidth   = 1;
    c.beginPath(); c.moveTo(0, 244); c.lineTo(W, 244); c.stroke();
    // Shadow ellipses under each fighter
    [player, enemy].forEach(f => {
      const sg = c.createRadialGradient(f.x, f.y + 4, 1, f.x, f.y + 4, 34);
      sg.addColorStop(0, 'rgba(0,0,0,0.4)');
      sg.addColorStop(1, 'transparent');
      c.fillStyle = sg;
      c.beginPath();
      c.ellipse(f.x, f.y + 4, 34, 8, 0, 0, Math.PI * 2);
      c.fill();
    });
  }

  // ── Fighter sprite draw ───────────────────────────
  _drawPlayer(player) {
    const def    = this.animDefs[player.state] || this.animDefs.idle;
    if (def.mode !== 'fighter') return;
    const frames = this.sprites[def.action];
    if (!frames?.length) { this._fallback(player.x, player.y, '#3366FF'); return; }

    const fi  = Math.min(player.frame, frames.length - 1);
    const img = frames[fi];
    this._blitSprite(img, player.x, player.y, player.facing, false, player.state === 'jump');
  }

  _drawEnemy(enemy, player) {
    const def    = this.enemyDefs[enemy.state] || this.enemyDefs.walk;
    const frames = this.sprites[def.action];
    if (!frames?.length) { this._fallback(enemy.x, enemy.y, '#AA2222'); return; }

    const fi      = Math.min(enemy.frame, frames.length - 1);
    const img     = frames[fi];
    const efacing = player.x < enemy.x ? -1 : 1;
    this._blitSprite(img, enemy.x, enemy.y, efacing, true, false);

    // Name tag
    const c = this.ctx;
    c.save();
    c.fillStyle = 'rgba(220,30,30,0.85)';
    c.font      = 'bold 6px "Press Start 2P"';
    c.textAlign = 'center';
    c.fillText('STREET TIGER', enemy.x, enemy.y - 118);
    c.restore();
  }

  _blitSprite(img, x, y, facing, enemyTint, jumping) {
    if (!img?.complete) return;
    const c      = this.ctx;
    // Source PNG is 1280×720, character roughly occupies left 45%
    const sx = 0, sy = 0, sw = 576, sh = 720;
    const dH = jumping ? 120 : 108;
    const dW = (sw / sh) * dH;

    c.save();
    if (enemyTint) c.filter = 'hue-rotate(165deg) saturate(1.6) brightness(0.9)';
    const drawY = jumping ? y - dH * 0.95 - 18 : y - dH * 0.9;
    if (facing < 0) {
      c.translate(x + dW * 0.12, 0);
      c.scale(-1, 1);
      c.drawImage(img, sx, sy, sw, sh, 0, drawY, dW, dH);
    } else {
      c.drawImage(img, sx, sy, sw, sh, x - dW * 0.12, drawY, dW, dH);
    }
    c.restore();
  }

  _fallback(x, y, color) {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(x - 18, y - 65, 36, 65);
  }

  // ── Fire aura glow (player in fire mode) ──────────
  _drawFireAura(player) {
    const c   = this.ctx;
    const t   = Date.now();
    const osc = 0.55 + 0.3 * Math.sin(t * 0.011);
    const fg  = c.createRadialGradient(player.x, player.y - 45, 5, player.x, player.y - 45, 62);
    fg.addColorStop(0, `rgba(255,140,0,${osc * 0.3})`);
    fg.addColorStop(1, 'transparent');
    c.fillStyle = fg;
    c.fillRect(player.x - 68, player.y - 112, 136, 118);
  }

  // ── Scene mode: live video frame on canvas ────────
  startScene(sceneKey) {
    const v = this.videos?.[sceneKey];
    if (!v) return false;
    v.currentTime = 0;
    v.play().catch(() => {});
    this._cutscene = { videoEl: v, key: sceneKey };
    this._sceneKey = sceneKey;
    return true;
  }

  tickScene() {
    // Called each frame — video plays itself, we just draw it
  }

  endScene() {
    if (this._cutscene?.videoEl) {
      this._cutscene.videoEl.pause();
      this._cutscene.videoEl.currentTime = 0;
    }
    this._cutscene = null;
    this._sceneKey = null;
  }

  _drawScene() {
    const c = this.ctx;
    const v = this._cutscene?.videoEl;
    if (!v || v.readyState < 2) {
      c.fillStyle = '#000'; c.fillRect(0, 0, W, H);
      return;
    }
    // Scale video (1280×720) to fill W×H preserving ratio
    const vr    = v.videoWidth  || 1280;
    const vh    = v.videoHeight || 720;
    const scale = Math.max(W / vr, H / vh);
    const dw    = vr * scale;
    const dh    = vh * scale;
    const dx    = (W - dw) / 2;
    const dy    = (H - dh) / 2;
    c.drawImage(v, 0, 0, vr, vh, dx, dy, dw, dh);

    // Vignette
    const vig = c.createRadialGradient(W/2, H/2, 50, W/2, H/2, 155);
    vig.addColorStop(0, 'transparent');
    vig.addColorStop(1, 'rgba(0,0,0,0.6)');
    c.fillStyle = vig; c.fillRect(0, 0, W, H);
  }

  get inScene() { return !!this._cutscene; }

  // ── Particles ─────────────────────────────────────
  _mkParticles(n) {
    return Array.from({ length: n }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.35,
      vy: -(0.12 + Math.random() * 0.5),
      life: Math.random(),
      max:  0.8 + Math.random() * 1.8,
      sz:   0.6 + Math.random() * 1.1,
    }));
  }

  _tickParticles(dt, fire) {
    this._particles.forEach(p => {
      p.x += p.vx; p.y += p.vy;
      p.life -= dt / (p.max * 1000);
      if (p.life <= 0 || p.y < 0) {
        p.x = Math.random() * W; p.y = H + 3; p.life = 1;
      }
    });
  }

  _drawParticles() {
    const c = this.ctx;
    this._particles.forEach(p => {
      c.globalAlpha = p.life * 0.38;
      c.fillStyle   = '#FF6B00';
      c.beginPath(); c.arc(p.x, p.y, p.sz, 0, Math.PI * 2); c.fill();
    });
    c.globalAlpha = 1;
  }
}
