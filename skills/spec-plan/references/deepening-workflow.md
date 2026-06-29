# Deepening Workflow

This file contains the confidence-check execution path (5.3.3-5.3.7). Load it only when the deepening gate at 5.3.2 determines that deepening is warranted.

When confidence gaps involve enterprise high-risk triggers, read `skills/spec-plan/references/enterprise-plan-review.md` and treat it as the readiness lens for plan-time completeness. Keep the full trigger matrix in that reference; this file only owns scoring and specialist mapping.

## 5.3.3 Score Confidence-first Gaps

Use a checklist-first, risk-weighted scoring pass.

For each section, compute:
- **Trigger count** - number of checklist problems that apply
- **Risk bonus** - add 1 if the topic is high-risk and this section is materially relevant to that risk
- **Critical-section bonus** - add 1 for `Key Technical Decisions`, `Implementation Units`, `System-Wide Impact`, `Risks & Dependencies`, or `Open Questions` in `Standard` or `Deep` plans

Enterprise high-risk triggers also add risk bonus when materially relevant (money, security/permissions, migration/DDL, high concurrency, async/MQ, state machines, scheduled jobs, rollout, privacy, data/ML consistency — the full trigger matrix lives only in `skills/spec-plan/references/enterprise-plan-review.md`).

Treat a section as a candidate if:
- it hits **2+ total points**, or
- it hits **1+ point** in a high-risk domain and the section is materially important

Choose only the top **2-5** sections by score. If deepening a lightweight plan (high-risk exception), cap at **1-2** sections.

If the plan already has a `deepened:` date:
- Prefer sections that have not yet been substantially strengthened, if their scores are comparable
- Revisit an already-deepened section only when it still scores clearly higher than alternatives

**Section Checklists:**

**Requirements**
- Requirements are vague or disconnected from implementation units
- Success criteria are missing or not reflected downstream
- Units do not clearly advance the traced requirements
- Origin requirements are not clearly carried forward
- Origin A/F/AE IDs (when supplied by the upstream brainstorm) are not preserved where planning decisions touch them, or are referenced inconsistently across Requirements, units, and test scenarios
- PRD-grade or review-origin functionality is not mapped to a plan section, U-ID, Open Question, or explicit deferment
- Enterprise high-risk triggers are present but the plan has no concrete plan-time decision, parameter, failure path, observation condition, or rollback/compensation condition

**Context & Research / Sources & References**
- Relevant repo patterns are named but never used in decisions or implementation units
- Cited learnings or references do not materially shape the plan
- High-risk work lacks appropriate external or internal grounding
- Research is generic instead of tied to this repo or this plan

**Key Technical Decisions**
- A decision is stated without rationale
- Rationale does not explain tradeoffs or rejected alternatives
- The decision does not connect back to scope, requirements, or origin context
- An obvious design fork exists but the plan never addresses why one path won
- A high-risk KTD lacks an explicit trade-off: what the chosen design buys, what it sacrifices, and why alternatives were rejected

**Open Questions**
- Product blockers are hidden as assumptions
- Planning-owned questions are incorrectly deferred to implementation
- Resolved questions have no clear basis in repo context, research, or origin decisions
- Deferred items are too vague to be useful later

**High-Level Technical Design (when present)**
- The sketch uses the wrong medium for the work
- The sketch contains implementation code rather than pseudo-code
- The non-prescriptive framing is missing or weak
- The sketch does not connect to the key technical decisions or implementation units

**High-Level Technical Design (when absent)** *(Standard or Deep plans only)*
- The work involves DSL design, API surface design, multi-component integration, complex data flow, or state-heavy lifecycle
- Key technical decisions would be easier to validate with a visual or pseudo-code representation
- The approach section of implementation units is thin and a higher-level technical design would provide context

