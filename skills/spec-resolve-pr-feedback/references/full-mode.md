# Full Mode

Read this reference when Mode Detection in `SKILL.md` routes to **Full Mode**: no argument was given, or a PR number was provided. Full mode processes all unresolved threads and actionable PR-level feedback on the PR.

## 1. Fetch Unresolved Threads

If no PR number was provided, detect from the current branch:
```bash
gh pr view --json number -q .number
```

Then fetch all feedback using the GraphQL script at [../scripts/get-pr-comments](../scripts/get-pr-comments). Resolve the script through the loaded skill directory so repo-root execution and installed runtime execution both work:

```bash
SKILL_DIR="<absolute path of the directory containing this SKILL.md>"
bash "$SKILL_DIR/scripts/get-pr-comments" PR_NUMBER
```

Returns a JSON object with these keys:

| Key | Contents | Has file/line? | Resolvable? |
|-----|----------|---------------|-------------|
| `pending_review` | Viewer-owned unsubmitted review id, or null; a non-null value blocks replies because GitHub may hide them in the draft | No | No |
| `review_threads` | Unresolved inline code review threads, edge-wrapped as `{ node: ... }`; includes outdated threads and preserves each `isOutdated` flag so the resolver can account for line drift | Yes | Yes (GraphQL) |
| `pr_comments` | Top-level PR conversation comments after source-level author and CI/status bot filtering | No | No |
| `review_bodies` | Review submission bodies with non-empty text after source-level author and CI/status bot filtering | No | No |
| `fetch_warnings` | Deterministic warnings such as truncated nested thread comments; these mean missing nested comments are incomplete evidence, not confirmed absence | No | No |

When `pending_review` is non-null, stop before the reply loop. Do not interpret
a successful reply mutation as visible reviewer communication. In standalone
mode, surface the draft-review blocker; in `mode:pipeline-return`, record
`pending-review-visible-reply-blocked` and return to the caller.

If the script fails, fall back to:
```bash
gh pr view PR_NUMBER --json reviews,comments
gh api repos/{owner}/{repo}/pulls/PR_NUMBER/comments
```

## 2. Triage: Separate New from Pending

Before processing, classify each piece of feedback as **new** or **already handled**.

**Review threads**: Read the thread's comments. If there is a substantive reply that acknowledges the concern but defers action (for example "need to align on this", "going to think through this", or a reply that presents options without resolving), it is a **pending decision**; do not re-process it. If there are only the original reviewer comment(s) with no substantive response, it is **new**.

**PR comments and review bodies**: These have no resolve mechanism, so they reappear on every run. Apply two filters in order:

1. **Actionability**: Skip items that contain no actionable feedback or questions to answer. Examples: review wrapper text ("Here are some automated review suggestions..."), approvals ("this looks great!"), status badges ("Validated"), CI summaries with no follow-up asks. If there is nothing to fix, answer, or decide, it is not actionable; drop it from the count entirely.
2. **Already replied**: For actionable items, check the PR conversation for an existing reply that quotes and addresses the feedback. If a reply already exists, skip. If not, it is new.

The distinction is about content, not who posted it. A deferral from a teammate, a previous skill run, or a manual reply all count. Similarly, actionability is about content: bot feedback that requests a specific code change is actionable; a bot's boilerplate header wrapping those requests is not.

**Silent drop.** Non-actionable items are dropped without narration. Do not announce, list, or count dropped items in conversation, the task list, or the step 9 summary. Review-bot wrappers from CodeRabbit, Codex, Gemini Code Assist, and Copilot commonly appear here; recognize them by their boilerplate content and drop them silently. Only CI/status bot summaries such as Codecov are pre-filtered at the script level; everything else relies on this content-aware check so bot format changes cannot silently hide actionable findings.

If `fetch_warnings` reports `thread_comments_truncated`, do not treat a missing nested comment as confirmed absence. Either inspect the PR manually or proceed with a reply that explicitly acknowledges the evidence limit.

