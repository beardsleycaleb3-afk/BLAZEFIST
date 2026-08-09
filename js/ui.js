// ┌──────────────────────────────────────────────────┐
// │  ui.js — HUD  (all DOM mutations isolated here)  │
// └──────────────────────────────────────────────────┘

export class HUD {
  constructor() {
    const $ = id => document.getElementById(id);
    this._p1hp    = $('p1hp');
    this._p2hp    = $('p2hp');
    this._bzfil   = $('bzfil');
    this._combo   = $('combo-txt');
    this._timer   = $('timer-val');
    this._score   = $('score-val');
    this._fireBdg = $('fire-badge');
    this._koPanel = $('ko-panel');
    this._koTitle = $('ko-title');
    this._koSub   = $('ko-sub');
    this._koBtn   = $('ko-btn');
    this._csOver  = $('cs-overlay');
    this._lbT     = $('lb-top');
    this._lbB     = $('lb-bot');
    this._monitor = $('monitor-wrap');
    this._content = $('monitor-content');
  }

  updateAll(P, E, score, timer) {
    this._p1hp.style.width  = Math.max(0, P.hp / P.maxHp * 100) + '%';
    this._p2hp.style.width  = Math.max(0, E.hp / E.maxHp * 100) + '%';
    this._bzfil.style.width = P.blaze + '%';
    this._score.textContent = String(score).padStart(6, '0');
    this._p1hp.style.filter = P.hp < 25 ? 'hue-rotate(-25deg) saturate(2.2)' : '';
  }

  setTimer(v) {
    this._timer.textContent = String(v).padStart(2, '0');
    this._timer.style.color = v <= 10 ? '#FF1A00' : '#FFD600';
  }

  showCombo(text, color = '#FFD600') {
    const el = this._combo;
    el.textContent = text;
    el.style.color = color;
    el.style.textShadow = `0 0 16px ${color},2px 2px 0 #000`;
    el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop');
  }

  setFireMode(on) {
    this._fireBdg.classList.toggle('on', on);
    document.getElementById('btn-melee')?.classList.toggle('fire-mode', on);
  }

  flash() {
    const el = document.getElementById('screen-flash');
    el.classList.remove('on'); void el.offsetWidth; el.classList.add('on');
  }

  shake() {
    const el = this._monitor;
    el.classList.remove('shk'); void el.offsetWidth; el.classList.add('shk');
    setTimeout(() => el.classList.remove('shk'), 300);
  }

  spawnDamage(cx, cy, dmg, fire) {
    const r  = this._content.getBoundingClientRect();
    const sx = r.width / 280, sy = r.height / 280;
    const el = document.createElement('div');
    el.className   = 'dmg-num' + (fire ? ' fire' : '');
    el.textContent = (fire ? '🔥' : '') + dmg;
    el.style.cssText = `left:${cx*sx}px;top:${cy*sy}px;position:absolute;z-index:40;`;
    this._content.appendChild(el);
    setTimeout(() => el.remove(), 900);
  }

  setCutscene(on) {
    this._csOver.classList.toggle('on', on);
    this._lbT.classList.toggle('on', on);
    this._lbB.classList.toggle('on', on);
  }

  showKO(title, sub, onRestart) {
    this._koTitle.textContent = title;
    this._koSub.textContent   = sub;
    this._koPanel.classList.add('show');
    const h = () => {
      this._koBtn.removeEventListener('click',      h);
      this._koBtn.removeEventListener('touchstart', h);
      onRestart();
    };
    this._koBtn.addEventListener('click', h);
    this._koBtn.addEventListener('touchstart', e => { e.preventDefault(); h(); }, { passive:false });
  }

  reset() {
    this._koPanel.classList.remove('show');
    this._fireBdg.classList.remove('on');
    this._csOver.classList.remove('on');
    this._lbT.classList.remove('on');
    this._lbB.classList.remove('on');
    document.getElementById('btn-melee')?.classList.remove('fire-mode');
  }

  showLoading() {
    const cv = document.getElementById('game-canvas');
    const ctx = cv.getContext('2d');
    ctx.fillStyle='#000'; ctx.fillRect(0,0,280,280);
    ctx.fillStyle='#FF6B00'; ctx.font='bold 10px "Press Start 2P"';
    ctx.textAlign='center'; ctx.fillText('LOADING…',140,130);
  }

  showTitle(onStart) {
    const cv = document.getElementById('game-canvas');
    const ctx = cv.getContext('2d');
    const W=280,H=280;
    ctx.clearRect(0,0,W,H);
    const g=ctx.createLinearGradient(0,0,0,H);
    g.addColorStop(0,'#060010'); g.addColorStop(1,'#180300');
    ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
    ctx.font='bold 26px Orbitron,sans-serif'; ctx.textAlign='center';
    ctx.fillStyle='#FFD600'; ctx.shadowColor='#FF6B00'; ctx.shadowBlur=20;
    ctx.fillText('BLAZEFIST',W/2,82); ctx.shadowBlur=0;
    ctx.font='5px "Press Start 2P"';
    ctx.fillStyle='#FF6B00'; ctx.fillText('MELEE TO BUILD COMBO',W/2,112);
    ctx.fillStyle='#FF1A00'; ctx.fillText('FILL BLAZE → FIRE MODE',W/2,130);
    ctx.fillStyle='#FFD600'; ctx.fillText('RUN+MELEE = TIGER ULTIMATE',W/2,148);
    ctx.fillStyle='rgba(255,255,255,.35)'; ctx.font='4px "Press Start 2P"';
    ctx.fillText('TAP 👊 MELEE TO FIGHT',W/2,H-18);
    const go = e => {
      e.preventDefault();
      document.getElementById('btn-melee').removeEventListener('touchstart', go);
      document.getElementById('btn-melee').removeEventListener('mousedown',  go);
      onStart();
    };
    document.getElementById('btn-melee').addEventListener('touchstart', go, {passive:false});
    document.getElementById('btn-melee').addEventListener('mousedown',  go);
  }
}
