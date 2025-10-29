const header = document.querySelector('.site-header');
const navToggle = document.querySelector('.nav-toggle');
const primaryNav = document.querySelector('.primary-nav');
const orderBtn = document.querySelector('.order');
const links = document.querySelectorAll('.primary-nav a');

function setScrolled() {
  if (window.scrollY > 2) header.classList.add('scrolled');
  else header.classList.remove('scrolled');
}
setScrolled();
window.addEventListener('scroll', setScrolled, { passive: true });

if (navToggle) {
  navToggle.addEventListener('click', () => {
    header.classList.toggle('open');
  });
}

links.forEach(a => a.addEventListener('click', () => header.classList.remove('open')));
if (orderBtn) orderBtn.addEventListener('click', () => header.classList.remove('open'));

document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const id = a.getAttribute('href');
    if (!id || id === '#' || id.length < 2) return;
    const target = document.querySelector(id);
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});

// Reveal animations
const revealEls = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window && revealEls.length) {
  const io = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.2 });
  revealEls.forEach(el => io.observe(el));
} else {
  revealEls.forEach(el => el.classList.add('in'));
}

const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

const slider = document.querySelector('.slider');
if (slider) {
  const slides = Array.from(slider.querySelectorAll('.slide'));
  const prev = slider.querySelector('.prev');
  const next = slider.querySelector('.next');
  const dotsWrap = document.querySelector('.dots');
  let idx = 0;
  function show(i) {
    idx = (i + slides.length) % slides.length;
    slides.forEach((s, n) => s.classList.toggle('active', n === idx));
    if (dotsWrap) Array.from(dotsWrap.children).forEach((d, n) => d.classList.toggle('active', n === idx));
  }
  if (dotsWrap) {
    dotsWrap.innerHTML = '';
    slides.forEach((_, n) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.addEventListener('click', () => show(n));
      dotsWrap.appendChild(b);
    });
  }
  if (prev) prev.addEventListener('click', () => show(idx - 1));
  if (next) next.addEventListener('click', () => show(idx + 1));
  let auto = setInterval(() => show(idx + 1), 5000);
  slider.addEventListener('mouseenter', () => clearInterval(auto));
  slider.addEventListener('mouseleave', () => (auto = setInterval(() => show(idx + 1), 5000)));
  show(0);
}

const contactForm = document.querySelector('.contact-form');
function setError(id, msg) {
  const err = document.querySelector(`.error[data-for="${id}"]`);
  if (err) err.textContent = msg || '';
}
function validEmail(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}
if (contactForm) {
  contactForm.addEventListener('submit', e => {
    e.preventDefault();
    const name = document.getElementById('name');
    const email = document.getElementById('email');
    const message = document.getElementById('message');
    let ok = true;
    if (!name.value.trim()) { setError('name', 'Please enter your name'); ok = false; } else setError('name');
    if (!validEmail(email.value.trim())) { setError('email', 'Enter a valid email'); ok = false; } else setError('email');
    if (!message.value.trim() || message.value.trim().length < 6) { setError('message', 'Message should be at least 6 characters'); ok = false; } else setError('message');
    if (!ok) return;
    alert('Thanks! Your message has been sent.');
    contactForm.reset();
  });
}

// Cart functionality
const cartBtn = document.querySelector('.cart-btn');
const cartClose = document.querySelector('.cart-close');
const cartOverlay = document.querySelector('.cart-overlay');
const cartPanel = document.querySelector('.cart-panel');
const cartItemsEl = document.querySelector('.cart-items');
const cartTotalEl = document.getElementById('cart-total');
const cartCountEl = document.getElementById('cart-count');
const cartClearBtn = document.querySelector('.cart-clear');
const cartCheckoutBtn = document.querySelector('.cart-checkout');

let cart = {};
function loadCart() {
  try { cart = JSON.parse(localStorage.getItem('cart') || '{}') || {}; } catch { cart = {}; }
}
function saveCart() { localStorage.setItem('cart', JSON.stringify(cart)); }
function openCart() { document.body.classList.add('cart-open'); cartPanel?.setAttribute('aria-hidden', 'false'); cartOverlay?.setAttribute('aria-hidden', 'false'); }
function closeCart() { document.body.classList.remove('cart-open'); cartPanel?.setAttribute('aria-hidden', 'true'); cartOverlay?.setAttribute('aria-hidden', 'true'); }
cartOverlay?.addEventListener('click', closeCart);
cartClose?.addEventListener('click', closeCart);
cartBtn?.addEventListener('click', () => openCart());

function parsePrice(text) { return Number(text.replace(/[^0-9.]/g, '')) || 0; }
function fmt(n) { return `$${n.toFixed(2)}`; }
function cartCount() { return Object.values(cart).reduce((s, it) => s + it.qty, 0); }
function cartTotal() { return Object.values(cart).reduce((s, it) => s + it.qty * it.price, 0); }

function renderCart() {
  if (!cartItemsEl) return;
  cartItemsEl.innerHTML = '';
  Object.values(cart).forEach(item => {
    const row = document.createElement('div');
    row.className = 'cart-item';
    row.innerHTML = `
      <div class="cart-thumb" style="background-image:url('${item.image}')"></div>
      <div>
        <div class="cart-name">${item.name}</div>
        <div class="cart-meta">${fmt(item.price)}</div>
        <div class="qty">
          <button data-act="dec" data-id="${item.id}" aria-label="Decrease">-</button>
          <span>${item.qty}</span>
          <button data-act="inc" data-id="${item.id}" aria-label="Increase">+</button>
        </div>
      </div>
      <button class="cart-remove" data-act="remove" data-id="${item.id}" aria-label="Remove">✕</button>
    `;
    cartItemsEl.appendChild(row);
  });
  if (cartTotalEl) cartTotalEl.textContent = fmt(cartTotal());
  if (cartCountEl) cartCountEl.textContent = cartCount();
  saveCart();
}

function addToCart(item) {
  const existing = cart[item.id];
  if (existing) existing.qty += 1; else cart[item.id] = { ...item, qty: 1 };
  renderCart();
  openCart();
}

document.addEventListener('click', e => {
  const t = e.target;
  if (!(t instanceof Element)) return;
  // Add buttons in menu
  const addBtn = t.closest('.add');
  if (addBtn) {
    const card = addBtn.closest('.card');
    if (card) {
      const name = card.querySelector('h3')?.textContent?.trim() || 'Item';
      const priceText = card.querySelector('.price')?.textContent || '$0.00';
      const price = parsePrice(priceText);
      const media = card.querySelector('.card-media');
      let image = '';
      if (media) {
        const bg = getComputedStyle(media).backgroundImage;
        const m = bg && bg.match(/url\("?(.*?)"?\)/);
        image = m ? m[1] : '';
      }
      const id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      addToCart({ id, name, price, image });
    }
  }
  // Cart item controls
  const actBtn = t.closest('[data-act]');
  if (actBtn) {
    const id = actBtn.getAttribute('data-id');
    const act = actBtn.getAttribute('data-act');
    if (id && cart[id]) {
      if (act === 'inc') cart[id].qty += 1;
      if (act === 'dec') cart[id].qty = Math.max(0, cart[id].qty - 1);
      if (act === 'remove' || cart[id].qty === 0) delete cart[id];
      renderCart();
    }
  }
});

cartClearBtn?.addEventListener('click', () => { cart = {}; renderCart(); });
cartCheckoutBtn?.addEventListener('click', () => {
  if (!Object.keys(cart).length) { alert('Your cart is empty.'); return; }
  window.location.href = './payment.html';
});

loadCart();
renderCart();
