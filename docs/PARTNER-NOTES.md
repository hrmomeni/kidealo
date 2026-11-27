# Partner notes (paste into the submission)

## Nebius: "Evidence to Action" (model-and-use note)
- **Models:** Nebius Token Factory, OpenAI-compatible API at `https://api.tokenfactory.nebius.com/v1/`. Kidealo tries the models in `NEBIUS_MODELS` in order. Default: `nvidia/Nemotron-3_5-Lightning` with thinking off (about 0.4–0.8 s), then `openai/gpt-oss-120b` with low reasoning effort as the fallback.
- **Where the model decides:** `POST /api/judge` (`server.mjs`).
  1. `lib/rules.mjs` computes the allowed actions from the evidence: need date, price now, 30-day low, target, and sale seasons with measured price proof.
  2. A **live Nebius call in JSON mode** chooses one of BUY_NOW, WAIT, WATCH or ASK_PARENT, and returns a confidence, a reason and the missing evidence.
  3. `guardDecision()` rejects any action that isn't allowed. The UI then shows "guardrail applied".
- **Also used:** the Reviewer summarises the Tavily sources into a verdict, pros, cons and one row per source.
- **Routine case (tested live):** Aki's first walking shoes on Black Friday, near the 30-day low, needed in 44 days → BUY_NOW, confidence 0.95, 491 ms.
- **Messy case (tested live):** winter boots where the shoe size is unknown (last measured 4 months ago) and the reviews conflict ("half say runs small, half say runs large") → ASK_PARENT, confidence 0.85, `missing_evidence: ["current shoe size"]`.
- **Proof:** the Agents tab (`/api/calls`) logs every call with the model and latency. The Token Factory Usage tab shows the same calls.

## idealo
- **MCP tools used:** `search_products`, `get_product_offers`, `get_product_price_history`, `get_product_details`. OAuth uses `localhost:6274/callback`.
- **What idealo wouldn't expect:** a family timeline that turns price data into "what will my child need next, and when is it a good time to buy it", plus hand-downs between siblings and an agent that prepares the purchase.
- **Purchase:** the MCP has no checkout. The Buyer agent picks the best offer and opens its `relocatorUrl` after the parent approves.

## Tavily
Each item's review research: `/api/reviews`, `search_depth: basic`, 5 sources, `include_answer`.

## Norma
- Sign up at `norma.qualityclouds.com?ref=agentic-berlin`. One sign-up per team.
- Name the workspace after the team and add a Norma policy.
- Add the Norma MCP (`https://api.qualityclouds.ai/mcp`) to every coding agent.
- Requirements: at least 2 PRs from different authors, checked by the Norma GitHub App, and at least 1 fixed finding.
- Submit: `DEFENCE.md` and a demo video of 2 minutes or less.

## Affinidi Boris (optional)
The plan is a `gifter` role for grandparents: they get `suggest_gift`, while `purchase_history`, `family_budget` and `place_order` are hidden; PII is masked and injections are screened. Not built yet.
