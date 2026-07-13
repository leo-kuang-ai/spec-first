# Parent Artifact Quarantine Contract

`parent-artifact-quarantine.v1` is a setup-owned advisory artifact for parent multi-repo workspaces. It marks repo-local setup artifacts that exist at the parent workspace root, where downstream workflows could otherwise mistake them for current child-repo truth.

The quarantine surface does not include init-owned parent workspace bootstrap artifacts: the parent instruction file, `.gitignore`, `CHANGELOG.md`, selected host runtime/state, or advisory `.spec-first/workspace/*summary.json` files. Those are expected parent-root artifacts. They remain non-authoritative for child repo setup/readiness and become quarantine candidates only when they contain foreign or child-canonical setup facts covered by the supported orphan surface.

## Producer

- Producer：parent-workspace verify/setup 期间统一执行的 `spec-runtime-setup` Node 入口（`scripts/setup.cjs`）
- Artifact path: `.spec-first/workspace/parent-artifact-quarantine.json`
- Topology: `multi-repo-workspace`
- Freshness: generated at verify time
- Authority: advisory evidence only

The producer may write an empty `quarantined_paths[]` list when a parent workspace was scanned and no parent-local pollution was found. Single-repo setup does not write this artifact.

## Schema

```json
{
  "schema_version": "parent-artifact-quarantine.v1",
  "topology": "multi-repo-workspace",
  "advisory": true,
  "authority_level": "advisory",
  "freshness": "generated",
  "generated_at": "2026-05-28T00:00:00Z",
  "generated_by": "spec-runtime-setup",
  "consumers": [
    "spec-first clean --workspace-orphans",
    "LLM workflow degraded-evidence judgment"
  ],
  "quarantined_paths": [
    {
      "path": ".spec-first/config/tool-facts.json",
      "reason_code": "parent-workspace-must-not-have-repo-local-setup-artifact",
      "stale_indicator": "parent-workspace-repo-local-setup-artifact-present",
      "last_generated_at": "2026-05-28T00:00:00Z",
      "fingerprint_origin": "/path/to/child-or-foreign-repo"
    }
  ]
}
```

`path` is always POSIX-style and repo-relative to the parent workspace. Consumers must reject absolute paths, backslashes, and parent traversal.

## Reason Codes

- `foreign-absolute-path-stat-failed`: an embedded absolute path no longer exists and does not live under the current user home.
- `parent-workspace-must-not-have-repo-local-setup-artifact`: repo-local setup facts exist under a parent workspace.
- `repo_root-mismatches-workspace-root`: an embedded `repo_root` path points somewhere other than the parent workspace root.

## Consumers

`spec-first clean --workspace-orphans` is preview-first. Without `--confirm`, it lists `quarantined_paths[]` and must not delete files. `spec-first clean --workspace-orphans --confirm` is the explicit deletion mode for supported workspace orphan targets; it prints the same preview before deleting existing quarantined paths.

Cleanup consumers must reject absolute paths, parent traversal, backslashes, symlink escapes, and paths outside the supported parent-orphan surface (selected `.spec-first/config/*.json`). The quarantine artifact is advisory evidence; successful deletion is proven by the cleanup command result and filesystem state, not by the artifact itself.

LLM workflows may use the artifact as degraded-evidence context when deciding whether parent workspace config facts are trustworthy. They must not treat quarantine as confirmed deletion truth or as child repo readiness truth.

## Failure Mode

If the artifact is missing, unreadable, or has an unknown `schema_version`, cleanup consumers should ask the user to rerun `spec-runtime-setup` from the parent workspace. Setup must warn-and-continue if quarantine writing fails, except when the shared workspace summary path itself is rejected as a symlink escape.
