// ┌──────────────────────────────────────────────────┐
// │  input.js — Touch input                          │
// │  Cross d-pad ▲▼◀▶  +  RUN / MELEE buttons       │
// └──────────────────────────────────────────────────┘

export function initInput(game) {
  bind('btn-up',    { down: () => game.onJump(),       up: () => {} });
  bind('btn-left',  { down: () => game.onLeft(true),   up: () => game.onLeft(false)  });
  bind('btn-right', { down: () => game.onRight(true),  up: () => game.onRight(false) });
  bind('btn-down',  { down: () => game.onDuck(true),   up: () => game.onDuck(false)  });
  bind('btn-run',   { down: () => game.onRun(true),    up: () => game.onRun(false)   });
  bind('btn-melee', { down: () => game.onMelee(),      up: () => {} });
}

function bind(id, { down, up }) {
  const el = document.getElementById(id);
  if (!el) return;
  el.addEventListener('touchstart',  e => { e.preventDefault(); el.classList.add('active');    down(e); }, { passive:false });
  el.addEventListener('touchend',    e => { e.preventDefault(); el.classList.remove('active'); up(e);   }, { passive:false });
  el.addEventListener('touchcancel', e => { el.classList.remove('active'); up(e); }, { passive:false });
  el.addEventListener('mousedown',   e => { el.classList.add('active');    down(e); });
  el.addEventListener('mouseup',     e => { el.classList.remove('active'); up(e);   });
  el.addEventListener('mouseleave',  e => { el.classList.remove('active'); up(e);   });
}
