// assets/js/pages/checkout.js
// Módulo de checkout con registro en Google Sheets (sin problemas de CORS)

(function() {
    'use strict';

    // --- CONFIGURACIÓN ---
    // ⚠️ Reemplaza esta URL con la de tu Google Apps Script desplegado
    const GOOGLE_SHEETS_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbzIBIpx8DlM79ceoPdNVcwOxqnC7DF0whnrX0T9b2XU8E2uwkcT2XBKIjS_LhkNddt9Ag/exec';
    
    // --- ELEMENTOS DOM ---
    let step1, step2, step3;
    let step1Ind, step2Ind, step3Ind;
    let line1, line2;
    let btnContinuar, btnVolver, btnEnviar;
    let loadingOverlay, loadingMsg;

    // Variables globales del pedido
    let currentOrder = null;
    let selectedMethod = 'qr'; // qr o banco
    let uploadedFile = null;
    let uploadDataUrl = null;
    let isSubmitting = false;

    // Asegurar que showToast exista (fallback)
    if (typeof window.showToast !== 'function') {
        window.showToast = function(msg) {
            console.log('[Toast]', msg);
            // Opcional: mostrar alert silencioso o crear un toast básico
            const toast = document.createElement('div');
            toast.textContent = msg;
            toast.style.cssText = 'position:fixed; bottom:20px; left:50%; transform:translateX(-50%); background:#000; color:#ffd700; padding:10px 20px; border-radius:30px; z-index:10000; font-size:0.8rem; pointer-events:none; opacity:0.9;';
            document.body.appendChild(toast);
            setTimeout(() => toast.remove(), 3000);
        };
    }

    // --- INICIALIZACIÓN ---
    document.addEventListener('DOMContentLoaded', () => {
        // Elementos principales
        step1 = document.getElementById('step1');
        step2 = document.getElementById('step2');
        step3 = document.getElementById('step3');
        step1Ind = document.getElementById('step1-ind');
        step2Ind = document.getElementById('step2-ind');
        step3Ind = document.getElementById('step3-ind');
        line1 = document.getElementById('line1');
        line2 = document.getElementById('line2');
        btnContinuar = document.getElementById('btn-continuar');
        btnVolver = document.getElementById('btn-volver');
        btnEnviar = document.getElementById('btn-enviar');
        loadingOverlay = document.getElementById('loading-overlay');
        loadingMsg = document.getElementById('loading-msg');

        // Cargar carrito y resumen
        loadCartAndRenderSidebar();

        // Configurar reloj
        updateRegisterClock();

        // Configurar métodos de pago
        setupPaymentMethods();

        // Configurar carga de archivos
        setupFileUpload();

        // Eventos de navegación
        if (btnContinuar) btnContinuar.addEventListener('click', goToStep2);
        if (btnVolver) btnVolver.addEventListener('click', goToStep1);
        if (btnEnviar) btnEnviar.addEventListener('click', onSubmitOrder);

        // Actualizar montos mostrados
        updatePaymentAmounts();
        
        // Actualizar contador del carrito en la navbar
        updateCartCounter();
    });

    // --- NAVEGACIÓN ENTRE PASOS ---
    function goToStep2() {
        if (validateStep1()) {
            step1.classList.remove('step-panel--active');
            step2.classList.add('step-panel--active');
            step1Ind.classList.remove('cstep--active');
            step1Ind.classList.add('cstep--done');
            step2Ind.classList.add('cstep--active');
            if (line1) line1.classList.add('cstep__line--done');
            updatePaymentAmounts();
        }
    }

    function goToStep1() {
        step2.classList.remove('step-panel--active');
        step1.classList.add('step-panel--active');
        step2Ind.classList.remove('cstep--active');
        step1Ind.classList.add('cstep--active');
        step1Ind.classList.remove('cstep--done');
        if (line1) line1.classList.remove('cstep__line--done');
    }

    // --- VALIDACIÓN DEL PASO 1 ---
    function validateStep1() {
        let isValid = true;
        const nombre = document.getElementById('nombre');
        const correo = document.getElementById('correo');
        const telefono = document.getElementById('telefono');
        const idDispositivo = document.getElementById('id_dispositivo');

        clearErrors();

        if (!nombre.value.trim()) {
            showError('error-nombre', 'El nombre completo es obligatorio');
            isValid = false;
        }
        if (!correo.value.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo.value)) {
            showError('error-correo', 'Correo electrónico inválido');
            isValid = false;
        }
        if (!telefono.value.trim()) {
            showError('error-telefono', 'El teléfono/WhatsApp es obligatorio');
            isValid = false;
        }
        if (!idDispositivo.value.trim()) {
            showError('error-id_dispositivo', 'El ID de dispositivo es obligatorio para activar la licencia');
            isValid = false;
        }
        return isValid;
    }

    function clearErrors() {
        document.querySelectorAll('.err-msg').forEach(err => err.innerText = '');
    }

    function showError(elementId, message) {
        const el = document.getElementById(elementId);
        if (el) el.innerText = message;
    }

    // --- ACTUALIZAR CONTADOR DEL CARRITO EN LA NAVBAR ---
    function updateCartCounter() {
        const cartCounter = document.getElementById('cart-counter');
        if (!cartCounter) return;
        
        let cart = [];
        try {
            const storedCart = localStorage.getItem('jlonix_cart');
            if (storedCart) cart = JSON.parse(storedCart);
        } catch(e) { console.warn(e); }
        
        const itemCount = cart.reduce((acc, item) => acc + (item.quantity || 1), 0);
        cartCounter.textContent = itemCount;
    }

    // --- CARGAR CARRITO Y RENDERIZAR SIDEBAR ---
    function loadCartAndRenderSidebar() {
        let cart = [];
        try {
            const storedCart = localStorage.getItem('jlonix_cart');
            if (storedCart) cart = JSON.parse(storedCart);
        } catch(e) { console.warn(e); }

        let activeDiscount = { percentage: 0, code: null };
        try {
            const savedDiscount = localStorage.getItem('jlonix_active_discount');
            if (savedDiscount) {
                const parsed = JSON.parse(savedDiscount);
                if (parsed && parsed.percentage > 0 && parsed.code) {
                    activeDiscount = parsed;
                }
            }
        } catch(e) { console.warn(e); }

        const sidebarItems = document.getElementById('sidebar-items');
        const sbSubtotal   = document.getElementById('sb-subtotal');
        const sbTotal      = document.getElementById('sb-total');
        const sbDiscountRow   = document.getElementById('sb-discount-row');
        const sbDiscountSpan  = document.getElementById('sb-discount');
        const sbCouponLabel   = document.getElementById('sb-coupon-label');
        const sidebarEmpty = document.getElementById('sidebar-empty');
        const summaryCard  = document.getElementById('sidebar-card');

        if (!cart || cart.length === 0) {
            if (sidebarEmpty) sidebarEmpty.style.display = 'block';
            if (summaryCard)  summaryCard.style.display  = 'none';
            document.body.setAttribute('data-cart-total', '0');
            return;
        }

        if (sidebarEmpty) sidebarEmpty.style.display = 'none';
        if (summaryCard)  summaryCard.style.display  = 'block';

        let subtotal = 0;
        let itemsHtml = '';
        cart.forEach(item => {
            const priceBS  = item.priceBS || item.priceBs || item.price || 0;
            const qty      = item.quantity || 1;
            const itemTotal = priceBS * qty;
            subtotal += itemTotal;
            itemsHtml += `
                <div class="summary-product-item">
                    <div class="summary-product-name">
                        <div class="sp-ico">${escapeHtml(item.icon || item.ico || '📦')}</div>
                        <div class="sp-text">${escapeHtml(item.name)}</div>
                    </div>
                    <div class="summary-product-qty">x${qty}</div>
                    <div class="summary-product-price">Bs ${itemTotal.toFixed(2)}</div>
                </div>
            `;
        });
        if (sidebarItems) sidebarItems.innerHTML = itemsHtml;
        if (sbSubtotal)   sbSubtotal.innerText = `Bs ${subtotal.toFixed(2)}`;

        const discountAmount = subtotal * (activeDiscount.percentage / 100);
        const total          = subtotal - discountAmount;

        if (activeDiscount.percentage > 0 && activeDiscount.code) {
            if (sbDiscountRow)  sbDiscountRow.style.display = 'flex';
            if (sbDiscountSpan) sbDiscountSpan.innerText    = `-Bs ${discountAmount.toFixed(2)} (${activeDiscount.percentage}% OFF)`;
            if (sbCouponLabel)  sbCouponLabel.innerText     = `(${activeDiscount.code})`;
        } else {
            if (sbDiscountRow) sbDiscountRow.style.display = 'none';
        }

        if (sbTotal) sbTotal.innerText = `Bs ${total.toFixed(2)}`;
        document.body.setAttribute('data-cart-total', total.toFixed(2));
        
        updateCartCounter();
    }

    // --- MÉTODOS DE PAGO ---
    function setupPaymentMethods() {
        const qrOpt = document.querySelector('.pay-opt[data-method="qr"]');
        const bancoOpt = document.querySelector('.pay-opt[data-method="banco"]');
        const qrDetail = document.getElementById('qr-detail');
        const bancoDetail = document.getElementById('banco-detail');

        if (qrOpt) {
            qrOpt.addEventListener('click', () => {
                selectedMethod = 'qr';
                qrOpt.classList.add('active');
                bancoOpt.classList.remove('active');
                qrDetail.classList.add('active');
                bancoDetail.classList.remove('active');
                updatePaymentAmounts();
            });
        }
        if (bancoOpt) {
            bancoOpt.addEventListener('click', () => {
                selectedMethod = 'banco';
                bancoOpt.classList.add('active');
                qrOpt.classList.remove('active');
                bancoDetail.classList.add('active');
                qrDetail.classList.remove('active');
                updatePaymentAmounts();
            });
        }
    }

    function updatePaymentAmounts() {
        const totalStr = document.body.getAttribute('data-cart-total') || '0.00';
        const total = parseFloat(totalStr);
        const montoQr = document.getElementById('monto-qr');
        const montoBanco = document.getElementById('monto-banco');
        if (montoQr) montoQr.innerText = `Bs ${total.toFixed(2)}`;
        if (montoBanco) montoBanco.innerText = `Bs ${total.toFixed(2)}`;
    }

    // --- CARGA DE COMPROBANTE ---
    function setupFileUpload() {
        const uploadArea = document.getElementById('upload-area');
        const fileInput = document.getElementById('comprobante');
        const preview = document.getElementById('upload-preview');
        const fileNameSpan = document.getElementById('upload-filename');
        const removeBtn = document.getElementById('upload-remove');

        if (!uploadArea || !fileInput) return;

        uploadArea.addEventListener('click', () => fileInput.click());
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });
        uploadArea.addEventListener('dragleave', () => uploadArea.classList.remove('dragover'));
        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            if (e.dataTransfer.files.length > 0) handleFile(e.dataTransfer.files[0]);
        });

        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) handleFile(e.target.files[0]);
        });

        if (removeBtn) {
            removeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                removeFile();
            });
        }

        function handleFile(file) {
            const maxSize = 10 * 1024 * 1024;
            if (file.size > maxSize) {
                window.showToast('❌ El archivo es muy grande (máx 10 MB)');
                return;
            }
            uploadedFile = file;
            if (fileNameSpan) fileNameSpan.innerText = file.name;
            if (preview) preview.classList.add('show');
            
            const reader = new FileReader();
            reader.onload = (evt) => { uploadDataUrl = evt.target.result; };
            reader.readAsDataURL(file);
        }
    }

    window.removeFile = function() {
        uploadedFile = null;
        uploadDataUrl = null;
        const fileInput = document.getElementById('comprobante');
        if (fileInput) fileInput.value = '';
        const preview = document.getElementById('upload-preview');
        if (preview) preview.classList.remove('show');
        window.showToast('🗑️ Comprobante eliminado');
    };

    // --- VALIDACIÓN DEL PASO 2 ---
    function validateStep2() {
        let isValid = true;
        const montoDepositado = document.getElementById('monto_depositado');
        const fechaDeposito = document.getElementById('fecha_deposito');
        let refInput, errorRefId;
        
        if (selectedMethod === 'qr') {
            refInput = document.getElementById('ref_transaccion');
            errorRefId = 'error-ref_transaccion';
        } else {
            refInput = document.getElementById('ref_transaccion_banco');
            errorRefId = 'error-ref_banco';
        }
        
        const errorMonto = document.getElementById('error-monto');
        const errorFecha = document.getElementById('error-fecha');
        if (errorMonto) errorMonto.innerText = '';
        if (errorFecha) errorFecha.innerText = '';
        if (errorRefId) document.getElementById(errorRefId).innerText = '';
        
        const total = parseFloat(document.body.getAttribute('data-cart-total') || '0');
        const depositado = parseFloat(montoDepositado?.value);
        
        if (isNaN(depositado) || depositado < total - 0.01) {
            if (errorMonto) errorMonto.innerText = `El monto depositado debe ser al menos Bs ${total.toFixed(2)}`;
            isValid = false;
        }
        if (!fechaDeposito?.value) {
            if (errorFecha) errorFecha.innerText = 'La fecha del depósito es obligatoria';
            isValid = false;
        }
        if (!refInput?.value.trim()) {
            if (errorRefId) document.getElementById(errorRefId).innerText = 'El número de referencia/transacción es obligatorio';
            isValid = false;
        }
        return isValid;
    }

    // --- RECOLECTAR DATOS DEL FORMULARIO ---
    function collectOrderData() {
        const nombre = document.getElementById('nombre')?.value.trim();
        const correo = document.getElementById('correo')?.value.trim();
        const telefono = document.getElementById('telefono')?.value.trim();
        const pais = document.getElementById('pais')?.value;
        const ciudad = document.getElementById('ciudad')?.value.trim();
        const idDispositivo = document.getElementById('id_dispositivo')?.value.trim();
        const sistemaOp = document.getElementById('sistema_operativo')?.value;
        const empresa = document.getElementById('empresa')?.value.trim();
        const notas = document.getElementById('notas')?.value.trim();
        const montoDepositado = parseFloat(document.getElementById('monto_depositado')?.value) || 0;
        const fechaDeposito = document.getElementById('fecha_deposito')?.value;
        const horaDeposito = document.getElementById('hora_deposito')?.value || '';
        
        let refTransaccion = '';
        let bancoOrigen = '';
        let titularOrigen = '';
        if (selectedMethod === 'qr') {
            refTransaccion = document.getElementById('ref_transaccion')?.value.trim();
        } else {
            refTransaccion = document.getElementById('ref_transaccion_banco')?.value.trim();
            bancoOrigen = document.getElementById('banco_origen')?.value.trim();
            titularOrigen = document.getElementById('titular_origen')?.value.trim();
        }
        
        const totalCarrito = parseFloat(document.body.getAttribute('data-cart-total') || '0');

        // ── LEER DESCUENTO DESDE localStorage ──────────────────────
        let descuentoPorcentaje = 0;
        let descuentoCodigo     = '';
        let descuentoMonto      = 0;
        let subtotalCarrito     = 0;
        try {
            const storedCart = localStorage.getItem('jlonix_cart');
            const cart = storedCart ? JSON.parse(storedCart) : [];
            subtotalCarrito = cart.reduce((acc, item) => {
                const price = item.priceBS || item.priceBs || item.price || 0;
                return acc + price * (item.quantity || 1);
            }, 0);

            const savedDiscount = localStorage.getItem('jlonix_active_discount');
            if (savedDiscount) {
                const parsed = JSON.parse(savedDiscount);
                if (parsed && parsed.percentage > 0 && parsed.code) {
                    descuentoPorcentaje = parsed.percentage;
                    descuentoCodigo     = parsed.code;
                    descuentoMonto      = subtotalCarrito * (parsed.percentage / 100);
                }
            }
        } catch(e) { console.warn('Error leyendo descuento:', e); }
        // ───────────────────────────────────────────────────────────

        return {
            nombre, correo, telefono, pais, ciudad,
            id_dispositivo: idDispositivo,
            sistema_operativo: sistemaOp,
            empresa: empresa || '',
            metodo_pago: selectedMethod,
            ref_transaccion: refTransaccion,
            monto_depositado: montoDepositado,
            fecha_deposito: fechaDeposito,
            hora_deposito: horaDeposito,
            banco_origen: bancoOrigen,
            titular_origen: titularOrigen,
            notas: notas || '',
            subtotal:              subtotalCarrito,
            descuento_porcentaje:  descuentoPorcentaje,
            descuento_codigo:      descuentoCodigo,
            descuento_monto:       descuentoMonto,
            monto_total: totalCarrito,
            productos: getCartItemsForSheet()
        };
    }

    function getCartItemsForSheet() {
        let cart = [];
        try {
            const stored = localStorage.getItem('jlonix_cart');
            if (stored) cart = JSON.parse(stored);
        } catch(e) { console.warn(e); }
        return cart.map(item => `${item.name} (x${item.quantity || 1})`).join(', ');
    }

    // --- ENVÍO A GOOGLE SHEETS (SIN CORS: x-www-form-urlencoded) ---
    async function sendToGoogleSheets(data, file) {
        const payload = {
            nombre:                data.nombre,
            correo:                data.correo,
            telefono:              data.telefono,
            pais:                  data.pais,
            ciudad:                data.ciudad,
            id_dispositivo:        data.id_dispositivo,
            sistema_operativo:     data.sistema_operativo,
            empresa:               data.empresa,
            metodo_pago:           data.metodo_pago,
            ref_transaccion:       data.ref_transaccion,
            monto_depositado:      data.monto_depositado,
            fecha_deposito:        data.fecha_deposito,
            hora_deposito:         data.hora_deposito,
            banco_origen:          data.banco_origen,
            titular_origen:        data.titular_origen,
            notas:                 data.notas,
            subtotal:              data.subtotal,
            descuento_porcentaje:  data.descuento_porcentaje,
            descuento_codigo:      data.descuento_codigo,
            descuento_monto:       data.descuento_monto,
            monto_total:           data.monto_total,
            productos:             data.productos
        };

        if (file && uploadDataUrl) {
            payload.archivo_nombre   = file.name;
            payload.archivo_mimeType = file.type || 'application/octet-stream';
            payload.archivo_base64   = uploadDataUrl.split(',')[1];
        }

        // Convertir a x-www-form-urlencoded (evita preflight CORS)
        const formBody = 'data=' + encodeURIComponent(JSON.stringify(payload));

        let lastError;
        for (let attempt = 1; attempt <= 3; attempt++) {
            try {
                const response = await fetch(GOOGLE_SHEETS_WEB_APP_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: formBody
                });
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                const result = await response.json();
                if (result && result.success === true && result.orderId) {
                    return { success: true, orderId: result.orderId };
                } else {
                    throw new Error(result.error || 'Respuesta inválida del servidor');
                }
            } catch (err) {
                lastError = err;
                console.warn(`Intento ${attempt} fallido:`, err);
                if (attempt < 3) await delay(1000 * attempt);
            }
        }
        throw new Error(lastError?.message || 'No se pudo conectar con el servidor después de 3 intentos');
    }

    function delay(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

    // --- ENVÍO PRINCIPAL ---
    async function onSubmitOrder(event) {
        event.preventDefault();
        if (isSubmitting) return;
        isSubmitting = true;
        if (btnEnviar) btnEnviar.disabled = true;

        if (!validateStep2()) {
            isSubmitting = false;
            if (btnEnviar) btnEnviar.disabled = false;
            return;
        }

        const orderData = collectOrderData();
        if (!orderData) {
            isSubmitting = false;
            if (btnEnviar) btnEnviar.disabled = false;
            return;
        }

        // Mostrar overlay de carga (sin popup que puede ser bloqueado)
        if (loadingOverlay) {
            loadingOverlay.classList.add('show');
            if (loadingMsg) loadingMsg.innerText = 'Procesando pedido...';
        }

        try {
            const result = await sendToGoogleSheets(orderData, uploadedFile);
            if (result.success && result.orderId) {
                currentOrder = {
                    pedidoId: result.orderId,
                    nombre: orderData.nombre,
                    total: orderData.monto_total,
                    metodo: orderData.metodo_pago === 'qr' ? 'QR / Tigo Money' : 'Transferencia Bancaria',
                    referencia: orderData.ref_transaccion
                };
                
                // ✅ Vaciar carrito después de pedido exitoso
                localStorage.removeItem('jlonix_cart');
                localStorage.removeItem('jlonix_active_discount');
                updateCartCounter();
                loadCartAndRenderSidebar(); // refrescar sidebar (quedará vacío)
                
                if (loadingOverlay) loadingOverlay.classList.remove('show');
                showStep3Confirmation(currentOrder);
                window.showToast('✅ Pedido registrado correctamente');
            } else {
                throw new Error(result.error || 'Error al registrar el pedido');
            }
        } catch (error) {
            console.error('Error en envío:', error);
            const errorMsg = error.message || 'Error de conexión con el servidor';
            if (loadingOverlay) loadingOverlay.classList.remove('show');
            window.showToast('❌ Error: ' + errorMsg);
        } finally {
            isSubmitting = false;
            if (btnEnviar) btnEnviar.disabled = false;
        }
    }

    // --- VENTANA EMERGENTE DE CARGA (se mantiene pero ya no se usa por defecto) ---
    function openLoadingPopup() {
        // Función obsoleta: ya usamos overlay. Se deja por compatibilidad pero no se llama.
        return null;
    }

    // --- MOSTRAR PASO 3 DE CONFIRMACIÓN ---
    function showStep3Confirmation(order) {
        step2.classList.remove('step-panel--active');
        step3.classList.add('step-panel--active');
        step2Ind.classList.remove('cstep--active');
        step2Ind.classList.add('cstep--done');
        step3Ind.classList.add('cstep--active');
        if (line2) line2.classList.add('cstep__line--done');
        
        document.getElementById('s-pedido-id').innerText = order.pedidoId;
        document.getElementById('s-nombre').innerText = order.nombre;
        document.getElementById('s-total').innerText = `Bs ${order.total.toFixed(2)}`;
        document.getElementById('s-metodo').innerText = order.metodo;
        document.getElementById('s-ref').innerText = order.referencia;
        
        const btnWapp = document.getElementById('btn-wapp-final');
        if (btnWapp) {
            const telefono = document.getElementById('telefono')?.value || '59174012527';
            const mensaje = `Hola, mi pedido es ${order.pedidoId} y ya realicé el pago. Adjunto comprobante.`;
            const url = `https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`;
            btnWapp.onclick = () => window.open(url, '_blank');
        }
    }

    // --- RELOJ EN TIEMPO REAL ---
    function updateRegisterClock() {
        const clockSpan = document.getElementById('fecha-registro');
        if (!clockSpan) return;
        const update = () => {
            const now = new Date();
            const formatted = now.toLocaleString('es-BO', { timeZone: 'America/La_Paz', dateStyle: 'full', timeStyle: 'short' });
            clockSpan.innerHTML = `📅 ${formatted}`;
        };
        update();
        setInterval(update, 60000);
    }

    // --- ESCAPA HTML ---
    function escapeHtml(str) {
        if (!str) return '';
        return str.replace(/[&<>]/g, function(m) {
            if (m === '&') return '&amp;';
            if (m === '<') return '&lt;';
            if (m === '>') return '&gt;';
            return m;
        });
    }
})();