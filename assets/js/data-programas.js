/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                    JLΩNIX — DATOS MAESTROS DE PROGRAMAS                       ║
 * ║  • 4 programas de pago (con carrito, vídeo, catálogo PDF, especificaciones)  ║
 * ║  • 4 programas gratuitos (descarga directa, requisitos ligeros)              ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

'use strict';

// ================================== DATOS UNIFICADOS ==================================
const JLONIX_ITEMS = [
    // ==================== PROGRAMAS DE PAGO ====================
    {
      type: 'paid',
      id: 'GEO_01',
      ico: '🏗️',
      nombre: 'GEO_01',
      version: 'v 3.0',
      categoria: "topografia", // uno de: "estructural", "hidraulica", "topografia", 
      desc: 'Programa para calculadora TI-Nspire CX que automatiza el cálculo completo del alineamiento horizontal de carreteras, siguiendo la metodología de Cárdenas Grisales (Diseño Geométrico de Vías). Abarca desde coordenadas de PI hasta generación de cartera de replanteo por deflexiones.',
      precioBs: 60,
      precioUSD: 8,
      imagen: "assets/img/GEO_01/GEO_01.png",

      // 🔥 CAMBIO AQUÍ

      video: 'https://drive.google.com/file/d/1x4BtldVvPC8cNs0SQFFfQoP4uGU9v0Gc/preview',

      poster: "../assets/img/GEO_01/GEO_01_1.png", 



      badge: '⭐ TOP VENTAS',
      badgeType: 'gold',
      features: [
        'Capacidad de hasta 50 puntos PI por proyecto',
        'Curvas horizontales con espirales de transición (clotoides) entrada/salida',
        'Curvas circulares simples (longitud de espiral = 0)',
        'Visualización gráfica interactiva de poligonal y elementos geométricos',
        'Generación automática de cálculos paso a paso para verificación técnica',
        'Sistema de licenciamiento por identificación única del dispositivo',
        'Cálculo de poligonal principal (distancias, azimutes, deflexiones)',
        'Cálculo de espirales (parámetros, coordenadas paramétricas, desplazamientos)',
        'Cálculo de tangentes y coordenadas (TE, EC, CE, ET)',
        'Cálculo de progresivas / abscisado (formato km+m)',
        'Replanteo por deflexiones (cartera de campo con paso configurable)'
      ],
      requirements: {
        os: 'TI-Nspire CX (calculadora)',
        ram: 'N/A',
        storage: 'N/A',
        processor: 'TI-Nspire CX'
      },
      rating: 4.8,
      reviews: 342,
      hasCatalog: true,
      catalogTitle: 'GEO_01 - Catálogo de Funcionamiento',
      catalogDesc: 'Catálogo detallado del programa de Diseño Geométrico de Carreteras - Alineamiento Horizontal. Incluye descripción de 5 módulos de cálculo, fórmulas completas (poligonal, espirales, tangentes, progresivas, replanteo por deflexiones), verificación numérica manual, tablas de resultados y espacios para verificación académica con capturas. Referencia: Cárdenas Grisales - Diseño Geométrico de Vías.',
      catalogImage: "../assets/img/GEO_01/GEO_01_CATALOGO.png",
      catalogUrl: 'https://drive.google.com/file/d/1G_KY-ZaCyTF1xvkYoZOEFAqTh-l39mQJ/preview', // Reemplazar con ID real
      catalogSize: '18 MB',
      catalogPages: 25,
      catalogDate: 'Febrero 2026'
    },

    {
      type: "paid",
      id: "GEO_02",
      ico: "📐",
      nombre: 'GEO_02',
      categoria: "topografia", // uno de: "estructural", "hidraulica", "topografia", 
      version: "v3.0",
      
      desc: "Programa para calculadora TI-Nspire CX que automatiza el cálculo completo del alineamiento vertical de carreteras, siguiendo la metodología de Cárdenas Grisales (Diseño Geométrico de Vías). Abarca desde ingreso de progresivas y cotas hasta generación de cartera de replanteo por método de deflexiones verticales, cálculo de curvas simétricas y asimétricas, y representación gráfica del perfil longitudinal.",
      precioBs: 60,
      precioUSD: 8,
      imagen: "assets/img/GEO_02/GEO_02.png",

      // 🔥 VIDEO CORREGIDO (modo embed)

      video: "https://drive.google.com/file/d/1YuT2k6UzOMF5ZV9xmgytQMkpc1itTLa2/preview",
      poster: "../assets/img/GEO_02/GEO_02_1.png",
      badge: "📐 INGENIERÍA VIAL",
      badgeType: "blue",
      features: [
        "Gestión de hasta 50 puntos de intersección vertical (PIV) por proyecto",
        "Modelación de curvas verticales simétricas y asimétricas",
        "Determinación automática del parámetro de curvatura vertical K",
        "Visualización gráfica interactiva del perfil longitudinal",
        "Generación automática de procedimientos de cálculo detallados",
        "Sistema de licenciamiento basado en identificador único de dispositivo"
      ],
      requirements: {
        os: "TI-Nspire CX (calculadora)",
        ram: "N/A",
        storage: "N/A",
        processor: "N/A"
      },
      rating: 4.7,
      reviews: 89,
      hasCatalog: true,
      catalogTitle: "GEO_02 – Catálogo de Funcionamiento Detallado",
      catalogDesc: "Alineamiento Vertical – v3.0. 18 páginas con descripción de módulos, fórmulas fundamentales, ejercicio completo resuelto con datos reales GEO-02, resumen de fórmulas y verificación académica.",
      catalogImage: "../assets/img/GEO_02/GEO_02_CATALOGO.png",
      catalogUrl: "https://drive.google.com/file/d/1PAHZSVbvD7N93cjj3nnYjA9XsLV4erYK/preview", // Reemplazar con ID real
      catalogSize: "N/A",
      catalogPages: 18,
      catalogDate: "Abril 2026"
    },
    
    // ==================== PROGRAMAS GRATUITOS ====================
    
    {
      type: "free",
      id: "HIDROCAL",
      ico: "📐",
      nombre: "HidroCal",
      version: "v2.1.0 Free",
      categoria: "hidrologia",
      desc: "Herramienta gratuita para cálculos hidrológicos y diseño de sistemas de drenaje.",
      plataforma: "Windows 10/11 (64 bits)",
      urlDescarga: "assets/downloads/hidrocal-v2.1.0-free.exe",
      //video: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      imagen: "assets/img/HIDROCAL/hidrocal-main.png",
      poster: "assets/img/HIDROCAL/hidrocal-poster.png",
      icoColor: "rgba(0,212,255,0.1)",
      features: [
        "Cálculo de vigas hasta 5 tramos",
        "Diagramas de cortante y momento",
        "Exportación de resultados a CSV",
        "Interfaz ligera y rápida"
      ],
      requirements: {
        os: "Windows 10/11",
        ram: "2 GB",
        storage: "120 MB",
        processor: "Intel Core 2 Duo o equivalente"
      },
      downloads: 5420,
      rating: 4.5,
      reviews: 128,
      hasManual: true,
      catalogTitle: "Manual HidroCal - Cálculos Hidrológicos",
      catalogDesc: "80 páginas: introducción a la ingeniería hidrológica y diseño de drenaje con ejemplos prácticos.",
      catalogImage: "assets/img/HIDROCAL/hidrocal-manual.png",
      //catalogUrl: "https://drive.google.com/file/d/1ecyTFgOET7mM7OpmrfbfeG1bKEtARdke/preview",
      catalogSize: "8 MB",
      catalogPages: 80,
      catalogDate: "Enero 2026"
    }
  ];

