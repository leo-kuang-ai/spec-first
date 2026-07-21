# Mode, Output, And Issue Contract

Deferred contract detail for `spec-app-consistency-audit`. `SKILL.md` keeps the
route-critical mode summary; this reference carries the detailed mode tokens, scope
resolution, Figma materialization, output, issue, and writeback rules.

Source truth for deterministic behavior remains the scripts and tests under
`skills/spec-app-consistency-audit/scripts/` and `tests/unit/spec-app-consistency-audit-*`.

## Mode Tokens

v1 deterministic orchestrator (`scripts/run-audit.js`) accepts `mode:headless` only.
`mode:default` and `mode:report-only` are long-lived canonical-token semantics for
downstream extractors and envelopes, not a promise that every mode has a working
orchestrator today.

Supported canonical tokens:

- `mode:headless`：供显式 automation caller 使用的 programmatic mode；
  ask no user questions, write run-scoped artifacts, return a compact headless
  envelope, and finish with `App consistency audit complete`.
- `mode:report-only`: read-only mode; ask no user questions and write no run artifacts,
  materialized inputs, preview files, metadata, manifest, or latest pointers.
- `base:<sha-or-ref>`：deterministic diff base。`mode:headless` caller 审查 diff 时应传入。
- `source:<repo-relative-path>`: App source root. Defaults to the current repository
  root.
- `prd:<repo-relative-path>`: optional PRD/product input.
- `figma-context:<repo-relative-path>`: local materialized Figma JSON input.
- `figma-ref:<id-or-url>`: reference only. It is not extractable context until
  materialized.
- `industry:<name>`: explicit industry lens. Industry confirmed findings still require
  confirmed industry profile plus project-specific evidence.
- `tech-plan:<repo-relative-path>` and `task-doc:<repo-relative-path>`: optional intent
  inputs; missing values degrade only when explicitly expected by the caller.
- `depth:deep`: focused deepening flag, not a mode and not mutually exclusive with
  headless/report-only.
- `from:code-review`：只为旧 envelope 保留的休眠兼容 marker。当前没有受治理的
  caller 或 consumer，因此不得把该 token 宣传为 active workflow edge。

Conflict and failure rules:

- Multiple mode tokens are invalid. Stop before dispatching experts.
- `mode:headless` without a determinable diff scope returns a failed envelope with
  `scope_headless_missing_base`.
- `mode:report-only` has a strict no-write contract. If a needed extractor only
  supports file output, record degraded coverage instead of writing.
- `figma-ref` in headless/report-only is degraded as `input_figma_reference_only`; do
  not fetch remote Figma data.
- All modes are read-only with respect to product source, generated runtime assets,
  durable standards, and `.spec-first/specs/repo-profile.yaml`.

## Scope Resolution

- `repoRoot` is always the git/project root used for diff, artifact placement, and
  repo-relative public paths.
- `sourceRoot` is the App source subtree selected by `source:<path>`.
- Relative `source:`, `prd:`, `figma-context:`, `run-dir:`, and `artifacts-dir` values
  resolve against `repoRoot`, not against `sourceRoot` or the caller's incidental cwd.
- Diff facts keep all changed files, but app-audit candidate signals are scoped to
  `sourceRoot`; out-of-source changes remain visible as cross-surface context.
- Large text-like files and binary assets may be represented by bounded metadata or
  degraded facts instead of full content hashes.

## Artifact Spine

Default and headless modes write under:

```text
.spec-first/app-audit/runs/<run-id>/
```

The v0.1a contract spine is:

```text
metadata.json
artifact-manifest.json
preflight.json
impact-facts.json
app-audit-context.json
issues.json
audit-report.json
app-consistency-audit.md
app-consistency-audit.summary.md
headless-envelope.txt
```

`latest-summary.json` is only a pointer to the latest complete/degraded run. Consumers
must validate it against `metadata.json` before trusting any run artifact. The
`metadata.json` status machine (`started` -> `complete`/`degraded`/`failed`) and the
`issue_synthesis_status` enum (`not_run` / `llm_provided` / `fixture_provided`) are
enforced by `validate-artifacts.js` and explained in `headless-runner.md`.

