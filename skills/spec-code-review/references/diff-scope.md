# Diff Scope Rules

These rules apply to every reviewer. They define what is "your code to review" versus pre-existing context.

## Scope Discovery

Determine the diff to review using this priority order:

1. **Task-scoped bundle.** When `<task-scope>` is present, use its labeled `FILES`/`DIFF`, exact/cumulative provenance, task-owned untracked additions, and limitations exactly. Do not widen to the full working tree, and do not call a `cumulative-file` patch isolated task work.
2. **User-specified scope.** If the caller passed `BASE:`, `FILES:`, or `DIFF:` markers, use that scope exactly.
3. **Working copy changes.** If there are unstaged or staged changes (`git diff HEAD` is non-empty), review those.
4. **Unpushed commits vs base branch.** If the working copy is clean, review `git diff $(git merge-base HEAD <base>)..HEAD` where `<base>` is the default branch (main or master).

The scope step in the SKILL.md handles discovery and passes you the resolved diff. You do not need to run git commands yourself unless PR scope mode requires it (below).

## Remote scope (`pr-remote` and `branch-remote`)

When the review context includes `<pr-scope-mode>pr-remote</pr-scope-mode>` or `<pr-scope-mode>branch-remote</pr-scope-mode>`, the working tree is **not** the reviewed head. Do **not** use Read/Grep on workspace paths for files in the changed-file list — they may not match the branch or PR under review.

Instead:

- Prefer `git show <remote-head-ref>:<path>` when `<pr-head-ref>` or `<branch-head-ref>` is provided in context.
- Otherwise rely on diff hunks in the provided `<diff>` only.
- Do not treat local workspace contents as evidence for findings on changed files.

## 整文件删除与存活 consumer

从实际审查范围的 name-status/patch 识别整文件删除；不要假设上下文一定提供旧文件正文或 `<deleted-files>` block。只有 finding 需要旧导出或 import-time side effect 时，才用该范围已确认的 `git show <base>:<path>` 读取旧正文。已删除正文不作为待修改代码反复审查。

在被审查的存活树上核对 imports、re-exports、配置、命令入口、文档入口和资源引用，确认删除是否留下可到达的 consumer 或失去 reader 的残留。名称搜索只提供候选，必须读实际 consumer 才能形成 confirmed finding。remote scope 只能使用确认的 reviewed head，不能用当前工作树替代；缺 head/base、无法读 consumer 或 diff 截断时，在 `residual_risks` 明确记录未检查的删除路径及原因，不声称 liveness 已验证。

## Finding Classification Tiers

Every finding you report falls into one of three tiers based on its relationship to the diff:

### Primary (directly changed code)

Lines added or modified in the diff. This is your main focus. Report findings against these lines at full confidence.

### Secondary (immediately surrounding code)

Unchanged code within the same function, method, or block as a changed line. If a change introduces a bug that's only visible by reading the surrounding context, report it -- but note that the issue exists in the interaction between new and existing code.

### Pre-existing (unrelated to this diff)

Issues in unchanged code that the diff didn't touch and doesn't interact with. Mark these as `"pre_existing": true` in your output. They're reported separately and don't count toward the review verdict.

**The rule:** If you'd flag the same issue on an identical diff that didn't include the surrounding file, it's pre-existing. If the diff makes the issue *newly relevant* (e.g., a new caller hits an existing buggy function), it's secondary.
