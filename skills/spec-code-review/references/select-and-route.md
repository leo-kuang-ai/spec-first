# Reviewer Selection And Routing

Read at Stage 3 together with `references/persona-catalog.md`, only after Stage 1c admits dispatch. Preserve the local roster and receipt gates; invoking an upstream Skill does not substitute for separate authorization.

## Reviewers

14 reviewer personas in layered conditionals, plus spec-first local prompt assets. Quick roster with one-line triggers below; the persona catalog in `references/persona-catalog.md` (read it at Stage 3) has the full per-persona selection criteria and spawn gates. Each selected reviewer is a generic subagent seeded with a local prompt file from `references/personas/`; do not dispatch standalone agents by type/name.

**Always-on (full review):** local prompt assets `correctness-reviewer`, `testing-reviewer`, `maintainability-reviewer`, `project-standards-reviewer`, plus spec-first local prompt assets `agent-native-reviewer` and `learnings-researcher`. (Stage 3c may reduce this set to a lite roster for trivial, low-risk diffs.)

**Cross-cutting conditional (per diff):**

- `security-reviewer` — auth、tenant/resource authorization、untrusted model/tool/web output、dangerous sinks、reachable dependency risk
- `performance-reviewer` — DB queries, data transforms, caching, async
- `api-contract-reviewer` — routes, serializers, type signatures, versioning
- `frontend-quality-reviewer` — user-visible state, semantic/a11y, focus/contrast, responsive and presentation/data boundaries
- `data-migration-reviewer` — migration files / schema dumps / backfills (see spawn gate in Stage 3)
- `reliability-reviewer` — error handling, retries, timeouts, background jobs
- `adversarial-reviewer` — >=50 changed code lines, or auth / payments / data mutations / external APIs, or a **silent-pass verification mechanism** (CI/CD gating logic, merge-blocking checks, build/deploy steps, coverage/lint gates, or test infrastructure/mocks that could mask production) regardless of size. When selected, a **cross-model adversarial pass** (Stage 4) additionally runs the same brief through a different model family via a peer CLI — additive, non-blocking
- `previous-comments-reviewer` — PR with existing review comments (PR-only, comment-gated)

**Stack-specific conditional (per diff):** `julik-frontend-races-reviewer` (Stimulus/Turbo, DOM events, async UI) and `swift-ios-reviewer` (Swift/SwiftUI/UIKit, entitlements, Core Data, `.pbxproj`).

**spec-first conditional (migration-specific):** local prompt asset `deployment-verification-agent` — deployment checklist + rollback when the migration gate applies and the change is risky.

## Review Scope

A full review spawns generic subagents for all 4 always-on personas plus the 2 spec-first always-on local prompt assets, then adds whichever cross-cutting and stack-specific conditionals fit the diff (Stage 3c can collapse this to a lite roster for trivial, low-risk diffs). The model naturally right-sizes: a small config change triggers 0 conditionals = 6 reviewers. A Rails auth feature might trigger security + reliability + adversarial = 9 reviewers.

### Stage 3: Select reviewers

Treat changed persistence writes, event publication, retry/partial-failure behavior, and concurrency or ordering semantics as concrete data-mutation/external-boundary triggers for the adversarial lens. Do not require a framework-specific database or HTTP keyword. Selecting the lens does not authorize an external peer; the existing dispatch and receipt gates still apply.

Read the diff and file list from Stage 1, and the `SIGNALS` / `EXEC_LINES` from Stage 1b. The 4 always-on personas and 2 spec-first always-on local prompt assets are automatic. Read `references/persona-catalog.md` from this skill's directory now — it carries the full per-persona selection criteria and spawn gates the one-line roster above only summarizes. For each cross-cutting and stack-specific conditional persona in that catalog, decide whether the diff warrants it. This is agent judgment, not keyword matching — a `SIGNALS` hit (`migrations`, `frontend`, `api`, `swift-ios`) is a *prompt* to consider the matching persona, not an instruction to spawn it; confirm the runtime concern is real in the diff before adding it, and add content-gated personas (`security`, `reliability`, `adversarial`) from the diff as before since those are not path-derivable.

**Security selection boundary.** Select `security` when the diff introduces or changes an agent/model/tool/web-content trust boundary, tenant/resource authorization, credentials, or a reachable dangerous sink such as shell, path, SQL, server-side URL, template evaluation, or privileged tool action. A schema-only compatibility drift belongs to `api-contract`; an unreachable dependency advisory or generic hardening idea is not a security finding. Require a concrete attack path before escalating a security concern, and do not use file extension or dependency-name presence as a substitute for that judgment.

