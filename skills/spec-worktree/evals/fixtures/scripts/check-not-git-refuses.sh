#!/bin/bash
# 断言:非 git 目录 fail-closed——不创建 .worktrees,输出含结构化拒绝语义。
set -euo pipefail
message="${EVAL_FINAL_MESSAGE:-}"
[[ -z "$message" ]] && { echo '最终输出为空'; exit 1; }
if [[ -e .worktrees ]]; then
  echo '在非 git 目录创建了 .worktrees——绕过 detect fail-closed'
  exit 1
fi
if ! python3 - "$message" <<'PYEOF'
import sys
text = sys.argv[1]
words = ('not-git-repo', 'reason_code', 'unknown', 'detect', 'state',
         '无法', '失败', 'stopped', 'stop', '未创建', 'not a git')
sys.exit(0 if any(w in text for w in words) else 1)
PYEOF
then echo '输出未呈现结构化拒绝/reason_code 语义'; exit 1; fi
exit 0
