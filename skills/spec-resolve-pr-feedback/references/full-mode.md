# Full Mode

Read this reference when Mode Detection in `SKILL.md` routes to **Full Mode**: no argument, a PR number, a whole-PR URL, or a top-level `#issuecomment-` URL. Full mode processes all unresolved threads and actionable PR-level feedback on the selected PR.

## 1. Fetch Unresolved Threads

First resolve the selected repository's host and OWNER/REPO from its URL or remote. Set `GH_HOST` to that exact host for every `gh` and bundled-helper call, and pass OWNER/REPO explicitly to helpers when the checkout differs from the selected repository. Confirm access with `gh repo view` for that repository before fetching; follow the entrypoint's unsupported-forge boundary on failure.

If no PR number was provided, detect from the current branch:
```bash
gh pr view --repo OWNER/REPO --json number -q .number
```

Then fetch all feedback using the GraphQL script at [../scripts/get-pr-comments](../scripts/get-pr-comments). Resolve the script through the loaded skill directory so repo-root execution and installed runtime execution both work:

```bash
SKILL_DIR="<absolute path of the directory containing this SKILL.md>"
bash "$SKILL_DIR/scripts/get-pr-comments" PR_NUMBER OWNER/REPO
```

Returns a JSON object with these keys:

| Key | Contents | Has file/line? | Resolvable? |
|-----|----------|---------------|-------------|
| `pending_review` | Viewer-owned unsubmitted review id, or null; a non-null value blocks replies because GitHub may hide them in the draft | No | No |
| `review_threads` | Unresolved inline threads as `{ node, root_comment_id }`; the node retains GraphQL thread identity and `isOutdated`, while the numeric root ID addresses REST replies. A null root ID requires lookup before replying | Yes | Yes (GraphQL) |
| `pr_comments` | Top-level PR conversation comments with non-empty bodies | No | No |
| `review_bodies` | Review submission bodies with non-empty text | No | No |
| `pr_author` / `viewer` | The PR author and acting account, used as evidence during semantic judgment | No | No |
| `fetch_warnings` | Deterministic warnings such as truncated nested thread comments; these mean missing nested comments are incomplete evidence, not confirmed absence | No | No |

When `pending_review` is non-null, stop before the reply loop. Do not interpret
a successful reply mutation as visible reviewer communication. In standalone
mode, surface the draft-review blocker; in `mode:pipeline-return`, record
`pending-review-visible-reply-blocked` and return to the caller.

If the script fails, fall back to:
```bash
gh pr view PR_NUMBER --repo OWNER/REPO --json reviews,comments
gh api --paginate repos/OWNER/REPO/pulls/PR_NUMBER/comments
```

## 2. Triage: Separate New from Pending

Before processing, reconcile visible submitted replies and authoritative resolution independently.

When recovering or retrying, previous records provide only observations awaiting verification and do not override the current GitHub status. Reconfirm the selected host, base repository, PR number, actual head repository/ref, and source ID; verify the original body along with related discussions and current code. Even if the original comment body remains unchanged, subsequent discussions or code changes may render the old reply obsolete. Deprecated or identity-unknown old actions remain pending, returning evidence of changes for reevaluation; do not directly publish old content, redo fixes, or reopen a resolved thread.

**Review threads**: Ordinary completion requires a visible, submitted substantive reply plus authoritative thread resolution. A reply explicitly deferring a human decision remains **pending decision**: leave the thread open and do not repeat the work. A completed-fix or reply verdict already posted on an open thread is **resolution-pending**: do not repost or reapply the fix; carry the existing reply IDs to step 7 to verify and complete only resolution. With no substantive response, the thread is **new**. An incomplete fetch or unknown submission state does not prove either condition; inspect the missing evidence before acting.

**PR comments and review bodies**: These have no resolve mechanism, so they reappear on every run. Apply two filters in order:

1. **Actionability**: An item is an open request to fix, answer, or decide. This judgment is content-aware and includes the PR author's own request; identity never makes feedback disappear. A reply already posted by this run or an earlier run is evidence of handling, not a fresh request. Review wrappers, approvals, status badges, and CI summaries with no follow-up ask are non-actionable and dropped from the count.
2. **Already replied**: For actionable items, check the PR conversation for an existing reply that quotes and addresses the feedback. If a reply already exists, skip. If not, it is new.

