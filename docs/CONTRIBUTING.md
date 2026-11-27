# Working on Kidealo

This guide gets a teammate from clone to their first change in about 5 minutes. **Deadline: submissions close at 19:45 CET, 27 Nov 2026.**

## 1. Run it

```bash
git clone https://github.com/hrmomeni/kidealo.git
cd kidealo
npm install
cp .env.example .env    # ask the team for NEBIUS_API_KEY and TAVILY_API_KEY
npm start               # http://localhost:8787
```

- No keys? The app still runs. Everything falls back to demo data, and the UI marks live and demo lines.
- To get live idealo data, open `http://localhost:8787/auth/idealo` once and sign in with an idealo account (free). idealo only accepts the return address `http://localhost:6274/callback`, so the server also listens on port 6274. Tokens are saved in `.idealo-auth.json`, which git ignores.
- Run the tests with `npm test`. They cover the Deal Calendar rules and the guardrails.

## 2. Where things are

```
server.mjs            HTTP server: static files + /api/* (Nebius judge, Tavily reviews, Safety Gate, idealo proxy, call log)
lib/rules.mjs         Deal Calendar rules: advise(), allowedActions(), guardDecision(), SEASONS
lib/idealo.mjs        idealo MCP client (Streamable HTTP + OAuth)
public/index.html     The whole front end: CSS, HTML and JS in one file (three.js r128)
public/vendor/        three.min.js (bundled so the demo works on bad wifi)
test/                 node --test
docs/                 This guide, architecture, demo script, partner notes, task list
```

### Front end map (`public/index.html`)
The sections are marked with `/* ---------- name ---------- */` comments.

| Section | What to change there |
|---|---|
| `<style>` at the top | Colours (`:root` tokens), fonts, every panel and button. **Start here for UI work.** |
| `seasons` | Sale seasons with their price-proof labels and sources (copied from `lib/rules.mjs`) |
| `decision rules` | `advise()` (a front-end copy of the server rules) |
| `family` | Demo children (`KIDS`), their items and `rec` review data, `DISCOVER` picks |
| `three.js world` | `makeKid()` characters, `token()` 3D item models, `picCanvas()` picture cards, `buildHome()`, `buildTimeline()` |
| `UI` | `openItem()` (item pop-up), `renderCal()` (price calendar), `renderAlerts()`, `simulate()`, `openAdd()` (add a child) |
| `research table`, `agent feed` | Demo research rows and the Agents drawer |
| `agent purchase` | `agentBuy()`, the 4-step buy flow and approval |
| `search` | Demo `CATALOG`; live idealo search when signed in |
| `live backend` | `initLive()`, `liveJudge()` (Nebius), `liveResearch()` (Tavily + Safety Gate), `pollCalls()` |

### API

| Endpoint | What it does |
|---|---|
| `GET /api/status` | Which partners are live |
| `POST /api/judge` `{facts}` | Rules work out the allowed actions, Nebius picks one, the guardrails check it. Returns `{action, confidence, reason, missing_evidence, allowed, model, ms}` |
| `GET /api/reviews?q=` | Tavily search, plus a Nebius summary when a key is set. Returns `{verdict, pros, cons, rows[]}` |
| `GET /api/safety?q=` | Checks recent EU Safety Gate alerts. Returns `no_confirmed_match` or `needs_checking` |
| `GET /api/idealo/search?q=&max=` · `/details?ref=` · `/offers?ref=` · `/history?ref=` | idealo MCP tools |
| `GET /api/calls` | The live call log shown in the Agents tab |

## 3. Git rules for today

- We are entering the Norma challenge, so **merge through pull requests**. See `AGENTS.md` for the Norma loop every author follows.
- **Norma challenge:** it needs at least 2 merged PRs from different authors, checked by the Norma GitHub App, and at least 1 fixed finding. If we enter, teammates open small PRs instead of pushing directly. See `docs/PARTNER-NOTES.md`.
- Never commit `.env` or `.idealo-auth.json`.

## 4. Open tasks
See `docs/TASKS.md`. Put your name on a task before you start it.
