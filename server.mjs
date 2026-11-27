// Kidealo server: static front end + live agent endpoints.
// Partners: Nebius Token Factory (Judge, review summaries), Tavily (review research),
// idealo MCP (search, offers, 30-day price history). Every live call is logged to /api/calls.
// Anything without a key falls back to demo data in the front end, and the UI says so.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { allowedActions, guardDecision } from './lib/rules.mjs';
import * as idealo from './lib/idealo.mjs';
import { resolvePlan } from './lib/plan.mjs';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
loadEnv(path.join(ROOT, '.env'));
const PORT = +process.env.PORT || 8787;
const NEBIUS_KEY = process.env.NEBIUS_API_KEY || '';
const NEBIUS_URL = process.env.NEBIUS_BASE_URL || 'https://api.tokenfactory.nebius.com/v1/';
const MODELS = (process.env.NEBIUS_MODELS || 'nvidia/Nemotron-3_5-Lightning,openai/gpt-oss-120b').split(',').map(s => s.trim()).filter(Boolean);
const TAVILY_KEY = process.env.TAVILY_API_KEY || '';
// idealo's OAuth only accepts known redirect URIs; its guide uses port 6274 (/callback).
const CB_PORT = +process.env.IDEALO_CALLBACK_PORT || 6274;

function loadEnv(file) {
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}

/* ---------- call log (shown in the Agents feed) ---------- */
const CALLS = [];
export function logCall(agent, tool, msg, ms, extra = {}) {
  CALLS.unshift({ id: Date.now() + Math.random(), t: new Date().toTimeString().slice(0, 8), agent, tool, msg, ms, live: true, ...extra });
  if (CALLS.length > 200) CALLS.pop();
}
idealo.setLogger(logCall);

