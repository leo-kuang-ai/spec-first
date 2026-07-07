# Persona Catalog

18 reviewer personas organized into default core, cross-cutting conditional, and stack-specific conditional layers, plus Spec-First-specific agents. The orchestrator uses this catalog to select which reviewers to spawn for each review.

## Default Core (4 personas + 2 Spec-First agents)

Spawned for medium, broad, sensitive, or unclear reviews. The Stage 3 scale-aware reviewer preflight may use a smaller minimum set for low-risk tiny diffs; do not apply the minimum set when the diff is sensitive, has prior PR comments, has an explicit plan, excludes untracked files, or lacks reliable preflight facts.

**Persona agents (structured JSON output):**

| Persona | Agent | Focus |
|---------|-------|-------|
| `correctness` | `spec-correctness-reviewer` | Logic errors, edge cases, state bugs, error propagation, intent compliance |
| `testing` | `spec-testing-reviewer` | Coverage gaps, weak assertions, brittle tests, missing edge case tests |
| `maintainability` | `spec-maintainability-reviewer` | Coupling, complexity, naming, dead code, premature abstraction |

**Spec-First agents (unstructured output, synthesized separately):**

| Agent | Focus |
|-------|-------|
| `spec-agent-native-reviewer` | Verify new features are agent-accessible and mapped against the agent-native-architecture canonical taxonomy |
| `spec-learnings-researcher` | Search docs/solutions/ for past issues related to this PR's modules and patterns |

## Conditional (8 personas)

Spawned when the orchestrator identifies relevant patterns in the diff. The orchestrator reads the full diff and reasons about selection -- this is agent judgment, not keyword matching.

Diff Boundary Review, Graph-Assisted Impact Review, and first-class test gaps do not add a new persona in Phase A. They are cross-cutting lenses applied by the orchestrator, `diff-scope.md`, and the selected reviewers. When boundary or graph impact signals make the diff sensitive, broad, public-contract-facing, source/runtime-facing, or missing-test-heavy, use the full default core plus applicable conditionals rather than the low-risk minimum set.

**CLI readiness boundary:** Keep `cli-readiness` because this repository ships a CLI/workflow harness. CLI-facing changes must still be reviewed for autonomous-agent usability, parseable output, non-interactive behavior, bounded output, and actionable errors. Do not delete this selector without a separate spec-first product decision and replacement review coverage.

| Persona | Agent | Select when diff touches... |
|---------|-------|---------------------------|
| `security` | `spec-security-reviewer` | Auth middleware, public endpoints, user input handling, permission checks, secrets management |
| `performance` | `spec-performance-reviewer` | Database queries, ORM calls, loop-heavy data transforms, caching layers, async/concurrent code |
| `api-contract` | `spec-api-contract-reviewer` | Route definitions, serializer/interface changes, event schemas, exported type signatures, API versioning |
| `data-migrations` | `spec-data-migrations-reviewer` | Migration files, schema dumps (`db/schema.rb`, `structure.sql`), backfill scripts, or data transformations -- not model/query-only changes without migration artifacts |
| `reliability` | `spec-reliability-reviewer` | Error handling, retry logic, circuit breakers, timeouts, background jobs, async handlers, health checks |
| `adversarial` | `spec-adversarial-reviewer` | Diff has >=50 changed non-test, non-generated, non-lockfile lines, OR touches auth, payments, data mutations, external API integrations, or other high-risk domains |
| `cli-readiness` | `spec-cli-readiness-reviewer` | CLI command definitions, argument parsing, CLI framework usage, command handler implementations |
| `previous-comments` | `spec-previous-comments-reviewer` | **PR-only AND comment-gated.** Reviewing a PR that has existing review comments or review threads from prior review rounds. Skip entirely when no PR metadata was gathered in Stage 1, or when Stage 1's `hasPriorComments` flag is false. |

## Stack-Specific Conditional (6 personas)

These reviewers keep their original opinionated lens. They are additive with the cross-cutting personas above, not replacements for them.

| Persona | Agent | Select when diff touches... |
|---------|-------|---------------------------|
| `dhh-rails` | `spec-dhh-rails-reviewer` | Rails architecture, service objects, authentication/session choices, Hotwire-vs-SPA boundaries, or abstractions that may fight Rails conventions |
| `kieran-rails` | `spec-kieran-rails-reviewer` | Rails controllers, models, views, jobs, components, routes, or other application-layer Ruby code where clarity and conventions matter |
| `kieran-python` | `spec-kieran-python-reviewer` | Python modules, endpoints, services, scripts, or typed domain code |
| `kieran-typescript` | `spec-kieran-typescript-reviewer` | TypeScript components, services, hooks, utilities, or shared types |
| `julik-frontend-races` | `spec-julik-frontend-races-reviewer` | Stimulus/Turbo controllers, DOM event wiring, timers, async UI flows, animations, or frontend state transitions with race potential |
| `swift-ios` | `spec-swift-ios-reviewer` | Swift files, SwiftUI views, UIKit controllers, `.entitlements`, `PrivacyInfo.xcprivacy`, `.xcdatamodeld`, `Package.swift`, `Package.resolved`, storyboards, XIBs, or semantic build-setting / target-membership / code-signing changes in `.pbxproj` |

## Spec-First Conditional Agents (migration-specific)

These Spec-First conditional agents provide specialized analysis beyond what the persona agents cover. Spawn them when the diff includes database migration files, schema dumps (`db/schema.rb`, `structure.sql`), or data backfills. Do not trigger migration-only agents for model/query-only changes without migration artifacts.

| Agent | Focus |
|-------|-------|
| `spec-schema-drift-detector` | Cross-references schema.rb changes against included migrations to catch unrelated drift |
| `spec-deployment-verification-agent` | Produces Go/No-Go deployment checklist with SQL verification queries and rollback procedures for risky migration artifacts |

## Selection rules

1. **Run the Stage 3 scale-aware reviewer preflight.** Low-risk tiny diffs may use a minimum core of 2-3 reviewers; sensitive, medium, broad, unclear, explicit-plan, prior-comment, or untracked-excluded reviews use the full default core.
2. **For each cross-cutting conditional persona**, the orchestrator reads the diff and decides whether the persona's domain is relevant. This is a judgment call, not a keyword match.
3. **For each stack-specific conditional persona**, use file types and changed patterns as a starting point, then decide whether the diff actually introduces meaningful work for that reviewer. Do not spawn language-specific reviewers just because one config or generated file happens to match the extension.
4. **For Spec-First conditional agents**, spawn when the diff includes migration files (`db/migrate/*.rb`), schema dumps (`db/schema.rb`, `structure.sql`), or data backfill scripts. Do not spawn these agents for model/query-only changes without migration artifacts.
5. **Boundary/graph escalation.** If Stage 2c has `authorized_scope_source: explicit-touch-set | declared-files-only | inferred-plan` and the diff touches files or behavior outside that source, keep the full default core even for a small diff. If graph-assisted candidates identify public contracts, source/runtime surfaces, security/permission paths, or untested high-impact symbols, use the full default core and add the relevant conditional persona.
6. **Announce the team** before spawning with the selected core tier and a one-line justification per conditional reviewer selected.
