---
name: spec-doc-review
description: Review requirements, plans, or specs with role-specific lenses. Use when the user wants to improve an existing planning document.
argument-hint: "[mode:headless] [path/to/document.md]"
---

# Document Review

Review requirements or plan documents through multi-persona analysis. Dispatches generic subagents seeded with skill-local reviewer prompt assets, auto-applies `safe_auto` fixes, and routes remaining findings through a four-option interaction (per-finding walk-through, auto-resolve with best judgment, Append-to-Open-Questions, Report-only) for user decision.

## Interactive mode rules

- **Pre-load the platform question tool before any question fires.** In Claude Code, `AskUserQuestion` is a deferred tool — its schema is not available at session start. At the start of Interactive-mode work (before the routing question, per-finding walk-through questions, bulk-preview Proceed/Cancel, and Phase 5 terminal question), call `ToolSearch` with query `select:AskUserQuestion` to load the schema. Load it once, eagerly, at the top of the Interactive flow — do not wait for the first question site. On other hosts this preload is not required.
- **The numbered-list fallback applies only when the harness genuinely lacks a blocking question tool** — `ToolSearch` returns no match, the tool call explicitly fails, or the runtime mode does not expose it (e.g., Codex edit modes where `request_user_input` is unavailable). A pending schema load is not a fallback trigger; call `ToolSearch` first per the pre-load rule. In genuine-fallback cases, present options as a numbered list and wait for the user's reply — never silently skip the question. Rendering a question as narrative text because the tool feels inconvenient, because the model is in report-formatting mode, or because the instruction was buried in a long skill is a bug. A question that calls for a user decision must either fire the tool or fall back loudly.

## Phase 0: Detect Mode

Check the skill arguments for `mode:headless`. Arguments may contain a document path, `mode:headless`, or both. Tokens starting with `mode:` are flags, not file paths — strip them from the arguments and use the remaining token (if any) as the document path for Phase 1.

If `mode:headless` is present, set **headless mode** for the rest of the workflow.

**Headless mode** changes the interaction model, not the classification boundaries. spec-doc-review still applies the same judgment about which tier each finding belongs in. The only difference is how non-safe_auto findings are delivered:

- `safe_auto` fixes are applied silently (same as interactive)
- `gated_auto`, `manual`, and FYI findings are returned as structured text for the caller to handle — no blocking-question prompts, no interactive routing
- Phase 5 returns immediately with "Review complete" (no routing question, no terminal question)

The caller receives findings with their original classifications intact and decides what to do with them.

Callers invoke headless mode by including `mode:headless` in the skill arguments, e.g.:

```
Skill("spec-doc-review", "mode:headless docs/plans/my-plan.md")
```

If `mode:headless` is not present, the skill runs in its default interactive mode with the routing question, walk-through, and bulk-preview behaviors documented in `references/walkthrough.md` and `references/bulk-preview.md`.

## Phase 1: Get and Analyze Document

**If a document path is provided:** Read it, then proceed. If the read fails or the file is not on disk, apply the missing-document gate below instead of continuing.

**If no document is specified (interactive mode):** Ask which document to review, or find the most recent in `docs/brainstorms/` or `docs/plans/` using a file-search/glob tool (e.g., Glob in Claude Code).

**If no document is specified (headless mode):** Output "Review failed: headless mode requires a document path. Re-invoke with: Skill(\"spec-doc-review\", \"mode:headless <path>\")" without dispatching agents.

**Missing-document gate — verify before any dispatch.** Persona reviewers read documents from the filesystem, and some may not have shell access, so they cannot recover a path that exists only on an un-checked-out git ref. Before Phase 2, confirm every resolved document path is readable on disk. Location does not matter: an absolute path outside the checkout or a document in another worktree is valid. If any path is unreadable, do not dispatch personas:

- **Interactive mode:** stop and name the missing path(s): "Document(s) not found on disk: <paths>. If they only exist on another branch, check it out (or use a worktree) and re-invoke; otherwise correct the path(s)."
- **Headless mode:** output "Review failed: document(s) not found on disk: <paths>. Check out the branch containing them (or pass paths to files on disk) and re-invoke." and return without dispatching agents.

### Classify Document Type

Classify the document by reading its **content shape**, not its file path. Path is a tie-breaker hint, not the primary signal.

First check for the unified artifact contract:

- `artifact_contract: spec-unified-plan/v1` plus `artifact_readiness: requirements-only` -> classify as `unified-requirements`. Review the Product Contract only; the absence of Planning Contract, Implementation Units, Verification Contract, or Definition of Done is expected and must not be flagged.
- `artifact_contract: spec-unified-plan/v1` plus `artifact_readiness: implementation-ready` -> classify as `unified-plan`. Review Product Contract and Planning Contract with different lenses, then review Implementation Units/Verification/DoD for execution completeness.
- HTML unified artifacts (`.html`) are read/reviewed in report-only mode. Do not apply markdown mutation paths to HTML. If a caller requested mutation/autofix behavior, skip with the existing markdown-only message or return report-only findings.
- Invalid progress-like readiness values (`active`, `in_progress`, `completed`, `done`) are a document-contract finding, not an execution state to honor.

