// Las Buenas Artes · demo — interacciones propias + kit-demos.
import { initKit } from '../kit/kit.js?v=4';

const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const html = document.documentElement;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const esMouse = () => matchMedia('(hover: hover) and (pointer: fine)').matches;
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
const pad2 = (n) => String(n).padStart(2, '0');

// =============================== INTRO: la caja que se abre ===============================
(function intro() {
  const el = $('#intro');
  if (!html.classList.contains('con-intro') || !el) { html.classList.add('listo'); return; }
  html.classList.add('intro-activa');
  const k = innerWidth < 900 ? 0.78 : 1;
  const heroImg = $('.arco--hero img');
  const imgLista = new Promise((r) => { if (!heroImg || heroImg.complete) r(); else { heroImg.addEventListener('load', r, { once: true }); heroImg.addEventListener('error', r, { once: true }); } });
  const todoListo = Promise.race([Promise.all([document.fonts ? document.fonts.ready : null, imgLista]), espera(2600)]);
  const t0 = performance.now();
  setTimeout(() => el.classList.add('p1'), 40);
  setTimeout(() => el.classList.add('p2'), 330 * k);
  setTimeout(() => el.classList.add('p3'), 860 * k);
  todoListo.then(async () => {
    const falta = 1260 * k - (performance.now() - t0);
    if (falta > 0) await espera(falta);
    el.classList.add('p4');
    setTimeout(() => html.classList.add('listo'), 160);
    setTimeout(() => { html.classList.remove('intro-activa'); el.remove(); }, 900);
  });
})();

// =============================== BARRA, MENÚ, PROGRESO ===============================
const barra = $('#barra');
const progreso = $('.guarda-progreso i');
let ticking = false;
function alScroll() {
  ticking = false;
  const y = scrollY;
  barra.classList.toggle('con-sombra', y > 8);
  html.classList.toggle('paso-hero', y > innerHeight * 0.6);
  const max = document.documentElement.scrollHeight - innerHeight;
  progreso.style.setProperty('--p', max > 0 ? Math.min(1, y / max).toFixed(4) : 0);
}
addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(alScroll); } }, { passive: true });
alScroll();

const menu = $('#menu');
const btnMenu = $('[data-menu]');
let scrollMenu = 0;
function abrirMenu(abrir) {
  btnMenu.setAttribute('aria-expanded', abrir);
  btnMenu.setAttribute('aria-label', abrir ? 'Cerrar el menú' : 'Abrir el menú');
  btnMenu.innerHTML = abrir ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>' : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8h16M4 16h16"/></svg>';
  menu.hidden = !abrir;
  html.classList.toggle('menu-abierto', abrir);
  if (abrir) {
    scrollMenu = scrollY;
    $$('nav a', menu).forEach((a, i) => a.style.setProperty('--d', i));
    document.body.style.cssText = `position:fixed;top:-${scrollMenu}px;left:0;right:0`;
  } else {
    document.body.style.cssText = '';
    scrollTo({ top: scrollMenu, behavior: 'instant' });
  }
}
btnMenu.addEventListener('click', () => abrirMenu(menu.hidden));
menu.addEventListener('click', (e) => {
  const a = e.target.closest('[data-cierra]'); if (!a) return;
  e.preventDefault(); abrirMenu(false);
  const dest = $(a.getAttribute('href')); if (dest) requestAnimationFrame(() => dest.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }));
});
addEventListener('keydown', (e) => { if (e.key === 'Escape' && !menu.hidden) abrirMenu(false); });
matchMedia('(min-width: 1024px)').addEventListener('change', (m) => { if (m.matches && !menu.hidden) abrirMenu(false); });

