// Replaces the demo prices of the family plan with live idealo data (one batched request). Fails silently.
(async function () {
  try {
    const K = window.KIDEALO; if (!K) return;
    const all = [];
    for (const k of K.KIDS || []) for (const it of k.items || []) all.push(it);
    for (const it of K.DISCOVER || []) all.push(it);
    const items = [];
    all.forEach((it, i) => { if (it.hand || !(it.now > 0)) return; it._lid = it._lid || 'lp' + i; items.push({ id: it._lid, title: it.title, category: it.category }); });
    if (!items.length) return;
    const r = await fetch('/api/plan/resolve', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items }) });
    if (!r.ok) return;
    const res = await r.json();
    let n = 0;
    for (const it of all) {
      const d = res[it._lid]; if (!d || !(d.now > 0)) continue;
      const oldTarget = it.target;
      it.now = d.now;
      if (d.low30d > 0) it.low30d = d.low30d;
      if (oldTarget == null || oldTarget > d.now) it.target = Math.round(it.low30d * 0.95 * 100) / 100;
      if (d.series && d.series.length) it.series = d.series;
      if (d.change30d != null) it.change30d = d.change30d;
      if (d.imageUrl) it.imageUrl = d.imageUrl;
      if (d.url) it.url = d.url;
      it.productRef = d.productRef; it.live = true; it.liveName = d.name;
      n++;
    }
    if (!n) return;
    try { K.refresh(); } catch {}
    const t = document.createElement('div');
    t.textContent = `Live idealo prices loaded for ${n} items`;
    t.style.cssText = 'position:fixed;right:16px;bottom:16px;z-index:60;padding:8px 14px;border-radius:999px;font:600 13px var(--body,system-ui);background:var(--panel,#fff);color:var(--ink,#1d2633);box-shadow:0 6px 20px rgba(0,0,0,.15);transition:opacity .5s';
    document.body.appendChild(t);
    setTimeout(() => { t.style.opacity = 0; setTimeout(() => t.remove(), 600); }, 5000);
  } catch (e) { /* silent */ }
})();
