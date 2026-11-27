# Norma in Kidealo

Kidealo is written by several authors: the team and its coding agents. Every author uses the same Norma setup: the Norma MCP server (`.mcp.json`), the skills in `.claude/skills/norma-*` and the rules in `AGENTS.md`. Norma links the repository as `hrmomeni/kidealo` (repository id 12746).

## Our policy (team rules from `AGENTS.md`)

- API keys only in the server environment (`.env`). Never in `public/` or in the repo.
- Partner APIs (Nebius, Tavily, idealo) are only called from `server.mjs` or `lib/`, never from the browser.
- Every outgoing `fetch` has a timeout (`AbortSignal.timeout`).
- The model never chooses an action outside `allowedActions()`. Keep `guardDecision()` in the path.
- No new runtime dependencies without a reason in the PR description.

Norma checks each change with these rulesets: JavaScript Norma Agent, Node.js Norma Agent, Secrets Norma Agent, Prompts Analysis and Agentic Rules Analyzer. The org "Policies" ruleset has no generated rules yet, so the team rules above are enforced through `AGENTS.md` and the agents' loop.

## Loop for every author

1. Start of task: `get_rulesets`, `get_rules_for_ruleset`, `get_open_issues`.
2. After each changed file: `live_check`, fix, repeat.
3. Before commit, push or PR: `live_check` on all changed files (`norma-check-before-commit`).
4. After the task: `register_applied_actions` with the exact rule IDs.

## Pull requests

Every pull request was checked by the Norma GitHub App (`norma-by-quality-clouds[bot]`), which comments its result on the PR.

| PR | Author | Branch | Norma result | State |
|---|---|---|---|---|
| #1 | Claude Code (integration agent) | `norma/setup` | No issues introduced | merged |
| #2 | Claude Code (Norma fixer agent) | `claude/norma-fixes-325b3c` | No issues introduced (8 pre-existing in touched files) | merged |
| #3 | subhinlee (second GitHub account) | `subhin/norma-live-plan-errors` | No issues introduced | merged |
| #4 | Claude Code (Norma fixer agent) | `claude/norma-docs` | docs only | merged |
| #5 | Claude Code (integration agent) | `claude/ui-warm-theme` | No issues introduced | merged |
| #6 | Claude Code (Norma fixer agent) | `claude/norma-final` | No issues introduced | merged |
| #7 | Claude Code (integration agent) | `claude/ranked-alternatives` | **1 Medium finding** (Scalability, sequential await in a loop, `server.mjs`), fixed in the same PR, re-check clean | merged |
| #8 | Claude Code (Norma fixer agent) | `claude/norma-final` | docs only | merged |
| #9 | Claude Code (integration agent) | `claude/appbar-align` | No issues introduced | merged |
| #10 | Claude Code (integration agent) | `claude/product-page-clarity` | No issues introduced | merged |

## Findings fixed: 11 in total

| Rule | Severity | File | Count | PR |
|---|---|---|---|---|
| `js-empty-catch-block-1.0` | HIGH | `server.mjs` | 2 | #2 |
| `js-empty-catch-block-1.0` | HIGH | `lib/plan.mjs` | 3 | #2 |
| `js-empty-catch-block-1.0` | HIGH | `public/live-plan.js` | 2 | #3 |
| `js-mnt-double-negation-1.0` | LOW | `server.mjs` | 2 | #6 |
| `js-console-log-only-1.0` | LOW | `server.mjs` | 1 | #6 |
| Sequential await of independent calls in a loop (Scalability) | MEDIUM | `server.mjs` | 1 | #7 |

- **Empty catch blocks**: failures are now reported, not swallowed. In `server.mjs` they show up in the Agents feed (`logCall` with `error: true`). In `lib/plan.mjs` and `public/live-plan.js` they go to `console.warn`, and the demo prices stay.
- **PR #7**: the Norma GitHub App flagged the 3 price-history calls for ranked alternatives as running one after another. They now run together with `Promise.all` (3 calls, within idealo's burst limit of 6); Norma's re-check on the PR was clean.
- **PR #6**: `!!KEY` became `Boolean(KEY)` in `/api/status`, and the callback-port message now uses `console.warn`.
- **Team rule "every outgoing call has a timeout"** (matches Norma rule `resilience-timeout-retry-1.0`), in PR #2: the idealo MCP client (`lib/idealo.mjs`) passes a 20 s timeout to `connect`, `listTools` and `callTool`. The Nebius, Tavily and Safety Gate `fetch` calls already used `AbortSignal.timeout`.

**Proof (`live_check` on current `main` plus PR #6):** `lib/plan.mjs`, `lib/rules.mjs` and `public/live-plan.js` are clean. `server.mjs` and `lib/idealo.mjs` only report the accepted `js-mng-loopback-url-1.0` below.

## Finding left in place on purpose

- **Rule:** `js-mng-loopback-url-1.0` (HIGH)
- **Files:** `lib/idealo.mjs` (`redirectUrl`) and `server.mjs` (idealo sign-in redirect and callback)
- **Reason:** idealo's OAuth only accepts registered redirect URIs, and its guide registers `http://localhost:6274/callback`. The app runs on the presenter's laptop for the demo, so this loopback URL is the correct value, not leftover development config. The port can already be changed with `IDEALO_CALLBACK_PORT`. Changing the host would break the idealo sign-in during the demo.

## `public/index.html`

`public/index.html` (the single-file three.js front end, about 148 KB) is larger than the 64 KB a multi-file `live_check` call can carry, so it is checked on its own call. Result: **clean**. For an `.html` file Norma applies only its Angular and Vite rulesets, not the JavaScript ruleset, so the inline script is not checked against the JavaScript rules. The Norma GitHub App does check it on every PR that changes it, for example PR #5.

## How the policy kept authors consistent

All authors (two agents and a second GitHub account) worked from the same `AGENTS.md`, so the rules did not depend on which agent wrote the code. Example: the integration agent wrote "Every outgoing `fetch` has a timeout" into `AGENTS.md` in PR #1. The fixer agent, a different author in a different session, found the one outgoing call path without a deadline (idealo MCP in `lib/idealo.mjs`) and gave it the same kind of timeout the other partner calls already had. In the same way, every PR follows the `<author>/<topic>` branch rule, run `npm test` before the PR, and records the exact Norma rule IDs it fixed or accepted. When subhinlee's agent could not run `live_check` itself (PR #3), the fixer agent ran it on that PR's file before the merge. The result was clean.
