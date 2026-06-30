# spec-plan Planning Flow Reference

This reference owns Phase 0 and Phase 1 planning flow detail for `spec-plan`: resume/source intake, direct-entry bootstrap, PRD handoff entropy, planning depth classification, scope synthesis, research dispatch, Direct Evidence, external research, and flow analysis.

The `SKILL.md` spine stays the hot-path orchestrator. Load this reference before executing Phase 0 source/scope handling or Phase 1 research.

## Phase 0: Resume, Source, and Scope

### 0.1 Resume Existing Plan Work When Appropriate

If the user references an existing plan file or there is an obvious recent matching plan in `docs/plans/`:

- Read it
- Confirm whether to update it in place or create a new plan
- If updating, revise only the still-relevant sections. Plans do not carry per-unit progress state; progress is derived from git by `spec-work`, so there is no progress to preserve across edits.

**Deepen intent:** The word "deepen" (or "deepening") in reference to a plan is the primary trigger for the deepening fast path. When the user says "deepen the plan", "deepen my plan", "run a deepening pass", or similar, the target document is a **plan** in `docs/plans/`, not a requirements document. Use any path, keyword, or context the user provides to identify the right plan. If a path is provided, verify it is actually a plan document. If the match is not obvious, confirm with the user before proceeding.

Words like "strengthen", "confidence", "gaps", and "rigor" are not sufficient on their own to trigger deepening. These words appear in normal editing requests and should not cause a holistic deepening pass. Treat them as deepening intent only when the request clearly targets the plan as a whole and does not name a specific section or content area to change; even then, prefer to confirm with the user before entering the deepening flow.

Once the plan is identified and appears complete (all major sections present, implementation units defined, `status: active`):

- If the plan lacks YAML frontmatter, route to `skills/spec-plan/references/universal-planning.md` for editing or deepening instead of Phase 5.3. Non-software plans do not use the software confidence-first check.
- Otherwise, short-circuit to Phase 5.3 (Confidence-first Check and Deepening) in **interactive mode**. This avoids re-running the full planning workflow and gives the user control over which findings are integrated.

Normal editing requests, such as "update the test scenarios", "add a new implementation unit", or "strengthen the risk section", should not trigger the fast path. They follow the standard resume flow.

If the plan already has a `deepened: YYYY-MM-DD` frontmatter field and there is no explicit user request to re-deepen, the fast path still applies the same confidence-gap evaluation; it does not force deepening.

### 0.1b Classify Task Domain

If the task involves building, modifying, or architecting software (references code, repos, APIs, databases, or asks to build/modify/deploy), continue to Phase 0.2.

If the domain is genuinely ambiguous, ask the user before routing.

Otherwise, read `skills/spec-plan/references/universal-planning.md` and follow that workflow instead. Skip all subsequent phases. Named tools or source links do not change this routing; they are inputs handled per the `SKILL.md` Core Principles.

### 0.2 Find Upstream Requirements Document

Before asking planning questions, search `docs/brainstorms/` for files matching `*-requirements.md`.

**Relevance criteria:** A requirements document is relevant if:

- The topic semantically matches the feature description
- It was created within the last 30 days; use judgment to override if the document is clearly still relevant or clearly stale
- It appears to cover the same user problem or scope

**Origin grade:** For each candidate, read minimal frontmatter to classify its origin grade:

- `artifact_kind: prd-requirements` with `can_enter_spec_plan: yes` → **PRD-grade candidate**. Label it clearly when presenting options and record `origin_grade: prd` in the produced plan frontmatter, but treat that as source category only until the consumer receipt verification below sets `origin_verification_status: verified`.
- No `artifact_kind`, brainstorm-only frontmatter, or any other kind → **brainstorm-grade**. Record `origin_grade: brainstorm` in the plan frontmatter. Brainstorm-grade is a valid direct planning input; do not reject or block it.
- Legacy documents without `spec_id` or `artifact_kind` → record `origin_grade: legacy` in the plan frontmatter.

When both PRD-grade and brainstorm-grade candidates match the same topic, prefer the PRD-grade candidate and note its higher evidence strength. When no PRD-grade candidate exists, plan from the brainstorm-grade candidate directly.