// link activo en la barra
const navLinks = $$('.barra__nav a');
const ioNav = new IntersectionObserver((ents) => {
  ents.forEach((en) => { if (en.isIntersecting) navLinks.forEach((a) => a.classList.toggle('activo', a.getAttribute('href') === '#' + en.target.id)); });
}, { rootMargin: '-45% 0px -50% 0px' });
['vitrina', 'docena', 'sala', 'familia', 'visitanos'].forEach((id) => { const s = document.getElementById(id); if (s) ioNav.observe(s); });

// =============================== ENTRADAS AL SCROLL ===============================
const ioRev = new IntersectionObserver((ents) => {
  ents.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('visto'); ioRev.unobserve(en.target); } });
}, { threshold: 0.18, rootMargin: '0px 0px -6% 0px' });
function observarReveal(root = document) {
  $$('.sec__head, .familia__txt, .encargar__txt, .visitanos__datos, .sala__head, .docena__head', root).forEach((g) => $$('.reveal', g).forEach((r, i) => r.style.setProperty('--d', i)));
  $$('.reveal:not(.visto), .revela:not(.visto)', root).forEach((el) => ioRev.observe(el));
}
observarReveal();

// mapa: se carga recién cerca
const mapa = $('.visitanos__mapa iframe');
new IntersectionObserver((ents, io) => { if (ents[0].isIntersecting) { mapa.src = mapa.dataset.src; io.disconnect(); } }, { rootMargin: '600px 0px' }).observe(mapa);

// arrastrar con el mouse las filas deslizables (en el celu el dedo ya lo hace)
function arrastreMouse(el) {
  let x0 = 0, s0 = 0, activo = false, movio = false, v = 0, ult = 0, ultT = 0, raf = 0;
  el.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'mouse' || el.scrollWidth <= el.clientWidth + 2) return;
    activo = true; movio = false; x0 = e.clientX; s0 = el.scrollLeft; ult = e.clientX; ultT = performance.now(); v = 0;
    cancelAnimationFrame(raf); el.style.scrollSnapType = 'none'; el.style.cursor = 'grabbing';
  });
  addEventListener('pointermove', (e) => {
    if (!activo) return;
    const dx = e.clientX - x0; if (Math.abs(dx) > 4) movio = true;
    el.scrollLeft = s0 - dx;
    const t = performance.now(); v = (e.clientX - ult) / Math.max(1, t - ultT); ult = e.clientX; ultT = t;
  });
  addEventListener('pointerup', () => {
    if (!activo) return; activo = false; el.style.cursor = '';
    let vel = -v * 16;
    const paso = () => { if (Math.abs(vel) < 0.4) { el.style.scrollSnapType = ''; return; } el.scrollLeft += vel; vel *= 0.92; raf = requestAnimationFrame(paso); };
    raf = requestAnimationFrame(paso);
  });
  el.addEventListener('click', (e) => { if (movio) { e.preventDefault(); e.stopPropagation(); movio = false; } }, true);
  el.addEventListener('dragstart', (e) => e.preventDefault());
}

// =============================== KIT ===============================
const params = new URLSearchParams(location.search);
const NOMBRES_SALA = { tortas: 'Sala de tortas', boxes: 'Sala de boxes y desayunos', miga: 'Sala de sándwiches de miga', facturas: 'Sala de facturas' };
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const fechaCorta = (f) => { const [, m, d] = f.split('-').map(Number); return `${d} de ${MESES[m - 1]}`; };