The distinction is about content, not who posted it. A deferral from a teammate, a previous skill run, or a manual reply all count. Similarly, actionability is about content: bot feedback that requests a specific code change is actionable; a bot's boilerplate header wrapping those requests is not.

**Silent drop.** Non-actionable items are dropped without narration. Do not announce, list, or count dropped items in conversation, the task list, or the step 9 summary. Review-bot wrappers from CodeRabbit, Codex, Gemini Code Assist, and Copilot commonly appear here; recognize them by their boilerplate content and drop them silently. The fetch layer excludes only blank bodies; content, identity, and surface remain semantic evidence for this step.

If `fetch_warnings` reports `thread_comments_truncated`, do not treat a missing nested comment as confirmed absence. Fetch the missing conversation evidence before posting or resolving that source. A limitation in a new reply cannot establish that a previous reply is absent. Independent sources with complete evidence may continue.

If there are no new or resolution-pending items, skip steps 3-8 and go straight to step 9. If only resolution-pending threads remain, skip steps 3-6 and go to step 7; do not repeat judgment, fixes, validation, commits, or replies.

## 3. Judge And Plan

Read [evaluation-rubric.md](evaluation-rubric.md) now and apply it across the whole batch before any resolver dispatch. This is the legitimacy gate. The orchestrator holds every new thread, actionable PR comment, and actionable review body at once, so it can dedup reads by file, catch repeated bad assumptions, and separate items that need code from items that only need a reply or human decision. When a `trajectory` is present, apply the non-convergence check in [pipeline-mode.md](pipeline-mode.md) before dispatching fixes.

If the batch is large enough that judging every item inline would overflow context, process the central judgment in file-clustered groups of about 8-10 items and emit the three lists incrementally. Do not fan out the judgment to resolver agents to save context; batch the central judgment instead.

Create a task list of all **new** unresolved items grouped by verdict and type:

- `fix-list`: code changes requested, style/convention fixes, test additions, and other valid fixes
- `reply-list`: `replied`, `not-addressing`, and `declined` items with reply text already composed from source evidence
- `human-list`: `needs-human` items with `decision_context`

Create one task entry per new unresolved review thread, actionable PR comment, or actionable review body. Already resolved threads are not returned by `get-pr-comments` and are not dispatch inputs.

When merging fixes with the same invariant according to rubric, the task retains all source inputs; the implementation unit lists each exact location along with the corresponding feedback ID/type/original text. It only merges implementation, not feedback identities or individual results.

## 4. Implement

Process all three feedback types. Review threads are the primary type; PR comments and review bodies are secondary but must not be ignored. Dispatch or sequential mutation applies only to items in `fix-list`; `reply-list` and `human-list` are carried to Step 7 without code mutation.

Apply SKILL.md Exit Authority Admission first. Only `local_fix_authorization: authorized` permits implementing the `fix-list`. Otherwise retain the complete list and source evidence; skip those items' edits, fix validation, commit, push, and replies/resolution that depend on a remote fix. Independent `reply-list` / `human-list` items without code dependencies may proceed with their respective reply/resolution authorities; neither implies the other.

### Mutating resolver dispatch boundary

Implement location selected based on actual benefit: During the judgment phase, prioritize inline fixes for individual code item repairs after reading the relevant code, to avoid redundant context passing. Delegation should only be considered for batches that are truly non-overlapping, or for tasks requiring deep implementation across multiple call points; the availability of a worker is not a reason for delegation. Inline and delegation use the same step-by-step input, result fields, and validation obligations.

Resolver dispatch is mutating-sensitive. Apply the package-local boundary in `SKILL.md`: dispatch only when `local_fix_authorization: authorized`, `worker_dispatch_authorization: authorized`, and `worker_dispatch_capability: available` are recorded. Otherwise apply authorized local fixes sequentially inline and retain the matching reason code. Without local-fix authority, do not mutate.

Each resolver may edit only the files needed for its assigned feedback item and must return the actual `files_changed` list. The orchestrator owns final integration: combined validation, staging, commits, pushes, PR replies, and thread resolution. Resolver agents must not stage files, create commits, push, reply, or resolve review threads directly.

