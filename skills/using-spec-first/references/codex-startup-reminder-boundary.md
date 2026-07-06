# Codex Startup Reminder Boundary

Codex currently uses managed instruction guidance for startup reminders, not a verified deterministic SessionStart hook.

When a top-level Codex orchestrator is about to route into a public `spec-*` workflow and the `spec-first` CLI is available, it may run:

```bash
spec-first startup-reminder --codex
```

This is a read-only best-effort check. Missing CLI, command failure, network failure, empty output, or malformed local state must be ignored and must not block workflow routing.

If the command prints a reminder, surface that reminder and continue routing. Version reminders point to running `spec-first update` in the terminal, where the user decides whether to upgrade; they must not install packages, refresh runtime assets, or restart Codex.

Bounded subagents, leaf reviewers, and worker agents must not run the startup reminder or write reminder cooldown state. They inherit the parent task scope.
