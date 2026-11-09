(function () {
  'use strict';
  var S = window.SITE, I = window.I18N, LEGAL = window.LEGAL;
  var app = document.getElementById('app');
  var IMG = function (name) { return 'assets/img/products/' + name + '.jpg'; };
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var TG = S.brand.socials[0].url;
  var HEADER_MODES = ['static', 'hide', 'fade'];
  var headerMode = S.settings.headerMode || 'static';
  if (S.settings.headerDemo) {
    try { var hm = localStorage.getItem('iu-header-demo'); if (HEADER_MODES.indexOf(hm) !== -1) headerMode = hm; } catch (e) { /* без хранилища */ }
  }

  /* ---------- Хранилище браузера (может быть недоступно) ---------- */
  function load(k, d) { try { var v = localStorage.getItem(k); return v === null ? d : v; } catch (e) { return d; } }
  function save(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* без хранилища */ } }

  /* ---------- Язык ---------- */
  var lang = load('iu-lang', 'ru');
  if (lang !== 'ru' && lang !== 'en') lang = 'ru';
  function t(k) { var v = I.ui[lang][k]; return v === undefined ? I.ui.ru[k] : v; }
  function loc(kind, obj) {
    if (lang !== 'en' || !obj) return obj;
    var o = I.en[kind] && I.en[kind][obj.id];
    return o ? Object.assign({}, obj, o) : obj;
  }
  var rub = function (n) { return lang === 'en' ? '₽' + n.toLocaleString('en-US') : n.toLocaleString('ru-RU').replace(/ |,/g, ' ') + ' ₽'; };
  var num = function (n) { return lang === 'en' ? n.toLocaleString('en-US') : n.toLocaleString('ru-RU').replace(/ |,/g, ' '); };
  function plural(n) {
    var f = t('works');
    if (lang === 'en') return n === 1 ? f[0] : f[1];
    var a = n % 10, b = n % 100; return a === 1 && b !== 11 ? f[0] : a >= 2 && a <= 4 && (b < 10 || b >= 20) ? f[1] : f[2];
  }

  var cats = function () { return S.categories.map(function (c) { return loc('categories', c); }); };
  var catById = function (id) { return loc('categories', S.categories.find(function (c) { return c.id === id; })); };
  var prods = function () { return S.products.map(function (p) { return loc('products', p); }); };
  var prodById = function (id) { return loc('products', S.products.find(function (p) { return p.id === id; })); };
  var mks = function () { return S.masterclasses.map(function (m) { return loc('masterclasses', m); }); };
  var mkById = function (id) { return loc('masterclasses', S.masterclasses.find(function (m) { return m.id === id; })); };
  var common = function () { return lang === 'en' ? Object.assign({}, S.productCommon, I.en.productCommon) : S.productCommon; };
  var dyes = function () { return S.dyes.map(function (d, i) { return lang === 'en' ? Object.assign({}, d, I.en.dyes[i]) : d; }); };
  var studio = function () { return lang === 'en' ? I.en.brand.studio : S.brand.studio; };
  var socialName = function (s) { return (lang === 'en' && I.en.brand.socials[s.name]) || s.name; };

  function catShort(c) {
    if (c.short) return c.short;
    if (c.id === 'custom') return 'Нестандартные';
    if (c.id === 'top') return 'Топы';
    var title = lang === 'en' ? c.title.replace(/^Silk s/, 'S').replace(/^Long silk s/, 'Long s') : c.title.replace('Шёлковые ', '');
    title = title.charAt(0).toUpperCase() + title.slice(1);
    return title + ' ' + c.size.replace(/ (см|cm)$/, '');
  }
  var catFull = function (c) { return c.noSize ? c.title : c.title + ' ' + c.size; };

  /* Монограмма IU: тонкая засечная I и U, правая ножка U вырастает в стебель с листом */
  var MONO = '<svg class="logo__mono" viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true">' +
    '<path d="M17 14v36M12.5 14h9M12.5 50h9"/>' +
    '<path d="M29 14v22a10.5 10.5 0 0 0 21 0V8"/><path d="M24.5 14h9"/>' +
    '<path d="M50 8c0-3 3.2-5.6 7-6-0.3 4-3.2 6.6-7 6z" fill="currentColor" stroke="none"/>' +
    '</svg>';
  var LOGO = function () {
    return '<a class="logo" href="#" aria-label="' + t('title_suffix') + '">' + MONO +
      '<span class="logo__word">' + S.brand.latin + '</span>' +
      '<span class="logo__sub">' + (lang === 'en' ? 'art textile' : 'арт текстиль') + '</span></a>';
  };
  var LANG = function () {
    return '<span class="lang" role="group" aria-label="Language">' +
      ['ru', 'en'].map(function (l) { return '<button data-lang="' + l + '" aria-pressed="' + (l === lang) + '"' + (l === lang ? ' class="is-active"' : '') + '>' + l.toUpperCase() + '</button>'; }).join('<span aria-hidden="true">/</span>') +
      '</span>';
  };

  /* ---------- Согласие на обработку данных ---------- */
  function consentField(id) {
    return '<label class="consent" for="' + id + '"><input type="checkbox" id="' + id + '" name="consent"' + (S.settings.consentPrechecked ? ' checked' : '') + '>' +
      '<span>' + t('consent') + '</span></label>';
  }

  /* ---------- Корзина (хранится в браузере посетителя) ---------- */
  var cart = [];
  try { cart = JSON.parse(load('iu-cart', '[]')) || []; } catch (e) { cart = []; }
  function saveCart() { save('iu-cart', JSON.stringify(cart)); updateCount(); }
  function itemInfo(key) {
    var parts = key.split(':');
    if (parts[0] === 'p') {
      var p = prodById(parts[1]); if (!p) return null;
      var c = catById(p.category);
      return { title: p.name, sub: p.kind + (c.noSize ? '' : ', ' + c.size), price: p.price, img: IMG(p.images[0]) };
    }
    var m = mkById(parts[1]); return m && { title: m.name, sub: m.type + ' · ' + m.format, price: m.price, img: m.cover };
  }
  function inCart(key) { return cart.indexOf(key) !== -1; }
  function addToCart(key) { if (!inCart(key)) { cart.push(key); saveCart(); } openCart(); }
  function updateCount() { document.querySelectorAll('.cart-count').forEach(function (el) { el.textContent = cart.length ? '(' + cart.length + ')' : ''; }); }

  var toastTimer;
  function toast(msg) {
    var el = document.getElementById('toast'); el.textContent = msg; el.hidden = false;
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { el.hidden = true; }, 3600);
  }

  function renderCart() {
    var d = document.getElementById('drawer');
    d.setAttribute('aria-label', t('cart'));
    var items = cart.map(function (k) { return [k, itemInfo(k)]; }).filter(function (x) { return x[1]; });
    var total = items.reduce(function (s, x) { return s + x[1].price; }, 0);
    d.innerHTML =
      '<div class="drawer__head"><h2>' + t('cart') + '</h2><button class="close" data-close-cart>' + t('close') + '</button></div>' +
      (items.length ? items.map(function (x) {
        var i = x[1];
        return '<div class="line"><img src="' + i.img + '" alt=""><div><h3>' + esc(i.title) + '</h3><p>' + esc(i.sub) + '</p></div>' +
          '<div style="display:grid;gap:8px;justify-items:end"><span class="price">' + rub(i.price) + '</span><button data-remove="' + x[0] + '">' + t('remove') + '</button></div></div>';
      }).join('') +
        '<div class="total"><span class="label">' + t('total') + '</span><span class="price" style="font-size:20px">' + rub(total) + '</span></div>' +
        '<form class="form" id="order-form" novalidate>' +
        '<p class="label">' + t('checkout') + '</p>' +
        '<div class="field"><label for="f-name">' + t('f_name') + '</label><input id="f-name" name="name" autocomplete="name"></div>' +
        '<div class="field"><label for="f-contact">' + t('f_contact') + '</label><input id="f-contact" name="contact" autocomplete="tel"></div>' +
        '<div class="field"><label for="f-city">' + t('f_city') + '</label><input id="f-city" name="city" autocomplete="address-level2"></div>' +
        '<div class="field"><label for="f-msg">' + t('f_msg') + '</label><textarea id="f-msg" name="msg" rows="3"></textarea></div>' +
        consentField('f-consent') +
        '<p class="form-error" id="f-error" hidden></p>' +
        '<button class="btn" type="submit">' + t('send_order') + '</button>' +
        '<p class="note">' + t('order_note') + '</p>' +
        '<p class="note">' + t('demo_note') + '</p>' +
        '</form>'
        : '<div class="empty" style="padding-top:24px"><p>' + t('cart_empty') + '</p><a class="link" href="#catalog" data-close-cart>' + t('go_catalog') + '</a></div>');
  }
  function openCart() { renderCart(); document.getElementById('drawer').hidden = false; document.getElementById('overlay').hidden = false; }
  function closeCart() { document.getElementById('drawer').hidden = true; document.getElementById('overlay').hidden = true; }

  /* ---------- Запись на мастер-класс ---------- */
  function demoDates() {
    /* ближайшие выходные — демонстрационное расписание */
    var out = [], d = new Date(); d.setHours(12, 0, 0, 0);
    while (out.length < 8) { d.setDate(d.getDate() + 1); if (d.getDay() === 6 || d.getDay() === 0) out.push(new Date(d)); }
    return out;
  }
  function openBooking(id) {
    var m = document.getElementById('booking'), WD = t('weekdays'), MONTHS = t('months');
    var options = mks().map(function (x) { return [x.id, x.type + ' «' + x.name + '»']; }).concat([['offline', t('offline_opt')]]);
    m.innerHTML = '<div class="modal__box" role="dialog" aria-modal="true" aria-labelledby="b-title">' +
      '<div class="drawer__head"><h2 id="b-title">' + t('booking_h') + '</h2><button class="close" data-close-booking>' + t('close') + '</button></div>' +
      '<form class="form" id="booking-form" novalidate>' +
      '<div class="field"><label for="b-mk">' + t('b_mk') + '</label><select id="b-mk" name="mk">' +
      options.map(function (o) { return '<option value="' + o[0] + '"' + (o[0] === id ? ' selected' : '') + '>' + esc(o[1]) + '</option>'; }).join('') + '</select></div>' +
      '<fieldset class="field"><legend>' + t('b_format') + '</legend><div class="chips">' +
      '<label class="pick"><input type="radio" name="format" value="' + t('online') + '"' + (id === 'offline' ? '' : ' checked') + '><span>' + t('online') + '</span></label>' +
      '<label class="pick"><input type="radio" name="format" value="' + t('offline') + '"' + (id === 'offline' ? ' checked' : '') + '><span>' + t('offline') + '</span></label></div></fieldset>' +
      '<fieldset class="field"><legend>' + t('b_date') + '</legend><div class="chips chips--dates">' +
      demoDates().map(function (d, i) {
        var v = lang === 'en' ? MONTHS[d.getMonth()] + ' ' + d.getDate() : d.getDate() + ' ' + MONTHS[d.getMonth()];
        return '<label class="pick"><input type="radio" name="date" value="' + WD[d.getDay()] + ', ' + v + '" id="b-date-' + i + '"><span><small>' + WD[d.getDay()] + '</small>' + v + '</span></label>';
      }).join('') + '</div></fieldset>' +
      '<fieldset class="field"><legend>' + t('b_time') + '</legend><div class="chips">' +
      ['11:00', '14:00', '17:00'].map(function (x) { return '<label class="pick"><input type="radio" name="time" value="' + x + '"><span>' + x + '</span></label>'; }).join('') + '</div></fieldset>' +
      '<div class="field"><label for="b-name">' + t('f_name') + '</label><input id="b-name" name="name" autocomplete="name"></div>' +
      '<div class="field"><label for="b-contact">' + t('f_contact') + '</label><input id="b-contact" name="contact" autocomplete="tel"></div>' +
      consentField('b-consent') +
      '<p class="form-error" id="b-error" hidden></p>' +
      '<button class="btn" type="submit">' + t('book') + '</button>' +
      '<p class="note">' + t('b_demo') + '</p>' +
      '</form></div>';
    m.hidden = false;
  }
  function closeBooking() { document.getElementById('booking').hidden = true; }

  /* ---------- Уведомление о cookie ---------- */
  function renderCookie() {
    var el = document.getElementById('cookie');
    if (load('iu-cookie', '') === 'ok') { el.hidden = true; return; }
    el.innerHTML = '<p>' + t('cookie_text') + '</p><button class="btn" data-cookie-ok>' + t('cookie_ok') + '</button>';
    el.hidden = false;
  }

  /* ---------- Общие блоки ---------- */
  function card(p) {
    var c = catById(p.category);
    return '<a class="card" href="#item-' + p.id + '">' +
      '<div class="card__img">' +
      '<img src="' + IMG(p.images[0]) + '" alt="' + esc(p.name) + '" loading="lazy">' +
      '<img src="' + IMG(p.hover) + '" alt="" loading="lazy"></div>' +
      '<div class="card__body"><span class="label card__kind">' + esc(p.kind) + (c.noSize ? '' : ' · ' + c.size) + '</span>' +
      '<span class="card__name">' + esc(p.name) + '</span>' +
      '<span class="card__dyes">' + esc(p.dyes.join(', ')) + '</span>' +
      '<div class="card__row"><span class="price">' + rub(p.price) + '</span><span class="link" style="font-size:10px">' + t('more') + '</span></div></div></a>';
  }
  function catCount(id) { return S.products.filter(function (p) { return p.category === id; }).length; }

  /* Текст, который проявляется «из тумана» слово за словом */
  function fog(parts) {
    var i = 0;
    return parts.map(function (part) {
      var words = part[0].split(' ').filter(Boolean).map(function (w) {
        return '<span class="w" style="--i:' + (i++) + '">' + w + '</span>';
      }).join(' ');
      return part[1] ? '<em>' + words + '</em>' : words;
    }).join(' ');
  }

  /* ---------- Виды ---------- */
  function home() {
    var m = t('manifesto');
    return '<section class="hero" data-tone="dark">' +
      '<img src="' + IMG('p3-4') + '" alt="' + t('hero_alt1') + '">' +
      '<img src="' + IMG('p5-1') + '" alt="' + t('hero_alt2') + '">' +
      '<div class="hero__text"><span class="label">' + t('hero_label') + '</span>' +
      '<h1>' + t('hero_h1') + '</h1>' +
      '<a class="link" href="#catalog">' + t('hero_cta') + '</a></div></section>' +

      '<section class="section"><div class="wrap manifesto">' +
      '<span class="label muted">' + t('manifesto_label') + '</span>' +
      '<p class="big fog" data-fog>' + fog([[m[0]], [m[1], true]]) + '</p>' +
      '<p class="small">' + t('manifesto_small') + '</p>' +
      '</div></section>' +

      '<section class="section section--white"><div class="wrap">' +
      '<div class="section-head"><div><span class="label">' + t('cats_label') + '</span><h2>' + t('cats_h') + '</h2></div><a class="link" href="#catalog">' + t('all_items') + '</a></div>' +
      '<div class="cats">' + cats().map(function (c) {
        return '<a class="cat" href="#catalog-' + c.id + '"><div class="cat__img"><img src="' + c.cover + '" alt="" loading="lazy"></div>' +
          '<div class="cat__meta"><span class="cat__title">' + c.title + '</span><span class="cat__size">' + c.size + '</span></div>' +
          '</a>';
      }).join('') + '</div></div></section>' +

      '<section class="section"><div class="wrap">' +
      '<div class="section-head"><div><span class="label">' + t('new_label') + '</span><h2>' + t('new_h') + '</h2></div><a class="link" href="#catalog">' + t('full_catalog') + '</a></div>' +
      '<div class="grid">' + prods().reverse().slice(0, 6).map(card).join('') + '</div></div></section>' +

      processBlock() +

      '<section class="section section--sky"><div class="wrap">' +
      '<div class="section-head"><div><span class="label">' + t('dyes_label') + '</span><h2>' + t('dyes_h') + '</h2></div>' +
      '<p class="muted" style="max-width:420px">' + t('dyes_note') + '</p></div>' +
      '<div class="dyes">' + dyes().map(function (d) {
        return '<div class="dye"><span class="dye__swatch" style="background:' + d.color + '"></span><div><h3>' + d.name + '</h3><p>' + d.part + '</p><span class="label">' + d.gives + '</span></div></div>';
      }).join('') + '</div></div></section>' +

      '<section class="section"><div class="wrap">' +
      '<div class="section-head"><div><span class="label">' + t('mk_label') + '</span><h2>' + t('mk_h') + '</h2></div><a class="link" href="#masterclasses">' + t('mk_all') + '</a></div>' +
      '<div class="mk-row">' + mks().map(function (m) {
        return '<article class="mk-card"><a class="mk-card__img" href="#mk-' + m.id + '"><img src="' + m.cover + '" alt="" loading="lazy"></a>' +
          '<div class="mk-card__body"><span class="label muted">' + m.type + ' · ' + m.format + '</span><h3><a href="#mk-' + m.id + '">' + m.name + '</a></h3>' +
          '<p class="muted" style="font-size:14px">' + m.level + '</p><span class="spacer"></span>' +
          '<span class="price" style="font-size:18px">' + rub(m.price) + '</span>' +
          '<div class="mk-card__actions"><a class="link" href="#mk-' + m.id + '">' + t('more') + '</a></div></div></article>';
      }).join('') + '</div></div></section>' +

      aboutBlock();
  }

  function processBlock() {
    return '<section class="section section--white" id="process"><div class="wrap process">' +
      '<div class="process__video"><video src="assets/video/process.mp4" poster="assets/video/process-poster.jpg" autoplay muted loop playsinline preload="metadata" aria-label="' + t('video_label') + '"></video>' +
      '<button class="sound" data-sound aria-pressed="false">' + t('sound_off') + '</button></div>' +
      '<div class="process__text"><span class="label muted">' + t('process_label') + '</span><h2>' + t('process_h') + '</h2>' +
      '<p class="process__lead">' + t('process_lead') + '</p>' +
      '<div class="care">' + t('care').map(function (c) {
        return '<div><span class="label muted">' + c[0] + '</span><h3>' + c[1] + '</h3><p>' + c[2] + '</p></div>';
      }).join('') + '</div><a class="link" href="#catalog">' + t('see_items') + '</a></div></div></section>';
  }

  function aboutBlock() {
    var f = t('facts');
    return '<section class="section section--white" id="about"><div class="wrap about">' +
      '<div class="about__img"><img src="' + IMG('p7-1') + '" alt="' + t('about_alt') + '" loading="lazy"></div>' +
      '<div class="about__text"><span class="label muted">' + t('about_label') + '</span><h2>' + (lang === 'en' ? 'Irina Utkina' : 'Ирина Уткина') + '</h2>' +
      '<p>' + t('about_p1') + '</p><p class="muted">' + t('about_p2') + '</p>' +
      '<div class="facts">' +
      '<div><b data-count="10" data-suffix="+">10+</b><span>' + f[0] + '</span></div>' +
      '<div><b data-count="1000" data-suffix="+">' + num(1000) + '+</b><span>' + f[1] + '</span></div>' +
      '<div><b data-count="30">30</b><span>' + f[2] + '</span></div></div>' +
      '<p class="muted" style="font-size:14px">' + studio() + '. ' + t('about_p3') + '</p>' +
      '</div></div></section>';
  }

  function catalog(catId) {
    var list = catId ? prods().filter(function (p) { return p.category === catId; }) : prods();
    var c = catId && catById(catId);
    var tabs = '<a href="#catalog" class="' + (!catId ? 'is-active' : '') + '">' + t('all') + '</a>' +
      cats().map(function (x) {
        return '<a href="#catalog-' + x.id + '" class="' + (catId === x.id ? 'is-active' : '') + '">' + catShort(x) + '</a>';
      }).join('');
    var body = list.length ? '<div class="grid">' + list.map(card).join('') + '</div>' :
      '<div class="empty"><span class="label muted">' + c.material + '</span><h2>' + t('empty_h') + '</h2>' +
      '<p>' + t('empty_p') + '</p>' +
      '<a class="btn btn--ghost" href="' + TG + '" target="_blank" rel="noopener">' + t('write_tg') + '</a></div>';
    return '<div class="wrap"><header class="page-head"><span class="label muted">' + (c ? c.material : t('ready_made')) + '</span>' +
      '<h1>' + (c ? c.title + (c.noSize ? '' : ' <em style="font-style:italic">' + c.size + '</em>') : t('catalog_h')) + '</h1>' +
      '<p>' + (c && c.id === 'custom' ? t('custom_note') : t('catalog_note')) + '</p></header>' +
      '<nav class="tabs" aria-label="' + t('tabs_label') + '">' + tabs + '</nav>' + body + '</div><div style="height:var(--section)"></div>';
  }

  function product(id) {
    var p = prodById(id); if (!p) return notFound();
    var c = catById(p.category), k = 'p:' + p.id, pc = common();
    var others = prods().filter(function (x) { return x.id !== p.id; }).slice(0, 3);
    var size = p.size || (c.noSize ? t('size_ask') : c.size);
    return '<div class="wrap"><nav class="crumbs label"><a href="#catalog">' + t('catalog_h') + '</a><span>/</span><a href="#catalog-' + c.id + '">' + catFull(c) + '</a></nav>' +
      '<div class="product"><div class="gallery">' + p.images.map(function (im, i) {
        return '<img src="' + IMG(im) + '" alt="' + esc(p.name) + ', ' + t('photo') + ' ' + (i + 1) + '" data-zoom loading="' + (i < 2 ? 'eager' : 'lazy') + '">';
      }).join('') + '</div>' +
      '<aside class="info"><span class="label muted">' + esc(p.kind) + '</span><h1>' + esc(p.name) + '</h1>' +
      '<span class="price">' + rub(p.price) + '</span>' +
      '<p>' + esc(p.text) + '</p>' +
      '<dl class="specs"><div><dt>' + t('size') + '</dt><dd>' + size + '</dd></div><div><dt>' + t('material') + '</dt><dd>' + pc.material + '</dd></div>' +
      '<div><dt>' + t('dyes') + '</dt><dd>' + esc(p.dyes.join(', ')) + '</dd></div>' +
      (p.edge === false ? '' : '<div><dt>' + t('edge') + '</dt><dd>' + t('edge_v') + '</dd></div>') + '</dl>' +
      (inCart(k) ? '<a class="btn btn--ghost" href="#" data-open-cart>' + t('in_cart_checkout') + '</a>' : '<button class="btn" data-add="' + k + '">' + t('add_to_cart') + '</button>') +
      '<div><details><summary class="label">' + t('care_t') + '</summary><p>' + pc.care + '</p></details>' +
      '<details><summary class="label">' + t('delivery_t') + '</summary><p>' + t('delivery_p') + ' <a href="#offer" style="text-decoration:underline">' + (lang === 'en' ? 'Terms of sale' : 'Условия продажи и возврата') + '</a></p></details>' +
      '<details><summary class="label">' + t('color_t') + '</summary><p>' + t('color_p') + '</p></details></div>' +
      '</aside></div></div>' +
      '<section class="section section--white"><div class="wrap"><div class="section-head"><h2>' + t('other_works') + '</h2><a class="link" href="#catalog">' + t('full_catalog') + '</a></div>' +
      '<div class="grid">' + others.map(card).join('') + '</div></div></section>';
  }

  function masterclasses() {
    return '<div class="wrap"><header class="page-head"><span class="label muted">' + t('mk_page_label') + '</span><h1>' + t('mk_h') + '</h1>' +
      '<p>' + t('mk_page_p') + '</p></header>' +
      mks().map(function (m) {
        var k = 'm:' + m.id;
        var media = (m.gallery.length ? m.gallery : [m.cover]).map(function (src) { return '<img src="' + src + '" alt="" data-zoom loading="lazy">'; }).join('');
        return '<article class="mk" id="mk-' + m.id + '"><div class="mk__media">' + media + '</div><div class="mk__body">' +
          '<span class="label muted">' + m.type + '</span><h2>' + m.name + '</h2>' +
          '<div class="mk__meta"><span class="chip">' + m.format + '</span><span class="chip">' + m.level + '</span>' +
          m.facts.map(function (f) { return '<span class="chip">' + f + '</span>'; }).join('') + '</div>' +
          '<p class="mk__lead">' + m.lead + '</p><p class="muted">' + m.audience + '</p>' +
          '<div><p class="label" style="margin-bottom:16px">' + (m.id === 'konspekt' ? t('in_konspekt') : t('in_mk')) + '</p><div class="topics">' +
          m.topics.map(function (x) { return '<div><h3>' + x[0] + '</h3><p>' + x[1] + '</p></div>'; }).join('') + '</div></div>' +
          '<p class="muted">' + m.outro + '</p>' +
          '<div class="buy"><span class="price">' + rub(m.price) + '</span>' +
          (inCart(k) ? '<a class="btn btn--ghost" href="#" data-open-cart>' + t('in_cart') + '</a>' : '<button class="btn btn--ghost" data-add="' + k + '">' + t('buy_materials') + '</button>') +
          '<a class="link" href="' + TG + '" target="_blank" rel="noopener">' + t('ask') + '</a></div></div></article>';
      }).join('') +
      '<article class="mk" id="mk-offline"><div class="mk__media"><img src="' + IMG('p6-2') + '" alt="" loading="lazy"></div><div class="mk__body">' +
      '<span class="label muted">' + t('offline_label') + '</span><h2>' + t('offline_h') + '</h2>' +
      '<p class="mk__lead">' + t('offline_p') + '</p>' +
      '<div class="buy"><a class="btn btn--ghost" href="' + TG + '" target="_blank" rel="noopener">' + t('ask') + '</a></div></div></article>' +
      '</div>';
  }

  function portfolio() {
    var imgs = [];
    S.products.forEach(function (p) { p.images.forEach(function (im) { imgs.push(IMG(im)); }); });
    S.masterclasses[1].gallery.forEach(function (g, i) { imgs.splice(4 + i * 9, 0, g); });
    return '<div class="wrap"><header class="page-head"><span class="label muted">' + t('portfolio_label') + '</span><h1>' + t('nav_portfolio') + '</h1>' +
      '<p>' + t('portfolio_p') + '</p></header>' +
      '<div class="masonry">' + imgs.map(function (s) { return '<img src="' + s + '" alt="" data-zoom loading="lazy">'; }).join('') + '</div></div>' +
      '<div style="height:var(--section)"></div>';
  }

  function contacts() {
    return '<div class="wrap"><header class="page-head"><span class="label muted">' + studio() + '</span><h1>' + t('nav_contacts') + '</h1>' +
      '<p>' + t('contacts_p') + '</p></header>' +
      '<div class="contacts">' + S.brand.socials.map(function (s) {
        return '<a class="contact" href="' + s.url + '" target="_blank" rel="noopener"><span class="label muted">' + socialName(s) + '</span><h3>' + s.handle + '</h3><p>' + s.url.replace('https://', '') + '</p></a>';
      }).join('') + '</div></div><div style="height:var(--section)"></div>' + aboutBlock();
  }

  function legalPage(id) {
    var doc = LEGAL.docs.find(function (d) { return d.id === id; });
    var body = doc.html.replace(/\[([^\]]+)\]/g, '<mark>[$1]</mark>');
    return '<div class="wrap legal"><header class="page-head"><span class="label muted">' + t('footer_legal') + '</span><h1>' + doc.title + '</h1>' +
      (t('legal_note') ? '<p>' + t('legal_note') + '</p>' : '') + '</header>' +
      '<nav class="tabs" aria-label="' + t('footer_legal') + '">' + LEGAL.docs.map(function (d) {
        return '<a href="#' + d.id + '" class="' + (d.id === id ? 'is-active' : '') + '">' + d.title + '</a>';
      }).join('') + '</nav>' +
      '<article class="legal__body">' + body + '</article></div><div style="height:var(--section)"></div>';
  }

  function notFound() {
    return '<div class="wrap"><div class="empty" style="padding-block:120px"><h2>' + t('not_found') + '</h2><a class="link" href="#">' + t('to_home') + '</a></div></div>';
  }

  /* ---------- Анимации по скроллу ---------- */
  var observers = [];
  function enhance() {
    observers.forEach(function (o) { o.disconnect(); }); observers = [];
    var canObserve = 'IntersectionObserver' in window && !reduceMotion;

    document.querySelectorAll('[data-fog]').forEach(function (el) {
      if (!canObserve) { el.classList.add('is-in'); return; }
      el.classList.add('is-armed');
      var o = new IntersectionObserver(function (en) {
        if (en[0].isIntersecting) { el.classList.add('is-in'); o.disconnect(); }
      }, { threshold: 0.35 });
      o.observe(el); observers.push(o);
    });

    document.querySelectorAll('[data-count]').forEach(function (el) {
      if (!canObserve) return;
      var target = +el.dataset.count, suffix = el.dataset.suffix || '';
      var fmt = function (n) { return num(n) + suffix; };
      el.textContent = fmt(0);
      var o = new IntersectionObserver(function (en) {
        if (!en[0].isIntersecting) return; o.disconnect();
        var t0 = performance.now(), dur = 1800;
        (function tick(now) {
          var k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 3);
          el.textContent = fmt(Math.round(target * e));
          if (k < 1) requestAnimationFrame(tick);
        })(t0);
      }, { threshold: 0.6 });
      o.observe(el); observers.push(o);
    });

    var v = document.querySelector('.process__video video');
    if (v && reduceMotion) { v.removeAttribute('autoplay'); v.pause(); v.controls = true; }
  }

  /* ---------- Шапка: цвет по фону под ней ---------- */
  var header;
  function toneUnder(el) {
    var r = el.getBoundingClientRect();
    if (!r.width) return null;
    var stack = document.elementsFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    for (var i = 0; i < stack.length; i++) {
      var n = stack[i];
      if (header.contains(n)) continue;
      if (n.tagName === 'IMG' || n.tagName === 'VIDEO') return 'dark';
      var tone = n.closest('[data-tone]');
      return tone ? tone.getAttribute('data-tone') : 'light';
    }
    return 'light';
  }
  var toneQueued = false;
  function updateHeaderTone() {
    if (toneQueued) return; toneQueued = true;
    requestAnimationFrame(function () {
      toneQueued = false;
      /* Режим 'fade': светлая дымка под шапкой, когда она над контентом
         (не над главным фото и не над тёмным подвалом) — тогда весь текст шапки тёмный */
      var haze = false;
      if (headerMode === 'fade' && window.scrollY > 10) {
        var r = header.getBoundingClientRect(), x = r.left + r.width / 2, y = r.bottom - 10;
        var under = document.elementsFromPoint(x, y).filter(function (n) { return !header.contains(n); })[0];
        haze = !(under && under.closest('[data-tone="dark"]'));
      }
      header.classList.toggle('has-haze', haze);
      header.querySelectorAll('[data-tone-part]').forEach(function (part) {
        part.classList.toggle('on-dark', !haze && toneUnder(part) === 'dark');
      });
    });
  }

  /* ---------- Роутер ---------- */
  var LEGAL_IDS = LEGAL.docs.map(function (d) { return d.id; });
  function route(keepScroll) {
    var h = location.hash.replace(/^#/, '');
    var html, active = h.split('-')[0], anchor = null, title = '';
    if (h === '') html = home();
    else if (h === 'catalog') { html = catalog(null); title = t('nav_catalog'); }
    else if (h.indexOf('catalog-') === 0) { var c = catById(h.slice(8)); html = c ? catalog(c.id) : notFound(); title = c ? catFull(c) : ''; }
    else if (h.indexOf('item-') === 0) { var p = prodById(h.slice(5)); html = product(h.slice(5)); active = 'catalog'; title = p ? p.name : ''; }
    else if (h === 'masterclasses') { html = masterclasses(); title = t('nav_mk'); }
    else if (h.indexOf('mk-') === 0) { html = masterclasses(); active = 'masterclasses'; anchor = h; title = t('nav_mk'); }
    else if (h === 'portfolio') { html = portfolio(); title = t('nav_portfolio'); }
    else if (h === 'contacts') { html = contacts(); title = t('nav_contacts'); }
    else if (LEGAL_IDS.indexOf(h) !== -1) { html = legalPage(h); title = LEGAL.docs[LEGAL_IDS.indexOf(h)].title; }
    else if (h === 'process' || h === 'about') { html = home(); active = ''; anchor = h; }
    else html = notFound();
    document.body.classList.toggle('is-home', h === '' || h === 'process' || h === 'about');
    app.innerHTML = '<div class="view">' + html + '</div>';
    if (anchor && document.getElementById(anchor)) {
      var top = document.getElementById(anchor).getBoundingClientRect().top + window.scrollY - (h.indexOf('mk-') === 0 ? 90 : 0);
      window.scrollTo(0, top);
    } else if (keepScroll !== true) window.scrollTo(0, 0);
    document.title = (title ? title + ' — ' : '') + t('title_suffix');
    document.querySelectorAll('.nav a').forEach(function (a) { a.classList.toggle('is-active', a.getAttribute('href') === '#' + active); });
    closeMenu(); closeBooking(); closeCart(); enhance(); updateHeaderTone(); updateTotop();
    if (header) { header.classList.remove('is-hidden'); lastY = window.scrollY; }
  }

  /* ---------- Каркас ---------- */
  function shell() {
    document.documentElement.lang = lang;
    document.getElementById('totop').setAttribute('aria-label', t('to_top'));
    var navL = '<a href="#catalog">' + t('nav_catalog') + '</a><a href="#masterclasses">' + t('nav_mk') + '</a>';
    var navR = '<a href="#portfolio">' + t('nav_portfolio') + '</a><a href="#contacts">' + t('nav_contacts') + '</a>';
    header = document.getElementById('header');
    header.innerHTML =
      '<div class="wrap header__inner"><nav class="nav" data-tone-part>' + navL + '</nav>' +
      '<button class="burger" aria-label="' + t('menu') + '" data-menu data-tone-part><span></span></button>' +
      '<div class="header__logo" data-tone-part>' + LOGO() + '</div>' +
      '<nav class="nav nav--right" data-tone-part>' + navR + '<button data-open-cart>' + t('cart') + ' <span class="cart-count"></span></button>' + LANG() + '</nav>' +
      '<div class="header__tools" data-tone-part>' + LANG() + '<button class="label" data-open-cart>' + t('cart') + ' <span class="cart-count"></span></button></div></div>';
    document.getElementById('menu').innerHTML =
      '<div class="mobile-menu__top">' + LOGO() + '<button class="close" data-menu-close>' + t('close') + '</button></div>' +
      '<nav><a href="#">' + t('nav_home') + '</a><a href="#catalog">' + t('nav_catalog') + '</a>' + cats().map(function (c) {
        return '<a href="#catalog-' + c.id + '" class="sub">' + catFull(c) + '</a>';
      }).join('') + '<a href="#masterclasses">' + t('nav_mk') + '</a><a href="#portfolio">' + t('nav_portfolio') + '</a><a href="#contacts">' + t('nav_contacts') + '</a></nav>' +
      '<div class="mobile-menu__lang">' + LANG() + '</div>';
    var footer = document.getElementById('footer'), s = LEGAL.seller;
    footer.setAttribute('data-tone', 'dark');
    footer.innerHTML =
      '<div class="wrap"><div class="footer__top"><div class="footer__brand">' + LOGO() +
      '<p>' + t('footer_about') + '</p></div>' +
      '<div><h4 class="label">' + t('footer_catalog') + '</h4><ul>' + cats().map(function (c) { return '<li><a href="#catalog-' + c.id + '">' + catShort(c) + '</a></li>'; }).join('') + '</ul></div>' +
      '<div><h4 class="label">' + t('footer_studio') + '</h4><ul><li><a href="#masterclasses">' + t('nav_mk') + '</a></li><li><a href="#portfolio">' + t('nav_portfolio') + '</a></li><li><a href="#about">' + t('nav_about') + '</a></li><li><a href="#process">' + t('nav_process') + '</a></li><li><a href="#contacts">' + t('nav_contacts') + '</a></li></ul>' +
      '<h4 class="label" style="margin-top:32px">' + t('footer_social') + '</h4><ul>' + S.brand.socials.map(function (x) { return '<li><a href="' + x.url + '" target="_blank" rel="noopener">' + socialName(x) + '</a></li>'; }).join('') + '</ul></div>' +
      '<div><h4 class="label">' + t('footer_legal') + '</h4><ul>' + LEGAL.docs.map(function (d) { return '<li><a href="#' + d.id + '">' + d.title + '</a></li>'; }).join('') + '</ul></div></div>' +
      '<div class="footer__bottom"><span>© ' + new Date().getFullYear() + ' ' + t('copyright') + '</span>' +
      '<span>' + s.name + ', ' + (lang === 'en' ? 'Tax ID (INN) ' : 'ИНН ') + s.inn + '</span><span>' + studio() + '</span></div></div>';
    updateCount();
  }
  function closeMenu() { document.getElementById('menu').hidden = true; }

  function setLang(l) {
    if (l === lang) return;
    lang = l; save('iu-lang', l);
    var bookingOpen = !document.getElementById('booking').hidden, cartOpen = !document.getElementById('drawer').hidden;
    shell(); route(true);
    if (cartOpen) openCart();
    if (bookingOpen) closeBooking();
    if (!document.getElementById('cookie').hidden) renderCookie();
  }

  /* ---------- События ---------- */
  document.addEventListener('click', function (e) {
    var el = e.target.closest('[data-add],[data-remove],[data-open-cart],[data-close-cart],[data-menu],[data-menu-close],[data-zoom],#overlay,[data-lightbox-close],[data-book],[data-close-booking],[data-sound],[data-lang],[data-cookie-ok]');
    if (!el) {
      if (e.target.id === 'booking') closeBooking();
      return;
    }
    if (el.dataset.add) { addToCart(el.dataset.add); route(true); }
    else if (el.dataset.remove) { cart = cart.filter(function (k) { return k !== el.dataset.remove; }); saveCart(); renderCart(); }
    else if (el.dataset.book) { openBooking(el.dataset.book); }
    else if (el.dataset.lang) { setLang(el.dataset.lang); }
    else if (el.hasAttribute('data-cookie-ok')) { save('iu-cookie', 'ok'); document.getElementById('cookie').hidden = true; }
    else if (el.hasAttribute('data-close-booking')) { closeBooking(); }
    else if (el.hasAttribute('data-sound')) {
      var v = el.parentNode.querySelector('video'); v.muted = !v.muted; if (v.paused) v.play();
      el.textContent = v.muted ? t('sound_off') : t('sound_on'); el.setAttribute('aria-pressed', String(!v.muted));
    }
    else if (el.hasAttribute('data-open-cart')) { e.preventDefault(); openCart(); }
    else if (el.hasAttribute('data-close-cart') || el.id === 'overlay') { closeCart(); }
    else if (el.hasAttribute('data-menu')) { document.getElementById('menu').hidden = false; }
    else if (el.hasAttribute('data-menu-close')) { closeMenu(); }
    else if (el.hasAttribute('data-zoom')) {
      var lb = document.getElementById('lightbox'); lb.querySelector('img').src = el.src; lb.hidden = false;
    } else if (el.hasAttribute('data-lightbox-close')) { document.getElementById('lightbox').hidden = true; }
  });
  document.getElementById('lightbox').addEventListener('click', function () { this.hidden = true; });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { closeCart(); closeMenu(); closeBooking(); document.getElementById('lightbox').hidden = true; } });

  function consentOk(f, errEl) {
    var box = f.querySelector('[name="consent"]');
    if (box.checked) return true;
    errEl.textContent = t('consent_need'); errEl.hidden = false;
    box.closest('.consent').classList.add('is-error');
    return false;
  }
  document.addEventListener('change', function (e) {
    if (e.target.name === 'consent' && e.target.checked) {
      e.target.closest('.consent').classList.remove('is-error');
      var err = e.target.form.querySelector('.form-error'); if (err) err.hidden = true;
    }
  });
  document.addEventListener('submit', function (e) {
    var f = e.target;
    if (f.id === 'order-form') {
      e.preventDefault();
      var ok = true, err = f.querySelector('#f-error');
      err.hidden = true;
      ['f-name', 'f-contact'].forEach(function (id) { var el = f.querySelector('#' + id); var bad = !el.value.trim(); el.style.borderColor = bad ? 'var(--madder)' : ''; if (bad) ok = false; });
      if (!ok) { err.textContent = t('order_need'); err.hidden = false; return; }
      if (!consentOk(f, err)) return;
      cart = []; saveCart(); closeCart(); route(true);
      toast(t('order_ok'));
    } else if (f.id === 'booking-form') {
      e.preventDefault();
      var fd = new FormData(f), berr = f.querySelector('#b-error'), need = t('b_need_items'), miss = [];
      if (!fd.get('date')) miss.push(need[0]);
      if (!fd.get('time')) miss.push(need[1]);
      if (!String(fd.get('name') || '').trim()) miss.push(need[2]);
      if (!String(fd.get('contact') || '').trim()) miss.push(need[3]);
      if (miss.length) { berr.textContent = t('b_need') + ' ' + miss.join(', ') + '.'; berr.hidden = false; return; }
      if (!consentOk(f, berr)) return;
      var sel = f.querySelector('#b-mk');
      f.parentNode.innerHTML = '<div class="drawer__head"><h2>' + t('booked_h') + '</h2><button class="close" data-close-booking>' + t('close') + '</button></div>' +
        '<div class="booked"><p class="label muted">' + esc(sel.options[sel.selectedIndex].text) + '</p>' +
        '<p class="booked__when">' + esc(fd.get('date')) + ', ' + esc(fd.get('time')) + '</p><p class="muted">' + esc(fd.get('format')) +
        '. ' + t('booked_p') + '</p><p class="note">' + t('booked_demo') + '</p>' +
        '<button class="btn" data-close-booking>' + t('done') + '</button></div>';
    }
  });
  /* Шапка: режим 'hide' — прячется при прокрутке вниз, появляется при прокрутке вверх */
  var lastY = window.scrollY;
  function updateHeaderHide() {
    if (headerMode !== 'hide') return;
    var y = window.scrollY, dy = y - lastY;
    if (y < 120 || dy < -6) header.classList.remove('is-hidden');
    else if (dy > 6) header.classList.add('is-hidden');
    if (Math.abs(dy) > 6 || y < 120) lastY = y;
  }
  window.addEventListener('scroll', updateHeaderHide, { passive: true });

  /* Кнопка «наверх»: появляется после ~1,5 экрана прокрутки */
  var totop = document.getElementById('totop');
  function updateTotop() { totop.classList.toggle('is-visible', window.scrollY > window.innerHeight * 1.5); }
  totop.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' }); });
  window.addEventListener('scroll', updateTotop, { passive: true });
  window.addEventListener('scroll', updateHeaderTone, { passive: true });
  window.addEventListener('resize', updateHeaderTone);
  window.addEventListener('load', updateHeaderTone);
  window.addEventListener('hashchange', function () { route(); });

  /* ---------- Прелоадер ---------- */
  (function preloader() {
    var pre = document.getElementById('preloader'); if (!pre) return;
    var minTime = reduceMotion ? 0 : 2600, start = performance.now();
    function done() {
      setTimeout(function () {
        pre.classList.add('is-done');
        setTimeout(function () { pre.hidden = true; updateHeaderTone(); }, 900);
      }, Math.max(0, minTime - (performance.now() - start)));
    }
    if (document.readyState === 'complete') done(); else window.addEventListener('load', done);
    setTimeout(function () { pre.classList.add('is-done'); }, 6000);
  })();

  /* Временный переключатель вариантов шапки (для выбора с заказчицей) */
  function renderHeaderDemo() {
    if (!S.settings.headerDemo) return;
    var box = document.getElementById('header-demo') || document.body.appendChild(Object.assign(document.createElement('div'), { id: 'header-demo', className: 'header-demo' }));
    var names = { static: '1. Исходная', hide: '2. Прячется', fade: '3. Дымка' };
    box.innerHTML = '<span class="label">Вариант шапки</span><div>' + HEADER_MODES.map(function (m) {
      return '<button data-header-mode="' + m + '" aria-pressed="' + (m === headerMode) + '"' + (m === headerMode ? ' class="is-active"' : '') + '>' + names[m] + '</button>';
    }).join('') + '</div>';
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-header-mode]'); if (!b) return;
    headerMode = b.dataset.headerMode;
    try { localStorage.setItem('iu-header-demo', headerMode); } catch (err) { /* без хранилища */ }
    header.classList.remove('is-hidden', 'has-haze'); lastY = window.scrollY;
    renderHeaderDemo(); updateHeaderTone();
  });

  shell(); route(); renderCookie();
  renderHeaderDemo();
})();
