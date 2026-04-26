/* ╔══════════════════════════════════════════════════════════════╗
   ║  EventBus.js — Sistema pub/sub para comunicación entre módulos║
   ║  Versión profesional: async, wildcards, prioridades, debug   ║
   ╚══════════════════════════════════════════════════════════════╝ */

'use strict';

const EventBus = (() => {

  // ============================================================
  // CONFIGURACIÓN
  // ============================================================
  const CONFIG = {
    debug: false,           // Modo depuración (logs en consola)
    maxListeners: 50,       // Máximo de listeners por evento (evita memory leaks)
    enableWildcards: true,  // Soporte para wildcards (ej: 'user:*')
    wildcardChar: '*',      // Carácter para wildcard
    asyncEvents: false,     // Si es true, los eventos se emiten asíncronamente
    errorHandler: null      // Manejador personalizado de errores
  };

  // ============================================================
  // ESTRUCTURAS DE DATOS
  // ============================================================
  // Mapa principal de eventos
  const events = new Map();
  
  // Mapa de eventos de una sola ejecución (once)
  const onceEvents = new WeakMap();
  
  // Estadísticas (para debugging)
  let stats = {
    totalEventsEmitted: 0,
    totalListenersAdded: 0,
    totalListenersRemoved: 0,
    errors: 0
  };

  // ============================================================
  // UTILIDADES
  // ============================================================
  
  // Log de depuración
  function debugLog(...args) {
    if (CONFIG.debug) {
      console.log('[EventBus]', ...args);
    }
  }

  // Manejo de errores
  function handleError(error, event, listener) {
    stats.errors++;
    
    if (CONFIG.errorHandler && typeof CONFIG.errorHandler === 'function') {
      CONFIG.errorHandler(error, { event, listener });
    } else {
      console.error(`[EventBus] Error en evento "${event}":`, error);
    }
  }

  // Validar evento
  function validateEvent(event) {
    if (!event || typeof event !== 'string') {
      throw new Error('EventBus: El nombre del evento debe ser un string no vacío');
    }
    return event;
  }

  // Validar listener
  function validateListener(fn) {
    if (typeof fn !== 'function') {
      throw new Error('EventBus: El listener debe ser una función');
    }
    return fn;
  }

  // Obtener listeners de un evento
  function getEventListeners(event) {
    if (!events.has(event)) {
      events.set(event, new Set());
    }
    return events.get(event);
  }

  // Verificar límite de listeners
  function checkListenerLimit(event, listeners) {
    if (listeners.size >= CONFIG.maxListeners) {
      console.warn(`[EventBus] Posible memory leak: evento "${event}" tiene ${listeners.size} listeners (máx: ${CONFIG.maxListeners})`);
    }
  }

  // ============================================================
  // MATCH DE WILDCARDS
  // ============================================================
  function matchWildcard(event, pattern) {
    if (!CONFIG.enableWildcards) return event === pattern;
    
    // Si no hay wildcard, comparación exacta
    if (!pattern.includes(CONFIG.wildcardChar)) {
      return event === pattern;
    }
    
    // Convertir patrón a regex
    const regexPattern = pattern
      .replace(/[.*+?^${}()|[\]\\]/g, '\\$&') // Escapar caracteres especiales
      .replace(/\\\*/g, '.*');                 // Reemplazar * por .*
    
    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(event);
  }

  // Obtener todos los eventos que coinciden con un patrón
  function getMatchingEvents(pattern) {
    if (!CONFIG.enableWildcards || !pattern.includes(CONFIG.wildcardChar)) {
      return [pattern];
    }
    
    const matching = [];
    for (const event of events.keys()) {
      if (matchWildcard(event, pattern)) {
        matching.push(event);
      }
    }
    return matching;
  }

  // ============================================================
  // FUNCIONES PRINCIPALES
  // ============================================================

  /**
   * Suscribirse a un evento
   * @param {string} event - Nombre del evento (soporta wildcards)
   * @param {Function} listener - Función a ejecutar
   * @param {Object} options - Opciones adicionales
   * @param {number} options.priority - Prioridad (mayor = ejecuta primero)
   * @param {Object} options.context - Contexto 'this' para el listener
   * @returns {Function} Función para cancelar suscripción
   */
  function on(event, listener, options = {}) {
    validateEvent(event);
    validateListener(listener);
    
    const { priority = 0, context = null } = options;
    
    // Almacenar listener con metadata
    const listenerWrapper = {
      fn: listener,
      priority,
      context,
      id: Symbol('listener')
    };
    
    // Obtener o crear el conjunto de listeners para este evento
    let listeners = events.get(event);
    if (!listeners) {
      listeners = new Set();
      events.set(event, listeners);
    }
    
    listeners.add(listenerWrapper);
    stats.totalListenersAdded++;
    checkListenerLimit(event, listeners);
    
    debugLog(`➕ Listener añadido para evento: "${event}" (prioridad: ${priority})`);
    
    // Retornar función para cancelar suscripción
    return () => off(event, listenerWrapper);
  }

  /**
   * Suscribirse a un evento (alias de on)
   */
  function addEventListener(event, listener, options = {}) {
    return on(event, listener, options);
  }

  /**
   * Cancelar suscripción
   * @param {string} event - Nombre del evento
   * @param {Function|Object} listener - Listener a remover (función o wrapper)
   */
  function off(event, listener) {
    validateEvent(event);
    
    const listeners = events.get(event);
    if (!listeners) return;
    
    if (!listener) {
      // Remover todos los listeners del evento
      const count = listeners.size;
      listeners.clear();
      stats.totalListenersRemoved += count;
      debugLog(`🗑️ Eliminados todos los listeners (${count}) del evento: "${event}"`);
      return;
    }
    
    // Buscar y remover el listener
    let removed = false;
    for (const wrapper of listeners) {
      if (wrapper.fn === listener || wrapper === listener) {
        listeners.delete(wrapper);
        removed = true;
        stats.totalListenersRemoved++;
        break;
      }
    }
    
    if (removed) {
      debugLog(`➖ Listener removido del evento: "${event}"`);
    }
    
    // Limpiar evento si no tiene listeners
    if (listeners.size === 0) {
      events.delete(event);
    }
  }

  /**
   * Suscribirse a un evento solo una vez
   * @param {string} event - Nombre del evento
   * @param {Function} listener - Función a ejecutar una sola vez
   * @param {Object} options - Opciones adicionales
   * @returns {Function} Función para cancelar suscripción
   */
  function once(event, listener, options = {}) {
    validateEvent(event);
    validateListener(listener);
    
    const wrapper = (data) => {
      try {
        listener(data);
      } catch (error) {
        handleError(error, event, listener);
      } finally {
        off(event, wrapper);
        debugLog(`🔄 Listener único ejecutado y removido: "${event}"`);
      }
    };
    
    // Marcar como once para debugging
    wrapper._once = true;
    
    return on(event, wrapper, options);
  }

  /**
   * Emitir un evento
   * @param {string} event - Nombre del evento
   * @param {*} data - Datos a enviar
   * @returns {Promise<Array>} - Resultados de los listeners (si async)
   */
  function emit(event, data) {
    validateEvent(event);
    stats.totalEventsEmitted++;
    
    debugLog(`📡 Emitiendo evento: "${event}"`, data);
    
    // Obtener todos los eventos que coinciden (incluyendo wildcards)
    const eventsToTrigger = [];
    
    if (CONFIG.enableWildcards) {
      // Buscar coincidencias con wildcard
      for (const registeredEvent of events.keys()) {
        if (matchWildcard(event, registeredEvent)) {
          eventsToTrigger.push(registeredEvent);
        }
      }
    } else {
      eventsToTrigger.push(event);
    }
    
    // Coleccionar todos los listeners
    const allListeners = [];
    for (const eventName of eventsToTrigger) {
      const listeners = events.get(eventName);
      if (listeners) {
        for (const wrapper of listeners) {
          allListeners.push({ wrapper, eventName });
        }
      }
    }
    
    // Ordenar por prioridad (mayor primero)
    allListeners.sort((a, b) => b.wrapper.priority - a.wrapper.priority);
    
    // Ejecutar listeners
    const results = [];
    
    const executeListener = (item) => {
      const { wrapper, eventName } = item;
      const { fn, context } = wrapper;
      
      try {
        const result = context ? fn.call(context, data, eventName) : fn(data, eventName);
        results.push({ success: true, result, event: eventName });
        return result;
      } catch (error) {
        handleError(error, eventName, fn);
        results.push({ success: false, error, event: eventName });
        return null;
      }
    };
    
    if (CONFIG.asyncEvents) {
      // Ejecución asíncrona
      return Promise.all(allListeners.map(executeListener));
    } else {
      // Ejecución síncrona
      allListeners.forEach(executeListener);
      return results;
    }
  }

  /**
   * Emitir evento asíncrono (siempre async)
   */
  async function emitAsync(event, data) {
    const originalAsync = CONFIG.asyncEvents;
    CONFIG.asyncEvents = true;
    const result = await emit(event, data);
    CONFIG.asyncEvents = originalAsync;
    return result;
  }

  /**
   * Obtener todos los eventos registrados
   */
  function getEvents() {
    return Array.from(events.keys());
  }

  /**
   * Obtener número de listeners para un evento
   */
  function listenerCount(event) {
    const listeners = events.get(event);
    return listeners ? listeners.size : 0;
  }

  /**
   * Obtener estadísticas
   */
  function getStats() {
    return { ...stats, registeredEvents: events.size };
  }

  /**
   * Limpiar todos los eventos
   */
  function clear() {
    const totalListeners = Array.from(events.values()).reduce((sum, set) => sum + set.size, 0);
    events.clear();
    stats.totalListenersRemoved += totalListeners;
    debugLog(`🧹 EventBus limpiado: ${totalListeners} listeners eliminados`);
  }

  /**
   * Configurar EventBus
   */
  function configure(config) {
    Object.assign(CONFIG, config);
    debugLog('⚙️ Configuración actualizada:', CONFIG);
  }

  /**
   * Esperar a que un evento sea emitido (Promise)
   * @param {string} event - Nombre del evento
   * @param {number} timeout - Timeout en ms (opcional)
   * @returns {Promise<any>}
   */
  function waitFor(event, timeout = null) {
    return new Promise((resolve, reject) => {
      let timeoutId;
      
      const unsubscribe = once(event, (data) => {
        if (timeoutId) clearTimeout(timeoutId);
        resolve(data);
      });
      
      if (timeout) {
        timeoutId = setTimeout(() => {
          unsubscribe();
          reject(new Error(`EventBus: Timeout esperando evento "${event}" (${timeout}ms)`));
        }, timeout);
      }
    });
  }

  /**
   * Crear un bus hijo (namespace aislado)
   */
  function createNamespace(namespace) {
    const bus = {
      on: (event, listener, options) => on(`${namespace}:${event}`, listener, options),
      once: (event, listener, options) => once(`${namespace}:${event}`, listener, options),
      off: (event, listener) => off(`${namespace}:${event}`, listener),
      emit: (event, data) => emit(`${namespace}:${event}`, data),
      waitFor: (event, timeout) => waitFor(`${namespace}:${event}`, timeout)
    };
    return bus;
  }

  // ============================================================
  // API PÚBLICA
  // ============================================================
  return {
    // Principales
    on,
    off,
    once,
    emit,
    emitAsync,
    
    // Alias para compatibilidad
    addEventListener,
    removeEventListener: off,
    dispatchEvent: emit,
    
    // Utilidades
    waitFor,
    createNamespace,
    getEvents,
    listenerCount,
    getStats,
    clear,
    configure,
    
    // Configuración
    setDebug: (enabled) => { CONFIG.debug = enabled; },
    setErrorHandler: (handler) => { CONFIG.errorHandler = handler; }
  };

})();

// ============================================================
// EXPORTAR PARA USO EN CONSOLA (debug)
// ============================================================
if (typeof window !== 'undefined') {
  window.EventBus = EventBus;
}

// Ejemplo de uso para verificar funcionamiento
if (EventBus.getStats().totalEventsEmitted === 0 && EventBus.getEvents().length === 0) {
  console.log('✅ EventBus cargado correctamente');
}