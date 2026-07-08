# Targeted Mode

Read this reference when Mode Detection in `SKILL.md` routes to **Targeted Mode**: a specific comment or thread URL was provided. Targeted mode addresses only that thread.

## 1. Extract Thread Context

Parse the URL to extract OWNER, REPO, PR number, and comment REST ID:

```text
https://github.com/OWNER/REPO/pull/NUMBER#discussion_rCOMMENT_ID
```

Get comment details and the GraphQL node ID via REST:

```bash
gh api repos/OWNER/REPO/pulls/comments/COMMENT_ID \
  --jq '{node_id, path, line, body}'
```

Map the comment to its thread ID using [../scripts/get-thread-for-comment](../scripts/get-thread-for-comment). Source commands use the skill source path so repo-root execution works and host transforms can rewrite it if this skill is delivered into a runtime:

```bash
bash skills/spec-resolve-pr-feedback/scripts/get-thread-for-comment PR_NUMBER COMMENT_NODE_ID [OWNER/REPO]
```

The script paginates the top-level `reviewThreads` connection and returns the matching thread with full comment details. If it reports that nested thread comments are truncated, treat the missing target as incomplete evidence rather than confirmed absence.

## 2. Fix, Reply, Resolve

Handle this thread using the same Mutating resolver dispatch boundary as Full Mode. When the host exposes a dispatch primitive, the user has not forbidden delegation, and the single-thread unit is safe to isolate, read `references/agents/pr-comment-resolver.md` and dispatch one generic subagent seeded with that local prompt for the thread. If dispatch is unavailable, explicitly disabled, or unsafe, process the thread sequentially in the current agent.

Pass the same fields full mode does, including `isOutdated` and the location fields: `line`, `originalLine`, `startLine`, `originalStartLine`. Targeted threads can be outdated too and need the same relocation handling.

Then follow the same validate -> commit -> push -> reply -> resolve flow as Full Mode steps 5-7 in [full-mode.md](full-mode.md).
