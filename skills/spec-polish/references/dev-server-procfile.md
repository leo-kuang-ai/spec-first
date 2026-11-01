# Procfile / Overmind dev-server recipe (auto-detect fallback)

Read only when classification resolves to `procfile` and the startup command is still missing. Preserve selected cwd, environment, and numeric port; use the port resolver only for a missing port. Rails apps with `bin/dev` take precedence over the bare Procfile path (see `dev-server-rails.md`).

## Signature

- `Procfile` or `Procfile.dev` exists at the repo root
- `bin/dev` is **not** present (if it is, use the Rails recipe)

## Start command

Select the actual file first: use an existing `Procfile.dev`; otherwise inspect `Procfile` and confirm that its `web:` command is the intended local development entry. Carry that filename as `selected_procfile` into startup, port probing, and the launch stub. A production-oriented Procfile is not automatic startup authority.

Prefer `overmind` when available — it handles socket files, supports hot-restart per process, and is the community default for multi-process dev:

```bash
overmind start -f "$selected_procfile"
```

Fallback to `foreman` when `overmind` is not installed:

```bash
foreman start -f "$selected_procfile"
```

If both are missing, prompt the user for the start command rather than guessing.

## Port

Default: `3000`. Procfile-based projects list their processes in the selected file, so its `web:` line supplies a port candidate:

```
web: bundle exec puma -p 3000 -C config/puma.rb
worker: bundle exec sidekiq
```

Parse the `web:` line for `-p <n>` or `--port <n>`. If neither is present, fall through to the cascade in `references/dev-server-detection.md`.

## Stub generation

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Overmind dev",
      "runtimeExecutable": "overmind",
      "runtimeArgs": ["start", "-f", "{{selected_procfile}}"],
      "port": 3000
    }
  ]
}
```

Replace `{{selected_procfile}}` with the actual selected filename and `port` with the resolved candidate before writing the stub. Confirm the actual URL from attributed startup and reachability. Substitute `foreman` if `overmind` is unavailable on the user's machine — the stub represents what the user will run, not a canonical recipe.

## Common gotchas

- **Socket files:** Overmind may already own `.overmind.sock`. Reuse the intended attributed instance when possible. Diagnose a stale socket separately; an occupied port does not authorize killing a process or deleting its socket.
- **Procfile vs Procfile.dev:** production and development Procfiles often differ. Always prefer `Procfile.dev` for polish.
- **Multiple web processes:** some Procfiles split web traffic across multiple processes (API + frontend). Polish can only open one URL — users with multi-web setups should author `.claude/launch.json` explicitly to select which process is "the dev server" for polish.
