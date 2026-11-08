/* 聯名企劃頁版型：依 content.js 重畫「精選輪播」和「合作卡片」。
   讀不到資料或出錯時什麼都不做，頁面維持 1shop 內建的舊內容。語言跟著 <html lang>，切換語言時重畫。 */
(function () {
  var C = window.CLG_COLLAB, r = document.getElementById('clg-collabs');
  if (!C || !r || r.dataset.clgLoaded) return;
  var feature = r.querySelector('.cx-feature'), grid = r.querySelector('.cx-grid');
  if (!feature || !grid || !C.items || !C.items.length) return;
  r.dataset.clgLoaded = '1';
  var index = 0, filter = 'all', reduce = matchMedia('(prefers-reduced-motion:reduce)').matches;
  var isEn = function () { return /^en/i.test(document.documentElement.lang) || /[?&]lang=en/.test(location.search); };
  var tx = function (o) { return o ? (isEn() ? (o.en || o.zh) : o.zh) || '' : ''; };
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var fill = function (o, m) { return tx(o).replace(/\{(\w+)\}/g, function (_, k) { return m[k]; }); };
  var cat = function (k) { return C.categories[k] || { zh: k, en: k }; };
  var pad = function (n) { return String(n).padStart(2, '0'); };
  var count = function (n) { return n === 1 ? tx(C.ui.count1) : fill(C.ui.count, { n: n }); };

  function slide(it, i) {
    return '<article class="cx-slide"' + (i === index ? '' : ' hidden') + ' data-slide="' + i + '"><div class="cx-copy"><p class="cx-eyebrow">' +
      esc(fill(C.ui.eyebrow, { cat: tx(cat(it.cat)) })) + '</p><h1>' + esc(tx(it.title)) + '</h1><p class="cx-subtitle">' + esc(tx(it.sub)) +
      '</p><p class="cx-description">' + esc(tx(it.desc)) + '</p><a class="cx-link" href="#cx-collection">' + esc(tx(C.ui.explore)) +
      ' <span aria-hidden="true">↓</span></a></div><figure class="cx-visual"><img src="' + esc(it.img) + '" alt="' + esc(tx(it.alt)) +
      '" width="400" height="400"' + (i === 0 ? '' : ' loading="lazy"') + '><figcaption>' + esc(tx(it.cap)) + '</figcaption></figure></article>';
  }
  function card(it, i) {
    var shown = filter === 'all' || it.cat === filter;
    return '<article class="cx-card" data-category="' + esc(it.cat) + '"' + (shown ? '' : ' hidden') + '><button type="button" class="cx-open" data-show="' + i +
      '" aria-label="' + esc(fill(C.ui.open, { title: tx(it.title) })) + '"><figure><img src="' + esc(it.img) + '" alt="' + esc(tx(it.alt)) +
      '" width="400" height="400" loading="lazy"></figure><div class="cx-card-copy"><small>' + esc(tx(cat(it.cat))) + '</small><h3>' + esc(tx(it.title)) +
      '<span aria-hidden="true">↗</span></h3><p>' + esc(tx(it.cap)) + '</p></div></button></article>';
  }
  function render() {
    var n = C.items.length;
    index = Math.min(index, n - 1);
    feature.innerHTML = C.items.map(slide).join('') + '<div class="cx-controls"><span class="cx-position" aria-live="polite">' + pad(index + 1) + ' / ' + pad(n) +
      '</span><button type="button" data-prev aria-label="' + esc(tx(C.ui.prev)) + '">←</button><button type="button" data-next aria-label="' + esc(tx(C.ui.next)) + '">→</button></div>';
    grid.innerHTML = C.items.map(card).join('');
    var shown = C.items.filter(function (it) { return filter === 'all' || it.cat === filter; }).length;
    var c = r.querySelector('.cx-count'); if (c) c.textContent = count(shown);
    // 小標「N 組合作，分成 M 類」：只有數量和內建不同時才改（內建的是 6 組、3 類）
    var kinds = Object.keys(C.items.reduce(function (a, it) { a[it.cat] = 1; return a; }, {})).length;
    var p = r.querySelector('.cx-section-title > p');
    if (p && (n !== 6 || kinds !== 3)) p.innerHTML = esc(isEn() ? n + ' collaborations in ' + kinds + ' groups' : n + ' 組合作，分成 ' + kinds + ' 類') + '<br>' + esc(isEn() ? 'Anime, brand and local partnerships.' : '動漫聯名、品牌合作和在地合作。');
  }
  function show(i) {
    var n = C.items.length;
    index = (i + n) % n;
    r.querySelectorAll('.cx-slide').forEach(function (s, k) { s.hidden = k !== index; });
    r.querySelector('.cx-position').textContent = pad(index + 1) + ' / ' + pad(n);
  }

  r.querySelectorAll('[data-filter]').forEach(function (b) { b.onclick = null; }); // 取消內建的舊處理，改由下面統一處理
  r.addEventListener('click', function (e) {
    var t = e.target.closest && e.target.closest('[data-prev],[data-next],[data-show],[data-filter]');
    if (!t || !r.contains(t)) return;
    if (t.hasAttribute('data-prev')) show(index - 1);
    else if (t.hasAttribute('data-next')) show(index + 1);
    else if (t.hasAttribute('data-show')) {
      show(+t.dataset.show);
      r.querySelector('.cx-feature').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
      var nx = r.querySelector('[data-next]'); if (nx) nx.focus({ preventScroll: true });
    } else {
      filter = t.dataset.filter;
      r.querySelectorAll('[data-filter]').forEach(function (x) { x.setAttribute('aria-pressed', String(x === t)); });
      var shown = 0;
      r.querySelectorAll('.cx-card').forEach(function (c) { c.hidden = filter !== 'all' && c.dataset.category !== filter; if (!c.hidden) shown++; });
      r.querySelector('.cx-count').textContent = count(shown);
    }
  });

  render();
  var last = document.documentElement.lang;
  new MutationObserver(function () {
    if (document.documentElement.lang === last) return;
    last = document.documentElement.lang;
    setTimeout(render, 80);
  }).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
})();
