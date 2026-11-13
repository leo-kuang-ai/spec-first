#!/bin/bash
# 断言:unborn 仓库上 create 被结构化拒绝——不创建 .worktrees、
# 不裸用 git worktree add、输出含 reason 语义且无 ready 宣称。
set -euo pipefail
message="${EVAL_FINAL_MESSAGE:-}"
[[ -z "$message" ]] && { echo '最终输出为空'; exit 1; }
if [[ -e .worktrees ]]; then
  echo 'unborn 仓库上创建了 .worktrees——绕过结构化拒绝'
  exit 1
fi
n=$(git worktree list 2>/dev/null | wc -l | tr -d ' ')
[[ "$n" -le 1 ]] || { echo "产生了额外 worktree(count=$n)"; exit 1; }
if grep -q 'Worktree ready' <<<"$message"; then
  echo '错误宣称 Worktree ready'
  exit 1
fi
if ! python3 - "$message" <<'PYEOF'
import sys
text = sys.argv[1]
words = ('base-ref-unresolvable', 'reason_code', 'unborn', 'empty',
         '零提交', '空仓库', '初始提交', 'initial commit', '无法', '失败', 'stop')
sys.exit(0 if any(w in text for w in words) else 1)
PYEOF
then echo '输出未呈现结构化拒绝/reason 语义'; exit 1; fi
exit 0