**Core classification rules (apply these first):**

- **`requirements`**: Frontmatter fields like `actors:`, `flows:`, `acceptance_examples:`; section headings like `Acceptance Examples`, `Actors`, `Key Flows`; numbered IDs like `R1`, `A1`, `F1`, `AE1`; prose focused on user/business problem and scope boundaries. No implementation units, per-unit file lists, or test scenarios.
- **`plan`**: Frontmatter fields like `type: feat|fix|refactor`, `origin:`, `product_contract_source:`; section headings like `Implementation Units`, `Key Technical Decisions`, `Risks & Dependencies`; numbered IDs like `U1`, `U2`; per-unit `Goal`, `Files`, `Approach`, `Test scenarios`, `Verification`; repo-relative file paths.
- **Tie-breaker:** Content shape is authoritative over path. Mixed/sparse signals → fall back to path: `docs/brainstorms/` → `requirements`, `docs/plans/` → `plan`. Neither path applies → default to `requirements` (more conservative).

**STOP. If classification is genuinely ambiguous after applying the core rules above, read `references/document-classification-signals.md` for the full signal lists before proceeding to persona selection.**

Pass the classification result to each persona via the `{document_type}` slot in the subagent template. Personas read this and adapt their analysis accordingly.

### Select Conditional Personas

Analyze the document content to determine which conditional personas to activate. Use the quick-reference table first; if a decision is unresolved, read the full activation matrix.

**Activation quick-reference (apply these signals first):**

| Persona | Activate when the document... |
|---------|------------------------------|
| product-lens | Stakes a challengeable claim about what to build and why, OR carries strategic weight beyond the immediate problem |
| design-lens | References UI/UX, frontend components, user flows, wireframes, interaction descriptions, responsive behavior, or accessibility |
| security-lens | Mentions auth/authorization, login flows, API endpoints, PII, payments, tokens, credentials, encryption, or third-party trust boundaries |
| scope-guardian | Has multiple priority tiers (P0/P1/P2), >8 requirements/units, stretch goals, or scope-goal misalignment signals |
| adversarial | Touches high-stakes domains (auth/payments/data migrations/external integrations), proposes new abstractions/architectural patterns, is a greenfield plan with no validated upstream, OR has explicit alternatives sections. Do NOT activate on routine plans with validated upstream Product Contract |

**STOP. If the quick-reference table does not resolve whether to activate a conditional persona for this document, read `references/persona-activation-matrix.md` before finalizing the reviewer list.**

## Phase 2: Announce and Dispatch Personas

### Announce the Review Team

Tell the user which personas will review and why. For conditional personas, include the justification:

```
Reviewing with:
- coherence-reviewer (always-on)
- feasibility-reviewer (always-on)
- scope-guardian-reviewer -- plan has 12 requirements across 3 priority levels
- security-lens-reviewer -- plan adds API endpoints with auth flow
```

### Build Agent List

Always include:
- `coherence-reviewer`
- `feasibility-reviewer`

Add activated conditional personas:
- `product-lens-reviewer`
- `design-lens-reviewer`
- `security-lens-reviewer`
- `scope-guardian-reviewer`
- `adversarial-document-reviewer`

### Dispatch

Dispatch generic subagents using **bounded parallelism** with the platform's subagent primitive (e.g., `Agent` in Claude Code, `spawn_agent` in Codex) where available; otherwise run the work inline or serially. Omit the `mode` parameter so the user's configured permission settings apply. Respect the current harness's active-subagent limit: queue selected reviewers, dispatch only as many as the harness accepts, and fill freed slots as reviewers complete. Treat active-agent/thread/concurrency-limit spawn errors as backpressure, not reviewer failure: leave the reviewer queued and retry after a slot frees. Record a reviewer as failed only after a successful dispatch times out/fails, or when dispatch fails for a non-capacity reason.

For each selected reviewer, read the matching skill-local prompt asset at `references/personas/<reviewer-name>.md` and pass its full content as `{persona_file}`. Do not dispatch standalone agents by type/name and do not rely on platform-level custom-agent registration.

**Model tiering** (omit override if platform has no known model tier; inherit parent model otherwise):

| Reviewer | Tier |
|----------|------|
| coherence | Cheapest capable extraction/reasoning |
| design-lens, scope-guardian | Platform mid-tier |
| security-lens, feasibility, product-lens, adversarial | Parent model (or high-capability review tier if established) |

Each subagent receives the prompt built from the subagent template included below with these variables filled:

| Variable | Value |
|----------|-------|
| `{persona_file}` | Full content of the selected local prompt asset from `references/personas/` |
| `{schema}` | Content of the findings schema included below |
| `{document_type}` | "requirements", "plan", "unified-requirements", or "unified-plan" from Phase 1 classification |
| `{document_path}` | Path to the document |
| `{origin_path}` | Upstream Product Contract provenance extracted once during Phase 1: prefer the document's `origin:` frontmatter field when present; otherwise use `product_contract_source:<value>` when present; otherwise use `none`. Personas that adapt on origin/provenance (product-lens, adversarial, scope-guardian) read this slot to gate technique suppression — they do NOT re-parse frontmatter themselves. |
| `{document_content}` | Reviewer-specific section slice. For unified artifacts, pass metadata, Goal Capsule, and only the relevant slice: product-lens/adversarial/scope reviewers get Product Contract; feasibility/coherence reviewers also get Planning Contract and active Implementation Units/Verification/DoD when `artifact_readiness: implementation-ready`. For legacy documents, pass the full document. |
| `{decision_primer}` | Cumulative prior-round decisions in the current session, or an empty `<prior-decisions>` block on round 1. See "Decision primer" below. |

For legacy requirements/plan documents, pass each subagent the **full
document** — do not split into sections. For unified artifacts, do not pass the
full artifact to every reviewer by default: unified plans can be large, so
section slices (per the `{document_content}` slot above) are the default.
Escalate to a broader slice only when the reviewer needs cross-section
traceability that the initial slice cannot assess.

### Decision primer

On round 1 (no prior decisions), set `{decision_primer}` to:

```
<prior-decisions>
Round 1 — no prior decisions.
</prior-decisions>
```

On round 2+ (after one or more prior rounds in the current interactive session), accumulate prior-round decisions and render them as:

```
<prior-decisions>
Round 1 — applied (N entries):
- {section}: "{title}" ({reviewer}, {confidence})
  Evidence: "{evidence_snippet}"

Round 1 — rejected (M entries):
- {section}: "{title}" — Skipped because {reason}
  Evidence: "{evidence_snippet}"
- {section}: "{title}" — Deferred to Open Questions because {reason or "no reason provided"}
  Evidence: "{evidence_snippet}"
- {section}: "{title}" — Acknowledged without applying because {reason or "no suggested_fix — user acknowledged"}
  Evidence: "{evidence_snippet}"

Round 2 — applied (N entries):
...
</prior-decisions>
```

Each entry carries an `Evidence:` line because synthesis R29 (rejected-finding suppression) and R30 (fix-landed verification) both use an evidence-substring overlap check as part of their matching predicate — without the evidence snippet in the primer, the orchestrator cannot compute the `>50%` overlap test and has to fall back to fingerprint-only matching, which either re-surfaces rejected findings or suppresses too aggressively. The `{evidence_snippet}` is the first evidence quote from the finding, truncated to the first ~120 characters (preserving whole words at the boundary) and with internal quotes escaped. If a finding has multiple evidence entries, use the first one; the rest live in the run artifact and are not needed for the overlap check.

Accumulate across all rounds in the current session. Skip, Defer, and Acknowledge actions all count as "rejected" for suppression purposes — each signals the user decided the finding wasn't worth actioning this round (Acknowledge is the no-fix-guard variant: the user saw a finding with no `suggested_fix`, chose not to defer or skip explicitly, and recorded acknowledgement instead; for round-to-round suppression that is semantically equivalent to Skip). Applied findings stay on the applied list so round-N+1 personas can verify fixes landed (see R30 in `references/synthesis-and-presentation.md`).

Cross-session persistence is out of scope. A new invocation of spec-doc-review on the same document starts with a fresh round 1 and no carried primer, even if prior sessions deferred findings into the document's Open Questions section.

**Error handling:** If a subagent fails or times out, proceed with findings from subagents that completed. Note the failed reviewer in the Coverage section. Do not block the entire review on a single reviewer failure.

**Dispatch limit:** Even at maximum (7 agents), use bounded parallel dispatch. If the harness cap is lower than the selected team size, queue the remainder and launch them as active reviewers complete.

## Phases 3-5: Synthesis, Presentation, and Next Action

After all dispatched agents return, read `references/synthesis-and-presentation.md` for the synthesis pipeline (validate, anchor-based gate, dedup, cross-persona agreement promotion, resolve contradictions, auto-promotion, route by three tiers with FYI subsection), `safe_auto` fix application, headless-envelope output, and the handoff to the routing question.

For the four-option routing question and per-finding walk-through (interactive mode), read `references/walkthrough.md`. For the bulk-action preview used by best-judgment routing, Append-to-Open-Questions, and walk-through `Auto-resolve with best judgment on the rest`, read `references/bulk-preview.md`. Do not load these files before agent dispatch completes.

---

## Included References

### Subagent Template

@./references/subagent-template.md

### Findings Schema

@./references/findings-schema.json

Selected reviewer prompt assets live under `references/personas/`. Read only the prompt files selected for the current review.