const kit = await initKit({
  config: 'cliente.json',
  fechaEspecial: params.get('sala') || null,
  carrito: { label: 'Tu caja', fab: false },
  carta: {
    itemClass: 'obra',
    template: (p, ctx) => {
      const tags = (p.etiquetas || []).filter((t) => t === 'casa' || t === 'veggie').map((t) => ctx.etiquetaHTML(t)).join('');
      const precio = ctx.money(p.precio) ?? 'A confirmar';
      const acc = p.id === 'docena-armada'
        ? '<a class="kit-add" href="#docena">Armala</a>'
        : ctx.pedible(p) ? `<div class="obra__acc" data-kit-qty="${esc(p.id)}"></div>` : '<span class="kit-badge kit-badge--off">Sin stock hoy</span>';
      return `${p.foto ? `<img class="obra__img" src="${esc(ctx.asset(p.foto))}" alt="" width="96" height="96" loading="lazy" decoding="async">` : '<span class="obra__img"></span>'}
        <div class="obra__body"><span class="obra__n">N.º ${pad2(ctx.index + 1)}</span><h3 class="obra__t">${esc(p.nombre)}${tags}</h3>${p.descripcion ? `<p class="obra__d">${esc(p.descripcion)}</p>` : ''}</div>
        <div class="obra__pie"><span class="obra__precio">${esc(precio)}</span>${acc}</div>`;
    },
    etiquetas: { casa: { label: 'De la casa' }, veggie: { label: 'Vegetariano' } },
  },
});
const C = kit.config;

// contador de la caja en la barra
function pintarCaja() {
  const n = kit.carrito.lineas.reduce((s, l) => s + l.cant, 0);
  $$('[data-caja-n]').forEach((b) => { b.textContent = n; });
  $('.btn-caja').setAttribute('aria-label', `Abrir tu caja (${n} ${n === 1 ? 'producto' : 'productos'})`);
}
document.addEventListener('kit:carrito', pintarCaja);
kit.carrito.listo.then(pintarCaja);

// =============================== VITRINA ===============================
const carta = $('.vitrina__carta');
const fotoGrande = $('[data-foto-grande]');
const btnPrev = $('[data-sala-prev]'), btnNext = $('[data-sala-next]');
let categoriasCache = [];

function anticipacionTxt(cat) {
  if (cat.especial && cat.desde && cat.hasta) {
    const mismoMes = cat.desde.slice(5, 7) === cat.hasta.slice(5, 7);
    return `se retira del ${mismoMes ? Number(cat.desde.slice(8)) : fechaCorta(cat.desde)} al ${fechaCorta(cat.hasta)}`;
  }
  const h = cat.anticipacionHoras ?? C.pedidos?.encargo?.anticipacionHoras ?? 0;
  if (h >= 24) return `se encarga con ${h} h de anticipación`;
  if (h > 0) return 'se encarga de un día para el otro';
  return 'también para hoy mismo';
}
function decorarCarta(detail) {
  categoriasCache = detail.categorias;
  $$('.kit-carta__panel', carta).forEach((panel) => {
    const id = panel.querySelector('.kit-item')?.dataset.cat; if (!id) return;
    const cat = detail.categorias.find((c) => c.id === id) || { id, nombre: id };
    const n = panel.querySelectorAll('.kit-item').length;
    const h = document.createElement('header'); h.className = 'sala-head';
    h.innerHTML = `<h3>${esc(cat.especial ? `${cat.nombre} · sala temporaria` : NOMBRES_SALA[id] || cat.nombre)}</h3><span>${n} ${n === 1 ? 'obra' : 'obras'} · ${esc(anticipacionTxt(cat))}</span>${cat.especial && cat.bajada ? `<p>${esc(cat.bajada)}</p>` : ''}`;
    panel.prepend(h);
  });
  pintarNavSalas();
  fotoDeLaSala();
}
document.addEventListener('kit:carta', (e) => { if (e.detail.el === carta) decorarCarta(e.detail); });