/* ---------- Nebius ---------- */
async function nebiusJSON(system, user, { agent = 'Judge', label = 'chat' } = {}) {
  if (!NEBIUS_KEY) throw new Error('NEBIUS_API_KEY not set');
  let lastErr;
  for (const model of MODELS) {
    const t0 = Date.now();
    try {
      const r = await fetch(new URL('chat/completions', NEBIUS_URL), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${NEBIUS_KEY}` },
        body: JSON.stringify({
          model, temperature: 0.2, max_tokens: 900,
          // Reasoning models spend the token budget thinking; turn it down for a fast JSON answer.
          ...(/nemotron/i.test(model) ? { chat_template_kwargs: { enable_thinking: false } } : {}),
          ...(/gpt-oss/i.test(model) ? { reasoning_effort: 'low' } : {}),
          response_format: { type: 'json_object' },
          messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
        }),
        signal: AbortSignal.timeout(25000),
      });
      const ms = Date.now() - t0;
      if (!r.ok) { lastErr = new Error(`${model}: HTTP ${r.status} ${(await r.text()).slice(0, 200)}`); logCall(agent, `Nebius ${model}`, `Failed (${r.status}), trying the next model.`, ms, { error: true }); continue; }
      const j = await r.json();
      const text = j.choices?.[0]?.message?.content || '{}';
      const data = JSON.parse(text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1));
      return { data, model, ms, usage: j.usage };
    } catch (e) { lastErr = e; logCall(agent, `Nebius ${model}`, `Error: ${String(e.message).slice(0, 120)}`, Date.now() - t0, { error: true }); }
  }
  throw lastErr;
}

const JUDGE_SYSTEM = `You are the Judge agent in Kidealo, an app that tells parents what their children will need next and the best time to buy it.
You get evidence about ONE item and a list of allowed_actions computed by fixed safety rules.
Choose exactly one action from allowed_actions:
- BUY_NOW: buy today.
- WAIT: a sale season with measured price proof comes before the need date. Only allowed if listed.
- WATCH: keep watching for the target price.
- ASK_PARENT: evidence is missing or conflicting (e.g. size unknown, reviews conflict, safety unclear).
Rules: never pick an action that is not in allowed_actions. Prefer ASK_PARENT when a fact a parent could easily give is missing.
Reply with JSON only: {"action": "...", "confidence": 0.0-1.0, "reason": "one short plain-English sentence for the parent", "missing_evidence": ["..."]}`;

async function judge(body) {
  const facts = body.facts || {};
  const allowed = allowedActions(facts);
  const user = JSON.stringify({ allowed_actions: allowed, ...facts });
  const { data, model, ms } = await nebiusJSON(JUDGE_SYSTEM, user, { agent: 'Judge' });
  const out = guardDecision(data, allowed, facts);
  logCall('Judge', `Nebius ${model} · JSON`, `${facts.child || 'Child'}: ${facts.title} → ${out.action} (${Math.round((out.confidence || 0) * 100)}%). ${out.reason}`, ms, { model });
  return { ...out, allowed, model, ms, live: true };
}

/* ---------- Tavily reviews + Nebius summary ---------- */
const reviewCache = new Map();
async function reviews(q) {
  if (reviewCache.has(q)) return reviewCache.get(q);
  if (!TAVILY_KEY) throw new Error('TAVILY_API_KEY not set');
  const t0 = Date.now();
  const r = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TAVILY_KEY}` },
    body: JSON.stringify({ query: `${q} review test parents experience`, search_depth: 'basic', max_results: 5, include_answer: 'basic' }),
    signal: AbortSignal.timeout(20000),
  });
  if (!r.ok) throw new Error(`Tavily HTTP ${r.status}`);
  const j = await r.json();
  const results = (j.results || []).slice(0, 5).map(x => ({ title: x.title, url: x.url, snippet: (x.content || '').slice(0, 500), score: x.score }));
  logCall('Reviewer', 'Tavily search', `"${q}": ${results.length} sources found.`, Date.now() - t0);
  const clean = t => String(t || '').replace(/[#*_>`\[\]]+/g, ' ').replace(/\(https?:[^)]*\)/g, '').replace(/\s+/g, ' ').trim();
  let summary = { pros: [], cons: [], verdict: clean(j.answer).slice(0, 300), rows: [] };
  if (NEBIUS_KEY && results.length) {
    try {
      const sys = `You summarise product research for parents. Use ONLY the given sources. Reply JSON: {"verdict":"one sentence","pros":["max 3 short"],"cons":["max 3 short"],"rows":[{"source":"site name","type":"review|test|forum|shop|news","finding":"one short sentence","url":"..."}]}. One row per source. If sources disagree, say so in the verdict.`;
      const { data, model, ms } = await nebiusJSON(sys, JSON.stringify({ product: q, sources: results }), { agent: 'Reviewer' });
      summary = { verdict: data.verdict || summary.verdict, pros: data.pros || [], cons: data.cons || [], rows: data.rows || [] };
      logCall('Reviewer', `Nebius ${model}`, `Summarised ${results.length} sources for "${q}".`, ms);
    } catch (e) {
      // Keep the raw Tavily results, but make the failed summary visible in the Agents feed.
      logCall('Reviewer', 'Nebius summary', `Summary failed, showing raw sources: ${String(e.message).slice(0, 120)}`, 0, { error: true });
    }
  }
  if (!summary.rows.length) summary.rows = results.map(x => { const host = new URL(x.url).hostname.replace('www.', ''); const f = clean(x.snippet); return { source: host, type: /youtube/.test(host) ? 'video' : /forum|reddit|community/.test(host) ? 'forum' : /test|review|nytimes|wirecutter/.test(host + x.title.toLowerCase()) ? 'review' : 'web', finding: (f.match(/^.{20,160}?[.!?](\s|$)/) || [f.slice(0, 150) + '…'])[0], url: x.url }; });
  const out = { query: q, results, ...summary, live: true };
  reviewCache.set(q, out);
  return out;
}

/* ---------- EU Safety Gate (public JSON, no key) ---------- */
let safetyCache = null;
async function safetyGate(q) {
  const t0 = Date.now();
  if (!safetyCache) {
    const pages = [];
    for (let p = 0; p < 3; p++) {
      const r = await fetch('https://ec.europa.eu/safety-gate-alerts/public/api/notification/carousel/', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language: 'en', page: String(p), criteria: [] }), signal: AbortSignal.timeout(15000),
      });
      if (!r.ok) break;
      const j = await r.json();
      pages.push(...(j.content || j.notifications || j || []));
    }
    safetyCache = pages;
  }
  const words = q.toLowerCase().split(/\s+/).filter(w => w.length > 3);
  const hits = safetyCache.filter(a => { const s = JSON.stringify(a).toLowerCase(); return words.length && words.every(w => s.includes(w)); }).slice(0, 3);
  const res = { checked: safetyCache.length, matches: hits.map(h => ({ id: h.id, title: h.product?.name || h.productName || h.title || 'Alert', brand: h.product?.brand || h.brand || '', risk: h.riskType || h.risk?.riskType || '' })), result: hits.length ? 'needs_checking' : 'no_confirmed_match' };
  logCall('Guardian', 'EU Safety Gate', `"${q}": ${hits.length ? hits.length + ' possible match(es), needs checking' : 'no confirmed match'} in ${safetyCache.length} recent alerts.`, Date.now() - t0);
  return res;
}

