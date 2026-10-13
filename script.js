'use strict';

/* =====================================================
   PERSONALIZÁ TU TIENDA ACÁ
   1) Escribí tu número de WhatsApp con código de país,
      SIN +, espacios ni guiones. Ejemplo Argentina:
      5491123456789 (ejemplo ficticio).
   2) Editá tus productos, precios y fotos.
   3) Cambiá "activo" a true cuando esté listo.
   Publicá SOLO productos cuya venta esté permitida.
   ===================================================== */
const WHATSAPP_NUMBER = ''; // Ejemplo ficticio: '5491123456789'
const CURRENCY = 'ARS';

const products = [
  { id: 1, nombre: 'Producto 01', descripcion: '', categoria: 'Personalizar', precio: null, imagen: '', activo: false },
  { id: 2, nombre: 'Producto 02', descripcion: '', categoria: 'Personalizar', precio: null, imagen: '', activo: false },
  { id: 3, nombre: 'Producto 03', descripcion: '', categoria: 'Personalizar', precio: null, imagen: '', activo: false },
  { id: 4, nombre: 'Producto 04', descripcion: '', categoria: 'Personalizar', precio: null, imagen: '', activo: false },
  { id: 5, nombre: 'Producto 05', descripcion: '', categoria: 'Personalizar', precio: null, imagen: '', activo: false },
  { id: 6, nombre: 'Producto 06', descripcion: '', categoria: 'Personalizar', precio: null, imagen: '', activo: false }
];

// Ejemplo de un producto configurado (reemplazá una línea de arriba):
// { id: 1, nombre: 'Funda para celular', descripcion: 'Color negro', categoria: 'Accesorios', precio: 12000, imagen: 'imagenes/producto-01.jpg', activo: true },

const $ = (selector) => document.querySelector(selector);
const grid = $('#product-grid');
const searchInput = $('#search-input');
const categoryFilter = $('#category-filter');
const overlay = $('#cart-overlay');
const panel = $('#cart-panel');
let toastTimeout;
let cart = loadCart();
let previouslyFocused = null;

