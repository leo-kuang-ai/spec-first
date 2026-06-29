# Execution Handoff Contract

This reference defines the final handoff envelope and validation rules for `spec-write-tasks`.
Read it when compiling an executable task pack, validating an existing task pack, or returning a high-risk review handoff.

`task-pack-schema.md` remains the source of truth for task-pack document structure and task-card fields. This file defines how a run reports its decision and when the result may be handed to `spec-work`.

## Final Decision Envelope

Every `spec-write-tasks` run must end with a compact decision envelope. The envelope is a handoff summary for this run, not persisted workflow state:

```yaml
decision: compile | skip | return-to-plan | draft-only | validate-only
reason_code: source_plan_missing | ambiguous_plan | missing_spec_id | wrong_chain | stale_hash | unverifiable_hash | invalid_contract | repo_scope_missing | scope_gap | small_plan | task_pack_compiled | task_pack_validated | not_applicable
source_plan: docs/plans/... | null
task_pack: docs/tasks/... | null
task_pack_validity: valid | draft | stale | wrong-chain | invalid | unverifiable | not-applicable
deterministic_handoff: true | false
validity_scope: identity-freshness-structure-only
semantic_posture: generated-this-run | reviewed-existing | unchecked-existing | not-applicable
reason: <one sentence>
dispatch_authorization: authorized | missing | not_required | not_applicable
validation:
  spec_id: matched | missing | mismatch | not_checked
  source_plan_hash: matched | missing | mismatch | unavailable | not_checked
  hash_tool: available | unavailable
  source_plan_path: resolved | missing | invalid
  task_pack_contract: valid | invalid | not_checked
orientation:
  provider: direct-repo-reads | lsp | mixed | skipped
  posture: bounded | degraded | skipped-small-plan | unavailable
  evidence_refs: []
  limitations: []
next_action: spec-work-task-pack | review-task-pack | spec-work-plan | revise-plan | stop
```

Use a `Failure Modes` code as `reason_code` whenever the run stops, downgrades, or rejects a handoff. Use `small_plan`, `task_pack_compiled`, `task_pack_validated`, or `not_applicable` only when no failure mode applies. The natural-language `reason` explains the code; it must not be the only machine-readable failure signal.

## Branch Decision Tree

- `compile`: source plan is settled, task-ready, has executable identity, and a derived task pack materially reduces execution risk or context load. Output is an executable task pack plus envelope. `next_action` is `spec-work-task-pack` unless high-risk review handoff is selected.
- `skip`: source plan is small enough for direct work or task compilation adds carrying cost. Output is no task pack, `reason_code: small_plan`, and `next_action: spec-work-plan`.
- `return-to-plan`: scope, acceptance, architecture, repo scope, or verification decisions are missing. Output is no executable task pack, one failure reason, and `next_action: revise-plan`.
- `draft-only`: temporary slicing can aid discussion but identity/hash/structure is not executable. Output is explicitly non-executable and `next_action: revise-plan` or `stop`.
- `validate-only`: existing task pack is checked for identity, freshness, and structure. Output is a validation envelope; only valid and semantically reviewed packs may move to `spec-work-task-pack`.
- high-risk compile handoff without explicit bounded continuation: output `next_action: review-task-pack` and `dispatch_authorization: missing`.

Every branch maps to either an output artifact or an explicit no-artifact rule. No branch may invent implementation scope, mark review as approval, or report deterministic handoff without CLI validation evidence.

## Deterministic Validation Rule

Before filling `deterministic_handoff` and the `validation:` block, you must actually run the deterministic CLI and transcribe its result, not assert it from inspection.

Run:

```bash
spec-first tasks validate <task-pack-path> --json
```

Run `spec-first tasks hash <plan-path>` when computing or comparing the source plan hash.

Copy `deterministic_handoff` and each `validation` field from the CLI JSON output. If the `tasks` subcommand is not runtime-visible or returns an unknown-subcommand error, treat the run as `unverifiable_hash`, set `deterministic_handoff: false`, and downgrade to `draft-only`; never self-report `deterministic_handoff: true` or `validation` matches without the CLI JSON in hand.

`next_action: spec-work-task-pack` is allowed only when `deterministic_handoff: true` and `semantic_posture` is `generated-this-run` or `reviewed-existing`. `deterministic_handoff` proves identity, freshness, and structure only; it does not prove semantic task quality.

`semantic_posture: reviewed-existing` must carry evidence metadata or a verifiable review-outcome reference. A bare `reviewed-existing` claim without current evidence metadata is not sufficient for `next_action: spec-work-task-pack`; treat it as `unchecked-existing` instead. `semantic_posture: generated-this-run` with a current-run hash is sufficient without a separate evidence object.