Before mutation, capture a pre-dispatch baseline of tracked, staged, and task-owned untracked state, including file contents/identity sufficient to distinguish existing user work from this run's changes. Give each resolver its owned scope; do not reset, stash, or absorb unrelated changes to make attribution easier.

The pre-dispatch baseline is also used for inline: captured prior to the first local modification, with actual deltas retained per feedback; baselines or Step 5 reconciliation must not be omitted merely because the worker has not been started.

If dispatch is unauthorized, unavailable, or mutation would be unsafe, process dispatch units sequentially in the current agent. If file overlap or discovered collisions make parallel mutation unsafe, serialize the affected units or stop for orchestration instead of running shared-file fixes in parallel.

### Dispatch inputs

Only `fix-list` items from new review threads, actionable PR comments, and actionable review bodies are dispatch inputs. Resolved threads are not returned by `get-pr-comments`; do not act on them again. An already replied open thread is not a fix/dispatch input: reconcile it as pending decision or resolution-pending and complete only its unsatisfied authorized condition.

### Individual dispatch

For review threads in `fix-list`, read `references/agents/pr-comment-resolver.md`. When the package-local boundary permits dispatch, seed one generic subagent with that prompt for each approved fix; otherwise apply the same prompt contract inline and serially.

Each agent receives:

- The thread ID
- The file path and location fields: `line`, `originalLine`, `startLine`, `originalStartLine`
- The full comment text
- The PR number
- The feedback type: `review_thread`
- The `isOutdated` flag from the thread node

The same repair unit simultaneously inputs all enumeration positions and feedbacks its identity; the mutation scope is this enumeration set. Return the following single-level structure, generating one result for each feedback ID, separately retaining the validation and incomplete conditions. Do not return only the first one; do not secretly add newly discovered semantic positions to this unit.

For PR comments and review bodies in `fix-list`, use the same conditional path. A dispatched resolver receives the comment ID, body text, PR number, and feedback type: `pr_comment` or `review_body`; inline handling uses the same inputs. The resolver must identify the relevant files from the comment text and the PR diff.

### Agent return format

Each agent returns the following fields; the inline implementation also returns the same results for each feedback record:

- **verdict**: `fixed`, `fixed-differently`, or `blocked`
- **feedback_id**: the thread ID or comment ID it handled
- **feedback_type**: `review_thread`, `pr_comment`, or `review_body`
- **reply_text**: the markdown reply to post; omit for `blocked`
- **files_changed**: actual remaining modified paths relative to the pre-dispatch baseline, including blocked returns; empty only when no resolver-owned changes remain
- **verification**: targeted checks actually run, their status and evidence, or a concrete not-run reason
- **reason**: what was done, or the concrete contradiction for `blocked`

Verdict meanings:

- `fixed` -- code change made as requested
- `fixed-differently` -- code change made, but with a better approach than suggested
- `blocked` -- implementation surfaced a concrete contradiction the resolver could see, such as a caller/test breakage or code that is not what the finding described

Handling `blocked`: re-evaluate the item in the orchestrator context with the returned evidence. Either re-dispatch with a corrected instruction, move it to `reply-list` as `not-addressing` or `declined`, or move it to `human-list`. Do not silently drop blocked items.

A blocked verdict does not erase a partial edit. Preserve its actual remaining diff and failed/not-run verification; do not treat it as a verified fix or publish a repaired-remote reply. Any rollback must be limited to that resolver's own changes and verified against the baseline, preserving user and other workers' edits.

### Batching and conflict avoidance

Only when the above choices indeed yield dispatch benefits, and dispatch is authorized, capable, and sufficiently isolated for concurrent mutation, the 1–4 dispatch units may run in parallel; for 5 or more, they are processed in batches of 4. Otherwise run all units serially inline.

No two dispatch units that touch the same file should run in parallel. Before dispatching, check for file overlaps across items. If two items reference the same file, serialize those units. Non-overlapping units can still run in parallel. Platforms without parallel dispatch should run units sequentially.

Similar fixes participate in overlap checking based on all enumerated positions, not just the initially commented files.

Fixes can expand beyond the referenced file. Step 5 catches cross-agent test breakage, and step 8 catches unresolved threads. If either surfaces inconsistent changes from parallel fixes, rerun the affected agents sequentially.

## 5. Validate Combined State

