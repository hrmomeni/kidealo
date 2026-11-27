# Kidealo submission texts (paste-ready)

Deadline: 19:45 CET, 27 Nov 2026. One captain submits for the team.
Repo: https://github.com/hrmomeni/kidealo
Fill in every `[TEAM: ...]` placeholder before pasting.

---

## 1. Name, tagline, description

**Project name:** Kidealo

**Tagline:** Kidealo knows what your kids will need next, and the best time to buy it.

**Description (100 words):**
Kids outgrow shoes, coats and car seats every few months. Parents buy in a rush, at whatever the price is that week. Kidealo plans the next 12 months for each child from age, sizes and what they already own. Agents watch prices on idealo, read reviews and tests, and check for recalls. For each item Kidealo says Buy now, Wait, Watch or Ask parent, with one reason and a source. Hand-downs from an older sibling cost nothing. A parent can set a price limit; an agent then prepares the order, and the parent always approves it. Built today, on Black Friday, in Berlin.

---

## 2. How it works (5 bullets)

- **Agents:** Scout (idealo search, offers, 30-day price history), Reviewer (tests, reviews, parent forums), Guardian (EU Safety Gate recall check), Judge (final action per item), Buyer (prepares the order).
- **Partners:** idealo MCP for product, offer and price-history data. Tavily for review research with sources. Nebius Token Factory for the decision and the review summary.
- **Live Nebius decision:** `lib/rules.mjs` works out which actions are allowed. A live Nebius call (`POST /api/judge`, JSON mode) picks one of Buy now, Wait, Watch or Ask parent and returns a confidence, a reason and the missing evidence.
- **Guardrails:** `guardDecision` rejects any action that is not allowed. "Wait" needs measured price proof from a past sale season. If the model breaks a rule, the rule result is used and the UI shows "guardrail applied". Every call is logged in the Agents tab.
- **Agent purchase with parent approval:** the idealo MCP has no checkout. The Buyer picks the best offer (price, shop rating, delivery, free returns). The parent approves, then the shop page opens from idealo. Auto-buy only prepares the order at the price limit. It never pays on its own.

---

## 3. Per-challenge entries

### idealo: Most Creative Use of the idealo MCP

**Why it is something idealo did not expect.**
Most price tools answer "where is this product cheapest today". Kidealo answers "what will my child need next, and when should I buy it". It turns price data into a family timeline: next 12 months per child, with hand-downs between siblings, and an agent that prepares the purchase when the price reaches the parent's limit.

**Use of the data.**
- `search_products` finds the product (live search, e.g. "Laufrad").
- `get_product_offers` gives the offers the Buyer compares (price, shop rating, delivery, free returns).
- `get_product_price_history` gives the 30-day price history. Price now against the 30-day low and the target decides Buy now or Watch. "Wait" is only allowed when a past sale season has measured price proof.
- `get_product_details` fills in the item data.
- Lines in the UI are marked live or demo, so judges can see which data is real.

**Creativity.** A product search becomes a plan for a child's year. A sale name alone is not proof; a measured price is.

**Meaningful.** Parents buy sizes and gear on a deadline, kids outgrow it fast, and prices swing around sales. The tool saves money and stops duplicate buying (hand-downs cost EUR 0).

**Execution.** Working prototype: home view with both children, item advice, research table with links, timeline, live idealo search, Buy with agent, alerts.

### Nebius: Evidence to Action (model-and-use note)

- **Models:** Nebius Token Factory, OpenAI-compatible API at `https://api.tokenfactory.nebius.com/v1/`. Kidealo tries the models in `NEBIUS_MODELS` in order. Default: `nvidia/Nemotron-3_5-Lightning` with thinking off (about 0.4 to 0.8 s). Fallback: `openai/gpt-oss-120b` with low reasoning effort.
- **Where the call decides:** `POST /api/judge` in `server.mjs`.
  1. `lib/rules.mjs` computes the allowed actions from the evidence: need date, price now, 30-day low, target, and sale seasons with measured price proof.
  2. A live Nebius call in JSON mode chooses BUY_NOW, WAIT, WATCH or ASK_PARENT, and returns a confidence, a reason and the missing evidence.
  3. `guardDecision()` rejects any action that is not allowed. The UI then shows "guardrail applied". The action is not hard-coded.
