# Selecting the review roster

### Select Conditional Personas
Analyze the document to determine which conditional personas to activate. Use the quick-reference table first; if unresolved, read the full activation matrix.

**Activation quick-reference (apply these signals first):**

| Persona | Activate when the document... |
|---------|------------------------------|
| product-lens | Stakes an unsettled product position about what to build, why, or priority that the origin did not settle, OR carries strategic weight beyond the immediate problem |
| design-lens | References UI/UX, frontend components, user flows, wireframes, interaction descriptions, responsive behavior, or accessibility |
| security-lens | Mentions auth/authorization, login/session flows, externally exposed API endpoints, or sensitive data (PII, payments, tokens, credentials, secrets, encryption) and third-party trust-boundary changes; ordinary internal data handling alone is not a trigger |
| scope-guardian | Has multiple priority tiers (P0/P1/P2), >8 requirements/units, stretch goals, or scope-goal misalignment signals |
| adversarial | Presents a high-value challenge surface: high-stakes domain, significant new abstraction/architectural pattern, greenfield plan without validated upstream, explicit alternatives, or unresolved tradeoffs. Routine structural complexity alone does not qualify |

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

`doc_bytes` is the on-disk byte length when known, else `unknown`. `slices` is `unified` if every leaf gets a section slice, `full` if every leaf gets the full document, `mixed` otherwise. Task-pack review normally uses `mixed`: full task pack + focused current source-plan sections + compact deterministic receipt. `isolation` is set in Phase 2 Dispatch below. This line is **advisory measurement**, not a hard gate.

## Phase 2 roster handoff

Always include `coherence-reviewer` and `feasibility-reviewer`. Add only budget-filtered conditional personas (`product-lens-reviewer`, `design-lens-reviewer`, `security-lens-reviewer`, `scope-guardian-reviewer`, `adversarial-document-reviewer`), unless the user explicitly names an override.


For ordinary text output, tell the user which personas will review and why, including the `cost-shape:` line. When `output_mode: json`, suppress the announcement and all object-external status/terminal text; preserve selected/skipped personas, cost shape, isolation, and outcomes in the final JSON `coverage` and `limitations`. JSON mode's machine-readable single-object contract overrides the normal announcement requirement.