// ================================== FUNCIONES DE RENDERIZADO ==================================

// Actualiza el contador del carrito en el navbar
function updateCartCounter() {
  const cartCountSpan = document.querySelector('.navbar__cart-count');
  if (!cartCountSpan) return;
  try {
    const cart = JSON.parse(localStorage.getItem('jlonix_cart') || '[]');
    const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
    cartCountSpan.textContent = totalItems;
  } catch (e) {
    console.warn('Error actualizando contador del carrito:', e);
  }
}

// Renderiza una tarjeta de programa de PAGO (con carrito)
function renderPaidCard(p, idx) {
  const delay = idx % 3 === 0 ? '' : ` d${idx % 3}`;
  const badgeHtml = p.badge ? `<span class="bdg bdg--${p.badgeType} pcard-full__badge">${p.badge}</span>` : '';

  let mediaHtml = '';
  if (p.video && p.video.trim() !== '') {
    mediaHtml = `<iframe src="${p.video}" class="program-video" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
  } else if (p.imagen) {
    mediaHtml = `<img src="${p.imagen}" alt="${p.nombre}" class="program-img" loading="lazy"
                  onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"/>
                 <div class="img-fallback" style="display:none;"><span>${p.ico}</span></div>`;
  } else {
    mediaHtml = `<div class="img-fallback"><span>${p.ico}</span></div>`;
  }

  const shortFeatures = p.features ? p.features.slice(0, 3).map(f => `<span class="feature-badge">${f}</span>`).join('') : '';
  const ratingStars = '★'.repeat(Math.floor(p.rating || 0)) + '☆'.repeat(5 - Math.floor(p.rating || 0));

  const el = document.createElement('div');
  el.className = `glass pcard-full reveal${delay}`;
  el.dataset.cat = p.categoria;
  el.dataset.tipo = 'pago';
  el.innerHTML = `
    <div class="pcard-full__media">
      ${mediaHtml}
      ${badgeHtml}
    </div>
    <div class="pcard-full__body">
      <div class="pcard-full__chips">
        <span class="chip">${p.categoria.toUpperCase()}</span>
        <span class="chip">${p.version}</span>
      </div>
      <h3 class="pcard-full__title">${p.nombre}</h3>
      <p class="pcard-full__desc">${p.desc}</p>
      <div class="pcard-full__rating">
        <span class="stars">${ratingStars}</span> (${p.reviews} reseñas)
      </div>
      <div class="pcard-full__features">
        <strong>⚡ Características destacadas:</strong>
        <div class="feature-list">${shortFeatures}</div>
      </div>
      <div class="pcard-full__footer">
        <div>
          <span class="pcard-full__price">Bs ${p.precioBs.toLocaleString('es-BO')}</span>
          <small>≈ $${p.precioUSD} USD</small>
        </div>
        <div class="pcard-full__actions">
          <button class="btn btn--cyan btn--sm add-to-cart"
            data-id="${p.id}"
            data-name="${p.nombre}"
            data-pricebs="${p.precioBs}"
            data-icon="${p.ico}">
            🧺 Agregar
          </button>
        </div>
      </div>
    </div>`;
  return el;
}

// Renderiza una tarjeta de programa GRATUITO (con descarga)
function renderFreeCard(p, idx) {
  const delay = idx % 3 === 0 ? '' : ` d${idx % 3}`;
  let mediaHtml = '';
  
  if (p.video && p.video.trim() !== '') {
    mediaHtml = `<iframe src="${p.video}" class="program-video" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
  } else if (p.imagen) {
    mediaHtml = `<img src="${p.imagen}" alt="${p.nombre}" class="program-img" loading="lazy"
          onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"/>
       <div class="img-fallback" style="display:none;"><span>${p.ico}</span></div>`;
  } else {
    mediaHtml = `<div class="img-fallback"><span>${p.ico}</span></div>`;
  }

  const shortFeatures = p.features ? p.features.slice(0, 2).map(f => `<span class="feature-badge">${f}</span>`).join('') : '';

  const el = document.createElement('div');
  el.className = `glass pcard-full reveal${delay}`;
  el.dataset.cat = p.categoria;
  el.dataset.tipo = 'gratis';
  el.innerHTML = `
    <div class="pcard-full__media" style="background:${p.icoColor || 'rgba(0,229,192,.06)'}">
      ${mediaHtml}
      <span class="free-badge">GRATIS</span>
    </div>
    <div class="pcard-full__body">
      <div class="pcard-full__chips">
        <span class="chip">Gratuito</span>
        <span class="chip">${p.version}</span>
      </div>
      <h3 class="pcard-full__title">${p.nombre}</h3>
      <p class="pcard-full__desc">${p.desc}</p>
      <div class="pcard-full__features">
        <strong>✨ Incluye:</strong>
        <div class="feature-list">${shortFeatures}</div>
      </div>
      <div class="pcard-full__footer">
        <div>
          <span class="pcard-full__price" style="color:var(--teal)">$0.00</span>
          <small>${p.plataforma}</small>
        </div>
        <div class="pcard-full__actions">
          <a href="${p.urlDescarga}" class="btn btn--teal btn--sm" download>⬇ Descargar</a>
        </div>
      </div>
    </div>`;
  return el;
}

