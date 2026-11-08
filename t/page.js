(function(){var c=window.CLG_TEST_CONTENT,m=document.getElementById('clg-loader-test');if(!c||!m)return;
var e=function(s){return String(s).replace(/[&<>"]/g,function(x){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[x]})};
var css='#clg-loader-test{max-width:720px;margin:24px auto;padding:24px 28px;border-radius:18px;background:#0b2a4a;color:#f6f1e6;font:16px/1.7 "Noto Sans TC",sans-serif}#clg-loader-test h2{margin:0 0 6px;font-size:24px;letter-spacing:.06em}#clg-loader-test small{opacity:.6}#clg-loader-test dl{margin:16px 0 0}#clg-loader-test dt{font-weight:700;margin-top:12px;color:#e9c46a}#clg-loader-test dd{margin:2px 0 0}';
var st=document.createElement('style');st.textContent=css;document.head.appendChild(st);
m.innerHTML='<h2>'+e(c.title)+'</h2><small>更新日期 '+e(c.updated)+'</small><p>'+e(c.intro)+'</p><dl>'+c.items.map(function(i){return'<dt>'+e(i.h)+'</dt><dd>'+e(i.p)+'</dd>'}).join('')+'</dl>'})();
