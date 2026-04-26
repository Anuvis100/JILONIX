/* ╔══════════════════════════════════════════════════════════════╗
   ║  Carousel.js — Clase con soporte touch, teclado y a11y      ║
   ╚══════════════════════════════════════════════════════════════╝ */
class Carousel {
  #cur = 0; #raf = null; #t0 = null;
  #isDrag = false; #sx = 0; #ox = 0;

  constructor(sel, opts = {}) {
    this.root  = typeof sel === 'string' ? document.querySelector(sel) : sel;
    if (!this.root) return;
    this.opts  = { autoPlay:true, interval:4800, loop:true, ...opts };
    this.vp    = this.root.querySelector('.carousel__vp');
    this.track = this.root.querySelector('.carousel__track');
    this.items = [...this.track.children];
    this.dWrap = this.root.querySelector('.carousel__dots');
    this.pBar  = this.root.querySelector('.carousel__prog-bar');
    if (!this.vp || !this.track || !this.items.length) return;
    this.#setup();
  }

  #setup() {
    this.#buildDots();
    this.#bindArrows();
    this.#bindDrag();
    this.#bindKeyboard();
    this.#bindA11y();
    this.#go(0, false);
    if (this.opts.autoPlay) this.#startAuto();
    this.root.addEventListener('mouseenter', () => this.#stopAuto());
    this.root.addEventListener('mouseleave', () => { if(this.opts.autoPlay) this.#startAuto(); });
  }

  #buildDots() {
    if (!this.dWrap) return;
    this.dWrap.innerHTML = '';
    this.items.forEach((_, i) => {
      const b = document.createElement('button');
      b.className = 'cdot'; b.type = 'button';
      b.setAttribute('aria-label', `Slide ${i+1} de ${this.items.length}`);
      b.addEventListener('click', () => this.#go(i));
      this.dWrap.appendChild(b);
    });
  }

  #bindArrows() {
    this.root.querySelector('[data-prev]')?.addEventListener('click', () => this.#go(this.#cur - 1));
    this.root.querySelector('[data-next]')?.addEventListener('click', () => this.#go(this.#cur + 1));
  }

  #bindDrag() {
    const onDown = x => { this.#isDrag=true; this.#sx=x; this.#ox=this.#getX(); };
    const onMove = x => {
      if (!this.#isDrag) return;
      this.track.style.transition='none';
      this.#setX(this.#ox + (x - this.#sx));
    };
    const onUp = x => {
      if (!this.#isDrag) return; this.#isDrag=false;
      this.track.style.transition='';
      const d = x - this.#sx;
      if (Math.abs(d) > 52) this.#go(this.#cur + (d<0?1:-1));
      else this.#go(this.#cur, false);
    };

    this.vp.addEventListener('mousedown',  e => onDown(e.clientX));
    window.addEventListener('mousemove',   e => onMove(e.clientX));
    window.addEventListener('mouseup',     e => onUp(e.clientX));
    this.vp.addEventListener('touchstart', e => onDown(e.touches[0].clientX), {passive:true});
    this.vp.addEventListener('touchmove',  e => onMove(e.touches[0].clientX), {passive:true});
    this.vp.addEventListener('touchend',   e => onUp(e.changedTouches[0].clientX));
  }

  #bindKeyboard() {
    this.root.tabIndex = 0;
    this.root.addEventListener('keydown', e => {
      if (e.key==='ArrowLeft')  this.#go(this.#cur-1);
      if (e.key==='ArrowRight') this.#go(this.#cur+1);
      if (e.key==='Home')       this.#go(0);
      if (e.key==='End')        this.#go(this.items.length-1);
    });
  }

  #bindA11y() {
    this.root.setAttribute('role','region');
    this.root.setAttribute('aria-label','Carrusel de productos');
    this.items.forEach((el,i) => {
      el.setAttribute('role','group');
      el.setAttribute('aria-label',`Producto ${i+1} de ${this.items.length}`);
    });
  }

  #getX() {
    const m = (this.track.style.translate||'').match(/^([-\d.]+)/);
    return m ? +m[1] : 0;
  }
  #setX(x) { this.track.style.translate = `${x}px 0`; }

  #slideW() {
    return (this.items[0]?.getBoundingClientRect().width || 320) + 20;
  }

  #go(idx, animate=true) {
    const max = this.items.length - 1;
    if (this.opts.loop) {
      if (idx < 0)   idx = max;
      if (idx > max) idx = 0;
    } else {
      idx = Math.max(0, Math.min(idx, max));
    }
    this.#cur = idx;
    const sw = this.#slideW();
    if (!animate) { this.track.style.transition='none'; }
    this.#setX(-this.#cur * sw);
    if (!animate) requestAnimationFrame(() => this.track.style.transition='');

    /* Dots */
    this.dWrap?.querySelectorAll('.cdot').forEach((d,i) => d.classList.toggle('on', i===this.#cur));
    /* Flechas */
    if (!this.opts.loop) {
      this.root.querySelector('[data-prev]') && (this.root.querySelector('[data-prev]').disabled = this.#cur===0);
      this.root.querySelector('[data-next]') && (this.root.querySelector('[data-next]').disabled = this.#cur===max);
    }
    EventBus.emit('carousel:change', { cur:this.#cur, total:this.items.length });
  }

  #startAuto() {
    this.#stopAuto();
    this.#t0 = performance.now();
    const tick = ts => {
      if (!this.#t0) return;
      const pct = Math.min(((ts-this.#t0)/this.opts.interval)*100, 100);
      if (this.pBar) this.pBar.style.width = pct+'%';
      if (ts - this.#t0 >= this.opts.interval) {
        this.#go(this.#cur+1); this.#t0 = ts;
      }
      this.#raf = requestAnimationFrame(tick);
    };
    this.#raf = requestAnimationFrame(tick);
  }

  #stopAuto() {
    if (this.#raf) cancelAnimationFrame(this.#raf);
    this.#raf=null; this.#t0=null;
    if (this.pBar) this.pBar.style.width='0%';
  }

  /* API pública */
  next()    { this.#go(this.#cur+1); }
  prev()    { this.#go(this.#cur-1); }
  goto(i)   { this.#go(i); }
  destroy() { this.#stopAuto(); }
}