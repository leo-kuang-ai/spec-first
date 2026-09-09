---
name: spec-doc-review
description: 使用角色化 lens 审查 requirements、plans、task packs 或 specs。适用于改进既有规划与执行文档；默认 standard roster（≤3 reviewers），完整条件 roster 使用 roster:full。
argument-hint: "[mode:headless] [mutation:report-only|mutation:apply-fixes] [output:json] [roster:lite|standard|full] [path/to/document.md]"
---

# Document Review

Review requirements or plan documents through multi-persona analysis. Task packs are reviewed as derived, report-only execution inputs against their current source plan. Dispatches generic subagents seeded with skill-local reviewer prompt assets, applies `safe_auto` fixes only when the run-local mutation policy is `markdown-write`, and preserves the same structural/semantic review as report-only findings when mutation is unavailable or forbidden.

## Workflow Contract Summary

- **输入：** requirements、统一计划、legacy plan、task pack 或其他可读 spec artifact，及可选 roster/output/mutation 参数。
- **输出：** 默认 report-only 的结构化文档 findings、coverage、改进建议与可选 JSON envelope；只有显式 apply 授权才可修改 Markdown。
- **硬出口：** 文档不可读、flag 冲突、task-pack/source-plan 漂移、format/source owner 不明确，或 mutation authority 缺失时不得写入文档。
- **Dispatch boundary:** `worker_dispatch_authorization`, `capability_probe`, `worker_dispatch_capability`, `worker_capability_unproven`, `provider_untrusted`, `dispatch_authorization_missing`, and `subagent_capability_missing` are recorded before dispatch; direct invocation does not authorize workers, and inline fallback never claims independent persona coverage.

```yaml
worker_context_isolation: isolated | inherited | unknown
worker_model_override: supported | unsupported | unknown
worker_bounded_parallelism: supported | unsupported | unknown
worker_dispatch_outcome: <record the live result>
```
- **Mutation boundary:** `mode:headless` / `mode:non-interactive` only change delivery; `requested_mutation: default-report-only` remains the default. Without `mutation:apply-fixes`, ordinary writable Markdown resolves to `report-only`; commit and landing remain unauthorized.
- **权威：** 原文和 source refs 提供事实，persona/LLM 判断语义充分性；producer 拥有 derived artifact 修复，review 不继承 commit/landing authority。
- **消费者：** 文档 owner、`spec-brainstorm`、`spec-plan`、`spec-write-tasks`、`spec-work` 与人工 reviewer。

## Interactive mode rules

Read `references/modes.md` before parsing delivery, mutation, and output flags or firing any interactive question. It owns the eager question-tool preload, non-interactive alias, and delivery-only semantics.

## Phase 0: Detect Mode

Read `references/modes.md` before resolving flags. Then read `references/document-intake.md` before reading or classifying the document.

## Phase 1: Get and Analyze Document

Read `references/document-intake.md` for path, missing-document, classification, and mutation-policy gates.

## Phase 2: Announce and Dispatch Personas

Read `references/persona-selection.md` to select and budget the roster, including the required `cost-shape:` line.

### Dispatch

Read `references/dispatch.md` before dispatch or inline review. It owns authorization, provider/capability facts, context slices, backpressure, model defaults, and failure semantics.

## Phases 3-5: Synthesis, Presentation, and Next Action

Before rendering any finding, read `references/rendering-floor.md`. Its consequence-first wording, recommendation visibility, opaque-token budget, and trace-on-request rules apply to the structured envelope, batch report, walkthrough, bulk preview, and persisted Open Questions entry. Surface-specific layouts may differ, but none may weaken that shared decision floor.

After all dispatched agents return, read `references/synthesis-and-presentation.md` for the synthesis pipeline (validate, anchor-based gate, dedup, cross-persona promotion, contradiction resolution, auto-promotion, three-tier routing with FYI subsection), mutation-policy enforcement, structured envelope output, and the routing-question handoff.

Only when `delivery_mode: interactive` **and** `mutation_policy: markdown-write`, read `references/walkthrough.md` for the four-option routing question and per-finding walk-through. For the bulk-action preview used by best-judgment routing, Append-to-Open-Questions, and walk-through's "Auto-resolve with best judgment on the rest", read `references/bulk-preview.md`. Do not load either before agent dispatch completes, and never load them for `report-only`.

---

## Included References

### Task Pack Review Lens

仅当 Phase 1 分类为 `task-pack` 时读取 [Task Pack Review Lens](references/task-pack-review-lens.md)。

### Subagent Template

@./references/subagent-template.md

### Findings Schema

@./references/findings-schema.json

Selected reviewer prompt assets live under `references/personas/`. Read only the prompt files selected for the current review.

Read `references/dispatch.md` before dispatch or inline review.