- **Also used:** the Reviewer summarises the Tavily sources into a verdict, pros, cons and one row per source.
- **Routine case (tested live):** Aki's first walking shoes on Black Friday, near the 30-day low, needed in 44 days. Result: BUY_NOW, confidence 0.95, 491 ms.
- **Messy case (tested live):** winter boots where the shoe size is unknown (last measured 4 months ago) and the reviews conflict ("half say runs small, half say runs large"). Result: ASK_PARENT, confidence 0.85, `missing_evidence: ["current shoe size"]`.
- **How the calls are shown:** the Agents tab (`GET /api/calls`) logs every call with the model and latency. The Token Factory Usage tab shows the same calls. The video shows both.

### Tavily usage (builder credits; not a challenge entry)

The Reviewer agent calls Tavily search for each item through `/api/reviews`: `search_depth: basic`, 5 sources, `include_answer`. Nebius turns the sources into a verdict, pros, cons and one row per source, each with a link. Tavily calls appear in the Agents tab. Mention Tavily in the description of the idealo and Nebius entries; do not enter it as a challenge.

### Affinidi Boris: NOT ENTERED unless finished

Missing: nothing is built. The plan is a `gifter` role for grandparents: they get `suggest_gift`, while `purchase_history`, `family_budget` and `place_order` are hidden; PII is masked and injections are screened. To enter, the team needs a Boris project, the gifter role live, and one demo of a blocked tool. Not built: **skip this entry.**

### Norma: NOT ENTERED unless finished

Missing (check each):
- Sign-up through `norma.qualityclouds.com?ref=agentic-berlin`, one per team, workspace named after the team.
- A Norma policy in that workspace.
- Norma MCP (`https://api.qualityclouds.ai/mcp`) connected to every coding agent.
- At least 2 PRs from different authors, checked by the Norma GitHub App.
- At least 1 finding fixed.
- A short written note (60 of 100 points are for the explanation; it must say which finding was left in place and why).
- Demo video of 2 minutes or less.

Not confirmed in the repo that any of this is done. If any item is missing at 19:15, skip it.

---

## 4. Two-minute video script

Setup: `npm start`, open `http://localhost:8787` full screen. The top-left label must say "Live: Nebius · Tavily · idealo". Record the screen with voice.

| Time | Shot | Say |
|---|---|---|
| 0:00-0:12 | Home: Leo and Aki on the island | "Kids outgrow everything every few months. Parents buy in a rush, at any price. Kidealo knows what your kids need next and the best time to buy it." |
| 0:12-0:25 | Buy next list | "It's Black Friday. Aki is one and starting to walk. These are the things to buy today." |
| 0:25-0:50 | Click Aki's first walking shoes; advice goes from thinking to live | "This decision is a live Nebius call. The rules only say which actions are allowed. It cannot say wait without real price proof. Result: Buy now, confidence 0.95." |
| 0:50-1:10 | Messy case: winter boots, unknown size, conflicting reviews | "Here the size is four months old and reviews conflict. The model answers Ask parent and lists the missing evidence: current shoe size." |
| 1:10-1:25 | Research table, then Agents tab | "Tavily found tests and parent reviews; every row has a link. Every call is logged with model and latency. Live lines are real." |
| 1:25-1:40 | Click Aki: timeline | "Aki's next 12 months. The car seat and balance bike come from Leo, so they cost zero." |
| 1:40-1:55 | Search "Laufrad", Buy with agent, approve | "Live idealo offers. The agent picks the best shop. I approve and the shop page opens. It never pays on its own." |
| 1:55-2:00 | Home | "Kidealo: plan once, and the agents watch the prices." |

Fallback: if a partner fails, the app uses demo data. Say "this is the demo snapshot" and go on. Optional: show the Token Factory Usage tab for 3 seconds at 1:20.

---

## 5. Captain checklist before 19:45

- [ ] Latest code pushed to `main`; repo opens in a private window: https://github.com/hrmomeni/kidealo
- [ ] `npm install && npm start` works from a fresh clone; `npm test` passes
- [ ] `.env` and API keys are NOT in the repo
- [ ] Video recorded, 2 minutes or less, uploaded, link opens without login
- [ ] Nebius model-and-use note pasted (section 3), with both live-tested cases
- [ ] idealo entry pasted (section 3)
- [ ] Token Factory Usage tab shows the test calls (screenshot saved)
- [ ] Norma and Affinidi: enter only if finished (see section 3); otherwise leave them out
- [ ] Sharing box ticked or not, as the team agreed (entering a challenge shares the submission and team names with that partner's judges)
- [ ] Team member names spelled correctly: [TEAM: names]
- [ ] Submission sent on aiagentsberlin.xyz by 19:45; save the confirmation
- [ ] Laptop charged, app running, ready for demos at 20:00