If multiple source documents match, ask which one to use using the platform's blocking question tool when available. Otherwise, present numbered options in chat — labeling each with its origin grade — and wait for the user's reply before proceeding.

### 0.3 Use the Source Document as Primary Input

If a relevant requirements document exists:

1. Read it thoroughly
2. Announce that it will serve as the origin document for planning
3. If the origin uses `artifact_kind: prd-requirements`, run a consumer-only receipt verification before treating R/AE/Scope/Evidence as confirmed:

   ```bash
   if [ -f skills/spec-prd/scripts/finalize-prd-artifact.js ]; then
     PRD_FINALIZER=skills/spec-prd/scripts/finalize-prd-artifact.js
   elif [ -f .agents/skills/spec-prd/scripts/finalize-prd-artifact.js ]; then
     PRD_FINALIZER=.agents/skills/spec-prd/scripts/finalize-prd-artifact.js
   elif [ -f .claude/spec-first/workflows/spec-prd/scripts/finalize-prd-artifact.js ]; then
     PRD_FINALIZER=.claude/spec-first/workflows/spec-prd/scripts/finalize-prd-artifact.js
   else
     echo "spec-prd receipt verifier not found" >&2
     exit 2
   fi
   node "$PRD_FINALIZER" <prd-path> --inputs <input-path> --verify-receipt
   ```

   Use every locatable path from the origin frontmatter `source_inputs:` (or legacy `prd_input:`) as `--inputs`; if no input path is locatable, run the command only when useful for diagnostics but record `origin_verification_status: degraded` with reason `input_side_recheck_degraded`. Exit code `0` means parse stdout JSON and set `origin_verification_status: verified`. Exit code `1` means parse stdout JSON for `origin_verification_status` and `reason_codes`; route back to `$spec-prd` or `$spec-doc-review`, or continue only with an explicit degraded/unverified assumption. Exit code `2` is a verifier usage/runtime failure and stdout JSON is not guaranteed; fix the path, flags, or missing runtime first, and if it cannot run, record `origin_verification_status: degraded` with reason `verifier_unavailable` rather than presenting the origin as verified. Do not use `--check-only` as a consumer pass signal: checkpoint closeout can exit cleanly while still being not planning-ready.
4. Carry forward all of the following:
   - `spec_id` when the origin frontmatter contains one. Preserve it exactly in the plan frontmatter; it is the cross-artifact identity for this spec chain.
   - Problem frame
   - Actors (A-IDs), Key Flows (F-IDs), and Acceptance Examples (AE-IDs) when present; preserve these as constraints that implementation units must honor
   - Requirements and success criteria
   - Scope boundaries, including "Deferred for later" and "Outside this product's identity" subsections when present
   - Key decisions and rationale
   - Dependencies or assumptions
   - Outstanding questions, preserving whether they are blocking or deferred
   - If the origin uses `artifact_kind: prd-requirements`, treat it as a PRD-grade requirements origin, not as a separate planning artifact class. Inherit the existing `spec_id`, R/F/AE references, Scope Boundaries, Evidence And Assumptions, trace self-check summary, and any project-local `US-*` / `FEAT-*` / `NFR-*` auxiliary trace mappings as confirmed only when `origin_verification_status: verified`; when `unverified` or `degraded`, preserve the IDs as advisory trace, record `unverified-prd-origin`, and do not silently convert origin R/AE/Scope into confirmed plan scope.
   - If that PRD-grade origin includes `## Feature Slices`, preserve feature IDs, requirement refs, acceptance refs, and source/evidence pointers in the plan Context, Sources, Requirements, or Implementation Units where relevant. Feature slices are PRD-origin trace, not a new planning-owned artifact class.
   - If the origin uses `document_role: split-summary`, treat it as a navigation and boundary artifact; do not default to implementation planning from it. Prefer a concrete `document_role: child-prd` source, and preserve `child_id`, `parent_spec_id`, `source_prd`, and `split_summary` trace in the plan Context / Sources.
   - If the origin is a review or audit report and the plan addresses specific findings, carry those finding ids into plan frontmatter through `referenced_reviews[].addresses_findings` or `referenced_reviews[].deferred_findings` as defined in `docs/contracts/workflows/review-closure-traceability.md`.