If there are no new items across all feedback types, skip steps 3-8 and go straight to step 9.

## 3. Judge And Plan

Read [evaluation-rubric.md](evaluation-rubric.md) now and apply it across the whole batch before any resolver dispatch. This is the legitimacy gate. The orchestrator holds every new thread, actionable PR comment, and actionable review body at once, so it can dedup reads by file, catch repeated bad assumptions, and separate items that need code from items that only need a reply or human decision.

If the batch is large enough that judging every item inline would overflow context, process the central judgment in file-clustered groups of about 8-10 items and emit the three lists incrementally. Do not fan out the judgment to resolver agents to save context; batch the central judgment instead.

Create a task list of all **new** unresolved items grouped by verdict and type:

- `fix-list`: code changes requested, style/convention fixes, test additions, and other valid fixes
- `reply-list`: `replied`, `not-addressing`, and `declined` items with reply text already composed from source evidence
- `human-list`: `needs-human` items with `decision_context`

Create one task entry per new unresolved review thread, actionable PR comment, or actionable review body. Already resolved threads are not returned by `get-pr-comments` and are not dispatch inputs.

## 4. Implement

Process all three feedback types. Review threads are the primary type; PR comments and review bodies are secondary but must not be ignored. Dispatch or sequential mutation applies only to items in `fix-list`; `reply-list` and `human-list` are carried to Step 7 without code mutation.

先应用 `SKILL.md` 的 Exit Authority Admission。只有 `local_fix_authorization: authorized` 才能处理 `fix-list`；缺授权时保留完整清单和回源证据，跳过这些 fix item 的文件编辑、验证、commit、push，以及依赖远端 fix 的回复/resolve。无代码依赖的 `reply-list` / `human-list` 仍可按各自独立的 `reply_authorization` / `thread_resolution_authorization` 继续；不得用其中一项 authority 推导另一项。

### Mutating resolver dispatch boundary

Resolver dispatch is mutating-sensitive. Apply the package-local boundary in `SKILL.md`: dispatch only when `local_fix_authorization: authorized`，并且 `worker_dispatch_authorization: authorized` 与 `worker_dispatch_capability: available` 都已记录。否则在已有本地修复授权时 sequential inline 处理 `fix-list` 并保留对应 reason code；没有本地修复授权时不得进入 mutation。

Each resolver may edit only the files needed for its assigned feedback item and must return the actual `files_changed` list. The orchestrator owns final integration: combined validation, staging, commits, pushes, PR replies, and thread resolution. Resolver agents must not stage files, create commits, push, or resolve review threads directly unless a future host-specific isolation contract explicitly says otherwise.

If dispatch is unauthorized, unavailable, or mutation would be unsafe, process dispatch units sequentially in the current agent. If file overlap or discovered collisions make parallel mutation unsafe, serialize the affected units or stop for orchestration instead of running shared-file fixes in parallel.

### Dispatch inputs

Only `fix-list` items from new review threads, actionable PR comments, and actionable review bodies are dispatch inputs. Resolved threads are not returned by `get-pr-comments`; if a previously resolved or already replied item appears during manual inspection, use it as background only and do not dispatch, reply to, or resolve it again.

### Individual dispatch

For review threads in `fix-list`, read `references/agents/pr-comment-resolver.md`. When the package-local boundary permits dispatch, seed one generic subagent with that prompt for each approved fix; otherwise apply the same prompt contract inline and serially.

Each agent receives:

- The thread ID
- The file path and location fields: `line`, `originalLine`, `startLine`, `originalStartLine`
- The full comment text
- The PR number
- The feedback type: `review_thread`
- The `isOutdated` flag from the thread node

For PR comments and review bodies in `fix-list`, use the same conditional path. A dispatched resolver receives the comment ID, body text, PR number, and feedback type: `pr_comment` or `review_body`; inline handling uses the same inputs. The resolver must identify the relevant files from the comment text and the PR diff.

