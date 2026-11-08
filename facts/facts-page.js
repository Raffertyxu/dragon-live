/* 全站共用資訊的套用程式：把頁面上寫死的舊電話／舊字串換成 facts.js 裡的新值（文字、tel: 連結、aria-label、title）。
   新值和舊值相同時完全不做事、不監聽頁面。語言切換或動畫後才長出來的文字也會處理。
   和全站語言引擎的配合：引擎用「原文」找英文，所以英文模式下，含中文的句子先讓引擎翻譯，翻完再換電話；
   切到英文時，把我改過的中文句子還原成原文，讓引擎重新翻譯。 */
(function () {
  var F = window.CLG_FACTS; if (!F || window.CLG_FACTS_ON) return;
  var pairs = [], telPairs = [];
  var digits = function (x) { return String(x || '').replace(/[^\d+]/g, ''); };
  (F.phones || []).forEach(function (p) {
    var w = p.was || {}; if (!w.display || !p.display) return;
    var spaced = function (x) { return x.replace(/-/g, ' '); };
    if (p.display !== w.display) pairs.push([w.display, p.display], [spaced(w.display), spaced(p.display)]);
    if (p.display !== w.display) (w.alt || []).forEach(function (x) { pairs.push([x, p.display]); });
    if (w.intl && p.intl && p.intl !== w.intl) pairs.push([w.intl, p.intl]);
    if (w.tel && p.tel && digits(p.tel) !== digits(w.tel)) telPairs.push([digits(w.tel), digits(p.tel)]);
  });
  (F.replace || []).forEach(function (p) { if (p && p.from && p.to != null && p.from !== p.to && String(p.to).indexOf(p.from) < 0) pairs.push([p.from, String(p.to)]); });
  if (!pairs.length && !telPairs.length) return;
  window.CLG_FACTS_ON = 1;

  var d = document, root = d.documentElement;
  var isEn = function () { return /^en/i.test(root.lang) || /[?&]lang=en/.test(location.search); };
  var CJK = /[㐀-鿿]/;
  var late = false; setTimeout(function () { late = true; q.push(d.body); kick(); }, 1500); // 超過 1.5 秒還沒被翻譯的中文句子，直接換
  var fix = function (s) { for (var i = 0; i < pairs.length; i++) if (s.indexOf(pairs[i][0]) > -1) s = s.split(pairs[i][0]).join(pairs[i][1]); return s; };
  var hasOld = function (s) { for (var i = 0; i < pairs.length; i++) if (s.indexOf(pairs[i][0]) > -1) return true; return false; };
  var SKIP = /^(SCRIPT|STYLE|TEXTAREA|NOSCRIPT)$/;
  var changed = new Set(); // 我改過的地方：{get, set, orig, mod}

  function text(n) {
    var v = n.nodeValue; if (!hasOld(v)) return;
    if (isEn() && CJK.test(v) && !late) return; // 等語言引擎翻完
    var w = fix(v); n.nodeValue = w; changed.add({ get: function () { return n.nodeValue; }, set: function (x) { n.nodeValue = x; }, el: n, orig: v, mod: w });
  }
  function attr(el, a) {
    var v = el.getAttribute(a); if (!v || !hasOld(v)) return;
    if (isEn() && CJK.test(v) && !late) return;
    var w = fix(v); el.setAttribute(a, w); changed.add({ get: function () { return el.getAttribute(a); }, set: function (x) { el.setAttribute(a, x); }, el: el, orig: v, mod: w });
  }
  function node(n) {
    if (n.nodeType === 3) return text(n);
    if (n.nodeType !== 1 || SKIP.test(n.tagName)) return;
    var h = n.getAttribute('href');
    if (h && /^tel:/i.test(h)) { var hd = digits(h); for (var t = 0; t < telPairs.length; t++) if (hd.indexOf(telPairs[t][0]) > -1) { n.setAttribute('href', 'tel:' + hd.split(telPairs[t][0]).join(telPairs[t][1])); break; } }
    attr(n, 'aria-label'); attr(n, 'title');
    for (var c = n.firstChild; c; c = c.nextSibling) node(c);
  }
  var q = [], busy = false;
  function flush() { busy = false; var l = q; q = []; l.forEach(function (n) { if (n.isConnected !== false) node(n); }); }
  function kick() { if (!busy) { busy = true; setTimeout(flush, 30); } }
  function push(n) { q.push(n); kick(); }

  node(d.body);
  new MutationObserver(function (ms) {
    ms.forEach(function (m) {
      if (m.type === 'childList') m.addedNodes.forEach(push);
      else push(m.target);
    });
  }).observe(d.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['href', 'aria-label', 'title'] });

  // 切語言：切到英文時，把我改過的中文句子還原，讓語言引擎重新翻譯（翻完會再被上面的監聽換掉電話）
  var lastLang = root.lang;
  new MutationObserver(function () {
    if (root.lang === lastLang) return; lastLang = root.lang;
    setTimeout(function () {
      var en = isEn();
      changed.forEach(function (c) {
        if (c.el.isConnected === false) { changed.delete(c); return; }
        if (en && CJK.test(c.orig) && c.get() === c.mod) { c.set(c.orig); changed.delete(c); }
      });
      push(d.body);
    }, 0);
  }).observe(root, { attributes: true, attributeFilter: ['lang'] });
})();