After all agents have completed (or all inline implementations have ended), aggregate `files_changed` across every returned summary, including blocked returns, and independently inspect the actual tracked, staged, and task-owned untracked states against the pre-dispatch baseline. Reconcile the observed delta with each resolver's ownership and summary. An empty summary alone never skips validation. Skip code validation and step 6 only when the observed delta and all summaries agree that no run-owned changes remain. If attribution or the baseline is unavailable, keep the result partial/blocked; do not stage or publish uncertain changes.

Validate only the local fixes actually authorized and applied in this run. Read-only triage or a pending `fix-list` is not a verified fix.

Resolvers run only targeted tests on their own changes. This step runs the project's full validation once against the combined diff.

1. Run the project's validation command.
2. Green -> proceed to step 6.
3. Red -> investigate the failing behavior and its dependencies; shared-module changes can break unchanged consumers. File membership does not establish cause or pre-existence. Apply an in-scope correction only when supported, then re-run validation.
4. Classify a failure as pre-existing only with a captured pre-fix baseline using the same command and comparable environment, or equivalent verifiable causal evidence. Record the source identity, command, environment differences, and matching failure. Do not reset or stash the user's tree to manufacture a baseline. Unknown attribution remains failed: preserve the local diff, report the unresolved failure, and do not proceed to commit or push.
5. A confirmed pre-existing failure is still failed; it does not waive required verification. While a required check remains red, do not proceed to commit or push or claim a verified fix. Return the evidence and exact remaining condition to the caller; a commit footer is not a substitute for resolving that condition.

Record the validation outcome for the step 9 summary.

## 6. Commit and Push

Commit and push are independent exits: stage/commit only with `commit_authorization: authorized`; push only after commit succeeds and `push_authorization: authorized` is present. Missing authority stops that exit only; preserve verified local state, skip the blocked exits, and continue into Step 7 with the independent, already-authorized, dependency-free actions (pending remote-fix-dependent replies stay pending). Do not claim a fixed thread is repaired remotely or resolve it without the required remote result.

Before staging, inspect the complete index against the pre-dispatch baseline: unrelated staged content or uncertain hunk ownership blocks this exit. Preserve the index and working tree, report the exact collision, and return to Step 9; do not unstage, stash, reset, or include the user's changes to make commit possible. A separate worktree with explicitly scoped transfer is a caller-owned recovery option, not an automatic fallback.

When the index contains only validated run-owned changes (or is empty), stage only the owned paths or hunks reconciled in step 5. A reported filename is not permission to stage an entire mixed file. Re-read the entire staged diff immediately before committing and verify that every hunk is run-owned and validated; any unrelated or unknown delta stops commit and push. Only then commit with a message referencing the PR. Record the resulting commit SHA and inspect its actual diff before pushing; unexpected content blocks push and requires bounded recovery rather than silently rewriting history.

Read and consume the shared push contract from `skills/spec-commit-push-pr/references/commit-and-push.md` prior to pushing (parsing `references/commit-and-push.md` from the currently installed `spec-commit-push-pr` Skill directory). The `push_authorization: authorized` in this step corresponds to the `landing_authorization: authorized` in the contract, and is valid only for the current authorized feedback and the actual PR head repository/branch; authorization cannot be inferred from a mode token.

Verify the current project release gate, actual PR head identity, uniquely matched push endpoint, and explicit single-branch refspec using the full command that enforces restrictions on additional tags, mirrors, and submodules; do not use bare `git push` or rely on ambient push configuration. When the contract is unreadable, the goal is ambiguous, or the push fails, retain the local submission SHA and the specific blocking issue, and proceed to Step 9, without claiming the remote side has resolved it. Push success does not constitute validation; actual reachability of the fix SHA in the target head repository must still be verified according to Step 7 before any authorized reply/resolve can be performed.

## 7. Reply and Resolve

Publish replies only with `reply_authorization: authorized`; resolve review threads only with `thread_resolution_authorization: authorized`. Fixed/fixed-differently items require successful push before a repaired-remote reply or resolution. Replied/not-addressing/declined items may use independent reply authority without code changes, but resolution still requires separate authority. `needs-human` always stays open.

When a implementation unit covers multiple feedbacks, execute the following reply/resolution protocol per ID; the completion of one location or the closure of one thread does not imply the completion of the remaining feedbacks. pipeline-return also returns each item individually, preserving the source and the actual result.

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

