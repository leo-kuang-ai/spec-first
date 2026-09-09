# Input Triage

Resolve all `references/...` paths from the `spec-work` skill root.

## Owned

Mode parsing, metadata-first classification, historical continuation, and blank or bare-prompt routing.

The optional typed caller binding has exactly four fields: `mode`, `target`, `model`, and `source`. `mode` is `prefer` or `require`; `model` is a string pin or `null`; `source` is a non-empty caller-visible provenance string. Fully validate and normalize both before any workspace action. Reject malformed JSON, missing/extra fields, invalid field types or values, unsafe run ids, or duplicate carriers.

## Not Owned

Changing source-plan scope, granting authority, or replacing another phase owner's verification and lifecycle rules.

## Trigger

Read in full at Phase 0 before classifying the invocation.

## Fallback

If this owner cannot be read, preserve state and return blocked before execution.

**First, parse a leading mode token.** If `<input_document>` begins with `mode:return-to-caller` (or the legacy aliases `mode:caller-owned-tail` / `caller:lfg`), strip that token before anything else: the remainder of the string is the plan path, and this run executes in **Return-to-Caller Mode** (see § Return-to-Caller Mode) — implement and locally verify only, then return the structured envelope instead of running the standalone shipping tail. Classify the stripped plan path with the rules below. A mode token with no following path is an error: report it rather than treating `mode:return-to-caller` as a bare prompt.

Determine how to proceed based on what was provided in `<input_document>` (after any mode token is stripped).

The classification order is `mode token -> file metadata -> task pack -> unified plan -> legacy plan / knowledge-work -> bare prompt`. Do not classify by filename alone.

**File document** (input is a path to an existing plan, specification, or task pack): read only the metadata first — YAML frontmatter for Markdown, or visible header metadata for HTML.

If Markdown metadata carries `type: task-pack`, do not read the full task-pack body before this classification. Load `references/work-intake-and-task-pack.md` and follow its deterministic validation, source-plan replay, semantic-fit, Task Pack Contract/Waves, drift, task review, failure handoff, and lifecycle rules. A validated task pack is a first-class execution input, but its source plan remains authoritative and the task pack stays `status: derived`. This branch replaces the remaining file classification; after successful intake, continue Phase 1 with the resolved source plan plus validated contract.

For a declared unified artifact, validate critical metadata before classification. Duplicate critical metadata, missing `artifact_readiness` or `execution`, or a conflict between visible HTML metadata and content shape is invalid. Fail closed to a `spec-plan <plan-path>` repair handoff; do not normalize, merge, or guess the intended value. This validation applies only after the artifact declares `artifact_contract: spec-unified-plan/v1`; a truly legacy plan with no unified contract remains on the compatibility path below.

Before readiness classification, inspect lifecycle `status`. Only `status: active` is eligible for a new implementation run. `completed`, `partially-shipped`, or `superseded` returns `source-plan-non-active` and must not enter `spec-work`, generate execution tasks, or be treated as implementation-ready even when `artifact_readiness: implementation-ready` remains in historical metadata. A legacy plan with no managed status may continue only with `source-plan-lifecycle-unmanaged` recorded as a limitation. **A discovered mismatch between plan status and source reality is a finding, not authorization.** "The plan says completed but the code doesn't have it yet", "the user asked to finish it", or a recorded limitation note never converts a non-active plan into an executable one — return `source-plan-non-active` with the mismatch as a finding for the plan owner instead of implementing.

When the current user explicitly requests completion of the historical plan, return `source-plan-non-active` and hand its path, current source gap, verification evidence, and existing authorization to `spec-plan` Phase 0.1. Once that owner verifies a valid successor or produces a new plan, repeat full intake and continue. Preserve the old plan and old task-pack pins; do not stop at an unactionable error or implement before owner resolution. Read-only review or embedded continuation text does not trigger this path.

- If it carries `artifact_contract: spec-unified-plan/v1`, classify `artifact_readiness` before reading the body.
  - `artifact_readiness: requirements-only` -> stop and tell the user this Product Contract needs `spec-plan` enrichment before implementation. Offer the exact `spec-plan <plan-path>` handoff.
  - `artifact_readiness: implementation-ready` plus `execution: code` -> continue to Phase 1 using the unified-plan reader strategy below.
  - Any other readiness value or any non-code/unclassified execution mode -> do not auto-execute as code. Route `execution: knowledge-work` to the non-code carve-out; otherwise ask the user to return to `spec-plan` to produce an implementation-ready code plan.
  - Progress-like values (`active`, `in_progress`, `completed`, `done`) are invalid readiness values. Stop and ask for plan repair rather than guessing.
- If it carries `execution: knowledge-work`, this is a **non-code plan** — read `references/non-code-execution.md` and follow that carve-out instead of the rest of this workflow.
- Otherwise (legacy plan, field absent, or `execution: code`) -> continue to Phase 1 and run the normal code lifecycle. Exception: metadata that carries a progress-like `artifact_readiness` value (`active`, `in_progress`, `completed`, `done`) without declaring the unified contract is still an invalid readiness marker, not a legacy plan — stop and ask for plan repair exactly as in the declared-contract branch instead of silently entering the code lifecycle.

**Blank invocation latest-plan discovery:** when `<input_document>` is blank, glob `docs/plans/*.md` and `docs/plans/*.html`, inspect metadata for the newest candidates, and only auto-select an active plan that is `artifact_readiness: implementation-ready` plus `execution: code` or an eligible legacy code plan. Never select `completed`, `partially-shipped`, or `superseded`. Stop instead of silently executing when the newest matching artifact is requirements-only, non-active, `execution: knowledge-work`, an approach-plan, or an unclassified universal/answer-seeking output. Ask for an explicit path or a `spec-plan` enrichment step. **Superseded sibling:** if a requirements-only candidate has a same-basename file in the other format (`<basename>.md` / `<basename>.html`) that is active and `implementation-ready`, a format conversion left the requirements-only copy stale — select the active implementation-ready sibling and execute it rather than stopping.

**Bare prompt** (input is a description of work, not a file path): read `references/work-intake.md` for bounded discovery and routing. Open-ended symptoms still belong to `spec-debug`; no unclear prompt grants worker or egress authorization.
