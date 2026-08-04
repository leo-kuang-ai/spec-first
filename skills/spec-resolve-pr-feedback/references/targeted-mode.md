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

先应用 `SKILL.md` 的五项 Exit Authority Admission。没有 `local_fix_authorization` 时只做回源判断，不编辑；没有 `reply_authorization` 时不发布回复；没有 `thread_resolution_authorization` 时不 resolve。Commit 与 push 也分别要求自己的 authority，一项授权不得推导另一项。

Handle only `fixed` / `fixed-differently` verdicts through the same Mutating resolver dispatch boundary as Full Mode. First read `references/agents/pr-comment-resolver.md`. Dispatch one generic subagent seeded with it only when `local_fix_authorization: authorized`、`worker_dispatch_authorization: authorized`、`worker_dispatch_capability: available`，并且 single-thread unit 可安全隔离。已有本地修复授权但不能派发时，在当前 agent sequentially 应用同一 resolver prompt 并保留 fallback reason code；没有本地修复授权时保留待执行清单。

Pass the same fields full mode does, including `isOutdated` and the location fields: `line`, `originalLine`, `startLine`, `originalStartLine`. Targeted threads can be outdated too and need the same relocation handling.

For `replied`, `not-addressing`, or `declined`, compose the reply text from the rubric, skip validation/commit/push, then only post when `reply_authorization: authorized` and only resolve when `thread_resolution_authorization: authorized`. For `needs-human`, compose `decision_context`; post only with reply authority, always leave the thread open, and present the decision to the user.

For fix verdicts, follow the same separately authorized validate -> commit -> push -> reply -> resolve flow as Full Mode steps 5-7 in [full-mode.md](full-mode.md). A missing exit authority stops that exit and every downstream claim that depends on it.
