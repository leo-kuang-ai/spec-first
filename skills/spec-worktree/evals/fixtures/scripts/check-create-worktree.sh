#!/bin/bash
# 断言:detect-first 创建链——.worktrees/feat-pagination 存在、worktree 数为 2、
# 主 checkout 仍在 main、.gitignore 含 .worktrees、汇报含 ready/路径。
set -euo pipefail
message="${EVAL_FINAL_MESSAGE:-}"
[[ -z "$message" ]] && { echo '最终输出为空'; exit 1; }
[[ -d .worktrees/feat-pagination ]] || { echo '未创建 .worktrees/feat-pagination'; exit 1; }
n=$(git worktree list 2>/dev/null | wc -l | tr -d ' ')
[[ "$n" -eq 2 ]] || { echo "worktree 数量异常(count=$n,期望 2)"; exit 1; }
branch=$(git branch --show-current 2>/dev/null || echo unknown)
[[ "$branch" == "main" ]] || { echo "主 checkout 分支被切换为 ${branch}"; exit 1; }
grep -q '.worktrees' .gitignore 2>/dev/null || { echo '.gitignore 未补 .worktrees 条目'; exit 1; }
if ! grep -qE 'Worktree ready|\.worktrees/feat-pagination' <<<"$message"; then
  echo '汇报未含 Worktree ready/工作区路径'
  exit 1
fi
exit 0
