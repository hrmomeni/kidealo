# Rules for every author (human or agent)

Kidealo is written by several authors: the team and their coding agents (Claude Code, Fable, Codex). Every author runs the same Norma checks.

## Norma in the agent loop
The Norma MCP server is configured in `.mcp.json` (`https://api.qualityclouds.ai/mcp`, OAuth sign-in). Skills are in `.claude/skills/`.

1. At the start of a task, call `get_rulesets`, then `get_rules_for_ruleset` for each relevant ruleset.
2. After each file you create or change, call `live_check` on it, and fix what it finds.
3. Before every commit, push or PR, follow `norma-check-before-commit`: run `live_check` on all changed files until the result is clean.
4. After the task, call `register_applied_actions` with the exact rule IDs.
5. If you leave a finding in place on purpose, write the rule ID, the file and the reason in the PR description.

## Team rules (our Norma policy, in plain words)
- API keys only in the server environment (`.env`). Never in `public/` or in the repo.
- Partner APIs (Nebius, Tavily, idealo) are only called from `server.mjs` or `lib/`, never from the browser.
- Every outgoing `fetch` has a timeout (`AbortSignal.timeout`).
- The model never chooses an action outside `allowedActions()`. Keep `guardDecision()` in the path.
- No new runtime dependencies without a reason in the PR description.

## Git
- Merge through pull requests. Branch names: `<author>/<topic>`, for example `fable/ui-modal` or `claude/norma-setup`.
- `npm test` must pass before you open a PR.
