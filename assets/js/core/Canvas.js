/* ╔══════════════════════════════════════════════════════════════╗
   ║  Canvas.js — Red neuronal geométrica animada                 ║
   ║  Versión profesional: rendimiento optimizado, más efectos    ║
   ║  IIFE autocontenida, sin dependencias.                       ║
   ╚══════════════════════════════════════════════════════════════╝ */

const NeuralCanvas = (() => {

  // ============================================================
  // CONFIGURACIÓN MEJORADA
  // ============================================================
  const CONFIG = {
    // Nodos
    nodes: {
      count: 120,              // Número de nodos (aumentado)
      minRadius: 1.2,
      maxRadius: 3.5,
      pulseSpeed: 0.035,
      pulseAmount: 0.6
    },
    // Conexiones
    connections: {
      maxDistance: 180,        // Distancia máxima para conectar
      opacityFactor: 0.42,     // Factor de opacidad base
      lineWidth: 0.65,         // Grosor de líneas
      glowIntensity: 6         // Intensidad del glow
    },
    // Movimiento
    motion: {
      baseSpeed: 0.48,
      mouseRepelRadius: 130,
      mouseRepelForce: 2.4,
      edgeBounceSoftness: 0.98,
      damping: 0.995
    },
    // Visuales
    visuals: {
      colors: ['#00d4ff', '#7b00ff', '#ffd700', '#00e5c0', '#ff2d9b', '#ff7a00', '#00e564'],
      shapes: ['circle', 'tri', 'diamond', 'hex', 'square', 'star'],
      particleGlow: true,
      connectionGlow: true,
      backgroundColor: 'rgba(1, 1, 13, 0)'
    },
    // Rendimiento
    performance: {
      targetFPS: 60,
      dynamicQuality: true,
      minDistanceForConnection: 30
    }
  };

  // Variables de estado
  let canvas, ctx, W, H, nodes, raf;
  let mouse = { x: -9999, y: -9999, isMoving: false };
  let lastTimestamp = 0;
  let fpsInterval = 1000 / CONFIG.performance.targetFPS;
  let qualityLevel = 1; // 1 = full, 0.75 = medium, 0.5 = low
  let frameCount = 0;
  let lastFPSUpdate = 0;

  // ============================================================
  // CREAR NODO (mejorado)
  // ============================================================
  const createNode = () => {
    const radius = CONFIG.nodes.minRadius + 
                   Math.random() * (CONFIG.nodes.maxRadius - CONFIG.nodes.minRadius);
    
    return {
      // Posición
      x: Math.random() * W,
      y: Math.random() * H,
      // Velocidad
      vx: (Math.random() - 0.5) * CONFIG.motion.baseSpeed,
      vy: (Math.random() - 0.5) * CONFIG.motion.baseSpeed,
      // Tamaño
      r: radius,
      // Color
      color: CONFIG.visuals.colors[Math.floor(Math.random() * CONFIG.visuals.colors.length)],
      // Forma
      shape: CONFIG.visuals.shapes[Math.floor(Math.random() * CONFIG.visuals.shapes.length)],
      // Fase de animación
      phase: Math.random() * Math.PI * 2,
      // Velocidad de pulso
      pulseSpeed: CONFIG.nodes.pulseSpeed + (Math.random() - 0.5) * 0.01,
      // Opacidad individual
      opacity: 0.5 + Math.random() * 0.4,
      // Peso (para simulación)
      mass: 0.8 + Math.random() * 0.7
    };
  };

  // ============================================================
  // DIBUJAR FORMA (mejorado)
  // ============================================================
  function drawShape(node, alpha, pulseFactor = 1) {
    const radius = node.r * 2.2 * pulseFactor + Math.sin(node.phase) * 0.8;
    
    ctx.save();
    ctx.globalAlpha = alpha * node.opacity;
    ctx.strokeStyle = node.color;
    ctx.fillStyle = node.color + '22';
    ctx.lineWidth = 0.9;
    
    if (CONFIG.visuals.particleGlow) {
      ctx.shadowBlur = 12;
      ctx.shadowColor = node.color;
    }
    
    ctx.translate(node.x, node.y);
    ctx.beginPath();

    switch (node.shape) {
      case 'circle':
        ctx.arc(0, 0, radius * 0.85, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        break;
        
      case 'tri':
        ctx.moveTo(0, -radius);
        ctx.lineTo(radius * 0.87, radius * 0.5);
        ctx.lineTo(-radius * 0.87, radius * 0.5);
        ctx.closePath();
        ctx.stroke();
        break;
        
      case 'diamond':
        ctx.moveTo(0, -radius);
        ctx.lineTo(radius * 0.65, 0);
        ctx.lineTo(0, radius);
        ctx.lineTo(-radius * 0.65, 0);
        ctx.closePath();
        ctx.stroke();
        break;
        
      case 'hex':
        for (let i = 0; i < 6; i++) {
          const angle = (i * Math.PI) / 3 - Math.PI / 6;
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.stroke();
        break;
        
      case 'square':
        ctx.rect(-radius * 0.7, -radius * 0.7, radius * 1.4, radius * 1.4);
        ctx.stroke();
        break;
        
      case 'star':
        for (let i = 0; i < 10; i++) {
          const angle = (i * Math.PI) / 5 - Math.PI / 2;
          const rad = i % 2 === 0 ? radius : radius * 0.45;
          const x = Math.cos(angle) * rad;
          const y = Math.sin(angle) * rad;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.stroke();
        break;
    }
    
    ctx.restore();
  }

  // ============================================================
  // ACTUALIZAR NODOS (física mejorada)
  // ============================================================
  function updateNodes() {
    const repelRadius = CONFIG.motion.mouseRepelRadius;
    const repelForce = CONFIG.motion.mouseRepelForce;
    
    nodes.forEach(node => {
      // Actualizar posición
      node.x += node.vx;
      node.y += node.vy;
      
      // Actualizar fase para animación
      node.phase += node.pulseSpeed;
      if (node.phase > Math.PI * 2) node.phase -= Math.PI * 2;
      
      // Rebote en bordes con amortiguamiento
      if (node.x < 0) {
        node.x = 0;
        node.vx *= -CONFIG.motion.edgeBounceSoftness;
      }
      if (node.x > W) {
        node.x = W;
        node.vx *= -CONFIG.motion.edgeBounceSoftness;
      }
      if (node.y < 0) {
        node.y = 0;
        node.vy *= -CONFIG.motion.edgeBounceSoftness;
      }
      if (node.y > H) {
        node.y = H;
        node.vy *= -CONFIG.motion.edgeBounceSoftness;
      }
      
      // Repulsión del mouse
      if (mouse.isMoving) {
        const dx = node.x - mouse.x;
        const dy = node.y - mouse.y;
        const distance = Math.hypot(dx, dy);
        
        if (distance < repelRadius && distance > 0.01) {
          const force = (1 - distance / repelRadius) * repelForce / node.mass;
          node.x += (dx / distance) * force;
          node.y += (dy / distance) * force;
          
          // También afectar velocidad para movimiento más natural
          node.vx += (dx / distance) * force * 0.3;
          node.vy += (dy / distance) * force * 0.3;
        }
      }
      
      // Amortiguamiento gradual
      node.vx *= CONFIG.motion.damping;
      node.vy *= CONFIG.motion.damping;
      
      // Límite de velocidad
      const maxSpeed = CONFIG.motion.baseSpeed * 2;
      node.vx = Math.min(maxSpeed, Math.max(-maxSpeed, node.vx));
      node.vy = Math.min(maxSpeed, Math.max(-maxSpeed, node.vy));
    });
  }

  // ============================================================
  // DIBUJAR CONEXIONES (optimizado)
  // ============================================================
  function drawConnections() {
    const maxDist = CONFIG.connections.maxDistance;
    const minDist = CONFIG.performance.minDistanceForConnection;
    const connectionCount = nodes.length;
    
    // Optimización: solo procesar conexiones necesarias
    for (let i = 0; i < connectionCount; i++) {
      const nodeA = nodes[i];
      
      for (let j = i + 1; j < connectionCount; j++) {
        const nodeB = nodes[j];
        const dx = nodeA.x - nodeB.x;
        const dy = nodeA.y - nodeB.y;
        const distance = Math.hypot(dx, dy);
        
        // Filtrar conexiones fuera de rango
        if (distance >= maxDist || distance < minDist) continue;
        
        // Calcular opacidad basada en distancia
        const opacity = (1 - distance / maxDist) * CONFIG.connections.opacityFactor;
        if (opacity < 0.05) continue;
        
        // Crear gradiente entre colores
        const gradient = ctx.createLinearGradient(nodeA.x, nodeA.y, nodeB.x, nodeB.y);
        gradient.addColorStop(0, nodeA.color);
        gradient.addColorStop(1, nodeB.color);
        
        ctx.save();
        ctx.globalAlpha = opacity;
        ctx.strokeStyle = gradient;
        ctx.lineWidth = CONFIG.connections.lineWidth * qualityLevel;
        
        if (CONFIG.visuals.connectionGlow && qualityLevel > 0.7) {
          ctx.shadowBlur = CONFIG.connections.glowIntensity;
          ctx.shadowColor = nodeA.color;
        }
        
        ctx.beginPath();
        ctx.moveTo(nodeA.x, nodeA.y);
        ctx.lineTo(nodeB.x, nodeB.y);
        ctx.stroke();
        ctx.restore();
      }
    }
  }

  // ============================================================
  // DIBUJAR NODOS (optimizado)
  // ============================================================
  function drawNodes() {
    const pulseFactor = 1 + Math.sin(Date.now() * 0.002) * 0.08;
    
    nodes.forEach(node => {
      drawShape(node, 0.75, pulseFactor);
    });
  }

  // ============================================================
  // EFECTO DE PARPADEO ESTELAR (fondo)
  // ============================================================
  function drawStarfield() {
    if (qualityLevel < 0.6) return;
    
    const starCount = Math.floor(100 * qualityLevel);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    
    for (let i = 0; i < starCount; i++) {
      // Usar posición basada en seed para consistencia
      const seed = i * 12345;
      const x = (seed * 9301 + 49297) % W;
      const y = (seed * 49297 + 233) % H;
      const size = ((seed * 233) % 3) + 1;
      
      ctx.beginPath();
      ctx.arc(x, y, size * 0.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // ============================================================
  // LOOP PRINCIPAL (optimizado con FPS dinámico)
  // ============================================================
  function loop(timestamp) {
    raf = requestAnimationFrame(loop);
    
    // Control de FPS
    if (timestamp - lastTimestamp < fpsInterval) return;
    lastTimestamp = timestamp;
    
    // Actualizar calidad dinámica basada en FPS
    frameCount++;
    if (timestamp - lastFPSUpdate >= 1000) {
      const actualFPS = frameCount;
      frameCount = 0;
      lastFPSUpdate = timestamp;
      
      if (CONFIG.performance.dynamicQuality) {
        if (actualFPS < 45) qualityLevel = 0.5;
        else if (actualFPS < 55) qualityLevel = 0.75;
        else qualityLevel = 1;
      }
    }
    
    // Limpiar canvas
    ctx.clearRect(0, 0, W, H);
    
    // Dibujar fondo sutil
    if (qualityLevel > 0.5) {
      drawStarfield();
    }
    
    // Actualizar física
    updateNodes();
    
    // Dibujar conexiones (solo si calidad lo permite)
    if (qualityLevel > 0.4) {
      drawConnections();
    }
    
    // Dibujar nodos
    drawNodes();
  }

  // ============================================================
  // MANEJADOR DE RESIZE (optimizado)
  // ============================================================
  let resizeTimeout;
  
  function handleResize() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
      
      // Recrear nodos para nuevas dimensiones
      nodes = Array.from({ length: CONFIG.nodes.count }, createNode);
      
      EventBus?.emit('canvas:resized', { width: W, height: H });
    }, 150);
  }

  // ============================================================
  // MANEJADOR DE MOVIMIENTO DEL MOUSE
  // ============================================================
  function handleMouseMove(e) {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    mouse.isMoving = true;
    
    // Resetear estado después de inactividad
    clearTimeout(mouse.inactivityTimeout);
    mouse.inactivityTimeout = setTimeout(() => {
      mouse.isMoving = false;
    }, 500);
  }

  function handleMouseLeave() {
    mouse.isMoving = false;
    mouse.x = -9999;
    mouse.y = -9999;
  }

  // ============================================================
  // INICIALIZACIÓN (mejorada)
  // ============================================================
  function init() {
    canvas = document.getElementById('canvas-bg');
    if (!canvas) {
      console.warn('⚠️ Canvas element #canvas-bg no encontrado');
      return;
    }
    
    ctx = canvas.getContext('2d');
    if (!ctx) {
      console.warn('⚠️ No se pudo obtener contexto 2D');
      return;
    }
    
    // Configurar canvas
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
    
    // Crear nodos
    nodes = Array.from({ length: CONFIG.nodes.count }, createNode);
    
    // Configurar eventos
    window.addEventListener('resize', handleResize, { passive: true });
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mouseleave', handleMouseLeave);
    
    // Soporte táctil para móviles
    window.addEventListener('touchmove', (e) => {
      if (e.touches.length > 0) {
        mouse.x = e.touches[0].clientX;
        mouse.y = e.touches[0].clientY;
        mouse.isMoving = true;
        
        clearTimeout(mouse.inactivityTimeout);
        mouse.inactivityTimeout = setTimeout(() => {
          mouse.isMoving = false;
        }, 500);
      }
    }, { passive: true });
    
    // Iniciar animación
    raf = requestAnimationFrame(loop);
    
    console.log('✅ NeuralCanvas inicializado');
    EventBus?.emit('canvas:initialized', { width: W, height: H });
  }

  // ============================================================
  // DESTRUIR (limpiar recursos)
  // ============================================================
  function destroy() {
    if (raf) {
      cancelAnimationFrame(raf);
      raf = null;
    }
    
    window.removeEventListener('resize', handleResize);
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseleave', handleMouseLeave);
    
    if (ctx) {
      ctx.clearRect(0, 0, W, H);
    }
    
    nodes = [];
    console.log('✅ NeuralCanvas destruido');
    EventBus?.emit('canvas:destroyed');
  }

  // ============================================================
  // CONFIGURACIÓN DINÁMICA (API pública)
  // ============================================================
  function setConfig(newConfig) {
    Object.assign(CONFIG, newConfig);
    // Recrear nodos si cambia el conteo
    if (newConfig.nodes?.count) {
      nodes = Array.from({ length: CONFIG.nodes.count }, createNode);
    }
  }

  function getConfig() {
    return { ...CONFIG };
  }

  // ============================================================
  // API PÚBLICA
  // ============================================================
  return {
    init,
    destroy,
    setConfig,
    getConfig,
    getNodesCount: () => nodes?.length || 0,
    isRunning: () => !!raf
  };

})();

// Auto-inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => NeuralCanvas.init());
} else {
  NeuralCanvas.init();
}