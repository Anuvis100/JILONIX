/* ╔══════════════════════════════════════════════════════════════╗
   ║  Cart.js — Módulo completo de carrito con EventBus           ║
   ║  Versión mejorada: + Cantidades + Cupones + Descuentos       ║
   ╚══════════════════════════════════════════════════════════════╝ */

const Cart = (() => {
  const KEY = 'jlonix_cart';
  const COUPON_KEY = 'jlonix_coupon';
  const MAX = 20;
  
  // Cupones válidos
  const VALID_COUPONS = {
    'JLONIX10': 10,
    'BIENVENIDO': 15,
    'OMEGA2026': 20,
    'NAVIDAD30': 30,
    'ANIVERSARIO25': 25
  };
  
  // Estado interno
  let currentDiscount = 0;
  let appliedCoupon = null;
  let listeners = [];

  /* ──────────────── PRIVATE METHODS ──────────────── */
  
  const read = () => { 
    try { 
      return JSON.parse(localStorage.getItem(KEY)) || []; 
    } catch(e) { 
      return []; 
    } 
  };
  
  const write = (list) => {
    localStorage.setItem(KEY, JSON.stringify(list));
    notifyListeners();
    EventBus.emit('cart:changed', { items: list, totals: getTotals() });
  };

  // Calcular subtotal (considerando cantidades)
  const calculateSubtotal = (items) => {
    return items.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
  };
  
  // Calcular descuento
  const calculateDiscount = (subtotal) => {
    return subtotal * (currentDiscount / 100);
  };
  
  // Obtener totales completos
  const getTotals = () => {
    const items = read();
    const subtotal = calculateSubtotal(items);
    const discount = calculateDiscount(subtotal);
    return {
      subtotal: subtotal,
      discount: discount,
      total: subtotal - discount,
      discountPercent: currentDiscount,
      itemCount: items.length,
      totalQuantity: items.reduce((sum, i) => sum + (i.quantity || 1), 0),
      couponApplied: appliedCoupon !== null,
      couponCode: appliedCoupon
    };
  };
  
  // Notificar a listeners
  const notifyListeners = () => {
    const items = read();
    const totals = getTotals();
    listeners.forEach(fn => {
      try { fn({ items, ...totals }); } catch(e) { console.error(e); }
    });
  };
  
  // Cargar cupón guardado
  const loadSavedCoupon = () => {
    try {
      const saved = localStorage.getItem(COUPON_KEY);
      if (saved) {
        const coupon = JSON.parse(saved);
        if (coupon.appliedAt && (Date.now() - coupon.appliedAt) < 30 * 24 * 60 * 60 * 1000) {
          currentDiscount = coupon.discount;
          appliedCoupon = coupon.code;
        } else {
          localStorage.removeItem(COUPON_KEY);
        }
      }
    } catch(e) { console.error(e); }
  };

  /* ──────────────── PUBLIC API ──────────────── */
  
  return {
    // ========== CRUD BÁSICO ==========
    
    add: (id, name, price, icon, type, version = '') => {
      const list = read();
      const existing = list.find(i => i.id === id);
      
      if (existing) {
        // Aumentar cantidad si ya existe
        existing.quantity = (existing.quantity || 1) + 1;
        write(list);
        UI.toast(`➕ Se agregó otra unidad de "${name}"`, 'ok');
        return true;
      }
      
      if (list.length >= MAX) {
        UI.toast(`⚠️ Máximo ${MAX} productos por pedido.`, 'warn');
        return false;
      }
      
      list.push({ 
        id, name, price: +price, icon, type, version, 
        quantity: 1,
        ts: Date.now() 
      });
      write(list);
      UI.toast(`✅ "${name}" agregado al carrito.`, 'ok');
      return true;
    },

    remove: (id) => {
      const list = read().filter(i => i.id !== id);
      write(list);
      UI.toast(`🗑️ Producto eliminado`, 'info');
    },
    
    removeItem: (id) => {  // Alias
      return Cart.remove(id);
    },

    clear: () => {
      write([]);
      Cart.clearCoupon();
      UI.toast(`🧹 Carrito vaciado`, 'info');
    },

    // ========== MANEJO DE CANTIDADES ==========
    
    updateQuantity: (id, delta) => {
      const list = read();
      const index = list.findIndex(i => i.id === id);
      
      if (index === -1) return false;
      
      const newQty = (list[index].quantity || 1) + delta;
      
      if (newQty <= 0) {
        Cart.remove(id);
        return false;
      }
      
      list[index].quantity = newQty;
      write(list);
      UI.toast(`📦 Cantidad: ${newQty}`, 'info');
      return true;
    },
    
    setQuantity: (id, quantity) => {
      if (quantity <= 0) {
        Cart.remove(id);
        return false;
      }
      
      const list = read();
      const index = list.findIndex(i => i.id === id);
      
      if (index === -1) return false;
      
      list[index].quantity = quantity;
      write(list);
      return true;
    },

    // ========== CUPONES Y DESCUENTOS ==========
    
    applyCoupon: (code) => {
      const upperCode = (code || '').toUpperCase().trim();
      
      if (!upperCode) {
        UI.toast('⚠️ Ingresa un código de cupón', 'warn');
        return false;
      }
      
      if (appliedCoupon === upperCode) {
        UI.toast('⚠️ Este cupón ya fue aplicado', 'warn');
        return false;
      }
      
      if (VALID_COUPONS[upperCode]) {
        currentDiscount = VALID_COUPONS[upperCode];
        appliedCoupon = upperCode;
        
        localStorage.setItem(COUPON_KEY, JSON.stringify({
          code: upperCode,
          discount: currentDiscount,
          appliedAt: Date.now()
        }));
        
        notifyListeners();
        EventBus.emit('cart:coupon:applied', { code: upperCode, discount: currentDiscount });
        UI.toast(`✅ ${currentDiscount}% de descuento aplicado!`, 'ok');
        return true;
      } else {
        UI.toast('❌ Código no válido', 'error');
        return false;
      }
    },
    
    clearCoupon: () => {
      currentDiscount = 0;
      appliedCoupon = null;
      localStorage.removeItem(COUPON_KEY);
      notifyListeners();
      EventBus.emit('cart:coupon:cleared');
      UI.toast('🏷️ Cupón eliminado', 'info');
      return true;
    },
    
    getCurrentCoupon: () => {
      return appliedCoupon ? { code: appliedCoupon, discount: currentDiscount } : null;
    },

    // ========== CONSULTAS ==========
    
    items: () => read(),
    
    count: () => read().length,
    
    total: () => {
      const items = read();
      const subtotal = calculateSubtotal(items);
      return subtotal - calculateDiscount(subtotal);
    },
    
    subtotal: () => {
      const items = read();
      return calculateSubtotal(items);
    },
    
    getDiscount: () => calculateDiscount(calculateSubtotal(read())),
    
    getDiscountPercent: () => currentDiscount,
    
    has: (id) => !!read().find(i => i.id === id),
    
    getTotals: getTotals,
    
    getQuantity: (id) => {
      const item = read().find(i => i.id === id);
      return item ? (item.quantity || 1) : 0;
    },
    
    isEmpty: () => read().length === 0,

    // ========== SISTEMA DE EVENTOS / SUSCRIPCIÓN ==========
    
    subscribe: (callback) => {
      if (typeof callback !== 'function') return () => {};
      listeners.push(callback);
      const totals = getTotals();
      callback({ items: read(), ...totals });
      return () => { listeners = listeners.filter(fn => fn !== callback); };
    },
    
    // ========== RENDERIZADO UI ==========
    
    syncBadges: () => {
      const totals = getTotals();
      document.querySelectorAll('.navbar__cart-count').forEach(el => {
        el.textContent = totals.totalQuantity;
        el.classList.toggle('visible', totals.totalQuantity > 0);
      });
    },

    renderPage: () => {
      const listEl = document.getElementById('cart-items');
      const emptyEl = document.getElementById('cart-empty');
      const summaryEl = document.getElementById('cart-summary');
      
      if (!listEl) return;

      const items = read();
      const totals = getTotals();

      if (!items.length) {
        if (emptyEl) emptyEl.style.display = 'flex';
        if (summaryEl) summaryEl.style.display = 'none';
        if (listEl) listEl.innerHTML = '';
        return;
      }

      if (emptyEl) emptyEl.style.display = 'none';
      if (summaryEl) summaryEl.style.display = 'block';

      // Renderizar items
      listEl.innerHTML = items.map(item => {
        const itemTotal = item.price * (item.quantity || 1);
        return `
          <div class="cart-item glass reveal" data-id="${item.id}">
            <span class="cart-item__ico">${item.icon || '📦'}</span>
            <div class="cart-item__info">
              <h4>${escapeHtml(item.name)}</h4>
              <span class="chip">${item.type || 'Producto'} · ${item.version || 'v1.0'}</span>
            </div>
            <div class="cart-item__quantity">
              <button class="btn-qty" onclick="Cart.updateQuantity('${item.id}', -1)">−</button>
              <span class="qty-num">${item.quantity || 1}</span>
              <button class="btn-qty" onclick="Cart.updateQuantity('${item.id}', 1)">+</button>
            </div>
            <span class="cart-item__price">$${itemTotal.toFixed(2)}</span>
            <button class="btn btn--out-c btn--sm" onclick="Cart.remove('${item.id}')">✕</button>
          </div>
        `;
      }).join('');

      // Actualizar resumen
      const subtotalEl = document.getElementById('summary-subtotal');
      const totalEl = document.getElementById('summary-total');
      const discountEl = document.getElementById('summary-discount');
      
      if (subtotalEl) subtotalEl.textContent = `$${totals.subtotal.toFixed(2)}`;
      if (totalEl) totalEl.textContent = `$${totals.total.toFixed(2)} USD`;
      if (discountEl) discountEl.textContent = `-$${totals.discount.toFixed(2)}`;
      
      // Mostrar cupón activo en el input
      const couponInput = document.getElementById('coupon-input');
      if (couponInput && appliedCoupon) {
        couponInput.value = appliedCoupon;
      }
    },

    renderCheckout: () => {
      const wrap = document.getElementById('order-items');
      const tot = document.getElementById('order-total');
      if (!wrap) return;
      
      const items = read();
      const totals = getTotals();
      
      wrap.innerHTML = items.length
        ? items.map(i => `<div class="order-mini__item"><span>${i.icon} ${i.name} ${i.quantity > 1 ? `(x${i.quantity})` : ''}</span><span>$${(i.price * (i.quantity || 1)).toFixed(2)}</span></div>`).join('')
        : '<p style="color:var(--t-40);font-size:.82rem">No hay productos en el carrito.</p>';
      
      if (tot) tot.textContent = `$${totals.total.toFixed(2)}`;
      
      // Mostrar descuento si aplica
      const discountEl = document.getElementById('checkout-discount');
      if (discountEl) {
        discountEl.style.display = totals.discount > 0 ? 'flex' : 'none';
        discountEl.querySelector('.discount-amount').textContent = `-$${totals.discount.toFixed(2)}`;
      }
    },

    // ========== INICIALIZACIÓN ==========
    
    init: () => {
      loadSavedCoupon();
      Cart.syncBadges();
      Cart.renderPage();
      Cart.renderCheckout();
      
      // Escuchar cambios
      EventBus.on('cart:changed', () => {
        Cart.syncBadges();
        Cart.renderPage();
        Cart.renderCheckout();
      });
      
      // Sincronizar entre pestañas
      window.addEventListener('storage', (e) => {
        if (e.key === KEY || e.key === COUPON_KEY) {
          loadSavedCoupon();
          notifyListeners();
          Cart.renderPage();
          Cart.renderCheckout();
          Cart.syncBadges();
        }
      });
      
      console.log('[Cart] Inicializado v4 con cupones y cantidades');
    }
  };
})();

// Helper para escape HTML
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Auto-inicializar cuando DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => Cart.init());
} else {
  Cart.init();
}

// Exportar global
window.Cart = Cart;