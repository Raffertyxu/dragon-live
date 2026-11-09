/* 試作：聯名企劃頁的內容改由「試算表」供應（Google 試算表發佈出來的 CSV 網址，或任何 CSV 網址）。
   一列＝一組合作，欄位用「標題文字」認，所以客戶調整欄位順序也沒關係。
   - 顯示欄填「否」（或 no／false／0／隱藏）那一列不顯示。
   - 分類欄填分類的中文名（動漫聯名／品牌合作／在地合作）；填別的名字會當成新分類（只出現在「全部」，沒有專屬篩選鈕）。
   - 沒有英文就用中文；沒有圖片網址或沒有中文標題的列會被略過。
   - 讀不到、格式不對、整張表沒有可用的列：什麼都不做，頁面維持 content.js 的內容。 */
(function () {
  var C = window.CLG_COLLAB, S = window.CLG_COLLAB_SHEET;
  if (!C || !S || !S.csv || !window.fetch) return;

  var FIELDS = [
    ['show', /^(顯示|show)/i], ['cat', /^(分類|categ)/i], ['img', /^(圖片網址|image|img)/i],
    ['title.zh', /^標題.*(中|zh)/i], ['title.en', /^標題.*(en|英)/i],
    ['sub.zh', /^副標.*(中|zh)/i], ['sub.en', /^副標.*(en|英)/i],
    ['desc.zh', /^介紹.*(中|zh)/i], ['desc.en', /^介紹.*(en|英)/i],
    ['cap.zh', /^圖說.*(中|zh)/i], ['cap.en', /^圖說.*(en|英)/i],
    ['alt.zh', /^圖片替代.*(中|zh)/i], ['alt.en', /^圖片替代.*(en|英)/i]
  ];
  var HIDE = /^(否|n|no|false|0|隱藏|hide)$/i, MAX = 60;

  function parseCSV(t) {
    t = t.replace(/^﻿/, '');
    var rows = [], row = [], cur = '', q = false, i, c;
    for (i = 0; i < t.length; i++) {
      c = t.charAt(i);
      if (q) { if (c === '"') { if (t.charAt(i + 1) === '"') { cur += '"'; i++; } else q = false; } else cur += c; }
      else if (c === '"') q = true;
      else if (c === ',') { row.push(cur); cur = ''; }
      else if (c === '\n' || c === '\r') { if (c === '\r' && t.charAt(i + 1) === '\n') i++; row.push(cur); cur = ''; rows.push(row); row = []; }
      else cur += c;
    }
    if (cur !== '' || row.length) { row.push(cur); rows.push(row); }
    return rows;
  }

  function build(rows) {
    // 在前 4 列裡找標題列（客戶在表格上方加標題或空白列也沒關係；Google 有時會把標題列當資料）
    var col = null, hr = 0;
    for (; hr < Math.min(rows.length, 4); hr++) {
      var m = {}, n = 0;
      rows[hr].forEach(function (h, i) {
        h = String(h).trim();
        for (var k = 0; k < FIELDS.length; k++) if (m[FIELDS[k][0]] == null && FIELDS[k][1].test(h)) { m[FIELDS[k][0]] = i; n++; break; }
      });
      if (n >= 4 && m['title.zh'] != null && m['img'] != null) { col = m; break; }
    }
    if (!col) return [];
    var cats = JSON.parse(JSON.stringify(C.categories || {})), extra = 0;
    var get = function (r, k) { return col[k] == null ? '' : String(r[col[k]] == null ? '' : r[col[k]]).trim(); };
    var pair = function (r, k) { var o = { zh: get(r, k + '.zh') }, e = get(r, k + '.en'); if (e) o.en = e; return o; };
    var catKey = function (v) {
      if (!v) v = '其他';
      for (var k in cats) if (v === k || v === cats[k].zh || v.toLowerCase() === String(cats[k].en).toLowerCase()) return k;
      var nk = 'x' + (++extra); cats[nk] = { zh: v, en: v }; return nk;
    };
    var items = [];
    for (var i = hr + 1; i < rows.length && items.length < MAX; i++) {
      var r = rows[i];
      if (HIDE.test(get(r, 'show'))) continue;
      var img = get(r, 'img');
      if (!get(r, 'title.zh') || !/^https?:\/\//i.test(img)) continue;
      items.push({ cat: catKey(get(r, 'cat')), img: img, title: pair(r, 'title'), sub: pair(r, 'sub'), desc: pair(r, 'desc'), cap: pair(r, 'cap'), alt: pair(r, 'alt') });
    }
    return items.length ? { items: items, categories: cats } : [];
  }

  var url = S.csv + (S.csv.indexOf('?') > -1 ? '&' : '?') + '_=' + (Date.now() / 3e4 | 0); // 每 30 秒換一次，避開舊快取
  fetch(url, { cache: 'no-store' })
    .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.text(); })
    .then(function (text) {
      var got = build(parseCSV(text));
      if (!got || !got.items) { window.CLG_COLLAB_SHEET_STATE = 'empty'; return; }
      C.items = got.items; C.categories = got.categories;
      window.CLG_COLLAB_SHEET_STATE = 'ok:' + got.items.length;
      if (window.CLG_COLLAB_RERENDER) window.CLG_COLLAB_RERENDER();
    })
    .catch(function (e) { window.CLG_COLLAB_SHEET_STATE = 'fail:' + (e && e.message || e); });
})();