function salaActual() { const tabs = $$('.kit-tab', carta); return { tabs, i: tabs.findIndex((t) => t.classList.contains('is-on')) }; }
function pintarNavSalas() {
  const { tabs, i } = salaActual();
  btnPrev.disabled = i <= 0;
  btnNext.disabled = i < 0 || i >= tabs.length - 1;
  btnNext.textContent = i < tabs.length - 1 ? `${tabs[i + 1].textContent.trim()} →` : 'Siguiente →';
  btnNext.setAttribute('aria-label', i < tabs.length - 1 ? `Siguiente sala: ${tabs[i + 1].textContent.trim()}` : 'Siguiente sala');
}
function irASala(delta) {
  const { tabs, i } = salaActual(); const t = tabs[i + delta]; if (!t) return;
  t.click();
  t.scrollIntoView({ block: 'nearest', inline: 'center', behavior: reduce ? 'auto' : 'smooth' });
  const top = carta.getBoundingClientRect().top + scrollY - parseFloat(getComputedStyle(html).getPropertyValue('--barra')) - 12;
  if (scrollY > top) scrollTo({ top, behavior: reduce ? 'auto' : 'smooth' });
}
btnPrev.addEventListener('click', () => irASala(-1));
btnNext.addEventListener('click', () => irASala(1));
carta.addEventListener('click', (e) => { if (e.target.closest('.kit-tab')) requestAnimationFrame(() => { pintarNavSalas(); fotoDeLaSala(); }); });

// foto grande al costado (desktop): cambia al pasar el mouse por la lista
let fotoActual = '';
function mostrarFoto(item) {
  if (!item || !item.dataset.photo || !esMouse()) return;
  $$('.obra.is-hover', carta).forEach((o) => o !== item && o.classList.remove('is-hover'));
  item.classList.add('is-hover');
  $('[data-foto-n]').textContent = item.querySelector('.obra__n')?.textContent.replace('N.º', 'Obra N.º') || '';
  $('[data-foto-t]').textContent = item.querySelector('.obra__t')?.textContent.trim() || '';
  if (fotoActual === item.dataset.photo) return;
  fotoActual = item.dataset.photo;
  fotoGrande.classList.add('cambia');
  const pre = new Image(); pre.src = fotoActual;
  const listo = () => { if (fotoActual !== pre.src && !pre.src.endsWith(fotoActual)) return; fotoGrande.src = fotoActual; requestAnimationFrame(() => fotoGrande.classList.remove('cambia')); };
  pre.decode ? pre.decode().then(listo, listo) : (pre.onload = listo);
}
function fotoDeLaSala() { const p = $('.kit-carta__panel:not([hidden]) .obra', carta); if (p) mostrarFoto(p); }
let rafHover = 0;
carta.addEventListener('pointerover', (e) => {
  const it = e.target.closest('.obra'); if (!it) return;
  cancelAnimationFrame(rafHover); rafHover = requestAnimationFrame(() => mostrarFoto(it));
});

// =============================== ARMÁ TU DOCENA ===============================
const SABORES = [
  { id: 'manteca', nombre: 'Medialuna de manteca', img: 'img/p/sabor-manteca.webp' },
  { id: 'grasa', nombre: 'Medialuna de grasa', img: 'img/p/sabor-grasa.webp' },
  { id: 'pastelera', nombre: 'Pastelera y membrillo', img: 'img/p/sabor-pastelera.webp' },
  { id: 'vigilante', nombre: 'Tira con pastelera', img: 'img/p/sabor-vigilante.webp' },
  { id: 'cremona', nombre: 'Cremona', img: 'img/p/sabor-cremona.webp' },
];
const listaSab = $('[data-sabores]');
const grilla = $('[data-grilla]');
const caja = $('[data-caja]');
const btnSumar = $('[data-docena-sumar]');
const detalle = $('[data-docena-detalle]');
let docena = [];
listaSab.innerHTML = SABORES.map((s) => `<li class="sabor"><button type="button" data-sabor="${s.id}" aria-label="Sumar ${esc(s.nombre)} a la docena">
  <span class="sabor__img"><img src="${s.img}" alt="" width="260" height="260" loading="lazy" decoding="async" draggable="false"></span><b>${esc(s.nombre)}</b></button></li>`).join('');
grilla.innerHTML = Array.from({ length: 12 }, (_, i) => `<li class="hueco" data-hueco="${i}"></li>`).join('');
arrastreMouse(listaSab);