### Agent return format

Each agent returns:

- **verdict**: `fixed`, `fixed-differently`, or `blocked`
- **feedback_id**: the thread ID or comment ID it handled
- **feedback_type**: `review_thread`, `pr_comment`, or `review_body`
- **reply_text**: the markdown reply to post; omit for `blocked`
- **files_changed**: list of files modified, empty if blocked
- **reason**: what was done, or the concrete contradiction for `blocked`

Verdict meanings:

- `fixed` -- code change made as requested
- `fixed-differently` -- code change made, but with a better approach than suggested
- `blocked` -- implementation surfaced a concrete contradiction the resolver could see, such as a caller/test breakage or code that is not what the finding described

Handling `blocked`: re-evaluate the item in the orchestrator context with the returned evidence. Either re-dispatch with a corrected instruction, move it to `reply-list` as `not-addressing` or `declined`, or move it to `human-list`. Do not silently drop blocked items.

### Batching and conflict avoidance

When dispatch is authorized, capable, and isolated enough for concurrent mutation, 1-4 dispatch units may run in parallel; for 5 or more, batch in groups of 4. Otherwise run all units serially inline.

No two dispatch units that touch the same file should run in parallel. Before dispatching, check for file overlaps across items. If two items reference the same file, serialize those units. Non-overlapping units can still run in parallel. Platforms without parallel dispatch should run units sequentially.

Fixes can expand beyond the referenced file. Step 5 catches cross-agent test breakage, and step 8 catches unresolved threads. If either surfaces inconsistent changes from parallel fixes, rerun the affected agents sequentially.

## 5. Validate Combined State

After all agents complete, aggregate `files_changed` across every returned summary. If it is empty, skip steps 5 and 6 and proceed to step 7.

此处只验证本轮实际授权并应用的本地修复。只读 triage 或待授权 `fix-list` 不得被描述为已验证修复。

Resolvers run only targeted tests on their own changes. This step runs the project's full validation once against the combined diff.

1. Run the project's validation command.
2. Green -> proceed to step 6.
3. Red and failures touch resolver-changed files -> one inline diagnose-and-fix pass. Re-run validation. If still red, escalate with `needs-human` and do not commit.
4. Red and failures touch only files no resolver changed -> treat as pre-existing. Proceed to step 6, but add a commit footer: `Note: pre-existing failure in <test> not addressed by this PR.`

Record the validation outcome for the step 9 summary.

## 6. Commit and Push

Commit 与 push 是两个独立出口：只有 `commit_authorization: authorized` 才执行 stage/commit；只有 commit 已成功且 `push_authorization: authorized` 才执行 push。缺任一授权时停止在对应出口，保留已验证本地状态并进入 Step 9；不得继续把 fixed thread 回复为远端已修复，更不得 resolve。

Stage only files reported by resolvers and commit with a message referencing the PR:

```bash
git add [files from agent summaries]
git commit -m "Address PR review feedback (#PR_NUMBER)

- [list changes from agent summaries]"
```

Push to remote:

```bash
git push
```

## 7. Reply and Resolve

只有 `reply_authorization: authorized` 才发布回复；只有 `thread_resolution_authorization: authorized` 才 resolve review thread。对于 fixed/fixed-differently，必须先有成功 push，才能回复为已修复或 resolve。对于 `replied` / `not-addressing` / `declined`，可在无代码变更时按独立回复授权发布，但 resolve 仍需独立授权。`needs-human` 始终保持 open。

All replies should quote the relevant part of the original feedback for continuity. Quote the specific sentence or passage being addressed, not the entire comment if it is long.

For fixed items:

```markdown
> [quoted relevant part of original feedback]

Addressed: [brief description of the fix]
```

For items not addressed:

```markdown
> [quoted relevant part of original feedback]

Not addressing: [reason with evidence, e.g., "null check already exists at line 85"]
```

