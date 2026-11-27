// Deal Calendar rules (team spec, 27 Nov 2026).
// The rules decide which actions are ALLOWED. A live Nebius call then chooses one of them
// (Nebius challenge: a live model call makes the decision). Guardrail: no WAIT without measured price proof.

export const SEASONS = [
  { id: 'bf2026', name: 'Black Friday', start: '2026-11-27', end: '2026-11-27', categories: ['all'], label: 'price_proof', effect: 'good' },
  { id: 'lego-n26', name: 'LEGO November', start: '2026-11-01', end: '2026-11-30', categories: ['lego'], label: 'price_proof', effect: 'good' },
  { id: 'wsv2027', name: 'Winter sale', start: '2027-01-25', end: '2027-02-07', categories: ['clothing', 'shoes'], label: 'date_only', estimated: true },
  { id: 'easter27', name: 'Easter', start: '2027-03-28', end: '2027-03-28', categories: ['clothing'], label: 'no_proof' },
  { id: 'lego-m27', name: 'LEGO May', start: '2027-05-01', end: '2027-05-31', categories: ['lego'], label: 'price_proof', effect: 'weak' },
  { id: 'lego-n27', name: 'LEGO November', start: '2027-11-01', end: '2027-11-30', categories: ['lego'], label: 'price_proof', effect: 'good', estimated: true },
  { id: 'bf2027', name: 'Black Friday', start: '2027-11-26', end: '2027-11-26', categories: ['all'], label: 'price_proof', effect: 'good', estimated: true },
];

export const dn = iso => { const [y, m, d] = iso.split('-').map(Number); return Date.UTC(y, m - 1, d) / 864e5; };

const isProof = (s, cat) => s.label === 'price_proof' && s.effect === 'good' && (s.categories.includes('all') || s.categories.includes(cat));

/** Spec section 5: first matching rule wins. */
export function advise(it, today) {
  const left = dn(it.need) - dn(today), nearLow = it.now <= it.low30d * 1.05;
  if (left <= 14) return { action: 'BUY_NOW', rule: 1 };
  if (it.now <= it.target) return { action: 'BUY_NOW', rule: 2 };
  const act = SEASONS.find(s => isProof(s, it.category) && dn(today) >= dn(s.start) && dn(today) <= dn(s.end));
  if (act && left <= 90 && nearLow) return { action: 'BUY_NOW', rule: 3, season: act.id };
  const later = SEASONS.find(s => isProof(s, it.category) && dn(s.start) > dn(today) && dn(s.end) <= dn(it.need) - 14);
  if (later) return { action: 'WAIT', rule: 4, season: later.id };
  if (left <= 90 && nearLow) return { action: 'BUY_NOW', rule: 5 };
  return { action: 'WATCH', rule: 6 };
}

/** Which actions the model may choose. facts: {category, need, today, now, low30d, target} */
export function allowedActions(f) {
  if (f.now == null || f.need == null) return ['WATCH', 'ASK_PARENT'];
  const left = dn(f.need) - dn(f.today), nearLow = f.now <= f.low30d * 1.05;
  const act = SEASONS.some(s => isProof(s, f.category) && dn(f.today) >= dn(s.start) && dn(f.today) <= dn(s.end));
  const later = SEASONS.some(s => isProof(s, f.category) && dn(s.start) > dn(f.today) && dn(s.end) <= dn(f.need) - 14);
  const out = [];
  if (left <= 14 || f.now <= f.target || (left <= 90 && nearLow) || (act && nearLow)) out.push('BUY_NOW');
  if (later && left > 14) out.push('WAIT');
  out.push('WATCH', 'ASK_PARENT');
  return out;
}

/** Enforce the guardrails on whatever the model returned. */
export function guardDecision(d, allowed, facts) {
  let action = String(d?.action || '').toUpperCase().replace(/\s+/g, '_');
  let reason = String(d?.reason || '').slice(0, 300);
  let overridden = false;
  if (!allowed.includes(action)) {
    action = advise({ ...facts }, facts.today).action;
    if (!allowed.includes(action)) action = 'WATCH';
    reason = `${reason} (Guardrail: the model's choice was not allowed, so the rule result was used.)`.trim();
    overridden = true;
  }
  const confidence = Math.max(0, Math.min(1, Number(d?.confidence) || 0.5));
  return { action, confidence, reason, missing_evidence: Array.isArray(d?.missing_evidence) ? d.missing_evidence.slice(0, 4) : [], overridden };
}