// Manejador para agregar al carrito
function addToCartHandler(e) {
  const btn = e.currentTarget;
  const id = btn.dataset.id;
  const name = btn.dataset.name;
  const priceBS = parseFloat(btn.dataset.pricebs);
  const icon = btn.dataset.icon || '📦';
  let cart = JSON.parse(localStorage.getItem('jlonix_cart') || '[]');
  const existing = cart.find(p => p.id === id);
  if (existing) existing.quantity = (existing.quantity || 1) + 1;
  else cart.push({ id, name, priceBS: priceBS, price: priceBS, icon, quantity: 1, type: 'Licencia permanente' });
  localStorage.setItem('jlonix_cart', JSON.stringify(cart));
  updateCartCounter();
  if (window.UI && typeof UI.showToast === 'function') UI.showToast(`✅ ${name} agregado al carrito`, 'success');
  else alert(`✅ ${name} agregado al carrito`);
}

// ==================== RENDERIZADO DE GRIDS ====================

function renderPaidGrid(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';
  const paid = JLONIX_ITEMS.filter(i => i.type === 'paid');
  paid.forEach((item, idx) => container.appendChild(renderPaidCard(item, idx)));
  document.querySelectorAll('.add-to-cart').forEach(btn => {
    btn.removeEventListener('click', addToCartHandler);
    btn.addEventListener('click', addToCartHandler);
  });
  updateCartCounter();
}

