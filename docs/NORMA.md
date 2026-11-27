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

| PR | Author | Branch |
|---|---|---|
| #1 | Claude Code (integration agent) | `norma/setup` |
| #2 | Claude Code (Norma fixer agent) | `claude/norma-fixes-325b3c` |

The Norma GitHub App (`norma-by-quality-clouds[bot]`) checked both pull requests and found no issues introduced. On PR #2 it also counted 8 issues that already existed in the touched files: the findings left in place below.

## Findings fixed (PR #2)

- **`js-empty-catch-block-1.0` (HIGH)**: 5 open issues fixed in `server.mjs` (2) and `lib/plan.mjs` (3). Failures are now reported, not swallowed. In `server.mjs` they show up in the Agents feed (`logCall` with `error: true`), and in `lib/plan.mjs` they go to `console.warn`. A `live_check` after the change reports `lib/plan.mjs` clean and no empty catch in `server.mjs`.
- **Team rule "every outgoing call has a timeout"** (matches Norma rule `resilience-timeout-retry-1.0`): the idealo MCP client (`lib/idealo.mjs`) now passes a 20 s timeout to `connect`, `listTools` and `callTool`. Before, a hanging idealo call held the request without a limit. The Nebius, Tavily and Safety Gate `fetch` calls already used `AbortSignal.timeout`.

## Finding left in place on purpose

- **Rule:** `js-mng-loopback-url-1.0` (HIGH)
- **Files:** `lib/idealo.mjs` (`redirectUrl`) and `server.mjs` (idealo sign-in redirect and callback)
- **Reason:** idealo's OAuth only accepts registered redirect URIs, and its guide registers `http://localhost:6274/callback`. The app runs on the presenter's laptop for the demo, so this loopback URL is the correct value, not leftover development config. The port can already be changed with `IDEALO_CALLBACK_PORT`. Changing the host would break the idealo sign-in during the demo.

## Left for the next author

These findings are still open, so another author's PR can fix them under the same rules:

- `js-empty-catch-block-1.0` in `public/live-plan.js` (lines 3 and 29)
- `js-mnt-double-negation-1.0` in `server.mjs` (`!!NEBIUS_KEY`, `!!TAVILY_KEY`)
- `js-console-log-only-1.0` in `server.mjs`

`public/index.html` (the single-file three.js front end, about 135 KB) is above the 64 KB limit of one `live_check` call, so it was not checked with `live_check` in this PR.

## How the policy kept authors consistent

Both agents worked from the same `AGENTS.md`, so the rules did not depend on which agent wrote the code. Example: the integration agent wrote "Every outgoing `fetch` has a timeout" into `AGENTS.md` in PR #1. The fixer agent, a different author in a different session, found the one outgoing call path without a deadline (idealo MCP in `lib/idealo.mjs`) and gave it the same kind of timeout the other partner calls already had. In the same way, both PRs follow the `<author>/<topic>` branch rule, run `npm test` before the PR, and record the exact Norma rule IDs they fixed or accepted.