5. Use the source document as the primary input to planning and research
6. Reference important carried-forward decisions in the plan with `(see origin: <source-path>)`
7. Do not silently omit source content. Before finalizing, scan each section of the origin document to verify nothing was dropped.

For a PRD-grade origin, also write a compact Downstream Sync Impact Map in the plan context or assumptions when source/design/owner-decision/R/AE changes could make existing plans, task packs, or work stale. If the impact cannot be determined, record `downstream_sync_unknown` rather than inventing freshness.

When planning from a PRD-grade origin, run a PRD handoff entropy check before inventing WHAT. If the plan would need to choose a canonical term, source-of-truth, domain ownership, hard decision consequence, missing slice acceptance, missing slice source, or missing slice scope that the PRD did not settle, route to PRD refine or emit an inline PRD feedback candidate instead of deciding it in the plan. Keep this as a handoff boundary only: do not run a separate grill workflow in `spec-plan`, do not copy the full `spec-prd` readiness lens or Feature Slice Pack, do not generate program slices or task packs during planning, and do not auto-write back to the PRD. On Codex, this receipt verification is mandatory handoff discipline but not hook-enforced; if it cannot run, say that the path is degraded and do not present the origin as verified.

If the origin requirements document is a legacy document without `spec_id`, do not edit the origin by default. Generate a new plan-local `spec_id`, note in the plan that origin identity was not inherited, and treat the requirements-to-plan link as weak trace. If the user explicitly asks to backfill the origin requirements document, handle that as a separate scoped edit.

If no relevant requirements document exists, planning may proceed from the user's request directly.

### 0.4 Planning Bootstrap (No Requirements Doc or Unclear Input)

If no relevant requirements document exists, or the input needs more structure:

- Assess whether the request is already clear enough for direct technical planning. If so, continue to Phase 0.5.
- If the ambiguity is mainly product framing, user behavior, or scope definition, recommend `spec-brainstorm` as a suggestion, but always offer to continue planning here as well.
- If the user wants to continue here, or was already explicit about wanting a plan, run the planning bootstrap below.

The planning bootstrap should establish:

- Problem frame
- Intended behavior
- Scope boundaries and obvious non-goals
- Success criteria
- Blocking questions or assumptions

Keep this bootstrap brief. It exists to preserve direct-entry convenience, not to replace a full brainstorm.

If the bootstrap uncovers major unresolved product questions:

- Recommend `spec-brainstorm` again
- If the user still wants to continue, require explicit assumptions before proceeding

If the bootstrap reveals that a different workflow would serve the user better:

- **Bug-shaped prompt** (user describes broken behavior, an error message, a regression, or "doesn't work") — surface `spec-debug` as a route-out option alongside continuing with `spec-plan` when the bug surface is reachable in the current repo or at a named local repo path. Stay in `spec-plan` when the named code cannot be found locally; paper planning may be the only useful output for unreachable surfaces.

  When the bug is at another local path, announce the target before any cross-repo investigation: which path will be read and where the plan output will land. Default to the target repo for both investigation and plan writing unless the user redirects. Cross-repo target location and workflow choice are separate decisions; do not silently write a plan into the wrong repository.

  In headless mode, skip the route-out menu and continue with `spec-plan`. Auto-routing into debugging would change workflows without synchronous user authorization.

- **Clear task ready to execute** (known root cause, obvious fix, no architectural decisions) — suggest `spec-work` as a faster alternative alongside continuing with planning. The user decides.

### 0.5 Classify Outstanding Questions Before Planning

If the origin document contains `Resolve Before Planning` or similar blocking questions:

- Review each one before proceeding
- Reclassify it into planning-owned work **only if** it is actually a technical, architectural, or research question
- Keep it as a blocker if it would change product behavior, scope, or success criteria

If true product blockers remain:

- Surface them clearly
- Ask the user, using the platform's blocking question tool when available, whether to:
  1. Resume `spec-brainstorm` to resolve them
  2. Convert them into explicit assumptions or decisions and continue
- Do not continue planning while true blockers remain unresolved

### 0.6 Assess Plan Depth

Before classifying depth, build a compact planning-context input from the user request, origin document summary, Phase 0.4 candidate paths/modules, and any directly read source refs. When the source checkout has the helper available, run:

```bash
spec-first internal task-governance-signals \
  --source plan-declared \
  --input <planning-context.json> \
  --json
```

Use the helper's `candidate_level` and `reason_codes` as deterministic advisory facts. The helper prepares signals; the LLM still decides the final plan depth. Do not feed draft Implementation Units or `Files` lists into Phase 0.6 because they do not exist yet. The `<planning-context.json>` input shape (`request`, `origin_text`, `text`, `candidate_paths`, `paths`, `source_refs`, `target_areas`) is documented in `docs/contracts/governance/task-governance-signals.md`; an unreadable input degrades to `reason_code: planning-context-unreadable` rather than a clean lightweight result.

Classify the work into one of these plan depths:

- **Lightweight** - small, well-bounded, low ambiguity
- **Standard** - normal feature or bounded refactor with some technical decisions to document
- **Deep** - cross-cutting, strategic, high-risk, or highly ambiguous implementation work

Enterprise high-risk triggers are an advisory signal toward `Standard` or `Deep` (money, security/permissions/audit, privacy/personal-data flow, migration/DDL, high concurrency, async/MQ, state machines, scheduled jobs, rollout, data/ML consistency, etc. — the full trigger matrix lives only in `skills/spec-plan/references/enterprise-plan-review.md`). When a trigger is present, read `skills/spec-plan/references/enterprise-plan-review.md` before finalizing section depth, deepening targets, appendices, or handoff blockers. The LLM still decides final depth; no helper or script may force `Deep` on its own.

Confirm the helper candidate or explicitly override it with a short reason, for example: "Using Standard despite candidate lightweight because the request touches a public CLI contract." If the helper is unavailable, continue with direct evidence and record `task-governance-signals unavailable` as degraded advisory evidence rather than inventing candidate facts.

When the helper signal exposes a governance miss worth observing, the LLM may record a small advisory shadow hit after the planning decision is made:

```bash
spec-first internal rule-maturity record --rule-id planning-depth-underclassified --workflow spec-plan --evidence-ref <durable-plan-or-review-ref> --reason-code <reason-code> --json
```

Use `rule_id` as `lens-family + problem-class` kebab-case, include `similar_existing_rule_ids` in any handoff prose when known, and keep `evidence_ref` durable and repo-readable. If `rule-maturity record` is unavailable or rejected, record the degraded posture and continue; this observation is not a planning gate and does not adjudicate or promote a rule.

If depth is unclear, ask one targeted question and then continue.

### 0.7 Solo-Mode Scope Summary

**STOP. Before composing the synthesis, read `skills/spec-plan/references/synthesis-summary.md`.** The discipline rules, prose-summary requirement, three-bucket structure, anti-pattern guidance, soft-cut behavior, self-redirect support, solo-variant content focus, and routing into plan sections all live there.

Surface a synthesis to the user after the brief Phase 0.4 bootstrap and before Phase 1 research begins. This protects against spending research and sub-agent attention on the wrong scope.

Fires only when all guards are true:

- Phase 0.2 found no upstream brainstorm doc
- Phase 0.4 stayed in `spec-plan` rather than routing to debug, work, or universal planning
- Phase 0.5 cleared without unresolved blockers
- The run is not on a Phase 0.1 fast path such as resume-normal or deepen-intent

Skip Phase 0.7 for brainstorm-sourced invocations; those use Phase 5.1.5 after research. In headless mode, compose the synthesis but do not ask for confirmation. Continue to Phase 1 research, then route inferred bets to `## Assumptions` at plan-write time.

## Phase 1: Gather Context

### 1.1 Local Research (Always Runs)

Prepare a concise planning context summary (a paragraph or two) to pass as input to the research agents:

- If an origin document exists, summarize the problem frame, requirements, and key decisions from that document
- Otherwise use the feature description directly

Planning research agents are read-only. Use the active host's agent-dispatch primitive only when host capability exists and dispatch authorization is present for this run. In Codex, a public `$spec-plan` invocation authorizes the workflow itself; it does not by itself authorize `spawn_agent`. If the user did not explicitly request subagents, delegation, parallel research, or research-agent dispatch, use the inline fallback and record `dispatch_authorization_missing`. When dispatch is authorized, omit permission-mode overrides and keep dispatch bounded to the named research agents below.