`dispatch_authorization: authorized` must carry a bounded continuation reference or doc-review outcome reference. If absent, report `dispatch_authorization: missing` rather than proceeding to `spec-work-task-pack`.

## High-Risk Review Handoff

Use `next_action: review-task-pack` as the decisive handoff recommendation for high-risk task packs.

Choose it when the pack contains `review_gate: required` tasks, touches shared contracts, public workflow prose, source/runtime boundaries, security/release/CI surfaces, or has enough tasks/dependencies that semantic drift or over-splitting would be costly. The output must include one concrete reason and a copy-ready current-host document-review invocation for this task pack. This shared reference owns the handoff semantics, not the per-host entrypoint mapping.

For a high-risk pack that resolves to `review-task-pack`, do not dispatch by default. Continue directly into the current host's document review without a separate confirmation step only under all of these conditions:

- the pack is executable (`deterministic_handoff: true`) and `review-task-pack` was selected by the high-risk criteria above,
- the invoking parent workflow or user explicitly authorized this single bounded continuation for the current run; a standalone skill trigger alone is not dispatch authorization,
- the current session is an interactive host that exposes the current host's document-review entrypoint,
- the continuation targets exactly the doc-review of the just-written task pack; do not chain any further workflow, and do not invoke document review as an Agent/Task/subagent type.

When continuing, invoke the current host's document-review entrypoint in headless mode on the task-pack path, then report the doc-review outcome alongside this envelope.

This is bounded auto-continuation, not general workflow chaining: it covers only the single write-tasks -> doc-review edge for high-risk packs, and `spec-write-tasks` still does not become an orchestrator or execution state machine. Set `dispatch_authorization: authorized` only when the explicit authorization condition is met. When any condition is not met, surface the `review-task-pack` recommendation in the returned envelope, and let the caller decide.

## Task Card Reporting Semantics

Executable task cards have two layers:

1. Deterministic contract fields validated by `spec-first tasks validate`: `task_id`, `dependencies`, non-empty concrete `files`, `goal`, `test_focus`, `done_signal`, `wave`, `stop_if`, plus at least one source anchor through `source_unit` or `requirement_refs`.
2. LLM/human quality fields that should be present when they reduce execution context or make delegation staging safe: `context_refs`, `entry_hint`, `parallelizable`, `expected_side_effects`, `risk_note`, `notes`, `review_gate`, `review_focus`, `handoff_owner`, and workspace-scoped `target_repo` when applicable.

Do not imply the CLI validator proves the semantic adequacy of quality fields. The deterministic validator checks `review_gate` structure only (`optional` or `required`) and does not decide which tasks semantically require review. That decision belongs to LLM/human task compilation and downstream `spec-work` judgment.

## Drift And Hash

`source_plan_hash` must be the canonical source plan body hash produced by `spec-first tasks hash <plan-path>`.

`spec_id` is copied from the source plan and is not part of freshness. It links the task pack to the same spec chain; `source_plan_hash` proves the task pack is still derived from the current source plan body.

If the source plan has no `spec_id`, do not generate an executable task pack. Return to `spec-plan` to add the plan-local identity, or produce only a `draft` / `transient` output that is not valid `spec-work` input.

Hash rules:

- Read the source plan as UTF-8 text.
- Normalize `CRLF` / `CR` to `LF`.
- If the first line is `---`, remove the complete frontmatter block; if closing frontmatter is missing, fail closed.
- Hash the remaining Markdown body exactly as canonicalized; do not extract sections or collapse whitespace in MVP.
- Frontmatter fields such as `status` and `spec_id` are not part of freshness; identity is checked separately.

A task pack that can be handed to `spec-work` must use a concrete canonical source plan body hash, for example `sha256:<64-hex>`.

If the current environment has no deterministic hash capability, do not pretend validation happened. Only produce a draft/non-executable task pack or explain that hash tooling is required first. Do not use `pending-tooling`, `unknown`, empty values, or guessed whole-file hashes as executable handoff.

## Lint Boundary

A script may run deterministic lint for:

- complete frontmatter,
- `source_plan` exists,
- `source_plan_hash` format,
- `Task Pack Contract` fenced JSON block exists and parses,
- unique `task_id`,
- dependencies refer to existing tasks,
- files use concrete repo-relative paths,
- same-wave file overlap is absent or serialized.

Do not let scripts judge whether task splitting is semantically good. Splitting, merging, waves, and boundaries are LLM semantic decisions.
