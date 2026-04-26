/* ╔══════════════════════════════════════════════════════════════╗
   ║  Router.js — Enrutador cliente ligero para JLΩNIX            ║
   ║  Gestiona historial, transiciones de página y active links   ║
   ╚══════════════════════════════════════════════════════════════╝ */

'use strict';

const Router = (() => {

  /* ── Configuración ── */
  const BASE     = '/jlonix/';           // base URL del proyecto
  const TRANS_MS = 250;                  // duración de fade entre páginas (ms)

  /* ── Estado interno ── */
  let _currentPath = location.pathname;
  let _routes      = {};                 // { '/path': handlerFn }
  let _notFound    = null;

  /* ══════════════════════════════════════════════
     REGISTRO DE RUTAS
     ══════════════════════════════════════════════ */
  /**
   * Router.on('/pages/tienda.html', fn)
   * Registra un callback para ejecutar cuando se llega a esa ruta.
   */
  function on(path, handler) {
    _routes[path] = handler;
    return Router; // chainable
  }

  /** Callback de ruta no encontrada */
  function notFound(handler) {
    _notFound = handler;
    return Router;
  }

  /* ══════════════════════════════════════════════
     NAVEGACIÓN PROGRAMÁTICA
     ══════════════════════════════════════════════ */
  /**
   * Router.go('/pages/tienda.html')
   * Navega a una URL con transición suave y sin recarga completa.
   * Sólo funciona en el mismo origen y dentro de BASE.
   */
  async function go(href) {
    if (!href || href.startsWith('http') || href.startsWith('mailto')) {
      window.location.href = href;
      return;
    }

    // Si es la misma página no hacemos nada
    const resolved = new URL(href, location.origin).pathname;
    if (resolved === _currentPath) return;

    // Fade out
    await _fadeOut();

    // Fetch de la nueva página (MPA con transición suave)
    try {
      const res  = await fetch(href);
      const html = await res.text();
      const parser  = new DOMParser();
      const doc     = parser.parseFromString(html, 'text/html');

      // Reemplazar contenido del body y título
      document.title = doc.title;
      document.getElementById('tc')?.remove();

      // Intercambiar el bloque .layer completo
      const newLayer  = doc.querySelector('.layer');
      const oldLayer  = document.querySelector('.layer');
      if (newLayer && oldLayer) {
        oldLayer.replaceWith(newLayer);
      } else {
        // Fallback: recarga normal
        location.href = href;
        return;
      }

      // Actualizar historial
      history.pushState({ path: resolved }, doc.title, href);
      _currentPath = resolved;

      // Re-ejecutar scripts de la nueva página
      _reinitPage();

      // Marca el link activo en el navbar
      _updateActiveLink(href);

      // Fade in
      await _fadeIn();

      // Ejecutar handler de ruta si existe
      const handler = _routes[resolved] || _notFound;
      if (handler) handler({ path: resolved });

    } catch (err) {
      console.warn('[Router] Fetch falló, navegando normalmente:', err);
      location.href = href;
    }
  }

  /* ══════════════════════════════════════════════
     POPSTATE  (botones atrás/adelante)
     ══════════════════════════════════════════════ */
  function _bindPopState() {
    window.addEventListener('popstate', e => {
      if (e.state?.path) go(location.href);
    });
  }

  /* ══════════════════════════════════════════════
     INTERCEPCIÓN DE LINKS
     Sólo intercepta <a> que apunten dentro del sitio
     ══════════════════════════════════════════════ */
  function _bindLinks() {
    document.addEventListener('click', e => {
      const a = e.target.closest('a[href]');
      if (!a) return;

      const href = a.getAttribute('href');
      // Ignorar externos, anclas, mailto, download
      if (!href || href.startsWith('http') || href.startsWith('//') ||
          href.startsWith('#') || href.startsWith('mailto') ||
          a.hasAttribute('download') || a.target === '_blank') return;

      e.preventDefault();
      go(href);
    });
  }

  /* ══════════════════════════════════════════════
     HELPERS
     ══════════════════════════════════════════════ */
  function _fadeOut() {
    return new Promise(resolve => {
      const layer = document.querySelector('.layer');
      if (!layer) { resolve(); return; }
      layer.style.transition = `opacity ${TRANS_MS}ms ease`;
      layer.style.opacity    = '0';
      setTimeout(resolve, TRANS_MS);
    });
  }

  function _fadeIn() {
    return new Promise(resolve => {
      const layer = document.querySelector('.layer');
      if (!layer) { resolve(); return; }
      layer.style.transition = `opacity ${TRANS_MS}ms ease`;
      layer.style.opacity    = '1';
      setTimeout(resolve, TRANS_MS);
    });
  }

  /**
   * Marca el link activo en el navbar según la URL actual.
   */
  function _updateActiveLink(href) {
    document.querySelectorAll('.navbar__link').forEach(a => {
      a.classList.toggle(
        'navbar__link--active',
        a.getAttribute('href') === href || location.href.endsWith(a.getAttribute('href'))
      );
    });
  }

  /**
   * Re-ejecuta inicializaciones necesarias tras intercambiar el DOM:
   * contadores, reveal, carrito badge, canvas, App.init(), etc.
   */
  function _reinitPage() {
    // Scroll al inicio
    window.scrollTo({ top: 0, behavior: 'instant' });

    // Re-init módulos globales si existen
    try { if (window.App    && App.init)    App.init();    } catch(e) {}
    try { if (window.Canvas && Canvas.init) Canvas.init(); } catch(e) {}
    try { if (window.UI     && UI.init)     UI.init();     } catch(e) {}

    // Disparar evento para que cada página reaccione
    document.dispatchEvent(new CustomEvent('router:pagechange', {
      detail: { path: _currentPath }
    }));
  }

  /* ══════════════════════════════════════════════
     INIT
     ══════════════════════════════════════════════ */
  function init() {
    _currentPath = location.pathname;
    _updateActiveLink(location.href);
    _bindLinks();
    _bindPopState();

    // Estado inicial para historial
    history.replaceState({ path: _currentPath }, document.title, location.href);

    // Ejecutar handler de ruta inicial si existe
    const handler = _routes[_currentPath] || _notFound;
    if (handler) handler({ path: _currentPath });

    return Router;
  }

  /* ── API pública ── */
  return { init, go, on, notFound };

})();

/* Auto-init cuando el DOM esté listo */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => Router.init());
} else {
  Router.init();
}