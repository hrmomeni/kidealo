# Kidealo

**Kidealo knows what your kids will need next, and the best time to buy it.**

Built at the Agentic Hackathon Berlin, 27 Nov 2026 (Black Friday).

You add your children: age, sizes and what they already own. Kidealo plans the next 12 months for each child, for example winter boots in the next size, a first bike in spring, or a Kita backpack in August. Agents then watch prices, read the reviews and check for recalls. For each item Kidealo says **Buy now**, **Wait**, **Watch** or **Ask parent**, with one reason and a source. Hand-downs from an older sibling cost €0. Parents can let an agent buy once the price drops below their limit, and they always approve the purchase first.

## Run it

```bash
npm install
cp .env.example .env   # add NEBIUS_API_KEY and TAVILY_API_KEY
npm start              # http://localhost:8787
```

To use live idealo data, open `http://localhost:8787/auth/idealo` once and sign in. The idealo MCP login is a **separate idealo developer account** (email and password, created on that page). Google sign-in doesn't work there. Any partner without a key falls back to demo data, and the UI marks which lines are **live** and which are **demo**.

Teammates on the same wifi can open the app at `http://<your-laptop-ip>:8787` (find the IP with `ipconfig getifaddr en0` on macOS).

## Status (27 Nov, 18:50)

| Part | State |
|---|---|
| idealo MCP | **Live.** Search, offers and 30-day history. All 14 planned items resolve to real products, cached for 6 hours in `data/plan-cache.json`. |
| Nebius | **Live.** Judge on `nvidia/Nemotron-3_5-Lightning` with thinking off, about 0.4–0.7 s per decision; `openai/gpt-oss-120b` as fallback. |
| Tavily | **Live.** Research table with source links, summarised by Nebius. |
| EU Safety Gate | **Live.** Checks recent alerts; no key needed. |
| Norma | In progress: PR #1 (setup) is open, and the fixer agent's PR #2 is coming. |
| Affinidi Boris | Not built. The purchase flow says so honestly. |
| Sample data | The family (Leo and Aki), their needs, and alerts in the future (via "Next day"). |

## Agents and partners

| Agent | What it decides | Partner |
|---|---|---|
| Scout | Product search, offers and the 30-day price history | **idealo MCP** (`search_products`, `get_product_offers`, `get_product_price_history`) |
| Reviewer | Finds reviews, tests and parent forums, then summarises them with sources | **Tavily** search + **Nebius** |
| Guardian | Checks for recalls | EU Safety Gate public API |
| Judge | The final action for each item, as JSON with a confidence and the missing evidence | **Nebius Token Factory** (live call) |
| Buyer | Prepares the order from the best offer; the parent approves | idealo offer link (`relocatorUrl`) |

## How a decision is made (Nebius "Evidence to Action")

1. `lib/rules.mjs` applies the team's Deal Calendar rules and works out the **allowed actions**. **Wait** is only allowed when a past sale season has measured price proof, such as idealo's Black Friday study or Brickfact data for LEGO.
2. A **live Nebius call** chooses one of the allowed actions and writes the reason (`POST /api/judge`). It can answer **Ask parent** when a fact is missing.
3. `guardDecision` enforces the guardrails. If the model picks an action that isn't allowed, the rule result is used and the UI shows "guardrail applied".
4. Every call is logged and shown live in the **Agents** tab (`GET /api/calls`).

Routine case (live): Aki's first walking shoes on Black Friday, near the 30-day low → **Buy now**, 95%.
Messy case (live): Leo's car seat for 100–150 cm → **Ask parent**, 90%: "parent needs to confirm Leo's current height".

## Product page

- **Our advice:** the live Nebius decision in one line, with timing and confidence.
- **Price:** the live 30-day chart from idealo, and auto-buy at your price.
- **When to buy:** today's proven sale, the next proven sale, and the need date.
- **Other options on idealo:** the top 5, ranked by parent rating and number of reviews, then price. **Choose** swaps the product in place, and the decision, price history and reviews reload for that exact product.
- **Reviews and tests:** a Tavily search summarised by Nebius, grouped under headings (expert tests, reviews, parent discussions, guides) plus the EU recall check.

## Purchasing

The idealo MCP has no checkout tool. Kidealo's Buyer agent picks the best offer (price, shop rating, delivery, free returns). The parent approves, and Kidealo opens that shop's page from idealo to finish checkout. Auto-buy only *prepares* the order when the price reaches the limit. It never pays on its own.

## Team docs

- [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md): setup, code map, API, git rules
- [docs/TASKS.md](docs/TASKS.md): who is doing what before 19:45
- [docs/DEMO.md](docs/DEMO.md): the 3-minute demo script
- [docs/PARTNER-NOTES.md](docs/PARTNER-NOTES.md): notes to paste into the submission (Nebius, idealo, Tavily, Norma, Boris)

## Tests

```bash
npm test   # the six Deal Calendar spec cases plus the guardrail tests
```