**Frontend-quality selection boundary.** Select the internal `frontend-quality` persona when the diff changes a user-visible route, form, navigation, component public behavior, async loading/error/empty/permission/retry state, semantic HTML/ARIA, keyboard/focus, contrast, layout, responsive breakpoint, or motion behavior. This is a semantic activation judgment, not an extension test: CSS-only changes that affect contrast/focus/layout/responsive/motion activate it; backend-only, docs-only, type-only, fixture-only, and token-value-only changes that do not affect those visible semantics do not. It reviews current diff quality, not browser field behavior; timing/race findings remain `julik-frontend-races`, unsafe rendering remains `security`, test proof remains `testing`, and structural complexity remains `maintainability`.

**File-type awareness for conditional selection:** Instruction-prose files (Markdown skill definitions, JSON schemas, config files) are product code but do not benefit from runtime-focused reviewers. The adversarial reviewer's techniques (race conditions, cascade failures, abuse cases) target executable code behavior. For diffs that only change instruction-prose files, skip adversarial unless the prose describes auth, payment, or data-mutation behavior, or the change is itself a silent-pass verification mechanism (next paragraph — a CI/CD workflow is a config file but still gets the adversarial lens). Count only executable code lines toward line-count thresholds.

**Silent-pass verification mechanisms — adversarial fires on the guard itself.** When the change *is* a verification mechanism — CI/CD gating logic, merge-blocking checks, build/deploy steps, coverage/lint gates, or test infrastructure/mocks that could mask production — its risk isn't blast radius, it's fidelity: it can go green while the real thing is red, so the exact "can this false-pass?" lens must run. Select `adversarial` (and therefore the Stage-4 cross-model pass) for such a change regardless of changed-line count and independent of the auth/data heuristics. The selection question: "If this mechanism is wrong, does it fail loudly or silently pass? A silent-pass guard gets the adversarial + cross-model lens regardless of size." Scope guard: this fires on the *mechanism* (gating/CI/build/deploy/harness changes), not on ordinary per-feature test assertions — a unit test asserting business logic is the `testing` reviewer's job, not adversarial's.

**`previous-comments` is PR-only AND comment-gated.** Only select this persona when both conditions hold:

1. Stage 1 gathered PR metadata (PR number or URL was provided as an argument, or `gh pr view` returned metadata for the current branch).
2. `hasPriorComments` from Stage 1 is true (the PR has at least one review submission or issue comment).

Skip it for standalone branch reviews with no associated PR, and skip it for PRs with no prior feedback yet -- there is nothing for the persona to verify, and a spawned subagent that returns empty findings still costs the full subagent startup overhead (persona spec, diff, schema, plus its own gh calls).

Stack-specific personas are additive when runtime behavior warrants them. A Hotwire UI change may warrant `julik-frontend-races`; a TypeScript API diff may warrant `api-contract` and `reliability`.

**`data-migration` spawn gate.** Select `data-migration-reviewer` only when the diff includes at least one migration or schema artifact: `db/migrate/*`, `db/schema.rb`, `db/structure.sql`, Alembic/Flyway/Liquibase migration paths, or explicit backfill/data-transform scripts (rake tasks, one-off data migration classes). **Do not spawn** for model-only changes, query-only refactors, serializers/controllers that reference columns without a migration or schema dump in the diff, or migration tests alone.

For `deployment-verification-agent`, use the same migration-artifact gate when the change is risky (destructive DDL, backfills, NOT NULL without default, column renames/drops). Only the orchestrator applies this gate; a worker prompt's scope description does not permit self-invocation or turn an ordinary data-processing change into an activation signal. Only when both conditions pass, add `deployment-verification-agent` to `selected_local_prompt_assets`; otherwise do not add it. Record an applicability reason that names both the migration/schema artifact path and the concrete risky operation.

Announce the team before spawning, as a user-facing summary: name the always-on reviewers plainly, and for each conditional reviewer give the one-line reason it was added (the real concern, not the keyword that matched). Do **not** put model-tier labels (`[session model]`/`[mid-tier]`) or scope-mode codenames in this announce — those are internal. Still *decide* each reviewer's tier here and keep it in your own working notes (Stage 4 applies it at dispatch as a correctness guarantee); just keep it out of this user-facing summary.

