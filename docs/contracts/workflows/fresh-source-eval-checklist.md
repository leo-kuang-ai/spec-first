# Fresh-Source Eval Checklist

Fresh-source eval is a semantic verification step for agent and skill prose changes. It checks the current source files on disk, not runtime mirrors or definitions cached by the current session.

Use it when a change modifies:

- `skills/**/SKILL.md` or `skills/**/references/**`
- `agents/**/*.agent.md`
- host entry instructions that affect workflow routing or generated runtime behavior
- templates that project source skill/agent behavior into Claude or Codex runtime assets

## Cadence

Run or explicitly record fresh-source eval status during PR or closeout when a change touches skill/agent/workflow prose, host entry blocks, templates, or generated-runtime behavior.

Use this status vocabulary:

- `passed`: a fresh read-only reviewer or equivalent fresh source review actually ran against current disk source and found no material concerns.
- `concerns`: a fresh source review ran and produced findings or unresolved risks.
- `not_run`: dispatch or reviewer execution was unavailable, unauthorized, explicitly disabled, or intentionally deferred; include the reason.
- `N/A`: the change does not touch skill/agent/workflow prose, templates, host entry blocks, or generated-runtime behavior.

For larger workflow or prompt changes, sample at least one judge/human agreement check or record why calibration was deferred. This remains an advisory semantic practice, not a deterministic CI gate.

## Source Boundary

Fresh-source eval reads source-of-truth files:

- `skills/`
- `agents/`
- `templates/`
- `AGENTS.md`
- `CLAUDE.md`
- `src/cli/` generator and governance contracts when runtime projection is affected

It must not treat `.claude/`, `.codex/`, or `.agents/skills/` as source. Runtime mirrors can be regenerated after source validation, but they are not the proof that the source behavior is correct.

## Execution Options

Preferred path:

1. Read the changed source files from disk.
2. Start a fresh read-only reviewer or fresh generic subagent with only the current source snippets, the intended behavior change, and this checklist.
3. Ask it to evaluate trigger precision, source/runtime boundaries, host entrypoint wording, unsafe overreach, and test coverage.

Fallback path:

- If the current host lacks a dispatch primitive, the runtime cannot call it, or the user explicitly disabled helper agents, do not fake a fresh reviewer.
- Run source contract tests and direct source reads.
- Record `fresh_source_eval: not_run` with the reason. Do not claim fresh-source eval passed.

## Review Questions

The reviewer checks:

- Does the changed source still preserve `Light contract + Explicit boundaries + scripts enforce deterministic invariants; scripts prepare facts; LLM decides semantic adequacy above that floor`?
- Is the entrypoint surface using the unified `spec-*` workflow id correctly across hosts, standalone skills, and internal-only skills?
- Does the text avoid exposing generated runtime assets as source-of-truth?
- Does the change avoid turning helper prose into a hidden workflow command?
- Are trigger rules precise enough to avoid routing unrelated lightweight requests?
- Are source/runtime regeneration needs stated without hand-editing runtime mirrors?
- Are deterministic facts assigned to scripts/tools and semantic judgment assigned to LLM/reviewers?
- Are focused contract tests updated for the changed behavior?
- Is `CHANGELOG.md` updated when project policy requires it?

## Output Template

```yaml
fresh_source_eval:
  status: passed | concerns | not_run
  source_paths:
    - skills/example/SKILL.md
  runtime_paths_checked: [] # usually empty; runtime mirrors are not source
  changed_behavior: "<one sentence>"
  reviewer_context: "fresh source snippets from current disk"
  checks:
    trigger_precision: passed | concerns | not_checked
    source_runtime_boundary: passed | concerns | not_checked
    host_entrypoints: passed | concerns | not_checked
    internal_only_boundary: passed | concerns | not_checked
    deterministic_vs_semantic_boundary: passed | concerns | not_checked
    tests: passed | concerns | not_checked
  findings:
    - severity: P1 | P2 | P3
      issue: "<what would mislead a future agent or user>"
      source: "<file path or section>"
      recommendation: "<minimal source-first fix>"
  not_run_reason: "<only when status is not_run>"
```

## Anti-Patterns

- Do not validate changed skill prose by invoking the same typed skill in the current session; it may still use cached definitions.
- Do not patch `.claude/`, `.codex/`, or `.agents/skills/` to make the eval pass.
- Do not claim a fresh-source eval passed when only normal unit tests or current-session reads were executed.
- Do not use the checklist to require subagent dispatch when the host lacks a dispatch primitive or the user explicitly disabled helper agents.
- Do not require PRs to pass a model judge in CI.
