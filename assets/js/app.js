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
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var TG = S.brand.socials[0].url;

  /* Короткое имя раздела для вкладок, меню и подвала */
  function catShort(c) {
    if (c.id === 'custom') return 'Нестандартные';
    if (c.id === 'top') return 'Топы';
    return c.title.replace('Шёлковые ', '') + ' ' + c.size.replace(' см', '');
  }
  function catFull(c) { return c.noSize ? c.title : c.title + ' ' + c.size; }

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
    var t = document.getElementById('toast'); t.textContent = msg; t.hidden = false;
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { t.hidden = true; }, 3600);
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

  /* ---------- Запись на мастер-класс ---------- */
  var WD = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'];
  var MONTHS = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
  function demoDates() {
    /* ближайшие выходные — демонстрационное расписание */
    var out = [], d = new Date(); d.setHours(12, 0, 0, 0);
    while (out.length < 8) { d.setDate(d.getDate() + 1); if (d.getDay() === 6 || d.getDay() === 0) out.push(new Date(d)); }
    return out;
  }
  function openBooking(id) {
    var m = document.getElementById('booking');
    var options = S.masterclasses.map(function (x) { return [x.id, x.type + ' «' + x.name + '»']; }).concat([['offline', 'Очный мастер-класс']]);
    m.innerHTML = '<div class="modal__box" role="dialog" aria-modal="true" aria-labelledby="b-title">' +
      '<div class="drawer__head"><h2 id="b-title">Запись на мастер-класс</h2><button class="close" data-close-booking>Закрыть</button></div>' +
      '<form class="form" id="booking-form" novalidate>' +
      '<div class="field"><label for="b-mk">Мастер-класс</label><select id="b-mk" name="mk">' +
      options.map(function (o) { return '<option value="' + o[0] + '"' + (o[0] === id ? ' selected' : '') + '>' + esc(o[1]) + '</option>'; }).join('') + '</select></div>' +
      '<fieldset class="field"><legend>Формат</legend><div class="chips">' +
      '<label class="pick"><input type="radio" name="format" value="Онлайн"' + (id === 'offline' ? '' : ' checked') + '><span>Онлайн</span></label>' +
      '<label class="pick"><input type="radio" name="format" value="Очно"' + (id === 'offline' ? ' checked' : '') + '><span>Очно</span></label></div></fieldset>' +
      '<fieldset class="field"><legend>Дата</legend><div class="chips chips--dates">' +
      demoDates().map(function (d, i) {
        var v = d.getDate() + ' ' + MONTHS[d.getMonth()];
        return '<label class="pick"><input type="radio" name="date" value="' + WD[d.getDay()] + ', ' + v + '" id="b-date-' + i + '"><span><small>' + WD[d.getDay()] + '</small>' + v + '</span></label>';
      }).join('') + '</div></fieldset>' +
      '<fieldset class="field"><legend>Время</legend><div class="chips">' +
      ['11:00', '14:00', '17:00'].map(function (t) { return '<label class="pick"><input type="radio" name="time" value="' + t + '"><span>' + t + '</span></label>'; }).join('') + '</div></fieldset>' +
      '<div class="field"><label for="b-name">Имя</label><input id="b-name" name="name" autocomplete="name"></div>' +
      '<div class="field"><label for="b-contact">Телефон или Telegram</label><input id="b-contact" name="contact" autocomplete="tel"></div>' +
      '<p class="form-error" id="b-error" hidden></p>' +
      '<button class="btn" type="submit">Записаться</button>' +
      '<p class="note">Даты и время пока демонстрационные: реальное расписание задаёт Ирина. Заявки в демо-версии никуда не отправляются.</p>' +
      '</form></div>';
    m.hidden = false;
  }
  function closeBooking() { document.getElementById('booking').hidden = true; }

  /* ---------- Общие блоки ---------- */
  function card(p) {
    var c = catById(p.category);
    return '<a class="card" href="#item-' + p.id + '">' +
      '<div class="card__img"><span class="card__badge">1 экземпляр</span>' +
      '<img src="' + IMG(p.images[0]) + '" alt="' + esc(p.name) + '" loading="lazy">' +
      '<img src="' + IMG(p.hover) + '" alt="" loading="lazy"></div>' +
      '<div class="card__body"><span class="label card__kind">' + esc(p.kind) + (c.noSize ? '' : ' · ' + c.size) + '</span>' +
      '<span class="card__name">' + esc(p.name) + '</span>' +
      '<span class="card__dyes">' + esc(p.dyes.join(', ')) + '</span>' +
      '<div class="card__row"><span class="price">' + rub(p.price) + '</span><span class="link" style="font-size:10px">Подробнее</span></div></div></a>';
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
    return '<section class="hero" data-tone="dark">' +
      '<img src="' + IMG('p3-4') + '" alt="Шёлковый платок, окрашенный листьями каштана">' +
      '<img src="' + IMG('p5-1') + '" alt="Шёлковый платок с отпечатками листьев клёна">' +
      '<div class="hero__text"><span class="label">Экопринт · натуральные красители</span>' +
      '<h1>Шёлк, который <em>расписала природа</em></h1>' +
      '<a class="link" href="#catalog">Смотреть коллекцию</a></div></section>' +

      '<section class="section"><div class="wrap manifesto">' +
      '<span class="label muted">Арт текстиль Ирины Уткиной</span>' +
      '<p class="big fog" data-fog>' + fog([
        ['Мои работы — результат содружества природы и человека. Все принты выполнены настоящими листьями и травами, а оттенки получены из'],
        ['отваров и корней растений.', true]
      ]) + '</p>' +
      '<p class="small">Структура отпечатков и глубина оттенков захватывают внимание и поражают воображение. Каждый платок всегда в единственном экземпляре. На шёлке натуральные красители выглядят особенно эффектно и при разном освещении способны менять свои оттенки.</p>' +
      '</div></section>' +

      '<section class="section section--white"><div class="wrap">' +
      '<div class="section-head"><div><span class="label">Каталог</span><h2>Разделы</h2></div><a class="link" href="#catalog">Все изделия</a></div>' +
      '<div class="cats">' + S.categories.map(function (c) {
        var n = catCount(c.id);
        return '<a class="cat" href="#catalog-' + c.id + '"><div class="cat__img"><img src="' + c.cover + '" alt="" loading="lazy"></div>' +
          '<div class="cat__meta"><span class="cat__title">' + c.title + '</span><span class="cat__size">' + c.size + '</span></div>' +
          '<span class="cat__count">' + (n ? n + ' ' + plural(n, ['работа', 'работы', 'работ']) + ' в наличии' : 'Под заказ') + '</span></a>';
      }).join('') + '</div></div></section>' +

      '<section class="section"><div class="wrap">' +
      '<div class="section-head"><div><span class="label">В наличии</span><h2>Новые работы</h2></div><a class="link" href="#catalog">Весь каталог</a></div>' +
      '<div class="grid">' + S.products.slice().reverse().slice(0, 6).map(card).join('') + '</div></div></section>' +

      processBlock() +

      '<section class="section section--sky"><div class="wrap">' +
      '<div class="section-head"><div><span class="label">Палитра природы</span><h2>Из чего рождается цвет</h2></div>' +
      '<p class="muted" style="max-width:420px">Никакой химии: только растения и протравы. Оттенки на кружках примерные — на шёлке они живут и меняются от света.</p></div>' +
      '<div class="dyes">' + S.dyes.map(function (d) {
        return '<div class="dye"><span class="dye__swatch" style="background:' + d.color + '"></span><div><h3>' + d.name + '</h3><p>' + d.part + '</p><span class="label">' + d.gives + '</span></div></div>';
      }).join('') + '</div></div></section>' +

      '<section class="section"><div class="wrap">' +
      '<div class="section-head"><div><span class="label">Обучение</span><h2>Мастер-классы</h2></div><a class="link" href="#masterclasses">Все мастер-классы</a></div>' +
      '<div class="mk-row">' + S.masterclasses.map(function (m) {
        return '<article class="mk-card"><a class="mk-card__img" href="#mk-' + m.id + '"><img src="' + m.cover + '" alt="" loading="lazy"></a>' +
          '<div class="mk-card__body"><span class="label muted">' + m.type + ' · ' + m.format + '</span><h3><a href="#mk-' + m.id + '">' + m.name + '</a></h3>' +
          '<p class="muted" style="font-size:14px">' + m.level + '</p><span class="spacer"></span>' +
          '<span class="price" style="font-size:18px">' + rub(m.price) + '</span>' +
          '<div class="mk-card__actions"><button class="btn" data-book="' + m.id + '">Записаться</button><a class="link" href="#mk-' + m.id + '">Подробнее</a></div></div></article>';
      }).join('') + '</div></div></section>' +

      aboutBlock();
  }

  function plural(n, f) { var a = n % 10, b = n % 100; return a === 1 && b !== 11 ? f[0] : a >= 2 && a <= 4 && (b < 10 || b >= 20) ? f[1] : f[2]; }

  function processBlock() {
    return '<section class="section section--white" id="process"><div class="wrap process">' +
      '<div class="process__video"><video src="assets/video/process.mp4" poster="assets/video/process-poster.jpg" autoplay muted loop playsinline preload="metadata" aria-label="Процесс создания принта: растения на ткани"></video>' +
      '<button class="sound" data-sound aria-pressed="false">Звук: выкл</button></div>' +
      '<div class="process__text"><span class="label muted">Мастерская</span><h2>Как рождается платок</h2>' +
      '<p class="process__lead">Листья, травы и сухоцветы раскладываются на ткань, полотно сворачивается и томится в отварах растений. Каждый отпечаток неповторим.</p>' +
      '<div class="care">' +
      '<div><span class="label muted">Материал</span><h3>Натуральный шёлк и шерсть</h3><p>Платки и топы — 100% шёлк атлас. Палантины — шерсть 70% и шёлк 30%. Края подшиты на машинке московским швом.</p></div>' +
      '<div><span class="label muted">Стойкость</span><h3>Цвет закреплён протравами</h3><p>Красители закрепляются протравами на высокой температуре. При правильном уходе натуральные красители очень стойкие.</p></div>' +
      '<div><span class="label muted">Уход</span><h3>Бережная ручная стирка</h3><p>В слегка прохладной воде с нейтральным моющим средством.</p></div>' +
      '</div><a class="link" href="#catalog">Смотреть изделия</a></div></div></section>';
  }

  function aboutBlock() {
    return '<section class="section section--white" id="about"><div class="wrap about">' +
      '<div class="about__img"><img src="' + IMG('p7-1') + '" alt="Ирина Уткина" loading="lazy"></div>' +
      '<div class="about__text"><span class="label muted">О мастере</span><h2>Ирина Уткина</h2>' +
      '<p>Мастер по окрашиванию текстиля растениями. Совмещаю старинный способ окрашивания ткани отварами растений с экопринтом — созданием принтов из листьев и трав. Окрашиваю натуральный шёлк и шерсть, делаю платки, шарфы, палантины и одежду.</p>' +
      '<p class="muted">В работе использую не просто листья, а листья, выкопанные из-под снега, корни и кору растений. Создаю уникальные принты и оттенки, комбинируя разные растения. Провожу очные и онлайн мастер-классы, вместе с онлайн-школой рукоделия «Шкатулочка» веду бесплатные вебинары по окрашиванию.</p>' +
      '<div class="facts">' +
      '<div><b data-count="10" data-suffix="+">10+</b><span>лет окрашиваю растениями</span></div>' +
      '<div><b data-count="1000" data-suffix="+">1 000+</b><span>учеников</span></div>' +
      '<div><b data-count="30">30</b><span>стран мира</span></div></div>' +
      '<p class="muted" style="font-size:14px">' + S.brand.studio + '. Участница крафт-фестивалей в Москве, Санкт-Петербурге, Казани, Самаре и Архангельске.</p>' +
      '</div></div></section>';
  }

  function catalog(catId) {
    var list = catId ? S.products.filter(function (p) { return p.category === catId; }) : S.products;
    var c = catId && catById(catId);
    var tabs = '<a href="#catalog" class="' + (!catId ? 'is-active' : '') + '">Все<sup>' + S.products.length + '</sup></a>' +
      S.categories.map(function (x) {
        var n = catCount(x.id);
        return '<a href="#catalog-' + x.id + '" class="' + (catId === x.id ? 'is-active' : '') + '">' + catShort(x) + (n ? '<sup>' + n + '</sup>' : '') + '</a>';
      }).join('');
    var body = list.length ? '<div class="grid">' + list.map(card).join('') + '</div>' :
      '<div class="empty"><span class="label muted">' + c.material + '</span><h2>Новые работы скоро появятся</h2>' +
      '<p>Изделия этого размера Ирина создаёт небольшими сериями. Напишите, и она расскажет, что есть в мастерской сейчас, или сделает платок на заказ.</p>' +
      '<a class="btn btn--ghost" href="' + TG + '" target="_blank" rel="noopener">Написать в Telegram</a></div>';
    return '<div class="wrap"><header class="page-head"><span class="label muted">' + (c ? c.material : 'Готовые изделия') + '</span>' +
      '<h1>' + (c ? c.title + (c.noSize ? '' : ' <em style="font-style:italic">' + c.size + '</em>') : 'Каталог') + '</h1>' +
      '<p>' + (c && c.id === 'custom' ? 'Большие и прямоугольные платки, изделия под ваш запрос.' : 'Каждое изделие существует в единственном экземпляре: повторить рисунок и оттенок невозможно.') + '</p></header>' +
      '<nav class="tabs" aria-label="Разделы каталога">' + tabs + '</nav>' + body + '</div><div style="height:var(--section)"></div>';
  }

  function product(id) {
    var p = prodById(id); if (!p) return notFound();
    var c = catById(p.category), k = 'p:' + p.id, pc = S.productCommon;
    var others = S.products.filter(function (x) { return x.id !== p.id; }).slice(0, 3);
    var size = p.size || (c.noSize ? 'Уточняйте у мастера' : c.size);
    return '<div class="wrap"><nav class="crumbs label"><a href="#catalog">Каталог</a><span>/</span><a href="#catalog-' + c.id + '">' + catFull(c) + '</a></nav>' +
      '<div class="product"><div class="gallery">' + p.images.map(function (im, i) {
        return '<img src="' + IMG(im) + '" alt="' + esc(p.name) + ', фото ' + (i + 1) + '" data-zoom loading="' + (i < 2 ? 'eager' : 'lazy') + '">';
      }).join('') + '</div>' +
      '<aside class="info"><span class="label muted">' + esc(p.kind) + '</span><h1>' + esc(p.name) + '</h1>' +
      '<span class="price">' + rub(p.price) + '</span>' +
      '<span class="label unique">В единственном экземпляре</span>' +
      '<p>' + esc(p.text) + '</p>' +
      '<dl class="specs"><div><dt>Размер</dt><dd>' + size + '</dd></div><div><dt>Материал</dt><dd>' + pc.material + '</dd></div>' +
      '<div><dt>Красители</dt><dd>' + esc(p.dyes.join(', ')) + '</dd></div>' +
      (p.edge === false ? '' : '<div><dt>Края</dt><dd>Московский шов</dd></div>') + '</dl>' +
      (inCart(k) ? '<a class="btn btn--ghost" href="#" data-open-cart>Уже в корзине — оформить</a>' : '<button class="btn" data-add="' + k + '">Добавить в корзину</button>') +
      '<div><details><summary class="label">Уход</summary><p>' + pc.care + '</p></details>' +
      '<details><summary class="label">Доставка и оплата</summary><p>Ирина отправляет изделия из мастерской в Пензенской области по России и за рубеж. Способ и стоимость доставки согласовываются после заявки.</p></details>' +
      '<details><summary class="label">Почему цвет может отличаться</summary><p>На шёлке натуральные красители при разном освещении меняют свои оттенки, поэтому вживую изделие может выглядеть немного иначе, чем на фото.</p></details></div>' +
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
          '<button class="btn" data-book="' + m.id + '">Записаться</button>' +
          (inCart(k) ? '<a class="btn btn--ghost" href="#" data-open-cart>В корзине</a>' : '<button class="btn btn--ghost" data-add="' + k + '">Купить материалы</button>') +
          '<a class="link" href="' + TG + '" target="_blank" rel="noopener">Задать вопрос</a></div></div></article>';
      }).join('') +
      '<article class="mk" id="mk-offline"><div class="mk__media"><img src="' + IMG('p6-2') + '" alt="" loading="lazy"></div><div class="mk__body">' +
      '<span class="label muted">Очно</span><h2>Офлайн мастер-классы</h2>' +
      '<p class="mk__lead">Ирина проводила очные мастер-классы в Москве, Архангельской области и Ташкенте. Выберите удобную дату — Ирина подтвердит место и программу.</p>' +
      '<div class="buy"><button class="btn" data-book="offline">Записаться</button><a class="link" href="' + TG + '" target="_blank" rel="noopener">Задать вопрос</a></div></div></article>' +
      '</div>';
  }

  function portfolio() {
    var imgs = [];
    S.products.forEach(function (p) { p.images.forEach(function (im) { imgs.push(IMG(im)); }); });
    S.masterclasses[1].gallery.forEach(function (g, i) { imgs.splice(4 + i * 9, 0, g); });
    return '<div class="wrap"><header class="page-head"><span class="label muted">Работы мастерской</span><h1>Портфолио</h1>' +
      '<p>Платки, топы, фактуры и отпечатки. Нажмите на фото, чтобы рассмотреть ближе.</p></header>' +
      '<div class="masonry">' + imgs.map(function (s) { return '<img src="' + s + '" alt="" data-zoom loading="lazy">'; }).join('') + '</div></div>' +
      '<div style="height:var(--section)"></div>';
  }

  function contacts() {
    return '<div class="wrap"><header class="page-head"><span class="label muted">' + S.brand.studio + '</span><h1>Контакты</h1>' +
      '<p>Пишите, чтобы заказать изделие, узнать о новых работах или задать вопрос о мастер-классах.</p></header>' +
      '<div class="contacts">' + S.brand.socials.map(function (s) {
        return '<a class="contact" href="' + s.url + '" target="_blank" rel="noopener"><span class="label muted">' + s.name + '</span><h3>' + s.handle + '</h3><p>' + s.url.replace('https://', '') + '</p></a>';
      }).join('') + '</div></div><div style="height:var(--section)"></div>' + aboutBlock();
  }

  function notFound() {
    return '<div class="wrap"><div class="empty" style="padding-block:120px"><h2>Страница не найдена</h2><a class="link" href="#">На главную</a></div></div>';
  }

  /* ---------- Анимации по скроллу ---------- */
  var observers = [];
  function enhance() {
    observers.forEach(function (o) { o.disconnect(); }); observers = [];
    var canObserve = 'IntersectionObserver' in window && !reduceMotion;

    /* фраза из тумана */
    document.querySelectorAll('[data-fog]').forEach(function (el) {
      if (!canObserve) { el.classList.add('is-in'); return; }
      el.classList.add('is-armed');
      var o = new IntersectionObserver(function (en) {
        if (en[0].isIntersecting) { el.classList.add('is-in'); o.disconnect(); }
      }, { threshold: 0.35 });
      o.observe(el); observers.push(o);
    });

    /* счётчики */
    document.querySelectorAll('[data-count]').forEach(function (el) {
      if (!canObserve) return;
      var target = +el.dataset.count, suffix = el.dataset.suffix || '';
      var fmt = function (n) { return n.toLocaleString('ru-RU').replace(/ |,/g, ' ') + suffix; };
      el.textContent = fmt(0);
      var o = new IntersectionObserver(function (en) {
        if (!en[0].isIntersecting) return; o.disconnect();
        var t0 = performance.now(), dur = 1800;
        (function tick(t) {
          var k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3);
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
    var x = r.left + r.width / 2, y = r.top + r.height / 2;
    var stack = document.elementsFromPoint(x, y);
    for (var i = 0; i < stack.length; i++) {
      var n = stack[i];
      if (header.contains(n)) continue;
      if (n.tagName === 'IMG' || n.tagName === 'VIDEO') return 'dark';
      var t = n.closest('[data-tone]');
      return t ? t.getAttribute('data-tone') : 'light';
    }
    return 'light';
  }
  var toneQueued = false;
  function updateHeaderTone() {
    if (toneQueued) return; toneQueued = true;
    requestAnimationFrame(function () {
      toneQueued = false;
      header.querySelectorAll('[data-tone-part]').forEach(function (part) {
        part.classList.toggle('on-dark', toneUnder(part) === 'dark');
      });
    });
  }

  /* ---------- Роутер ---------- */
  var titles = { catalog: 'Каталог', masterclasses: 'Мастер-классы', portfolio: 'Портфолио', contacts: 'Контакты' };
  function route(keepScroll) {
    var h = location.hash.replace(/^#/, '');
    var html, active = h.split('-')[0], anchor = null;
    if (h === '') html = home();
    else if (h === 'catalog') html = catalog(null);
    else if (h.indexOf('catalog-') === 0) html = catById(h.slice(8)) ? catalog(h.slice(8)) : notFound();
    else if (h.indexOf('item-') === 0) { html = product(h.slice(5)); active = 'catalog'; }
    else if (h === 'masterclasses') html = masterclasses();
    else if (h.indexOf('mk-') === 0) { html = masterclasses(); active = 'masterclasses'; anchor = h; }
    else if (h === 'portfolio') html = portfolio();
    else if (h === 'contacts') html = contacts();
    else if (h === 'process' || h === 'about') { html = home(); active = ''; anchor = h; }
    else html = notFound();
    document.body.classList.toggle('is-home', h === '' || h === 'process' || h === 'about');
    app.innerHTML = '<div class="view">' + html + '</div>';
    if (anchor && document.getElementById(anchor)) {
      var top = document.getElementById(anchor).getBoundingClientRect().top + window.scrollY - (h.indexOf('mk-') === 0 ? 90 : 0);
      window.scrollTo(0, top);
    } else if (keepScroll !== true) window.scrollTo(0, 0);
    var p = h.indexOf('item-') === 0 && prodById(h.slice(5));
    document.title = (p ? p.name + ' — ' : (titles[active] ? titles[active] + ' — ' : '')) + 'Ирина Уткина';
    document.querySelectorAll('.nav a').forEach(function (a) { a.classList.toggle('is-active', a.getAttribute('href') === '#' + active); });
    closeMenu(); closeBooking(); closeCart(); enhance(); updateHeaderTone();
  }

  /* ---------- Каркас ---------- */
  function shell() {
    var navL = '<a href="#catalog">Каталог</a><a href="#masterclasses">Мастер-классы</a>';
    var navR = '<a href="#portfolio">Портфолио</a><a href="#contacts">Контакты</a>';
    header = document.getElementById('header');
    header.innerHTML =
      '<div class="wrap header__inner"><nav class="nav" data-tone-part>' + navL + '</nav>' +
      '<button class="burger" aria-label="Меню" data-menu data-tone-part><span></span></button>' +
      '<div class="header__logo" data-tone-part>' + LOGO() + '</div>' +
      '<nav class="nav nav--right" data-tone-part>' + navR + '<button data-open-cart>Корзина <span class="cart-count"></span></button></nav>' +
      '<button class="label header__cart" data-open-cart data-tone-part>Корзина <span class="cart-count"></span></button></div>';
    document.getElementById('menu').innerHTML =
      '<div class="mobile-menu__top">' + LOGO() + '<button class="close" data-menu-close>Закрыть</button></div>' +
      '<nav><a href="#">Главная</a><a href="#catalog">Каталог</a>' + S.categories.map(function (c) {
        return '<a href="#catalog-' + c.id + '" class="sub">' + catFull(c) + '</a>';
      }).join('') + '<a href="#masterclasses">Мастер-классы</a><a href="#portfolio">Портфолио</a><a href="#contacts">Контакты</a></nav>';
    var footer = document.getElementById('footer');
    footer.setAttribute('data-tone', 'dark');
    footer.innerHTML =
      '<div class="wrap"><div class="footer__top"><div class="footer__brand">' + LOGO() +
      '<p>Платки, шарфы, палантины и топы из натурального шёлка и шерсти, окрашенные листьями, травами и корнями растений. Каждое изделие в единственном экземпляре.</p></div>' +
      '<div><h4 class="label">Каталог</h4><ul>' + S.categories.map(function (c) { return '<li><a href="#catalog-' + c.id + '">' + catShort(c) + '</a></li>'; }).join('') + '</ul></div>' +
      '<div><h4 class="label">Мастерская</h4><ul><li><a href="#masterclasses">Мастер-классы</a></li><li><a href="#portfolio">Портфолио</a></li><li><a href="#about">О мастере</a></li><li><a href="#process">Процесс</a></li><li><a href="#contacts">Контакты</a></li></ul></div>' +
      '<div><h4 class="label">Соцсети</h4><ul>' + S.brand.socials.map(function (s) { return '<li><a href="' + s.url + '" target="_blank" rel="noopener">' + s.name + '</a></li>'; }).join('') + '</ul></div></div>' +
      '<div class="footer__bottom"><span>© ' + new Date().getFullYear() + ' Арт текстиль Ирины Уткиной</span><span>' + S.brand.studio + '</span></div></div>';
  }
  function closeMenu() { document.getElementById('menu').hidden = true; }

  /* ---------- События ---------- */
  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-add],[data-remove],[data-open-cart],[data-close-cart],[data-menu],[data-menu-close],[data-zoom],#overlay,[data-lightbox-close],[data-book],[data-close-booking],[data-sound]');
    if (!t) {
      if (e.target.id === 'booking') closeBooking();
      return;
    }
    if (t.dataset.add) { addToCart(t.dataset.add); route(true); }
    else if (t.dataset.remove) { cart = cart.filter(function (k) { return k !== t.dataset.remove; }); saveCart(); renderCart(); }
    else if (t.dataset.book) { openBooking(t.dataset.book); }
    else if (t.hasAttribute('data-close-booking')) { closeBooking(); }
    else if (t.hasAttribute('data-sound')) {
      var v = t.parentNode.querySelector('video'); v.muted = !v.muted; if (v.paused) v.play();
      t.textContent = 'Звук: ' + (v.muted ? 'выкл' : 'вкл'); t.setAttribute('aria-pressed', String(!v.muted));
    }
    else if (t.hasAttribute('data-open-cart')) { e.preventDefault(); openCart(); }
    else if (t.hasAttribute('data-close-cart') || t.id === 'overlay') { closeCart(); }
    else if (t.hasAttribute('data-menu')) { document.getElementById('menu').hidden = false; }
    else if (t.hasAttribute('data-menu-close')) { closeMenu(); }
    else if (t.hasAttribute('data-zoom')) {
      var lb = document.getElementById('lightbox'); lb.querySelector('img').src = t.src; lb.hidden = false;
    } else if (t.hasAttribute('data-lightbox-close')) { document.getElementById('lightbox').hidden = true; }
  });
  document.getElementById('lightbox').addEventListener('click', function () { this.hidden = true; });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { closeCart(); closeMenu(); closeBooking(); document.getElementById('lightbox').hidden = true; } });
  document.addEventListener('submit', function (e) {
    var f = e.target;
    if (f.id === 'order-form') {
      e.preventDefault();
      var ok = true;
      ['f-name', 'f-contact'].forEach(function (id) { var el = f.querySelector('#' + id); var bad = !el.value.trim(); el.style.borderColor = bad ? 'var(--madder)' : ''; if (bad) ok = false; });
      if (!ok) { toast('Укажите имя и телефон или Telegram'); return; }
      cart = []; saveCart(); closeCart(); route(true);
      toast('Заявка принята (демо). Ирина свяжется с вами');
    } else if (f.id === 'booking-form') {
      e.preventDefault();
      var fd = new FormData(f), err = f.querySelector('#b-error'), miss = [];
      if (!fd.get('date')) miss.push('дату');
      if (!fd.get('time')) miss.push('время');
      if (!String(fd.get('name') || '').trim()) miss.push('имя');
      if (!String(fd.get('contact') || '').trim()) miss.push('телефон или Telegram');
      if (miss.length) { err.textContent = 'Укажите ' + miss.join(', ') + '.'; err.hidden = false; return; }
      var sel = f.querySelector('#b-mk');
      f.parentNode.innerHTML = '<div class="drawer__head"><h2>Вы записаны</h2><button class="close" data-close-booking>Закрыть</button></div>' +
        '<div class="booked"><p class="label muted">' + esc(sel.options[sel.selectedIndex].text) + '</p>' +
        '<p class="booked__when">' + esc(fd.get('date')) + ', ' + esc(fd.get('time')) + '</p><p class="muted">' + esc(fd.get('format')) +
        '. Ирина свяжется с вами, чтобы подтвердить запись.</p><p class="note">Демо-версия: заявка никуда не отправлена.</p>' +
        '<button class="btn" data-close-booking>Готово</button></div>';
    }
  });
  window.addEventListener('scroll', updateHeaderTone, { passive: true });
  window.addEventListener('resize', updateHeaderTone);
  window.addEventListener('load', updateHeaderTone);
  window.addEventListener('hashchange', function () { route(); });

  /* ---------- Прелоадер ---------- */
  (function preloader() {
    var pre = document.getElementById('preloader'); if (!pre) return;
    var minTime = reduceMotion ? 0 : 2600, start = performance.now(), loaded = document.readyState === 'complete';
    function done() {
      setTimeout(function () {
        pre.classList.add('is-done');
        setTimeout(function () { pre.hidden = true; updateHeaderTone(); }, 900);
      }, Math.max(0, minTime - (performance.now() - start)));
    }
    if (loaded) done(); else window.addEventListener('load', done);
    setTimeout(function () { if (!pre.classList.contains('is-done')) { pre.classList.add('is-done'); } }, 6000);
  })();

  shell(); updateCount(); route();
})();
