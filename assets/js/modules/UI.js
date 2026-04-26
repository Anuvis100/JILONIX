/* ╔══════════════════════════════════════════════════════════════╗
   ║  UI.js — Toast, helpers de UI global                         ║
   ╚══════════════════════════════════════════════════════════════╝ */
const UI = (() => {

  /* ── Toast ── */
  let tc;
  function ensureTC() {
    if (tc) return;
    tc = document.getElementById('tc');
    if (!tc) { tc=document.createElement('div'); tc.id='tc'; document.body.appendChild(tc); }
  }

  const TOAST_TYPES = {
    ok:   { cls:'toast--ok',   ms:3200 },
    err:  { cls:'toast--err',  ms:4000 },
    info: { cls:'toast--info', ms:3000 },
    warn: { cls:'toast--warn', ms:3500 },
  };

  function toast(msg, type='info', ms=null) {
    ensureTC();
    const cfg = TOAST_TYPES[type] || TOAST_TYPES.info;
    const el  = document.createElement('div');
    el.className = `toast ${cfg.cls}`;
    el.textContent = msg;
    tc.appendChild(el);
    requestAnimationFrame(() => el.classList.add('in'));
    const dur = ms || cfg.ms;
    setTimeout(() => {
      el.classList.remove('in');
      setTimeout(() => el.remove(), 340);
    }, dur);
  }

  return { toast };
})();