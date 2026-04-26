/* ╔══════════════════════════════════════════════════════════════╗
   ║  Modal.js — Lightbox de detalles de producto                 ║
   ╚══════════════════════════════════════════════════════════════╝ */
const Modal = (() => {
  let backdrop, modal;

  function build() {
    if (backdrop) return;
    backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop';
    backdrop.innerHTML = `
      <div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div class="modal__header">
          <h2 class="modal__title" id="modal-title">Detalle del producto</h2>
          <button class="modal__close" aria-label="Cerrar">✕</button>
        </div>
        <div class="modal__body">
          <div class="modal__video">
            <video id="modal-video" autoplay muted loop playsinline></video>
          </div>
          <p class="modal__desc" id="modal-desc"></p>
          <div class="modal__specs" id="modal-specs"></div>
          <div class="modal__actions" id="modal-actions"></div>
        </div>
      </div>
    `;
    document.body.appendChild(backdrop);
    modal = backdrop.querySelector('.modal');

    /* Cerrar */
    backdrop.querySelector('.modal__close').addEventListener('click', close);
    backdrop.addEventListener('pointerdown', e => { if (e.target===backdrop) close(); });
    document.addEventListener('keydown', e => { if (e.key==='Escape') close(); });
  }

  function open(data) {
    build();
    backdrop.querySelector('.modal__title').textContent = data.name || '';
    backdrop.querySelector('#modal-desc').textContent   = data.desc || '';

    const vid = backdrop.querySelector('#modal-video');
    if (data.video) { vid.src = data.video; vid.poster = data.poster||''; }

    const specs = backdrop.querySelector('#modal-specs');
    specs.innerHTML = (data.specs||[]).map(s =>
      `<div class="modal__spec">
        <div class="modal__spec-key">${s.key}</div>
        <div class="modal__spec-val">${s.val}</div>
      </div>`
    ).join('');

    const acts = backdrop.querySelector('#modal-actions');
    acts.innerHTML = `
      <button class="btn btn--omega btn--lg" onclick="Cart.add('${data.id}','${data.name}',${data.price},'${data.icon}','${data.type}','${data.version||''}');Modal.close();">
        🧺 Agregar al carrito — $${data.price}
      </button>
      <button class="btn btn--out-c btn--lg" onclick="Modal.close()">Cerrar</button>
    `;

    backdrop.classList.add('open');
    document.body.style.overflow = 'hidden';
    EventBus.emit('modal:open', data);
  }

  function close() {
    backdrop?.classList.remove('open');
    document.body.style.overflow = '';
    const vid = backdrop?.querySelector('#modal-video');
    if (vid) { vid.pause(); vid.src=''; }
    EventBus.emit('modal:close');
  }

  return { open, close };
})();