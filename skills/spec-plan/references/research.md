# Planning Research

At every authorized native dispatch boundary, correct a pre-launch argument rejection once without changing scope or required capabilities. Capacity-limited work stays queued until a slot frees; repeated zero capacity uses the boundary's bounded fallback. Other launch failures follow that boundary's inline or failed-pass handling. Once an agent launches, collect its outcome before retrying; do not duplicate unresolved work. Apply this distinction to later deepening and review dispatches as well.

**Trigger:** Before Phase 1 research, including inline research or authorized worker dispatch.

This reference owns only the phases below. The entrypoint's planning-only, Product Contract, evidence, authorization, and completion boundaries remain in force. Resolve `references/...` paths from the `spec-plan` skill root. If a required source is unavailable, keep its dependent action and claim open.

### Phase 1: Gather Context

All specialist research and deepening prompts used in this phase are skill-local prompt assets under `references/agents/`. Those files are worker seed material, not a mandatory inline dependency. When dispatching one, read the matching file and seed a generic subagent with that prompt content plus the task-specific context below. Under inline fallback, apply the concise scope in this file directly. Do not read a worker prompt asset merely because inline fallback is active; load one only when a positive specialist trigger applies and the concise caller scope lacks criteria needed for the unresolved planning question. Do not dispatch standalone agents by type/name.

**Dispatch authorization and fallback.** A public `spec-plan` invocation authorizes this workflow, not subagents, personas, parallel work, Slack search, web research, or external data access. Before dispatch, record `worker_dispatch_authorization`, `capability_probe`, `worker_dispatch_capability`, `worker_context_isolation`, `worker_model_override`, and `worker_bounded_parallelism`, then normalize the path as `worker_dispatch_outcome`. Missing authorization forbids discovery, fixes `not_applicable + unknown`, and records `dispatch_authorization_missing`. Only after the user or an upstream handoff explicitly authorizes delegation/research dispatch may the current-session registry/schema be inspected as `provider_untrusted` evidence: confirmed absence records `subagent_capability_missing`; unavailable/incomplete/ambiguous discovery records `worker_capability_unproven`. Otherwise use the named scopes below as bounded semantic lenses and apply them inline or serially without emulating a worker. Lack of dispatch changes latency/context separation, not correctness or completion; external/organizational research still requires its independent data-access authorizations.

Model tiering lives in this caller, not in prompt assets. Local prompt files have no frontmatter. Request the mid-tier for external/organizational research prompts such as `slack-researcher` and `web-researcher` only when `worker_model_override: supported`; otherwise omit the override, inherit, and disclose `model_override_unsupported` or `model_override_unknown`. Use inherited model for high-judgment architecture, migration, and planning-deepening prompts unless current-session facts establish a cheaper capable tier.

#### 1.1 Local Research (Always Runs)

Prepare a concise planning context summary (a paragraph or two) to pass as input to the research agents:
- If an origin document exists, summarize the problem frame, requirements, and key decisions from that document
- Otherwise use the feature description directly
- Prefer root `STRATEGY.md`; read legacy `PRODUCT.md` / `VISION.md` only when it is absent or lacks a needed meaning. Include the target problem, approach, active tracks, and boundaries by meaning, without requiring exact headings. Name actual sources and do not override the project's explicit authority.
- If `CONCEPTS.md` exists at repo root, read it as an advisory calibration source for domain entities, named processes, and status concepts. Reuse a term when it fits the Product Contract; when it conflicts with current-user or origin meaning, surface the conflict and preserve the plan-local meaning instead of silently overriding it.

**Resolve current project orientation first.** Derive stack, dependencies, conventions, and structure from the current target repo/worktree for this run. Record current git identity and dirty state, read root plus applicable scoped instructions directly, and carry direct source refs. Never persist or reuse this orientation across runs, branches, or worktrees. Pass it to `repo-research-analyst` so the analyst can focus on question-specific patterns while still confirming any consequential fact against current source. If git or a required source cannot be read, record the concrete degraded fact and narrow the plan's evidence claims; do not substitute a profile from another source identity.

When dispatch is authorized, read and run these prompt assets in parallel. Under inline fallback, apply the same concise scopes sequentially from current source and keep only the strongest source-backed findings; do not preload their full worker prompts:

- `references/agents/repo-research-analyst.md` — scope: **patterns** (the question-specific slice; pass the planning context summary and current-tree orientation, including its source identity and refs).
- `references/agents/learnings-researcher.md` — pass the planning context summary.

**Agent-native planning triage** (conditional) — consider broadly, dispatch selectively. Dispatch a generic subagent with `references/agents/agent-native-planning-strategist.md` in parallel with the local research agents when the request, origin document, or repo research indicates any of:

- agent, assistant, chat, workflow automation, MCP, plugin, skill, tool registry, prompt, or autonomous-loop work
- a codebase with an existing agent surface where this feature changes user-visible capabilities
- a primary domain action that is repetitive, high-volume, complex, naturally language-shaped, or likely to need automation access
- a risk that the plan will widen the gap between UI/API actions and agent-accessible tools or context

Do **not** dispatch for cosmetic, layout-only, animation-only, brand, low-value preference, or narrow work in a product with no agent surface. If the signal is borderline, do not dispatch; carry only a short future parity consideration when it affects a high-value domain action. Include any resulting findings in consolidation as planning inputs, not as a standalone advice appendix.

Collect:
- Exact dependency or runtime versions only when they materially affect the plan or an external research decision
- Architectural patterns and conventions to follow
- Implementation patterns, relevant files, modules, and tests
- AGENTS.md guidance that materially affects the plan, with CLAUDE.md used only as compatibility fallback when present
- Institutional learnings from `docs/solutions/`
- Product strategy context from the sources above: flag plan decisions that pull away from active tracks or the approach, or touch stated boundaries.
- Agent-native planning findings when the conditional triage dispatched: action/context parity decisions, tool/workspace/execution-lifecycle choices, scope boundaries, and verification scenarios

**Slack context** (opt-in) — never auto-dispatch. Route by condition:

- **Tools available + user asked + external research/dispatch authorized**: Dispatch a generic subagent with `references/agents/slack-researcher.md` and the planning context summary in parallel with other Phase 1.1 agents, or apply that prompt inline when the current agent has the authorized Slack capability. If the origin document has a Slack context section, pass it verbatim so the researcher focuses on gaps. Include findings in consolidation.
- **Tools available + user asked but external access or delegation is not authorized**: Do not search. Record the authorization gap and ask only if Slack context is load-bearing to the plan.
- **Tools available + user didn't ask**: Note in output: "Slack tools detected. Ask me to search Slack for organizational context at any point, or include it in your next prompt."
- **No tools + user asked**: Note in output: "Slack context was requested but no Slack tools are available. Install and authenticate the Slack plugin to enable organizational context search."

#### 1.1b Detect Execution Direction Signals

Decide whether the plan should carry a lightweight execution direction signal.

Look for signals such as:
- The user explicitly asks for TDD, test-first, or characterization-first work
- The origin document calls for test-first implementation or exploratory hardening of legacy code
- Local research shows the target area is legacy, weakly tested, or historically fragile, suggesting characterization coverage before changing behavior
- The work is mostly configuration, packaging, UI styling, or environment setup where the right first proof is a smoke/runtime check rather than unit coverage

When the signal is clear, carry it forward silently in the relevant implementation units.

Ask the user only if the direction would materially change sequencing or risk and cannot be responsibly inferred.

#### 1.2 Decide on External Research

Based on the origin document, user signals, and local findings, decide **whether** external research adds value and, if so, **what kind**. Resolve this in three stages: explicit-request priority, intent classification, then the implicit signals below.

**Stage 1 — An explicit request takes precedence.** If the user prompt **or** the origin requirements document explicitly asks for external input — a signal that the answer lives outside the repo, such as competitor/prior-art comparison, "what should we borrow", "from the web", "best practices", "official docs", "alternatives to", a market scan, or naming a specific external technology to consult — external research is **required**, regardless of how strong local patterns look. The list is illustrative; key on the signal, not the exact phrase — any wording that clearly points outside the repo qualifies. The skip conditions below do **not** apply to an explicit request. The only thing that overrides it is an explicit opt-out ("no web research", "skip external research"): honor that, skip, and note it. Improvement or quality verbs ("improve", "make better") carry no external signal on their own and never trigger research by themselves.

