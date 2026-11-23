# Mode selection, authority, and bootstrap

## Mode Detection

Check whether the invocation arguments supplied by the current host contain the exact token `mode:non-interactive` or its deprecated alias `mode:headless`. Strip only those tokens (preserving the remainder, quoted paths, and token order as the scope hint) and run in **non-interactive/headless mode**.

| Mode | When | Behavior |
|------|------|----------|
| **Interactive** (default) | User is present and can answer questions | Ask for decisions on ambiguous cases, confirm actions |
| **Headless** | `mode:non-interactive` or `mode:headless` in arguments | No user interaction. Prepare authorized unambiguous actions and publish only after validation. Apply the evidence rules before preparing stale annotations. Generate the full report. |

### Resolve mutation and landing authority

Record three independent run-local facts before any write or Git action:

```yaml
mutation_authorization: authorized | missing
commit_authorization: authorized | missing
landing_authorization: authorized | missing
```

A direct request to refresh or maintain `docs/solutions/` authorizes only the bounded local document mutations described by this workflow. Set `commit_authorization` only when the current user or visible upstream handoff separately requests a commit. Set `landing_authorization` only when push or PR creation/update is separately explicit. `mode:headless`, a feature branch, writable permissions, successful edits, or a clean tree do not grant commit, branch creation, push, or PR authority. Without commit authorization, preserve verified edits as uncommitted work; without landing authorization, do not push or open a PR.

### Headless mode rules

- **Skip all user questions.** Never pause for input.
- **Process all docs in scope.** No scope narrowing questions — if no scope hint was provided, process everything.
- **Attempt all authorized safe actions:** prepare candidates for Update, Consolidate, Replace, or stale annotations and prepare gated deletions; Keep is a no-op. `references/publication.md` owns validation and final mutation. Missing mutation authority is recommend-only, not permission to attempt a durable write. Report an action as **applied** only after its publication and dependent checks succeed. Record failed writes as **recommended**, keep partial effects explicit, and continue independent candidates without asking for permissions.
- **JSON status.** Use `partial` if any dependency group has durable changes but is not complete, whether the first write happened earlier or in this run. Otherwise use `applied` for publication this run with dependent checks complete, or `recommended-only` if nothing was written this run. Put only the token in `status`. List prior publication, this run's changes and deletions, pending work, and independent recommendations separately. A private draft is not a partial publication.
- **Mark as stale only on evidence of drift.** If confirmed drift makes classification ambiguous or successor evidence insufficient, prepare `status: stale`, `stale_reason`, and `stale_date` in a private candidate. Missing corroboration alone leaves the original unchanged with a verification gap. Failed annotation publication is a recommendation.
- **Preserve uncertain knowledge.** In interactive mode, ask only when the missing decision matters. In headless mode, preserve plausible claims and report the gap; evidence-backed drift may justify a stale candidate, but low confidence alone does not.
- **Final report.** Under `Applied`, list only published actions whose dependent checks are complete. Under `Recommended`, list proposed or blocked actions and explain why. For partially published groups, identify the paths already changed and what remains; do not report the whole group as either complete or untouched. List files reviewed without edits separately.
- Relocations require the four-condition gate in `references/classify.md`.
  Splits are always recommend-only in non-interactive mode.
- A failed prerequisite write blocks dependent deletion or metadata cleanup.
  Record partial results accurately and continue independent candidates; a
  failed successor write never permits deleting the original.
- Missing corroboration alone is a verification gap, not staleness. Apply the
  classification reference's unverifiable-is-not-false rule before stale-marking.
- Worth-based actions follow `references/worth-audit.md` and are recommended-only
  in non-interactive mode; authorized accuracy-based actions still proceed.

## CONCEPTS.md bootstrap requests

In every mode, an explicit "create CONCEPTS.md" or repo-wide glossary bootstrap
request selects the standalone vocabulary path: skip learning discovery and classification.
An existing docs/solutions/ does not change this route or grant learning-write
authority. No confirmation is needed merely because the request is non-interactive.

Read `references/concepts-vocabulary.md` and follow its **Seed goal** and **Scope
of a seed** rules. Prepare the preamble and qualifying definitions privately;
if the glossary exists, preserve useful entries and reconcile within the explicit
scope rather than blindly recreating it. Read `references/publication.md` and
validate/publish the vocabulary candidate before the report and Discoverability
Check. No learning frontmatter is required for a glossary. Without separate
commit authorization, leave verified bootstrap edits uncommitted.

A request to refresh learnings uses the normal flow, with scoped vocabulary
reconciliation in Phase 4.5. If the actual wording leaves the artifact or scope
unclear, ask only for that missing choice in interactive mode. In non-interactive
mode, report the ambiguity as recommended-only; do not widen to a learning sweep
or claim a standalone bootstrap was completed.
