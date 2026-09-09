# Document intake and classification

## Phase 1: Get and Analyze Document

**If a document path is provided:** Read it, then proceed; if the read fails, apply the missing-document gate below. **If no document is specified (interactive mode):** Ask which document to review, or find the most recent in `docs/brainstorms/` or `docs/plans/`. **If no document is specified (non-interactive/headless mode):** Output this exact string, verbatim (machine-facing contract, do not localize): "Review failed: headless mode requires a document path. Re-invoke with: Skill(\"spec-doc-review\", \"mode:headless <path>\")" without dispatching agents. `mode:non-interactive` is the current spelling; the headless wording remains a compatibility alias.

**Missing-document gate — verify before any dispatch.** Some persona reviewers lack shell access and cannot recover a path that only exists on an un-checked-out ref. Before Phase 2, confirm every resolved path is readable on disk (location doesn't matter — an absolute path outside the checkout or another worktree is valid). If any path is unreadable, do not dispatch personas: **interactive** — "Document(s) not found on disk: <paths>. If they only exist on another branch, check it out (or use a worktree) and re-invoke; otherwise correct the path(s)."; **headless** — "Review failed: document(s) not found on disk: <paths>. Check out the branch containing them (or pass paths to files on disk) and re-invoke."

### Classify Document Type
Classify by reading its **content shape**, not its file path. Path is a tie-breaker hint, not the primary signal.

首先检查 task-pack identity：frontmatter 含 `type: task-pack` 时，`type: task-pack` → classify as `task-pack`。`source_plan`、`source_plan_hash` 与 `Task Pack Contract` shape 用于后续 deterministic intake，不是 classification 前置条件；malformed pack 也不能降级解释成普通 plan。`task-pack` 分类优先于 unified requirements/plan 与通用 content-shape 分类。

First check the unified artifact contract: `artifact_contract: spec-unified-plan/v1` plus `artifact_readiness: requirements-only` -> classify as `unified-requirements` (review Product Contract only; absent Planning Contract/Units/Verification/DoD is expected). Same contract plus `artifact_readiness: implementation-ready` -> classify as `unified-plan` (review Product Contract and Planning Contract with different lenses, then Implementation Units/Verification/DoD for execution completeness). Invalid progress-like readiness values (`active`, `in_progress`, `completed`, `done`) are a document-contract finding, not an execution state to honor.

**STOP. 当 classification 为 `task-pack` 时，立即读取 `references/task-pack-review-lens.md`，完成 deterministic intake、current source-plan read、task-pack-specific semantic lens 与 terminal-owner mapping；这些步骤必须在 persona selection/dispatch 前完成。**

### Resolve Mutation Policy

After reading and classifying the document, set exactly one run-local `mutation_policy`, independently from `delivery_mode`:

- `report-only` — `task-pack` 强制使用 `report-only`，并记录 `mutation_reason: task-pack-derived-artifact`。Task pack 由 `spec-write-tasks` 生成且 JSON contract / human-readable mirror 必须同源；reviewer 只能返回 producer fix candidates，不得直接 patch derived artifact。显式 `mutation:report-only` 不覆盖这个更具体的 mandatory reason。
- `markdown-write` — only when `requested_mutation: apply-fixes`, the document is confirmed writable Markdown, and no mandatory report-only reason applies. Record `mutation_reason: caller-requested-apply-fixes`. Markdown `safe_auto`, walkthrough Apply, bulk Apply, and Open Questions append paths remain available; commit and landing remain unauthorized.
- `report-only` — when `requested_mutation: report-only` and the document is confirmed writable Markdown. Record `mutation_reason: caller-requested-report-only` and keep the file byte-preserving.
- `report-only` — when `requested_mutation: default-report-only` and the document is confirmed writable Markdown. Record `mutation_reason: default-review-report-only`; ordinary review never acquires write authority from file format or host capability.
- `report-only` — mandatory for HTML content or a `.html` artifact. Run the same reviewer roster, schema validation, confidence gate, deduplication, severity routing, Coverage, and limitations reporting, but do not invoke any document mutation path.
- `report-only` — also mandatory when the document is confirmed Markdown but the platform cannot write it. Record `mutation_reason: write-unavailable`; keep the full review and finding envelope, but do not imply that Markdown mutation was attempted.
- If extension, declared format, and content shape conflict, or the format remains ambiguous, fail closed to `report-only` and record `mutation_reason: format-conflict-or-ambiguous` in the envelope. Never guess Markdown write eligibility from the path alone.

For ordinary HTML use `mutation_reason: html-artifact`. A report-only request is valid in both headless and interactive delivery; interactive delivery still returns the structured report-only envelope and does not offer a mutation walkthrough.

Existing mandatory reasons retain their diagnostic meaning: task packs remain `task-pack-derived-artifact`, HTML remains `html-artifact`, write-unavailable Markdown remains `write-unavailable`, and format conflict/ambiguity remains `format-conflict-or-ambiguous` even when the caller requested apply. `caller-requested-apply-fixes` applies only to otherwise writable, unambiguous Markdown that is not a task pack. Without `mutation:apply-fixes`, ordinary writable Markdown resolves to `report-only`; delivery mode, JSON output, file writability, or permission settings cannot supply missing mutation authority.

**Core classification rules (apply these first):**

- **`task-pack`**: Frontmatter `type: task-pack`; derived metadata such as `generated_by: spec-write-tasks`、`mode: derived`、`source_plan`、`source_plan_hash`; headings `Task Pack Contract`、`Execution Waves`、`Task Cards`。Task-pack identity 优先，不因正文含 U-ID、files 或 verification 而归类成 `plan`。
- **`requirements`**: Frontmatter fields like `actors:`, `flows:`, `acceptance_examples:`; headings like `Acceptance Examples`, `Actors`, `Key Flows`; IDs like `R1`, `A1`, `F1`, `AE1`; prose focused on user/business problem and scope. No implementation units, per-unit file lists, or test scenarios.
- **`plan`**: Frontmatter fields like `type: feat|fix|refactor`, `origin:`, `product_contract_source:`; headings like `Implementation Units`, `Key Technical Decisions`, `Risks & Dependencies`; IDs like `U1`, `U2`; per-unit `Goal`, `Files`, `Approach`, `Test scenarios`, `Verification`; repo-relative paths.
- **Ambiguity rule:** Content shape and metadata are authoritative; path location never disambiguates a mixed document because both requirements and plans may share the same directory. If signals remain genuinely ambiguous after the core rules, read `references/document-classification-signals.md`; if it still cannot be resolved, default to `requirements` and record the ambiguity rather than guessing from the filename.

**STOP. If classification is genuinely ambiguous after applying the core rules above, read `references/document-classification-signals.md` for the full signal lists before proceeding to persona selection.**

Pass the classification result to each persona via the `{document_type}` slot in the subagent template.