function resumenDocena() {
  const cuenta = {}; docena.forEach((id) => { cuenta[id] = (cuenta[id] || 0) + 1; });
  return SABORES.filter((s) => cuenta[s.id]).map((s) => `${cuenta[s.id]} ${s.nombre.toLowerCase()}`).join(' · ');
}
function pintarDocena(nuevo = -1) {
  $$('.hueco', grilla).forEach((h, i) => {
    const id = docena[i];
    if (!id) { h.innerHTML = ''; return; }
    if (i === nuevo || !h.firstElementChild || h.dataset.s !== id) {
      const s = SABORES.find((x) => x.id === id);
      h.dataset.s = id;
      h.innerHTML = `<button type="button" aria-label="Sacar ${esc(s.nombre)}" data-sacar="${i}"><img src="${s.img}" alt="" draggable="false"></button>`;
    }
  });
  $('[data-docena-n]').textContent = docena.length;
  const llena = docena.length === 12;
  btnSumar.disabled = !llena;
  detalle.textContent = docena.length ? resumenDocena() + (llena ? '.' : ` · faltan ${12 - docena.length}`) : 'Elegí 12 facturas.';
  caja.classList.toggle('cerrada', false);
  if (llena) setTimeout(() => { if (docena.length === 12) caja.classList.add('cerrada'); }, 420);
}
function volarA(desdeRect, img, destinoEl) {
  return new Promise((res) => {
    if (reduce || !desdeRect) return res();
    const b = destinoEl.getBoundingClientRect();
    const v = document.createElement('span'); v.className = 'vuela'; v.innerHTML = `<img src="${img}" alt="">`;
    const x0 = desdeRect.left + desdeRect.width / 2, y0 = desdeRect.top + desdeRect.height / 2;
    v.style.left = x0 + 'px'; v.style.top = y0 + 'px';
    document.body.appendChild(v);
    const dx = b.left + b.width / 2 - x0, dy = b.top + b.height / 2 - y0;
    const anim = v.animate([
      { transform: 'translate(0,0) scale(1)' },
      { transform: `translate(${dx * 0.5}px, ${dy * 0.5 - 70}px) scale(.9) rotate(-8deg)`, offset: 0.55 },
      { transform: `translate(${dx}px, ${dy}px) scale(${b.width / 70})` },
    ], { duration: 520, easing: 'cubic-bezier(.4,0,.2,1)' });
    anim.onfinish = () => { v.remove(); res(); };
  });
}
async function sumarSabor(id, origen) {
  if (docena.length >= 12) { caja.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-6px)' }, { transform: 'translateX(6px)' }, { transform: 'none' }], { duration: 280 }); return; }
  const i = docena.length; docena.push(id);
  const s = SABORES.find((x) => x.id === id);
  await volarA(origen?.getBoundingClientRect(), s.img, $$('.hueco', grilla)[i]);
  pintarDocena(i);
}
listaSab.addEventListener('click', (e) => {
  const b = e.target.closest('[data-sabor]'); if (!b || b.dataset.arrastrado) { if (b) delete b.dataset.arrastrado; return; }
  sumarSabor(b.dataset.sabor, b.querySelector('.sabor__img'));
});
grilla.addEventListener('click', (e) => {
  const b = e.target.closest('[data-sacar]'); if (!b) return;
  docena.splice(Number(b.dataset.sacar), 1);
  $$('.hueco', grilla).forEach((h) => { delete h.dataset.s; });
  pintarDocena();
});
$('[data-docena-vaciar]').addEventListener('click', () => { docena = []; $$('.hueco', grilla).forEach((h) => { delete h.dataset.s; }); pintarDocena(); });
$('[data-docena-azar]').addEventListener('click', async () => {
  const faltan = 12 - docena.length;
  for (let k = 0; k < faltan; k++) {
    const s = SABORES[Math.floor(Math.random() * SABORES.length)];
    sumarSabor(s.id, $(`[data-sabor="${s.id}"] .sabor__img`));
    await espera(reduce ? 0 : 90);
  }
});
btnSumar.addEventListener('click', () => {
  if (docena.length !== 12) return;
  kit.carrito.agregar('docena-armada', 1, { nota: resumenDocena(), origen: btnSumar });
  docena = []; $$('.hueco', grilla).forEach((h) => { delete h.dataset.s; });
  setTimeout(() => { pintarDocena(); kit.carrito.abrir(); }, reduce ? 0 : 650);
});
pintarDocena();

