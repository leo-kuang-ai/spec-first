# Document Classification Signals

This is a **lazy reference** for SKILL.md. Load when the core classification rules in the spine don't yield a clear classification. The spine classification rules are:

1. First check task-pack identity (`type: task-pack`; malformed packs still keep this classification)
2. Then check for unified artifact contract (`artifact_contract: spec-unified-plan/v1`)
3. Otherwise: content shape is authoritative, path is a tie-breaker hint

---

## `task-pack` signals（derived execution documents）

- Frontmatter `type: task-pack`；通常同时包含 `generated_by: spec-write-tasks`、`status: derived`、`mode: derived`、`source_plan` 与 `source_plan_hash`
- 正文包含 `Task Pack Contract` fenced JSON、`Execution Waves`、`Task Cards`、`Traceability Matrix` 或 `Regeneration Rules`
- JSON tasks 使用 `task_id`、`dependencies`、`files`、`test_focus`、`done_signal`、`wave`、`stop_if` 等执行字段
- 内容可能出现 U-ID、R-ID、repo-relative files 和 verification，但这些信号不能把 task pack 重新分类为 plan；task pack 始终是 source plan 的 derived index

## `requirements` signals (what-to-build documents)

- Frontmatter fields like `actors:`, `flows:`, `acceptance_examples:`, or `status:` carrying brainstorm-shaped values
- Section headings such as `Acceptance Examples`, `Actors`, `Key Flows`, `User Flows`, `Outstanding Questions`, `Resolve Before Planning`
- Numbered identifiers in the form `R1`, `R2`, `A1`, `F1`, `AE1` — requirement, actor, flow, and acceptance-example IDs
- Prose framing focused on user/business problem, behavior, scope boundaries, success criteria
- No implementation units, no per-unit file lists, no test scenarios attached to units

## `plan` signals (how-to-build documents)

- Frontmatter fields like `type: feat|fix|refactor`, `origin: docs/brainstorms/...`, or `product_contract_source: spec-brainstorm|spec-plan-bootstrap|legacy-requirements`
- Section headings such as `Implementation Units`, `Output Structure`, `Key Technical Decisions`, `Risks & Dependencies`, `System-Wide Impact`
- Numbered identifiers in the form `U1`, `U2` — implementation unit IDs
- Per-unit fields named `Goal`, `Files`, `Approach`, `Test scenarios`, `Verification`
- Repo-relative file paths to create/modify/test
- Prose framing focused on technical decisions, sequencing, and implementer-facing detail

## Tie-breaker rule

When the content signals are mixed or sparse, fall back to path: legacy `docs/brainstorms/` → `requirements`, `docs/plans/` → `plan` unless unified metadata says otherwise. When neither path location applies, treat the dominant content shape as authoritative; if shape is genuinely ambiguous, default to `requirements` (the more conservative classification — it activates fewer plan-specific feasibility checks).