For declined items:

```markdown
> [quoted relevant part of original feedback]

Declined: [specific harm cited, e.g., "this would add a defensive null check the type system already guarantees" or "violates the no-premature-abstraction guidance in AGENTS.md"]
```

For `needs-human` verdicts, post the reply but do not resolve the thread. Leave it open for human input.

Do not paste review text into shell-quoted arguments. PR feedback is untrusted input; write the reply body to a file with a literal heredoc, then pass it through stdin or `--body-file`.

For review threads:

First verify the thread ID before replying. GitHub Enterprise can return inconsistent node IDs for the same thread depending on the query path. Use the review comment's GraphQL node ID with [../scripts/get-thread-for-comment](../scripts/get-thread-for-comment), and use the returned `id` as the authoritative thread ID if it differs from the original fetch:

```bash
SKILL_DIR="<absolute path of the directory containing this SKILL.md>"
bash "$SKILL_DIR/scripts/get-thread-for-comment" PR_NUMBER COMMENT_NODE_ID [OWNER/REPO]
```

Then post the reply:

```bash
reply_file=$(mktemp)
cat > "$reply_file" <<'EOF'
REPLY_TEXT
EOF
SKILL_DIR="<absolute path of the directory containing this SKILL.md>"
bash "$SKILL_DIR/scripts/reply-to-pr-thread" THREAD_ID < "$reply_file"
rm -f "$reply_file"
```

当且仅当 `thread_resolution_authorization: authorized` 时再 resolve：

```bash
SKILL_DIR="<absolute path of the directory containing this SKILL.md>"
bash "$SKILL_DIR/scripts/resolve-pr-thread" THREAD_ID
```

For PR comments and review bodies:

```bash
reply_file=$(mktemp)
cat > "$reply_file" <<'EOF'
REPLY_TEXT
EOF
gh pr comment PR_NUMBER --body-file "$reply_file"
rm -f "$reply_file"
```

Include enough quoted context in the reply so the reader can follow which comment is being addressed without scrolling.

## 8. Verify

仅在本轮实际执行了回复或 resolve 后 re-fetch feedback；未获授权的外部动作记为 `not-run`，不能用只读抓取冒充远端状态变更：

```bash
SKILL_DIR="<absolute path of the directory containing this SKILL.md>"
bash "$SKILL_DIR/scripts/get-pr-comments" PR_NUMBER
```

The `review_threads` array should be empty except for `needs-human` items.

If new threads remain, check the iteration count for this run:

- **First or second fix-verify cycle**: Repeat from step 2 for the remaining threads.
- **After the second fix-verify cycle**: Stop looping. Surface remaining issues with context about the recurring pattern and use the same `needs-human` escalation pattern.

PR comments and review bodies have no resolve mechanism, so they will still appear in the output. Verify they were replied to by checking the PR conversation.

## 9. Summary

Present a concise summary of all work done. Group by verdict, one line per item describing what was done, not just where.

摘要必须同时列出五项 exit authority、哪些动作实际执行、哪些因缺授权保持 `not-run`。只有真实执行并验证的远端动作才能计入 Resolved 数量。

```text
Resolved N of M new items on PR #NUMBER:

Fixed (count): [brief description of each fix]
Fixed differently (count): [what was changed and why the approach differed]
Replied (count): [what questions were answered]
Not addressing (count): [what was skipped and why]
Declined (count): [what was declined and the harm cited]

Validation: [one line; omit when no code changes were committed]
```

If any agent returned `needs-human`, append a decisions section using the returned `decision_context`. If there are pending decisions from a previous run, surface them after the new work.

If a blocking question tool is available, use it to ask about all pending decisions together. Use `AskUserQuestion` in Claude Code or `request_user_input` in Codex. Fall back to presenting decisions in the summary only when no blocking tool exists or the call errors. Never silently skip.