// arrastrar un sabor a la caja (mouse y lápiz; con el dedo es un toque)
(function arrastrarSabores() {
  let drag = null;
  listaSab.addEventListener('pointerdown', (e) => {
    const b = e.target.closest('[data-sabor]'); if (!b || e.pointerType === 'touch' || e.button !== 0) return;
    drag = { b, x: e.clientX, y: e.clientY, el: null };
  });
  addEventListener('pointermove', (e) => {
    if (!drag) return;
    if (!drag.el) {
      if (Math.hypot(e.clientX - drag.x, e.clientY - drag.y) < 8) return;
      const s = SABORES.find((x) => x.id === drag.b.dataset.sabor);
      drag.el = document.createElement('span'); drag.el.className = 'arrastrando'; drag.el.innerHTML = `<img src="${s.img}" alt="">`;
      document.body.appendChild(drag.el); document.body.style.cursor = 'grabbing';
    }
    drag.el.style.left = e.clientX + 'px'; drag.el.style.top = e.clientY + 'px';
    const r = caja.getBoundingClientRect();
    caja.classList.toggle('sobre', e.clientX > r.left - 20 && e.clientX < r.right + 20 && e.clientY > r.top - 30 && e.clientY < r.bottom + 20);
  });
  addEventListener('pointerup', (e) => {
    if (!drag) return;
    const d = drag; drag = null;
    if (!d.el) return;
    d.b.dataset.arrastrado = '1';
    const sobre = caja.classList.contains('sobre');
    caja.classList.remove('sobre'); document.body.style.cursor = '';
    const r = d.el.getBoundingClientRect(); d.el.remove();
    if (sobre) sumarSabor(d.b.dataset.sabor, { getBoundingClientRect: () => r });
  });
})();

// =============================== SALA TEMPORARIA (fecha especial del panel) ===============================
const sala = $('#sala');
const salaLista = $('[data-sala-lista]');
arrastreMouse(salaLista);
async function pintarSala() {
  const [cats, prods] = await Promise.all([kit.store.getCategorias(), kit.store.getProductos()]);
  const orden = { en_curso: 0, aviso: 1, programada: 2, borrador: 3, termino: 4 };
  const esp = kit.especiales(cats).sort((a, b) => orden[kit.estadoEspecial(a)] - orden[kit.estadoEspecial(b)])[0];
  const items = esp ? prods.filter((p) => p.categoria === esp.id && p.disponible !== false) : [];
  sala.hidden = !esp || !items.length;
  $$('[data-sala-link]').forEach((a) => { a.hidden = sala.hidden; if (esp) a.textContent = esp.nombre; });
  if (sala.hidden) return;
  const estado = kit.estadoEspecial(esp);
  $('[data-sala-t]').innerHTML = `${esc(esp.nombre)} en <em>Las Buenas Artes</em>`;
  $('[data-sala-p]').textContent = esp.bajada || '';
  const cuenta = $('[data-sala-cuenta]');
  const hoy = kit.hoy();
  const dias = (f) => Math.round((Date.parse(f) - Date.parse(hoy)) / 864e5);
  if ((estado === 'aviso' || estado === 'programada') && esp.desde) {
    const n = dias(esp.desde);
    cuenta.innerHTML = `<b>${n}</b><span>${n === 1 ? 'día' : 'días'} para que arranque. Encargá con tiempo.</span>`;
  } else if (estado === 'en_curso' && esp.hasta) {
    const n = dias(esp.hasta);
    cuenta.innerHTML = n > 0 ? `<b>${n}</b><span>${n === 1 ? 'día' : 'días'} para encargar y retirar.</span>` : '<b>Hoy</b><span>es el último día para retirar.</span>';
  } else cuenta.innerHTML = '<span>Vista previa de la sala para el pitch.</span>';
  salaLista.innerHTML = items.map((p) => `<li class="pieza">
      <div class="pieza__img">${p.foto ? `<img src="${esc(kit.asset(p.foto))}" alt="" width="720" height="900" loading="lazy" decoding="async" draggable="false">` : ''}</div>
      <div class="pieza__body"><h3 class="pieza__t">${esc(p.nombre)}</h3>${p.descripcion ? `<p class="pieza__d">${esc(p.descripcion)}</p>` : ''}
        <div class="pieza__pie"><span class="pieza__precio">${esc(kit.money(p.precio) ?? 'A confirmar')}</span>${kit.pedible(p) ? `<div data-kit-qty="${esc(p.id)}"></div>` : ''}</div></div></li>`).join('');
  kit.carrito.sync(salaLista);
  observarReveal(sala);
}
pintarSala();
kit.store.onChange(() => pintarSala());

