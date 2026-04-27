---
name: spec-standards
description: "Generate CRG-first standards proposal drafts, then hand deterministic helpers a machine-checkable payload for review."
argument-hint: "[target repo path. Blank uses current working directory]"
---

# Spec-First Standards

`spec-standards` builds a standards proposal from CRG evidence and targeted repo reads. Formal standards under `docs/specs/**` are written only by deterministic helpers after explicit human confirmation.

Core boundary:

```text
spec-graph-bootstrap
  prepares query-first engineering facts

spec-standards
  uses those facts to draft standards proposals

spec-first specs write-proposal / validate-run
  performs deterministic schema/path/redaction/write checks

human confirm / promote
  is required before anything becomes official docs/specs/** standards
```

## Invocation

```bash
$spec-standards [target-repo-path]
```

Claude Code entrypoint is `/spec:standards`; Codex entrypoint is `$spec-standards`. Package CLI helpers are `spec-first specs <subcommand>`, not `spec-first standards`.

## Phase 0: Target And Graph Readiness

1. Resolve the target repo. If no target is provided, use the current working directory.
2. If the target looks like a parent workspace, use CRG workspace preflight first:

   ```bash
   spec-first crg workspace scan --root=<workspace>
   spec-first crg workspace status --root=<workspace>
   spec-first crg workspace context --root=<workspace> --task="generate project standards"
   ```

   Do not write proposal artifacts for a parent workspace until the user has selected a concrete child repo, unless the parent is explicitly a standards repo.

3. Check CRG readiness with workflow context:

   ```bash
   spec-first crg workflow-context --stage=plan --repo=<target> --task="generate project standards"
   ```

`--stage=plan` is only a compatibility read mode for MVP-A. This workflow is a CRG consumer, not a new CRG lifecycle stage.

If graph state is `missing` or `unavailable`, continue in direct-only degraded mode using targeted repo reads. Do not present code-inferred rules as high-confidence or promote-ready.

## Phase 1: Evidence Gathering

Use CRG evidence first when available:

```bash
spec-first crg locate --repo=<target> --query="<area>" --limit=5
spec-first crg architecture --repo=<target>
spec-first crg explain --repo=<target> --node="<node-or-file-id>"
```

Then supplement with targeted direct reads such as `package.json`, manifests, README, CI config, test roots, and files named by CRG navigation. Do not read the entire repo or all docs by default.

Record limitations from graph quality, skipped sensitive files, parse errors, direct-only fallback, and unavailable queries.

## Phase 2: Draft Standards Proposal

Generate a proposal payload, not files. The payload must follow:

```text
docs/contracts/specs/standards-proposal-payload-v1.schema.json
```

Minimum output categories:

- `preview_markdown`: human-readable review summary.
- `detected_profiles`: project type, language, framework, and scope hints.
- `evidence_map`: CRG generation, evidence mode, source queries, limitations, and draft links.
- `drafts[]`: markdown draft specs under `drafts/**`.
- `rejected`: fixed markdown files for inferred-but-rejected, uncertain, and conflict candidates.

Drafts must include Markdown frontmatter with at least:

```yaml
---
spec_id: common-architecture
title: Architecture
source: extracted
confirmation_status: inferred
lifecycle_status: active
level: L3
priority: 80
severity: medium
confidence: medium
status: active
---
```

Use numeric `priority` from `0` to `100`; use `severity` for `info | low | medium | high | critical`; use `confidence` for evidence confidence.

## Phase 3: Deterministic Write

Write the payload through the helper:

```bash
spec-first specs write-proposal \
  --run-id <YYYYMMDD-HHMMSS-lowerid> \
  --target <target-repo> \
  --payload <proposal-payload.json>
```

The helper writes only:

```text
.spec-first/workflows/spec-standards/<target-slug>/<run-id>/
```

It must not write `docs/specs/**` in MVP-A.

Then validate the run:

```bash
spec-first specs validate-run --run-id <run-id> --target <target-repo>
```

If validation fails, fix the payload and write a new run id. Do not overwrite an existing run.

## Phase 4: Optional Human Promote

Promotion is the human-confirmed boundary. Review `preview.md`, `evidence-map.json`, and `drafts/**` first. For all-confirmed runs:

```bash
spec-first specs init --target <target-repo>
spec-first specs promote --run-id <run-id> --target <target-repo> --accept-all
```

For file-level decisions:

```bash
spec-first specs promote \
  --run-id <run-id> \
  --target <target-repo> \
  --accept drafts/common/architecture.md \
  --reject drafts/backend/api.md \
  --defer drafts/frontend/component.md
```

If a draft needs editing, edit the draft markdown inside the proposal run first, then pass that draft to `--accept`. This keeps edit semantics human-owned while the helper handles deterministic path validation, promote, and index rebuild.

Rules:

- `promote` fails closed unless `--accept-all` or at least one of `--accept` / `--reject` / `--defer` is present.
- promoted extracted drafts are rewritten to `confirmation_status: confirmed`.
- `docs/specs/custom/**` and `source=manual` files are never overwritten.
- `promote` rebuilds `docs/specs/_index/**` through `spec-first specs index`.
- use `--accept-all` only when the human has accepted every draft in the run.
- use file-level `--accept` / `--reject` / `--defer` when only part of the proposal should become formal standards.

Manual standards can be indexed without frontmatter:

```bash
spec-first specs index --target <target-repo>
```

