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

Map the comment to its thread ID using [../scripts/get-thread-for-comment](../scripts/get-thread-for-comment). Resolve the script through the loaded skill directory so repo-root execution and installed runtime execution both work:

```bash
SKILL_DIR="<absolute path of the directory containing this SKILL.md>"
bash "$SKILL_DIR/scripts/get-thread-for-comment" PR_NUMBER COMMENT_NODE_ID [OWNER/REPO]
```

The script paginates the top-level `reviewThreads` connection and returns the matching thread with full comment details. If it reports that nested thread comments are truncated, treat the missing target as incomplete evidence rather than confirmed absence.

## 2. Fix, Reply, Resolve

Read [evaluation-rubric.md](evaluation-rubric.md) and judge this thread before any resolver dispatch. Account for `isOutdated` and the location fields (`line`, `originalLine`, `startLine`, `originalStartLine`). The cross-item reasoning is mostly inert for a single thread, but the read-depth and divert logic still apply: do not fix on reviewer authority alone.

Handle only `fixed` / `fixed-differently` verdicts through the same Mutating resolver dispatch boundary as Full Mode. First read `references/agents/pr-comment-resolver.md`. Dispatch one generic subagent seeded with it only when `worker_dispatch_authorization: authorized`, `worker_dispatch_capability: available`, and the single-thread unit is safe to isolate. Otherwise apply the same resolver prompt sequentially in the current agent and preserve the matching fallback reason code.

Pass the same fields full mode does, including `isOutdated` and the location fields: `line`, `originalLine`, `startLine`, `originalStartLine`. Targeted threads can be outdated too and need the same relocation handling.

For `replied`, `not-addressing`, or `declined`, compose the reply text from the rubric, skip validation/commit/push, then post the reply and resolve when appropriate. For `needs-human`, compose `decision_context`, post the natural reply text, leave the thread open, and present the decision to the user.

For fix verdicts, follow the same validate -> commit -> push -> reply -> resolve flow as Full Mode steps 5-7 in [full-mode.md](full-mode.md).
