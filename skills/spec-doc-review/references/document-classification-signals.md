# Document Classification Signals

This is a **lazy reference** for SKILL.md. Load when the core classification rules in the spine don't yield a clear classification. The spine classification rules are:

1. First check task-pack identity (`type: task-pack`; malformed packs still keep this classification)
2. Then check for unified artifact contract (`artifact_contract: spec-unified-plan/v1`)
3. Otherwise: content shape and metadata are authoritative; path location never resolves a mixed document

---

## `task-pack` signals（derived execution documents）

- Frontmatter `type: task-pack`; typically includes `generated_by: spec-write-tasks`, `status: derived`, `mode: derived`, `source_plan`, and `source_plan_hash`
- The main body contains a fenced JSON of `Task Pack Contract`, `Execution Waves`, `Task Cards`, `Traceability Matrix`, or `Regeneration Rules`
- JSON tasks use execution fields such as `task_id`, `dependencies`, `files`, `test_focus`, `done_signal`, `wave`, and `stop_if`
- Content may contain U-ID, R-ID, repo-relative files, and verification signals, but these cannot reclassify a task pack as a plan; a task pack is always a derived index of the source plan.

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

## Tie-breaker and ambiguity rule

When signals are mixed or sparse, do not infer the type from directory or filename: requirements-only and implementation-ready artifacts may share a directory. Apply the dominant content shape; if it remains genuinely ambiguous, default to `requirements` and record the ambiguity for the caller rather than guessing from path location.
