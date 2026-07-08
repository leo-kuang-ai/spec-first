# Multi-Session Awareness

Before substantial work that will write files, optionally check whether other agent sessions are currently active in the same worktree. The check is read-only and uses the opt-in advisory protocol defined in `docs/contracts/sessions/spec-first-session.md`:

```bash
spec-first session list --json
```

If `active_count` is 0 or the command returns "0 active", proceed normally — single-actor mode is the default and this disclosure is not needed.

If `active_count >= 2`, emit one short advisory line in the user-facing response before continuing, naming the count and one concrete next-action choice. Do not block, do not lock, do not auto-defer. The LLM decides whether to proceed in parallel with disclosure or to coordinate. Examples of valid advisory phrasing:

- "另一个 session 正在 work；继续即可，写入冲突会被 `concurrent-write-detected` 兜住，或者用 `spec-worktree` 隔离开。"
- "Detected 2 active sessions in this worktree. Proceeding; consider `spec-first session register` for visibility, or use a separate `spec-worktree` to isolate."

`spec-first session list` returning a non-zero exit, missing binary, missing `.spec-first/sessions/` directory, or an empty list are all equivalent to single-actor mode. Do not derive judgment from the absence of session records — register is opt-in. Do not invent fallback heuristics from `git status --porcelain` external-mtime patterns; that belongs to the writer-side fingerprint detection, not to guide-mode disclosure.

This disclosure is **never** a hard gate. It does not run as part of headless / autofix / programmatic flows where the response shape is fixed. It is also unnecessary when this skill is being invoked from inside a bounded subagent that has already accepted the parent's scope.