/* ---------- HTTP ---------- */
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml' };
const send = (res, code, obj) => { res.writeHead(code, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(obj)); };
const body = req => new Promise(r => { let b = ''; req.on('data', c => b += c); req.on('end', () => { try { r(JSON.parse(b || '{}')); } catch { r({}); } }); });

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const p = url.pathname;
  try {
    if (p === '/api/status') return send(res, 200, { nebius: !!NEBIUS_KEY, tavily: !!TAVILY_KEY, idealo: idealo.status(), models: MODELS });
    if (p === '/api/calls') return send(res, 200, CALLS.slice(0, +url.searchParams.get('n') || 60));
    if (p === '/api/judge' && req.method === 'POST') return send(res, 200, await judge(await body(req)));
    if (p === '/api/reviews') return send(res, 200, await reviews(url.searchParams.get('q') || ''));
    if (p === '/api/safety') return send(res, 200, await safetyGate(url.searchParams.get('q') || ''));
    if (p === '/api/idealo/search') {
      const d = await idealo.call('search_products', idealo.searchArgs(url.searchParams));
      // Enrich the top results with the 30-day history (min, avg, series) so the UI can show real lows and a sparkline.
      const eur = v => { const m = String(v || '').replace(/\./g, '').match(/(\d+)(?:,(\d+))?/); return m ? +(m[1] + '.' + (m[2] || '0')) : null; };
      const top = (d.results || []).slice(0, 6);
      await Promise.all(top.map(async r => { try {
        const h = await idealo.call('get_product_price_history', { productRef: r.productRef, country: 'DE' });
        const st = h.priceTrend?.statistics || {}; r.low30d = eur(st.minPrice); r.avg30d = eur(st.avgPrice); r.change30d = st.priceChangePercent;
        r.series = (h.priceTrend?.history || []).map(x => eur(x.price)).filter(Boolean);
      } catch (e) { logCall('Scout', 'idealo get_product_price_history', `No 30-day history for ${r.productRef}: ${String(e.message).slice(0, 120)}`, 0, { error: true }); } }));
      return send(res, 200, d);
    }
    if (p === '/api/plan/resolve' && req.method === 'POST') {
      if (idealo.status() === 'not-connected') return send(res, 200, {});
      const b = await body(req);
      return send(res, 200, await resolvePlan(Array.isArray(b.items) ? b.items.slice(0, 40) : [], idealo.call));
    }
    if (p === '/api/idealo/details') return send(res, 200, await idealo.call('get_product_details', { productRef: url.searchParams.get('ref'), country: 'DE' }));
    if (p === '/api/idealo/offers') return send(res, 200, await idealo.call('get_product_offers', { productRef: url.searchParams.get('ref'), country: 'DE' }));
    if (p === '/api/idealo/history') return send(res, 200, await idealo.call('get_product_price_history', { productRef: url.searchParams.get('ref'), country: 'DE' }));
    if (p === '/api/idealo/tools') return send(res, 200, await idealo.tools());
    if (p === '/auth/idealo') { const to = await idealo.startAuth(`http://localhost:${CB_PORT}/callback`); res.writeHead(302, { Location: to || '/' }); return res.end(); }
    if (p === '/auth/idealo/callback') { await idealo.finishAuth(url.searchParams.get('code')); res.writeHead(302, { Location: '/?idealo=connected' }); return res.end(); }
    // static
    let f = path.join(ROOT, 'public', p === '/' ? 'index.html' : decodeURIComponent(p));
    if (!f.startsWith(path.join(ROOT, 'public')) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end('Not found'); }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' });
    fs.createReadStream(f).pipe(res);
  } catch (e) {
    send(res, 502, { error: String(e.message || e), live: false });
  }
});
http.createServer(async (req, res) => {
  const u = new URL(req.url, 'http://localhost');
  if (u.pathname !== '/callback') { res.writeHead(404); return res.end(); }
  try { await idealo.finishAuth(u.searchParams.get('code')); res.writeHead(302, { Location: `http://localhost:${PORT}/?idealo=connected` }); res.end(); }
  catch (e) { res.writeHead(500, { 'Content-Type': 'text/plain' }); res.end('idealo sign-in failed: ' + e.message); }
}).listen(CB_PORT).on('error', e => console.log(`idealo callback port ${CB_PORT} busy: ${e.message}`));
server.listen(PORT, () => console.log(`Kidealo on http://localhost:${PORT}  ·  Nebius ${NEBIUS_KEY ? 'on' : 'off'} · Tavily ${TAVILY_KEY ? 'on' : 'off'} · idealo ${idealo.status()}`));