// =============================== GALERÍA: mosaico (desktop) + mazo (celu) ===============================
const GAL = [
  ['g152', 'Pastafrola de membrillo', '«La mejor creación del mundo»'],
  ['g048', 'Mini alfajores de chocolate', '«Uno nunca alcanza»'],
  ['g089', 'Chocolate y frutillas', '«Fans de las frutillas»'],
  ['g042', 'Bocados para compartir', '«Siempre hay uno que se vuelve favorito»'],
  ['g247', 'Bombones', '«Para regalar (o regalarte)»'],
  ['g012', 'El pan de cada día', '«Fotos que se escuchan crujir»'],
  ['g192', 'Bandejitas de cookies', '«Difícil decisión»'],
  ['g227', 'Alfajor de maicena', '«Clásicos que siempre funcionan»'],
  ['g131', 'Merengue y dulce de leche', '«Especial para el team dulce»'],
  ['g239', 'Las bandejas del día', '«Uno más tentador que el otro»'],
];
$('[data-galeria]').innerHTML = GAL.map(([f, t, d], i) => `<figure class="obra-g revela"><img src="img/f/${f}.webp" alt="${esc(t)}" width="900" height="1125" loading="lazy" decoding="async">
  <figcaption class="cartela"><span class="cartela__n">Obra N.º ${pad2(i + 1)}</span><b class="cartela__t">${esc(t)}</b><span class="cartela__d">${esc(d)}</span></figcaption></figure>`).join('');
observarReveal($('[data-galeria]'));

