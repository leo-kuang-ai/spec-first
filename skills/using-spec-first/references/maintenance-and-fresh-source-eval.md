# Maintenance And Fresh-Source Eval

`using-spec-first` is a library-grade entry governor for `spec-first`. It is maintained as source prose plus eval fixtures, not as a command-backed workflow or deterministic router.

## Ownership

| Field | Value |
| --- | --- |
| Owner | `spec-first maintainers` |
| Review cadence | Per release that changes route map, host bootstrap, dispatch boundary, source/runtime guidance, or scenario fingerprint consumption |
| Maturity | Library-lean / governed-adjacent |
| Rollback boundary | Revert `skills/using-spec-first/**`, related tests, and source bootstrap/generator changes; do not patch generated runtime mirrors as source fixes |

## Fresh-Source Eval Triggers

Record fresh-source eval status when changing:

- `skills/using-spec-first/SKILL.md`
- `skills/using-spec-first/references/**`
- `skills/using-spec-first/evals/**`
- `src/cli/instruction-bootstrap.js`
- host instruction managed blocks in `CLAUDE.md` or `AGENTS.md`
- dispatch admission prose or Codex fallback behavior
- source/runtime boundary prose
- route map entries or standalone/internal entrypoint policy

Use `docs/contracts/workflows/fresh-source-eval-checklist.md` status values: `passed`, `concerns`, `not_run`, or `N/A`. Do not claim fresh-source eval passed when only current-session reads or Jest checks ran.

## Invalidation Conditions

Re-review this skill when any of these change:

- A public `spec-*` workflow is added, renamed, retired, or changes entry semantics.
- A standalone skill becomes a public workflow, or a public workflow becomes internal/standalone.
- Codex or Claude host dispatch authorization contracts change.
- SessionStart/bootstrap behavior changes, especially if a host starts injecting different per-turn or post-compact context.
- Scenario fingerprint schema or source authority changes.
- Runtime mirror layout changes, such as `.agents/skills/**`, `.codex/**`, or `.claude/**`.
- The repository adopts a new skill governance metadata schema.

## Evidence Expectations

Minimum source-change evidence:

- Focused source reads for changed files.
- Focused Jest contracts for routing, bootstrap, dispatch, or eval fixtures.
- `git diff --check`.
- `CHANGELOG.md` entry for source changes.
- Fresh-source eval status or a concrete `not_run` reason for prose/behavior changes.

Use output eval evidence for larger changes. For routing skills, compare `with-skill` against a baseline that has only the public workflow menu, not a baseline that lacks all workflow names.