function isReady(product) {
  return product.activo === true && typeof product.precio === 'number' && Number.isFinite(product.precio) && product.precio > 0 && product.nombre.trim() !== '';
}
function money(amount) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: CURRENCY, maximumFractionDigits: 0 }).format(amount);
}
function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
}
function loadCart() {
  try {
    const raw = JSON.parse(localStorage.getItem('vpplus-cart') || '{}');
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
    const clean = {};
    for (const [id, qty] of Object.entries(raw)) {
      if (products.some((p) => String(p.id) === id && isReady(p)) && Number.isInteger(qty) && qty > 0 && qty <= 99) clean[id] = qty;
    }
    return clean;
  } catch { return {}; }
}
function saveCart() {
  try { localStorage.setItem('vpplus-cart', JSON.stringify(cart)); } catch { /* Puede estar deshabilitado */ }
  renderCart();
}
function renderCategories() {
  const categories = [...new Set(products.filter(isReady).map(p => p.categoria))];
  categoryFilter.innerHTML = '<option value="all">Todas las categorías</option>' + categories.map((c) => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('');
}
function renderProducts() {
  const query = searchInput.value.trim().toLocaleLowerCase('es');
  const category = categoryFilter.value;
  const filtered = products.filter((p) => {
    const text = `${p.nombre} ${p.descripcion} ${p.categoria}`.toLocaleLowerCase('es');
    return text.includes(query) && (category === 'all' || (isReady(p) && p.categoria === category));
  });
  $('#product-total').textContent = `${products.filter(isReady).length} productos disponibles`;
  if (!filtered.length) {
    grid.innerHTML = '<div class="no-results">No encontramos productos con esos filtros.</div>';
    return;
  }
  grid.innerHTML = filtered.map((p) => {
    const ready = isReady(p);
    const image = p.imagen.trim()
      ? `<img src="${escapeHtml(p.imagen)}" alt="${escapeHtml(p.nombre)}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.hidden=false;"><div class="image-placeholder" hidden><span class="placeholder-icon">▧</span> TU FOTO AQUÍ</div>`
      : '<div class="image-placeholder"><span class="placeholder-icon">▧</span>TU FOTO AQUÍ</div>';
    return `<article class="product-card"><div class="product-image-wrap">${image}<span class="slot-index">${ready ? 'DISPONIBLE' : 'PERSONALIZABLE'} · ${String(p.id).padStart(2,'0')}</span></div><div class="product-content"><div class="product-category">${escapeHtml(p.categoria)}</div><h3>${escapeHtml(p.nombre)}</h3><p class="product-description">${escapeHtml(p.descripcion || 'Agregá aquí la descripción de tu producto.')}</p><div class="product-bottom"><span class="product-price ${ready ? '' : 'not-set'}">${ready ? money(p.precio) : 'PRECIO A DEFINIR'}</span><button class="add-button" type="button" data-add="${p.id}" ${ready ? '' : 'disabled'}>${ready ? '+ Agregar' : 'Sin configurar'}</button></div></div></article>`;
  }).join('');
}
function getLines() {
  return Object.entries(cart).map(([id, qty]) => ({ product: products.find((p) => String(p.id) === id), qty })).filter((line) => line.product && isReady(line.product));
}
function renderCart() {
  const lines = getLines();
  const totalQty = lines.reduce((sum, line) => sum + line.qty, 0);
  const subtotal = lines.reduce((sum, line) => sum + line.qty * line.product.precio, 0);
  $('#cart-count').textContent = totalQty;
  $('#cart-title-count').textContent = `(${totalQty})`;
  $('#cart-subtotal').textContent = money(subtotal);
  $('#checkout-button').disabled = lines.length === 0;
  $('#clear-cart').disabled = lines.length === 0;
  $('#cart-items').innerHTML = lines.length ? lines.map(({product:p, qty}) => `<div class="cart-line"><div class="cart-thumb">${p.imagen.trim() ? `<img src="${escapeHtml(p.imagen)}" alt="" class="cart-thumb" onerror="this.style.display='none'">` : '✦'}</div><div><h3>${escapeHtml(p.nombre)}</h3><p>${money(p.precio)} c/u</p><div class="qty-group"><button type="button" data-change="${p.id}" data-delta="-1" aria-label="Quitar una unidad de ${escapeHtml(p.nombre)}">−</button><span>${qty}</span><button type="button" data-change="${p.id}" data-delta="1" aria-label="Agregar una unidad de ${escapeHtml(p.nombre)}">+</button><button type="button" class="remove-button" data-remove="${p.id}">Quitar</button></div></div><div class="line-price">${money(p.precio * qty)}</div></div>`).join('') : '<div class="empty-cart"><span class="empty-cart-icon">🛒</span>Tu carrito está vacío.<br>Agregá un producto cuando esté disponible.</div>';
}
function changeQuantity(id, delta) {
  const p = products.find(item => item.id === id);
  if (!p || !isReady(p)) return;
  const next = (cart[id] || 0) + delta;
  if (next <= 0) delete cart[id]; else cart[id] = Math.min(next, 99);
  saveCart();
}
function openCart() {
  previouslyFocused = document.activeElement;
  overlay.hidden = false;
  panel.classList.add('open');
  panel.setAttribute('aria-hidden', 'false');
  document.body.classList.add('cart-open');
  $('#close-cart').focus();
}
function closeCart() {
  panel.classList.remove('open');
  panel.setAttribute('aria-hidden', 'true');
  overlay.hidden = true;
  document.body.classList.remove('cart-open');
  previouslyFocused?.focus();
}
function toast(message) {
  const el = $('#toast');
  el.textContent = message;
  el.classList.add('show');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => el.classList.remove('show'), 3200);
}
function validWhatsapp() { return /^\d{10,15}$/.test(WHATSAPP_NUMBER); }
function openWhatsapp(text) {
  if (!validWhatsapp()) {
    toast('Primero agregá tu número de WhatsApp en script.js.');
    return;
  }
  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
  window.open(url, '_blank', 'noopener,noreferrer');
}
function checkout() {
  const lines = getLines();
  if (!lines.length) return;
  const subtotal = lines.reduce((sum, line) => sum + line.qty * line.product.precio, 0);
  const details = lines.map(({product:p, qty}) => `• ${p.nombre} x${qty} — ${money(qty * p.precio)}`).join('\n');
  openWhatsapp(`¡Hola! Quiero consultar por este pedido de V.P Plus:\n\n${details}\n\nTotal estimado: ${money(subtotal)}\n\n¿Me confirmás disponibilidad y entrega?`);
}
grid.addEventListener('click', (event) => {
  const button = event.target.closest('[data-add]');
  if (!button || button.disabled) return;
  changeQuantity(Number(button.dataset.add), 1);
  toast('Producto agregado al carrito ✦');
});
$('#cart-items').addEventListener('click', (event) => {
  const change = event.target.closest('[data-change]');
  const remove = event.target.closest('[data-remove]');
  if (change) changeQuantity(Number(change.dataset.change), Number(change.dataset.delta));
  if (remove) { delete cart[Number(remove.dataset.remove)]; saveCart(); }
});
searchInput.addEventListener('input', renderProducts);
categoryFilter.addEventListener('change', renderProducts);
$('#open-cart').addEventListener('click', openCart);
$('#close-cart').addEventListener('click', closeCart);
overlay.addEventListener('click', closeCart);
$('#checkout-button').addEventListener('click', checkout);
$('#clear-cart').addEventListener('click', () => { cart = {}; saveCart(); });
$('#contact-whatsapp').addEventListener('click', () => openWhatsapp('¡Hola! Quisiera hacer una consulta sobre V.P Plus.'));
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && panel.classList.contains('open')) closeCart();
  if (event.key === 'Tab' && panel.classList.contains('open')) {
    const focusables = [...panel.querySelectorAll('button:not(:disabled)')];
    if (!focusables.length) return;
    const first = focusables[0], last = focusables[focusables.length-1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }
});
$('#year').textContent = new Date().getFullYear();
renderCategories();
renderProducts();
renderCart();
