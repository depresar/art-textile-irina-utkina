(function () {
  'use strict';
  var S = window.SITE;
  var app = document.getElementById('app');
  var IMG = function (name) { return 'assets/img/products/' + name + '.jpg'; };
  var rub = function (n) { return n.toLocaleString('ru-RU').replace(/ |,/g, ' ') + ' ₽'; };
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var catById = function (id) { return S.categories.find(function (c) { return c.id === id; }); };
  var prodById = function (id) { return S.products.find(function (p) { return p.id === id; }); };
  var mkById = function (id) { return S.masterclasses.find(function (m) { return m.id === id; }); };

  /* Монограмма IU: тонкая засечная I и U, правая ножка U вырастает в стебель с листом */
  var MONO = '<svg class="logo__mono" viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true">' +
    '<path d="M17 14v36M12.5 14h9M12.5 50h9"/>' +
    '<path d="M29 14v22a10.5 10.5 0 0 0 21 0V8"/><path d="M24.5 14h9"/>' +
    '<path d="M50 8c0-3 3.2-5.6 7-6-0.3 4-3.2 6.6-7 6z" fill="currentColor" stroke="none"/>' +
    '</svg>';
  var LOGO = function () {
    return '<a class="logo" href="#" aria-label="Ирина Уткина — главная">' + MONO +
      '<span class="logo__word">' + S.brand.latin + '</span>' +
      '<span class="logo__sub">арт текстиль</span></a>';
  };

  /* ---------- Корзина (хранится в браузере посетителя) ---------- */
  var cart = [];
  try { cart = JSON.parse(localStorage.getItem('iu-cart') || '[]'); } catch (e) { cart = []; }
  function saveCart() { try { localStorage.setItem('iu-cart', JSON.stringify(cart)); } catch (e) { /* без хранилища */ } updateCount(); }
  function itemInfo(key) {
    var parts = key.split(':');
    if (parts[0] === 'p') { var p = prodById(parts[1]); return p && { title: p.name, sub: p.kind + ', ' + catById(p.category).size, price: p.price, img: IMG(p.images[0]) }; }
    var m = mkById(parts[1]); return m && { title: m.name, sub: m.type + ' · ' + m.format, price: m.price, img: m.cover };
  }
  function inCart(key) { return cart.indexOf(key) !== -1; }
  function addToCart(key) { if (!inCart(key)) { cart.push(key); saveCart(); } openCart(); }
  function updateCount() { document.querySelectorAll('.cart-count').forEach(function (el) { el.textContent = cart.length ? '(' + cart.length + ')' : ''; }); }

  var toastTimer;
  function toast(msg) {
    var t = document.getElementById('toast'); t.textContent = msg; t.hidden = false;
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { t.hidden = true; }, 3200);
  }

  function renderCart() {
    var d = document.getElementById('drawer');
    var items = cart.map(function (k) { return [k, itemInfo(k)]; }).filter(function (x) { return x[1]; });
    var total = items.reduce(function (s, x) { return s + x[1].price; }, 0);
    d.innerHTML =
      '<div class="drawer__head"><h2>Корзина</h2><button class="close" data-close-cart>Закрыть</button></div>' +
      (items.length ? items.map(function (x) {
        var i = x[1];
        return '<div class="line"><img src="' + i.img + '" alt=""><div><h3>' + esc(i.title) + '</h3><p>' + esc(i.sub) + '</p></div>' +
          '<div style="display:grid;gap:8px;justify-items:end"><span class="price">' + rub(i.price) + '</span><button data-remove="' + x[0] + '">Удалить</button></div></div>';
      }).join('') +
        '<div class="total"><span class="label">Итого</span><span class="price" style="font-size:20px">' + rub(total) + '</span></div>' +
        '<form class="form" id="order-form" novalidate>' +
        '<p class="label">Оформить заказ</p>' +
        '<div class="field"><label for="f-name">Имя</label><input id="f-name" name="name" required autocomplete="name"></div>' +
        '<div class="field"><label for="f-contact">Телефон или Telegram</label><input id="f-contact" name="contact" required autocomplete="tel"></div>' +
        '<div class="field"><label for="f-city">Город доставки</label><input id="f-city" name="city" autocomplete="address-level2"></div>' +
        '<div class="field"><label for="f-msg">Комментарий</label><textarea id="f-msg" name="msg" rows="3"></textarea></div>' +
        '<button class="btn" type="submit">Отправить заявку</button>' +
        '<p class="note">Ирина свяжется с вами, подтвердит наличие и стоимость доставки. Каждое изделие в единственном экземпляре.</p>' +
        '<p class="note">Демо-версия: заявки пока никуда не отправляются.</p>' +
        '</form>'
        : '<div class="empty" style="padding-top:24px"><p>В корзине пока пусто.</p><a class="link" href="#catalog" data-close-cart>Перейти в каталог</a></div>');
  }
  function openCart() { renderCart(); document.getElementById('drawer').hidden = false; document.getElementById('overlay').hidden = false; }
  function closeCart() { document.getElementById('drawer').hidden = true; document.getElementById('overlay').hidden = true; }

  /* ---------- Общие блоки ---------- */
  function card(p) {
    var c = catById(p.category);
    return '<a class="card" href="#item-' + p.id + '">' +
      '<div class="card__img"><span class="card__badge">1 экземпляр</span>' +
      '<img src="' + IMG(p.images[0]) + '" alt="' + esc(p.name) + '" loading="lazy">' +
      '<img src="' + IMG(p.hover) + '" alt="" loading="lazy"></div>' +
      '<div class="card__body"><span class="label card__kind">' + esc(p.kind) + ' · ' + c.size + '</span>' +
      '<span class="card__name">' + esc(p.name) + '</span>' +
      '<span class="card__dyes">' + esc(p.dyes.join(', ')) + '</span>' +
      '<div class="card__row"><span class="price">' + rub(p.price) + '</span><span class="link" style="font-size:10px">Подробнее</span></div></div></a>';
  }
  function catCount(id) { return S.products.filter(function (p) { return p.category === id; }).length; }

  /* ---------- Виды ---------- */
  function home() {
    return '<section class="hero">' +
      '<img src="' + IMG('p3-4') + '" alt="Шёлковый платок, окрашенный листьями каштана">' +
      '<img src="' + IMG('p5-1') + '" alt="Шёлковый платок с отпечатками листьев клёна">' +
      '<div class="hero__text"><span class="label">Экопринт · натуральные красители</span>' +
      '<h1>Шёлк, который <em>расписала природа</em></h1>' +
      '<a class="link" href="#catalog">Смотреть коллекцию</a></div></section>' +

      '<section class="section"><div class="wrap manifesto">' +
      '<span class="label muted">Арт текстиль Ирины Уткиной</span>' +
      '<p class="big">Мои работы — результат содружества природы и человека. Все принты выполнены настоящими листьями и травами, а оттенки получены из <em>отваров и корней растений</em>.</p>' +
      '<p class="small">Структура отпечатков и глубина оттенков захватывают внимание и поражают воображение. Каждый платок всегда в единственном экземпляре. На шёлке натуральные красители выглядят особенно эффектно и при разном освещении способны менять свои оттенки.</p>' +
      '</div></section>' +

      '<section class="section section--white"><div class="wrap">' +
      '<div class="section-head"><div><span class="label">Каталог</span><h2>Коллекции</h2></div><a class="link" href="#catalog">Все изделия</a></div>' +
      '<div class="cats">' + S.categories.map(function (c) {
        return '<a class="cat" href="#catalog-' + c.id + '"><div class="cat__img"><img src="' + c.cover + '" alt="" loading="lazy"></div>' +
          '<div class="cat__meta"><span class="cat__title">' + c.title + '</span><span class="cat__size">' + c.size + '</span></div></a>';
      }).join('') + '</div></div></section>' +

      '<section class="section"><div class="wrap">' +
      '<div class="section-head"><div><span class="label">В наличии</span><h2>Новые работы</h2></div><a class="link" href="#catalog">Весь каталог</a></div>' +
      '<div class="grid">' + S.products.map(card).join('') + '</div></div></section>' +

      '<section class="section section--white" id="process"><div class="wrap">' +
      '<div class="section-head"><div><span class="label">Мастерская</span><h2>Как рождается платок</h2></div>' +
      '<p class="muted" style="max-width:420px">Листья раскладываются на шёлк, ткань сворачивается и томится в отварах растений. Каждый отпечаток неповторим.</p></div>' +
      '<div class="video"><img src="assets/img/craft/mk-4.jpg" alt="" loading="lazy"><div class="video__inner">' +
      '<span class="play"><svg viewBox="0 0 20 20" fill="currentColor"><path d="M4 2l14 8-14 8z"/></svg></span>' +
      '<h3>Видео процесса</h3><span class="label">Скоро здесь</span></div></div></div></section>' +

      '<section class="section section--sky"><div class="wrap">' +
      '<div class="section-head"><div><span class="label">Палитра природы</span><h2>Из чего рождается цвет</h2></div>' +
      '<p class="muted" style="max-width:420px">Никакой химии: только растения и протравы. Оттенки на кружках примерные — на шёлке они живут и меняются от света.</p></div>' +
      '<div class="dyes">' + S.dyes.map(function (d) {
        return '<div class="dye"><span class="dye__swatch" style="background:' + d.color + '"></span><div><h3>' + d.name + '</h3><p>' + d.part + '</p><span class="label">' + d.gives + '</span></div></div>';
      }).join('') + '</div></div></section>' +

      '<section class="section"><div class="wrap">' +
      '<div class="section-head"><div><span class="label">Обучение</span><h2>Мастер-классы</h2></div><a class="link" href="#masterclasses">Все мастер-классы</a></div>' +
      '<div class="mk-row">' + S.masterclasses.map(function (m) {
        return '<a class="mk-card" href="#masterclasses"><div class="mk-card__img"><img src="' + m.cover + '" alt="" loading="lazy"></div>' +
          '<div class="mk-card__body"><span class="label muted">' + m.type + ' · ' + m.format + '</span><h3>' + m.name + '</h3>' +
          '<p class="muted" style="font-size:14px">' + m.level + '</p><span class="spacer"></span>' +
          '<span class="price" style="font-size:18px">' + rub(m.price) + '</span><span class="link">Подробнее</span></div></a>';
      }).join('') + '</div></div></section>' +

      aboutBlock() + careBlock();
  }

  function aboutBlock() {
    return '<section class="section section--white" id="about"><div class="wrap about">' +
      '<div class="about__img"><img src="assets/img/craft/mk-3.jpg" alt="Отпечатки растений на шёлке" loading="lazy"></div>' +
      '<div class="about__text"><span class="label muted">О мастере</span><h2>Ирина Уткина</h2>' +
      '<p>Мастер по окрашиванию текстиля растениями. Совмещаю старинный способ окрашивания ткани отварами растений с экопринтом — созданием принтов из листьев и трав. Окрашиваю натуральный шёлк и шерсть, делаю платки, шарфы и палантины.</p>' +
      '<p class="muted">В работе использую не просто листья, а листья, выкопанные из-под снега, корни и кору растений. Создаю уникальные принты и оттенки, комбинируя разные растения. Провожу очные и онлайн мастер-классы, вместе с онлайн-школой рукоделия «Шкатулочка» веду бесплатные вебинары по окрашиванию.</p>' +
      '<div class="facts"><div><b>10+</b><span>лет окрашиваю растениями</span></div><div><b>1000+</b><span>учеников</span></div><div><b>30</b><span>стран мира</span></div></div>' +
      '<p class="muted" style="font-size:14px">' + S.brand.studio + '. Участница крафт-фестивалей в Москве, Санкт-Петербурге, Казани, Самаре и Архангельске.</p>' +
      '</div></div></section>';
  }

  function careBlock() {
    return '<section class="section"><div class="wrap care">' +
      '<div><span class="label muted">Материал</span><h3>Натуральный шёлк и шерсть</h3><p>Платки — 100% шёлк атлас. Палантины — шерсть 70% и шёлк 30%. Края подшиты на машинке московским швом.</p></div>' +
      '<div><span class="label muted">Стойкость</span><h3>Цвет закреплён протравами</h3><p>Красители закрепляются протравами на высокой температуре. При правильном уходе натуральные красители очень стойкие.</p></div>' +
      '<div><span class="label muted">Уход</span><h3>Бережная ручная стирка</h3><p>В слегка прохладной воде с нейтральным моющим средством.</p></div>' +
      '</div></section>';
  }

  function catalog(catId) {
    var list = catId ? S.products.filter(function (p) { return p.category === catId; }) : S.products;
    var c = catId && catById(catId);
    var tabs = '<a href="#catalog" class="' + (!catId ? 'is-active' : '') + '">Все<sup>' + S.products.length + '</sup></a>' +
      S.categories.map(function (x) {
        var n = catCount(x.id);
        var name = x.id === 'custom' ? 'Нестандартные' : x.title.replace('Шёлковые ', '') + ' ' + x.size.replace(' см', '');
        return '<a href="#catalog-' + x.id + '" class="' + (catId === x.id ? 'is-active' : '') + '">' + name + (n ? '<sup>' + n + '</sup>' : '') + '</a>';
      }).join('');
    var body = list.length ? '<div class="grid">' + list.map(card).join('') + '</div>' :
      '<div class="empty"><span class="label muted">' + c.material + '</span><h2>Новые работы скоро появятся</h2>' +
      '<p>Изделия этого размера Ирина создаёт небольшими сериями. Напишите, и она расскажет, что есть в мастерской сейчас, или сделает платок на заказ.</p>' +
      '<a class="btn btn--ghost" href="' + S.brand.socials[0].url + '" target="_blank" rel="noopener">Написать в Telegram</a></div>';
    return '<div class="wrap"><header class="page-head"><span class="label muted">' + (c ? c.material : 'Готовые изделия') + '</span>' +
      '<h1>' + (c ? c.title + (c.id !== 'custom' ? ' <em style="font-style:italic">' + c.size + '</em>' : '') : 'Каталог') + '</h1>' +
      '<p>' + (c && c.id === 'custom' ? 'Большие и прямоугольные платки, изделия под ваш запрос.' : 'Каждое изделие существует в единственном экземпляре: повторить рисунок и оттенок невозможно.') + '</p></header>' +
      '<nav class="tabs" aria-label="Разделы каталога">' + tabs + '</nav>' + body + '</div><div style="height:var(--section)"></div>';
  }

  function product(id) {
    var p = prodById(id); if (!p) return notFound();
    var c = catById(p.category), k = 'p:' + p.id, pc = S.productCommon;
    var others = S.products.filter(function (x) { return x.id !== p.id; }).slice(0, 3);
    return '<div class="wrap"><nav class="crumbs label"><a href="#catalog">Каталог</a><span>/</span><a href="#catalog-' + c.id + '">' + c.title + ' ' + c.size + '</a></nav>' +
      '<div class="product"><div class="gallery">' + p.images.map(function (im, i) {
        return '<img src="' + IMG(im) + '" alt="' + esc(p.name) + ', фото ' + (i + 1) + '" data-zoom loading="' + (i < 2 ? 'eager' : 'lazy') + '">';
      }).join('') + '</div>' +
      '<aside class="info"><span class="label muted">' + esc(p.kind) + '</span><h1>' + esc(p.name) + '</h1>' +
      '<span class="price">' + rub(p.price) + '</span>' +
      '<span class="label unique">В единственном экземпляре</span>' +
      '<p>' + esc(p.text) + '</p>' +
      '<dl class="specs"><div><dt>Размер</dt><dd>' + c.size + '</dd></div><div><dt>Материал</dt><dd>' + pc.material + '</dd></div>' +
      '<div><dt>Красители</dt><dd>' + esc(p.dyes.join(', ')) + '</dd></div><div><dt>Края</dt><dd>Московский шов</dd></div></dl>' +
      (inCart(k) ? '<a class="btn btn--ghost" href="#" data-open-cart>Уже в корзине — оформить</a>' : '<button class="btn" data-add="' + k + '">Добавить в корзину</button>') +
      '<div><details><summary class="label">Уход</summary><p>' + pc.care + '</p></details>' +
      '<details><summary class="label">Доставка и оплата</summary><p>Ирина отправляет изделия из мастерской в Пензенской области по России и за рубеж. Способ и стоимость доставки согласовываются после заявки.</p></details>' +
      '<details><summary class="label">Почему цвет может отличаться</summary><p>На шёлке натуральные красители при разном освещении меняют свои оттенки, поэтому вживую платок может выглядеть немного иначе, чем на фото.</p></details></div>' +
      '</aside></div></div>' +
      '<section class="section section--white"><div class="wrap"><div class="section-head"><h2>Другие работы</h2><a class="link" href="#catalog">Весь каталог</a></div>' +
      '<div class="grid">' + others.map(card).join('') + '</div></div></section>';
  }

  function masterclasses() {
    return '<div class="wrap"><header class="page-head"><span class="label muted">Обучение экопринту</span><h1>Мастер-классы</h1>' +
      '<p>Авторские рецепты и приёмы окрашивания ткани растениями. Более 1000 учеников в 30 странах мира.</p></header>' +
      S.masterclasses.map(function (m) {
        var k = 'm:' + m.id;
        var media = (m.gallery.length ? m.gallery : [m.cover]).map(function (src) { return '<img src="' + src + '" alt="" data-zoom loading="lazy">'; }).join('');
        return '<article class="mk" id="mk-' + m.id + '"><div class="mk__media">' + media + '</div><div class="mk__body">' +
          '<span class="label muted">' + m.type + '</span><h2>' + m.name + '</h2>' +
          '<div class="mk__meta"><span class="chip">' + m.format + '</span><span class="chip">' + m.level + '</span>' +
          m.facts.map(function (f) { return '<span class="chip">' + f + '</span>'; }).join('') + '</div>' +
          '<p class="mk__lead">' + m.lead + '</p><p class="muted">' + m.audience + '</p>' +
          '<div><p class="label" style="margin-bottom:16px">' + (m.type === 'Конспект' ? 'В конспекте' : 'В мастер-классе') + '</p><div class="topics">' +
          m.topics.map(function (t) { return '<div><h3>' + t[0] + '</h3><p>' + t[1] + '</p></div>'; }).join('') + '</div></div>' +
          '<p class="muted">' + m.outro + '</p>' +
          '<div class="buy"><span class="price">' + rub(m.price) + '</span>' +
          (inCart(k) ? '<a class="btn btn--ghost" href="#" data-open-cart>Уже в корзине — оформить</a>' : '<button class="btn" data-add="' + k + '">Купить</button>') +
          '<a class="link" href="' + S.brand.socials[0].url + '" target="_blank" rel="noopener">Задать вопрос</a></div></div></article>';
      }).join('') +
      '<article class="mk"><div class="mk__media"><img src="' + IMG('p6-2') + '" alt="" loading="lazy"></div><div class="mk__body">' +
      '<span class="label muted">Очно</span><h2>Офлайн мастер-классы</h2>' +
      '<p class="mk__lead">Ирина проводила очные мастер-классы в Москве, Архангельской области и Ташкенте. Расписание ближайших встреч появится здесь.</p>' +
      '<div class="buy"><a class="btn btn--ghost" href="' + S.brand.socials[0].url + '" target="_blank" rel="noopener">Узнать о ближайших датах</a></div></div></article>' +
      '</div>';
  }

  function portfolio() {
    var imgs = [];
    S.products.forEach(function (p) { p.images.forEach(function (im) { imgs.push(IMG(im)); }); });
    S.masterclasses[1].gallery.forEach(function (g) { imgs.splice(Math.min(imgs.length, 5 + imgs.length % 7), 0, g); });
    return '<div class="wrap"><header class="page-head"><span class="label muted">Работы мастерской</span><h1>Портфолио</h1>' +
      '<p>Платки, фактуры и отпечатки. Нажмите на фото, чтобы рассмотреть ближе.</p></header>' +
      '<div class="masonry">' + imgs.map(function (s) { return '<img src="' + s + '" alt="" data-zoom loading="lazy">'; }).join('') + '</div></div>' +
      '<div style="height:var(--section)"></div>';
  }

  function contacts() {
    return '<div class="wrap"><header class="page-head"><span class="label muted">' + S.brand.studio + '</span><h1>Контакты</h1>' +
      '<p>Пишите, чтобы заказать платок, узнать о новых работах или задать вопрос о мастер-классах.</p></header>' +
      '<div class="contacts">' + S.brand.socials.map(function (s) {
        return '<a class="contact" href="' + s.url + '" target="_blank" rel="noopener"><span class="label muted">' + s.name + '</span><h3>' + s.handle + '</h3><p>' + s.url.replace('https://', '') + '</p></a>';
      }).join('') + '</div></div><div style="height:var(--section)"></div>' + aboutBlock();
  }

  function notFound() {
    return '<div class="wrap"><div class="empty" style="padding-block:120px"><h2>Страница не найдена</h2><a class="link" href="#">На главную</a></div></div>';
  }

  /* ---------- Роутер ---------- */
  var titles = { '': 'Арт текстиль Ирины Уткиной', catalog: 'Каталог', masterclasses: 'Мастер-классы', portfolio: 'Портфолио', contacts: 'Контакты' };
  function route(keepScroll) {
    var h = location.hash.replace(/^#/, '');
    var html, active = h.split('-')[0];
    if (h === '' ) html = home();
    else if (h === 'catalog') html = catalog(null);
    else if (h.indexOf('catalog-') === 0) html = catById(h.slice(8)) ? catalog(h.slice(8)) : notFound();
    else if (h.indexOf('item-') === 0) { html = product(h.slice(5)); active = 'catalog'; }
    else if (h === 'masterclasses') html = masterclasses();
    else if (h === 'portfolio') html = portfolio();
    else if (h === 'contacts') html = contacts();
    else if (h === 'process' || h === 'about') { if (!document.getElementById(h)) { app.innerHTML = '<div class="view">' + home() + '</div>'; } document.getElementById(h).scrollIntoView(); return; }
    else html = notFound();
    app.innerHTML = '<div class="view">' + html + '</div>';
    if (keepScroll !== true) window.scrollTo(0, 0);
    var p = h.indexOf('item-') === 0 && prodById(h.slice(5));
    document.title = (p ? p.name + ' — ' : (titles[active] && active ? titles[active] + ' — ' : '')) + 'Ирина Уткина';
    document.querySelectorAll('.nav a').forEach(function (a) { a.classList.toggle('is-active', a.getAttribute('href') === '#' + active); });
    closeMenu();
  }

  /* ---------- Каркас ---------- */
  function shell() {
    var navL = '<a href="#catalog">Каталог</a><a href="#masterclasses">Мастер-классы</a>';
    var navR = '<a href="#portfolio">Портфолио</a><a href="#contacts">Контакты</a>';
    document.getElementById('header').innerHTML =
      '<div class="wrap header__inner"><nav class="nav">' + navL + '</nav><button class="burger" aria-label="Меню" data-menu><span></span></button>' + LOGO() +
      '<nav class="nav nav--right">' + navR + '<button data-open-cart>Корзина <span class="cart-count"></span></button></nav>' +
      '<button class="label header__cart" data-open-cart>Корзина <span class="cart-count"></span></button></div>';
    document.getElementById('menu').innerHTML =
      '<div class="mobile-menu__top">' + LOGO() + '<button class="close" data-menu-close>Закрыть</button></div>' +
      '<nav><a href="#">Главная</a><a href="#catalog">Каталог</a>' + S.categories.map(function (c) {
        return '<a href="#catalog-' + c.id + '" style="font-size:20px;padding-left:16px">' + c.title + ' ' + (c.id === 'custom' ? '' : c.size) + '</a>';
      }).join('') + '<a href="#masterclasses">Мастер-классы</a><a href="#portfolio">Портфолио</a><a href="#contacts">Контакты</a></nav>';
    document.getElementById('footer').innerHTML =
      '<div class="wrap"><div class="footer__top"><div class="footer__brand">' + LOGO() +
      '<p>Платки, шарфы и палантины из натурального шёлка и шерсти, окрашенные листьями, травами и корнями растений. Каждое изделие в единственном экземпляре.</p></div>' +
      '<div><h4 class="label">Каталог</h4><ul>' + S.categories.map(function (c) { return '<li><a href="#catalog-' + c.id + '">' + (c.id === 'custom' ? c.title : c.title.replace('Шёлковые ', '') + ' ' + c.size) + '</a></li>'; }).join('') + '</ul></div>' +
      '<div><h4 class="label">Мастерская</h4><ul><li><a href="#masterclasses">Мастер-классы</a></li><li><a href="#portfolio">Портфолио</a></li><li><a href="#about">О мастере</a></li><li><a href="#process">Процесс</a></li><li><a href="#contacts">Контакты</a></li></ul></div>' +
      '<div><h4 class="label">Соцсети</h4><ul>' + S.brand.socials.map(function (s) { return '<li><a href="' + s.url + '" target="_blank" rel="noopener">' + s.name + '</a></li>'; }).join('') + '</ul></div></div>' +
      '<div class="footer__bottom"><span>© ' + new Date().getFullYear() + ' Арт текстиль Ирины Уткиной</span><span>' + S.brand.studio + '</span></div></div>';
  }
  function closeMenu() { document.getElementById('menu').hidden = true; }

  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-add],[data-remove],[data-open-cart],[data-close-cart],[data-menu],[data-menu-close],[data-zoom],#overlay,[data-lightbox-close]');
    if (!t) return;
    if (t.dataset.add) { addToCart(t.dataset.add); route(true); }
    else if (t.dataset.remove) { cart = cart.filter(function (k) { return k !== t.dataset.remove; }); saveCart(); renderCart(); }
    else if (t.hasAttribute('data-open-cart')) { e.preventDefault(); openCart(); }
    else if (t.hasAttribute('data-close-cart') || t.id === 'overlay') { closeCart(); }
    else if (t.hasAttribute('data-menu')) { document.getElementById('menu').hidden = false; }
    else if (t.hasAttribute('data-menu-close')) { closeMenu(); }
    else if (t.hasAttribute('data-zoom')) {
      var lb = document.getElementById('lightbox'); lb.querySelector('img').src = t.src; lb.hidden = false;
    } else if (t.hasAttribute('data-lightbox-close')) { document.getElementById('lightbox').hidden = true; }
  });
  document.getElementById('lightbox').addEventListener('click', function () { this.hidden = true; });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { closeCart(); closeMenu(); document.getElementById('lightbox').hidden = true; } });
  document.addEventListener('submit', function (e) {
    if (e.target.id !== 'order-form') return;
    e.preventDefault();
    var f = e.target, ok = true;
    ['f-name', 'f-contact'].forEach(function (id) { var el = f.querySelector('#' + id); var bad = !el.value.trim(); el.style.borderColor = bad ? 'var(--madder)' : ''; if (bad) ok = false; });
    if (!ok) { toast('Укажите имя и телефон или Telegram'); return; }
    cart = []; saveCart(); closeCart(); route(true);
    toast('Заявка принята (демо). Ирина свяжется с вами');
  });
  window.addEventListener('scroll', function () { document.getElementById('header').classList.toggle('is-scrolled', window.scrollY > 8); }, { passive: true });
  window.addEventListener('hashchange', function () { route(); });

  shell(); updateCount(); route();
})();
