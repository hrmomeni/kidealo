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

To use live idealo data, open `http://localhost:8787/auth/idealo` once and sign in. Any partner without a key falls back to demo data. The UI shows which lines are **live** and which are **demo**.

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

Routine case: winter boots during Black Friday, near the 30-day low → Buy now.
Messy case: an item that needs fitting with an unknown size, or reviews that conflict → Ask parent.

## Purchasing

The idealo MCP has no checkout tool. Kidealo's Buyer agent picks the best offer (price, shop rating, delivery, free returns). The parent approves, and Kidealo opens that shop's page from idealo to finish checkout. Auto-buy only *prepares* the order when the price reaches the limit. It never pays on its own.

## Tests

```bash
npm test   # the six Deal Calendar spec cases plus the guardrail tests
```