(function mazo() {
  const cont = $('[data-mazo]');
  const contador = $('[data-mazo-cont]');
  let orden = GAL.map((_, i) => i);
  let visto = 0;
  const giros = [-2.5, 2, -1, 3, -3.5];
  function pintar() {
    cont.innerHTML = orden.slice(0, 4).reverse().map((i, k, arr) => {
      const prof = arr.length - 1 - k; const [f, t, d] = GAL[i];
      return `<figure class="mazo__foto${prof === 0 ? ' arriba' : ''}" style="--r:${prof === 0 ? 0 : giros[(i + prof) % giros.length]}deg;--y:${prof * 6}px;z-index:${10 - prof}">
        <img src="img/f/${f}.webp" alt="${esc(t)}" width="900" height="1125" ${prof > 1 ? 'loading="lazy"' : ''} decoding="async" draggable="false">
        ${prof === 0 ? `<figcaption class="cartela"><span class="cartela__n">Obra N.º ${pad2(i + 1)}</span><b class="cartela__t">${esc(t)}</b><span class="cartela__d">${esc(d)}</span></figcaption>` : ''}</figure>`;
    }).join('');
    contador.textContent = `${pad2((visto % GAL.length) + 1)} / ${pad2(GAL.length)}`;
  }
  function tirar(dir = 1) {
    const top = $('.mazo__foto.arriba', cont); if (!top || top.dataset.va) return;
    top.dataset.va = '1';
    top.style.transition = 'transform .42s cubic-bezier(.4,0,.9,.6), opacity .42s';
    top.style.transform = `translateX(${dir * 130}%) rotate(${dir * 18}deg)`; top.style.opacity = '0';
    setTimeout(() => { orden.push(orden.shift()); visto++; pintar(); }, reduce ? 0 : 380);
  }
  let x0 = 0, dx = 0, activo = false, idp = null;
  cont.addEventListener('pointerdown', (e) => {
    const top = e.target.closest('.mazo__foto.arriba'); if (!top) return;
    activo = true; idp = e.pointerId; x0 = e.clientX; dx = 0; top.style.transition = 'none'; top.setPointerCapture(e.pointerId);
  });
  cont.addEventListener('pointermove', (e) => {
    if (!activo || e.pointerId !== idp) return;
    dx = e.clientX - x0; const top = $('.mazo__foto.arriba', cont);
    top.style.transform = `translateX(${dx}px) rotate(${dx / 18}deg)`;
  });
  const fin = () => {
    if (!activo) return; activo = false; const top = $('.mazo__foto.arriba', cont);
    if (Math.abs(dx) > 80) tirar(Math.sign(dx)); else if (top) { top.style.transition = ''; top.style.transform = ''; }
  };
  cont.addEventListener('pointerup', fin); cont.addEventListener('pointercancel', fin);
  $('[data-mazo-sig]').addEventListener('click', () => tirar(1));
  pintar();
})();

// =============================== HORARIOS Y "ABIERTO AHORA" ===============================
(function horarios() {
  const DIAS = [['lun', 'Lunes'], ['mar', 'Martes'], ['mie', 'Miércoles'], ['jue', 'Jueves'], ['vie', 'Viernes'], ['sab', 'Sábado'], ['dom', 'Domingo']];
  const hoyIdx = (new Date(kit.hoy() + 'T12:00:00').getDay() + 6) % 7;
  const h = (s) => s.replace(/^0/, '').replace(':00', '');
  $('[data-horarios]').innerHTML = DIAS.map(([k, n], i) => {
    const fr = C.horarios[k] || [];
    return `<tr${i === hoyIdx ? ' class="hoy"' : ''}><td>${n}${i === hoyIdx ? ' · hoy' : ''}</td><td>${fr.length ? fr.map(([a, b]) => `${h(a)} a ${h(b)} h`).join(' y ') : 'Cerrado'}</td></tr>`;
  }).join('');
  function estado() {
    const e = kit.abierto();
    const largo = e.abierto ? `Abierto ahora · hasta las ${h(e.cierra)} h` : `Cerrado ahora${e.abre ? ` · abre a las ${h(e.abre)} h` : ' · abre mañana a las 7 h'}`;
    const el = $('[data-estado-largo]'); el.textContent = largo; el.classList.toggle('cerrado', !e.abierto);
    const corto = $('[data-abierto]'); corto.textContent = e.abierto ? `Abierto hasta las ${h(e.cierra)}` : 'Cerrado ahora'; corto.classList.toggle('cerrado', !e.abierto);
    const hero = $('[data-abierto-largo]'); if (hero) hero.textContent = e.abierto ? `Abierto hoy hasta las ${h(e.cierra)} h` : 'Abrimos todos los días desde las 7';
  }
  estado(); setInterval(estado, 60_000);
})();
