/* ╔══════════════════════════════════════════════════════════════╗
   ║  App.js — Bootstrap: inicializa todos los módulos globales   ║
   ║  Versión profesional con manejo de errores y optimizaciones  ║
   ╚══════════════════════════════════════════════════════════════╝ */

'use strict';

const App = (() => {

  // ============================================================
  // CONFIGURACIÓN GLOBAL
  // ============================================================
  const CONFIG = {
    // Configuración del loader
    loader: {
      hideDelay: 400,
      fadeOutDuration: 300
    },
    // Configuración del scroll
    scroll: {
      threshold: 40,
      throttleMs: 100
    },
    // Configuración del IntersectionObserver
    observer: {
      threshold: 0.12,
      rootMargin: '0px 0px -40px 0px'
    },
    // Configuración de contadores
    counters: {
      duration: 1800,
      stepInterval: 14,
      observerThreshold: 0.5
    }
  };

  // ============================================================
  // UTILIDADES
  // ============================================================
  const Utils = {
    // Throttle para eventos de scroll/resize
    throttle(fn, delay) {
      let lastCall = 0;
      return function(...args) {
        const now = Date.now();
        if (now - lastCall >= delay) {
          lastCall = now;
          fn.apply(this, args);
        }
      };
    },

    // Debounce para eventos costosos
    debounce(fn, delay) {
      let timeoutId;
      return function(...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn.apply(this, args), delay);
      };
    },

    // Escapar HTML para seguridad
    escapeHtml(str) {
      if (!str) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    },

    // Formatear números
    formatNumber(num, decimals = 0) {
      if (isNaN(num)) return '0';
      return decimals === 0 
        ? Math.floor(num).toLocaleString()
        : num.toFixed(decimals).toLocaleString();
    }
  };

  // ============================================================
  // LOADER DE PÁGINA (mejorado)
  // ============================================================
  function initLoader() {
    const loader = document.getElementById('page-loader');
    if (!loader) return;

    // Función para ocultar el loader
    const hideLoader = () => {
      loader.style.transition = `opacity ${CONFIG.loader.fadeOutDuration}ms ease`;
      loader.style.opacity = '0';
      setTimeout(() => {
        loader.style.display = 'none';
        EventBus.emit('app:loader-hidden');
      }, CONFIG.loader.fadeOutDuration);
    };

    // Esperar a que la página cargue completamente
    if (document.readyState === 'loading') {
      window.addEventListener('load', () => {
        setTimeout(hideLoader, CONFIG.loader.hideDelay);
      });
    } else {
      setTimeout(hideLoader, CONFIG.loader.hideDelay);
    }

    // Fallback: ocultar después de 5 segundos máximo
    setTimeout(hideLoader, 5000);
  }

  // ============================================================
  // NAVBAR (mejorada)
  // ============================================================
  function initNavbar() {
    const nav = document.querySelector('.navbar');
    const burger = document.querySelector('.navbar__burger');
    const menu = document.querySelector('.navbar__menu');
    
    if (!nav) return;

    // Efecto de scroll con throttle
    const handleScroll = Utils.throttle(() => {
      const isScrolled = window.scrollY > CONFIG.scroll.threshold;
      nav.classList.toggle('scrolled', isScrolled);
      
      // Emitir evento para otros módulos
      if (isScrolled) {
        EventBus.emit('navbar:scrolled');
      } else {
        EventBus.emit('navbar:top');
      }
    }, CONFIG.scroll.throttleMs);

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Llamada inicial

    // Toggle menú móvil
    window.toggleMenu = () => {
      if (!menu || !burger) return;
      const isOpen = menu.classList.contains('open');
      menu.classList.toggle('open');
      burger.classList.toggle('open');
      
      // Evitar scroll del body cuando el menú está abierto
      document.body.style.overflow = isOpen ? '' : 'hidden';
      
      // Emitir evento
      EventBus.emit('navbar:toggle', { isOpen: !isOpen });
    };

    // Cerrar menú al hacer clic externo
    const closeMenuOnClickOutside = (e) => {
      if (!menu?.classList.contains('open')) return;
      if (!e.target.closest('.navbar')) {
        menu.classList.remove('open');
        burger?.classList.remove('open');
        document.body.style.overflow = '';
        EventBus.emit('navbar:closed');
      }
    };
    document.addEventListener('pointerdown', closeMenuOnClickOutside);

    // Cerrar menú al redimensionar a tamaño escritorio
    const closeMenuOnResize = Utils.debounce(() => {
      if (window.innerWidth > 900 && menu?.classList.contains('open')) {
        menu.classList.remove('open');
        burger?.classList.remove('open');
        document.body.style.overflow = '';
      }
    }, 150);
    window.addEventListener('resize', closeMenuOnResize);

    // Marcar link activo
    const currentFile = location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.navbar__link').forEach(link => {
      const href = link.getAttribute('href') || '';
      if (href === currentFile || href.endsWith('/' + currentFile)) {
        link.classList.add('navbar__link--active');
        link.setAttribute('aria-current', 'page');
      }
    });
  }

  // ============================================================
  // INTERSECTION OBSERVER PARA REVEAL (mejorado)
  // ============================================================
  function initReveal() {
    const elements = document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale');
    if (elements.length === 0) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        
        // Añadir clase 'in' para activar animación
        entry.target.classList.add('in');
        
        // Si tiene atributo data-once, dejar de observar
        if (entry.target.dataset.once !== 'false') {
          observer.unobserve(entry.target);
        }
        
        // Emitir evento
        EventBus.emit('element:revealed', { element: entry.target });
      });
    }, CONFIG.observer);

    elements.forEach(el => observer.observe(el));
    
    // Guardar observer globalmente para posible uso futuro
    window.__revealObserver = observer;
  }

  // ============================================================
  // CONTADORES ANIMADOS (mejorado)
  // ============================================================
  function initCounters() {
    const counters = document.querySelectorAll('[data-counter]');
    if (counters.length === 0) return;

    // Almacenar estados de contadores
    const counterStates = new Map();

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        
        const el = entry.target;
        const id = el.id || Math.random().toString(36);
        
        // Evitar reiniciar contadores ya animados
        if (counterStates.has(id)) return;
        counterStates.set(id, true);
        
        // Obtener valor objetivo
        const targetValue = parseFloat(el.dataset.val || el.getAttribute('data-val') || '0');
        const suffix = el.dataset.suffix || '';
        const prefix = el.dataset.prefix || '';
        const isInteger = Number.isInteger(targetValue);
        const duration = parseInt(el.dataset.duration) || CONFIG.counters.duration;
        const stepInterval = parseInt(el.dataset.step) || CONFIG.counters.stepInterval;
        
        let currentValue = 0;
        const steps = duration / stepInterval;
        const increment = targetValue / steps;
        
        const timer = setInterval(() => {
          currentValue += increment;
          
          if (currentValue >= targetValue) {
            currentValue = targetValue;
            const formattedValue = isInteger 
              ? Math.floor(currentValue).toLocaleString()
              : currentValue.toFixed(1);
            el.textContent = prefix + formattedValue + suffix;
            clearInterval(timer);
            
            // Emitir evento cuando el contador termina
            EventBus.emit('counter:completed', { 
              element: el, 
              value: targetValue 
            });
          } else {
            const formattedValue = isInteger 
              ? Math.floor(currentValue).toLocaleString()
              : currentValue.toFixed(1);
            el.textContent = prefix + formattedValue + suffix;
          }
        }, stepInterval);
        
        observer.unobserve(el);
      });
    }, { threshold: CONFIG.counters.observerThreshold });

    counters.forEach(counter => observer.observe(counter));
  }

  // ============================================================
  // SERVICE WORKER (PWA) mejorado
  // ============================================================
  async function initSW() {
    if (!('serviceWorker' in navigator)) {
      console.log('⚠️ Service Worker no soportado en este navegador');
      return;
    }

    try {
      // Esperar a que la página cargue completamente
      if (document.readyState === 'loading') {
        await new Promise(resolve => window.addEventListener('load', resolve));
      }
      
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('✅ Service Worker registrado exitosamente:', registration.scope);
      
      // Emitir evento
      EventBus.emit('sw:registered', { registration });
      
      // Escuchar actualizaciones
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        console.log('🔄 Nueva versión del Service Worker encontrada');
        
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            console.log('📦 Actualización disponible, recarga para obtenerla');
            EventBus.emit('sw:update-available');
          }
        });
      });
      
    } catch (error) {
      console.error('❌ Error al registrar Service Worker:', error);
      EventBus.emit('sw:error', { error });
    }
  }

  // ============================================================
  // CANVAS DE FONDO (mejorado)
  // ============================================================
  function initCanvas() {
    if (typeof NeuralCanvas !== 'undefined' && NeuralCanvas.init) {
      try {
        NeuralCanvas.init();
        EventBus.emit('canvas:initialized');
      } catch (error) {
        console.error('❌ Error al inicializar NeuralCanvas:', error);
      }
    } else {
      console.warn('⚠️ NeuralCanvas no disponible');
    }
  }

  // ============================================================
  // DETECCIÓN DE PREFERENCIAS DEL USUARIO
  // ============================================================
  function initUserPreferences() {
    // Detectar tema preferido (claro/oscuro)
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    if (prefersReducedMotion) {
      document.documentElement.classList.add('reduce-motion');
      EventBus.emit('prefers:reduced-motion');
    }
    
    EventBus.emit('prefers:theme', { dark: prefersDark });
  }

  // ============================================================
  // MANEJO DE ERRORES GLOBAL
  // ============================================================
  function initGlobalErrorHandler() {
    // Manejar errores no capturados
    window.addEventListener('error', (event) => {
      console.error('❌ Error global:', event.error);
      EventBus.emit('app:error', {
        type: 'uncaught',
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        error: event.error
      });
    });
    
    // Manejar promesas rechazadas
    window.addEventListener('unhandledrejection', (event) => {
      console.error('❌ Promesa rechazada sin manejar:', event.reason);
      EventBus.emit('app:error', {
        type: 'unhandled-rejection',
        reason: event.reason
      });
    });
  }

  // ============================================================
  // INICIALIZACIÓN PRINCIPAL
  // ============================================================
  let isInitialized = false;

  function init() {
    // Evitar doble inicialización
    if (isInitialized) {
      console.warn('⚠️ App ya inicializada');
      return;
    }
    
    console.log('🚀 Inicializando JLΩNIX App...');
    
    try {
      // Inicializar módulos en orden
      initGlobalErrorHandler();
      initUserPreferences();
      initLoader();
      initCanvas();
      initNavbar();
      initReveal();
      initCounters();
      initSW();
      
      isInitialized = true;
      
      // Emitir evento de inicialización completa
      EventBus.emit('app:initialized');
      console.log('✅ JLΩNIX App inicializada correctamente');
      
    } catch (error) {
      console.error('❌ Error al inicializar la aplicación:', error);
      EventBus.emit('app:init-error', { error });
    }
  }

  // ============================================================
  // API PÚBLICA
  // ============================================================
  return {
    init,
    config: CONFIG,
    utils: Utils,
    isInitialized: () => isInitialized
  };

})();

// ============================================================
// INICIALIZACIÓN CUANDO EL DOM ESTÉ LISTO
// ============================================================
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => App.init());
} else {
  App.init();
}

// ============================================================
// EXPORTAR PARA USO EN CONSOLA (debug)
// ============================================================
if (typeof window !== 'undefined') {
  window.JLONIX = window.JLONIX || {};
  window.JLONIX.App = App;
}