If dispatch is unavailable, explicitly disabled, unauthorized, or fails for a non-capacity reason, run the same research sequentially in the current agent by reading the corresponding agent profile and applying it inline as an explicit fallback. Plan generation must still complete when research dispatch is unavailable; dispatch improves latency and context separation, not correctness.

### Implementation Worker Suitability Gate

Planning may recommend later worker delegation, but it must not dispatch implementation workers or create a hidden implement/check lifecycle. A worker is suitable only when the scope is clear, the write set can be bounded, verification commands are known, no product/architecture blocker remains, and no sensitive/security-critical ambiguity is unresolved. If any condition is missing, keep the task local to `spec-work`, return to planning, or require a smaller task pack slice. Review autofix and mutation are off unless a documented workflow mode or explicit user choice authorizes them.

Dispatch these read-only research agents in parallel when available, or run the explicit sequential/inline fallback:

- `spec-repo-research-analyst` — Scope: technology, architecture, patterns. Input: `{planning context summary}`.
- `spec-learnings-researcher` — Input: `{planning context summary}`.

Collect:

- Technology stack and versions
- Architectural patterns and conventions to follow
- Implementation patterns, relevant files, modules, and tests
- Already-loaded project guidance that materially affects the plan; read `AGENTS.md` / `CLAUDE.md` source only when the Host Instruction Reuse Policy allows it, and pass only the relevant compact summary to research agents
- Institutional learnings from `docs/solutions/`

**Slack context** (opt-in) — never auto-dispatch. Route by condition:

- **Tools available + user asked**: Dispatch `spec-slack-researcher` with the planning context summary in parallel with other Phase 1.1 agents. If the origin document has a Slack context section, pass it verbatim so the researcher focuses on gaps. Include findings in consolidation.
- **Tools available + user didn't ask**: Note in output: "Slack tools detected. Ask me to search Slack for organizational context at any point, or include it in your next prompt."
- **No tools + user asked**: Note in output: "Slack context was requested but no Slack tools are available. Install and authenticate the Slack plugin to enable organizational context search."

### 1.1a Direct Evidence Readiness

If the current cwd is a non-Git parent workspace that contains child Git repos, first resolve the intended project target. A single-repo plan must name a top-level `target_repo` using the workspace-relative child path before writing repo-specific requirements or implementation units. A cross-repo plan must name `target_repo` per implementation unit instead of implying workspace-wide write scope. If no active repo or explicit cross-repo scope is available, ask the user to choose before writing a repo-specific plan; do not let scripts or setup facts choose semantically between child repos.

For code implementation, architecture, API/routes, cross-module, or test strategy plans, collect bounded direct evidence:

- current git status and diff scope when relevant;
- file discovery with `rg --files` and targeted text search with `rg`;
- nearby source files, tests, package manifests, config, and contracts;
- ast-grep structural search when simple text search is too weak;
- test/log output supplied by the user or produced by focused commands.

In the generated plan, follow `skills/spec-plan/references/plan-template.md` for the canonical `## Direct Evidence Readiness` and `## Direct Evidence` sections before `Context & Research`. Do not inline or invent an alternate field contract. The current template requires:

```md
## Direct Evidence Readiness

- target_repo:
- evidence_sources:
- source_refs:
- current_revision:
- worktree_status:
- confidence:
- limitations:

---

## Direct Evidence

- repo_scope:
- source_reads_completed:
- source_reads_required:
- commands_or_tools_used:
- impact_on_plan:
- key_findings:
- limitations:
```

Use this block to disclose what was actually read or verified. Do not claim repository-wide impact coverage from a narrow search. Do not add hidden pre-facts or external-tool evidence envelopes.

### 1.1b Detect Execution Posture Signals

Decide whether the plan should carry a lightweight execution posture signal.

Look for signals such as:

- The user explicitly asks for TDD, test-first, or characterization-first work
- The origin document calls for test-first implementation or exploratory hardening of legacy code
- Local research shows the target area is legacy, weakly tested, or historically fragile, suggesting characterization coverage before changing behavior

When the signal is clear, carry it forward silently in the relevant implementation units.

Ask the user only if the posture would materially change sequencing or risk and cannot be responsibly inferred.

### 1.1c Existing Capability / Reuse Analysis Trigger

