# Web Research Cache (V15)

Read this when checking the V15 cache before dispatching `web-researcher`, or when appending fresh research to the cache after dispatch. The behavior here is conditional — most invocations either hit the cache or write to it once and move on.

## Cache file shape

```json
[
  {
    "key": {
      "mode": "repo|elsewhere-software|elsewhere-non-software",
      "focus_hint_normalized": "<lowercase, whitespace-collapsed focus hint or empty string>",
      "topic_surface_hash": "<short hash of the user-supplied topic surface>"
    },
    "result": "<web-researcher output as plain text>",
    "ts": "<iso8601>"
  }
]
```

Files live under `<scratch-dir>/web-research-cache.json`, where `<scratch-dir>` is the owner-only run-local directory resolved once in `references/grounding.md` Phase 1. It is never reused by another invocation.

## Reuse check

Before authorized web research, inspect only this run's private scratch directory. Refinements in this invocation may reuse matching entries; never inspect sibling run directories or another invocation's cache:

```bash
SCRATCH_ROOT="<private-scratch-dir-for-this-run>"
find "$SCRATCH_ROOT" -maxdepth 2 -name 'web-research-cache.json' -type f 2>/dev/null
```

`find` exits 0 with empty output when no cache files exist, so the first-run case does not abort the reuse-check step.

Read each matching file. If any entry's `key` matches the current dispatch (same full mode variant — `repo`, `elsewhere-software`, or `elsewhere-non-software` — plus same case-insensitive normalized focus hint plus same topic surface hash), skip the dispatch and pass the cached `result` to the consolidated grounding summary. Mode variants must match exactly: `elsewhere-software` and `elsewhere-non-software` are distinct domains and must not cross-reuse. Note in the summary: "Reusing prior web research from this session — say 're-research' to refresh."

On `re-research` override, delete the matching entry and dispatch fresh.

## Append after fresh dispatch

After a fresh dispatch, append the new result to the current run's cache file at `<scratch-dir>/web-research-cache.json` using the absolute path from Phase 1 (create directory and file if needed). A refinement in this same invocation can reuse it; subsequent invocations cannot.

## Topic surface hash

The topic surface is the user-supplied content the web research is grounded on:
- **Elsewhere modes (`elsewhere-software`, `elsewhere-non-software`):** the user's topic prompt plus any Phase 0.4 intake answers (the actual subject the agent is researching). The two sub-modes are keyed separately — a reclassification between software and non-software for the same topic hash must force a fresh dispatch, since the research domain differs.
- **Repo mode:** the focus hint plus a stable repo discriminator. This keeps the cache key meaningful when focus is empty — refinements in this run may share research, but the key still differentiates repos. A bare basename like `app` or `frontend` is not a reliable source identity. Resolve the discriminator with this fallback chain and hash the result (first 8 hex chars of sha256 is sufficient):
    1. `git remote get-url origin` — stable across machines, correct for collaborators on the same remote.
    2. `git rev-parse --show-toplevel` — absolute repo path; machine-local but always available in a git checkout.
    3. The current working directory's absolute path — last resort when not in a git repo.

Normalize before hashing: lowercase, collapse whitespace. (The repo discriminator hash is computed from the raw command output; only the focus hint and topic text are normalized.)

## Degradation

If this run's cache is unreadable, degrade to no reuse and perform only authorized research. Surface the limitation in the consolidated grounding summary and proceed without reuse rather than inventing a capability the platform may not have.