Do not write new artifacts to the legacy flat `.spec-first/app-audit/` path. Legacy
flat paths may be read only for migration compatibility tests.

## Figma Materialization

Figma extraction consumes a local JSON context file. A Figma node or file reference is
not the same as an extractable context.

If the user provides a Figma node/file reference rather than `--figma-context`:

1. Use the available host Figma MCP tool to fetch the design context.
2. In interactive/default mode only, write the normalized raw MCP response to:

   ```text
   .spec-first/app-audit/runs/<run-id>/input/figma-context.json
   ```

3. Run `extract-figma-contract.js` with:

   ```bash
   node skills/spec-app-consistency-audit/scripts/extract-figma-contract.js \
     --source . \
     --figma-context .spec-first/app-audit/runs/<run-id>/input/figma-context.json \
     --output .spec-first/app-audit/runs/<run-id>/contracts/figma-design-contract.json
   ```

Do not mark Figma design evidence as materialized until the local context JSON exists
and is readable. Preflight distinguishes `has_figma_reference` from
`has_figma_materialized_context`.

In `mode:headless` and `mode:report-only`, do not materialize remote Figma context.
Record the degraded mode and keep design-alignment findings as skipped/advisory unless
a local materialized context is already provided.

## Figma Redaction

Default to `--redaction internal`.

- `strict`: keep only hashes and metadata; omit raw labels and text.
- `internal`: keep short non-sensitive screen, component, and text labels for
  PRD/Figma/Code matching; hash every label.
- `none`: keep full labels/text only when the user explicitly allows it.

Do not retain long text or sensitive-looking text by default.

## Output And Writeback

Default outputs are local audit artifacts that separate final review results from
preview-only writeback suggestions.

The final report should include evidence-backed consistency issues, degraded-mode
notes, runtime-verification recommendations, real-device follow-ups, and regression
suggestions.

Preview-only writeback outputs may be written under:

```text
.spec-first/app-audit/runs/<run-id>/writeback-preview/repo-profile.patch.yaml
.spec-first/app-audit/runs/<run-id>/writeback-preview/suggested-standards.md
```

These outputs do not modify product source, generated runtime assets, durable project
standards, or `.spec-first/specs/repo-profile.yaml` unless the user explicitly confirms
a separate apply step.

## Issue Protocol

Every issue must include:

- `static_confirmed`
- `requires_runtime_verification`
- `requires_real_device`
- `contract_status`
- `confidence`
- `provenance`
- `evidence`
- `claim_family`
- `claim_type`
- `affected_surface`
- `impact`
- `recommendation`
- `related_rule_packs`
- `runtime_verification`
- `validation_status`
- `review_lifecycle`
- `data_sensitivity`

Weak evidence may be reported as risk, candidate, or follow-up. It must not be promoted
to a confirmed issue.

Strict issue protocol:

- `confidence` is a number from 0 to 1.
- `contract_status: confirmed` requires `confidence >= 0.75`; lower confidence findings
  must remain `candidate` or advisory even when they cite project evidence.
- `contract_status: confirmed` requires `static_confirmed: true`; `candidate` and
  `rejected` issues require `static_confirmed: false`.
- `provenance` and `evidence` entries must contain a traceable project field such as
  `file`, `path`, `artifact_id`, `node_id`, `route`, `event`, or `key`.
- `industry:<name>` is an explicit lens, not a confirmed industry profile; confirmed
  industry issues require caller-provided `confirmedIndustry` evidence plus
  project-specific evidence.
- `impact` and `recommendation` are arrays.
- `claim_family` controls deterministic evidence requirements and conclusion caps.
- `claim_type` describes the domain issue semantics.
- `code_review_handoff` 只为旧 artifact 保留休眠兼容；它不建立 active
  `spec-code-review` consumer。App-audit itself does not emit `safe_auto`.
- `validation_status` starts as `not_required`; validation pass is deferred beyond
  v0.1a.
