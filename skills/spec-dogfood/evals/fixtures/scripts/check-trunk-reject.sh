#!/bin/bash
# 断言:trunk 目标无 diff 被拒(不硬跑全应用探索),呈现语义。
set -euo pipefail
message="${EVAL_FINAL_MESSAGE:-}"
[[ -z "$message" ]] && { echo '最终输出为空'; exit 1; }
if ! python3 - "$message" <<'PYEOF'
import sys
text = sys.argv[1]
words = ('diff', '变更', 'trunk', 'main', '无差异', 'nothing', '没有改动', 'reject', '无法')
sys.exit(0 if any(w in text for w in words) else 1)
PYEOF
then echo '输出未呈现 trunk-无-diff 拒绝语义'; exit 1; fi
exit 0
