# Demo scripts

- **Pitch slides:** open [`docs/pitch/kidealo-pitch.html`](pitch/kidealo-pitch.html) in any browser. Use ← → or space to move, and F for full screen. Each slide has a one-line **Say** bar to read out.
- **One-minute live demo:** below.
- **Three-minute walkthrough:** further down.

## One-minute live demo

Before you go up: run `npm start`, open http://localhost:8787 full screen, and sign in to idealo once at http://localhost:8787/auth/idealo (the sign-in lasts about an hour).

| Do | Say |
|---|---|
| Home screen: move the mouse over the kids | "Hi, we're Kidealo. Kids outgrow everything every few months, so parents buy in a rush, at whatever the price is that week. In Kidealo you add your children, with their age, sizes and what they own, and it plans their next twelve months." |
| Point at the month strip, then **Buy next** | "Up here is what each child needs, month by month. On the left is what's worth buying right now." |
| Click **First walking shoes, size 21** in Buy next | "When I open an item, our agents go to work. The Scout uses the idealo MCP for live offers and the 30-day price. The Reviewer reads tests and parent reviews with Tavily. The Guardian checks the EU recall database. And the Judge, a live model on Nebius, decides in half a second: buy now, wait, or ask me. It only says wait when a sale has real price proof." |
| Click **Buy with agent**, then **Approve and buy** | "When it's time, the buying agent picks the best shop within my budget, and I approve. It never pays by itself." |
| Close, then click **Aki**'s name card | "And here's Aki's whole year. Plan once, and the agents watch the prices for you." |

Short on time: skip the Buy with agent step and say "A buying agent can buy it for me, but only after I approve."

## Three-minute walkthrough

Before going on stage, run `npm start`, open `http://localhost:8787` full screen, and check that the top-left label says "Live: Nebius · Tavily · idealo".

| Time | Show | Say |
|---|---|---|
| 0:00 | Home: Leo and Aki on the island, with bubbles above them | "Kids outgrow everything every few months. Parents buy in a rush, at whatever the price is that week. Kidealo knows what your kids need next and the best time to buy it." |
| 0:20 | The top strip and the **Buy next** list | "It's Black Friday. Aki is one. Winter is coming and Aki is starting to walk, so these are the things to buy today." |
| 0:35 | Click Aki's **first walking shoes** bubble | The advice box goes from **thinking** to **live**. "This decision is a live Nebius call. The rules only say which actions are allowed. It can never say 'wait' without real price proof." |
| 1:00 | Scroll to the **research table** | "The Reviewer agent searched the web with Tavily: tests, parent reviews, forums. Every row has a link. The EU recall database found no confirmed match." |
| 1:20 | **Agents** tab | "Every call is logged: idealo, Tavily, Nebius, the recall check. Lines marked live are real." |
| 1:35 | Click **Aki**: the timeline | "Aki's next 12 months. The car seat and the balance bike come from Leo, so they're free. The price calendar shows which sales have measured proof. A famous sale name isn't proof." |
| 2:00 | Search "Laufrad" (live idealo, real photos and 30-day charts), click **Details**, then **Buy with agent** | "The agent compares the live idealo offers and picks the best shop. I approve, and the shop's page opens. The agent never pays on its own. I can also say 'buy when it drops to €60'." |
| 2:30 | **Alerts** → Next week | "Each day it re-checks the prices, and alerts me when something changes or a return window is closing." |
| 2:50 | Back to home | "Kidealo: plan once, and the agents watch the prices for you." |

**Messy case for Nebius (live):** open a safety item such as Leo's **Car seat 100–150 cm**. Nebius answers **Ask parent** (90%) because it needs Leo's current height, a safety-critical fact a parent can give in a second. Then click **Buy with agent**: the steps show the live idealo offer (baby-walz.de, €118.99, 14 days free returns), the live research verdict and the Nebius decision.

**Product page sections:** *Our advice* (Nebius decision, one line), *Price* (live 30-day chart, auto-buy), *When to buy* (today's proven sale, next proven sale, need date), *Other options on idealo* (ranked by parent rating, then price; **Choose** swaps the product in the same pop-up and re-runs the decision and reviews for it), *Reviews and tests* (summary, parents like / watch out for, sources grouped as Expert tests, Reviews, Parent discussions, Guides, Safety).

**If something breaks:** the app falls back to demo data by itself. Say "this is the demo snapshot" and carry on.
