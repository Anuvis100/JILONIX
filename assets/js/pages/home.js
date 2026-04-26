/* ╔══════════════════════════════════════════════════════════════╗
   ║  home.js — Bootstrap exclusivo de index.html                 ║
   ╚══════════════════════════════════════════════════════════════╝ */
document.addEventListener('DOMContentLoaded', () => {
  /* Carrusel principal con autoplay */
  new Carousel('#hero-carousel', { autoPlay:true, interval:5000, loop:true });

  /* Escuchar cambios del carrusel */
  EventBus.on('carousel:change', ({ cur, total }) => {
    /* Se podría actualizar un contador externo, etc. */
  });
});