function renderFreeGrid(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';
  const free = JLONIX_ITEMS.filter(i => i.type === 'free');
  free.forEach((item, idx) => container.appendChild(renderFreeCard(item, idx)));
  updateCartCounter();
}

function renderFullProgramsGrid(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';
  const paid = JLONIX_ITEMS.filter(i => i.type === 'paid');
  const free = JLONIX_ITEMS.filter(i => i.type === 'free');
  paid.forEach((item, idx) => container.appendChild(renderPaidCard(item, idx)));
  if (free.length > 0) {
    const sep = document.createElement('div');
    sep.className = 'separator-gratis';
    sep.innerHTML = '<span>🎁 PROGRAMAS GRATUITOS</span>';
    container.appendChild(sep);
    free.forEach((item, idx) => container.appendChild(renderFreeCard(item, idx)));
  }
  document.querySelectorAll('.add-to-cart').forEach(btn => {
    btn.removeEventListener('click', addToCartHandler);
    btn.addEventListener('click', addToCartHandler);
  });
  updateCartCounter();
}

// ==================== EXPOSICIÓN GLOBAL ====================
window.JLONIX = {
  items: JLONIX_ITEMS,
  renderPaidGrid,
  renderFreeGrid,
  renderFullProgramsGrid,
  updateCartCounter
};

// Inicializar contador al cargar la página
document.addEventListener('DOMContentLoaded', () => updateCartCounter());
