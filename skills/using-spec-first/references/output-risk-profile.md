# Output Risk Profile

`using-spec-first` produces routing posture, not files. Its output quality is measured by whether it keeps the current request on the right execution surface while preserving source/runtime and dispatch boundaries.

## High-Risk Failures

| Risk | Typical bad output | Guardrail |
| --- | --- | --- |
| `over-routing` | Lightweight explanations, current-context questions, or narrow where-used lookups are forced into public workflows. | Keep direct-answer and bounded-read cases in `evals/routing-cases.json`. |
| `under-routing` | Prompt, workflow, contract, governance, or runtime-delivery changes proceed as casual edits. | Keep substantial-work and self-work boundaries visible in `SKILL.md`. |
| `legacy-entry-syntax` | Current product guidance restores legacy host-specific spellings as primary workflow surfaces instead of normalizing to `spec-*`. | Preserve unified-entry rules and runtime transform tests. |
| `dispatch-overreach` | Public workflow admission is treated as Codex `spawn_agent` authorization. | Keep dispatch-boundary cases and `dispatch_authorization_missing` fallback wording. |
| `internal-helper-exposure` | Internal helpers such as `git-worktree` are recommended as public entrypoints. | Keep skill-entrypoint lint and routing cases for standalone/internal boundaries. |
| `source-runtime-violation` | Generated runtime mirrors are edited or treated as source truth. | Keep source/runtime boundary wording and regenerate with `spec-first init` only after source validation. |
| `setup-hijack` | Missing or stale setup evidence overrides a clear lightweight or downstream user goal. | Keep scenario fingerprint facts advisory and intent-first. |
| `automatic-chaining` | The answer promises plan -> work -> review as one automatic chain. | Keep one-entrypoint guide mode and routing-discipline evals. |
| `parent-workspace-unsafe-write` | Writes begin from a parent workspace without explicit child repo scope. | Require `target_repo` / per-child scope before writes, tests, review autofix, changelog, or commits. |
| `false-evidence` | The answer claims init, tests, fresh-source eval, or routing evaluation ran without evidence. | Require concrete commands or `not_run` reason codes in closeout. |

## Self-Repair Checks

Before editing this skill, answer:

1. Does the change reduce ambiguity or maintenance risk more than it increases initial-load cost?
2. Is the new detail needed in `SKILL.md`, or can it live in `references/`?
3. Can the claim be checked with source reads, JSON fixture validation, focused Jest, or fresh-source eval?
4. Does the change preserve `Light contract + Explicit boundaries + scripts enforce deterministic invariants; scripts prepare facts; LLM decides semantic adequacy above that floor`?

If the answer is unclear, keep the change as a candidate next step instead of shipping it into the baseline.