The index helper infers metadata from the path and marks `metadata_inferred: true`.

Read-only inspection helpers:

```bash
spec-first specs list --target <target-repo> --scope backend
spec-first specs validate --target <target-repo>
```

`list` reads `_index/specs-index.json`; `validate` scans formal standards frontmatter and reports errors/warnings without changing files.

## Phase 5: Optional Resolve For Consumers

After formal standards exist under `docs/specs/**`, consumers should resolve task-specific standards from the index instead of reading all specs:

```bash
spec-first specs resolve \
  --target <target-repo> \
  --task "<task description>" \
  --files "<comma-separated changed or planned files>"
```

When a downstream workflow needs durable handoff files, pass a consumer and task id:

```bash
spec-first specs resolve \
  --target <target-repo> \
  --task "<task description>" \
  --files "<comma-separated changed or planned files>" \
  --consumer spec-work \
  --task-id <task-id>
```

The helper reads `docs/specs/_index/specs-index.json` and `rules-map.json`, then writes a load plan with `load_full`, `load_summary`, `load_reference`, and `excluded`. Optional consumer artifacts are written under:

```text
.spec-first/workflows/<consumer>/<task-id>/
  resolve-result.json
  implement.jsonl
  check.jsonl
```

`resolve` is an input-quality helper, not a gate. It must set `metadata.hard_gate=false`; the LLM still decides how the resolved standards affect plan/work/review.

## Phase 6: Optional Check For Current Changes

After formal standards have been indexed, `check` can produce a lightweight review-assistance report for current changes:

```bash
spec-first specs check --target <target-repo> --changed --base <ref>
```

or with explicit files:

```bash
spec-first specs check \
  --target <target-repo> \
  --files "<comma-separated changed files>" \
  --task "<task description>"
```

The helper calls `spec-first specs resolve`, writes `.spec-first/workflows/spec-check/<task-id>/` context, and writes:

```text
docs/specs/reports/spec-check-report.json
docs/specs/reports/spec-check-report.md
```

`check` is deterministic review preparation, not semantic verification. It lists loaded standards, candidate rules, and enforcement posture:

- `manual` or `custom` with `severity=critical|high` -> `blocking_suggestion`
- confirmed extracted standards -> `warning_or_blocking_suggestion`
- inferred standards -> `warning`
- uncertain or conflict standards -> `human_confirmation`

It must set `hard_gate=false`. The LLM/reviewer still needs diff evidence before reporting a violation.

## Phase 7: Optional Refresh

When users manually edit `docs/specs/**`, refresh the machine-readable indexes without changing standards markdown:

```bash
spec-first specs refresh --target <target-repo> --index-only
```

When code changes suggest the standards may need to evolve, request a standards proposal instead of mutating formal standards directly:

```bash
spec-first specs refresh --target <target-repo> --changed --base <ref> --task "<why refresh standards>"
```

or with explicit files:

```bash
spec-first specs refresh --target <target-repo> --files "<comma-separated changed files>" --task "<why refresh standards>"
```

The helper writes:

```text
docs/specs/reports/spec-refresh-report.json
docs/specs/reports/spec-refresh-report.md
.spec-first/workflows/spec-standards-refresh/<target-slug>/<run-id>/refresh-request.json
.spec-first/workflows/spec-standards-refresh/<target-slug>/<run-id>/preview.md
.spec-first/workflows/spec-standards-refresh/<target-slug>/<run-id>/check.jsonl
```

The proposal request shape is documented in:

```text
docs/contracts/specs/standards-refresh-proposal-request-v1.schema.json
```

`refresh --index-only` must:

- rebuild `docs/specs/_index/**`
- not modify `docs/specs/**/*.md` standards outside `_index/**` and `reports/**`
- report `modified_standards: []` for a clean index-only run
- set `hard_gate=false`

`refresh --changed` must:

- resolve the task-relevant existing standards from `_index/**`
- write a proposal request for `$spec-standards`
- not modify `docs/specs/**/*.md` standards outside `reports/**`
- set `hard_gate=false`
- require a later `$spec-standards` proposal and human `promote` before any formal standards change

## Phase 8: Report

Report:

- proposal run path
- graph state and evidence mode
- detected profiles
- draft files generated
- rejected / uncertain / conflict files
- limitations and redaction notes
- if promoted, formal `docs/specs/**` files and `_index/**` summary
- if resolved, `load_full` / `load_summary` counts and optional consumer context path
- if checked, `docs/specs/reports/spec-check-report.md` and review item counts
- if refreshed, `docs/specs/reports/spec-refresh-report.md` and index summary
- next step: review `preview.md`; promote is never automatic

## Done Signals

This workflow is complete when:

- `spec-first specs write-proposal` succeeds.
- `spec-first specs validate-run` returns `valid: true`.
- The user can inspect `preview.md`, `evidence-map.json`, and `drafts/**`.
- Formal `docs/specs/**` standards are written only when the user explicitly confirms promotion with `spec-first specs promote --accept-all` or file-level `--accept`.
- Optional `spec-first specs resolve` can produce task-specific context after `_index/**` exists, without becoming a hard gate.
- Optional `spec-first specs check` can produce a review-assistance report after `_index/**` exists, with `hard_gate=false`.
- Optional `spec-first specs refresh --index-only` can rebuild `_index/**` after manual standards edits, without changing standards markdown.
