# Dispatching reviewers

For an authorized native reviewer dispatch, correct a pre-launch argument rejection once without changing scope or required capabilities. Keep capacity-limited work queued under the bounded policy below. Other launch failures take the inline fallback with the same lens contract. Once a reviewer launches, collect its terminal outcome before retrying. Parent-context review remains non-independent evidence.

### Dispatch

Before reviewer dispatch, record `worker_dispatch_authorization`, `capability_probe`, `worker_dispatch_capability`, `worker_context_isolation`, `worker_model_override`, and `worker_bounded_parallelism`, then normalize the result as `worker_dispatch_outcome`.

**Dispatch authorization gate.** A direct invocation of `spec-doc-review` authorizes this document-review workflow, not worker dispatch. Dispatch only when the user or an upstream handoff explicitly authorized subagents, personas, delegated review, or parallel-agent work for this run. Missing authorization forbids schema discovery and fixes `capability_probe: not_applicable` + `worker_dispatch_capability: unknown`; record `dispatch_authorization_missing`, set `isolation=degraded_inherited`, and apply the same selected persona prompt assets inline or serially. Only after authorization may current-session registry/schema be inspected as `provider_untrusted` evidence: confirmed absence records `subagent_capability_missing`; unavailable/incomplete/ambiguous discovery records `worker_capability_unproven`. Do not claim independent persona coverage or context isolation. This dispatch fallback is orthogonal to `mutation_policy`: only explicit `mutation:apply-fixes` can enable Markdown writes; HTML and all ordinary reviews remain non-mutating.

When the semantic probe yields one eligible generic worker candidate, dispatch bounded reviewer packets with **bounded parallelism** only when live facts support it; otherwise serialize and record `parallelism_unproven_serialized`. Permission settings govern whether a call may execute; they are not dispatch authorization. Respect the active-worker limit: queue selected reviewers, dispatch as many as accepted, fill freed slots as reviewers complete. Treat capacity-limit errors as backpressure, not failure — leave the reviewer queued and retry after a slot frees; record `dispatch_backpressure_exhausted` only after the bounded retry policy is exhausted, and `worker_dispatch_failed` after an accepted dispatch fails or for a non-capacity reason.

**Context isolation (required intent):** each reviewer prompt is self-contained (persona + schema + document slice + primer). Prefer **minimum parent-context inheritance** when `worker_context_isolation: isolated`. Do not rely on the worker inheriting the orchestrator's full skill text or chat history — if isolation is inherited or unknown, set `isolation=degraded_inherited` on the cost-shape line and proceed only where independent isolation is preferred rather than required; never claim isolation that did not happen.

For each selected reviewer, read the matching skill-local prompt asset at `references/personas/<reviewer-name>.md` and pass its full content as `{persona_file}`. Do not dispatch standalone agents by type/name or rely on platform-level custom-agent registration.

**Model tiering** (omit override if the platform has no known tier; inherit parent model otherwise): coherence gets the cheapest capable tier; design-lens/scope-guardian get the platform mid-tier; `security-lens-reviewer`, `feasibility-reviewer`, `product-lens-reviewer`, `adversarial-document-reviewer`: inherit the parent model (or a high-capability review tier if established).

Each subagent's prompt fills these template variables: `{persona_file}` — full content of the selected persona asset; `{schema}` — the findings schema below; `{document_type}` — the Phase 1 classification; `{document_path}` — the document path; `{origin_path}` — upstream provenance (prefer `origin:` frontmatter, else `product_contract_source:<value>`, else `none`; product-lens/adversarial/scope-guardian read this slot rather than re-parsing frontmatter); `{settled_ktds}` — session-settled Key Technical Decision or Product Contract Key Decision entries extracted once during intake, including decision name, class, and rejected alternative, or `none`; `{document_content}` — metadata, Goal Capsule, and the reviewer-specific section slice (unified artifacts: product-lens/adversarial/scope get Product Contract, feasibility/coherence also get Planning Contract and active Implementation Units/Verification/DoD when implementation-ready; task packs get the full task pack plus `task-pack-review-lens.md`, compact deterministic receipt, and focused current source-plan sections; legacy documents get the full document); `{decision_primer}` — cumulative prior-round decisions, or an empty block on round 1.

For legacy documents pass the **full document** (`slices=full`); for unified artifacts, default to section slices (`slices=unified`) and escalate to a broader slice only when a reviewer needs cross-section traceability the initial slice can't assess. For `task-pack`, set `slices=mixed` and wrap the four inputs separately as `<task-pack-review-lens>`、`<deterministic-intake>`、`<task-pack>` 与 `<source-plan>`，避免把 validator facts、derived tasks 与 canonical plan 混成同一 authority。**Anti-waste rule:** the orchestrator may read the full document once for classification and roster selection, but after slices are built do not also inject the full document into every leaf "for safety" — mark `slices=mixed` or `full` on cost-shape if a leaf must escalate.

When dispatch is explicitly authorized and at least one normal review lens is active, read `references/cross-model-review.md` and evaluate its independent external-data gates. If every gate passes, start exactly one report-only whole-document peer using `references/personas/whole-doc-reviewer.md` and the Skill-local adapter/runner lifecycle. The peer sweep reads the full document once; it does not multiply by persona and it never replaces the always-on reviewers. Missing authorization, receipt, data authority, redaction, allowlisted document ref, source identity, peer independence, or cleanup evidence means zero peer processes and no cross-model claim. A completed return may corroborate findings but never carries `safe_auto` or mutation authority.

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


### Dispatch backpressure and model defaults

Dispatch only as many reviewers as the active host accepts; queue the remainder and retry after a capacity slot frees. A capacity error is backpressure, not reviewer failure. Record a reviewer as failed only after a successful dispatch times out/fails or a non-capacity error survives correcting the invocation.

Model tiering is a dispatch concern, not persona prompt metadata: use the cheapest capable tier for coherence, inherit the parent model for feasibility/security/product/adversarial unless a known stronger review tier exists, and use a mid-tier for design/scope when the host exposes one. If model override is unknown, omit it rather than guessing a host-specific name.
