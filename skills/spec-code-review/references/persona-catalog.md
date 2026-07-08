# Persona Catalog

15 reviewer personas organized into default core, cross-cutting conditional, and stack-specific conditional layers, plus a Spec-First-specific agent. The orchestrator uses this catalog to select which reviewers to spawn for each review.

Reviewer ids are stable report/artifact labels. Prompt content is loaded from the listed skill-local `references/personas/*.md` file and passed into `references/subagent-template.md`; do not dispatch a top-level typed agent.

## Default Core (4 personas + 2 Spec-First agents)

Spawned for medium, broad, sensitive, or unclear reviews. The Stage 3 scale-aware reviewer preflight may use a smaller minimum set for low-risk tiny diffs; do not apply the minimum set when the diff is sensitive, has prior PR comments, has an explicit plan, excludes untracked files, or lacks reliable preflight facts.

**Persona reviewers (structured JSON output):**

| Persona | Reviewer id | Prompt asset | Focus |
|---------|-------------|--------------|-------|
| `correctness` | `spec-correctness-reviewer` | `references/personas/correctness-reviewer.md` | Logic errors, edge cases, state bugs, error propagation, intent compliance |
| `testing` | `spec-testing-reviewer` | `references/personas/testing-reviewer.md` | Coverage gaps, weak assertions, brittle tests, missing edge case tests |
| `maintainability` | `spec-maintainability-reviewer` | `references/personas/maintainability-reviewer.md` | Coupling, complexity, naming, dead code, premature abstraction |

**Spec-First agents (unstructured output, synthesized separately):**

| Reviewer id | Prompt asset | Focus |
|-------------|--------------|-------|
| `spec-agent-native-reviewer` | `references/personas/agent-native-reviewer.md` | Verify new features are agent-accessible and preserve agent-native parity |
| `spec-learnings-researcher` | `references/personas/learnings-researcher.md` | Search docs/solutions/ for past issues related to this PR's modules and patterns |

## Conditional (7 personas)

Spawned when the orchestrator identifies relevant patterns in the diff. The orchestrator reads the full diff and reasons about selection -- this is agent judgment, not keyword matching.

Diff Boundary Review, Graph-Assisted Impact Review, and first-class test gaps do not add a new persona in Phase A. They are cross-cutting lenses applied by the orchestrator, `diff-scope.md`, and the selected reviewers. When boundary or graph impact signals make the diff sensitive, broad, public-contract-facing, source/runtime-facing, or missing-test-heavy, use the full default core plus applicable conditionals rather than the low-risk minimum set.

| Persona | Reviewer id | Prompt asset | Select when diff touches... |
|---------|-------------|--------------|---------------------------|
| `security` | `spec-security-reviewer` | `references/personas/security-reviewer.md` | Auth middleware, public endpoints, user input handling, permission checks, secrets management |
| `performance` | `spec-performance-reviewer` | `references/personas/performance-reviewer.md` | Database queries, ORM calls, loop-heavy data transforms, caching layers, async/concurrent code |
| `api-contract` | `spec-api-contract-reviewer` | `references/personas/api-contract-reviewer.md` | Route definitions, serializer/interface changes, event schemas, exported type signatures, API versioning |
| `data-migrations` | `spec-data-migrations-reviewer` | `references/personas/data-migration-reviewer.md` | Migration files, schema dumps (`db/schema.rb`, `structure.sql`), backfill scripts, or data transformations -- not model/query-only changes without migration artifacts |
| `reliability` | `spec-reliability-reviewer` | `references/personas/reliability-reviewer.md` | Error handling, retry logic, circuit breakers, timeouts, background jobs, async handlers, health checks |
| `adversarial` | `spec-adversarial-reviewer` | `references/personas/adversarial-reviewer.md` | Diff has >=50 changed non-test, non-generated, non-lockfile lines, OR touches auth, payments, data mutations, external API integrations, or other high-risk domains |
| `previous-comments` | `spec-previous-comments-reviewer` | `references/personas/previous-comments-reviewer.md` | **PR-only AND comment-gated.** Reviewing a PR that has existing review comments or review threads from prior review rounds. Skip entirely when no PR metadata was gathered in Stage 1, or when Stage 1's `hasPriorComments` flag is false. |

## Stack-Specific Conditional (2 personas)

These reviewers keep their original opinionated lens. They are additive with the cross-cutting personas above, not replacements for them.

| Persona | Reviewer id | Prompt asset | Select when diff touches... |
|---------|-------------|--------------|---------------------------|
| `julik-frontend-races` | `spec-julik-frontend-races-reviewer` | `references/personas/julik-frontend-races-reviewer.md` | Stimulus/Turbo controllers, DOM event wiring, timers, async UI flows, animations, or frontend state transitions with race potential |
| `swift-ios` | `spec-swift-ios-reviewer` | `references/personas/swift-ios-reviewer.md` | Swift files, SwiftUI views, UIKit controllers, `.entitlements`, `PrivacyInfo.xcprivacy`, `.xcdatamodeld`, `Package.swift`, `Package.resolved`, storyboards, XIBs, or semantic build-setting / target-membership / code-signing changes in `.pbxproj` |

## Spec-First Conditional Agents (migration-specific)

This Spec-First conditional agent provides specialized analysis beyond what the persona agents cover. Spawn it when the diff includes database migration files, schema dumps (`db/schema.rb`, `structure.sql`), or data backfills. Do not trigger migration-only agents for model/query-only changes without migration artifacts.

| Reviewer id | Prompt asset | Focus |
|-------------|--------------|-------|
| `spec-deployment-verification-agent` | `references/personas/deployment-verification-agent.md` | Produces Go/No-Go deployment checklist with SQL verification queries and rollback procedures for risky migration artifacts |

## Selection rules

1. **Run the Stage 3 scale-aware reviewer preflight.** Low-risk tiny diffs may use a minimum core of 2-3 reviewers; sensitive, medium, broad, unclear, explicit-plan, prior-comment, or untracked-excluded reviews use the full default core.
2. **For each cross-cutting conditional persona**, the orchestrator reads the diff and decides whether the persona's domain is relevant. This is a judgment call, not a keyword match.
3. **For each stack-specific conditional persona**, use file types and changed patterns as a starting point, then decide whether the diff actually introduces meaningful work for that reviewer. Do not spawn language-specific reviewers just because one config or generated file happens to match the extension.
4. **For Spec-First conditional agents**, spawn when the diff includes migration files (`db/migrate/*.rb`), schema dumps (`db/schema.rb`, `structure.sql`), or data backfill scripts. Do not spawn these agents for model/query-only changes without migration artifacts.
5. **Boundary/graph escalation.** If Stage 2c has `authorized_scope_source: explicit-touch-set | declared-files-only | inferred-plan` and the diff touches files or behavior outside that source, keep the full default core even for a small diff. If graph-assisted candidates identify public contracts, source/runtime surfaces, security/permission paths, or untested high-impact symbols, use the full default core and add the relevant conditional persona.
6. **Announce the team** before spawning with the selected core tier and a one-line justification per conditional reviewer selected.