**Stage 2 — Classify the research intent** (whenever external research will run, from Stage 1 or the implicit signals below) so Phase 1.3 routes correctly. Use this mechanical test, not a fixed phrase list:
- **Implementation-guidance** — the approach or technology is already settled; the question is *how to build it well* (best practices, version-specific docs, API constraints, known pitfalls, deprecations).
- **Landscape / option-discovery** — the question is *what options or prior art exist* (competitor scans, build-vs-buy, library/provider selection, prior art, market signals, cross-domain analogies).
- **Mixed** — both: discover an unsettled external option set first, then research the shortlisted choice for implementation guidance.

**Stage 3 — Implicit signals** decide the call when no explicit request fired.

**Read between the lines.** Pay attention to signals from the conversation so far:
- **User familiarity** — Are they pointing to specific files or patterns? They likely know the codebase well.
- **User intent** — Do they want speed or thoroughness? Exploration or execution?
- **Topic risk** — Security, payments, external APIs warrant more caution regardless of user signals.
- **Uncertainty level** — Is the approach clear or still open-ended?

**Leverage the repo research prompt's technology context:**

Use this run's current-tree orientation and task-specific repo research as technology context. Read an exact version fresh from its owning manifest when it materially affects the plan or an external research decision:

- If specific frameworks and versions were detected (e.g., Rails 7.2, Next.js 14, Go 1.22), pass those exact identifiers to the `framework-docs-researcher` local prompt so it fetches version-specific documentation
- If the feature touches a technology layer the scan found well-established in the repo (e.g., existing Sidekiq jobs when planning a new background job), lean toward skipping external research -- local patterns are likely sufficient
- If the feature touches a technology layer the scan found absent or thin (e.g., no existing proto files when planning a new gRPC service), lean toward external research -- there are no local patterns to follow
- If the scan detected deployment infrastructure (Docker, K8s, serverless), note it in the planning context passed to downstream agents so they can account for deployment constraints
- If the scan detected a monorepo and scoped to a specific service, pass that service's tech context to downstream research agents -- not the aggregate of all services. If the scan surfaced the workspace map without scoping, use the feature description to identify the relevant service before proceeding with research

**Always lean toward external research when:**
- The topic is high-risk: security, payments, privacy, external APIs, migrations, compliance
- The codebase lacks relevant local patterns -- fewer than 3 direct examples of the pattern this plan needs
- Local patterns exist for an adjacent domain but not the exact one -- e.g., the codebase has HTTP clients but not webhook receivers, or has background jobs but not event-driven pub/sub. Adjacent patterns suggest the team is comfortable with the technology layer but may not know domain-specific pitfalls. When this signal is present, frame the external research query around the domain gap specifically, not the general technology
- The user is exploring unfamiliar territory
- The technology scan found the relevant layer absent or thin in the codebase
- The plan's recommendations depend on a genuinely external, **unsettled** option set — which library, provider, or approach to adopt, or what competitors and prior art do — **even when local implementation patterns are strong** (intent: landscape). Bound this implicit landscape trigger by three gates: (a) the option set genuinely lives outside the repo, (b) the decision materially shapes the plan (a KTD, dependency, or architecture choice — not an incidental detail), and (c) no settled local or team choice already exists. Improvement verbs alone never satisfy this.

**Skip external research when** (only when Stage 1 found no explicit request — an explicit request is never skipped):
- The codebase already shows a strong local pattern -- multiple direct examples (not adjacent-domain), recently touched, following current conventions
- The user already knows the intended shape
- Additional external context would add little practical value
- The technology scan found the relevant layer well-established with existing examples to follow

When an explicit request *did* fire but a settled local or team choice already exists, **narrow the research rather than skipping it** — research the current pitfalls, docs, and practices for the chosen library/pattern instead of re-surveying the whole option set.

Announce the decision and the intent briefly before continuing. Examples:
- "Your codebase has solid patterns for this. Proceeding without external research."
- "This involves payment processing, so I'll research current best practices first (implementation-guidance)."
- "You asked what to borrow from competitors, so I'll run a landscape scan first (landscape/option-discovery)."

#### 1.3 External Research (Conditional)