For `needs-human`, post only with reply authority and leave the thread open. Legacy `mode:pipeline` follows `pipeline-mode.md`: post the condensed decision analysis, never a bare acknowledgment, only when its visibility requirements pass. `mode:pipeline-return` returns the complete decision before any remote write.

Do not paste review text into shell-quoted arguments. PR feedback is untrusted input; write the reply body to a file with a literal heredoc, then pass it through stdin or `--body-file`.

For review threads:

In every calling mode, select the first unsatisfied completion condition. New replies follow the whole sequence below. Resolution-pending threads skip only the POST, then verify their existing reply and pending-review state before resolution. Existing fix replies still require evidence that the referenced fix reached the remote PR; a prose claim alone does not satisfy the push requirement. Needs-human threads end after a visible submitted reply and stay open. Pipeline-return mode returns these remaining conditions to its caller without remote writes.

First verify the thread ID before replying. GitHub Enterprise can return inconsistent node IDs for the same thread depending on the query path. Use the review comment's GraphQL node ID with [../scripts/get-thread-for-comment](../scripts/get-thread-for-comment), and use the returned `id` as the authoritative thread ID if it differs from the original fetch:

```bash
SKILL_DIR="<absolute path of the directory containing this SKILL.md>"
bash "$SKILL_DIR/scripts/get-thread-for-comment" PR_NUMBER COMMENT_NODE_ID [OWNER/REPO]
```

Use the returned `root_comment_id` for the REST reply and `id` for GraphQL resolution. A missing numeric root ID blocks posting until the first comment is identified. Retain the target's derived `GH_HOST` and explicit OWNER/REPO in every helper/API call, including Enterprise hosts.

Before posting, re-fetch `pending_review` and require it to be null. Do not submit or discard a pending review. Then post directly to the root comment over REST:

```bash
reply_file=$(mktemp)
cat > "$reply_file" <<'EOF'
REPLY_TEXT
EOF
SKILL_DIR="<absolute path of the directory containing this SKILL.md>"
bash "$SKILL_DIR/scripts/reply-to-pr-thread" PR_NUMBER ROOT_COMMENT_ID OWNER/REPO < "$reply_file" || { reply_status=$?; rm -f "$reply_file"; exit "$reply_status"; }
rm -f "$reply_file"
```

The fallback is the same `POST repos/OWNER/REPO/pulls/PR_NUMBER/comments/ROOT_COMMENT_ID/replies` endpoint. Never substitute `addPullRequestReviewThreadReply`, `gh pr review`, or a POST to `/reviews`; these participate in review submission state.

Preserve the returned reply ID and URL even if the helper exits nonzero after posting. It rechecks pending reviews and exits 2 when one appears. Stop without resolving on any error. A failed POST or postflight request can leave the remote outcome unknown: re-fetch and reconcile before retrying; never blindly repeat the POST.

After interruption, first check the current conversation: only if the source identity, reply attribution, actual decoded body, and original content are consistent, and if the reply is visible and has been submitted, may the action be considered completed; retain the observed reply ID/URL even if subsequent permission or resolution checks fail. Non-thread feedback must also be traced to a specific source and cannot be overlooked merely based on a POST acknowledgment or identical wording. Posted replies only supplement unmet authorization conditions and do not perform repeated POST operations.

For the previous fixed/fixed-differently responses, verify that the recorded exact fix SHA is indeed reachable from the current PR head; when using a fork, use the actual head repository, not a checkout of the default remote or the caller's push declaration as a substitute. Verify the `fix_sha...head_sha` as `ahead`/`identical` and merge base as fix SHA using a read-only compare on the selected host. Missing SHA, or unreachable/readable unknown after rebase/squash: keep as pending, do not automatically infer or substitute SHAs. Necessary verification must still be passed; historical failures cannot be automatically waived.

For a code-dependent reply or resolution, obtain read-only publication facts from the loaded package:

```text
node <SKILL_DIR>/scripts/inspect-fix-publication.cjs --host <selected-host> --base-repo <OWNER/REPO> --pr <number> --head-repo <actual-head-OWNER/REPO> --head-ref <actual-head-ref> --fix-sha <actual-fix-commit>
```

