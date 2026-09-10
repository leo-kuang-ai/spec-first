# Document intake and classification

## Phase 1: Get and Analyze Document

**If a document path is provided:** Read it directly; do not require a repo-root
or configuration lookup for an explicit readable path. If the read fails, use
the missing-document gate below. **If no document is specified (interactive
mode):** Ask which document to review, or discover the most recent artifact in
`docs/plans/` (legacy `docs/brainstorms/` when relevant). **If no document is
specified (non-interactive/headless mode):** emit the exact machine-facing
error and stop without dispatch: "Review failed: non-interactive mode requires
a document path. Expected arguments: mode:non-interactive <path>". Render that
error as one line. Both mode spellings use this same input contract.

**Missing-document gate — verify before any dispatch.** Some persona reviewers lack shell access and cannot recover a path that exists only on an unchecked-out ref. Confirm every resolved path is readable on disk, including paths outside the checkout. If any path is unreadable, do not dispatch personas. Interactive output names the missing paths and the checkout/worktree or corrected-path remedy. Non-interactive output is: "Review failed: document(s) not found on disk: <paths>. Expected input: readable files on disk; check out the branch containing them or provide corrected paths." Stop this review attempt; the error is an input correction, not an instruction to invoke this workflow again.

### Classify Document Type
Classify by reading its **content shape**, not its file path. Metadata and content determine the type; path location never disambiguates it.

First check task-pack identity: `type: task-pack` -> classify as `task-pack`.
`source_plan`, `source_plan_hash`, and `Task Pack Contract` are checked during
deterministic intake, not required to recognize the type. A malformed task pack
must not fall back to an ordinary plan. `task-pack` classification precedes
unified requirements/plan and general content-shape classification.

First check the unified artifact contract: `artifact_contract: spec-unified-plan/v1` plus `artifact_readiness: requirements-only` -> classify as `unified-requirements` (review Product Contract only; absent Planning Contract/Units/Verification/DoD is expected). Same contract plus `artifact_readiness: implementation-ready` -> classify as `unified-plan` (review Product Contract and Planning Contract with different lenses, then Implementation Units/Verification/DoD for execution completeness). Invalid progress-like readiness values (`active`, `in_progress`, `completed`, `done`) are a document-contract finding, not an execution state to honor.

**STOP. For `task-pack`, read `references/task-pack-review-lens.md` immediately.
Complete deterministic intake, the current source-plan read, the task-pack
semantic lens, and terminal-owner mapping before persona selection/dispatch.**

### Resolve Mutation Policy

After reading and classifying the document, set exactly one run-local `mutation_policy`, independently from `delivery_mode`:

- `report-only` — `task-pack` always requires `report-only`, with `mutation_reason: task-pack-derived-artifact`. `spec-write-tasks` owns generation of the JSON contract and human-readable mirror from one source. Return producer fix candidates only; never patch the derived artifact. An explicit report-only flag does not replace this more specific reason.
- `markdown-write` — only when `requested_mutation: apply-fixes`, the document is confirmed writable Markdown, and no mandatory report-only reason applies. Record `mutation_reason: caller-requested-apply-fixes`. Markdown `safe_auto`, walkthrough Apply, bulk Apply, and Open Questions append paths remain available; commit and landing remain unauthorized.
- `report-only` — when `requested_mutation: report-only` and the document is confirmed writable Markdown. Record `mutation_reason: caller-requested-report-only` and keep the file byte-preserving.
- `report-only` — when `requested_mutation: default-report-only` and the document is confirmed writable Markdown. Record `mutation_reason: default-review-report-only`; ordinary review never acquires write authority from file format or host capability.
- `report-only` — mandatory for HTML content or a `.html` artifact. Run the same reviewer roster, schema validation, confidence gate, deduplication, severity routing, Coverage, and limitations reporting, but do not invoke any document mutation path.
- `report-only` — also mandatory when the document is confirmed Markdown but the platform cannot write it. Record `mutation_reason: write-unavailable`; keep the full review and finding envelope, but do not imply that Markdown mutation was attempted.
- If extension, declared format, and content shape conflict, or the format remains ambiguous, fail closed to `report-only` and record `mutation_reason: format-conflict-or-ambiguous` in the envelope. Never guess Markdown write eligibility from the path alone.

For ordinary HTML use `mutation_reason: html-artifact`. A report-only request is valid in both headless and interactive delivery; interactive delivery still returns the structured report-only envelope and does not offer a mutation walkthrough.

Existing mandatory reasons retain their diagnostic meaning: task packs remain `task-pack-derived-artifact`, HTML remains `html-artifact`, write-unavailable Markdown remains `write-unavailable`, and format conflict/ambiguity remains `format-conflict-or-ambiguous` even when the caller requested apply. `caller-requested-apply-fixes` applies only to otherwise writable, unambiguous Markdown that is not a task pack. Without `mutation:apply-fixes`, ordinary writable Markdown resolves to `report-only`; delivery mode, JSON output, file writability, or permission settings cannot supply missing mutation authority.

**Core classification rules (apply these first):**

- **`task-pack`**: Frontmatter `type: task-pack`; derived metadata such as `generated_by: spec-write-tasks`, `mode: derived`, `source_plan`, `source_plan_hash`; headings `Task Pack Contract`, `Execution Waves`, `Task Cards`. Task-pack identity takes precedence even when content includes U-IDs, files, or verification.
- **`requirements`**: Frontmatter fields like `actors:`, `flows:`, `acceptance_examples:`; headings like `Acceptance Examples`, `Actors`, `Key Flows`; IDs like `R1`, `A1`, `F1`, `AE1`; prose focused on user/business problem and scope. No implementation units, per-unit file lists, or test scenarios.
- **`plan`**: Frontmatter fields like `type: feat|fix|refactor`, `origin:`, `product_contract_source:`; headings like `Implementation Units`, `Key Technical Decisions`, `Risks & Dependencies`; IDs like `U1`, `U2`; per-unit `Goal`, `Files`, `Approach`, `Test scenarios`, `Verification`; repo-relative paths.
- **Ambiguity rule:** Content shape and metadata are authoritative; path location never disambiguates a mixed document because both requirements and plans may share the same directory. If signals remain genuinely ambiguous after the core rules, read `references/document-classification-signals.md`; if it still cannot be resolved, default to `requirements` and record the ambiguity rather than guessing from the filename.

**STOP. If classification is genuinely ambiguous after applying the core rules above, read `references/document-classification-signals.md` for the full signal lists before proceeding to persona selection.**

Pass the classification result to each persona via the `{document_type}` slot in the subagent template.

## Extract Reviewer Context Once

Before selection and dispatch, extract `{origin_path}` from `origin:` when
present, otherwise `product_contract_source:<value>`, otherwise literal `none`.
Extract `{settled_ktds}` from Key Technical Decisions and Product Contract Key
Decisions carrying `session-settled:`: include decision name, class
(`user-directed` or `user-approved`), and rejected alternative, or literal
`none`. Always fill both slots. They convey documented provenance, not newly
granted authority or proof of a human decision; do not invent annotations.
Personas consume these slots rather than re-parsing provenance themselves.

HTML follows the same semantic review but remains report-only. For an
ID-bearing HTML producer-fix candidate, describe the nearest sibling's native
structure and preserve its anchor convention and visible ID text. Never insert
Markdown into HTML or imply the reviewer applied that producer-owned change.