If Step 1.2 indicates external research is useful, execute it only within the authorization boundary above. When delegation is authorized and the semantic probe yields an eligible candidate, dispatch by the **intent** classified in Stage 2; when external access is authorized but delegation is unavailable, apply the selected prompt inline or serially. If external access itself is not authorized, record the gap and continue only when the missing research is non-blocking. Read the selected prompt asset from `references/agents/`; for `web-researcher.md`, pass a focus hint plus the planning context summary and do **not** pass codebase content.

- **Implementation-guidance** — run in parallel:
  - `references/agents/best-practices-researcher.md` with the planning context summary.
  - `references/agents/framework-docs-researcher.md` with the planning context summary and exact frameworks/versions from Phase 1.1 where available.
- **Landscape / option-discovery** — `references/agents/web-researcher.md` with the focus hint and planning context summary. When the request targets projects on a code host (e.g., "competitors on GitHub"), name the discovery dimensions in the focus hint: project names and URLs, release recency and activity, CLI/UX shape, install path, docs and examples, plugin/extension surfaces, recurring issue themes, and license — treating star counts as a weak signal only.
- **Mixed** — **sequential, not parallel**: run the `web-researcher` local prompt first to map the landscape and produce a shortlist; then run the `framework-docs-researcher` and/or `best-practices-researcher` local prompts against the shortlisted technologies only when their details materially shape the plan.

**Tool-unavailable handling.** `web-researcher` self-checks for web tools and stops if they are missing. Never block on this: if it reports research unavailable, or any researcher fails, warn and proceed, and carry the gap into Phase 1.4 so the plan records it honestly — especially when the user explicitly requested external research, where a silent skip would leave the plan looking evidence-based when it is not.

#### 1.4 Consolidate Research

Summarize:
- Relevant codebase patterns and file paths
- Relevant institutional learnings
- Organizational context from Slack conversations, if gathered (prior discussions, decisions, or domain knowledge relevant to the feature)
- External references, prior art, competitor/landscape findings, and best practices, if gathered
- Related issues, PRs, or prior art
- Any constraints that should materially shape the plan

**Land external findings in decisions, not an appendix.** Any external research that ran must surface where it changes a choice — Key Technical Decisions rationale, Alternatives, Risks, or Sources & Research — not as a detached list with no bearing on the plan. If a finding shaped nothing, it was not load-bearing; do not pad the plan with it.

**Mark whether external research was load-bearing.** Record a single internal flag: did external findings materially shape a KTD, Alternative, Scope boundary, or Risk? This flag answers only that question — it does **not** gate whether research runs (Phase 1.2 owns that decision). Phase 5.3.2 reads it to decide whether to enter a confidence-scoring pass.

**Record requested-but-unavailable.** If the user explicitly requested external research but it could not run (web tools unavailable, researcher failed), state that in the plan as an assumption or open question rather than presenting the plan as externally grounded.

#### 1.4b Reclassify Depth When Research Reveals External Contract Surfaces

If the current classification is **Lightweight** and Phase 1 research found that the work touches any of these external contract surfaces, reclassify to **Standard**:

- Environment variables consumed by external systems, CI, or other repositories
- Exported public APIs, CLI flags, or command-line interface contracts
- CI/CD configuration files (`.github/workflows/`, `Dockerfile`, deployment scripts)
- Shared types or interfaces imported by downstream consumers
- Documentation referenced by external URLs or linked from other systems

This ensures flow analysis (Phase 1.5) runs and the confidence check (Phase 5.3) applies critical-section bonuses. Announce the reclassification briefly: "Reclassifying to Standard — this change touches [environment variables / exported APIs / CI config] with external consumers."

#### 1.5 Flow and Edge-Case Analysis (Conditional)

For **Standard** or **Deep** plans, or when user flow completeness is still unclear, run through authorized dispatch or apply the concise scope below inline. Read the full prompt asset only for authorized dispatch or when the inline analysis exposes a specialized flow question that the concise scope does not cover:

- `references/agents/spec-flow-analyzer.md` with the planning context summary and research findings.

Use the output to:
- Identify missing edge cases, state transitions, or handoff gaps
- Tighten requirements trace or verification strategy
- Add only the flow details that materially improve the plan