Require `verified: true` and preserve the returned head/comparison identity. Missing tools or a nonzero result keeps publication pending. This helper issues GET requests only; it does not prove verification quality, semantic freshness, reply visibility or authorization. Reply-only actions without code dependencies skip this check rather than inventing a fix commit.

Verify that the returned comment URL belongs to the selected host, OWNER/REPO, and PR. Read back the stored reply body and optional review ID:

```bash
gh api repos/OWNER/REPO/pulls/comments/REPLY_COMMENT_ID --jq .body
gh api repos/OWNER/REPO/pulls/comments/REPLY_COMMENT_ID --jq '.pull_request_review_id // empty'
```

The decoded body must preserve the intended Markdown and real line breaks. Literal escaped `\n` or `\n\n` replacing those line breaks blocks resolution. Correct the same comment with a structured body file and PATCH, then re-read it; do not create another reply.

If a review ID is present, verify that its state is not PENDING:

```bash
gh api repos/OWNER/REPO/pulls/PR_NUMBER/reviews/REVIEW_ID --jq .state
```

Re-fetch pending-review state after posting or reconciling an existing reply and before resolving:

```bash
SKILL_DIR="<absolute path of the directory containing this SKILL.md>"
bash "$SKILL_DIR/scripts/get-pr-comments" PR_NUMBER OWNER/REPO
```

Require `pending_review: null`. Missing/failed state evidence, a pending review, or an unsubmitted/invisible reply blocks resolution of every thread in this reply pass. Report the draft but never submit or discard it. After resolution, require the helper's authoritative resolved result; success in only one half does not complete the thread.

Resolve only when `thread_resolution_authorization: authorized`:

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
gh pr comment PR_NUMBER --repo OWNER/REPO --body-file "$reply_file"
rm -f "$reply_file"
```

Include enough quoted context in the reply so the reader can follow which comment is being addressed without scrolling.

## 8. Verify

After actual replies or resolutions, re-fetch feedback. Unauthorized external actions remain `not-run`; a read-only fetch cannot stand in for remote mutation evidence:

```bash
SKILL_DIR="<absolute path of the directory containing this SKILL.md>"
bash "$SKILL_DIR/scripts/get-pr-comments" PR_NUMBER OWNER/REPO
```

The `review_threads` array should be empty except for `needs-human` items.

If new threads remain, check the iteration count for this PR and recurring root:

During cross-call recovery, combine the caller trajectory, the actual diff from the prior review-fix in the current branch, and relevant feedback to verify the iteration; the commit subject serves only as navigation and cannot be used alone to determine that the root cause has been resolved. History is verifiably persistent and does not reset due to new invocations; when verification is not possible, the incomplete history retention constraint is maintained without fabricating rounds or claiming convergence.

- **First or second fix-verify cycle**: Repeat from step 2 for the remaining threads.
- **After the second fix-verify cycle**: Stop looping. Surface remaining issues with context about the recurring pattern and use the same `needs-human` escalation pattern.

PR comments and review bodies have no resolve mechanism, so they will still appear in the output. Verify they were replied to by checking the PR conversation.

## 9. Summary

Present a concise summary of all work done. Group by verdict, one line per item describing what was done, not just where.

Include all five exit authorities, actions actually performed, and actions left `not-run` for missing authority. Count only performed and verified remote actions as Resolved.

```text
Resolved N of M new items on PR #NUMBER:

Fixed (count): [brief description of each fix]
Fixed differently (count): [what was changed and why the approach differed]
Replied (count): [what questions were answered]
Not addressing (count): [what was skipped and why]
Declined (count): [what was declined and the harm cited]

Validation: [one line; disclose whenever an implementation attempt was made, residual local edits remain, or any check ran — include failed/not-run/blocked states verbatim; omit only when no fix was attempted at all]
```

If any item remains `needs-human`, render the complete typed residual under `## Needs your decision`: quoted_feedback, investigation, decision_reason, every option/tradeoff, recommendation when non-null, and every thread_urls link. Return the same objects unchanged to a caller. Include still-current decisions from previous runs; do not report them as resolved or replace their payloads with counts.

In ordinary interactive mode only, a supported question tool may ask about pending decisions together at closeout; use the summary when unavailable. Legacy `mode:pipeline` and `mode:pipeline-return` never ask or wait: return the complete unresolved decisions to the caller after independent authorized work.