If the cross-model adversarial pass will run (adversarial selected + `local-aligned`/standalone scope), resolve its peer now via the cross-model reference's host/preflight steps and surface it **as its own prominent line that names the peer** (the peer CLI, plus its model if cheaply known) — the headline is that a second, genuinely independent model is also reviewing. Keep it with the team, not buried after it, and honor that reference's host gating (interactive hosts only). If it won't run, omit it.

Illustrative shape only — match your own voice, do not copy verbatim:

```
Reviewing PR #1234 (against main)

Also running an independent adversarial pass via a different model: Codex.

Reviewers:
- correctness, testing, maintainability, project-standards, agent-native, learnings (always)
- security — new endpoint accepts a user-provided redirect URL
- data-migration — adds migration 20260303_add_index_to_orders
```

This is progress reporting, not a blocking confirmation.

### Stage 3b: Discover project standards paths

Before spawning sub-agents, find the file paths (not contents) of all relevant standards files for the `project-standards` persona. Use the native file-search/glob tool to locate:

1. Use the native file-search tool (e.g., Glob in Claude Code) to find all `**/CLAUDE.md` and `**/AGENTS.md` in the repo.
2. Filter to those whose directory is an ancestor of at least one changed file. A standards file governs all files below it (e.g., `AGENTS.md` at the repo root applies to the whole checkout, while `skills/AGENTS.md` would apply to everything under `skills/`).

Pass the resulting path list to the `project-standards` persona inside a `<standards-paths>` block in its review context (see Stage 4). The persona reads the files itself, targeting only the sections relevant to the changed file types. This keeps the orchestrator's work cheap (path discovery only) and avoids bloating the subagent prompt with content the reviewer may not fully need.

### Stage 3c: Small-diff fast path (reduce the roster for trivial, low-risk diffs)

**`depth:full` hard-disables this gate** — when that token was passed, skip Stage 3c entirely and run the full roster (the caller explicitly asked for a deep review; size no longer matters).

**This gate fails closed: it only ever fires for a positive count of low-risk application code, and every uncertainty resolves to the full roster.** Collapse to a lite roster only when **all** of these hold:

- `EXEC_LINES` from Stage 1b is a **number** (not `UNKNOWN`) and **between 1 and 39**, AND
- `UNCOUNTED_FILES` from Stage 1b is **0** — i.e. *every* changed file is counted application code. Any uncounted file (skill `.md`, JSON schema, `.sh`/CI/config, lockfile, unknown extension) disqualifies the lite path. This guard is load-bearing on **mixed** diffs the line count alone would pass: 15 exec lines of application code plus two `.md` skill files reads `EXEC_LINES:15` with `UNCOUNTED_FILES:2`, and the uncounted files force the **full** roster. (This plugin's own product surface — `skills/**`, `SKILL.md`, `references/**`, schemas — is uncounted.) AND
- Stage 1b `SIGNALS` is **empty** (no `migrations`, `frontend`, `api`, or `swift-ios`), AND
- No content-based risk read from the diff in Stage 3 (auth, payments, data mutation, external API, secrets/permissions, deserialization, crypto, concurrency/background jobs, filesystem/process execution), AND
- No conditional persona was selected in Stage 3.

`EXEC_LINES:UNKNOWN` (unresolved base) or `UNCOUNTED_FILES > 0` are **hard disqualifiers** — never lite. A pure code diff that also touches one `.md` runs the full roster; that conservatism is the point.

**Lite roster:** the inline fast pass (Stage 4) plus `correctness-reviewer` and `project-standards-reviewer` only — skip `testing`, `maintainability`, `agent-native`, and `learnings`. Announce the reduction plainly (e.g. "Small diff (28 exec lines, code-only, no risk signals) — running a lite review: fast pass + correctness + standards.") and note it in Coverage.

**Do not collapse** when any gate condition fails — the gate keys on risk, not size alone (a 12-line auth change still needs the full roster). When in doubt (signals ambiguous, risk unclear, count `UNKNOWN`), run the full roster.

## Language-Aware Conditionals

Stack-specific reviewers fire only when the diff touches runtime behavior they specialize in (async UI races, iOS/Swift lifecycle) — never mechanically from file extensions alone; the trigger is meaningful changed behavior in that stack's runtime domain. Structural quality (complexity deletion, 1k-line regressions, type-boundary leaks) lives in the always-on `maintainability-reviewer`; do not spawn extra reviewers for language conventions, philosophy, or "strict bar" passes.
