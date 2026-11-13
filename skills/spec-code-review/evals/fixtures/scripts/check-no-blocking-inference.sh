#!/bin/bash
# 断言:模糊输入下完成审查而非阻断提问——输出含完成锚
# (Coverage/verdict/发现),不含索取输入话术,长度呈完整报告形态。
set -euo pipefail
message="${EVAL_FINAL_MESSAGE:-}"
[[ -z "$message" ]] && { echo '最终输出为空'; exit 1; }
# 完成锚:审查产物语义
if ! python3 - "$message" <<'PYEOF'
import sys
text = sys.argv[1]
done_words = ('Coverage', 'coverage', '覆盖', 'verdict', '结论', 'findings',
              '发现', 'review', '审查')
blocking = ('请提供', '请告诉我', '请补充', '请确认', 'please provide',
            'please confirm', '请给出 base', '请指定')
has_done = any(w in text for w in done_words)
has_blocking = any(w in text for w in blocking)
ok = has_done and not has_blocking and len(text) >= 300
sys.exit(0 if ok else 1)
PYEOF
then echo '输出未呈现完整审查(或含阻断提问/过短)'; exit 1; fi
# 只读锚:minor-refactor.patch 的 diff 仍待审(未被回滚/提交)
if git rev-parse --git-dir >/dev/null 2>&1; then
  if [[ -z "$(git status --porcelain 2>/dev/null)" ]]; then
    echo '工作区变干净——待审改动被回滚或提交'
    exit 1
  fi
  n=$(git rev-list --count HEAD 2>/dev/null || echo 1)
  [[ "$n" -le 1 ]] || { echo "产生了新提交(count=$n)"; exit 1; }
fi
exit 0
