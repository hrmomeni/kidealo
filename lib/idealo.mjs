// idealo MCP client (Streamable HTTP + self-service OAuth).
// Open http://localhost:8787/auth/idealo once to sign in; tokens are stored in .idealo-auth.json (git-ignored).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const STORE = path.join(ROOT, '.idealo-auth.json');
const SERVER = new URL(process.env.IDEALO_MCP_URL || 'https://mcp.idealo.com/mcp');
let log = () => {};
export const setLogger = f => { log = f; };

const read = () => { try { return JSON.parse(fs.readFileSync(STORE, 'utf8')); } catch { return {}; } };
const write = patch => fs.writeFileSync(STORE, JSON.stringify({ ...read(), ...patch }, null, 2));

let redirectUrl = 'http://localhost:8787/auth/idealo/callback';
let pendingAuthUrl = null;
const provider = {
  get redirectUrl() { return redirectUrl; },
  get clientMetadata() {
    return { client_name: 'Kidealo (hackathon demo)', redirect_uris: [redirectUrl], grant_types: ['authorization_code', 'refresh_token'], response_types: ['code'], token_endpoint_auth_method: 'none' };
  },
  clientInformation: () => read().client,
  saveClientInformation: c => write({ client: c }),
  tokens: () => read().tokens,
  saveTokens: t => write({ tokens: t }),
  redirectToAuthorization: u => { pendingAuthUrl = u.toString(); },
  saveCodeVerifier: v => write({ verifier: v }),
  codeVerifier: () => read().verifier,
  saveDiscoveryState: s => write({ discovery: s }),
  discoveryState: () => read().discovery,
  invalidateCredentials: scope => { const s = read(); if (scope === 'all' || scope === 'tokens') delete s.tokens; if (scope === 'all' || scope === 'client') delete s.client; fs.writeFileSync(STORE, JSON.stringify(s, null, 2)); },
};

let client = null, transport = null, state = read().tokens ? 'signed-in' : 'not-connected';
export const status = () => state;

async function connect() {
  if (client) return client;
  transport = new StreamableHTTPClientTransport(SERVER, { authProvider: provider });
  const c = new Client({ name: 'kidealo', version: '0.1.0' });
  await c.connect(transport);
  client = c; state = 'connected';
  return c;
}

export async function startAuth(cb) {
  redirectUrl = cb; pendingAuthUrl = null; client = null;
  try { await connect(); return '/?idealo=connected'; }
  catch (e) { if (pendingAuthUrl) { state = 'signing-in'; return pendingAuthUrl; } throw e; }
}
export async function finishAuth(code) {
  await transport.finishAuth(code);
  client = null; await connect();
  log('Scout', 'idealo MCP', 'Signed in to idealo. Live search, offers and price history are on.', 0);
}

export async function tools() { const c = await connect(); return (await c.listTools()).tools.map(t => ({ name: t.name, description: t.description, input: t.inputSchema })); }

export function searchArgs(sp) {
  const a = { query: sp.get('q') || '', country: 'DE' };
  if (sp.get('max')) a.filters = { maxPrice: +sp.get('max') };
  return a;
}

export async function call(name, args) {
  if (state === 'not-connected' && !read().tokens) throw new Error('idealo not connected: open /auth/idealo');
  const c = await connect();
  const t0 = Date.now();
  const r = await c.callTool({ name, arguments: args });
  const ms = Date.now() - t0;
  let data = r.structuredContent;
  if (!data) { const txt = (r.content || []).map(x => x.text || '').join('\n'); try { data = JSON.parse(txt); } catch { data = { text: txt }; } }
  const what = name === 'search_products' ? `"${args.query}": ${(data.results || data.products || []).length} products` : `${name} done`;
  log('Scout', `idealo ${name}`, what + (r.isError ? ' (error)' : ''), ms);
  if (r.isError) throw new Error(JSON.stringify(data).slice(0, 300));
  return data;
}