When the emerging plan proposes a new file, reference, agent, skill, script, helper, template, workflow, schema, artifact contract, source-of-truth entry, or source/runtime projection surface, read `skills/spec-plan/references/reuse-analysis.md` and record the smallest useful `reuse / extend / new` decision.

The result should stay right-sized:

- Small and medium plans can carry one `Key Technical Decisions` entry or a `Reuse decision:` bullet inside the relevant Implementation Unit `Approach`.
- Deep plans or plans with several new surfaces may use an optional `## Existing Capability / Reuse Analysis` section.
- Lightweight plans, single-line prose fixes, changelog-only updates, and single existing-file edits do not need a long reuse matrix.

The lens decides ownership fit, not business priority. Scripts may verify that the reference exists and that required anchors are present; they must not decide semantic justification for a new surface.

### 1.2 Decide on External Research

Based on the origin document, user signals, and local findings, decide whether external research adds value.

Pay attention to signals from the conversation so far:

- **User familiarity** — Are they pointing to specific files or patterns? They likely know the codebase well.
- **User intent** — Do they want speed or thoroughness? Exploration or execution?
- **Topic risk** — Security, payments, external APIs warrant more caution regardless of user signals.
- **Uncertainty level** — Is the approach clear or still open-ended?

Use the spec-repo-research-analyst technology context to make sharper external research decisions:

- If specific frameworks and versions were detected, pass those exact identifiers to spec-framework-docs-researcher so it fetches version-specific documentation
- If the feature touches a technology layer the scan found well-established in the repo, lean toward skipping external research
- If the feature touches a technology layer the scan found absent or thin, lean toward external research
- If the scan detected deployment infrastructure, note it in downstream planning context
- If the scan detected a monorepo and scoped to a specific service, pass that service's tech context to downstream research agents

Always lean toward external research when:

- The topic is high-risk: security, payments, privacy, external APIs, migrations, compliance
- The codebase lacks relevant local patterns, fewer than 3 direct examples of the pattern this plan needs
- Local patterns exist for an adjacent domain but not the exact one
- The user is exploring unfamiliar territory
- The technology scan found the relevant layer absent or thin in the codebase

Skip external research when:

- The codebase already shows a strong local pattern
- The user already knows the intended shape
- Additional external context would add little practical value
- The technology scan found the relevant layer well-established with existing examples to follow

Announce the decision briefly before continuing.

### 1.3 External Research (Conditional)

If Step 1.2 indicates external research is useful, dispatch these read-only agents in parallel when available, or run them sequentially/inline in the current agent as the explicit fallback:

- `spec-best-practices-researcher` — Input: `{planning context summary}`.
- `spec-framework-docs-researcher` — Input: `{planning context summary}`.

### 1.4 Consolidate Research

Summarize:

- Relevant codebase patterns and file paths
- Relevant institutional learnings
- Organizational context from Slack conversations, if gathered
- External references and best practices, if gathered
- Related issues, PRs, or prior art
- Any constraints that should materially shape the plan

### 1.4b Reclassify Depth When Research Reveals External Contract Surfaces

If the current classification is **Lightweight** and Phase 1 research found that the work touches any of these external contract surfaces, reclassify to **Standard**:

- Environment variables consumed by external systems, CI, or other repositories
- Exported public APIs, CLI flags, or command-line interface contracts
- CI/CD configuration files (`.github/workflows/`, `Dockerfile`, deployment scripts)
- Shared types or interfaces imported by downstream consumers
- Documentation referenced by external URLs or linked from other systems

This ensures flow analysis (Phase 1.5) runs and the confidence-first check (Phase 5.3) applies critical-section bonuses. Announce the reclassification briefly and include whether it confirms or overrides the Phase 0.6 `candidate_level`.

### 1.5 Flow and Edge-Case Analysis (Conditional)

For **Standard** or **Deep** plans, or when user flow completeness is still unclear, dispatch the read-only flow analyzer when available, or run the same analysis sequentially/inline in the current agent as the explicit fallback:

- `spec-spec-flow-analyzer` — Input: `{planning context summary, research findings}`.

Use the output to:

- Identify missing edge cases, state transitions, or handoff gaps
- Tighten requirements trace or verification strategy
- Add only the flow details that materially improve the plan