**Implementation Units**
- Dependency order is unclear or likely wrong
- File paths or test file paths are missing where they should be explicit
- Units are too large, too vague, or broken into micro-steps
- Approach notes are thin or do not name the pattern to follow
- Test scenarios are vague (don't name inputs and expected outcomes), skip applicable categories (e.g., no error paths for a unit with failure modes, no integration scenarios for a unit crossing layers), or are disproportionate to the unit's complexity
- Feature-bearing units have blank or missing test scenarios (feature-bearing units require actual test scenarios; the `Test expectation: none` annotation is only valid for non-feature-bearing units)
- Verification outcomes are vague or not expressed as observable results
- Existing U-IDs were renumbered after a unit was reordered, split, or deleted (U-IDs are stable: never renumber existing IDs; gaps from deletions are preserved; new units take the next unused number)
- Existing `spec_id` was regenerated or changed during deepening. `spec_id` identifies the spec chain; deepening strengthens the same plan and must preserve it.
- A unit realizing an origin Key Flow does not cite the F-ID, or a unit enforcing an origin Acceptance Example does not cite the AE-ID, when origin supplies them
- Units that touch API contracts, authz, migration/backfill, async retry, scheduled jobs, rollout gates, or state lifecycle do not name the relevant idempotency, compatibility, observability, rollback, or final-failure decision

**System-Wide Impact**
- Affected interfaces, callbacks, middleware, entry points, or parity surfaces are missing
- Failure propagation is underexplored
- State lifecycle, caching, or data integrity risks are absent where relevant
- Integration coverage is weak for cross-layer work
- API contract compatibility, state lifecycle, data migration rollback, observability, rollout gate, or requirements coverage is missing for enterprise high-risk triggers

**Risks & Dependencies / Documentation / Operational Notes**
- Risks are listed without mitigation
- Rollout, monitoring, migration, or support implications are missing when warranted
- External dependency assumptions are weak or unstated
- Security, privacy, performance, or data risks are absent where they obviously apply
- Privacy-sensitive flows through logs, analytics, third parties, clients, exports, caches, or telemetry are present but not named
- Data/ML changes lack schema evolution, backfill, online/offline consistency, compatibility window, or verification posture

Use the plan's own `Context & Research` and `Sources & References` as evidence. If those sections cite a pattern, learning, or risk that never affects decisions, implementation units, or verification, treat that as a confidence-first gap.

## 5.3.4 Report and Dispatch Targeted Research

Before dispatching agents, report what sections are being strengthened and why:

```text
Strengthening [section names] — [brief reason for each, e.g., "decision rationale is thin", "cross-boundary effects aren't mapped"]
```

For each selected section, choose the smallest useful agent set. Do **not** run every agent. Use at most **1-3 agents per section** and usually no more than **8 agents total**.

Use fully-qualified agent names inside dispatch prompts or agent invocations.

**Deterministic Section-to-Agent Mapping:**

**Requirements / Open Questions classification**
- `spec-spec-flow-analyzer` for missing user flows, edge cases, and handoff gaps
- `spec-repo-research-analyst` (Scope: `architecture, patterns`) for repo-grounded patterns, conventions, and implementation reality checks

**Context & Research / Sources & References gaps**
- `spec-learnings-researcher` for institutional knowledge and past solved problems
- `spec-framework-docs-researcher` for official framework or library behavior
- `spec-best-practices-researcher` for current external patterns and industry guidance
- Add `spec-git-history-analyzer` only when historical rationale or prior art is materially missing

**Key Technical Decisions**
- `spec-architecture-strategist` for design integrity, boundaries, and architectural tradeoffs
- Add `spec-framework-docs-researcher` or `spec-best-practices-researcher` when the decision needs external grounding beyond repo evidence

**High-Level Technical Design**
- `spec-architecture-strategist` for validating that the technical design accurately represents the intended approach and identifying gaps
- `spec-repo-research-analyst` (Scope: `architecture, patterns`) for grounding the technical design in existing repo patterns and conventions
- Add `spec-best-practices-researcher` when the technical design involves a DSL, API surface, or pattern that benefits from external validation

**Implementation Units / Verification**
- `spec-repo-research-analyst` (Scope: `patterns`) for concrete file targets, patterns to follow, and repo-specific sequencing clues
- `spec-pattern-recognition-specialist` for consistency, duplication risks, and alignment with existing patterns
- Add `spec-spec-flow-analyzer` when sequencing depends on user flow or handoff completeness

**System-Wide Impact**
- `spec-architecture-strategist` for cross-boundary effects, interface surfaces, and architectural knock-on impact
- Add `spec-api-contract-reviewer` when the plan changes API routes, request/response schemas, exported type signatures, event contracts, or versioning expectations; this is an existing specialist for contract depth, not a new surface-enumeration agent.
- Add `spec-design-lens-reviewer` only when the plan includes user-facing client surfaces and needs plan-time coverage of information architecture, interaction states, user flows, responsive/accessibility concerns, or AI-slop risk. It is a design-decision lens for materially user-facing plans, not a default reviewer for every multi-surface plan.
- Add the specific specialist that matches the risk:
  - `spec-performance-oracle` for scalability, latency, throughput, and resource-risk analysis
  - `spec-security-sentinel` for auth, validation, exploit surfaces, and security boundary review
  - `spec-data-integrity-guardian` for migrations, persistent state safety, consistency, and data lifecycle risks

**Enterprise trigger-to-specialist mapping**
- For enterprise high-risk triggers, reuse the trigger-to-specialist mapping in `skills/spec-plan/references/enterprise-plan-review.md` (Specialist Reuse); the canonical mapping lives there, not duplicated here. The pre-existing per-section specialist guidance below still applies to ordinary deepening.

**Risks & Dependencies / Operational Notes**
- Use the specialist that matches the actual risk:
  - `spec-security-sentinel` for security, auth, privacy, and exploit risk
  - `spec-data-integrity-guardian` for persistent data safety, constraints, and transaction boundaries
  - `spec-data-migration-expert` for migration realism, backfills, and production data transformation risk
  - `spec-deployment-verification-agent` for rollout checklists, rollback planning, and launch verification
  - `spec-performance-oracle` for capacity, latency, and scaling concerns

**Agent Prompt Shape:**

For each selected section, pass:
- The scope prefix from the mapping above when the agent supports scoped invocation
- A short plan summary
- The exact section text
- Why the section was selected, including which checklist triggers fired
- The plan depth and risk profile
- A specific question to answer

Instruct the agent to return:
- findings that change planning quality
- stronger rationale, sequencing, verification, risk treatment, or references
- no implementation code
- no shell commands

## 5.3.5 Choose Research Execution Mode

Use the lightest mode that will work:

- **Direct mode** - Default. Use when the selected section set is small and the parent can safely read the agent outputs inline.
- **Artifact-backed mode** - Use only when the selected research scope is large enough that inline returns would create unnecessary context pressure.

Signals that justify artifact-backed mode:
- More than 5 agents are likely to return meaningful findings
- The selected section excerpts are long enough that repeating them in multiple agent outputs would be wasteful
- The topic is high-risk and likely to attract bulky source-backed analysis

If artifact-backed mode is not clearly warranted, stay in direct mode.

Artifact-backed mode uses a per-run OS-temp scratch directory. Create it once before dispatching sub-agents and capture its **absolute path** — pass that absolute path to each sub-agent so they write to it directly. Do not use `.context/`; the artifacts are per-run throwaway and their cleanup policy is handled by 5.3.6b and 5.3.9, matching the repo Scratch Space convention for one-shot artifacts. Do not pass unresolved shell-variable strings to sub-agents; they need the resolved absolute path.

```bash
SCRATCH_DIR="$(mktemp -d -t spec-plan-deepen-XXXXXX)"
echo "$SCRATCH_DIR"
```

Refer to the echoed absolute path as `<scratch-dir>` throughout the rest of this workflow.

## 5.3.6 Run Targeted Research

Launch the selected agents in parallel using the execution mode chosen above only when host capability exists and dispatch authorization is present for this run. In Codex, a public `$spec-plan` invocation authorizes the workflow itself; it does not by itself authorize `spawn_agent`. If the user did not explicitly request subagents, delegation, parallel research, or research-agent dispatch, use the inline fallback and record `dispatch_authorization_missing`.

If dispatch is authorized and the current platform supports dispatch but not parallel dispatch, run the same selected agents sequentially through the host dispatch primitive. If dispatch is unavailable, explicitly disabled, unauthorized, or unsafe, read the corresponding agent profiles and perform the selected research sequentially in the current agent, marking the deepening report with `dispatch_fallback: inline-current-agent`. Omit the `mode` parameter when dispatching so the user's configured permission settings apply.

Prefer local repo and institutional evidence first. Use external research only when the gap cannot be closed responsibly from repo context or already-cited sources.

If a selected section can be improved by reading the origin document more carefully, do that before dispatching external agents.

**Direct mode:** Have each selected agent return its findings directly to the parent. Keep the return payload focused: strongest findings only, the evidence or sources that matter, the concrete planning improvement implied by the finding.

**Artifact-backed mode:** For each selected agent, pass the absolute `<scratch-dir>` path captured earlier and instruct the agent to write one compact artifact file inside that directory, then return only a short completion summary. Each artifact should contain: target section, why selected, 3-7 findings, source-backed rationale, the specific plan change implied by each finding. No implementation code, no shell commands.

If an artifact is missing or clearly malformed, re-run that agent or fall back to direct-mode reasoning for that section.

If agent outputs conflict:
- Prefer repo-grounded and origin-grounded evidence over generic advice
- Prefer official framework documentation over secondary best-practice summaries when the conflict is about library behavior
- If a real tradeoff remains, record it explicitly in the plan

## 5.3.6b Interactive Finding Review (Interactive Mode Only)

Skip this step in auto mode — proceed directly to 5.3.7.

In interactive mode, present each agent's findings to the user before integration. For each agent that returned findings:

1. **Summarize the agent and its target section** — e.g., "The spec-architecture-strategist reviewed Key Technical Decisions and found:"
2. **Present the findings concisely** — bullet the key points, not the raw agent output. Include enough context for the user to evaluate: what the agent found, what evidence supports it, and what plan change it implies.
3. **Ask the user** using the platform's blocking question tool when available (see Interaction Method):
   - **Accept** — integrate these findings into the plan
   - **Reject** — discard these findings entirely
   - **Discuss** — the user wants to talk through the findings before deciding

If the user chooses "Discuss", engage in brief dialogue about the findings and then re-ask with only accept/reject (no discuss option on the second ask). The user makes a deliberate choice either way.

When presenting findings from multiple agents targeting the same section, present them one agent at a time so the user can make independent decisions. Do not merge findings from different agents before showing them.

After all agents have been reviewed, carry only the accepted findings forward to 5.3.7.

If the user accepted no findings, report "No findings accepted — plan unchanged." If artifact-backed mode was used, preserve `<scratch-dir>` for debugging rejected artifacts and report `Artifacts left at <scratch-dir>`. Then proceed directly to Phase 5.4 (skip spec-doc-review and synthesis — the plan was not modified). This interactive-mode-only skip does not apply in auto mode; auto mode always proceeds through 5.3.7 and 5.3.8.

If findings were accepted and the plan was modified, proceed through 5.3.7 and 5.3.8 as normal — spec-doc-review acts as a quality gate on the changes.

## 5.3.7 Synthesize and Update the Plan

Strengthen only the selected sections. Keep the plan coherent and preserve its overall structure.

**In interactive mode:** Only integrate findings the user accepted in 5.3.6b. If some findings from different agents touch the same section, reconcile them coherently but do not reintroduce rejected findings.

Allowed changes:
- Clarify or strengthen decision rationale
- Tighten requirements trace or origin fidelity
- Reorder or split implementation units when sequencing is weak — but **never renumber existing U-IDs**. Reordering preserves U-IDs in their new order (e.g., U1, U3, U5 reordered is correct; renumbering to U1, U2, U3 is not). Splitting keeps the original U-ID on the original concept and assigns the next unused number to the new unit. Renumbering breaks spec-work blocker and verification references that were written against the original IDs
- Add missing pattern references, file/test paths, or verification outcomes
- Expand system-wide impact, risks, or rollout treatment where justified
- Reclassify open questions between `Resolved During Planning` and `Deferred to Implementation` when evidence supports the change
- Strengthen, replace, or add a High-Level Technical Design section when the work warrants it and the current representation is weak
- Strengthen or add per-unit technical design fields where the unit's approach is non-obvious
- Add or update `deepened: YYYY-MM-DD` in frontmatter when the plan was substantively improved
- Preserve the existing `spec_id` frontmatter value. Do not regenerate it, even if the plan filename, title, or implementation-unit order changed during deepening.

Do **not**:
- Add implementation code — no imports, exact method signatures, or framework-specific syntax. Pseudo-code sketches and DSL grammars are allowed
- Add git commands, commit choreography, or exact test command recipes
- Add generic `Research Insights` subsections everywhere
- Rewrite the entire plan from scratch
- Invent new product requirements, scope changes, or success criteria without surfacing them explicitly
- Renumber existing U-IDs as part of reordering, splitting, deletion, or "tidying" the unit list. Deepening is the most likely accidental-renumber vector — preserve U-IDs even when the new order would look cleaner with sequential numbering
- Regenerate or replace an existing `spec_id` as part of deepening. Use a new `spec_id` only when deliberately creating a new spec chain outside the deepening path.

If research reveals a product-level ambiguity that should change behavior or scope:
- Do not silently decide it here
- Record it under `Open Questions`
- Recommend `spec-brainstorm` if the gap is truly product-defining
