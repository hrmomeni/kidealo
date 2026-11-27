// Live idealo data for the demo family's planned items.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CACHE_FILE = path.join(ROOT, 'data', 'plan-cache.json');
const TTL = 6 * 3600 * 1000;

/** "1.152,15 €" -> 1152.15 */
export function parseEur(v) {
  if (typeof v === 'number') return v;
  const m = String(v || '').replace(/\./g, '').match(/(\d+)(?:,(\d+))?/);
  return m ? +(m[1] + '.' + (m[2] || '0')) : null;
}

const RULES = [
  [/walking shoes.*?(\d{2})/i, m => `Lauflernschuhe ${m[1]}`],
  [/winter overall.*?(\d{2,3})/i, m => `Schneeanzug ${m[1]}`],
  [/winter jacket.*?(\d{2,3})/i, m => `Kinder Winterjacke ${m[1]}`],
  [/t-?shirts?.*?(\d{2,3})/i, m => `Kinder T-Shirt ${m[1]}`],
  [/summer clothes.*?(\d{2,3})/i, m => `Kinder Sommerkleidung ${m[1]}`],
  [/shoes?, size (\d{2})/i, m => `Kinderschuhe ${m[1]}`],
  [/car seat.*?(\d{2,3})\D+(\d{3})/i, m => `Kindersitz i-Size ${m[1]}-${m[2]}`],
  [/lego duplo/i, () => 'LEGO DUPLO'],
  [/lego dinosaur/i, () => 'LEGO Dinosaurier'],
  [/lego/i, () => 'LEGO Classic'],
  [/stair.*gate|safety gate/i, () => 'Treppenschutzgitter'],
  [/headphones/i, () => 'Kinderkopfhörer 85 dB'],
  [/activity cube/i, () => 'Motorikwürfel'],
  [/balance bike/i, () => 'Laufrad 12 Zoll'],
  [/first bike.*?(\d{2}) inch|bike.*?(\d{2}) inch/i, m => `Kinderfahrrad ${m[1] || m[2]} Zoll`],
  [/backpack/i, () => 'Kindergartenrucksack'],
  [/picture books?|board book/i, () => 'Bilderbuch Kleinkinder'],
  [/big bed/i, () => 'Kinderbett 70x140'],
  [/helmet/i, () => 'Kinderfahrradhelm'],
];
const CAT = { shoes: 'Kinderschuhe', clothing: 'Kinderkleidung', toys: 'Spielzeug Kinder', books: 'Kinderbuch', bags: 'Kinderrucksack', bikes: 'Kinderfahrrad', lego: 'LEGO', audio: 'Kinderkopfhörer', car_seat: 'Kindersitz', furniture: 'Kindermöbel', home: 'Kindersicherung' };

export function buildQuery(it) {
  if (it.query) return it.query;
  const t = String(it.title || '');
  for (const [re, f] of RULES) { const m = t.match(re); if (m) return f(m); }
  return CAT[it.category] || t.replace(/[,()]/g, ' ').replace(/\s+/g, ' ').trim();
}

/** Prefer results with price + reviews. */
export function pickBest(results = []) {
  const score = r => {
    if (!parseEur(r.price)) return -1;
    const n = r.userReviewsSummary?.totalReviewCount || 0, a = r.userReviewsSummary?.averageRating || 0;
    return (n ? 100 : 0) + Math.min(n, 1000) / 20 + a * 2 + (r.testReportsSummary?.grade ? 5 : 0);
  };
  return results.map(r => [score(r), r]).filter(x => x[0] >= 0).sort((a, b) => b[0] - a[0])[0]?.[1] || null;
}

let mem = null;
const load = () => { if (mem) return mem; try { mem = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8')); } catch { mem = {}; } return mem; };
const save = () => { try { fs.mkdirSync(path.dirname(CACHE_FILE), { recursive: true }); fs.writeFileSync(CACHE_FILE, JSON.stringify(mem)); } catch (e) { console.warn(`plan cache not saved: ${e.message}`); } };
const sleep = ms => new Promise(r => setTimeout(r, ms));

export const stats = { calls: 0 };

export async function resolvePlan(items, call, { concurrency = 2 } = {}) {
  const cache = load(), out = {}, todo = [];
  const now = Date.now();
  for (const it of items) {
    if (!it || !it.id) continue;
    const q = buildQuery(it), c = cache[q];
    if (c && now - c.t < TTL) { if (c.v) out[it.id] = c.v; } else todo.push([it, q]);
  }
  const byQuery = new Map(); for (const [it, q] of todo) (byQuery.get(q) || byQuery.set(q, []).get(q)).push(it);
  const queue = [...byQuery.keys()];
  async function worker() {
    while (queue.length) {
      const q = queue.shift();
      let v = null;
      try {
        stats.calls++;
        const d = await call('search_products', { query: q, country: 'DE' });
        const r = pickBest(d.results || d.products || []);
        if (r) {
          v = { productRef: r.productRef, name: r.name, now: parseEur(r.price), low30d: null, avg30d: null, change30d: null, series: [], imageUrl: r.imageUrl, url: r.url, rating: r.userReviewsSummary?.averageRating || 0, reviews: r.userReviewsSummary?.totalReviewCount || 0, grade: r.testReportsSummary?.grade };
          await sleep(350);
          try {
            stats.calls++;
            const h = await call('get_product_price_history', { productRef: r.productRef, country: 'DE' });
            const st = h.priceTrend?.statistics || {};
            v.low30d = parseEur(st.minPrice); v.avg30d = parseEur(st.avgPrice); v.change30d = st.priceChangePercent ?? null;
            v.series = (h.priceTrend?.history || []).map(x => parseEur(x.price)).filter(Boolean);
          } catch (e) { console.warn(`plan: no price history for ${r.productRef}: ${e.message}`); }
          if (v.low30d == null) v.low30d = v.now;
        }
        cache[q] = { t: Date.now(), v };
      } catch (e) { console.warn(`plan: lookup failed for "${q}", left uncached so a later reload retries: ${e.message}`); }
      for (const it of byQuery.get(q)) if (v) out[it.id] = v;
      await sleep(350);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, queue.length) }, worker));
  if (todo.length) save();
  return out;
}
