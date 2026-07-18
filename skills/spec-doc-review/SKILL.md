---
name: spec-doc-review
description: Review requirements, plans, or specs with role-specific lenses. Use when the user wants to improve an existing planning document. Default roster is standard (≤3 reviewers); pass roster:full for the full conditional set.
argument-hint: "[mode:headless] [mutation:report-only] [output:json] [roster:lite|standard|full] [path/to/document.md]"
---

# Document Review

Review requirements or plan documents through multi-persona analysis. Dispatches generic subagents seeded with skill-local reviewer prompt assets, applies `safe_auto` fixes only when the run-local mutation policy is `markdown-write`, and preserves the same structural/semantic review as report-only findings when mutation is unavailable or forbidden.

## Interactive mode rules
- **Pre-load the platform question tool before any question fires.** In Claude Code, `AskUserQuestion` is deferred — call `ToolSearch` with `select:AskUserQuestion` once, eagerly, at the top of Interactive-mode work (before the routing question, walk-through, bulk-preview, and Phase 5 terminal question) rather than at the first question site. Other hosts don't need this preload.
- **The numbered-list fallback applies only when the harness genuinely lacks a blocking question tool** (`ToolSearch` no match, the call fails, or the mode doesn't expose it, e.g. Codex edit modes). A pending schema load is not a fallback trigger. In genuine-fallback cases present options as a numbered list and wait. Rendering a question as narrative text because the tool feels inconvenient, the model is mid-report, or the instruction was buried is a bug — a question that calls for a user decision must either fire the tool or fall back loudly, never slip past as prose.

## Phase 0: Detect Mode
Check the skill arguments for flags and a document path. Tokens matching `mode:*`, `mutation:*`, `output:*`, `roster:*`, or `depth:*` are flags, not file paths — strip every recognized flag before resolving the remaining document path for Phase 1.

| Flag | Meaning |
|------|---------|
| `mode:headless` | Headless delivery (no interactive routing) |
| `mutation:report-only` | Caller-requested zero-write review; valid for Markdown, HTML, and ambiguous/unwritable inputs |
| `output:json` | Render the existing structured envelope as one JSON object |
| `roster:lite` / `roster:standard` / `roster:full` | Reviewer budget profile (default **`standard`**) |
| `depth:full` / `depth:lite` | Aliases of `roster:full` / `roster:lite` |

If both `roster:` and `depth:` appear, **`roster:` wins**. If neither appears, profile = **`standard`**.

`mutation:` and `output:` tokens are exact-token contracts. Accept only `mutation:report-only` and `output:json`. A duplicate token, multiple `mutation:*` tokens, multiple `output:*` tokens, or any unsupported `mutation:*` / `output:*` value fails closed before document read or reviewer dispatch. Return `Review failed: flag-conflict-or-unsupported` with the conflicting token names; do not guess precedence and do not treat those tokens as a path.

Set run-local `requested_mutation` to `report-only` only when the exact token is present; otherwise `default`. Set `output_mode` to `json` only when `output:json` is present; otherwise `text`. Output mode changes rendering only — it does not grant mutation, dispatch, producer, commit, or lifecycle authority.

Set run-local `delivery_mode` to `headless` when `mode:headless` is present, otherwise `interactive`. Headless changes delivery, not the mutation policy: under `markdown-write`, confidence-100 `safe_auto` fixes still apply silently and the remaining findings return as structured text; under `report-only`, no document write occurs in either delivery mode. `output_mode` is a third orthogonal choice. Headless never uses blocking prompts or interactive routing and Phase 5 returns immediately with "Review complete". Invoke via `Skill("spec-doc-review", "mode:headless docs/plans/my-plan.md")`. Interactive references are eligible only after Phase 1 resolves `mutation_policy: markdown-write`.

## Phase 1: Get and Analyze Document

**If a document path is provided:** Read it, then proceed; if the read fails, apply the missing-document gate below. **If no document is specified (interactive mode):** Ask which document to review, or find the most recent in `docs/brainstorms/` or `docs/plans/`. **If no document is specified (headless mode):** Output "Review failed: headless mode requires a document path. Re-invoke with: Skill(\"spec-doc-review\", \"mode:headless <path>\")" without dispatching agents.

**Missing-document gate — verify before any dispatch.** Some persona reviewers lack shell access and cannot recover a path that only exists on an un-checked-out ref. Before Phase 2, confirm every resolved path is readable on disk (location doesn't matter — an absolute path outside the checkout or another worktree is valid). If any path is unreadable, do not dispatch personas: **interactive** — "Document(s) not found on disk: <paths>. If they only exist on another branch, check it out (or use a worktree) and re-invoke; otherwise correct the path(s)."; **headless** — "Review failed: document(s) not found on disk: <paths>. Check out the branch containing them (or pass paths to files on disk) and re-invoke."

### Classify Document Type
Classify by reading its **content shape**, not its file path. Path is a tie-breaker hint, not the primary signal.

First check the unified artifact contract: `artifact_contract: spec-unified-plan/v1` plus `artifact_readiness: requirements-only` -> classify as `unified-requirements` (review Product Contract only; absent Planning Contract/Units/Verification/DoD is expected). Same contract plus `artifact_readiness: implementation-ready` -> classify as `unified-plan` (review Product Contract and Planning Contract with different lenses, then Implementation Units/Verification/DoD for execution completeness). Invalid progress-like readiness values (`active`, `in_progress`, `completed`, `done`) are a document-contract finding, not an execution state to honor.

### Resolve Mutation Policy

After reading and classifying the document, set exactly one run-local `mutation_policy`, independently from `delivery_mode`:

- `report-only` — when `requested_mutation: report-only` and the document is confirmed writable Markdown. Record `mutation_reason: caller-requested-report-only`; this explicit caller policy overrides the ordinary Markdown default and must keep the file byte-preserving.
- `markdown-write` — only when the document is confirmed Markdown by content shape and path and the platform can write it. Markdown `safe_auto`, walkthrough Apply, bulk Apply, and Open Questions append paths remain available.
- `report-only` — mandatory for HTML content or a `.html` artifact. Run the same reviewer roster, schema validation, confidence gate, deduplication, severity routing, Coverage, and limitations reporting, but do not invoke any document mutation path.
- `report-only` — also mandatory when the document is confirmed Markdown but the platform cannot write it. Record `mutation_reason: write-unavailable`; keep the full review and finding envelope, but do not imply that Markdown mutation was attempted.
- If extension, declared format, and content shape conflict, or the format remains ambiguous, fail closed to `report-only` and record `mutation_reason: format-conflict-or-ambiguous` in the envelope. Never guess Markdown write eligibility from the path alone.

For ordinary HTML use `mutation_reason: html-artifact`. A report-only request is valid in both headless and interactive delivery; interactive delivery still returns the structured report-only envelope and does not offer a mutation walkthrough.

Existing mandatory reasons retain their diagnostic meaning: HTML remains `html-artifact`, write-unavailable Markdown remains `write-unavailable`, and format conflict/ambiguity remains `format-conflict-or-ambiguous` even when the caller also requested report-only. `caller-requested-report-only` applies to otherwise writable, unambiguous Markdown. Without the mutation token, ordinary writable Markdown still resolves to `markdown-write`; this feature must not globally downgrade the default path.

**Core classification rules (apply these first):**

- **`requirements`**: Frontmatter fields like `actors:`, `flows:`, `acceptance_examples:`; headings like `Acceptance Examples`, `Actors`, `Key Flows`; IDs like `R1`, `A1`, `F1`, `AE1`; prose focused on user/business problem and scope. No implementation units, per-unit file lists, or test scenarios.
- **`plan`**: Frontmatter fields like `type: feat|fix|refactor`, `origin:`, `product_contract_source:`; headings like `Implementation Units`, `Key Technical Decisions`, `Risks & Dependencies`; IDs like `U1`, `U2`; per-unit `Goal`, `Files`, `Approach`, `Test scenarios`, `Verification`; repo-relative paths.
- **Tie-breaker:** Content shape is authoritative over path. Mixed/sparse signals → fall back to path: `docs/brainstorms/` → `requirements`, `docs/plans/` → `plan`. Neither applies → default to `requirements` (more conservative).

**STOP. If classification is genuinely ambiguous after applying the core rules above, read `references/document-classification-signals.md` for the full signal lists before proceeding to persona selection.**

Pass the classification result to each persona via the `{document_type}` slot in the subagent template.

### Select Conditional Personas
Analyze the document to determine which conditional personas to activate. Use the quick-reference table first; if unresolved, read the full activation matrix.

**Activation quick-reference (apply these signals first):**

| Persona | Activate when the document... |
|---------|------------------------------|
| product-lens | Stakes a challengeable claim about what to build and why, OR carries strategic weight beyond the immediate problem |
| design-lens | References UI/UX, frontend components, user flows, wireframes, interaction descriptions, responsive behavior, or accessibility |
| security-lens | Mentions auth/authorization, login flows, API endpoints, PII, payments, tokens, credentials, encryption, or third-party trust boundaries |
| scope-guardian | Has multiple priority tiers (P0/P1/P2), >8 requirements/units, stretch goals, or scope-goal misalignment signals |
| adversarial | Touches high-stakes domains (auth/payments/data migrations/external integrations), proposes new abstractions/architectural patterns, is a greenfield plan with no validated upstream, OR has explicit alternatives sections. Do NOT activate on routine plans with validated upstream Product Contract |

**STOP. If the quick-reference table does not resolve whether to activate a conditional persona for this document, read `references/persona-activation-matrix.md` before finalizing the reviewer list.**

### Apply Roster Budget (profile)
The quick-reference table produces a **candidate set**. Apply the profile budget **before** Phase 2 dispatch — never merge personas, only skip candidates that exceed budget.

| Profile | Always-on | Conditional budget | Typical N |
|---------|-----------|--------------------|-----------|
| `lite` | coherence + feasibility | **0** conditional | 2 |
| `standard` (default) | coherence + feasibility | **at most 1** conditional | ≤3 |
| `full` | coherence + feasibility | all candidates that qualify | 2–7 |

**Selecting the single conditional under `standard`** (first match wins when multiple qualify): 1. `security-lens` — auth/API/PII/payments/credentials/trust boundaries; 2. `adversarial` — high-stakes domain, new abstractions, greenfield without validated upstream, explicit alternatives; 3. `design-lens` — UI/UX/frontend/interaction; 4. `product-lens` — challengeable product/strategy claims; 5. `scope-guardian` — multi-priority / large unit count / stretch goals.

Record skipped candidates for the cost-shape line (`skipped_conditional=… reason=budget`). Under `lite`, skip **all** conditionals (`reason=lite`); under `full`, keep the full set (no budget skip). **Escape hatch:** user may name personas explicitly (e.g. "also run adversarial") — honor explicit names even under `standard`/`lite`, and note `override=user` on cost-shape.

### Emit cost-shape (advisory, required)

**After** the reviewer list is fixed and **before** any dispatch, prepare exactly one advisory line (do not block on it). For ordinary text output, print it as shown below. When `output_mode: json`, do not print this line or any other user-visible prose outside the final JSON object; retain the same cost-shape facts inside the envelope's structured `coverage` metadata instead:

```text
cost-shape: profile={lite|standard|full} N={count} personas=[{comma-separated short names}] skipped_conditional=[{name:reason},…] doc_bytes={utf8_bytes_or_unknown} slices={unified|full|mixed} isolation={min|degraded_inherited}
```

`doc_bytes` is the on-disk byte length when known, else `unknown`. `slices` is `unified` if every leaf gets a section slice, `full` if every leaf gets the full document, `mixed` otherwise. `isolation` is set in Phase 2 Dispatch below. This line is **advisory measurement**, not a hard gate.

## Phase 2: Announce and Dispatch Personas

For ordinary text output, tell the user which personas will review and why (justify conditionals), including the `cost-shape:` line from Phase 1 in the same announcement block. When `output_mode: json`, suppress this announcement and every other object-external status/terminal line; record selected/skipped personas, cost shape, isolation, and reviewer outcomes in the final JSON `coverage` and `limitations` fields. JSON mode's machine-readable single-object contract overrides the normal announcement requirement.

**Build agent list.** Always include `coherence-reviewer` and `feasibility-reviewer`. Add **budget-filtered** conditional personas only (`product-lens-reviewer`, `design-lens-reviewer`, `security-lens-reviewer`, `scope-guardian-reviewer`, `adversarial-document-reviewer`) — do **not** re-expand to "all conditionals that could match" after budget filtering unless `profile=full` or user override.

### Dispatch

**Dispatch authorization gate.** A direct invocation of `spec-doc-review` authorizes this document-review workflow, not host-level subagent dispatch. Dispatch only when the user or an upstream handoff explicitly authorized subagents, personas, delegated review, or parallel-agent work for this run. When dispatch is unauthorized, record `dispatch_authorization_missing` in Coverage and Limitations, set `isolation=degraded_inherited`, and apply the same selected persona prompt assets inline or serially in the current agent. Do not claim independent persona coverage or context isolation. This dispatch fallback is orthogonal to `mutation_policy`: Markdown may still use `markdown-write`, while HTML and other report-only inputs remain non-mutating.

When dispatch is authorized, dispatch generic subagents with **bounded parallelism** via the platform's subagent primitive (`Agent` in Claude Code, `spawn_agent` in Codex) where available. When the host exposes no callable primitive, record `subagent_capability_missing` and use the same inline/serial fallback. Omit the `mode` parameter so the user's permission settings apply. Respect the harness's active-subagent limit: queue selected reviewers, dispatch as many as accepted, fill freed slots as reviewers complete. Treat capacity-limit spawn errors as backpressure, not failure — leave the reviewer queued and retry after a slot frees; record failure only after a successful dispatch times out/fails or for a non-capacity reason.

**Context isolation (required intent):** each reviewer prompt is self-contained (persona + schema + document slice + primer). Prefer **minimum parent-context inheritance** when the host supports it (e.g. Codex `fork_turns: "none"`). Do not rely on the child inheriting the orchestrator's full skill text or chat history — if the host cannot isolate, set `isolation=degraded_inherited` on the cost-shape line and proceed; never claim isolation that did not happen.

For each selected reviewer, read the matching skill-local prompt asset at `references/personas/<reviewer-name>.md` and pass its full content as `{persona_file}`. Do not dispatch standalone agents by type/name or rely on platform-level custom-agent registration.

**Model tiering** (omit override if the platform has no known tier; inherit parent model otherwise): coherence gets the cheapest capable tier; design-lens/scope-guardian get the platform mid-tier; `security-lens-reviewer`, `feasibility-reviewer`, `product-lens-reviewer`, `adversarial-document-reviewer`: inherit the parent model (or a high-capability review tier if established).

Each subagent's prompt fills these template variables: `{persona_file}` — full content of the selected persona asset; `{schema}` — the findings schema below; `{document_type}` — the Phase 1 classification; `{document_path}` — the document path; `{origin_path}` — upstream provenance (prefer `origin:` frontmatter, else `product_contract_source:<value>`, else `none`; product-lens/adversarial/scope-guardian read this slot rather than re-parsing frontmatter); `{document_content}` — metadata, Goal Capsule, and the reviewer-specific section slice (unified artifacts: product-lens/adversarial/scope get Product Contract, feasibility/coherence also get Planning Contract and active Implementation Units/Verification/DoD when implementation-ready; legacy documents get the full document); `{decision_primer}` — cumulative prior-round decisions, or an empty block on round 1.

For legacy documents pass the **full document** (`slices=full`); for unified artifacts, default to section slices (`slices=unified`) and escalate to a broader slice only when a reviewer needs cross-section traceability the initial slice can't assess. **Anti-waste rule:** the orchestrator may read the full document once for classification and roster selection, but after slices are built do not also inject the full document into every leaf "for safety" — mark `slices=mixed` or `full` on cost-shape if a leaf must escalate.

### Decision primer

On round 1, set `{decision_primer}` to `<prior-decisions>Round 1 — no prior decisions.</prior-decisions>`. On round 2+, accumulate prior-round decisions:

```
<prior-decisions>
Round 1 — applied (N entries):
- {section}: "{title}" ({reviewer}, {confidence})
  Evidence: "{evidence_snippet}"
Round 1 — rejected (M entries):
- {section}: "{title}" — {one of: Skipped|Deferred to Open Questions|Acknowledged without applying} because {reason}
  Evidence: "{evidence_snippet}"
Round 2 — applied (N entries): ...
</prior-decisions>
```

Each entry carries an `Evidence:` line because R29/R30 (`references/synthesis-and-presentation.md`) use an evidence-substring overlap check to match findings across rounds — without it, the orchestrator falls back to fingerprint-only matching, which re-surfaces rejected findings or over-suppresses. `{evidence_snippet}` is the finding's first evidence quote, truncated to ~120 characters at a word boundary with internal quotes escaped.

Accumulate across all rounds in the session. Skip, Defer, and Acknowledge all count as "rejected" for suppression purposes. Applied findings stay on the list so later rounds can verify fixes landed (R30). Cross-session persistence is out of scope — a new invocation starts fresh even if a prior session deferred findings into Open Questions.

**Error handling:** if a subagent fails or times out, proceed with completed findings and note the failure in Coverage — do not block the review on one reviewer. If both always-on reviewers (`coherence` and `feasibility`) return no valid result, attempt one equivalent inline review using their already-selected prompt assets and document slices. If that equivalent inline review also does not complete, set `review_status: incomplete`, record `mandatory_review_coverage_missing`, and suppress any clean verdict or execution handoff. Never describe partial roster coverage as complete. **Dispatch limit:** even at maximum (7 agents), use bounded parallel dispatch; queue and launch the remainder as active reviewers complete.

## Phases 3-5: Synthesis, Presentation, and Next Action

After all dispatched agents return, read `references/synthesis-and-presentation.md` for the synthesis pipeline (validate, anchor-based gate, dedup, cross-persona promotion, contradiction resolution, auto-promotion, three-tier routing with FYI subsection), mutation-policy enforcement, structured envelope output, and the routing-question handoff.

Only when `delivery_mode: interactive` **and** `mutation_policy: markdown-write`, read `references/walkthrough.md` for the four-option routing question and per-finding walk-through. For the bulk-action preview used by best-judgment routing, Append-to-Open-Questions, and walk-through's "Auto-resolve with best judgment on the rest", read `references/bulk-preview.md`. Do not load either before agent dispatch completes, and never load them for `report-only`.

---

## Included References

### Subagent Template

@./references/subagent-template.md

### Findings Schema

@./references/findings-schema.json

Selected reviewer prompt assets live under `references/personas/`. Read only the prompt files selected for the current review.
