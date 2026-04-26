/* ╔══════════════════════════════════════════════════════════════╗
   ║  store.js — Lógica de páginas: tienda · programas            ║
   ╚══════════════════════════════════════════════════════════════╝ */

'use strict';

/* ══════════════════════════════════════════════
   FILTRO DE CATEGORÍAS  (programas.html)
   ══════════════════════════════════════════════ */
const FilterBar = (() => {
  function init() {
    const bar = document.getElementById('filter-bar');
    if (!bar) return;

    bar.addEventListener('click', e => {
      const btn = e.target.closest('.filter-btn');
      if (!btn) return;

      // Actualizar botón activo
      bar.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('filter-btn--active'));
      btn.classList.add('filter-btn--active');

      // Filtrar tarjetas
      const cat = btn.dataset.filter;
      const cards = document.querySelectorAll('#programs-grid [data-cat]');

      cards.forEach(card => {
        const show = cat === 'all' || card.dataset.cat === cat;
        // Animación de salida/entrada
        if (show) {
          card.style.display = '';
          requestAnimationFrame(() => {
            card.style.opacity = '1';
            card.style.transform = '';
          });
        } else {
          card.style.opacity = '0';
          card.style.transform = 'scale(.95)';
          setTimeout(() => { card.style.display = 'none'; }, 250);
        }
      });
    });
  }

  return { init };
})();

/* ══════════════════════════════════════════════
   CONTADORES ANIMADOS  (stats)
   ══════════════════════════════════════════════ */
const CounterAnim = (() => {
  function animateCounter(el) {
    const target  = parseFloat(el.dataset.val);
    const suffix  = el.dataset.suffix || '';
    const isFloat = String(target).includes('.');
    const duration = 1800;
    const start   = performance.now();

    function step(now) {
      const progress = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      const current = target * ease;
      el.textContent = (isFloat ? current.toFixed(1) : Math.floor(current)) + suffix;
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  function init() {
    const counters = document.querySelectorAll('[data-counter]');
    if (!counters.length) return;

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });

    counters.forEach(el => observer.observe(el));
  }

  return { init };
})();

/* ══════════════════════════════════════════════
   REVEAL ON SCROLL  (elementos con .reveal)
   ══════════════════════════════════════════════ */
const RevealObserver = (() => {
  function init() {
    const els = document.querySelectorAll('.reveal');
    if (!els.length) return;

    const obs = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -48px 0px' });

    els.forEach(el => obs.observe(el));
  }

  return { init };
})();

/* ══════════════════════════════════════════════
   CARRITO BADGE UPDATE  (todos los botones)
   ══════════════════════════════════════════════ */
function updateCartBadge() {
  const items = JSON.parse(localStorage.getItem('jlonix_cart') || '[]');
  document.querySelectorAll('.navbar__cart-count').forEach(el => {
    el.textContent = items.length;
    el.style.display = items.length ? 'flex' : 'none';
  });
}

/* ══════════════════════════════════════════════
   VIDEO LAZY LOAD  (pcard-full videos)
   ══════════════════════════════════════════════ */
const VideoLazy = (() => {
  function init() {
    const videos = document.querySelectorAll('.pcard-full__vid video, .pcard__vid video');
    if (!videos.length) return;

    const obs = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        const video = entry.target;
        if (entry.isIntersecting) {
          // Cargar sources
          video.querySelectorAll('source[data-src]').forEach(s => {
            s.src = s.dataset.src;
          });
          if (video.readyState === 0) video.load();
          obs.unobserve(video);
        }
      });
    }, { threshold: 0.2 });

    videos.forEach(v => obs.observe(v));
  }

  return { init };
})();

/* ══════════════════════════════════════════════
   NOTIFICACIÓN DE AGREGADO AL CARRITO
   ══════════════════════════════════════════════ */
function showAddedToast(name) {
  // Usa UI.toast si está disponible; si no, crea un toast simple
  if (window.UI && UI.toast) {
    UI.toast(`🧺 ${name} agregado al carrito`);
    return;
  }
  const t = document.createElement('div');
  t.className = 'toast toast--show';
  t.textContent = `🧺 ${name} agregado al carrito`;
  t.style.cssText = `
    position:fixed;bottom:var(--sp-6,1.5rem);right:var(--sp-6,1.5rem);
    background:var(--surface-2,#1a1a2e);border:1px solid var(--cyan-sm,rgba(0,212,255,.3));
    color:#fff;padding:.75rem 1.25rem;border-radius:.75rem;font-size:.875rem;
    z-index:9999;animation:kFadeInUp .3s ease;
  `;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}

/* ══════════════════════════════════════════════
   INIT
   ══════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  FilterBar.init();
  CounterAnim.init();
  RevealObserver.init();
  VideoLazy.init();
  updateCartBadge();

  // Escuchar eventos del cart para actualizar badge
  document.addEventListener('cart:updated', updateCartBadge);
});