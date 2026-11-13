# Modes And Authorization

## Mode Detection

Check the invocation arguments supplied by the current host for the exact `mode:headless` token. Tokens starting with `mode:` are flags, not context — strip only recognized mode tokens while preserving the remainder, quoted paths, and token order before treating it as the brief context hint.

| Mode | When | Behavior |
|------|------|----------|
| **Interactive** (default) | No mode token present | Auto-pick Full vs Lightweight and report the choice; run the Full-mode session-history probe only with explicit restricted-read authorization; prompt for Discoverability Check consent; end with a plain summary (no "What's next?" menu) |
| **Headless** | `mode:headless` in arguments | No blocking questions. Run **Full mode without session history**. Report discoverability gaps without editing instruction files. Skip Phase 2.46 optional candidate enhancement. End with a structured terminal report — no "What's next?" menu. |

Headless mode is intended for automations and skill-to-skill invocation where no human is present to answer questions. The doc itself is identical to what an interactive Full run would produce — classification work (track, category, overlap) follows the same rules and writes nothing extra into the artifact. Once detected, headless mode applies for the entire run.

## Dispatch Authorization Boundary

Before dispatching a repo profiler, research role, session-history synthesizer, semantic validator, or specialized reviewer, record:

```yaml
worker_dispatch_authorization: authorized | missing
capability_probe: not_applicable | attempted | unavailable
worker_dispatch_capability: available | missing | unknown
worker_context_isolation: isolated | inherited | unknown
worker_model_override: supported | unsupported | unknown
worker_bounded_parallelism: supported | unsupported | unknown
```

`workflow invocation does not authorize dispatch`. Full/headless mode, context budget, scratch directories, permission settings, and prompt assets do not grant authorization. Dispatch only when the current user or visible upstream handoff explicitly requests subagents, delegated work, personas, or parallel work. Without authorization, do not probe tool schemas: record `capability_probe: not_applicable`, `worker_dispatch_capability: unknown`, and `dispatch_authorization_missing`; run the same role prompts inline or serially. After authorization, inspect the current-session registry/schema only as `provider_untrusted` evidence. Confirmed absence yields `subagent_capability_missing`; unavailable, incomplete, or ambiguous evidence yields `worker_capability_unproven`; both use the same fallback. Derive isolation, model override, and bounded parallelism only from live facts. Keep dependent gates open when required isolation is unmet; inherit the model when unknown and serialize when parallelism is unknown. Record `worker_dispatch_outcome`. Preserve every role contract in fallback without claiming independent subagent, fresh-context, or parallel coverage. Only the orchestrator may write `docs/solutions/`, `CONCEPTS.md`, instruction files, or any tracked path.

## Execution Strategy

`spec-compound` does not ask the user which mode to run. Mode depends on context budget the agent can observe. Cross-session history is different: reading private session stores is a restricted-read boundary, so the workflow probes it only when the current user or visible upstream handoff explicitly authorizes that read; it never infers authorization from a compound request, Full mode, local file access, or tool availability. Missing authorization skips the probe with `restricted_read_authorization_missing` rather than opening another question. The only interactive prompt in the normal workflow is the Discoverability Check consent, because that one edits a tracked instruction file.

**Mode selection (Full vs Lightweight) — decide it, don't ask it.**

- Default to **Full**: the complete workflow (research, cross-referencing, overlap detection, grounding validation). This is the right choice for essentially every documented learning — its token cost is small next to the engineering work that produced the learning and is dwarfed by the value of a doc that compounds.
- Choose **Lightweight** (single-pass, no subagents — see Lightweight Mode) only when the learning is **low-risk, bounded, source-grounded, and already backed by verification evidence**, and either the session is near its context limit or the fix is trivial enough that cross-referencing would add nothing. Context pressure alone never waives promotion obligations. A learning is high-risk when a wrong or stale claim could materially weaken security/authorization, data integrity, migration/release safety, privacy, compliance, or irreversible mutation boundaries. High-risk learnings use Full mode; if the remaining context cannot support Full mode, leave a handoff or emit `Documentation skipped` instead of writing durable knowledge.
- State the chosen mode and a one-line reason as the first line of the completion output (e.g., "Ran Full mode." / "Ran Lightweight mode — session context was tight."). If Lightweight was the wrong call for the user's taste, re-running is a rare, cheap correction — cheaper than taxing every run with a prompt.

**In headless mode**, skip mode selection entirely and run **Full Mode** with session history disabled (Phase 1 step 4 omitted). Headless does not elevate dispatch authority; when the package-local boundary is not satisfied, proceed through the serial inline Full fallback.

**Session history — an authorization-gated probe in Full mode.** When explicit restricted-read authorization exists, Full mode runs the cheap discovery+metadata probe (Phase 1 step 4) and escalates to extraction+synthesis only when the probe surfaces genuinely relevant candidate sessions. Without that authorization, record `restricted_read_authorization_missing` and continue without session context; do not inspect session roots or tool schemas. Lightweight and headless modes skip session history entirely. There is no standalone `session-history` product surface; this support exists only inside the compounding workflow.

---
