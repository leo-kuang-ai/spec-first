# Dispatch And Host Boundaries

本文件承接 SKILL 主面的 workflow dispatch admission 与 host surface 详细规则。SKILL 主面只保留一个 runtime-safe stub(含被契约测试直接钉死的锚点 + 指针),详细 elaboration 落在本文件。

## Workflow Dispatch Admission

Routing into a public workflow authorizes that workflow to run. It does not by itself override host-level subagent tool contracts. In Codex, call `spawn_agent` only when the current request explicitly asks for subagents, delegated work, parallel agents, persona reviewer dispatch, or when an upstream workflow delegates from an already authorized multi-agent context whose visible parent request or handoff evidence includes explicit subagent/delegation/parallel/persona wording.

Some public workflows prefer multi-persona or research phases when host capability and authorization are both present, for example `spec-doc-review` multi-persona document reviewers, `spec-code-review` reviewer personas, `spec-plan` research agents, and `spec-ideate` grounding or ideation agents. If authorization is absent, use that workflow's documented single-agent/report-only or inline-checklist fallback and record the concrete fallback reason instead of treating the workflow itself as failed.

When Codex fallback is caused by missing dispatch authorization, record `dispatch_authorization_missing` and make the opt-in path user-visible: for multi-persona or subagent review, ask for `subagents`, `personas`, delegated review, or parallel agents in the request.

If the user names `spec-doc-review` or a legacy host spelling in a document-review request, normalize it to the unified `spec-doc-review` workflow when the intent is clearly to run that workflow. Do not invent extra dispatch authorization from normalization; the selected workflow owns reviewer selection, bounded parallelism when authorized, synthesis, artifacts, fallback, and final judgment.

If the user explicitly asks for report-only/no-agents mode, the host lacks a dispatch primitive, the runtime cannot call it, explicit dispatch authorization is absent, or the workflow's own safety boundary is not satisfied, follow that workflow's documented fallback instead of dispatching.

## Host Surface

- Public workflow identifiers use the unified `spec-*` form across hosts.
- Host runtime delivery is an internal projection detail; the user-facing workflow name remains the same `spec-*` entrypoint.
- In Codex, `spec-doc-review` means the document-review workflow. It uses bounded reviewer dispatch only when the current request also satisfies Codex `spawn_agent` authorization; otherwise it follows the documented fallback.
- `using-spec-first` itself is a standalone meta skill, not a `spec-*` workflow entrypoint.
- Internal-only skills remain source/runtime support assets, not menu items. Do not recommend them as public workflow paths.

## Codex Startup Reminder Boundary

Codex currently uses managed instruction guidance for startup reminders, not a verified deterministic SessionStart hook.

When a top-level Codex orchestrator is about to route into a public `spec-*` workflow and the `spec-first` CLI is available, it may run:

```bash
spec-first startup-reminder --codex
```

This is a read-only best-effort check. Missing CLI, command failure, network failure, empty output, or malformed local state must be ignored and must not block workflow routing. Bounded subagents, leaf reviewers, and worker agents must not run the startup reminder. They inherit the parent task scope. For reminder surfacing, version-update wording, and cooldown-state boundaries, read `skills/using-spec-first/references/codex-startup-reminder-boundary.md`.
